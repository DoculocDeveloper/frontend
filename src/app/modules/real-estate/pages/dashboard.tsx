import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  FileText,
  MapPin,
  MessageSquareWarning,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MetricCard,
  PageHeader,
  PageShell,
} from "@/app/modules/_components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, formatDocument } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { downloadContract } from "@/services/contracts";
import { listRentalApplications } from "@/services/rental-applications";
import { normalizeRole } from "@/types/auth";
import type { RentalApplication } from "@/types/doculoc";
import { ApplicationsTable } from "@/app/modules/applications/components/applications-table";

function SignatureStatusBadge({ status }: { status?: string | null }) {
  if (status === "SIGNED") {
    return (
      <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="size-3" />
        Assinado
      </Badge>
    );
  }

  if (["SENT", "PARTIALLY_SIGNED", "ENVELOPE_CREATED", "ACTION_REQUIRED"].includes(status ?? "")) {
    return (
      <Badge className="gap-1 border-sky-200 bg-sky-50 text-sky-700">
        <Send className="size-3" />
        Em assinatura
      </Badge>
    );
  }

  if (status === "REFUSED" || status === "CANCELLED" || status === "ERROR") {
    return (
      <Badge className="gap-1 border-rose-200 bg-rose-50 text-rose-700">
        Recusado / Erro
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-600">
      Gerado (Não enviado)
    </Badge>
  );
}

export function RealEstateDashboard() {
  const { session } = useAuth();
  const role = normalizeRole(session?.user.role);
  const isSeller = role === "SELLER";

  const { data, isLoading } = useQuery({
    queryKey: ["real-estate-dashboard-applications"],
    queryFn: () => listRentalApplications({ page: 1, perPage: 100 }),
  });

  const applications = data?.applications ?? [];
  const waitingContractData = applications.filter(
    (application) => application.status === "WAITING_CONTRACT_DATA",
  ).length;
  const contested = applications.filter(
    (application) => application.status === "CONTESTED",
  ).length;
  const generatedContracts = applications.filter(
    (application) => application.status === "CONTRACT_GENERATED",
  ).length;
  const rejected = applications.filter(
    (application) => application.status === "REJECTED",
  ).length;

  const companyName =
    session?.user.realEstateProfile?.name ??
    session?.user.realEstate?.name ??
    session?.user.name ??
    "Imobiliária";

  // Cálculos para o painel visual do vendedor
  const contractApplications = applications.filter(
    (app) => app.status === "CONTRACT_GENERATED" && Boolean(app.contract?.id),
  );
  const signedContracts = contractApplications.filter(
    (app) => app.contract?.signatureStatus === "SIGNED",
  );
  const inProgressContracts = contractApplications.filter((app) =>
    ["SENT", "PARTIALLY_SIGNED", "ENVELOPE_CREATED", "ACTION_REQUIRED"].includes(
      app.contract?.signatureStatus ?? "",
    ),
  );
  const notSentContracts = contractApplications.filter(
    (app) => !app.contract?.signatureStatus || app.contract?.signatureStatus === "NOT_SENT",
  );
  const totalRentValue = contractApplications.reduce(
    (acc, curr) => acc + Number(curr.rentValue ?? curr.requestedExpense ?? 0),
    0,
  );

  const totalContractsCount = contractApplications.length;
  const signedPercent =
    totalContractsCount > 0 ? Math.round((signedContracts.length / totalContractsCount) * 100) : 0;
  const inProgressPercent =
    totalContractsCount > 0
      ? Math.round((inProgressContracts.length / totalContractsCount) * 100)
      : 0;

  async function handleDownload(application: RentalApplication) {
    if (!application.contract?.id) return;

    try {
      await downloadContract(
        application.contract.id,
        application.contract.fileName ?? undefined,
      );
      toast.success("Download iniciado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <PageShell>
      <Helmet title={isSeller ? "Painel de Contratos" : "Dashboard"} />

      <PageHeader
        eyebrow={isSeller ? "Portal da imobiliária • Painel do Vendedor" : "Portal da imobiliária"}
        title={isSeller ? `Olá, ${session?.user.name}` : `Olá, ${companyName}`}
        description={
          isSeller
            ? `Visão de acompanhamento e download dos contratos gerados para ${companyName}. Acesso configurado com permissão exclusiva de visualização.`
            : "Faça consultas de CPF ou CNPJ, acompanhe decisões e avance os casos aprovados para contrato sem perder o contexto."
        }
        action={
          !isSeller ? (
            <Button
              asChild
              size="lg"
              className="beam-button shadow-lg shadow-primary/15"
            >
              <Link to="/real_estate/nova-consulta">
                <Plus className="size-4" />
                Nova consulta
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Seção de Métricas */}
      {isSeller ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Contratos Gerados"
            value={totalContractsCount}
            description="Total de contratos emitidos"
            icon={<FileCheck2 className="size-5" />}
          />
          <MetricCard
            label="Assinados (Clicksign)"
            value={signedContracts.length}
            description={`${signedPercent}% dos contratos emitidos`}
            icon={<CheckCircle2 className="size-5 text-emerald-600" />}
          />
          <MetricCard
            label="Aguardando Assinatura"
            value={inProgressContracts.length}
            description="Enviados para as partes"
            icon={<FileClock className="size-5 text-sky-600" />}
          />
          <MetricCard
            label="Aluguéis Sob Garantia"
            value={formatCurrency(totalRentValue)}
            description="Volume total garantido"
            icon={<ShieldCheck className="size-5 text-primary" />}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Consultas"
            value={data?.meta.total ?? applications.length}
            description="Seu histórico"
            icon={<ClipboardList className="size-5" />}
          />
          <MetricCard
            label="Aprovadas para contrato"
            value={waitingContractData}
            description="Aguardando dados da locação"
            icon={<FileClock className="size-5" />}
          />
          <MetricCard
            label="Contratos"
            value={generatedContracts}
            description="Disponíveis para download"
            icon={<FileCheck2 className="size-5" />}
          />
          <MetricCard
            label="Contestações"
            value={contested}
            description={`${rejected} reprovadas podem ser contestadas`}
            icon={<MessageSquareWarning className="size-5" />}
          />
        </div>
      )}

      {/* DASH VISUAL DE CONTRATOS GERADOS (Exclusivo e em destaque para vendedores) */}
      {isSeller ? (
        <div className="space-y-6">
          {/* Card de distribuição visual das assinaturas */}
          <div className="rounded-3xl border bg-white/85 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FileCheck2 className="size-4 text-primary" />
                  Status das Assinaturas dos Contratos
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Progresso geral de formalização dos contratos emitidos pela Doculoc para esta imobiliária.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-stone-300 font-mono text-xs">
                  {totalContractsCount} {totalContractsCount === 1 ? "contrato" : "contratos"}
                </Badge>
              </div>
            </div>

            {totalContractsCount > 0 ? (
              <div className="mt-5 space-y-3">
                {/* Barra de progresso segmentada */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100 flex">
                  {signedPercent > 0 ? (
                    <div
                      style={{ width: `${signedPercent}%` }}
                      className="h-full bg-emerald-500 transition-all"
                      title={`Assinados: ${signedPercent}%`}
                    />
                  ) : null}
                  {inProgressPercent > 0 ? (
                    <div
                      style={{ width: `${inProgressPercent}%` }}
                      className="h-full bg-sky-500 transition-all"
                      title={`Em assinatura: ${inProgressPercent}%`}
                    />
                  ) : null}
                  {100 - signedPercent - inProgressPercent > 0 ? (
                    <div
                      style={{ width: `${100 - signedPercent - inProgressPercent}%` }}
                      className="h-full bg-stone-300 transition-all"
                      title="Não enviados ou em preparação"
                    />
                  ) : null}
                </div>

                {/* Legenda visual da barra */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    <span className="font-medium text-foreground">Assinados:</span>
                    <span className="text-muted-foreground">{signedContracts.length} ({signedPercent}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-sky-500" />
                    <span className="font-medium text-foreground">Em assinatura:</span>
                    <span className="text-muted-foreground">{inProgressContracts.length} ({inProgressPercent}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-stone-300" />
                    <span className="font-medium text-foreground">Outros / Pendentes:</span>
                    <span className="text-muted-foreground">{notSentContracts.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Nenhum contrato gerado até o momento para esta imobiliária.
              </p>
            )}
          </div>

          {/* Tabela focada nos Contratos Gerados com Download e Detalhes */}
          <div className="rounded-3xl border bg-white/85 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Contratos Disponíveis para Download
                </h3>
                <p className="text-xs text-muted-foreground">
                  Baixe a versão formal do contrato ou acesse a análise para conferência das garantias.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link to="/real_estate/consultas">
                  Ver todas as consultas
                  <ChevronRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            {contractApplications.length > 0 ? (
              <>
                {/* Mobile cards dos contratos */}
                <div className="grid gap-3 lg:hidden">
                  {contractApplications.map((app) => (
                    <article key={app.id} className="rounded-2xl border bg-stone-50/80 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {app.tenantName || formatDocument(app.tenantDocument || app.document, app.documentType)}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            {formatDocument(app.tenantDocument || app.document, app.documentType)}
                          </p>
                        </div>
                        <SignatureStatusBadge status={app.contract?.signatureStatus} />
                      </div>

                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground block">Aluguel:</span>
                          <span className="font-medium text-foreground">{formatCurrency(app.rentValue ?? app.requestedExpense)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Imóvel:</span>
                          <span className="font-medium text-foreground truncate block">
                            {app.propertyCity ? `${app.propertyCity} - ${app.propertyState}` : "Não informado"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => handleDownload(app)}
                        >
                          <Download className="size-3.5 mr-1" />
                          Baixar
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary">
                          <Link to={`/real_estate/consultas/${app.id}`}>
                            <Eye className="size-3.5 mr-1" />
                            Ver
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Desktop table dos contratos */}
                <div className="hidden overflow-hidden rounded-2xl border bg-white lg:block">
                  <Table>
                    <TableHeader className="bg-stone-50/90">
                      <TableRow>
                        <TableHead>Locatário</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Localização do Imóvel</TableHead>
                        <TableHead>Valor Aluguel</TableHead>
                        <TableHead>Assinatura Clicksign</TableHead>
                        <TableHead>Gerado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">
                            {app.tenantName || "Locatário"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatDocument(app.tenantDocument || app.document, app.documentType)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {app.propertyCity ? (
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="size-3 text-primary" />
                                {app.propertyCity} - {app.propertyState}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            {formatCurrency(app.rentValue ?? app.requestedExpense)}
                          </TableCell>
                          <TableCell>
                            <SignatureStatusBadge status={app.contract?.signatureStatus} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(app.contract?.generatedAt ?? app.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => handleDownload(app)}
                                title="Baixar contrato .docx"
                              >
                                <Download className="size-3.5 mr-1" />
                                Baixar
                              </Button>
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <Link to={`/real_estate/consultas/${app.id}`}>
                                  <Eye className="size-3.5 mr-1" />
                                  Detalhes
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Ainda não há contratos emitidos para esta imobiliária.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visualização da Imobiliária tradicional */
        <div>
          {isLoading ? (
            <div className="h-96 animate-pulse rounded-3xl border bg-white/70" />
          ) : (
            <ApplicationsTable
              applications={applications.slice(0, 6)}
              basePath="/real_estate"
              onDownloadContract={handleDownload}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
