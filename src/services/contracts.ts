import { api } from "./api";
import type { Contract } from "@/types/doculoc";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function generateContract(applicationId: string) {
  const response = await api.post<{ contract: Contract }>(
    `/contracts/applications/${applicationId}/generate`,
  );

  return response.data.contract;
}

export async function sendContractToSignature(contractId: string) {
  const response = await api.post<{ contract: Contract }>(
    `/contracts/${contractId}/signature/send`,
  );

  return response.data.contract;
}

export async function resendContractSignatureNotification(contractId: string) {
  const response = await api.post<{ contract: Contract }>(
    `/contracts/${contractId}/signature/resend-notification`,
  );

  return response.data.contract;
}

export async function cancelContractSignature(contractId: string) {
  const response = await api.post<{ contract: Contract }>(
    `/contracts/${contractId}/signature/cancel`,
  );

  return response.data.contract;
}

export async function restartContractSignature(contractId: string) {
  const response = await api.post<{ contract: Contract }>(
    `/contracts/${contractId}/signature/restart`,
  );

  return response.data.contract;
}

export async function reopenContractData(contractId: string) {
  const response = await api.post<{ contract: Contract }>(
    `/contracts/${contractId}/signature/reopen-contract-data`,
  );

  return response.data.contract;
}

function getFileNameFromContentDisposition(
  contentDisposition?: string,
  fallbackFileName = "contrato-doculoc.docx",
) {
  if (!contentDisposition) return fallbackFileName;

  const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8FileNameMatch?.[1]) {
    return decodeURIComponent(utf8FileNameMatch[1]);
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

  if (fileNameMatch?.[1]) {
    return decodeURIComponent(fileNameMatch[1]);
  }

  return fallbackFileName;
}

export async function downloadContract(
  contractId: string,
  fallbackFileName = "contrato-doculoc.docx",
) {
  const response = await api.get<Blob>(`/contracts/${contractId}/download`, {
    responseType: "blob",
  });

  const contentType = response.headers["content-type"] as string | undefined;

  if (contentType?.includes("application/json")) {
    const text = await response.data.text();
    const data = JSON.parse(text) as { url?: string; message?: string };

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    throw new Error(data.message ?? "Não foi possível baixar o contrato.");
  }

  const contentDisposition = response.headers["content-disposition"] as
    | string
    | undefined;

  const fileName = getFileNameFromContentDisposition(
    contentDisposition,
    fallbackFileName,
  );

  const blob = new Blob([response.data], {
    type: contentType ?? DOCX_MIME,
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}

export async function downloadSignedContract(
  contractId: string,
  fallbackFileName = "contrato-assinado-doculoc.pdf",
) {
  let response;

  try {
    response = await api.get<Blob>(`/contracts/${contractId}/signed-download`, {
      responseType: "blob",
    });
  } catch (error: any) {
    if (error?.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json?.message) {
          throw new Error(json.message);
        }
      } catch (innerError: any) {
        if (innerError?.message && innerError !== error) {
          throw innerError;
        }
      }
    }
    throw error;
  }

  const contentType = response.headers["content-type"] as string | undefined;

  if (contentType?.includes("application/json")) {
    const text = await response.data.text();
    const data = JSON.parse(text) as { url?: string; message?: string };

    if (data.url) {
      window.open(data.url, "_blank");
      return;
    }

    throw new Error(data.message ?? "Não foi possível obter o link do contrato assinado.");
  }

  const contentDisposition = response.headers["content-disposition"] as
    | string
    | undefined;

  let fileName = getFileNameFromContentDisposition(
    contentDisposition,
    fallbackFileName,
  );

  if (!fileName.toLowerCase().endsWith(".pdf")) {
    fileName = `${fileName.replace(/\.[^/.]+$/, "")}.pdf`;
  }

  const blob = new Blob([response.data], {
    type: contentType ?? "application/pdf",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}