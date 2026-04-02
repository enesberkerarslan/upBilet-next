export interface Admin {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  lastLogin: string | null;
  createdAt: string;
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  tag: 'FutbolTakımı' | 'BasketbolTakımı' | 'Sanatçı' | 'GenelTag' | 'EtkinlikAlanı' | 'AltTag';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Event {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  date: string;
  location: string;
  status: 'active' | 'inactive';
  tags: Tag[];
  listingCount: number;
  salesCount: number;
  commission: number;
  comissionCustomer: number;
  isMainPage: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Listing {
  _id: string;
  /** Müşteri / destek iletişimi (örn. ILN-XXXXXXXX) */
  referenceCode?: string;
  eventId: Event | string;
  memberId: Member | string;
  price: number;
  sellerAmount: number;
  ticketType: 'paper' | 'pdf' | 'e-ticket';
  quantity: number;
  soldQuantity: number;
  category: string;
  block?: string;
  row?: string;
  seat?: string;
  status: 'pending' | 'rejected' | 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

/** Satıcının yüklediği bilet kanıtı (üye API / S3) */
export interface SellerProofAttachment {
  url: string;
  fileKey?: string;
  originalName?: string;
  mimeType?: string;
  kind?: 'image' | 'pdf';
  uploadedAt?: string;
}

export interface TicketHolder {
  name?: string;
  surname?: string;
  nationality?: string;
  identityNumber?: string;
  passoligEmail?: string;
  passoligPassword?: string;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  deliveredAt?: string;
  proofPhotos?: { url: string }[];
  /** Satıcının bu bilet için yüklediği kanıt dosyaları */
  sellerProofAttachments?: SellerProofAttachment[];
}

export interface Sale {
  _id: string;
  /** Müşteri / destek iletişimi (örn. SAT-XXXXXXXX) */
  referenceCode?: string;
  eventId: Event | string;
  listingId: Listing | string;
  seller: Member | string;
  buyer: Member | string;
  ticketQuantity: number;
  category: string;
  block?: string;
  row?: string;
  seat?: string;
  ticketHolders: TicketHolder[];
  totalAmount: number;
  serviceFee: number;
  serviceFeeKdv: number;
  listingPrice: number;
  sellerAmount: number;
  sellerTotalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  status: 'active' | 'cancelled' | 'completed' | 'pending_approval' | 'approved' | 'rejected';
  deliveryStatus: 'pending' | 'partial' | 'delivered' | 'failed';
  saleDate: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  /** Mongoose sürümü — kayıt sonrası artar, form senkronu için */
  __v?: number;
}

export interface Address {
  _id: string;
  title: string;
  address: string;
  city: string;
  district: string;
  neighborhood: string;
  postalCode: string;
}

export interface BankAccount {
  _id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  swiftCode?: string;
}

export interface PaymentPeriod {
  _id: string;
  startDate: string;
  endDate: string;
  /** Populate edildiğinde satış nesneleri dönebilir */
  sales: Array<string | { _id: string }>;
  totalAmount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  paidBy?: string;
}

export interface MemberFavoriteTag {
  _id: string;
  name: string;
  slug: string;
  tag?: string;
}

export interface Member {
  _id: string;
  name: string;
  surname: string;
  email: string;
  role: 'user' | 'broker';
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  addresses: Address[];
  bankAccounts: BankAccount[];
  paymentPeriods: PaymentPeriod[];
  /** Admin get-member-by-id populate eder */
  favorites?: {
    events?: string[];
    tags?: MemberFavoriteTag[];
  };
  lastLogin: string | null;
  createdAt: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  coverImageUrl?: string;
  content: { text?: string; imageUrl?: string }[];
  createdAt: string;
}

export interface VenueStructure {
  _id: string;
  venueId: Tag | string;
  categories: {
    _id: string;
    name: string;
    blocks: { _id: string; name: string }[];
  }[];
}

export interface Media {
  _id: string;
  fileName: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface HomePage {
  _id?: string;
  hero: {
    backgroundImageUrl: string;
    homeTeamName: string;
    homeTeamLink: string;
    awayTeamName: string;
    awayTeamLink: string;
    dateText: string;
    timeText: string;
    venue: string;
    description: string;
    ticketLink: string;
  };
  banners: { imageUrl: string; link: string; label: string }[];
  isPublished: boolean;
}

export interface SupportAttachment {
  url: string;
  fileKey: string;
  originalName: string;
  mimeType: string;
  kind: 'image' | 'pdf';
}

export interface SupportTopicListItem {
  _id: string;
  subject: string;
  status: 'open' | 'closed';
  unreadForAdmin: boolean;
  unreadForMember: boolean;
  referenceSaleId?: string | { _id: string; referenceCode?: string } | null;
  memberId:
    | string
    | {
        _id: string;
        name?: string;
        surname?: string;
        email?: string;
      };
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessageRow {
  _id: string;
  body: string;
  fromRole: 'member' | 'admin';
  attachments: SupportAttachment[];
  createdAt: string;
  fromMemberId?:
    | string
    | null
    | { _id: string; name?: string; surname?: string; email?: string };
  fromUserId?: string | null | { _id: string; fullName?: string; email?: string };
}

export interface SupportTopicDetailPayload {
  topic: SupportTopicListItem & {
    memberId: {
      _id: string;
      name?: string;
      surname?: string;
      email?: string;
      phone?: string;
    };
    referenceSaleId?: unknown;
  };
  messages: SupportMessageRow[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}
