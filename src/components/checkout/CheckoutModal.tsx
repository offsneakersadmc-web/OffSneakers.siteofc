import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, MessageCircle, AlertCircle, Copy, ExternalLink, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, CustomerData, Order, StoreSettings } from '../../types';
import { formatCurrency, formatPhone } from '../../utils/format';
import { storeService } from '../../services/storeService';
import { dispatchOrderEmailNotifications } from '../../services/emailService';
import {
  getAllVersions,
  getCartItemKey,
  getEffectiveVersionDescription,
  getEffectiveVersionSpecs,
} from '../../utils/versionHelper';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  storeSettings: StoreSettings;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  storeSettings,
  onOrderSuccess,
}) => {
  const [customer, setCustomer] = useState<CustomerData>({
    fullName: '',
    phone: '',
    email: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARTAO' | 'OUTRA'>('PIX');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [emailStatusNote, setEmailStatusNote] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => {
    const unit = Number(item.unitPrice ?? item.product.price ?? 0);
    return acc + unit * item.quantity;
  }, 0);
  const pixDiscount = paymentMethod === 'PIX' ? Math.round(subtotal * (storeSettings.pixDiscountPercent / 100)) : 0;
  const total = subtotal - pixDiscount;

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCustomer((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
        }
      } catch {
        // quiet fallback
      }
    }
  };

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    setErrorMessage('');
    if (field === 'cep') {
      handleCepLookup(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Basic field validations
    if (!customer.fullName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    if (customer.phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (!customer.email.includes('@')) {
      setErrorMessage('Informe um e-mail válido para receber o resumo e rastreamento.');
      return;
    }
    if (!customer.street.trim() || !customer.number.trim() || !customer.city.trim() || !customer.state.trim()) {
      setErrorMessage('Por favor, preencha o endereço completo de entrega.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Seu carrinho está vazio.');
      return;
    }

    // 2. Critical Inventory Re-Validation
    const stockCheck = storeService.validateCartStock(cart);
    if (!stockCheck.valid) {
      setErrorMessage(stockCheck.errors.join(' '));
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // 3. Generate unique Order ID
      const orderCount = storeService.getOrders().length + 101;
      const orderId = `#OS-${String(orderCount).padStart(6, '0')}`;

      // 4. Products text for WhatsApp with exact Version & Price Breakdown
      const productsText = cart
        .map((item) => {
          const unit = Number(item.unitPrice ?? item.product.price ?? 0);
          const itemSub = unit * item.quantity;
          const versionTitle = item.editionName || item.versionName || 'Edição Padrão';
          const colorInfo = item.colorName ? ` (${item.colorName})` : '';
          const skuInfo = item.sku ? `\nSKU: ${item.sku}` : '';
          return `${item.product.name}\nVersão: ${versionTitle}${colorInfo}${skuInfo}\nTamanho: ${item.size}\nQuantidade: ${item.quantity}\nPreço unitário: ${formatCurrency(
            unit
          )}\nSubtotal: ${formatCurrency(itemSub)}`;
        })
        .join('\n\n');

      const fullAddress = `${customer.street}, Nº ${customer.number}${
        customer.complement ? ' - ' + customer.complement : ''
      }, Bairro: ${customer.neighborhood}, Cidade: ${customer.city}/${customer.state} - CEP: ${customer.cep}`;

      // 5. Structure official WhatsApp message
      const whatsappMsg =
`NOVO PEDIDO — OFF.SNEAKERSOFC

Pedido: ${orderId}

CLIENTE:
Nome: ${customer.fullName}
Telefone: ${formatPhone(customer.phone)}
E-mail: ${customer.email}

PRODUTOS:

${productsText}

RESUMO FINANCEIRO:
Subtotal: ${formatCurrency(subtotal)}
Desconto: ${formatCurrency(pixDiscount)}
TOTAL: ${formatCurrency(total)}

PAGAMENTO:
Forma escolhida: ${paymentMethod === 'PIX' ? 'PIX (5% OFF)' : paymentMethod === 'CARTAO' ? 'Cartão em até 12x' : 'A Combinar'}

ENTREGA:
Endereço completo: ${fullAddress}

STATUS:
Aguardando atendimento e confirmação do pagamento.

Gostaria de receber as informações para realizar o pagamento e concluir meu pedido.

Obrigado por escolher a OFF.SNEAKERSOFC!`;

      // 6. Assemble Immutable Order Record with full version snapshots
      const newOrder: Order = {
        id: orderId,
        customer,
        items: cart.map((i) => {
          const unit = Number(i.unitPrice ?? i.product.price ?? 0);
          const ver = getAllVersions(i.product).find((v) => v.id === i.versionId);
          return {
            productId: i.product.id,
            versionId: i.versionId || ver?.id,
            name: i.product.name,
            versionName: i.versionName || ver?.name,
            editionName: i.editionName || ver?.editionName,
            colorName: i.colorName || ver?.colorName,
            brand: i.product.brand,
            size: i.size,
            quantity: i.quantity,
            unitPrice: unit,
            totalPrice: unit * i.quantity,
            discountPercent: i.discountPercent ?? ver?.discountPercent,
            image: i.image || ver?.images?.[0] || i.product.images[0],
            sku: i.sku || ver?.sku || i.product.sku,
            descriptionSnapshot: getEffectiveVersionDescription(i.product, ver),
            specsSnapshot: getEffectiveVersionSpecs(i.product, ver),
          };
        }),
        subtotal,
        discount: pixDiscount,
        shipping: 0,
        total,
        paymentMethod,
        status: 'aguardando_atendimento',
        notes: 'Pedido registrado via Checkout WhatsApp & E-mail',
        whatsappMessage: whatsappMsg,
        emailNotificationStatus: 'pending',
        stockDeducted: true,
        stockRestored: false,
        history: [
          {
            timestamp: new Date().toISOString(),
            action: 'Pedido criado pelo cliente no site (estoque reservado atomicamente)',
            operator: 'Cliente',
            note: `Forma: ${paymentMethod}`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 7. Save Order & Decrement Exact Version+Size Stock Atomically via Firestore Transaction
      const savedOrder = await storeService.placeOrderAtomic(newOrder, cart);

      // 8. Dispatch Automated Email Notifications to Admin & Client
      dispatchOrderEmailNotifications(savedOrder, storeSettings)
        .then((res) => {
          setEmailStatusNote(res.message);
        })
        .catch(() => {
          setEmailStatusNote('Resumo arquivado para envio administrativo.');
        });

      // 9. Trigger celebration confetti
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C9000B', '#FFFFFF', '#111111'],
      });

      setCompletedOrder(savedOrder);
      onOrderSuccess(savedOrder);

      // 10. Open official WhatsApp deep link
      const encodedMsg = encodeURIComponent(whatsappMsg);
      const whatsappUrl = `https://wa.me/${storeSettings.whatsappNumber}?text=${encodedMsg}`;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : 'Houve um erro ao processar seu pedido. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopenWhatsapp = () => {
    if (!completedOrder || !completedOrder.whatsappMessage) return;
    const encoded = encodeURIComponent(completedOrder.whatsappMessage);
    window.open(`https://wa.me/${storeSettings.whatsappNumber}?text=${encoded}`, '_blank');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(storeSettings.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#161616] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-[#121212] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#C9000B] uppercase">
              CHECKOUT OFICIAL
            </span>
            <h2 className="font-anton text-xl sm:text-2xl text-white tracking-wide uppercase">
              {completedOrder ? 'PEDIDO REGISTRADO COM SUCESSO' : 'FINALIZAÇÃO DO PEDIDO'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {completedOrder ? (
          <div className="p-5 sm:p-8 space-y-5 text-center overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-[#C9000B] uppercase">
                PEDIDO: {completedOrder.id}
              </span>
              <h3 className="font-anton text-2xl text-white uppercase">
                PEDIDO SALVO NO BANCO DE DADOS!
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                O seu pedido foi registrado no Firebase e o resumo completo foi enviado para o e-mail cadastrado. Uma janela do WhatsApp foi aberta para você confirmar o envio com nosso atendente.
              </p>
            </div>

            {/* Email dispatch alert */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Resumo enviado para: <strong>{completedOrder.customer.email}</strong></span>
            </div>

            {/* PIX Quick Info */}
            {completedOrder.paymentMethod === 'PIX' && (
              <div className="bg-zinc-900/90 border border-zinc-700/80 p-4 rounded-xl max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">
                    Chave PIX Oficial ({storeSettings.pixKeyType}):
                  </span>
                  <span className="text-xs font-bold text-emerald-400">5% OFF Aplicado</span>
                </div>
                <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                  <span className="font-mono text-xs text-zinc-200 select-all truncate mr-2">
                    {storeSettings.pixKey}
                  </span>
                  <button
                    onClick={handleCopyPix}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-[#C9000B] text-white text-xs font-semibold rounded cursor-pointer shrink-0 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Total a pagar no PIX: <strong className="text-white">{formatCurrency(completedOrder.total)}</strong>
                </p>
              </div>
            )}

            {/* WhatsApp Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleReopenWhatsapp}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-anton text-base sm:text-lg uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 min-h-[48px]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Abrir Conversa no WhatsApp Novamente</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-75" />
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer min-h-[44px]"
              >
                Voltar à Loja
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Products Quick Strip */}
            <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Resumo dos Itens ({cart.length})
              </span>
              <div className="space-y-2">
                {cart.map((item) => {
                  const unit = Number(item.unitPrice ?? item.product.price ?? 0);
                  const versionLabel = item.editionName || item.versionName;
                  return (
                    <div
                      key={getCartItemKey(item.product.id, item.versionId, item.size)}
                      className="flex justify-between items-start gap-2 text-xs"
                    >
                      <div className="text-zinc-200 min-w-0">
                        <span className="font-semibold block truncate">{item.product.name}</span>
                        <span className="text-[11px] text-zinc-400 block truncate">
                          {versionLabel ? `Versão: ${versionLabel} • ` : ''}Tam: {item.size} × {item.quantity} ({formatCurrency(unit)}/un)
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-white font-semibold shrink-0">
                        {formatCurrency(unit * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9000B]">
                1. Dados do Comprador
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    WhatsApp com DDD *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    E-mail para Receber Resumo do Pedido *
                  </label>
                  <input
                    type="email"
                    required
                    value={customer.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="carlos@exemplo.com"
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9000B]">
                2. Endereço de Entrega
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    CEP *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Av. Paulista"
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder="1234"
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Complemento (Apto, Bloco, etc.)
                  </label>
                  <input
                    type="text"
                    value={customer.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    placeholder="Apto 42"
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Bela Vista"
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Salvador"
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    UF *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="BA"
                    maxLength={2}
                    className="w-full bg-zinc-900 text-xs px-3 py-2.5 rounded-lg border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B] uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9000B]">
                3. Forma de Pagamento Desejada
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PIX')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    paymentMethod === 'PIX'
                      ? 'border-[#C9000B] bg-[#C9000B]/10 ring-1 ring-[#C9000B]'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-anton text-base text-white">PIX</span>
                    <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-800">
                      5% OFF
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Aprovação imediata e envio prioritário
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARTAO')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    paymentMethod === 'CARTAO'
                      ? 'border-[#C9000B] bg-[#C9000B]/10 ring-1 ring-[#C9000B]'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-anton text-base text-white block mb-1">
                    CARTÃO DE CRÉDITO
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Até 12x via link seguro no WhatsApp
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('OUTRA')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    paymentMethod === 'OUTRA'
                      ? 'border-[#C9000B] bg-[#C9000B]/10 ring-1 ring-[#C9000B]'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-anton text-base text-white block mb-1">
                    A COMBINAR
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Alinhar opções com o consultor
                  </p>
                </button>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal ({cart.length} itens):</span>
                <span className="font-mono text-zinc-200">{formatCurrency(subtotal)}</span>
              </div>
              {pixDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Desconto Especial PIX (5%):</span>
                  <span className="font-mono">-{formatCurrency(pixDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-white text-base font-bold pt-2 border-t border-zinc-800">
                <span className="font-anton uppercase tracking-wider">TOTAL DO PEDIDO:</span>
                <span className="font-anton text-2xl text-[#ff4d55]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#C9000B] hover:bg-[#a60009] active:scale-[0.99] text-white font-anton text-base sm:text-lg tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-red-950/70 disabled:opacity-50 min-h-[48px]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{submitting ? 'VALIDANDO ESTOQUE & SALVANDO...' : 'PROSSEGUIR PARA PAGAMENTO PELO WHATSAPP'}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Pedido salvo com segurança no Firebase antes do redirecionamento.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
