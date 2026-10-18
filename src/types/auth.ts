export type UserRole =
  | "ADMIN"
  | "REAL_ESTATE"
  | "ACCOUNT_EXECUTIVE"
  | "SELLER"
  | "admin"
  | "real_estate"
  | "account_executive"
  | "seller";

export type RealEstateProfile = {
  id: string;
  name: string;
  cnpj?: string | null;
  documentType?: "CPF" | "CNPJ" | null;
  document?: string | null;
  profileType?: "COMPANY" | "AUTONOMOUS_BROKER" | null;
  phone?: string | null;
  responsibleName?: string | null;
  signatureEmail?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cpf?: string | null;
  realEstateId?: string | null;
  realEstateProfile?: RealEstateProfile | null;
  realEstate?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export function normalizeRole(role?: UserRole | string | null): "ADMIN" | "REAL_ESTATE" | "SELLER" {
  const normalized = String(role ?? "").toUpperCase();
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "SELLER") return "SELLER";
  return "REAL_ESTATE";
}

export function getRoleBasePath(role?: UserRole | string | null) {
  return normalizeRole(role) === "ADMIN" ? "/admin" : "/real_estate";
}
