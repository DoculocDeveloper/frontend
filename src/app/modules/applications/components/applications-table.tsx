import { Link } from "react-router-dom";
import { useMemo, type ReactNode } from "react";
import { Eye, Download, FileText, Building2 } from "lucide-react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatDocument } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RentalApplication } from "@/types/doculoc";
import { ApplicationStatusBadge } from "./application-status-badge";

function MobileInfo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-stone-50/80 p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 wrap-break-word text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function ApplicationMobileCard({
  application,
  basePath,
  isAdmin,
  onDownloadContract,
}: {
  application: RentalApplication;
  basePath: string;
  isAdmin: boolean;
  onDownloadContract?: (application: RentalApplication) => void;
}) {
  const hasContract = application.status === "CONTRACT_GENERATED" && application.contract?.id;
  const requester = application.requester;
  const requesterName = requester?.realEstateProfile?.name ?? requester?.name ?? "-";

  return (
    <article className="rounded-3xl border bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-start gap-3">
        <div className="shrink-0 rounded-2xl border bg-primary/5 p-2 text-primary">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="wrap-break-word text-base font-semibold text-foreground">
            {formatDocument(application.document, application.documentType)}
          </p>
          {application.tenantName ? (
            <p className="truncate text-xs text-muted-foreground">{application.tenantName}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{application.documentType}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <ApplicationStatusBadge status={application.status} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {isAdmin ? (
          <MobileInfo
            label="Imobiliária"
            value={
              <span className="block min-w-0">
                <span className="block truncate">{requesterName}</span>
                <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                  {requester?.email ?? "Sem e-mail"}
                </span>
              </span>
            }
          />
        ) : null}
        <MobileInfo label="Pacote" value={formatCurrency(application.requestedExpense)} />
        <MobileInfo label="Criada em" value={formatDate(application.createdAt)} />
        <MobileInfo label="Tipo" value={application.documentType} />
      </div>

      <div className="mt-4 grid gap-2 sm:flex sm:justify-end">
        {hasContract && onDownloadContract ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onDownloadContract(application)}
          >
            <Download className="size-4" />
            Baixar contrato
          </Button>
        ) : null}
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to={`${basePath}/consultas/${application.id}`}>
            <Eye className="size-4" />
            Ver detalhes
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function ApplicationsTable({
  applications,
  basePath,
  isAdmin = false,
  onDownloadContract,
}: {
  applications: RentalApplication[];
  basePath: string;
  isAdmin?: boolean;
  onDownloadContract?: (application: RentalApplication) => void;
}) {
  const columns = useMemo<ColumnDef<RentalApplication>[]>(() => {
    const baseColumns: ColumnDef<RentalApplication>[] = [
      {
        accessorKey: "document",
        header: "Consulta",
        cell: ({ row }) => {
          const application = row.original;

          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-2xl border bg-primary/5 p-2 text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">
                  {formatDocument(application.document, application.documentType)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {application.tenantName || application.documentType}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "requestedExpense",
        header: "Pacote",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{formatCurrency(row.original.requestedExpense)}</div>
            <div className="text-xs text-muted-foreground">Aluguel + condomínio + IPTU</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status atual",
        cell: ({ row }) => <ApplicationStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Criada em",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const application = row.original;
          const hasContract = application.status === "CONTRACT_GENERATED" && application.contract?.id;

          return (
            <div className="flex justify-end gap-2">
              {hasContract && onDownloadContract && isAdmin ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  title="Baixar contrato"
                  onClick={() => onDownloadContract(application)}
                >
                  <Download className="size-4" />
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link to={`${basePath}/consultas/${application.id}`}>
                  <Eye className="size-4" />
                  Ver
                </Link>
              </Button>
            </div>
          );
        },
      },
    ];

    if (!isAdmin) return baseColumns;

    baseColumns.splice(1, 0, {
      id: "requester",
      header: "Imobiliária",
      cell: ({ row }) => {
        const requester = row.original.requester;
        const profileName = requester?.realEstateProfile?.name ?? requester?.name ?? "-";

        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-2xl bg-stone-100 p-2 text-stone-600">
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0 max-w-56">
              <div className="truncate font-medium text-foreground">{profileName}</div>
              <div className="truncate text-xs text-muted-foreground">{requester?.email ?? "Sem e-mail"}</div>
            </div>
          </div>
        );
      },
    });

    return baseColumns;
  }, [basePath, isAdmin, onDownloadContract]);

  const table = useReactTable({
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {applications.map((application) => (
          <ApplicationMobileCard
            key={application.id}
            application={application}
            basePath={basePath}
            isAdmin={isAdmin}
            onDownloadContract={onDownloadContract}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border bg-white/85 shadow-sm backdrop-blur lg:block">
        <Table className={cn("min-w-190", isAdmin && "min-w-245")}>
          <TableHeader className="bg-stone-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="bg-white/70">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
