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