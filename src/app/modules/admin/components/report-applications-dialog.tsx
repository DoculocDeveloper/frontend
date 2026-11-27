import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ExternalLink,
  FileSearch,
  Search,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatDocument } from "@/lib/format";
import type { RentalApplicationStatus } from "@/types/doculoc";
import {
  getReportApplications,
  type ReportApplicationCategory,
} from "@/services/reports";
import { ApplicationStatusBadge } from "@/app/modules/applications/components/application-status-badge";

export type ReportModalFilter = {
  category: ReportApplicationCategory;
  title: string;
  requesterId?: string;
  requesterName?: string;
};

export function ReportApplicationsDialog({
  filter,
  startDate,
  endDate,
  onClose,
}: {
  filter: ReportModalFilter | null;
  startDate?: string;
  endDate?: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "report-applications",
      filter?.category,
      filter?.requesterId,
      startDate,
      endDate,
    ],
    queryFn: () =>
      getReportApplications({
        category: filter!.category,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        requesterId: filter?.requesterId,
      }),
    enabled: Boolean(filter),
  });

  const filteredApplications = useMemo(() => {
    const list = data?.applications ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;

    const termDigits = term.replace(/\D/g, "");
    return list.filter((app) => {
      const nameMatch = (app.tenantName ?? "").toLowerCase().includes(term);
      const requesterMatch = app.requesterName.toLowerCase().includes(term);
      const docMatch =
        app.document.toLowerCase().includes(term) ||
        (termDigits && app.document.replace(/\D/g, "").includes(termDigits));

      return nameMatch || requesterMatch || docMatch;
    });
  }, [data?.applications, search]);

  return (
    <Dialog
      open={Boolean(filter)}
      onOpenChange={(open) => {
        if (!open) {
          setSearch("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-4 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b bg-stone-50/70">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div className="space-y-1">
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                {filter?.title}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span>
                  {filter?.requesterName
                    ? `Imobiliária: ${filter.requesterName}`
                    : "Todas as imobiliárias"}
                </span>
                {data ? (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="font-semibold">
                      {data.total} {data.total === 1 ? "consulta" : "consultas"}
                    </Badge>
                    <Badge variant="outline" className="font-semibold">
                      Total: {formatCurrency(data.totalValue)}
                    </Badge>
                  </>
                ) : null}
              </DialogDescription>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 rounded-xl bg-white pl-9 pr-9"
              placeholder="Buscar por nome, CPF/CNPJ ou imobiliária..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-rose-600">
              Erro ao carregar as consultas. Tente novamente.
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSearch className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">
                Nenhuma consulta encontrada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? "Tente limpar ou alterar o termo de busca."
                  : "Não há registros para este filtro no período selecionado."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 rounded-2xl border bg-white">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-stone-50/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {formatDocument(app.document, app.documentType)}
                      </span>
                      <ApplicationStatusBadge
                        status={app.status as RentalApplicationStatus}
                        signatureStatus={app.contract?.signatureStatus}
                      />
                    </div>
                    <p className="truncate text-sm text-foreground/90">
                      {app.tenantName || "Sem nome identificado"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {!filter?.requesterId ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-3.5" />
                          {app.requesterName}
                        </span>
                      ) : null}
                      <span>Valor: {formatCurrency(app.value)}</span>
                      <span>Criada em {formatDate(app.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl text-xs font-medium"
                    >
                      <Link
                        to={`/admin/consultas/${app.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3.5 mr-1.5" />
                        Ver detalhes
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
