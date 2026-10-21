import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  FileCheck2,
  Home,
  Loader2,
  Mail,
  MapPin,
  MessageSquareWarning,
  Pencil,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState, PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { normalizeRole } from "@/types/auth";
import {
  formatCurrency,
  formatDate,
  formatDocument,
  formatPhone,
  formatZipCode,
  normalizeReasons,
} from "@/lib/format";
import { applicationStatusDescriptions, applicationStatusLabels } from "@/lib/status";
import { getApiErrorMessage, getApiErrorStatus } from "@/services/api";
import {
  downloadContract,
  generateContract,
  resendContractSignatureNotification,
  restartContractSignature,
  sendContractToSignature,
} from "@/services/contracts";
import { getRentalApplication } from "@/services/rental-applications";
import { ApplicationStatusBadge } from "../components/application-status-badge";
import { AdminDecisionDialog } from "../components/admin-decision-dialog";
import {
  CancelSignatureDialog,
  ReopenContractDataDialog,
  ReopenForEditDialog,
} from "../components/contract-action-dialogs";

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 wrap-break-word font-medium text-foreground">{value || "-"}</p>
    </div>
  );
}

export function ApplicationDetailPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const basePath = isAdmin ? "/admin" : "/real_estate";

  const { data: application, isLoading } = useQuery({
    queryKey: ["rental-application", applicationId],
    queryFn: () => getRentalApplication(applicationId ?? ""),
    enabled: Boolean(applicationId),
  });

  useEffect(() => {
    if (isAdmin && application) {
      queryClient.invalidateQueries({ queryKey: ["unread-applications-count"] });
    }
  }, [isAdmin, application, queryClient]);

  const generateMutation = useMutation({
    mutationFn: () => generateContract(applicationId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["rental-applications"] });
      toast.success("Contrato gerado com sucesso.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const sendSignatureMutation = useMutation({
    mutationFn: () => sendContractToSignature(application?.contract?.id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["rental-applications"] });
      toast.success("Contrato enviado para assinatura via Clicksign!");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const resendSignatureMutation = useMutation({
    mutationFn: () => resendContractSignatureNotification(application?.contract?.id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-application", applicationId] });
      toast.success("Notificação de assinatura reenviada com sucesso!");
    },
    onError: (error) => {
      const status = getApiErrorStatus(error);
      const message = getApiErrorMessage(error);
      if (
        status === 500 ||
        status === 429 ||
        message.toLowerCase().includes("internal server error")
      ) {
        toast.error(
          "A Clicksign limita o envio de notificações. Por favor, aguarde 1 minuto para tentar reenviar.",
        );
        return;
      }
      toast.error(message);
    },
  });

  const restartSignatureMutation = useMutation({
    mutationFn: () => restartContractSignature(application?.contract?.id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["rental-applications"] });
      toast.success("Envio para assinatura reiniciado com sucesso!");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  async function handleDownload() {
    if (!application?.contract?.id) return;

    try {
      await downloadContract(application.contract.id, application.contract.fileName ?? undefined);
      toast.success("Download iniciado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-3xl border bg-white/70" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!application) {
    return (
      <PageShell>
        <EmptyState
          icon={<FileText className="size-7" />}
          title="Consulta não encontrada"
          description="Verifique se o identificador está correto ou retorne para a lista de consultas."
          action={<Button onClick={() => navigate(`${basePath}/consultas`)}>Voltar para consultas</Button>}
        />
      </PageShell>
    );
  }

  const isSeller = normalizeRole(session?.user.role) === "SELLER";
  const reasons = normalizeReasons(application.decisionReasons);
  const canContest = !isAdmin && !isSeller && application.status === "REJECTED";
  const isEditingContract = application.status === "WAITING_ADMIN_CONTRACT";
  const canFillContract =
    !isAdmin &&
    !isSeller &&
    (application.status === "WAITING_CONTRACT_DATA" || isEditingContract);
  const canGenerateContract = isAdmin && application.status === "WAITING_ADMIN_CONTRACT";
  const canAdminDecide = isAdmin && ["CONSULTED", "REJECTED", "CONTESTED"].includes(application.status);
  const contract = application.contract;
  const isContractGenerated = application.status === "CONTRACT_GENERATED" && Boolean(contract?.id);
  const canDownload = isContractGenerated;
  const canSendSignature =
    isContractGenerated &&
    isAdmin &&
    (!contract?.signatureStatus || contract.signatureStatus === "NOT_SENT");
  const canRestartSignature =
    isContractGenerated &&
    isAdmin &&
    (contract?.signatureStatus === "CANCELLED" || contract?.signatureStatus === "ERROR");
  const canResendNotification =
    isContractGenerated &&
    isAdmin &&
    Boolean(contract?.clicksignEnvelopeId) &&
    ["SENT", "PARTIALLY_SIGNED", "ENVELOPE_CREATED", "ACTION_REQUIRED"].includes(
      contract?.signatureStatus ?? "",
    );
  const canCancelSignature =
    isContractGenerated &&
    isAdmin &&
    ["SENT", "PARTIALLY_SIGNED", "ENVELOPE_CREATED", "ACTION_REQUIRED"].includes(
      contract?.signatureStatus ?? "",
    );
  const canReopenContract =
    isContractGenerated && isAdmin && contract?.signatureStatus !== "SIGNED";
  const requesterName =
    application.requester?.realEstateProfile?.name ?? application.requester?.name ?? "Imobiliária";
  const tenantsList =
    application.tenants && application.tenants.length > 0
      ? application.tenants
      : application.tenantName
        ? [
            {
              order: 1,
              name: application.tenantName,
              document: application.tenantDocument || application.document,
              email: application.tenantEmail || "",
              phone: application.tenantPhone || "",
            },
          ]
        : [];

  return (
    <PageShell>
      <Helmet title="Detalhes da Consulta" />

      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to={`${basePath}/consultas`}>
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
        <PageHeader
          eyebrow={isAdmin ? "Detalhe administrativo" : "Detalhe da consulta"}
          title={formatDocument(application.document, application.documentType)}
          description={applicationStatusDescriptions[application.status]}
          action={
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              {canFillContract ? (
                <Button
                  asChild
                  variant={isEditingContract ? "outline" : "default"}
                  className={!isEditingContract ? "beam-button shadow-lg shadow-primary/15" : ""}
                >
                  <Link to={`${basePath}/consultas/${application.id}/contrato`}>
                    {isEditingContract ? (
                      <>
                        <Pencil className="size-4" />
                        Editar dados do contrato
                      </>
                    ) : (
                      <>
                        <Home className="size-4" />
                        Preencher contrato
                      </>
                    )}
                  </Link>
                </Button>
              ) : null}
              {canContest ? (
                <Button asChild variant="outline">
                  <Link to={`${basePath}/consultas/${application.id}/contestar`}>
                    <MessageSquareWarning className="size-4" />
                    Contestar decisão
                  </Link>
                </Button>
              ) : null}
              {canAdminDecide ? (
                <>
                  <AdminDecisionDialog applicationId={application.id} decision="APPROVED" />
                  <AdminDecisionDialog applicationId={application.id} decision="REJECTED" />
                </>
              ) : null}
              {canGenerateContract ? (
                <>
                  <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                    {generateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Gerar contrato
                  </Button>
                  <ReopenForEditDialog applicationId={application.id} />
                </>
              ) : null}
              {canDownload ? (
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="size-4" />
                  Baixar contrato
                </Button>
              ) : null}
              {canSendSignature ? (
                <Button
                  onClick={() => sendSignatureMutation.mutate()}
                  disabled={sendSignatureMutation.isPending}
                  className="beam-button shadow-lg shadow-primary/15"
                >
                  {sendSignatureMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Enviar para assinatura
                </Button>
              ) : null}
              {canRestartSignature ? (
                <Button
                  onClick={() => restartSignatureMutation.mutate()}
                  disabled={restartSignatureMutation.isPending}
                  className="beam-button shadow-lg shadow-primary/15"
                >
                  {restartSignatureMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Reiniciar assinatura
                </Button>
              ) : null}
              {canResendNotification ? (
                <Button
                  variant="outline"
                  onClick={() => resendSignatureMutation.mutate()}
                  disabled={resendSignatureMutation.isPending}
                >
                  {resendSignatureMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                  Reenviar e-mail
                </Button>
              ) : null}
              {canCancelSignature && contract?.id ? (
                <CancelSignatureDialog
                  contractId={contract.id}
                  applicationId={application.id}
                />
              ) : null}
              {canReopenContract && contract?.id ? (
                <ReopenContractDataDialog
                  contractId={contract.id}
                  applicationId={application.id}
                />
              ) : null}
              {isContractGenerated &&
              contract?.signatureStatus &&
              ["SENT", "PARTIALLY_SIGNED", "ENVELOPE_CREATED"].includes(contract.signatureStatus) ? (
                <Badge variant="outline" className="h-10 px-4 border-indigo-200 bg-indigo-50 text-indigo-700 font-medium">
                  Aguardando assinaturas
                </Badge>
              ) : null}
              {isContractGenerated && contract?.signatureStatus === "CANCELLED" ? (
                <Badge variant="outline" className="h-10 px-4 border-rose-200 bg-rose-50 text-rose-700 font-medium">
                  Assinatura cancelada
                </Badge>
              ) : null}
              {isContractGenerated && contract?.signatureStatus === "ERROR" ? (
                <Badge variant="outline" className="h-10 px-4 border-rose-200 bg-rose-50 text-rose-700 font-medium">
                  Erro no envio
                </Badge>
              ) : null}
              {isContractGenerated && contract?.signatureStatus === "SIGNED" ? (
                <Badge variant="outline" className="h-10 px-4 border-emerald-200 bg-emerald-50 text-emerald-700 font-medium">
                  Contrato assinado
                </Badge>
              ) : null}
            </div>
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="flashlight-card bg-white/85 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="size-5 text-primary" />
                Resultado da análise
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <ApplicationStatusBadge status={application.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailItem label="Aluguel" value={formatCurrency(application.rentValue)} />
              <DetailItem label="Condomínio" value={formatCurrency(application.condominiumValue)} />
              <DetailItem label="Taxas" value={formatCurrency(application.feesValue)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailItem label="Pacote solicitado" value={formatCurrency(application.requestedExpense)} />
              <DetailItem label="Capacidade mínima" value={formatCurrency(application.housingExpenseMin)} />
              <DetailItem label="Capacidade máxima" value={formatCurrency(application.housingExpenseMax)} />
            </div>
            <Separator />
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Motivos da decisão
              </h3>
              {reasons.length > 0 ? (
                <ul className="grid gap-2">
                  {reasons.map((reason) => (
                    <li key={reason} className="flex gap-3 rounded-2xl bg-stone-50 p-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum motivo detalhado retornado pela análise.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="bg-white/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5 text-primary" />
                Linha do tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem label="Status atual" value={applicationStatusLabels[application.status]} />
              <DetailItem label="Criada em" value={formatDate(application.createdAt)} />
              <DetailItem label="Atualizada em" value={formatDate(application.updatedAt)} />
              {contract?.signatureStatus ? (
                <DetailItem
                  label="Assinatura Clicksign"
                  value={
                    contract.signatureStatus === "SIGNED"
                      ? "Assinado"
                      : contract.signatureStatus === "SENT"
                      ? "Enviado para assinatura"
                      : contract.signatureStatus === "PARTIALLY_SIGNED"
                      ? "Parcialmente assinado"
                      : contract.signatureStatus === "ENVELOPE_CREATED"
                      ? "Envelope criado"
                      : contract.signatureStatus === "ERROR"
                      ? `Erro: ${contract.signatureError ?? "Falha no envio"}`
                      : contract.signatureStatus === "CANCELLED"
                      ? "Cancelado"
                      : "Pendente de envio"
                  }
                />
              ) : null}
              {application.adminDecisionReason ? (
                <Alert className="border-primary/20 bg-primary/5">
                  <AlertTitle>Decisão administrativa</AlertTitle>
                  <AlertDescription>{application.adminDecisionReason}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          {isAdmin ? (
            <Card className="bg-white/85 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  Imobiliária
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailItem label="Nome" value={requesterName} />
                <DetailItem label="E-mail" value={application.requester?.email} />
                <DetailItem
                  label="CNPJ"
                  value={formatDocument(application.requester?.realEstateProfile?.cnpj ?? undefined, "CNPJ")}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="bg-white/85 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Dados para contrato
              </CardTitle>
              {tenantsList.length > 0 ? (
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-medium">
                  {tenantsList.length === 1 ? "1 locatário" : `${tenantsList.length} locatários`}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {tenantsList.length > 0 ? (
              <div className="space-y-4">
                {tenantsList.map((tenant, index) => (
                  <div
                    key={tenant.id ?? index}
                    className="rounded-2xl border bg-stone-50/70 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        {index === 0 ? "Locatário 1 (Principal)" : `Locatário ${tenant.order || index + 1}`}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailItem label="Nome" value={tenant.name} />
                      <DetailItem label="CPF/CNPJ" value={formatDocument(tenant.document)} />
                      <DetailItem label="E-mail" value={tenant.email} />
                      <DetailItem label="Telefone" value={formatPhone(tenant.phone)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum locatário preenchido ainda.
              </p>
            )}

            {(application.propertyStreet || application.propertyZipCode) && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <MapPin className="size-4 text-primary" />
                    Dados do imóvel da locação
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Endereço"
                      value={
                        application.propertyStreet
                          ? `${application.propertyStreet}, ${application.propertyNumber ?? "s/n"}${
                              application.propertyComplement ? ` - ${application.propertyComplement}` : ""
                            }`
                          : null
                      }
                    />
                    <DetailItem label="Bairro" value={application.propertyNeighborhood} />
                    <DetailItem
                      label="Cidade/UF"
                      value={
                        application.propertyCity
                          ? `${application.propertyCity}/${application.propertyState ?? ""}`
                          : null
                      }
                    />
                    <DetailItem label="CEP" value={formatZipCode(application.propertyZipCode)} />
                    {application.adhesionFee !== undefined && application.adhesionFee !== null ? (
                      <DetailItem
                        label="Taxa de Adesão"
                        value={formatCurrency(application.adhesionFee)}
                      />
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="size-5 text-primary" />
              Contestações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {application.contests?.length ? (
              <div className="space-y-3">
                {application.contests.map((contest) => (
                  <div key={contest.id} className="rounded-2xl border bg-stone-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm">{contest.status}</strong>
                      <span className="text-xs text-muted-foreground">{formatDate(contest.createdAt)}</span>
                    </div>
                    <p className="mt-2 wrap-break-word text-sm text-muted-foreground">{contest.reason}</p>
                    {contest.adminNote ? (
                      <p className="mt-3 wrap-break-word rounded-xl bg-white p-3 text-sm">Admin: {contest.adminNote}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma contestação enviada para esta consulta.</p>
            )}
          </CardContent>
        </Card>

        {contract?.signers && contract.signers.length > 0 ? (
          <Card className="bg-white/85 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="size-5 text-primary" />
                Signatários do contrato (Clicksign)
              </CardTitle>
              {canResendNotification ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resendSignatureMutation.mutate()}
                  disabled={resendSignatureMutation.isPending}
                  className="h-8 gap-1.5 text-xs"
                >
                  {resendSignatureMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Mail className="size-3.5" />
                  )}
                  Reenviar e-mail
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {contract.signers.map((signer) => (
                  <div key={signer.id} className="rounded-2xl border bg-stone-50/70 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {signer.role === "TENANT"
                          ? "Locatário"
                          : signer.role === "REAL_ESTATE"
                          ? "Imobiliária"
                          : "DocuLoc"}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          signer.signedAt
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                            : "border-amber-200 bg-amber-50 text-amber-700 text-[10px]"
                        }
                      >
                        {signer.signedAt ? "Assinado" : "Pendente"}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm text-foreground truncate">{signer.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{signer.email}</p>
                    {signer.signedAt ? (
                      <p className="text-[11px] text-emerald-600">Assinado em {formatDate(signer.signedAt)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageShell>
  );
}
