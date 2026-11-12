import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FilterX,
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
    declinedContracts: { count: 0, totalValue: 0 },
    averageTicket: 0,
    conversionRate: 0,
  };

  const reportItems = data?.realEstates ?? [];

  return (
    <PageShell>
      <Helmet title="Relatórios | Admin Doculoc" />

      <PageHeader
        eyebrow="Admin Doculoc"
        title="Relatórios Operacionais e Conversão"
        description="Acompanhe o desempenho de consultas e contratos gerados, declinados e o ticket médio geral ou individual por imobiliária."
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

      {/* Cards de Métricas */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Consultas realizadas */}
          <MetricCard
            label="Consultas Realizadas"
            value={totals.totalApplications}
            description="Total de consultas no período"
            icon={<ClipboardList className="size-5" />}
          />

          {/* Contratos Gerados */}
          <MetricCard
            label="Contratos Gerados"
            value={totals.generatedContracts.count}
            description={`Total: ${formatCurrency(
              totals.generatedContracts.totalValue
            )}`}
            icon={<CheckCircle2 className="size-5 text-emerald-600" />}
          />

          {/* Contratos Declinados */}
          <MetricCard
            label="Contratos Declinados"
            value={totals.declinedContracts.count}
            description={`Total: ${formatCurrency(
              totals.declinedContracts.totalValue
            )}`}
            icon={<XCircle className="size-5 text-rose-600" />}
          />

          {/* Ticket Médio */}
          <MetricCard
            label="Ticket Médio"
            value={formatCurrency(totals.averageTicket)}
            description={`Conversão: ${totals.conversionRate}%`}
            icon={<TrendingUp className="size-5 text-indigo-600" />}
          />
        </div>
      )}

      {/* Tabela de Detalhamento por Imobiliária */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Resumo por Imobiliária
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Detalhamento de volume, contratos gerados, declinados e ticket médio de cada parceiro.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {reportItems.length} {reportItems.length === 1 ? "imobiliária" : "imobiliárias"}
          </span>
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
                    <TableCell className="max-w-[240px]">
                      <div className="font-medium text-foreground truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.email}
                        {item.document && ` • ${formatDocument(item.document)}`}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold">
                        {item.totalApplications}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-emerald-600">
                        {item.generatedContracts.count}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({formatCurrency(item.generatedContracts.totalValue)})
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-rose-600">
                        {item.declinedContracts.count}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({formatCurrency(item.declinedContracts.totalValue)})
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(item.averageTicket)}
                      </div>
                    </TableCell>

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
