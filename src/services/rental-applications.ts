import { api } from "./api";
import { onlyDigits } from "@/lib/format";
import type {
  AdminDecision,
  ConsultStatusResponse,
  ContractDataBody,
  CreateApplicationBody,
  CreateApplicationInitialResponse,
  CreateApplicationResponse,
  ListApplicationsParams,
  ListApplicationsResponse,
  RentalApplication,
} from "@/types/doculoc";

function buildParams(params?: ListApplicationsParams) {
  const cleanParams = new URLSearchParams();

  if (params?.status && params.status !== "ALL") {
    cleanParams.set("status", params.status);
  }

  if (params?.document) {
    cleanParams.set("document", onlyDigits(params.document));
  }

  if (params?.requesterId) {
    cleanParams.set("requesterId", params.requesterId);
  }

  if (params?.page) cleanParams.set("page", String(params.page));
  if (params?.perPage) cleanParams.set("perPage", String(params.perPage));

  return cleanParams;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isPendingConsultResponse(
  data: CreateApplicationInitialResponse,
): data is Extract<CreateApplicationInitialResponse, { pending: true }> {
  return "pending" in data && data.pending === true;
}

export async function getConsultStatus(consultLockId: string) {
  const response = await api.get<ConsultStatusResponse>(
    `/rental-applications/consults/${consultLockId}/status`,
  );

  return response.data;
}

async function waitForConsultResult(
  consultLockId: string,
): Promise<CreateApplicationResponse> {
  const maxAttempts = 72;
  const delayMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await getConsultStatus(consultLockId);

    if (status.status === "COMPLETED") {
      return {
        application: status.application,
        decision: status.decision ?? {
          status: String(status.application.automaticDecision ?? "unknown"),
          recommendation: String(
            status.application.recommendation ?? "unknown",
          ),
        },
      };
    }

    if (status.status === "FAILED") {
      throw new Error(status.message || "A consulta falhou na Órago.");
    }

    await sleep(delayMs);
  }

  throw new Error(
    "A análise ainda está em processamento. Tente atualizar a lista de consultas em alguns minutos.",
  );
}

async function resolveCreateApplicationResponse(
  data: CreateApplicationInitialResponse,
): Promise<CreateApplicationResponse> {
  if (isPendingConsultResponse(data)) {
    return waitForConsultResult(data.consultLockId);
  }

  return data;
}

export async function listRentalApplications(params?: ListApplicationsParams) {
  const searchParams = buildParams(params);
  const response = await api.get<ListApplicationsResponse>(
    "/rental-applications",
    {
      params: Object.fromEntries(searchParams),
    },
  );

  return response.data;
}

export async function getRentalApplication(applicationId: string) {
  const response = await api.get<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}`,
  );

  return response.data.application;
}

export async function createCpfApplication(body: CreateApplicationBody) {
  const response = await api.post<CreateApplicationInitialResponse>(
    "/rental-applications/cpf",
    {
      cpf: onlyDigits(body.document),
      rentValue: body.rentValue,
      condominiumValue: body.condominiumValue,
      feesValue: body.feesValue,
    },
  );

  return resolveCreateApplicationResponse(response.data);
}

export async function createCnpjApplication(body: CreateApplicationBody) {
  const response = await api.post<CreateApplicationInitialResponse>(
    "/rental-applications/cnpj",
    {
      cnpj: onlyDigits(body.document),
      rentValue: body.rentValue,
      condominiumValue: body.condominiumValue,
      feesValue: body.feesValue,
    },
  );

  return resolveCreateApplicationResponse(response.data);
}

export async function fillContractData(
  applicationId: string,
  body: ContractDataBody,
) {
  const cleanDocument = onlyDigits(body.tenantDocument);
  const cleanPhone = onlyDigits(body.tenantPhone);
  const cleanZipCode = onlyDigits(body.propertyZipCode);

  const response = await api.patch<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}/contract-data`,
    {
      tenants: [
        {
          name: body.tenantName.trim(),
          document: cleanDocument,
          email: body.tenantEmail.trim(),
          phone: cleanPhone,
        },
      ],
      propertyZipCode: cleanZipCode,
      propertyStreet: body.propertyStreet.trim(),
      propertyNumber: body.propertyNumber.trim(),
      propertyComplement: body.propertyComplement?.trim() || undefined,
      propertyNeighborhood: body.propertyNeighborhood.trim(),
      propertyCity: body.propertyCity.trim(),
      propertyState: body.propertyState.trim().toUpperCase(),
      adhesionFee: 0,
    },
  );

  return response.data.application;
}

export async function contestRentalApplication(
  applicationId: string,
  reason: string,
) {
  const response = await api.post(
    `/rental-applications/${applicationId}/contest`,
    {
      reason,
    },
  );

  return response.data;
}

export async function decideRentalApplication(
  applicationId: string,
  decision: AdminDecision,
  reason: string,
) {
  const response = await api.patch<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}/admin-decision`,
    { decision, reason },
  );

  return response.data.application;
}
