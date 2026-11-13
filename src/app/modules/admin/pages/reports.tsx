import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FilterX,
  LayoutGrid,
  PieChart,
  Search,
  ShieldAlert,
  Table as TableIcon,
  TrendingUp,
  Trophy,
  UserX,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  EmptyState,
  MetricCard,
  PageHeader,
  PageShell,
} from "@/app/modules/_components/page-shell";
import { formatCurrency, formatDocument } from "@/lib/format";
import { listRealEstates } from "@/services/real-estates";
import { getReportsSummary } from "@/services/reports";

type DatePreset =
  | "all"
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "thisYear"
  | "custom";

type ViewMode = "bi" | "table";

export function ReportsPage() {
  const [selectedRealEstateId, setSelectedRealEstateId] = useState<string>("ALL");
  const [datePreset, setDatePreset] = useState<DatePreset>("last30");
  const [viewMode, setViewMode] = useState<ViewMode>("bi");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Busca lista de imobiliárias para o filtro
  const { data: realEstatesData } = useQuery({
    queryKey: ["real-estates-list-reports"],
    queryFn: () => listRealEstates(),
  });

  const realEstates = realEstatesData ?? [];

  // Busca resumo dos relatórios
  const queryParams = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    requesterId: selectedRealEstateId !== "ALL" ? selectedRealEstateId : undefined,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-summary", queryParams],
    queryFn: () => getReportsSummary(queryParams),
  });

  const handleApplyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    setCurrentPage(1);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }

    if (preset === "last7") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split("T")[0]);
      setEndDate(todayStr);
      return;
    }

    if (preset === "last30") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split("T")[0]);
      setEndDate(todayStr);
      return;
    }

    if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(todayStr);
      return;
    }

    if (preset === "thisYear") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(todayStr);
      return;
    }
  };

  const handleClearFilters = () => {
    setSelectedRealEstateId("ALL");
    setCurrentPage(1);
    handleApplyPreset("last30");
  };

  const totals = data?.totals ?? {
    totalApplications: 0,
    rejectedApplications: { count: 0, totalValue: 0, rate: 0 },
    onlyConsultedApplications: { count: 0, totalValue: 0, rate: 0 },
    generatedContracts: { count: 0, totalValue: 0 },
    signedContracts: { count: 0, totalValue: 0 },
    declinedContracts: { count: 0, totalValue: 0 },
    averageTicket: 0,
    conversionRate: 0,
    signedConversionRate: 0,
    signedSharePercentage: 0,
  };

  const doculocGlobal = data?.doculocGlobal ?? {
    totalApplications: 0,
    totalGeneratedContracts: { count: 0, totalValue: 0 },
    totalSignedContracts: { count: 0, totalValue: 0 },
  };

  const reportItems = data?.realEstates ?? [];
  const isIndividualFilter = selectedRealEstateId !== "ALL";

  return (
    <PageShell>
      <Helmet title="Relatórios | Admin Doculoc" />

      <PageHeader
        eyebrow="Admin Doculoc"
        title="Relatórios Operacionais e BI"
        description="Painel analítico de desempenho, funil de locação, contratos gerados, receita fechada (assinados) e representatividade de cada imobiliária no total da Doculoc."
      />

      {/* Barra de Filtros */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-white/90 p-4 shadow-sm backdrop-blur sm:rounded-3xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <BarChart3 className="size-4 text-primary" />
            <span>Filtros do Relatório</span>
          </div>

          {(selectedRealEstateId !== "ALL" || datePreset !== "last30") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-3.5" />
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Filtro por Imobiliária */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Imobiliária
            </label>
            <Select
              value={selectedRealEstateId}
              onValueChange={(val) => {
                setSelectedRealEstateId(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full bg-white">
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Todas as imobiliárias" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="ALL">Todas as imobiliárias</SelectItem>
                {realEstates.map((re) => {
                  const label =
                    re.realEstateProfile?.name || re.name || "Imobiliária";
                  return (
                    <SelectItem key={re.id} value={re.id}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Data Inicial */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data Inicial
            </label>
            <div className="relative">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="h-10 bg-white"
              />
            </div>
          </div>

          {/* Filtro por Data Final */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data Final
            </label>
            <div className="relative">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="h-10 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Presets de Data Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="mr-1 text-xs text-muted-foreground">
            Período rápido:
          </span>
          {[
            { id: "today", label: "Hoje" },
            { id: "last7", label: "Últimos 7 dias" },
            { id: "last30", label: "Últimos 30 dias" },
            { id: "thisMonth", label: "Este mês" },
            { id: "thisYear", label: "Este ano" },
            { id: "all", label: "Todo o histórico" },
          ].map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant={datePreset === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleApplyPreset(preset.id as DatePreset)}
              className="h-7 rounded-full text-xs font-medium"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards de Métricas Principais com Tooltips de Fórmulas */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<FilterX className="size-6 text-destructive" />}
          title="Erro ao carregar relatórios"
          description="Não foi possível obter os dados do relatório. Tente novamente mais tarde."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {/* Consultas realizadas */}
          <MetricCard
            label="Consultas Realizadas"
            value={totals.totalApplications}
            description="No período selecionado"
            icon={<ClipboardList className="size-4.5" />}
            tooltip={
              <div className="space-y-1.5">
                <p className="font-semibold text-white">Consultas Realizadas</p>
                <p className="text-stone-300">
                  Total de consultas de análise cadastral criadas no período para o filtro atual.
                </p>
                <div className="rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-primary-foreground">
                  Fórmula: Contagem de RentalApplication com createdAt no período.
                </div>
              </div>
            }
          />

          {/* Consultas Reprovadas */}
          <MetricCard
            label="Consultas Reprovadas"
            value={totals.rejectedApplications?.count ?? 0}
            description={
              totals.rejectedApplications?.count
                ? `${totals.rejectedApplications.rate}% • Total: ${formatCurrency(
                    totals.rejectedApplications.totalValue
                  )}`
                : "Nenhuma no período"
            }
            icon={<ShieldAlert className="size-4.5 text-amber-600" />}
            tooltip={
              <div className="space-y-1.5">
                <p className="font-semibold text-amber-400">Consultas Reprovadas</p>
                <p className="text-stone-300">
                  Consultas que não atingiram os critérios de aprovação na análise cadastral e de crédito.
                </p>
                <div className="rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-amber-300">
                  Fórmula: Consultas com status = ADMIN_REJECTED ou REJECTED (ou decisão administrativa reprovada).
                  <br />
                  Taxa = (Reprovadas ÷ Consultas Realizadas) × 100.
                </div>
              </div>
            }
          />

          {/* Somente Consulta (Não gerou contrato) */}
          <MetricCard
            label="Somente Consulta"
            value={totals.onlyConsultedApplications?.count ?? 0}
            description={
              totals.onlyConsultedApplications?.count
                ? `${totals.onlyConsultedApplications.rate}% • Total: ${formatCurrency(
                    totals.onlyConsultedApplications.totalValue
                  )}`
                : "Nenhuma no período"
            }
            icon={<Search className="size-4.5 text-stone-600" />}
            tooltip={
              <div className="space-y-1.5">
                <p className="font-semibold text-stone-300">Somente Consulta (Sem Contrato)</p>
                <p className="text-stone-300">
                  Consultas realizadas que foram apenas consultadas e não avançaram para confecção de contrato nem foram reprovadas ou declinadas.
                </p>
                <div className="rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-stone-300">
                  Fórmula: Consultas Realizadas - Contratos Gerados - Reprovadas - Declinadas pelo Locatário.
                </div>
              </div>
            }
          />

          {/* Contratos Gerados */}
          <MetricCard
            label="Contratos Gerados"
            value={totals.generatedContracts.count}
            description={`Total: ${formatCurrency(
              totals.generatedContracts.totalValue
            )}`}
            icon={<CheckCircle2 className="size-4.5 text-blue-600" />}
            tooltip={
              <div className="space-y-1.5">
                <p className="font-semibold text-white">Contratos Gerados</p>
                <p className="text-stone-300">
                  Casos aprovados que tiveram documento DOCX de contrato emitido na plataforma.
                </p>
                <div className="rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-primary-foreground">
                  Fórmula: Consultas com status = CONTRACT_GENERATED.
                  <br />
                  Valor Total = Soma dos valores de aluguel (rentValue).
                </div>
              </div>
            }
          />

          {/* Contratos Assinados (Receita Fechada) */}
          <MetricCard
            label="Contratos Assinados"
            value={totals.signedContracts.count}
            description={
              isIndividualFilter
                ? `${totals.signedSharePercentage}% da Doculoc (${formatCurrency(
                    totals.signedContracts.totalValue
                  )})`
                : `${formatCurrency(
                    totals.signedContracts.totalValue
                  )} • ${totals.signedConversionRate}% dos gerados`
            }
            icon={<FileCheck2 className="size-4.5 text-emerald-600" />}
            tooltip={
              <div className="space-y-1.5">
                <p className="font-semibold text-emerald-400">Contratos Assinados (Receita Fechada)</p>
                <p className="text-stone-300">
                  Contratos formalmente assinados por todas as partes via Clicksign. Representa a receita concretizada.
                </p>
                <div className="rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-emerald-300">
                  Fórmula: status = CONTRACT_GENERATED e signatureStatus = SIGNED.
                  <br />
                  Share Doculoc = (Assinados da Imobiliária ÷ Total Geral Doculoc) × 100.
                </div>
              </div>
            }
          />

          {/* Declinado pelo Locatário */}
          <MetricCard
            label="Declinado pelo Locatário"
            value={totals.declinedContracts.count}
            description={`Total: ${formatCurrency(
              totals.declinedContracts.totalValue
            )}`}
            icon={<UserX className="size-4.5 text-rose-600" />}
            tooltip={
              <div className="space-y-1.5">
                <p className="font-semibold text-rose-400">Declinado pelo Locatário</p>
                <p className="text-stone-300">
                  Contratos ou consultas aprovadas em que o locatário declinou antes ou durante a assinatura.
                </p>
                <div className="rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-rose-300">
                  Fórmula: Consultas com status = CONTRACT_DECLINED.
                  <br />
                  Valor Total = Soma dos valores de aluguel que deixaram de ser fechados.
                </div>
              </div>
            }
          />

          {/* Ticket Médio */}
          <MetricCard
            label="Ticket Médio"
            value={formatCurrency(totals.averageTicket)}
            description={`Conversão: ${totals.conversionRate}%`}
            icon={<TrendingUp className="size-4.5 text-indigo-600" />}
            tooltip={
              <div className="space-y-1.5">
                <p className="font-semibold text-white">Ticket Médio</p>
                <p className="text-stone-300">
                  Valor médio de locação dos contratos gerados no período.
                </p>
                <div className="rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-primary-foreground">
                  Fórmula: Valor Total dos Contratos Gerados ÷ Quantidade de Contratos Gerados.
                  <br />
                  {totals.generatedContracts.count > 0
                    ? `${formatCurrency(totals.generatedContracts.totalValue)} ÷ ${totals.generatedContracts.count} = ${formatCurrency(totals.averageTicket)}`
                    : "Sem contratos gerados no período."}
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Funil Visual de Conversão Comercial (BI Pipeline) */}
      {!isLoading && !isError && totals.totalApplications > 0 && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm backdrop-blur sm:rounded-3xl sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                Funil de Conversão Comercial (Pipeline)
              </h3>
              <p className="text-xs text-muted-foreground">
                Acompanhe a taxa de passagem de locatários entre cada estágio do processo.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              Taxa Geral: {totals.conversionRate}%
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* Topo: Consultas */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Consultas
                </span>
                <Badge variant="secondary" className="text-[0.68rem]">
                  100%
                </Badge>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {totals.totalApplications}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">iniciadas</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div className="h-full bg-stone-500 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Meio: Contratos Gerados */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  2. Contratos Gerados
                </span>
                <Badge className="bg-blue-600 hover:bg-blue-700 text-[0.68rem]">
                  {totals.conversionRate}%
                </Badge>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold tracking-tight text-blue-900 sm:text-3xl">
                  {totals.generatedContracts.count}
                </span>
                <span className="ml-1 text-xs text-blue-700">
                  ({formatCurrency(totals.generatedContracts.totalValue)})
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(totals.conversionRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Fundo: Contratos Assinados (Receita) */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  3. Contratos Assinados
                </span>
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[0.68rem]">
                  {totals.signedConversionRate}% dos gerados
                </Badge>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
                  {totals.signedContracts.count}
                </span>
                <span className="ml-1 text-xs font-semibold text-emerald-700">
                  ({formatCurrency(totals.signedContracts.totalValue)})
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(totals.signedConversionRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção Principal de BI: Resumo e Representatividade por Imobiliária */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Desempenho e Representatividade por Imobiliária
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Métricas executivas de receita fechada (assinados), volume gerado e o percentual de mercado de cada parceiro.
            </p>
          </div>

          {/* Seletor de Modo: BI Cards vs Tabela */}
          <div className="flex items-center gap-1 rounded-2xl border bg-white p-1 shadow-xs">
            <Button
              type="button"
              variant={viewMode === "bi" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("bi")}
              className="h-8 gap-1.5 rounded-xl text-xs font-medium"
            >
              <LayoutGrid className="size-3.5" />
              <span>Visão BI (Cards)</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 gap-1.5 rounded-xl text-xs font-medium"
            >
              <TableIcon className="size-3.5" />
              <span>Tabela</span>
            </Button>
          </div>
        </div>

        {/* Indicador Global Doculoc */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
            <PieChart className="size-4 text-emerald-600" />
            <span>
              Total Geral Doculoc Assinado no Período:{" "}
              <strong>
                {doculocGlobal.totalSignedContracts.count} contratos
              </strong>{" "}
              ({formatCurrency(doculocGlobal.totalSignedContracts.totalValue)})
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {reportItems.length}{" "}
            {reportItems.length === 1 ? "imobiliária ativa" : "imobiliárias ativas"}
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        ) : reportItems.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-6 text-muted-foreground" />}
            title="Nenhum dado encontrado"
            description="Nenhuma consulta ou contrato registrado para os filtros selecionados."
          />
        ) : viewMode === "bi" ? (
          /* MODO BI */
          isIndividualFilter ? (
            /* QUANDO FILTRADO A IMOBILIÁRIA: CARD OCUPA 100% DA LARGURA, EXPANDIDO E SEM ESPAÇO EM BRANCO */
            <div className="w-full">
              {reportItems.map((item) => (
                <div
                  key={item.id}
                  className="w-full rounded-3xl border bg-white p-6 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-xl space-y-6"
                >
                  {/* Cabeçalho Expandido */}
                  <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-primary/10 p-3.5 text-primary shrink-0">
                        <Building2 className="size-7" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            {item.name}
                          </h3>
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  className={`cursor-help font-bold text-xs py-1 px-3 ${
                                    item.signedContracts.count > 0
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                  }`}
                                >
                                  <PieChart className="mr-1.5 size-3.5" />
                                  {item.signedSharePercentage}% de Share Doculoc
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs p-3 leading-relaxed bg-stone-900 text-stone-100 border border-stone-800">
                                <p className="font-semibold text-emerald-400">
                                  Share Doculoc (% de Assinados)
                                </p>
                                <p className="text-stone-300 mt-1">
                                  Representa a fatia que esta imobiliária possui sobre todos os contratos assinados da Doculoc.
                                </p>
                                <div className="mt-2 rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-emerald-300">
                                  Fórmula: ({item.signedContracts.count} ÷ {doculocGlobal.totalSignedContracts.count}) × 100 = {item.signedSharePercentage}%
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.email}
                          {item.document && ` • Documento: ${formatDocument(item.document)}`}
                        </p>
                      </div>
                    </div>

                    {/* Destaque de Contratos Fechados no Topo */}
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-3.5">
                      <div>
                        <span className="block text-[0.68rem] font-semibold uppercase tracking-wider text-emerald-800">
                          Participação de Receita Fechada
                        </span>
                        <strong className="text-xl font-bold text-emerald-950">
                          {item.signedContracts.count} de {doculocGlobal.totalSignedContracts.count} assinados
                        </strong>
                        <span className="block text-xs font-semibold text-emerald-700">
                          {formatCurrency(item.signedContracts.totalValue)} em receita
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra Larga de Representatividade Doculoc */}
                  <div className="space-y-2 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4">
                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-1">
                      <span className="font-medium">
                        Representatividade desta imobiliária sobre o total de contratos assinados da Doculoc:
                      </span>
                      <span className="font-bold text-emerald-700">
                        {item.signedSharePercentage}% do total Doculoc
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(item.signedSharePercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* 5 Indicadores Expandidos em Linha Completa (Sem espaço em branco) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
                    {/* 1. Consultas */}
                    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Consultas
                        </span>
                        <ClipboardList className="size-4 text-muted-foreground" />
                      </div>
                      <strong className="mt-2 block text-2xl font-bold text-foreground">
                        {item.totalApplications}
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        analisadas no período
                      </span>
                    </div>

                    {/* 2. Contratos Gerados */}
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                      <div className="flex items-center justify-between text-blue-700">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Gerados
                        </span>
                        <CheckCircle2 className="size-4 text-blue-600" />
                      </div>
                      <strong className="mt-2 block text-2xl font-bold text-blue-900">
                        {item.generatedContracts.count}
                      </strong>
                      <span className="text-xs font-semibold text-blue-700 block truncate">
                        {formatCurrency(item.generatedContracts.totalValue)}
                      </span>
                    </div>

                    {/* 3. Contratos Assinados (Destaque Principal) */}
                    <div className="col-span-2 sm:col-span-1 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-emerald-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                          Assinados
                        </span>
                        <Badge className="bg-emerald-600 text-white text-[0.68rem] px-2 py-0.5">
                          {item.signedConversionRate}% dos gerados
                        </Badge>
                      </div>
                      <strong className="mt-2 block text-2xl font-bold text-emerald-950">
                        {item.signedContracts.count}
                      </strong>
                      <span className="text-xs font-bold text-emerald-700 block truncate">
                        {formatCurrency(item.signedContracts.totalValue)}
                      </span>
                    </div>

                    {/* 4. Contratos Declinados */}
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                      <div className="flex items-center justify-between text-rose-700">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Declinados
                        </span>
                        <XCircle className="size-4 text-rose-600" />
                      </div>
                      <strong className="mt-2 block text-2xl font-bold text-rose-900">
                        {item.declinedContracts.count}
                      </strong>
                      <span className="text-xs font-semibold text-rose-700 block truncate">
                        {formatCurrency(item.declinedContracts.totalValue)}
                      </span>
                    </div>

                    {/* 5. Ticket Médio */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                      <div className="flex items-center justify-between text-indigo-700">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Ticket Médio
                        </span>
                        <TrendingUp className="size-4 text-indigo-600" />
                      </div>
                      <strong className="mt-2 block text-xl sm:text-2xl font-bold text-indigo-950 whitespace-nowrap">
                        {formatCurrency(item.averageTicket)}
                      </strong>
                      <span className="text-xs text-indigo-700">
                        por contrato gerado
                      </span>
                    </div>
                  </div>

                  {/* Funil Visual Exclusivo da Imobiliária */}
                  <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground uppercase tracking-wider">
                        Funil Comercial desta Imobiliária
                      </span>
                      <Badge variant="outline" className="font-semibold">
                        Conversão Geral: {item.conversionRate}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border bg-white p-3 text-center">
                        <span className="text-[0.68rem] text-muted-foreground uppercase font-semibold block">
                          1. Consultas
                        </span>
                        <strong className="text-lg font-bold text-foreground">
                          {item.totalApplications}
                        </strong>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-center">
                        <span className="text-[0.68rem] text-blue-700 uppercase font-semibold block">
                          2. Gerados ({item.conversionRate}%)
                        </span>
                        <strong className="text-lg font-bold text-blue-900">
                          {item.generatedContracts.count}
                        </strong>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                        <span className="text-[0.68rem] text-emerald-800 uppercase font-semibold block">
                          3. Assinados ({item.signedConversionRate}%)
                        </span>
                        <strong className="text-lg font-bold text-emerald-950">
                          {item.signedContracts.count}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* QUANDO NÃO FILTRADO: 2 CARDS POR LINHA, CARDS MAIORES E PAGINAÇÃO DE 6 POR PÁGINA */
            <div className="space-y-6">
              <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
                {reportItems
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item, index) => {
                    const globalIndex = (currentPage - 1) * itemsPerPage + index;
                    const isTop = globalIndex === 0 && item.signedContracts.count > 0;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-3xl border bg-white p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                      >
                        {/* Cabeçalho do Card */}
                        <div className="space-y-3 border-b pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {isTop ? (
                                  <Trophy className="size-5 shrink-0 text-amber-500" />
                                ) : (
                                  <Building2 className="size-5 shrink-0 text-muted-foreground" />
                                )}
                                <h3 className="truncate font-bold text-foreground text-lg sm:text-xl">
                                  {item.name}
                                </h3>
                              </div>
                              <p className="truncate text-xs text-muted-foreground mt-1">
                                {item.email}
                                {item.document && ` • ${formatDocument(item.document)}`}
                              </p>
                            </div>

                            {/* Badge de Share Doculoc */}
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    className={`shrink-0 cursor-help font-bold text-xs py-1 px-2.5 ${
                                      item.signedContracts.count > 0
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                    }`}
                                  >
                                    <PieChart className="mr-1 size-3.5" />
                                    {item.signedSharePercentage}%
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs p-3 leading-relaxed bg-stone-900 text-stone-100 border border-stone-800">
                                  <p className="font-semibold text-emerald-400">
                                    Share Doculoc (% de Assinados)
                                  </p>
                                  <p className="text-stone-300 mt-1">
                                    Representa a fatia que esta imobiliária possui sobre todos os contratos assinados da Doculoc.
                                  </p>
                                  <div className="mt-2 rounded bg-stone-800 p-1.5 font-mono text-[0.68rem] text-emerald-300">
                                    Fórmula: ({item.signedContracts.count} ÷ {doculocGlobal.totalSignedContracts.count}) × 100 = {item.signedSharePercentage}%
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          {/* Barra visual de participação no mercado Doculoc */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Participação no total da Doculoc</span>
                              <span className="font-semibold text-emerald-700">
                                {item.signedContracts.count} de {doculocGlobal.totalSignedContracts.count} assinados
                              </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                              <div
                                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(item.signedSharePercentage, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Grid de Mini-Métricas da Imobiliária (Perfeitamente Simétrico 4x2) */}
                        <div className="my-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {/* Consultas */}
                          <div className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">
                                Consultas
                              </span>
                              <ClipboardList className="size-4 shrink-0" />
                            </div>
                            <strong className="my-0.5 block text-xl font-bold text-foreground">
                              {item.totalApplications}
                            </strong>
                            <span className="text-[0.68rem] text-muted-foreground truncate">
                              analisadas
                            </span>
                          </div>

                          {/* Reprovadas */}
                          <div className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-amber-100 bg-amber-50/40 p-3">
                            <div className="flex items-center justify-between text-amber-700">
                              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">
                                Reprovadas
                              </span>
                              <ShieldAlert className="size-4 shrink-0" />
                            </div>
                            <strong className="my-0.5 block text-xl font-bold text-amber-900">
                              {item.rejectedApplications?.count ?? 0}
                            </strong>
                            <span className="text-[0.68rem] font-medium text-amber-700 truncate">
                              {item.rejectedApplications?.rate ?? 0}% reprovadas
                            </span>
                          </div>

                          {/* Somente Consulta (Sem Contrato) */}
                          <div className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3">
                            <div className="flex items-center justify-between text-stone-600">
                              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">
                                Só Consulta
                              </span>
                              <Search className="size-4 shrink-0 text-stone-500" />
                            </div>
                            <strong className="my-0.5 block text-xl font-bold text-foreground">
                              {item.onlyConsultedApplications?.count ?? 0}
                            </strong>
                            <span className="text-[0.68rem] text-muted-foreground truncate">
                              {item.onlyConsultedApplications?.rate ?? 0}% sem contrato
                            </span>
                          </div>

                          {/* Declinado pelo Locatário */}
                          <div className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                            <div className="flex items-center justify-between text-rose-700">
                              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">
                                Declinado Locatário
                              </span>
                              <UserX className="size-4 shrink-0" />
                            </div>
                            <strong className="my-0.5 block text-xl font-bold text-rose-900">
                              {item.declinedContracts.count}
                            </strong>
                            <span className="text-[0.68rem] text-rose-700 truncate">
                              {formatCurrency(item.declinedContracts.totalValue)}
                            </span>
                          </div>

                          {/* Contratos Gerados */}
                          <div className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/40 p-3">
                            <div className="flex items-center justify-between text-blue-700">
                              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">
                                Gerados
                              </span>
                              <CheckCircle2 className="size-4 shrink-0" />
                            </div>
                            <strong className="my-0.5 block text-xl font-bold text-blue-900">
                              {item.generatedContracts.count}
                            </strong>
                            <span className="text-[0.68rem] font-semibold text-blue-700 truncate">
                              {formatCurrency(item.generatedContracts.totalValue)}
                            </span>
                          </div>

                          {/* Contratos Assinados (Destaque Principal) */}
                          <div className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
                            <div className="flex items-center justify-between text-emerald-800">
                              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-900">
                                Assinados
                              </span>
                              <Badge className="bg-emerald-600 text-white text-[0.65rem] px-1 py-0">
                                {item.signedConversionRate}%
                              </Badge>
                            </div>
                            <strong className="my-0.5 block text-xl font-bold text-emerald-950">
                              {item.signedContracts.count}
                            </strong>
                            <span className="text-[0.68rem] font-bold text-emerald-700 truncate">
                              {formatCurrency(item.signedContracts.totalValue)}
                            </span>
                          </div>

                          {/* Ticket Médio */}
                          <div className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">
                                Ticket Médio
                              </span>
                              <TrendingUp className="size-4 shrink-0 text-stone-500" />
                            </div>
                            <strong className="my-0.5 block text-lg font-bold text-foreground truncate">
                              {formatCurrency(item.averageTicket)}
                            </strong>
                            <span className="text-[0.68rem] text-muted-foreground truncate">
                              por contrato gerado
                            </span>
                          </div>

                          {/* Conversão Geral */}
                          <div className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                            <div className="flex items-center justify-between text-indigo-700">
                              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">
                                Conversão
                              </span>
                              <PieChart className="size-4 shrink-0" />
                            </div>
                            <strong className="my-0.5 block text-xl font-bold text-indigo-950">
                              {item.conversionRate}%
                            </strong>
                            <span className="text-[0.68rem] text-indigo-700 truncate">
                              consultas ➔ gerados
                            </span>
                          </div>
                        </div>

                        {/* Rodapé do Card */}
                        <div className="flex items-center justify-between border-t pt-3 text-xs">
                          <span className="text-muted-foreground">
                            Eficiência de Fechamento (Assinados / Gerados):
                          </span>
                          <Badge
                            variant={item.signedConversionRate > 0 ? "secondary" : "outline"}
                            className={
                              item.signedConversionRate >= 50
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                                : "font-semibold"
                            }
                          >
                            {item.signedConversionRate}% fechados
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Paginação: 6 imobiliárias por página */}
              {reportItems.length > itemsPerPage && (
                <div className="pt-2">
                  <Pagination
                    page={currentPage}
                    perPage={itemsPerPage}
                    total={reportItems.length}
                    onPageChange={setCurrentPage}
                    itemLabel="imobiliárias"
                  />
                </div>
              )}
            </div>
          )
        ) : (
          /* MODO TABELA TRADICIONAL */
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm sm:rounded-3xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-foreground">Imobiliária</TableHead>
                    <TableHead className="text-center font-semibold text-foreground">
                      Consultas
                    </TableHead>
                    <TableHead className="text-center font-semibold text-amber-700">
                      Reprovadas
                    </TableHead>
                    <TableHead className="text-center font-semibold text-stone-600">
                      Só Consulta
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      Contratos Gerados
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-emerald-700">
                      Contratos Assinados
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      Share Doculoc (% Assinados)
                    </TableHead>
                    <TableHead className="font-semibold text-rose-700">
                      Declinado Locatário
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      Ticket Médio
                    </TableHead>
                    <TableHead className="text-right font-semibold text-foreground">
                      Conversão
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isIndividualFilter
                    ? reportItems
                    : reportItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  ).map((item) => (
                    <TableRow key={item.id} className="transition-colors hover:bg-muted/30">
                      <TableCell className="max-w-[220px]">
                        <div className="font-medium text-foreground truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.email}
                          {item.document && ` • ${formatDocument(item.document)}`}
                        </div>
                      </TableCell>

                      {/* Consultas */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-semibold">
                          {item.totalApplications}
                        </Badge>
                      </TableCell>

                      {/* Reprovadas */}
                      <TableCell className="text-center">
                        <div className="font-semibold text-amber-700">
                          {item.rejectedApplications?.count ?? 0}
                        </div>
                        <div className="text-[0.68rem] text-muted-foreground">
                          {item.rejectedApplications?.rate ?? 0}%
                        </div>
                      </TableCell>

                      {/* Só Consulta */}
                      <TableCell className="text-center">
                        <div className="font-semibold text-stone-700">
                          {item.onlyConsultedApplications?.count ?? 0}
                        </div>
                        <div className="text-[0.68rem] text-muted-foreground">
                          {item.onlyConsultedApplications?.rate ?? 0}%
                        </div>
                      </TableCell>

                      {/* Contratos Gerados */}
                      <TableCell>
                        <div className="font-medium text-blue-600">
                          {item.generatedContracts.count}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({formatCurrency(item.generatedContracts.totalValue)})
                          </span>
                        </div>
                      </TableCell>

                      {/* Contratos Assinados (Receita Fechada) */}
                      <TableCell>
                        <div className="font-semibold text-emerald-700">
                          {item.signedContracts.count}{" "}
                          <span className="text-xs font-normal text-emerald-600">
                            ({formatCurrency(item.signedContracts.totalValue)})
                          </span>
                        </div>
                        <div className="text-[0.68rem] text-muted-foreground">
                          {item.signedConversionRate}% dos gerados
                        </div>
                      </TableCell>

                      {/* Representatividade sobre o total da Doculoc */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={item.signedContracts.count > 0 ? "default" : "outline"}
                            className={
                              item.signedContracts.count > 0
                                ? "bg-emerald-600 hover:bg-emerald-700 font-bold"
                                : "text-muted-foreground"
                            }
                          >
                            <PieChart className="mr-1 size-3" />
                            {item.signedSharePercentage}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({item.signedContracts.count} de {doculocGlobal.totalSignedContracts.count})
                          </span>
                        </div>
                      </TableCell>

                      {/* Contratos Declinados */}
                      <TableCell>
                        <div className="font-medium text-rose-600">
                          {item.declinedContracts.count}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({formatCurrency(item.declinedContracts.totalValue)})
                          </span>
                        </div>
                      </TableCell>

                      {/* Ticket Médio */}
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {formatCurrency(item.averageTicket)}
                        </div>
                      </TableCell>

                      {/* Conversão */}
                      <TableCell className="text-right">
                        <Badge
                          variant={item.conversionRate > 0 ? "secondary" : "outline"}
                          className={
                            item.conversionRate >= 30
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ""
                          }
                        >
                          {item.conversionRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginação da Tabela */}
            {!isIndividualFilter && reportItems.length > itemsPerPage && (
              <Pagination
                page={currentPage}
                perPage={itemsPerPage}
                total={reportItems.length}
                onPageChange={setCurrentPage}
                itemLabel="imobiliárias"
              />
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
