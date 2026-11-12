export interface ProductSpec {
  id: string;
  label: string;
  value: string;
}

export interface ProductImageMeta {
  objectFit?: 'contain' | 'cover';
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export interface ProductVersion {
  id: string;
  productId: string;
  name: string;
  editionName?: string;
  colorName: string;
  colorHex?: string;
  description?: string;
  specs?: ProductSpec[];
  images: string[];
  imageMeta?: Record<string, ProductImageMeta>;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  weightGrams?: number;
  dimensionsCm?: string;
  sizes: string[];
  inventory: Record<string, number>;
  active: boolean;
  hidden?: boolean;
  isDefault?: boolean;
  isFeatured?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  description: string;
  specs?: ProductSpec[];
  images: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  sizes: string[]; // Dynamic sizes: e.g. ["37", "38", "39", "40", "41", "42"] or custom
  inventory: Record<string, number>; // e.g. { "37": 2, "38": 5, "39": 1, "40": 0 }
  category: string;
  colorway?: string;
  gender?: string;
  featured?: boolean;
  bestSeller?: boolean;
  newRelease?: boolean;
  status: 'active' | 'out_of_stock' | 'archived';
  sku?: string;
  condition?: string;
  pricingMode?: 'shared' | 'individual';
  descriptionMode?: 'shared' | 'individual';
  specsMode?: 'shared' | 'individual';
  versions?: ProductVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  versionId: string;
  versionName: string;
  editionName?: string;
  colorName?: string;
  colorHex?: string;
  image?: string;
  unitPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  sku?: string;
  size: string;
  quantity: number;
}

export interface CustomerData {
  fullName: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type OrderStatus =
  | 'novo'
  | 'aguardando_atendimento'
  | 'em_negociacao'
  | 'aguardando_pagamento'
  | 'pago'
  | 'preparando'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export interface OrderItem {
  productId: string;
  versionId?: string;
  name: string;
  versionName?: string;
  editionName?: string;
  colorName?: string;
  brand: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountPercent?: number;
  image?: string;
  sku?: string;
  descriptionSnapshot?: string;
  specsSnapshot?: ProductSpec[];
}

export interface OrderHistoryEntry {
  timestamp: string;
  action: string;
  operator: string;
  note?: string;
}

export interface Order {
  id: string; // e.g. #OS-000101
  customer: CustomerData;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: 'PIX' | 'CARTAO' | 'OUTRA';
  status: OrderStatus;
  notes?: string;
  trackingCode?: string;
  attendant?: string;
  whatsappMessage?: string;
  emailNotificationStatus?: 'pending' | 'sent' | 'failed' | 'not_configured';
  customerEmailStatus?: 'pending' | 'sent' | 'failed' | 'not_configured';
  emailSentAt?: string;
  emailErrorMessage?: string;
  stockDeducted?: boolean;
  stockRestored?: boolean;
  stockRestoredAt?: string;
  history?: OrderHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  badgeText?: string;
  desktopImage: string;
  mobileImage?: string;
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  objectFit?: 'cover' | 'contain';
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

export interface StoreSettings {
  storeName: string;
  slogan: string;
  whatsappNumber: string; // e.g. "5511998765432"
  whatsappWelcomeMsg: string;
  email: string;
  instagram: string;
  address: string;
  freeShippingThreshold: number;
  pixDiscountPercent: number;
  pixKey: string;
  pixKeyType: string;
  brands: string[];
  categories: string[];
  orderNotificationEmail: string; // Where admin receives order alert
  clientConfirmationEmailEnabled: boolean;
  emailSenderName: string;
  emailSenderFrom: string;
  emailProvider?: 'resend' | 'smtp' | 'firebase' | 'simulation';
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

export interface SectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface DesignSettings {
  primaryColor: string; // #C9000B
  primaryDark: string; // #850008
  black: string; // #111111
  white: string; // #FFFFFF
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroBadgeText: string;
  heroImage: string;
  heroMobileImage?: string;
  announcementText: string;
  banners: Banner[];
  carouselInterval: number; // in seconds
  sections: SectionConfig[];
  version: number;
  lastPublishedAt?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  category: 'banners' | 'products' | 'institucional' | 'outros';
  size?: string;
  dimensions?: string;
  uploadedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface AnalyticsMetric {
  visitors: number;
  productViews: number;
  cartAdds: number;
  checkoutStarted: number;
  whatsappClicks: number;
  confirmedOrders: number;
  confirmedRevenue: number;
}
