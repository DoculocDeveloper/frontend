import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Download, FileCheck2, FileClock, FileSearch, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { listRentalApplications } from "@/services/rental-applications";
import { downloadContract, downloadSignedContract } from "@/services/contracts";
import { getApiErrorMessage } from "@/services/api";
import type { RentalApplication } from "@/types/doculoc";
import { cn } from "@/lib/utils";
import { ApplicationsTable } from "../components/applications-table";

type ContractTab = "PENDING" | "SIGNED";

export function ContractsPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const [activeTab, setActiveTab] = useState<ContractTab>("PENDING");
  const [documentInput, setDocumentInput] = useState("");
  const [debouncedDocument, setDebouncedDocument] = useState("");
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

  function handleTabChange(tab: ContractTab) {
    setActiveTab(tab);
    setPage(1);
  }

  // 1. Busca lista de contratos paginada para a aba ativa
  const { data: listData, isLoading } = useQuery({
    queryKey: ["contracts-tab-list", activeTab, debouncedDocument, page, perPage, isAdmin],
    queryFn: () =>
      listRentalApplications({
        contractView: activeTab,
        document: debouncedDocument,
        page,
        perPage,
      }),
  });

  // 2. Contagem e status de Pendentes
  const { data: pendingCountData } = useQuery({
    queryKey: ["contracts-count-pending", debouncedDocument, isAdmin],
    queryFn: () =>
      listRentalApplications({
        contractView: "PENDING",
        document: debouncedDocument,
        page: 1,
        perPage: 1,
      }),
  });

  // 3. Contagem e status de Assinados (100% assinados)
  const { data: signedCountData } = useQuery({
    queryKey: ["contracts-count-signed", debouncedDocument, isAdmin],
    queryFn: () =>
      listRentalApplications({
        contractView: "SIGNED",
        document: debouncedDocument,
        page: 1,
        perPage: 1,
      }),
  });

  const pendingCount = pendingCountData?.meta?.total ?? 0;
  const signedCount = signedCountData?.meta?.total ?? 0;

  const applications = listData?.applications ?? [];
  const meta = listData?.meta;

  async function handleDownload(application: RentalApplication) {
    if (!application.contract?.id) return;

    try {
      await downloadContract(
        application.contract.id,
        application.contract.fileName ?? undefined,
      );
      toast.success("Download do contrato iniciado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleDownloadSigned(application: RentalApplication) {
    if (!application.contract?.id) return;

    try {
      await downloadSignedContract(
        application.contract.id,
        `contrato-assinado-${application.document}.pdf`,
      );
      toast.success("Download do contrato assinado iniciado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function handlePerPageChange(newPerPage: number) {
    setPerPage(newPerPage);
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const title =
    activeTab === "PENDING" ? "Contratos pendentes" : "Contratos assinados";
  const description =
    activeTab === "PENDING"
      ? "Contratos em andamento que ainda não foram 100% assinados ou aguardam geração do DOCX."
      : "Contratos com assinaturas 100% concluídas via Clicksign, disponíveis para download do PDF oficial.";

  return (
    <PageShell className="max-w-full">
      <Helmet title={`Contratos | Doculoc`} />

      <PageHeader
        eyebrow="CONTRATOS"
        title={title}
        description={description}
      />

      {/* Seletor de abas estilizado */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("PENDING")}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer shadow-xs",
            activeTab === "PENDING"
              ? "bg-primary text-white shadow-primary/20 shadow-md"
              : "border border-border bg-white/80 text-muted-foreground hover:bg-stone-50 hover:text-foreground",
          )}
        >
          <FileClock className="size-4" />
          <span>Pendentes</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              activeTab === "PENDING"
                ? "bg-white/20 text-white"
                : "bg-stone-100 text-stone-700",
            )}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("SIGNED")}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer shadow-xs",
            activeTab === "SIGNED"
              ? "bg-emerald-600 text-white shadow-emerald-600/20 shadow-md"
              : "border border-border bg-white/80 text-muted-foreground hover:bg-stone-50 hover:text-foreground",
          )}
        >
          <FileCheck2 className="size-4" />
          <span>Assinados</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              activeTab === "SIGNED"
                ? "bg-white/20 text-white"
                : "bg-stone-100 text-stone-700",
            )}
          >
            {signedCount}
          </span>
        </button>
      </div>

      {/* Barra de busca e totalizador */}
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

          <div className="flex w-full items-center justify-center gap-2 rounded-full border bg-stone-50 px-3 py-2 text-sm text-muted-foreground sm:w-auto">
            <Download className="size-4" />
            {meta?.total ?? 0} registros
          </div>
        </div>
      </div>

      {/* Conteúdo da tabela ou estado vazio */}
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
            onDownloadSignedContract={handleDownloadSigned}
          />

          {meta && (
            <Pagination
              page={page}
              perPage={perPage}
              total={meta.total}
              lastPage={meta.lastPage}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={<FileSearch className="size-8 text-muted-foreground" />}
          title={
            activeTab === "PENDING"
              ? "Nenhum contrato pendente encontrado"
              : "Nenhum contrato assinado encontrado"
          }
          description={
            debouncedDocument
              ? "Nenhum contrato corresponde ao filtro informado. Tente buscar por outro termo."
              : activeTab === "PENDING"
                ? "Não há contratos aguardando assinatura no momento."
                : "Ainda não há contratos com o fluxo de assinatura 100% finalizado."
          }
        />
      )}
    </PageShell>
  );
}
