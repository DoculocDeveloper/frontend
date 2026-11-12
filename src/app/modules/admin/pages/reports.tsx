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
  PieChart,
  TrendingUp,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export function ReportsPage() {
  const [selectedRealEstateId, setSelectedRealEstateId] = useState<string>("ALL");
  const [datePreset, setDatePreset] = useState<DatePreset>("last30");
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
    handleApplyPreset("last30");
  };

  const totals = data?.totals ?? {
    totalApplications: 0,
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
        title="Relatórios Operacionais e Conversão"
        description="Acompanhe o volume de consultas, contratos gerados, contratos assinados (receita fechada), contratos declinados e a representatividade de cada imobiliária no total da Doculoc."
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
              onValueChange={setSelectedRealEstateId}
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

      {/* Cards de Métricas Principais */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
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
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {/* Consultas realizadas */}
          <MetricCard
            label="Consultas Realizadas"
            value={totals.totalApplications}
            description="No período selecionado"
            icon={<ClipboardList className="size-4.5" />}
          />

          {/* Contratos Gerados */}
          <MetricCard
            label="Contratos Gerados"
            value={totals.generatedContracts.count}
            description={`Total: ${formatCurrency(
              totals.generatedContracts.totalValue
            )}`}
            icon={<CheckCircle2 className="size-4.5 text-blue-600" />}
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
          />

          {/* Contratos Declinados */}
          <MetricCard
            label="Contratos Declinados"
            value={totals.declinedContracts.count}
            description={`Total: ${formatCurrency(
              totals.declinedContracts.totalValue
            )}`}
            icon={<XCircle className="size-4.5 text-rose-600" />}
          />

          {/* Ticket Médio */}
          <MetricCard
            label="Ticket Médio"
            value={formatCurrency(totals.averageTicket)}
            description={`Conversão: ${totals.conversionRate}%`}
            icon={<TrendingUp className="size-4.5 text-indigo-600" />}
          />
        </div>
      )}

      {/* Tabela de Detalhamento por Imobiliária */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Resumo e Representatividade por Imobiliária
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Métricas de receita fechada (assinados), volume gerado, declinado, ticket médio e o percentual que cada imobiliária representa do total da Doculoc.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Total Doculoc Assinados: {doculocGlobal.totalSignedContracts.count} ({formatCurrency(doculocGlobal.totalSignedContracts.totalValue)})
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : reportItems.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-6 text-muted-foreground" />}
            title="Nenhum dado encontrado"
            description="Nenhuma consulta ou contrato registrado para os filtros selecionados."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm sm:rounded-3xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground">Imobiliária</TableHead>
                  <TableHead className="text-center font-semibold text-foreground">
                    Consultas
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
                  <TableHead className="font-semibold text-foreground">
                    Contratos Declinados
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
                {reportItems.map((item) => (
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
        )}
      </div>
    </PageShell>
  );
}
