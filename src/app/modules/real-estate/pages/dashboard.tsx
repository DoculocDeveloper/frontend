import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  FileCheck2,
  FileClock,
  MessageSquareWarning,
  Plus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  MetricCard,
  PageHeader,
  PageShell,
} from "@/app/modules/_components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/services/api";
import { downloadContract } from "@/services/contracts";
import { listRentalApplications } from "@/services/rental-applications";
import type { RentalApplication } from "@/types/doculoc";
import { ApplicationsTable } from "@/app/modules/applications/components/applications-table";

export function RealEstateDashboard() {
  const { session } = useAuth();
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
    session?.user.name ??
    "Imobiliária";

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
        eyebrow="Portal da imobiliária"
        title={`Olá, ${companyName}`}
        description="Faça consultas de CPF ou CNPJ, acompanhe decisões e avance os casos aprovados para contrato sem perder o contexto."
        action={
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
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Consultas"
          value={data?.meta.total ?? applications.length}
          description="Seu histórico"
          icon={<ClipboardList className="size-5" />}
        />
        <MetricCard
          label="Para contrato"
          value={waitingContractData}
          description="Aguardando seus dados"
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
    </PageShell>
  );
}
