import { userApi } from "@/lib/api/axios-client";

export type BankAccountRecord = {
  _id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  swiftCode?: string;
};

export type AddressRecord = {
  _id: string;
  title: string;
  address: string;
  city: string;
  district: string;
  neighborhood: string;
  postalCode: string;
};

export type PaymentPeriodRecord = {
  _id: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  status?: string;
  paidAt?: string | null;
};

export type MemberProfile = {
  _id?: string;
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  nationality?: string;
  identityNumber?: string;
  gender?: string;
  passoligEmail?: string;
  passoligPassword?: string;
  bankAccounts?: BankAccountRecord[];
  addresses?: AddressRecord[];
  paymentPeriods?: PaymentPeriodRecord[];
};

export async function apiGetProfile() {
  const { data } = await userApi.get<{ success: boolean; member?: MemberProfile; error?: string }>("/profile");
  return data;
}

export async function apiUpdateProfile(body: Partial<MemberProfile>) {
  const { data } = await userApi.put<{ success: boolean; member?: MemberProfile; error?: string }>(
    "/profile",
    body
  );
  return data;
}

export async function apiChangePassword(oldPassword: string, newPassword: string) {
  const { data } = await userApi.post<{ success: boolean; message?: string; error?: string }>(
    "/profile/change-password",
    { oldPassword, newPassword }
  );
  return data;
}

export async function apiChangePhone(phone: string) {
  const { data } = await userApi.post<{ success: boolean; member?: MemberProfile; error?: string }>(
    "/profile/change-phone",
    { phone }
  );
  return data;
}

export type SaleEvent = { name?: string; date?: string; location?: string };

export type TicketHolderRecord = {
  name?: string;
  surname?: string;
  nationality?: string;
  identityNumber?: string;
  passoligEmail?: string;
  passoligPassword?: string;
  sellerProofAttachments?: { url: string; originalName?: string; mimeType?: string }[];
};

export type SaleRecord = {
  _id: string;
  saleDate?: string;
  status?: string;
  totalAmount?: number;
  listingPrice?: number;
  serviceFee?: number;
  serviceFeeKdv?: number;
  sellerTotalAmount?: number;
  ticketQuantity?: number;
  category?: string;
  block?: string;
  row?: string;
  seat?: string;
  ticketHolders?: TicketHolderRecord[];
  eventId?: SaleEvent | string;
};

export async function apiGetMyPurchases() {
  const { data } = await userApi.get<{ success: boolean; data?: SaleRecord[]; message?: string }>("/sales");
  return data;
}

export async function apiCreateSale(body: Record<string, unknown>) {
  const { data } = await userApi.post<{ success: boolean; data?: { _id: string }; message?: string }>(
    "/sales",
    body
  );
  return data;
}

export async function apiGetMySales() {
  const { data } = await userApi.get<{ success: boolean; data?: SaleRecord[]; message?: string }>(
    "/sales/my-sales"
  );
  return data;
}

export async function apiUploadSellerProof(saleId: string, ticketIndex: number, file: File) {
  const fd = new FormData();
  fd.append("files", file);
  const { data } = await userApi.post<{ success: boolean; data?: unknown; message?: string }>(
    `/sales/${encodeURIComponent(saleId)}/ticket-holders/${ticketIndex}/seller-proof`,
    fd
  );
  return data;
}

export type ListingRecord = {
  _id: string;
  createdAt?: string;
  status?: string;
  price?: number;
  sellerAmount?: number;
  ticketType?: string;
  quantity?: number;
  soldQuantity?: number;
  category?: string;
  block?: string;
  row?: string;
  seat?: string;
  referenceCode?: string;
  eventId?: (SaleEvent & { _id?: string }) | string;
};

export type ListingsPagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  itemsPerPage: number;
};

export async function apiGetListings(page = 1, limit = 10) {
  const { data } = await userApi.get<{
    success: boolean;
    listings?: ListingRecord[];
    pagination?: ListingsPagination;
    error?: string;
  }>(`/listings?page=${page}&limit=${limit}`);
  return data;
}

export type CreateListingPayload = {
  eventId: string;
  price: number;
  category: string;
  ticketType: string;
  quantity: number;
  block?: string;
  row?: string;
  seat?: string;
};

export async function apiCreateListing(body: CreateListingPayload) {
  const { data } = await userApi.post<{
    success: boolean;
    listing?: ListingRecord;
    error?: string | string[];
  }>("/listings", body);
  return data;
}

export type ListingUpdatePayload = {
  ticketType?: string;
  category?: string;
  block?: string;
  row?: string;
  seat?: string;
  quantity?: number;
  price?: number;
  status?: string;
};

export async function apiUpdateListing(listingId: string, body: ListingUpdatePayload) {
  const { data } = await userApi.put<{ success: boolean; listing?: ListingRecord; error?: string }>(
    `/listings/${encodeURIComponent(listingId)}`,
    body
  );
  return data;
}

export async function apiToggleListingStatus(listingId: string) {
  const { data } = await userApi.patch<{ success: boolean; listing?: ListingRecord; error?: string }>(
    `/listings/${encodeURIComponent(listingId)}/toggle-status`
  );
  return data;
}

export type BankAccountPayload = {
  bankName: string;
  accountHolder: string;
  iban: string;
  swiftCode?: string;
};

export async function apiAddBankAccount(body: BankAccountPayload) {
  const { data } = await userApi.post<{
    success: boolean;
    bankAccounts?: BankAccountRecord[];
    error?: string;
  }>("/bank-accounts", body);
  return data;
}

export async function apiUpdateBankAccount(bankAccountId: string, body: Partial<BankAccountPayload>) {
  const { data } = await userApi.put<{
    success: boolean;
    bankAccount?: BankAccountRecord;
    error?: string;
  }>(`/bank-accounts/${bankAccountId}`, body);
  return data;
}

export type AddressPayload = {
  title: string;
  address: string;
  city: string;
  district: string;
  neighborhood: string;
  postalCode: string;
};

export async function apiAddAddress(body: AddressPayload) {
  const { data } = await userApi.post<{
    success: boolean;
    addresses?: AddressRecord[];
    error?: string;
  }>("/addresses", body);
  return data;
}

export async function apiUpdateAddress(addressId: string, body: Partial<AddressPayload>) {
  const { data } = await userApi.put<{
    success: boolean;
    address?: AddressRecord;
    error?: string;
  }>(`/addresses/${addressId}`, body);
  return data;
}

export type SupportTopicListRow = {
  _id: string;
  subject: string;
  status: "open" | "closed";
  unreadForMember?: boolean;
  referenceSaleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SupportAttachment = {
  url: string;
  fileKey?: string;
  originalName?: string;
  mimeType?: string;
  kind?: "image" | "pdf";
};

export type SupportMessageRow = {
  _id: string;
  body: string;
  fromRole: "member" | "admin";
  attachments: SupportAttachment[];
  createdAt?: string;
};

export type SupportTopicDetail = {
  topic: SupportTopicListRow & {
    referenceSaleId?: { referenceCode?: string; totalAmount?: number; status?: string; saleDate?: string } | string | null;
  };
  messages: SupportMessageRow[];
};

export async function apiSupportListTopics() {
  const { data } = await userApi.get<{ success: boolean; data?: SupportTopicListRow[]; message?: string }>(
    "/support/topics"
  );
  return data;
}

export async function apiSupportGetTopic(id: string) {
  const { data } = await userApi.get<{ success: boolean; data?: SupportTopicDetail; message?: string }>(
    `/support/topics/${id}`
  );
  return data;
}

export async function apiSupportCreateTopic(payload: {
  subject: string;
  body: string;
  referenceSaleId?: string;
  files?: File[];
}) {
  const fd = new FormData();
  fd.append("subject", payload.subject);
  fd.append("body", payload.body);
  if (payload.referenceSaleId) fd.append("referenceSaleId", payload.referenceSaleId);
  for (const f of payload.files ?? []) fd.append("files", f);
  const { data } = await userApi.post<{
    success: boolean;
    data?: { topic: SupportTopicListRow; message: SupportMessageRow };
    message?: string;
  }>("/support/topics", fd);
  return data;
}

export async function apiSupportAddMessage(topicId: string, body: string, files?: File[]) {
  const fd = new FormData();
  fd.append("body", body);
  for (const f of files ?? []) fd.append("files", f);
  const { data } = await userApi.post<{
    success: boolean;
    data?: SupportMessageRow;
    message?: string;
  }>(`/support/topics/${topicId}/messages`, fd);
  return data;
}
