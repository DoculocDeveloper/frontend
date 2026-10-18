import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Download, FileSearch, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { listRentalApplications } from "@/services/rental-applications";
import { downloadContract } from "@/services/contracts";
import { getApiErrorMessage } from "@/services/api";
import type { RentalApplication, RentalApplicationStatus } from "@/types/doculoc";
import { useAuth } from "@/hooks/use-auth";
import { normalizeRole } from "@/types/auth";
import { statusOptions } from "@/lib/status";
import { ApplicationsTable } from "../components/applications-table";

export function ApplicationsPage({
  isAdmin = false,
  forcedStatus,
  title,
  description,
  eyebrow,
}: {
  isAdmin?: boolean;
  forcedStatus?: RentalApplicationStatus;
  title?: string;
  description?: string;
  eyebrow?: string;
}) {
  const { session } = useAuth();
  const isSeller = normalizeRole(session?.user.role) === "SELLER";
  const [documentInput, setDocumentInput] = useState("");
  const [debouncedDocument, setDebouncedDocument] = useState("");
  const [status, setStatus] = useState<RentalApplicationStatus | "ALL">(forcedStatus ?? "ALL");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const basePath = isAdmin ? "/admin" : "/real_estate";

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDocument(documentInput);
      setPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [documentInput]);

  const effectiveStatus = forcedStatus ?? status;
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["rental-applications", effectiveStatus, debouncedDocument, page, perPage, isAdmin],
    queryFn: () =>
      listRentalApplications({
        status: effectiveStatus,
        document: debouncedDocument,
        page,
        perPage,
      }),
  });

  function handleStatusChange(value: RentalApplicationStatus | "ALL") {
    setStatus(value);
    setPage(1);
  }

  function handlePerPageChange(newPerPage: number) {
    setPerPage(newPerPage);
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDownload(application: RentalApplication) {
    if (!application.contract?.id) return;

    try {
      await downloadContract(application.contract.id, application.contract.fileName ?? undefined);
      toast.success("Download iniciado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const applications = data?.applications ?? [];
  const meta = data?.meta;

  return (
    <PageShell className="max-w-full">
      <Helmet title={title ?? (isAdmin ? "Consultas" : isSeller ? "Consultas e Contratos" : "Minhas consultas")} />

      <PageHeader
        eyebrow={eyebrow ?? (isAdmin ? "Operação Admin" : isSeller ? "Acompanhamento" : "Carteira de consultas")}
        title={title ?? (isAdmin ? "Consultas" : isSeller ? "Consultas e Contratos" : "Minhas consultas")}
        description={
          description ??
          (isSeller
            ? "Visualização dos contratos gerados e consultas da imobiliária vinculada."
            : "Acompanhe o ciclo completo de análise, contestação, preenchimento de dados e geração do contrato.")
        }
        action={
          !isAdmin && !isSeller ? (
            <Button asChild size="lg" className="beam-button shadow-lg shadow-primary/15">
              <Link to="/real_estate/nova-consulta">
                <Plus className="size-4" />
                Nova consulta
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="rounded-3xl border bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-2xl bg-white pl-10"
              placeholder="Buscar por CPF ou CNPJ"
              value={documentInput}
              onChange={(event) => setDocumentInput(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {!forcedStatus ? (
              <Select value={status} onValueChange={(value) => handleStatusChange(value as RentalApplicationStatus | "ALL")}>
                <SelectTrigger className="h-11 w-full rounded-2xl bg-white sm:w-64">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <div className="flex w-full items-center justify-center gap-2 rounded-full border bg-stone-50 px-3 py-2 text-sm text-muted-foreground sm:w-auto">
              <Download className="size-4" />
              {meta?.total ?? 0} registros
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-3xl border bg-white/70" />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <>
          <ApplicationsTable
            applications={applications}
            basePath={basePath}
            isAdmin={isAdmin}
            onDownloadContract={handleDownload}
          />

          {meta && (
            <Pagination
              page={page}
              perPage={perPage}
              total={meta.total}
              lastPage={meta.lastPage}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              isLoading={isFetching}
              perPageOptions={[10, 20, 50]}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={<FileSearch className="size-7" />}
          title="Nenhuma consulta encontrada"
          description="Ajuste os filtros ou crie uma nova consulta para iniciar o fluxo de garantia locatícia."
          action={
            !isAdmin ? (
              <Button asChild>
                <Link to="/real_estate/nova-consulta">Criar primeira consulta</Link>
              </Button>
            ) : null
          }
        />
      )}

      {isFetching && !isLoading ? (
        <p className="text-center text-xs text-muted-foreground">Atualizando lista...</p>
      ) : null}
    </PageShell>
  );
}
