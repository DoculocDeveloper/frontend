import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  FileCheck2,
  FileClock,
  MessageSquareWarning,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  MetricCard,
  PageHeader,
  PageShell,
} from "@/app/modules/_components/page-shell";
import { getApiErrorMessage } from "@/services/api";
import { downloadContract } from "@/services/contracts";
import { listRentalApplications } from "@/services/rental-applications";
import type { RentalApplication } from "@/types/doculoc";
import { ApplicationsTable } from "@/app/modules/applications/components/applications-table";

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-applications"],
    queryFn: () => listRentalApplications({ page: 1, perPage: 100 }),
    refetchInterval: 5000,
  });

  const applications = data?.applications ?? [];
  const contested = applications.filter(
    (application) => application.status === "CONTESTED",
  ).length;
  const pendingContracts = applications.filter(
    (application) => application.status === "WAITING_ADMIN_CONTRACT",
  ).length;
  const generatedContracts = applications.filter(
    (application) => application.status === "CONTRACT_GENERATED",
  ).length;
  const rejected = applications.filter(
    (application) =>
      application.status === "REJECTED" ||
      application.status === "ADMIN_REJECTED",
  ).length;

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
      <Helmet title="Dashboard" />

      <PageHeader
        eyebrow="Admin Doculoc"
        title="Central de decisões e contratos"
        description="Monitore consultas, contestações, contratos pendentes e créditos das imobiliárias em um único painel operacional."
        action={
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Button asChild variant="outline">
              <Link to="/admin/imobiliarias">
                <Building2 className="size-4" />
                Imobiliárias
              </Link>
            </Button>
            <Button asChild className="beam-button shadow-lg shadow-primary/15">
              <Link to="/admin/contratos">
                <FileClock className="size-4" />
                Contratos pendentes
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Consultas"
          value={data?.meta.total ?? applications.length}
          description="Registros retornados"
          icon={<ClipboardList className="size-5" />}
        />
        <MetricCard
          label="Contestadas"
          value={contested}
          description="Aguardando decisão"
          icon={<MessageSquareWarning className="size-5" />}
        />
        <MetricCard
          label="Contratos pendentes"
          value={pendingContracts}
          description="Prontos para gerar"
          icon={<FileClock className="size-5" />}
        />
        <MetricCard
          label="Contratos gerados"
          value={generatedContracts}
          description={`${rejected} casos reprovados`}
          icon={<FileCheck2 className="size-5" />}
        />
      </div>

      <div>
        {isLoading ? (
          <div className="h-96 animate-pulse rounded-3xl border bg-white/70" />
        ) : (
          <ApplicationsTable
            applications={applications.slice(0, 6)}
            basePath="/admin"
            isAdmin
            onDownloadContract={handleDownload}
          />
        )}
      </div>
    </PageShell>
  );
}
