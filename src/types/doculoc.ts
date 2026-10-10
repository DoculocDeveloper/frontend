import type { AuthUser, RealEstateProfile } from "./auth";

export type DocumentType = "CPF" | "CNPJ";

export type RentalApplicationStatus =
  | "CONSULTED"
  | "WAITING_CONTRACT_DATA"
  | "WAITING_ADMIN_CONTRACT"
  | "CONTRACT_GENERATED"
  | "REJECTED"
  | "CONTESTED"
  | "ADMIN_REJECTED"
  | "CANCELLED";

export type Recommendation = "RECOMMENDED" | "NOT_RECOMMENDED" | string;
export type AutomaticDecision = "APPROVED" | "REJECTED" | string;
export type AdminDecision = "APPROVED" | "REJECTED";

export type ContestStatus = "OPEN" | "ACCEPTED" | "REJECTED" | string;
export type ContractStatus = "PENDING" | "GENERATED" | "FAILED" | string;

export type ApplicationRequester = Pick<AuthUser, "id" | "name" | "email"> & {
  realEstateProfile?: RealEstateProfile | null;
};

export type ContractSignatureStatus =
  | "NOT_SENT"
  | "ENVELOPE_CREATED"
  | "SENT"
  | "PARTIALLY_SIGNED"
  | "SIGNED"
  | "ACTION_REQUIRED"
  | "REFUSED"
  | "CANCELLED"
  | "ERROR";

export type ContractSigner = {
  id: string;
  contractId: string;
  role: "TENANT" | "REAL_ESTATE" | "DOCULOC";
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  status?: string | null;
  signedAt?: string | null;
};

export type Contract = {
  id: string;
  applicationId: string;
  status: ContractStatus;
  templateName?: string | null;
  filePath?: string | null;
  fileName?: string | null;
  generatedById?: string | null;
  generatedAt?: string | null;
  errorMessage?: string | null;
  clicksignEnvelopeId?: string | null;
  clicksignDocumentId?: string | null;
  signatureStatus?: ContractSignatureStatus | null;
  signatureError?: string | null;
  sentToSignatureAt?: string | null;
  signedAt?: string | null;
  signers?: ContractSigner[];
  createdAt?: string;
  updatedAt?: string;
};

export type Contest = {
  id: string;
  applicationId: string;
  createdById: string;
  reason: string;
  status: ContestStatus;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RentalApplication = {
  id: string;
  documentType: DocumentType;
  document: string;
  requesterId?: string;
  requester?: ApplicationRequester | null;
  rentValue?: string | number | null;
  condominiumValue?: string | number | null;
  feesValue?: string | number | null;
  requestedExpense?: string | number | null;
  automaticDecision?: AutomaticDecision | null;
  recommendation?: Recommendation | null;
  status: RentalApplicationStatus;
  housingExpenseMin?: string | number | null;
  housingExpenseMax?: string | number | null;
  decisionReasons?: string[] | string | null;
  decisionMetadata?: Record<string, unknown> | string | null;
  adminDecision?: AdminDecision | null;
  adminDecisionById?: string | null;
  adminDecisionReason?: string | null;
  adminDecisionAt?: string | null;
  tenantName?: string | null;
  tenantDocument?: string | null;
  tenantEmail?: string | null;
  tenantPhone?: string | null;
  propertyZipCode?: string | null;
  propertyStreet?: string | null;
  propertyNumber?: string | null;
  propertyComplement?: string | null;
  propertyNeighborhood?: string | null;
  propertyCity?: string | null;
  propertyState?: string | null;
  contract?: Contract | null;
  contests?: Contest[];
  createdAt?: string;
  updatedAt?: string;
};

export type DecisionResponse = {
  status: string;
  recommendation: string;
  requestedExpense?: number;
  housingExpense?: {
    min?: number;
    max?: number;
    raw?: string;
  };
  reasons?: string[];
  metadata?: Record<string, unknown>;
};

export type ListApplicationsParams = {
  status?: RentalApplicationStatus | "ALL";
  document?: string;
  requesterId?: string;
  page?: number;
  perPage?: number;
};

export type ListApplicationsResponse = {
  applications: RentalApplication[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
};

export type CreateApplicationBody = {
  document: string;
  rentValue: number;
  condominiumValue: number;
  feesValue: number;
};

export type CreateApplicationResponse = {
  application: RentalApplication;
  decision: DecisionResponse;
};

export type PendingConsultResponse = {
  pending: true;
  status: "PROCESSING";
  consultLockId: string;
  document: string;
  documentType: DocumentType;
  message: string;
};

export type ConsultStatusResponse =
  | {
      status: "PROCESSING";
      consultLockId: string;
      message: string;
    }
  | {
      status: "FAILED";
      message: string;
    }
  | {
      status: "COMPLETED";
      application: RentalApplication;
      decision: DecisionResponse | null;
    };

export type CreateApplicationInitialResponse =
  | CreateApplicationResponse
  | PendingConsultResponse;

export type ContractDataBody = {
  tenantName: string;
  tenantDocument: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyZipCode: string;
  propertyStreet: string;
  propertyNumber: string;
  propertyComplement?: string;
  propertyNeighborhood: string;
  propertyCity: string;
  propertyState: string;
};

export type Wallet = {
  id: string;
  userId: string;
  availableCredits: number;
  isVip: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreditLedgerEntry = {
  id: string;
  userId: string;
  actorId?: string | null;
  type: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
};
