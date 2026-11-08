import React, { useState, useMemo } from 'react';
import {
  Package,
  ShoppingCart,
  Users,
  Settings,
  ShieldCheck,
  TrendingUp,
  Download,
  Upload,
  ExternalLink,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Palette,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Tag,
  Mail,
  RefreshCw,
  Copy,
  ChevronRight,
  Eye
} from 'lucide-react';
import {
  Product,
  Order,
  StoreSettings,
  DesignSettings,
  OrderStatus,
  MediaItem,
  Banner,
} from '../../types';
import { formatCurrency, formatPhone } from '../../utils/format';
import { storeService } from '../../services/storeService';
import { dispatchOrderEmailNotifications } from '../../services/emailService';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  storeSettings: StoreSettings;
  designSettings: DesignSettings;
  onRefreshData: () => void;
  onOpenVisualBuilder: () => void;
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  storeSettings,
  designSettings,
  onRefreshData,
  onOpenVisualBuilder,
  onExitAdmin,
}) => {
  // Strict Security: In-memory only state. Never stored in localStorage, sessionStorage, or cookies.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{
    login: string;
    email: string;
    displayName: string;
    role: string;
  } | null>(null);

  // Form inputs: Strictly initialized to empty strings with zero autofill
  const [authLogin, setAuthLogin] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Recovery modal state
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);

  // Password change state for security tab
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'brands' | 'media' | 'banners' | 'whatsapp' | 'security'
  >('overview');

  // Order modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [emailResendStatus, setEmailResendStatus] = useState<string | null>(null);

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // Brand / Category management state
  const [newBrandInput, setNewBrandInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Media Library state
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('all');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [copiedMediaUrl, setCopiedMediaUrl] = useState<string | null>(null);

  // Banner Editor state
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isNewBannerModalOpen, setIsNewBannerModalOpen] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Backup state
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: authLogin.trim(),
          password: authPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        setSessionToken(data.token);
        setAdminUser(data.user);
        setIsAuthenticated(true);
        setAuthError('');
        // Instantly wipe password from React state
        setAuthPassword('');
      } else {
        setAuthError(data.error || 'Credenciais inválidas. Verifique os dados informados.');
        setAuthPassword('');
      }
    } catch {
      setAuthError('Falha de conexão com o servidor de autenticação.');
      setAuthPassword('');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (sessionToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
      }
    } catch {}

    // Complete in-memory wipe
    setSessionToken(null);
    setAdminUser(null);
    setIsAuthenticated(false);
    setAuthLogin('');
    setAuthPassword('');
    setAuthError('');
    onExitAdmin();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeStatus({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    if (newPasswordInput.length < 8) {
      setPasswordChangeStatus({ type: 'error', text: 'A nova senha deve possuir no mínimo 8 caracteres.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordChangeStatus({ type: 'success', text: 'Senha administrativa atualizada com sucesso!' });
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      } else {
        setPasswordChangeStatus({ type: 'error', text: data.error || 'Erro ao alterar a senha.' });
      }
    } catch {
      setPasswordChangeStatus({ type: 'error', text: 'Erro de comunicação com o servidor.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);
    setIsRecoveryLoading(true);

    try {
      const res = await fetch('/api/admin/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: recoveryIdentifier.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecoveryMessage({ type: 'success', text: data.message });
        setRecoveryStep(2);
      } else {
        setRecoveryMessage({ type: 'error', text: data.error || 'Erro ao solicitar código.' });
      }
    } catch {
      setRecoveryMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    if (recoveryNewPassword.length < 8) {
      setRecoveryMessage({ type: 'error', text: 'A nova senha deve possuir no mínimo 8 caracteres.' });
      return;
    }

    setIsRecoveryLoading(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: recoveryIdentifier.trim(),
          code: recoveryCode.trim(),
          newPassword: recoveryNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecoveryMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          setIsRecoveryModalOpen(false);
          setRecoveryStep(1);
          setRecoveryIdentifier('');
          setRecoveryCode('');
          setRecoveryNewPassword('');
          setRecoveryMessage(null);
        }, 2500);
      } else {
        setRecoveryMessage({ type: 'error', text: data.error || 'Falha ao redefinir senha.' });
      }
    } catch {
      setRecoveryMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const confirmedOrders = orders.filter(
      (o) => o.status === 'pago' || o.status === 'entregue' || o.status === 'enviado'
    );
    const pendingOrders = orders.filter(
      (o) =>
        o.status === 'aguardando_atendimento' ||
        o.status === 'aguardando_pagamento' ||
        o.status === 'em_negociacao' ||
        o.status === 'novo'
    );
    const confirmedRevenue = confirmedOrders.reduce((acc, o) => acc + o.total, 0);
    const pendingRevenue = pendingOrders.reduce((acc, o) => acc + o.total, 0);
    const avgTicket = confirmedOrders.length > 0 ? confirmedRevenue / confirmedOrders.length : 0;

    return {
      totalOrders: orders.length,
      confirmedOrdersCount: confirmedOrders.length,
      pendingOrdersCount: pendingOrders.length,
      confirmedRevenue,
      pendingRevenue,
      avgTicket,
    };
  }, [orders]);

  const customerList = useMemo(() => {
    const map = new Map<
      string,
      { customer: Order['customer']; ordersCount: number; totalSpent: number; lastOrder: string }
    >();
    orders.forEach((o) => {
      const key = o.customer.email.toLowerCase() || o.customer.phone;
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += o.status === 'pago' ? o.total : 0;
      } else {
        map.set(key, {
          customer: o.customer,
          ordersCount: 1,
          totalSpent: o.status === 'pago' ? o.total : 0,
          lastOrder: o.createdAt,
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    notes?: string,
    trackingCode?: string
  ) => {
    const operator = adminUser?.login || 'OffSneakers3420';
    await storeService.updateOrderStatus(orderId, status, operator, notes, trackingCode);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        status,
        ...(notes ? { notes } : {}),
        ...(trackingCode ? { trackingCode } : {}),
      });
    }
    onRefreshData();
  };

  const handleResendOrderEmail = async (order: Order) => {
    setEmailResendStatus('Enviando...');
    const result = await dispatchOrderEmailNotifications(order, storeSettings);
    setEmailResendStatus(result.message);
    setTimeout(() => setEmailResendStatus(null), 4000);
    onRefreshData();
  };

  const handleSaveProduct = async (product: Product) => {
    await storeService.saveProduct(product);
    setEditingProduct(null);
    setIsNewProductModalOpen(false);
    onRefreshData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este sneaker do catálogo?')) {
      await storeService.deleteProduct(id);
      onRefreshData();
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandInput.trim()) return;
    await storeService.addBrand(newBrandInput);
    setNewBrandInput('');
    onRefreshData();
  };

  const handleRemoveBrand = async (b: string) => {
    if (confirm(`Remover marca "${b}"?`)) {
      await storeService.removeBrand(b);
      onRefreshData();
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryInput.trim()) return;
    await storeService.addCategory(newCategoryInput);
    setNewCategoryInput('');
    onRefreshData();
  };

  const handleRemoveCategory = async (c: string) => {
    if (confirm(`Remover categoria "${c}"?`)) {
      await storeService.removeCategory(c);
      onRefreshData();
    }
  };

  // Media Library Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        // create media item
        const img = new Image();
        img.onload = () => {
          const item: MediaItem = {
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            url: base64,
            category: 'products',
            dimensions: `${img.width}x${img.height}`,
            size: `${(file.size / 1024).toFixed(0)} KB`,
            uploadedAt: new Date().toISOString(),
          };
          storeService.saveMediaItem(item);
          onRefreshData();
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCopyMedia = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedMediaUrl(url);
    setTimeout(() => setCopiedMediaUrl(null), 2500);
  };

  // Banner Editor Handlers
  const handleSaveBanner = async (banner: Banner) => {
    const banners = [...(designSettings.banners || [])];
    const idx = banners.findIndex((b) => b.id === banner.id);
    if (idx >= 0) {
      banners[idx] = banner;
    } else {
      banners.push(banner);
    }
    await storeService.saveDesign({ ...designSettings, banners }, true);
    setEditingBanner(null);
    setIsNewBannerModalOpen(false);
    onRefreshData();
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm('Excluir este banner?')) {
      const banners = (designSettings.banners || []).filter((b) => b.id !== id);
      await storeService.saveDesign({ ...designSettings, banners }, true);
      onRefreshData();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await storeService.saveSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
    onRefreshData();
  };

  const handleDownloadBackup = () => {
    const json = storeService.createBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_offsneakers_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setBackupStatus('Backup exportado com sucesso!');
    setTimeout(() => setBackupStatus(null), 3500);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storeService.restoreFromJSON(content);
      if (success) {
        setBackupStatus('Banco de dados restaurado com sucesso!');
        onRefreshData();
      } else {
        setBackupStatus('Falha ao restaurar: arquivo JSON inválido.');
      }
      setTimeout(() => setBackupStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#161616] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <img
              src="/assets/aistudio/Perfil_Instagram_OFFSNEAKERS1_97329a12.png"
              alt="OFF.SNEAKERSOFC"
              className="w-16 h-16 object-contain rounded-xl mx-auto border border-red-900/60 shadow-lg"
            />
            <h2 className="font-anton text-2xl text-white tracking-wider uppercase">
              PAINEL ADMINISTRATIVO PRIVADO
            </h2>
            <p className="text-xs text-zinc-400">
              Autenticação segura em memória • OFF.SNEAKERSOFC
            </p>
          </div>

          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Usuário Administrativo ou E-mail
              </label>
              <input
                type="text"
                name="offsneakers_admin_user"
                id="offsneakers_admin_user"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                value={authLogin}
                onChange={(e) => setAuthLogin(e.target.value)}
                placeholder="Informe seu login de acesso..."
                className="w-full bg-zinc-900 text-xs px-3.5 py-3 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryModalOpen(true);
                    setRecoveryStep(1);
                    setRecoveryMessage(null);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-[#C9000B] transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                name="offsneakers_admin_secret"
                id="offsneakers_admin_secret"
                required
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Insira sua senha..."
                className="w-full bg-zinc-900 text-xs px-3.5 py-3 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-[#C9000B] hover:bg-red-700 disabled:opacity-50 text-white font-anton text-base uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-lg shadow-red-950/60 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <span>Validando Acesso Seguro...</span>
              ) : (
                <span>Acessar Painel Privado</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800 text-center">
            <button
              onClick={onExitAdmin}
              className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              ← Voltar para a Loja Pública
            </button>
          </div>
        </div>

        {/* Modal de Recuperação de Senha */}
        {isRecoveryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#161616] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-anton text-lg text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#C9000B]" />
                  Recuperação de Acesso
                </h3>
                <button
                  onClick={() => setIsRecoveryModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {recoveryStep === 1 ? (
                <form onSubmit={handleRequestRecovery} className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Informe seu usuário administrativo ou e-mail cadastrado. Um código de segurança temporário será gerado e enviado para o canal oficial de atendimento.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Usuário ou E-mail Cadastrado
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      placeholder="Ex: OffSneakers3420"
                      className="w-full bg-zinc-900 text-xs px-3.5 py-3 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                    />
                  </div>

                  {recoveryMessage && (
                    <div
                      className={`p-3 text-xs rounded-lg ${
                        recoveryMessage.type === 'success'
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {recoveryMessage.text}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRecoveryModalOpen(false)}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isRecoveryLoading}
                      className="px-5 py-2.5 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      {isRecoveryLoading ? 'Gerando Código...' : 'Solicitar Código'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Insira o código de 6 dígitos despachado para o canal oficial e defina a sua nova senha de acesso.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Código de Verificação (6 dígitos)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoComplete="off"
                      data-lpignore="true"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="Ex: 849201"
                      className="w-full bg-zinc-900 text-xs px-3.5 py-3 rounded-xl border border-zinc-700 text-white font-mono tracking-widest text-center text-lg focus:outline-none focus:border-[#C9000B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Nova Senha Administrativa (mínimo 8 caracteres)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      data-lpignore="true"
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      placeholder="Crie sua nova senha..."
                      className="w-full bg-zinc-900 text-xs px-3.5 py-3 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                    />
                  </div>

                  {recoveryMessage && (
                    <div
                      className={`p-3 text-xs rounded-lg ${
                        recoveryMessage.type === 'success'
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {recoveryMessage.text}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep(1)}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={isRecoveryLoading}
                      className="px-5 py-2.5 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      {isRecoveryLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101010] text-zinc-200">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-[#161616] border-b border-zinc-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/Perfil_Instagram_OFFSNEAKERS1_97329a12.png"
            alt="OFF.SNEAKERSOFC"
            className="w-9 h-9 object-contain rounded-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-anton text-lg text-white tracking-wider uppercase">
                OFF.SNEAKERSOFC ADMIN PRO
              </span>
              <span className="bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Firebase Firestore
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono block">
              Operador: {adminUser?.login || 'OffSneakers3420'} ({adminUser?.role === 'super_admin' ? 'Master Admin' : 'Admin'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenVisualBuilder}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#C9000B] to-[#850008] text-white text-xs font-anton tracking-wider uppercase rounded-lg hover:brightness-110 transition-all cursor-pointer shadow-md"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Editor Visual da Loja</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Encerrar Sessão em Memória"
          >
            <X className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#141414] border-b border-zinc-800 px-4 sm:px-8 overflow-x-auto">
        <nav className="flex space-x-6 text-xs font-semibold uppercase tracking-wider py-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-[#C9000B] text-[#C9000B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-[#C9000B] text-[#C9000B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-[#C9000B] text-[#C9000B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo & Estoque ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'brands'
                ? 'border-[#C9000B] text-[#C9000B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Marcas & Categorias</span>
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'banners'
                ? 'border-[#C9000B] text-[#C9000B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Banners & Carrossel</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'media'
                ? 'border-[#C9000B] text-[#C9000B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Mídias & Imagens</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'whatsapp'
                ? 'border-[#C9000B] text-[#C9000B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>WhatsApp & E-mails</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-[#C9000B] text-[#C9000B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Segurança & Backups</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="bg-[#181818] p-5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Faturamento Confirmado (Vendas)
                </span>
                <div className="font-anton text-2xl text-emerald-400">
                  {formatCurrency(metrics.confirmedRevenue)}
                </div>
                <span className="text-[11px] text-zinc-500">
                  {metrics.confirmedOrdersCount} pedidos verificados
                </span>
              </div>

              <div className="bg-[#181818] p-5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Em Negociação / Pendentes
                </span>
                <div className="font-anton text-2xl text-amber-400">
                  {formatCurrency(metrics.pendingRevenue)}
                </div>
                <span className="text-[11px] text-zinc-500">
                  {metrics.pendingOrdersCount} pedidos aguardando atendimento
                </span>
              </div>

              <div className="bg-[#181818] p-5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Ticket Médio Confirmado
                </span>
                <div className="font-anton text-2xl text-white">
                  {formatCurrency(metrics.avgTicket)}
                </div>
                <span className="text-[11px] text-zinc-500">
                  Baseado nas vendas verificadas
                </span>
              </div>

              <div className="bg-[#181818] p-5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total de Pedidos no Sistema
                </span>
                <div className="font-anton text-2xl text-[#ff4d55]">
                  {metrics.totalOrders}
                </div>
                <span className="text-[11px] text-zinc-500">
                  Registrados no Firestore
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-[#181818] p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-anton text-xl text-white uppercase tracking-wider">
                    Últimos Pedidos Recebidos
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#C9000B] hover:text-white font-semibold cursor-pointer"
                  >
                    Ver Todos ({orders.length}) →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    Nenhum pedido recebido ainda. Quando um cliente clicar em "PROSSEGUIR PARA PAGAMENTO" no checkout, ele aparecerá aqui instantaneamente.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="p-3.5 bg-zinc-900/60 hover:bg-zinc-800/80 rounded-xl border border-zinc-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white">
                              {order.id}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-xs font-semibold text-zinc-200">
                              {order.customer.fullName}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            {order.items.length} par(es) • {formatPhone(order.customer.phone)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-anton text-sm text-white font-mono block">
                            {formatCurrency(order.total)}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 bg-[#181818] p-6 rounded-2xl border border-zinc-800 space-y-4">
                <h3 className="font-anton text-xl text-white uppercase tracking-wider">
                  Ações Imediatas
                </h3>

                <button
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#C9000B]" />
                  <span>Cadastrar Sneaker com Estoque Dinâmico</span>
                </button>

                <button
                  onClick={() => setIsNewBannerModalOpen(true)}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Layers className="w-4 h-4 text-[#C9000B]" />
                  <span>Criar Novo Banner Promocional</span>
                </button>

                <button
                  onClick={onOpenVisualBuilder}
                  className="w-full py-3 bg-[#C9000B] hover:bg-[#a60009] text-white font-anton text-sm uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  <Palette className="w-4 h-4" />
                  <span>Editor Visual da Loja</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-anton text-2xl text-white uppercase tracking-wider">
                Gerenciamento de Pedidos ({orders.length})
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Filtrar:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-zinc-900 text-xs px-3 py-2 rounded-xl border border-zinc-700 text-white focus:outline-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value="aguardando_atendimento">Aguardando Atendimento</option>
                  <option value="em_negociacao">Em Negociação</option>
                  <option value="aguardando_pagamento">Aguardando Pagamento</option>
                  <option value="pago">Pagamento Confirmado</option>
                  <option value="preparando">Em Preparação</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="bg-[#181818] rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141414] border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                    <tr>
                      <th className="p-4">Pedido</th>
                      <th className="p-4">Cliente / WhatsApp</th>
                      <th className="p-4">Itens</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">E-mail Status</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {orders
                      .filter((o) => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-zinc-900/60 transition-colors">
                          <td className="p-4 font-mono font-bold text-white">
                            {order.id}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-white block">
                              {order.customer.fullName}
                            </span>
                            <span className="text-zinc-400 text-[11px]">
                              {formatPhone(order.customer.phone)}
                            </span>
                          </td>
                          <td className="p-4 text-zinc-300">
                            {order.items.map((i, idx) => (
                              <div key={idx} className="truncate max-w-xs">
                                {i.name} (Tam: {i.size}) × {i.quantity}
                              </div>
                            ))}
                          </td>
                          <td className="p-4 font-anton text-sm text-white font-mono">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                              order.emailNotificationStatus === 'sent'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              <Mail className="w-3 h-3" />
                              <span>{order.emailNotificationStatus === 'sent' ? 'Enviado' : 'Registrado'}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className="bg-zinc-900 text-xs px-2.5 py-1 rounded border border-zinc-700 text-white focus:outline-none"
                            >
                              <option value="novo">Novo</option>
                              <option value="aguardando_atendimento">Aguardando Atendimento</option>
                              <option value="em_negociacao">Em Negociação</option>
                              <option value="aguardando_pagamento">Aguardando Pagamento</option>
                              <option value="pago">Pago (Confirmado)</option>
                              <option value="preparando">Em Preparação</option>
                              <option value="enviado">Enviado</option>
                              <option value="entregue">Entregue</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const text = encodeURIComponent(
                                    `Olá ${order.customer.fullName}! Atendimento oficial OFF.SNEAKERSOFC referente ao seu pedido ${order.id}.`
                                  );
                                  window.open(
                                    `https://wa.me/55${order.customer.phone.replace(/\D/g, '')}?text=${text}`,
                                    '_blank'
                                  );
                                }}
                                className="p-2 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 rounded-lg cursor-pointer"
                                title="Conversar no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Detalhes
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB (DYNAMIC SIZES & STOCK) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-anton text-2xl text-white uppercase tracking-wider">
                  Catálogo & Estoque Dinâmico
                </h2>
                <p className="text-xs text-zinc-400">
                  Gerencie qualquer tamanho e quantidade por produto sem limitações.
                </p>
              </div>
              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="px-4 py-2.5 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-sm uppercase rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Sneaker</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const totalStock = Object.values(product.inventory || {}).reduce((a, b) => a + b, 0);
                return (
                  <div
                    key={product.id}
                    className="bg-[#181818] border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-md"
                  >
                    <div className="flex gap-4">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-20 h-20 object-contain bg-zinc-950 rounded-xl p-1 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-[#C9000B] font-bold uppercase tracking-widest block">
                          {product.brand}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-anton text-lg text-white font-mono">
                            {formatCurrency(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs text-zinc-500 line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 block mt-1">
                          Estoque Total: <strong className="text-white">{totalStock} par(es)</strong>
                        </span>
                      </div>
                    </div>

                    {/* Sizes and stock badge list */}
                    <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Variações Cadastradas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(product.sizes || []).map((s) => {
                          const stock = product.inventory?.[String(s)] ?? 0;
                          return (
                            <span
                              key={String(s)}
                              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                stock > 0
                                  ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                  : 'bg-rose-950/40 text-rose-400 border border-rose-900 line-through'
                              }`}
                            >
                              {s}: {stock} un.
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {product.sku ? `SKU: ${product.sku}` : 'Ativo'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg cursor-pointer"
                          title="Editar Sneaker"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-400 rounded-lg cursor-pointer"
                          title="Excluir Sneaker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BRANDS & CATEGORIES TAB */}
        {activeTab === 'brands' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Brands */}
            <div className="bg-[#181818] p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="font-anton text-xl text-white uppercase tracking-wider">
                Marcas Cadastradas
              </h3>
              <p className="text-xs text-zinc-400">
                Adicione marcas para alimentar automaticamente os filtros da loja.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da marca (ex: Asics, Puma, Converse)..."
                  value={newBrandInput}
                  onChange={(e) => setNewBrandInput(e.target.value)}
                  className="flex-1 bg-zinc-900 text-xs px-3 py-2 rounded-lg border border-zinc-700 text-white"
                />
                <button
                  onClick={handleAddBrand}
                  className="px-4 py-2 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-xs uppercase rounded-lg cursor-pointer"
                >
                  Adicionar
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {storeService.getBrands().map((brand) => (
                  <div
                    key={brand}
                    className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-white">{brand}</span>
                    <button
                      onClick={() => handleRemoveBrand(brand)}
                      className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Excluir marca"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-[#181818] p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="font-anton text-xl text-white uppercase tracking-wider">
                Categorias de Produtos
              </h3>
              <p className="text-xs text-zinc-400">
                Organize seu estoque por categoria (ex: Sneakers, Vestuário, Acessórios).
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da categoria..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="flex-1 bg-zinc-900 text-xs px-3 py-2 rounded-lg border border-zinc-700 text-white"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-xs uppercase rounded-lg cursor-pointer"
                >
                  Adicionar
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {storeService.getCategories().map((cat) => (
                  <div
                    key={cat}
                    className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-white">{cat}</span>
                    <button
                      onClick={() => handleRemoveCategory(cat)}
                      className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BANNERS TAB */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-anton text-2xl text-white uppercase tracking-wider">
                  Editor de Banners & Carrossel
                </h2>
                <p className="text-xs text-zinc-400">
                  Configure banners promocionais com imagens para desktop e mobile.
                </p>
              </div>
              <button
                onClick={() => setIsNewBannerModalOpen(true)}
                className="px-4 py-2.5 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-sm uppercase rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Banner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(designSettings.banners || []).map((banner) => (
                <div
                  key={banner.id}
                  className="bg-[#181818] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div className="relative h-44 bg-zinc-950 overflow-hidden">
                    <img
                      src={banner.desktopImage}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: banner.focalPoint || 'center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 flex flex-col justify-end">
                      {banner.badgeText && (
                        <span className="text-[10px] font-bold text-[#C9000B] uppercase">
                          {banner.badgeText}
                        </span>
                      )}
                      <h4 className="font-anton text-lg text-white uppercase truncate">
                        {banner.title}
                      </h4>
                      <p className="text-xs text-zinc-300 truncate">
                        {banner.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between border-t border-zinc-800 text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      banner.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {banner.active ? 'Ativo na Loja' : 'Desativado'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingBanner(banner)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg cursor-pointer"
                        title="Editar Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-400 rounded-lg cursor-pointer"
                        title="Excluir Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-anton text-2xl text-white uppercase tracking-wider">
                  Gerenciador de Mídias & Imagens
                </h2>
                <p className="text-xs text-zinc-400">
                  Faça upload de fotos de produtos e banners diretamente para uso na loja.
                </p>
              </div>

              <label className="px-4 py-2.5 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-sm uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-lg">
                <Upload className="w-4 h-4" />
                <span>Enviar Imagens do Computador</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {storeService.getMediaItems().map((item) => (
                <div
                  key={item.id}
                  className="bg-[#181818] border border-zinc-800 rounded-xl overflow-hidden group flex flex-col justify-between"
                >
                  <div className="aspect-square bg-zinc-950 p-2 flex items-center justify-center relative">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="p-3 border-t border-zinc-800 space-y-1">
                    <h5 className="text-xs font-semibold text-white truncate" title={item.name}>
                      {item.name}
                    </h5>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>{item.dimensions || 'Dimensões'}</span>
                      <span>{item.size || ''}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => handleCopyMedia(item.url)}
                        className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedMediaUrl === item.url ? 'Copiado!' : 'Copiar URL'}</span>
                      </button>

                      <button
                        onClick={() => storeService.deleteMediaItem(item.id).then(() => onRefreshData())}
                        className="text-zinc-500 hover:text-rose-400 p-1 rounded cursor-pointer"
                        title="Excluir Mídia"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHATSAPP & STORE SETTINGS */}
        {activeTab === 'whatsapp' && (
          <div className="max-w-3xl space-y-6">
            <h2 className="font-anton text-2xl text-white uppercase tracking-wider">
              Configurações de Atendimento & E-mails
            </h2>

            <form onSubmit={handleSaveSettings} className="bg-[#181818] p-6 rounded-2xl border border-zinc-800 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Nome Oficial da Loja *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    placeholder="OFF.SNEAKERSOFC"
                    className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Localização Oficial da Loja (Cidade, UF) *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    placeholder="Salvador, BA — Atendimento Especializado"
                    className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white focus:outline-none focus:border-[#C9000B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Número Oficial do WhatsApp da OFF.SNEAKERSOFC (com DDI e DDD) *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.whatsappNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                  placeholder="5511998765432"
                  className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white focus:outline-none focus:border-[#C9000B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  E-mail Administrativo para Notificação de Novos Pedidos *
                </label>
                <input
                  type="email"
                  required
                  value={settingsForm.orderNotificationEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, orderNotificationEmail: e.target.value })}
                  placeholder="offsneakers.admc@gmail.com"
                  className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white focus:outline-none focus:border-[#C9000B]"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Sempre que um cliente gerar um pedido, o resumo detalhado será enviado automaticamente para este e-mail.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Desconto Automático no PIX (%)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.pixDiscountPercent}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, pixDiscountPercent: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white focus:outline-none focus:border-[#C9000B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Chave PIX Oficial da Loja
                  </label>
                  <input
                    type="text"
                    value={settingsForm.pixKey}
                    onChange={(e) => setSettingsForm({ ...settingsForm, pixKey: e.target.value })}
                    className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white focus:outline-none focus:border-[#C9000B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Chave de API Resend (Opcional para Envio Direto via Servidor)
                </label>
                <input
                  type="password"
                  value={settingsForm.resendApiKey || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, resendApiKey: e.target.value })}
                  placeholder="re_xxxxxxxxxxxxxx"
                  className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white font-mono focus:outline-none focus:border-[#C9000B]"
                />
              </div>

              {settingsSaved && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Configurações salvas e sincronizadas com sucesso no Firebase!</span>
                </div>
              )}

              <button
                type="submit"
                className="py-3 px-6 bg-[#C9000B] hover:bg-red-700 text-white font-anton uppercase rounded-xl transition-colors cursor-pointer"
              >
                Salvar Configurações
              </button>
            </form>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="max-w-4xl space-y-6">
            <h2 className="font-anton text-2xl text-white uppercase tracking-wider">
              Segurança, Monitoramento & Credenciais Administrativas
            </h2>

            {/* Gestão Segura de Credenciais do Administrador Master */}
            <div className="bg-[#181818] p-6 rounded-2xl border border-zinc-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-2">
                <div>
                  <h3 className="font-anton text-xl text-white uppercase flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#C9000B]" />
                    Credenciais do Administrador Master
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Operador autenticado: <strong className="text-white">{adminUser?.login || 'OffSneakers3420'}</strong> • E-mail oficial: <strong className="text-white">{adminUser?.email || 'offsneakers.admc@gmail.com'}</strong> • Perfil: <span className="text-emerald-400 font-bold uppercase">Super Administrador</span>
                  </p>
                </div>
                <div className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-mono rounded-lg">
                  Sessão em Memória Ativa
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                  Alterar Senha do Administrador
                </h4>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      data-lpignore="true"
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Digite a senha atual..."
                      className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 block mb-1">
                        Nova Senha (mín. 8 caracteres)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        data-lpignore="true"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Nova senha segura..."
                        className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 block mb-1">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        data-lpignore="true"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Repita a nova senha..."
                        className="w-full bg-zinc-900 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C9000B]"
                      />
                    </div>
                  </div>

                  {passwordChangeStatus && (
                    <div
                      className={`p-3 text-xs rounded-lg ${
                        passwordChangeStatus.type === 'success'
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {passwordChangeStatus.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 bg-[#C9000B] hover:bg-red-700 disabled:opacity-50 text-white font-anton text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow"
                  >
                    {isChangingPassword ? 'Atualizando Senha...' : 'Atualizar Senha Administrativa'}
                  </button>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#181818] p-6 rounded-2xl border border-zinc-800 space-y-4">
                <h3 className="font-anton text-xl text-white uppercase">
                  Status do Sistema & Autenticação
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span>Banco de Dados Firestore</span>
                    <span className="text-emerald-400 font-bold">● Ativo & Sincronizado</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span>Validação de Estoque</span>
                    <span className="text-emerald-400 font-bold">● Revalidação em Checkout</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span>Envio de E-mail de Pedidos</span>
                    <span className="text-emerald-400 font-bold">● Ativo (Admin & Cliente)</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#181818] p-6 rounded-2xl border border-zinc-800 space-y-4">
                <h3 className="font-anton text-xl text-white uppercase">
                  Exportação e Recuperação de Dados
                </h3>
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase rounded-xl border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#C9000B]" />
                    <span>Baixar Backup Completo (JSON)</span>
                  </button>

                  <label className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase rounded-xl border border-dashed border-zinc-700 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Restaurar Backup do Arquivo</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      className="hidden"
                    />
                  </label>
                </div>

                {backupStatus && (
                  <div className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-xl flex items-center gap-2">
                    <span>{backupStatus}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Order Detail Modal with Email Resend Action */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#181818] border border-zinc-800 rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] text-[#C9000B] font-bold uppercase">
                  DETALHES DO PEDIDO
                </span>
                <h3 className="font-anton text-xl text-white uppercase">
                  {selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-zinc-900/60 p-3 rounded-xl space-y-1">
                <span className="font-bold text-white uppercase block">Dados do Cliente</span>
                <p>Nome: <strong className="text-zinc-200">{selectedOrder.customer.fullName}</strong></p>
                <p>WhatsApp: <strong className="text-zinc-200">{formatPhone(selectedOrder.customer.phone)}</strong></p>
                <p>E-mail: <strong className="text-zinc-200">{selectedOrder.customer.email}</strong></p>
                <p>Endereço: <strong className="text-zinc-200">{selectedOrder.customer.street}, Nº {selectedOrder.customer.number} ({selectedOrder.customer.city}/{selectedOrder.customer.state})</strong></p>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-xl space-y-2">
                <span className="font-bold text-white uppercase block">Itens Solicitados</span>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span>{item.name} (Tam: {item.size}) × {item.quantity}</span>
                    <span className="font-mono text-white font-bold">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between p-3 bg-zinc-900 rounded-xl text-white font-bold">
                <span>TOTAL:</span>
                <span className="font-anton text-lg text-emerald-400">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {emailResendStatus && (
              <div className="p-2.5 bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg">
                {emailResendStatus}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleResendOrderEmail(selectedOrder)}
                className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#C9000B]" />
                <span>Reenviar E-mail do Pedido</span>
              </button>

              <button
                onClick={() => {
                  const text = encodeURIComponent(
                    `Olá ${selectedOrder.customer.fullName}! Atendimento OFF.SNEAKERSOFC referente ao seu pedido ${selectedOrder.id}.`
                  );
                  window.open(`https://wa.me/55${selectedOrder.customer.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / New Product Modal with Dynamic Sizes */}
      {(isNewProductModalOpen || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          brands={storeService.getBrands()}
          categories={storeService.getCategories()}
          onClose={() => {
            setIsNewProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}

      {/* Edit / New Banner Modal */}
      {(isNewBannerModalOpen || editingBanner) && (
        <BannerFormModal
          banner={editingBanner}
          onClose={() => {
            setIsNewBannerModalOpen(false);
            setEditingBanner(null);
          }}
          onSave={handleSaveBanner}
        />
      )}
    </div>
  );
};

// Subcomponent: ProductFormModal with dynamic size adder
interface ProductFormModalProps {
  product: Product | null;
  brands: string[];
  categories: string[];
  onClose: () => void;
  onSave: (product: Product) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  brands,
  categories,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || brands[0] || 'Jordan');
  const [model, setModel] = useState(product?.model || '');
  const [description, setDescription] = useState(product?.description || '');
  const [images, setImages] = useState<string[]>(product?.images || ['/src/assets/images/product_jordan_retro_high_1794010895050.jpg']);
  const [price, setPrice] = useState(product?.price || 1200);
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice || 1600);
  const [discountPercent, setDiscountPercent] = useState(product?.discountPercent || 25);
  const [category, setCategory] = useState(product?.category || categories[0] || 'Sneakers');
  const [sku, setSku] = useState(product?.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000));
  const [condition, setCondition] = useState(product?.condition || 'Novo na Caixa Original com Tags');
  const [featured, setFeatured] = useState(product?.featured || false);
  const [bestSeller, setBestSeller] = useState(product?.bestSeller || false);

  // Dynamic sizes & stock map
  const [sizes, setSizes] = useState<string[]>(product?.sizes || ['38', '39', '40', '41', '42']);
  const [inventory, setInventory] = useState<Record<string, number>>(
    product?.inventory || { '38': 2, '39': 3, '40': 4, '41': 2, '42': 1 }
  );

  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeStock, setNewSizeStock] = useState(1);

  const handleAddSize = () => {
    const clean = newSizeName.trim().toUpperCase();
    if (!clean) return;
    if (!sizes.includes(clean)) {
      setSizes([...sizes, clean]);
      setInventory({ ...inventory, [clean]: Math.max(0, newSizeStock) });
      setNewSizeName('');
      setNewSizeStock(1);
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setSizes(sizes.filter((s) => s !== sizeToRemove));
    const nextInv = { ...inventory };
    delete nextInv[sizeToRemove];
    setInventory(nextInv);
  };

  const handleStockChange = (size: string, qty: number) => {
    setInventory({ ...inventory, [size]: Math.max(0, qty) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const totalStock = Object.values(inventory).reduce((a, b) => a + b, 0);

    const saved: Product = {
      id: product?.id || `prod-${Date.now()}`,
      name,
      brand,
      model,
      description,
      images,
      price,
      originalPrice,
      discountPercent,
      sizes,
      inventory,
      category,
      featured,
      bestSeller,
      newRelease: true,
      status: totalStock > 0 ? 'active' : 'out_of_stock',
      sku,
      condition,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#181818] border border-zinc-800 rounded-2xl p-6 space-y-4 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-anton text-xl text-white uppercase">
            {product ? 'Editar Sneaker' : 'Cadastrar Novo Sneaker'}
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">Nome do Sneaker *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Marca *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white cursor-pointer"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Modelo / Silhueta</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Preço Atual (R$) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Preço Anterior (R$)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Desconto (%)</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>
          </div>

          {/* DYNAMIC SIZES & STOCK ENGINE */}
          <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-[#C9000B] uppercase tracking-wider block">
              Gerenciamento de Tamanhos & Quantidades em Estoque
            </span>

            {/* Add Size Row */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Ex: 37, 38.5, 41, M, GG..."
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                className="w-36 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
              <input
                type="number"
                min="0"
                placeholder="Qtd."
                value={newSizeStock}
                onChange={(e) => setNewSizeStock(Number(e.target.value))}
                className="w-20 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="px-3 py-2 bg-zinc-800 hover:bg-[#C9000B] text-white font-semibold rounded-lg cursor-pointer"
              >
                + Adicionar Tamanho
              </button>
            </div>

            {/* Sizes List with Quantity Inputs */}
            <div className="space-y-1.5 pt-2">
              {sizes.map((s) => (
                <div
                  key={s}
                  className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800"
                >
                  <span className="font-anton text-sm text-white font-mono w-20">Tam: {s}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Estoque:</span>
                    <input
                      type="number"
                      min="0"
                      value={inventory[s] ?? 0}
                      onChange={(e) => handleStockChange(s, Number(e.target.value))}
                      className="w-16 bg-zinc-900 px-2 py-1 rounded border border-zinc-700 text-white text-center font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(s)}
                      className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Remover tamanho"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">URL da Imagem Principal</label>
            <input
              type="text"
              value={images[0]}
              onChange={(e) => setImages([e.target.value])}
              className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">Descrição</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span className="text-zinc-300">Destaque na Homepage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bestSeller}
                onChange={(e) => setBestSeller(e.target.checked)}
              />
              <span className="text-zinc-300">Mais Vendido</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-sm uppercase rounded-xl cursor-pointer"
          >
            Salvar Sneaker
          </button>
        </form>
      </div>
    </div>
  );
};

// Subcomponent: BannerFormModal
interface BannerFormModalProps {
  banner: Banner | null;
  onClose: () => void;
  onSave: (banner: Banner) => void;
}

const BannerFormModal: React.FC<BannerFormModalProps> = ({ banner, onClose, onSave }) => {
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [badgeText, setBadgeText] = useState(banner?.badgeText || 'OFF.SNEAKERSOFC — SNEAKER RESELLER');
  const [buttonText, setButtonText] = useState(banner?.buttonText || 'EXPLORAR COLEÇÃO');
  const [buttonLink, setButtonLink] = useState(banner?.buttonLink || 'catalog');
  const [desktopImage, setDesktopImage] = useState(
    banner?.desktopImage || '/src/assets/images/hero_sneaker_reseller_urban_1794010894924.jpg'
  );
  const [mobileImage, setMobileImage] = useState(banner?.mobileImage || '');
  const [focalPoint, setFocalPoint] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>(
    banner?.focalPoint || 'center'
  );
  const [active, setActive] = useState(banner?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desktopImage) return;

    onSave({
      id: banner?.id || `banner-${Date.now()}`,
      title,
      subtitle,
      badgeText,
      buttonText,
      buttonLink,
      desktopImage,
      mobileImage: mobileImage || undefined,
      focalPoint,
      objectFit: 'cover',
      active,
      order: banner?.order || 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#181818] border border-zinc-800 rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-anton text-xl text-white uppercase">
            {banner ? 'Editar Banner Promocional' : 'Criar Novo Banner'}
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">Título do Banner *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">Subtítulo</label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Texto do Botão</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Link de Destino</label>
              <input
                type="text"
                value={buttonLink}
                onChange={(e) => setButtonLink(e.target.value)}
                placeholder="catalog ou catalog?brand=Jordan"
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">URL Imagem Desktop *</label>
            <input
              type="text"
              required
              value={desktopImage}
              onChange={(e) => setDesktopImage(e.target.value)}
              className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">URL Imagem Mobile (Opcional)</label>
            <input
              type="text"
              value={mobileImage}
              onChange={(e) => setMobileImage(e.target.value)}
              placeholder="Deixe em branco para usar a mesma do desktop"
              className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Ponto Focal da Imagem</label>
              <select
                value={focalPoint}
                onChange={(e) => setFocalPoint(e.target.value as any)}
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white cursor-pointer"
              >
                <option value="center">Centro</option>
                <option value="top">Superior</option>
                <option value="bottom">Inferior</option>
                <option value="left">Esquerda</option>
                <option value="right">Direita</option>
              </select>
            </div>

            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span className="text-zinc-300">Ativar Banner na Loja</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-sm uppercase rounded-xl cursor-pointer"
          >
            Salvar Banner
          </button>
        </form>
      </div>
    </div>
  );
};
