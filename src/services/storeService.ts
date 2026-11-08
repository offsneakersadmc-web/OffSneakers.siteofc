import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Product,
  Order,
  StoreSettings,
  DesignSettings,
  FaqItem,
  MediaItem,
  Banner,
  CartItem,
  OrderStatus
} from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-jordan-1-chicago',
    name: "Air Jordan 1 Retro High OG 'Chicago' Lost & Found",
    brand: 'Jordan',
    model: 'Air Jordan 1 High',
    description: 'Um dos modelos mais icônicos da história da cultura sneaker. O Air Jordan 1 Chicago Lost & Found revive a silhueta clássica de 1985 com acabamento premium vintage em couro craquelado, caixa envelhecida original e recibo comemorativo. 100% autêntico e verificado item a item.',
    images: ['/src/assets/images/product_jordan_retro_high_1794010895050.jpg'],
    price: 1890,
    originalPrice: 2450,
    discountPercent: 22,
    sizes: ['38', '39', '40', '41', '42', '43'],
    inventory: { '38': 2, '39': 3, '40': 4, '41': 2, '42': 1, '43': 0 },
    category: 'Sneakers',
    colorway: 'Chicago Red / White / Black',
    gender: 'Unissex',
    featured: true,
    bestSeller: true,
    newRelease: false,
    status: 'active',
    sku: 'DZ5485-612',
    condition: 'Novo na Caixa Original com Tags',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-travis-scott-olive',
    name: 'Air Jordan 1 Low x Travis Scott Reverse Mocha Olive',
    brand: 'Jordan',
    model: 'Air Jordan 1 Low',
    description: 'Colaboração histórica entre Jordan Brand e o rapper Travis Scott. Apresenta o icônico swoosh invertido, camurça nobuck aveludada em tom olive militar, detalhes em couro premium branco e bordados Cactus Jack nos calcanhares.',
    images: ['/src/assets/images/product_travis_scott_olive_1794010896906.jpg'],
    price: 2490,
    originalPrice: 3800,
    discountPercent: 34,
    sizes: ['38', '39', '40', '41', '42'],
    inventory: { '38': 1, '39': 0, '40': 2, '41': 3, '42': 1 },
    category: 'Edição Limitada',
    colorway: 'Medium Olive / Sail / University Red',
    gender: 'Unissex',
    featured: true,
    bestSeller: true,
    newRelease: true,
    status: 'active',
    sku: 'DM7866-162',
    condition: 'Novo na Caixa com Card Especial e Cadarços Extras',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-yeezy-boost-350',
    name: 'Adidas Yeezy Boost 350 V2 Bone White Cream',
    brand: 'Adidas',
    model: 'Yeezy Boost 350 V2',
    description: 'Máximo conforto com tecnologia de amortecimento Boost em toda a extensão da sola. Cabedal monocromático em Primeknit respirável translúcido e design futurista clean que combina com qualquer composição de streetwear.',
    images: ['/src/assets/images/product_yeezy_boost_350_1794010895351.jpg'],
    price: 1390,
    originalPrice: 1850,
    discountPercent: 24,
    sizes: ['37', '38', '39', '40', '41', '42', '43', '44'],
    inventory: { '37': 1, '38': 2, '39': 3, '40': 4, '41': 5, '42': 2, '43': 1, '44': 0 },
    category: 'Sneakers',
    colorway: 'Bone / Pure White',
    gender: 'Unissex',
    featured: true,
    bestSeller: true,
    newRelease: false,
    status: 'active',
    sku: 'HQ6316',
    condition: 'Novo na Caixa com etiquetas originais',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-dunk-low-panda',
    name: 'Nike Dunk Low Retro Black & White Panda',
    brand: 'Nike',
    model: 'Dunk Low',
    description: 'O sneaker mais versátil do streetwear mundial. Construção em couro legítimo macio com contraste clássico preto e branco, entressola de espuma leve e sola de borracha durável com ponto de giro tradicional do basquete dos anos 80.',
    images: ['/src/assets/images/product_dunk_low_retro_1794010895819.jpg'],
    price: 790,
    originalPrice: 1100,
    discountPercent: 28,
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44'],
    inventory: { '36': 2, '37': 3, '38': 4, '39': 5, '40': 8, '41': 6, '42': 4, '43': 2, '44': 1 },
    category: 'Sneakers',
    colorway: 'White / Black',
    gender: 'Unissex',
    featured: false,
    bestSeller: true,
    newRelease: false,
    status: 'active',
    sku: 'DD1391-100',
    condition: 'Novo na Caixa Original Lacrada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-jordan-4-military-black',
    name: 'Air Jordan 4 Retro Military Black Premium',
    brand: 'Jordan',
    model: 'Air Jordan 4',
    description: 'Construção estruturada imponente com painéis em couro branco liso, detalhes em camurça cinza neutra e asas de suporte pretas. Unidade Air visível no calcanhar que garante absorção de impacto com visual marcante.',
    images: ['/src/assets/images/hero_sneaker_reseller_urban_1794010894924.jpg'],
    price: 2190,
    originalPrice: 2950,
    discountPercent: 25,
    sizes: ['39', '40', '41', '42', '43'],
    inventory: { '39': 1, '40': 3, '41': 4, '42': 2, '43': 0 },
    category: 'Edição Limitada',
    colorway: 'White / Black / Neutral Grey',
    gender: 'Unissex',
    featured: true,
    bestSeller: false,
    newRelease: true,
    status: 'active',
    sku: 'DH6927-111',
    condition: 'Novo na Caixa com Hangtag Original',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    title: 'SEU ESTILO. SUAS MARCAS. SEU MELHOR PREÇO.',
    subtitle: 'Descubra uma seleção exclusiva de sneakers e artigos de marcas reconhecidas com condições especiais.',
    buttonText: 'EXPLORAR COLEÇÃO',
    buttonLink: 'catalog',
    badgeText: 'OFF.SNEAKERSOFC — SNEAKER RESELLER',
    desktopImage: '/src/assets/images/hero_sneaker_reseller_urban_1794010894924.jpg',
    focalPoint: 'center',
    objectFit: 'cover',
    active: true,
    order: 1
  },
  {
    id: 'banner-2',
    title: 'AIR JORDAN RETRO & HIGH-HEAT DROPS',
    subtitle: 'Autenticidade física garantida e procedência verificável par a par. Modelos cobiçados para envio imediato.',
    buttonText: 'VER COLEÇÃO JORDAN',
    buttonLink: 'catalog?brand=Jordan',
    badgeText: 'DROPS EXCLUSIVOS',
    desktopImage: '/src/assets/images/product_jordan_retro_high_1794010895050.jpg',
    focalPoint: 'center',
    objectFit: 'cover',
    active: true,
    order: 2
  },
  {
    id: 'banner-3',
    title: '5% OFF NO PIX & ATENDIMENTO VIP',
    subtitle: 'Solicite vídeos reais do par em estoque e confirme seu envio diretamente no WhatsApp oficial.',
    buttonText: 'CONHECER VANTAGENS',
    buttonLink: 'catalog',
    badgeText: 'ATENDIMENTO HUMANO',
    desktopImage: '/src/assets/images/product_travis_scott_olive_1794010896906.jpg',
    focalPoint: 'center',
    objectFit: 'cover',
    active: true,
    order: 3
  }
];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'OFF.SNEAKERSOFC',
  slogan: 'SNEAKER RESELLER.',
  whatsappNumber: '5511998765432',
  whatsappWelcomeMsg: 'Olá! Vim pelo site da OFF.SNEAKERSOFC e gostaria de atendimento sobre um sneaker.',
  email: 'offsneakers.admc@gmail.com',
  instagram: '@off.sneakersofc',
  address: 'Salvador, BA — Atendimento Especializado',
  freeShippingThreshold: 999,
  pixDiscountPercent: 5,
  pixKey: 'offsneakers.admc@gmail.com',
  pixKeyType: 'Chave E-mail',
  brands: ['Jordan', 'Nike', 'Adidas', 'Yeezy', 'Travis Scott', 'New Balance', 'Asics', 'Puma'],
  categories: ['Sneakers', 'Edição Limitada', 'Streetwear', 'Vestuário', 'Acessórios'],
  orderNotificationEmail: 'offsneakers.admc@gmail.com',
  clientConfirmationEmailEnabled: true,
  emailSenderName: 'OFF.SNEAKERSOFC Reseller',
  emailSenderFrom: 'pedidos@offsneakers.com.br',
  emailProvider: 'simulation'
};

export const INITIAL_DESIGN_SETTINGS: DesignSettings = {
  primaryColor: '#C9000B',
  primaryDark: '#850008',
  black: '#111111',
  white: '#FFFFFF',
  heroTitle: 'SEU ESTILO. SUAS MARCAS. SEU MELHOR PREÇO.',
  heroSubtitle: 'Descubra uma seleção exclusiva de sneakers e artigos de marcas reconhecidas com condições especiais.',
  heroButtonText: 'EXPLORAR COLEÇÃO',
  heroBadgeText: 'OFF.SNEAKERSOFC — SNEAKER RESELLER',
  heroImage: '/src/assets/images/hero_sneaker_reseller_urban_1794010894924.jpg',
  announcementText: '🔥 SEDE EM SALVADOR, BA • ENVIAMOS PARA TODO O BRASIL • 100% AUTÊNTICOS • ATENDIMENTO VIP NO WHATSAPP • 5% OFF NO PIX',
  banners: INITIAL_BANNERS,
  carouselInterval: 6,
  sections: [
    { id: 'hero', name: 'Banner Principal / Carrossel', enabled: true, order: 1 },
    { id: 'benefits', name: 'Diferenciais & Benefícios', enabled: true, order: 2 },
    { id: 'featured', name: 'Ofertas em Destaque', enabled: true, order: 3 },
    { id: 'bestsellers', name: 'Mais Vendidos', enabled: true, order: 4 },
    { id: 'releases', name: 'Lançamentos & Novidades', enabled: true, order: 5 },
    { id: 'brands', name: 'Marcas Reconhecidas', enabled: true, order: 6 },
    { id: 'about', name: 'Sobre a OFF.SNEAKERSOFC', enabled: true, order: 7 },
    { id: 'faq', name: 'Perguntas Frequentes (FAQ)', enabled: true, order: 8 },
    { id: 'trust', name: 'Garantia de Autenticidade', enabled: true, order: 9 }
  ],
  version: 1,
  lastPublishedAt: new Date().toISOString()
};

export const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Os produtos da OFF.SNEAKERSOFC são 100% originais?',
    answer: 'Sim. Todos os sneakers, calçados e artigos comercializados pela OFF.SNEAKERSOFC passam por minuciosa verificação de autenticidade (legit check físico) em costuras, palmilhas, etiquetas e caixas antes de serem disponibilizados.',
    order: 1
  },
  {
    id: 'faq-2',
    question: 'Como funciona o processo de compra pelo site?',
    answer: 'Você escolhe o modelo desejado, seleciona seu tamanho disponível e adiciona ao carrinho. No checkout, preenche seus dados de entrega e clica em PROSSEGUIR PARA PAGAMENTO. Nosso sistema registra o pedido no banco de dados e abre uma conversa pronta no WhatsApp oficial com todas as informações.',
    order: 2
  },
  {
    id: 'faq-3',
    question: 'Por que a finalização é feita no WhatsApp?',
    answer: 'Para garantir um atendimento humanizado, seguro e transparente. Pelo WhatsApp você pode solicitar fotos e vídeos reais do par em estoque, tirar dúvidas sobre o caimento no pé e combinar o envio com o atendente antes de transferir qualquer valor.',
    order: 3
  },
  {
    id: 'faq-4',
    question: 'Quais as formas de pagamento disponíveis?',
    answer: 'Aceitamos PIX com 5% de desconto automático e cartão de crédito em até 12x mediante link de pagamento seguro intermediado pelo atendente no WhatsApp.',
    order: 4
  },
  {
    id: 'faq-5',
    question: 'Como funciona a entrega e de onde os produtos são despachados?',
    answer: 'Nossa base operacional e curadoria física está sediada em Salvador, BA. Despachamos pedidos com seguro total para todas as cidades do Brasil via Correios (Sedex ou PAC) e transportadoras parceiras, com código de rastreamento enviado via WhatsApp e e-mail.',
    order: 5
  },
  {
    id: 'faq-6',
    question: 'Como funciona a política de trocas e devoluções?',
    answer: 'Em cumprimento ao Código de Defesa do Consumidor, você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução, desde que o produto esteja sem marcas de uso, na caixa original e com todas as tags preservadas.',
    order: 6
  }
];

export const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'media-hero-urban',
    name: 'Hero Urban Subway Sneaker',
    url: '/src/assets/images/hero_sneaker_reseller_urban_1794010894924.jpg',
    category: 'banners',
    dimensions: '1920x1080',
    size: '420 KB',
    uploadedAt: new Date().toISOString()
  },
  {
    id: 'media-jordan-chicago',
    name: 'Jordan 1 Retro High Chicago Lost & Found',
    url: '/src/assets/images/product_jordan_retro_high_1794010895050.jpg',
    category: 'products',
    dimensions: '1024x768',
    size: '280 KB',
    uploadedAt: new Date().toISOString()
  },
  {
    id: 'media-travis-scott',
    name: 'Jordan 1 Low Travis Scott Reverse Mocha Olive',
    url: '/src/assets/images/product_travis_scott_olive_1794010896906.jpg',
    category: 'products',
    dimensions: '1024x768',
    size: '310 KB',
    uploadedAt: new Date().toISOString()
  },
  {
    id: 'media-yeezy-350',
    name: 'Adidas Yeezy Boost 350 V2 Bone',
    url: '/src/assets/images/product_yeezy_boost_350_1794010895351.jpg',
    category: 'products',
    dimensions: '1024x768',
    size: '260 KB',
    uploadedAt: new Date().toISOString()
  },
  {
    id: 'media-dunk-panda',
    name: 'Nike Dunk Low Retro Panda',
    url: '/src/assets/images/product_dunk_low_retro_1794010895819.jpg',
    category: 'products',
    dimensions: '1024x768',
    size: '290 KB',
    uploadedAt: new Date().toISOString()
  },
  {
    id: 'media-logo-oficial',
    name: 'Logo Oficial OFF.SNEAKERSOFC',
    url: '/assets/aistudio/Perfil_Instagram_OFFSNEAKERS1_97329a12.png',
    category: 'institucional',
    dimensions: '800x800',
    size: '180 KB',
    uploadedAt: new Date().toISOString()
  }
];

class StoreService {
  private localProducts: Product[] = [];
  private localOrders: Order[] = [];
  private localSettings: StoreSettings = INITIAL_STORE_SETTINGS;
  private localDesign: DesignSettings = INITIAL_DESIGN_SETTINGS;
  private localFaqs: FaqItem[] = INITIAL_FAQS;
  private localMedia: MediaItem[] = INITIAL_MEDIA;
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const p = localStorage.getItem('offsneakers_products');
      this.localProducts = p ? JSON.parse(p) : INITIAL_PRODUCTS;

      const o = localStorage.getItem('offsneakers_orders');
      this.localOrders = o ? JSON.parse(o) : [];

      const s = localStorage.getItem('offsneakers_settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (!parsed.address || !parsed.address.includes('Salvador')) {
          parsed.address = 'Salvador, BA — Atendimento Especializado';
        }
        parsed.storeName = 'OFF.SNEAKERSOFC';
        this.localSettings = { ...INITIAL_STORE_SETTINGS, ...parsed };
      } else {
        this.localSettings = INITIAL_STORE_SETTINGS;
      }

      const d = localStorage.getItem('offsneakers_design');
      this.localDesign = d ? { ...INITIAL_DESIGN_SETTINGS, ...JSON.parse(d) } : INITIAL_DESIGN_SETTINGS;

      const f = localStorage.getItem('offsneakers_faqs');
      this.localFaqs = f ? JSON.parse(f) : INITIAL_FAQS;

      const m = localStorage.getItem('offsneakers_media');
      this.localMedia = m ? JSON.parse(m) : INITIAL_MEDIA;
    } catch {
      this.localProducts = INITIAL_PRODUCTS;
      this.localOrders = [];
      this.localSettings = INITIAL_STORE_SETTINGS;
      this.localDesign = INITIAL_DESIGN_SETTINGS;
      this.localFaqs = INITIAL_FAQS;
      this.localMedia = INITIAL_MEDIA;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('offsneakers_products', JSON.stringify(this.localProducts));
      localStorage.setItem('offsneakers_orders', JSON.stringify(this.localOrders));
      localStorage.setItem('offsneakers_settings', JSON.stringify(this.localSettings));
      localStorage.setItem('offsneakers_design', JSON.stringify(this.localDesign));
      localStorage.setItem('offsneakers_faqs', JSON.stringify(this.localFaqs));
      localStorage.setItem('offsneakers_media', JSON.stringify(this.localMedia));
    } catch (e) {
      console.warn('Storage save fallback', e);
    }
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      // Products sync
      const productsRef = collection(db, 'products');
      const productsSnap = await getDocs(productsRef);
      if (productsSnap.empty) {
        for (const item of INITIAL_PRODUCTS) {
          await setDoc(doc(db, 'products', item.id), item);
        }
      }

      onSnapshot(productsRef, (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => list.push(d.data() as Product));
          this.localProducts = list;
          this.saveToStorage();
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

      // Orders sync
      const ordersRef = collection(db, 'orders');
      onSnapshot(ordersRef, (snapshot) => {
        if (!snapshot.empty) {
          const list: Order[] = [];
          snapshot.forEach((d) => list.push(d.data() as Order));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.localOrders = list;
          this.saveToStorage();
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

      // Store settings sync
      const storeRef = doc(db, 'store_settings', 'current');
      const storeSnap = await getDoc(storeRef);
      if (!storeSnap.exists()) {
        await setDoc(storeRef, INITIAL_STORE_SETTINGS);
      } else {
        const snapData = storeSnap.data() as Partial<StoreSettings>;
        if (!snapData.address || !snapData.address.includes('Salvador') || snapData.storeName !== 'OFF.SNEAKERSOFC') {
          await updateDoc(storeRef, {
            address: 'Salvador, BA — Atendimento Especializado',
            storeName: 'OFF.SNEAKERSOFC'
          }).catch(() => {});
        }
      }
      onSnapshot(storeRef, (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as StoreSettings;
          const safeAddress = remoteData.address && remoteData.address.includes('Salvador')
            ? remoteData.address
            : 'Salvador, BA — Atendimento Especializado';
          this.localSettings = {
            ...INITIAL_STORE_SETTINGS,
            ...remoteData,
            storeName: 'OFF.SNEAKERSOFC',
            address: safeAddress
          };
          this.saveToStorage();
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, 'store_settings/current'));

      // Design settings sync
      const designRef = doc(db, 'design_settings', 'current');
      const designSnap = await getDoc(designRef);
      if (!designSnap.exists()) {
        await setDoc(designRef, INITIAL_DESIGN_SETTINGS);
      }
      onSnapshot(designRef, (snap) => {
        if (snap.exists()) {
          this.localDesign = { ...INITIAL_DESIGN_SETTINGS, ...(snap.data() as DesignSettings) };
          this.saveToStorage();
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, 'design_settings/current'));

    } catch (e) {
      console.warn('Firestore initial sync operating with local seed', e);
    }
  }

  // Stock Validation Engine
  validateCartStock(cart: CartItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const item of cart) {
      const currentProduct = this.localProducts.find((p) => p.id === item.product.id);
      if (!currentProduct) {
        errors.push(`O produto "${item.product.name}" não está mais disponível.`);
        continue;
      }
      const available = currentProduct.inventory[String(item.size)] ?? 0;
      if (available <= 0) {
        errors.push(`O tamanho ${item.size} de "${item.product.name}" acabou de esgotar.`);
      } else if (item.quantity > available) {
        errors.push(`Há apenas ${available} unidade(s) do tamanho ${item.size} de "${item.product.name}". Ajuste a quantidade.`);
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Decrement Stock on Checkout
  async decrementOrderStock(cart: CartItem[]): Promise<void> {
    for (const item of cart) {
      const prod = this.localProducts.find((p) => p.id === item.product.id);
      if (prod) {
        const currentQty = prod.inventory[String(item.size)] ?? 0;
        const newQty = Math.max(0, currentQty - item.quantity);
        prod.inventory[String(item.size)] = newQty;
        // check if all sizes are 0
        const totalStock = Object.values(prod.inventory).reduce((a, b) => a + b, 0);
        if (totalStock <= 0) {
          prod.status = 'out_of_stock';
        }
        await this.saveProduct(prod);
      }
    }
  }

  // Products
  getProducts(): Product[] {
    return this.localProducts.length > 0 ? this.localProducts : INITIAL_PRODUCTS;
  }

  async saveProduct(product: Product): Promise<void> {
    const idx = this.localProducts.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      this.localProducts[idx] = { ...product, updatedAt: new Date().toISOString() };
    } else {
      this.localProducts.unshift({ ...product, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.saveToStorage();

    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    this.localProducts = this.localProducts.filter(p => p.id !== productId);
    this.saveToStorage();

    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  }

  // Brands & Categories
  getBrands(): string[] {
    return this.localSettings.brands || INITIAL_STORE_SETTINGS.brands;
  }

  async addBrand(brandName: string): Promise<void> {
    const clean = brandName.trim();
    if (!clean) return;
    const current = this.getBrands();
    if (!current.includes(clean)) {
      const updated = [...current, clean];
      await this.saveSettings({ ...this.localSettings, brands: updated });
    }
  }

  async removeBrand(brandName: string): Promise<void> {
    const current = this.getBrands();
    const updated = current.filter(b => b.toLowerCase() !== brandName.toLowerCase());
    await this.saveSettings({ ...this.localSettings, brands: updated });
  }

  getCategories(): string[] {
    return this.localSettings.categories || INITIAL_STORE_SETTINGS.categories;
  }

  async addCategory(catName: string): Promise<void> {
    const clean = catName.trim();
    if (!clean) return;
    const current = this.getCategories();
    if (!current.includes(clean)) {
      const updated = [...current, clean];
      await this.saveSettings({ ...this.localSettings, categories: updated });
    }
  }

  async removeCategory(catName: string): Promise<void> {
    const current = this.getCategories();
    const updated = current.filter(c => c.toLowerCase() !== catName.toLowerCase());
    await this.saveSettings({ ...this.localSettings, categories: updated });
  }

  // Orders
  getOrders(): Order[] {
    return this.localOrders;
  }

  async createOrder(order: Order): Promise<void> {
    this.localOrders.unshift(order);
    this.saveToStorage();

    try {
      await setDoc(doc(db, 'orders', order.id), order);
      await this.recordEvent('order_placed', { orderId: order.id, total: order.total });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${order.id}`);
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    operator = 'Admin',
    notes?: string,
    trackingCode?: string
  ): Promise<void> {
    const o = this.localOrders.find(item => item.id === orderId);
    const now = new Date().toISOString();
    if (o) {
      o.status = status;
      if (notes !== undefined) o.notes = notes;
      if (trackingCode !== undefined) o.trackingCode = trackingCode;
      o.updatedAt = now;
      if (!o.history) o.history = [];
      o.history.unshift({
        timestamp: now,
        action: `Status alterado para "${status}"`,
        operator,
        note: notes
      });
      this.saveToStorage();
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        ...(notes !== undefined ? { notes } : {}),
        ...(trackingCode !== undefined ? { trackingCode } : {}),
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  }

  async updateOrderEmailStatus(
    orderId: string,
    status: 'sent' | 'failed' | 'pending' | 'not_configured',
    errorMsg?: string
  ): Promise<void> {
    const o = this.localOrders.find(item => item.id === orderId);
    if (o) {
      o.emailNotificationStatus = status;
      if (errorMsg) o.emailErrorMessage = errorMsg;
      if (status === 'sent') o.emailSentAt = new Date().toISOString();
      this.saveToStorage();
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        emailNotificationStatus: status,
        ...(errorMsg ? { emailErrorMessage: errorMsg } : {}),
        ...(status === 'sent' ? { emailSentAt: new Date().toISOString() } : {}),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  }

  // Settings
  getSettings(): StoreSettings {
    return this.localSettings;
  }

  async saveSettings(settings: StoreSettings): Promise<void> {
    this.localSettings = settings;
    this.saveToStorage();
    try {
      await setDoc(doc(db, 'store_settings', 'current'), settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'store_settings/current');
    }
  }

  // Design & Banners
  getDesign(): DesignSettings {
    return this.localDesign;
  }

  async saveDesign(design: DesignSettings, publish = false): Promise<void> {
    this.localDesign = {
      ...design,
      version: design.version + 1,
      ...(publish ? { lastPublishedAt: new Date().toISOString() } : {})
    };
    this.saveToStorage();

    try {
      const targetDoc = publish ? 'current' : 'draft';
      await setDoc(doc(db, 'design_settings', targetDoc), this.localDesign);
      if (publish) {
        await setDoc(doc(db, 'design_settings', 'draft'), this.localDesign);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `design_settings/${publish ? 'current' : 'draft'}`);
    }
  }

  // Media Library
  getMediaItems(): MediaItem[] {
    return this.localMedia;
  }

  async saveMediaItem(item: MediaItem): Promise<void> {
    const idx = this.localMedia.findIndex(m => m.id === item.id);
    if (idx >= 0) {
      this.localMedia[idx] = item;
    } else {
      this.localMedia.unshift(item);
    }
    this.saveToStorage();

    try {
      await setDoc(doc(db, 'media', item.id), item);
    } catch {
      // quiet fallback
    }
  }

  async deleteMediaItem(id: string): Promise<void> {
    this.localMedia = this.localMedia.filter(m => m.id !== id);
    this.saveToStorage();

    try {
      await deleteDoc(doc(db, 'media', id));
    } catch {
      // quiet fallback
    }
  }

  // FAQs
  getFaqs(): FaqItem[] {
    return this.localFaqs;
  }

  async saveFaqs(faqs: FaqItem[]): Promise<void> {
    this.localFaqs = faqs;
    this.saveToStorage();
    try {
      for (const faq of faqs) {
        await setDoc(doc(db, 'faqs', faq.id), faq);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'faqs');
    }
  }

  async recordEvent(eventName: string, details: Record<string, unknown> = {}): Promise<void> {
    try {
      const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await setDoc(doc(db, 'analytics', id), {
        eventName,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // quiet fallback
    }
  }

  // Full System Backup Export & Restore
  createBackupJSON(): string {
    const data = {
      timestamp: new Date().toISOString(),
      storeName: 'OFF.SNEAKERSOFC',
      version: '2.0-PRO',
      products: this.localProducts,
      orders: this.localOrders,
      settings: this.localSettings,
      design: this.localDesign,
      faqs: this.localFaqs,
      media: this.localMedia,
    };
    return JSON.stringify(data, null, 2);
  }

  restoreFromJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) {
        this.localProducts = data.products;
      }
      if (data.orders && Array.isArray(data.orders)) {
        this.localOrders = data.orders;
      }
      if (data.settings) {
        this.localSettings = { ...INITIAL_STORE_SETTINGS, ...data.settings };
      }
      if (data.design) {
        this.localDesign = { ...INITIAL_DESIGN_SETTINGS, ...data.design };
      }
      if (data.faqs && Array.isArray(data.faqs)) {
        this.localFaqs = data.faqs;
      }
      if (data.media && Array.isArray(data.media)) {
        this.localMedia = data.media;
      }
      this.saveToStorage();

      for (const p of this.localProducts) {
        setDoc(doc(db, 'products', p.id), p).catch(() => {});
      }
      setDoc(doc(db, 'store_settings', 'current'), this.localSettings).catch(() => {});
      setDoc(doc(db, 'design_settings', 'current'), this.localDesign).catch(() => {});
      return true;
    } catch (e) {
      console.error('Failed to restore backup', e);
      return false;
    }
  }
}

export const storeService = new StoreService();
