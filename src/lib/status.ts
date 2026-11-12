import type { RentalApplicationStatus } from "@/types/doculoc";

export const applicationStatusLabels: Record<RentalApplicationStatus, string> = {
  CONSULTED: "Consultada",
  WAITING_CONTRACT_DATA: "Aprovado para contrato",
  WAITING_ADMIN_CONTRACT: "Aguardando contrato",
  CONTRACT_GENERATED: "Contrato gerado",
  REJECTED: "Em análise",
  CONTESTED: "Contestada",
  ADMIN_REJECTED: "Reprovado",
  CANCELLED: "Cancelada",
  CONTRACT_DECLINED: "Contrato declinado",
  WAITING_REAL_ESTATE_RETURN: "Aguardando retorno imobiliária",
};

export const applicationStatusDescriptions: Record<RentalApplicationStatus, string> = {
  CONSULTED: "Consulta criada e aguardando evolução do fluxo.",
  WAITING_CONTRACT_DATA: "Cadastro aprovado para contrato. Preencha os dados da locação.",
  WAITING_ADMIN_CONTRACT: "Dados preenchidos. O admin já pode gerar o contrato.",
  CONTRACT_GENERATED: "Contrato pronto para download.",
  REJECTED: "Análise em verificação da equipe Doculoc.",
  CONTESTED: "Contestação enviada. Aguardando decisão manual do admin.",
  ADMIN_REJECTED: "Consulta reprovada.",
  CANCELLED: "Consulta cancelada.",
  CONTRACT_DECLINED: "Contrato declinado pelo locatário.",
  WAITING_REAL_ESTATE_RETURN: "O administrador enviou uma mensagem no chat e aguarda o retorno da imobiliária.",
};

export const statusOptions: Array<{ value: RentalApplicationStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos os status" },
  { value: "WAITING_CONTRACT_DATA", label: applicationStatusLabels.WAITING_CONTRACT_DATA },
  { value: "WAITING_ADMIN_CONTRACT", label: applicationStatusLabels.WAITING_ADMIN_CONTRACT },
  { value: "WAITING_REAL_ESTATE_RETURN", label: applicationStatusLabels.WAITING_REAL_ESTATE_RETURN },
  { value: "CONTRACT_GENERATED", label: applicationStatusLabels.CONTRACT_GENERATED },
  { value: "REJECTED", label: applicationStatusLabels.REJECTED },
  { value: "CONTESTED", label: applicationStatusLabels.CONTESTED },
  { value: "ADMIN_REJECTED", label: applicationStatusLabels.ADMIN_REJECTED },
  { value: "CANCELLED", label: applicationStatusLabels.CANCELLED },
  { value: "CONTRACT_DECLINED", label: applicationStatusLabels.CONTRACT_DECLINED },
  { value: "CONSULTED", label: applicationStatusLabels.CONSULTED },
];

export function isContractReady(status: RentalApplicationStatus) {
  return status === "WAITING_ADMIN_CONTRACT";
}

export function isFinalStatus(status: RentalApplicationStatus) {
  return ["CONTRACT_GENERATED", "ADMIN_REJECTED", "CANCELLED", "CONTRACT_DECLINED"].includes(status);
}
