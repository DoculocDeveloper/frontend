import { Link } from "react-router-dom";
import { useMemo, type ReactNode } from "react";
import { Eye, Download, FileText, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { type RentalApplication, isApplicationUnread } from "@/types/doculoc";
import { markApplicationAsViewed } from "@/services/rental-applications";
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
  onViewApplication,
}: {
  application: RentalApplication;
  basePath: string;
  isAdmin: boolean;
  onDownloadContract?: (application: RentalApplication) => void;
  onViewApplication?: (application: RentalApplication) => void;
}) {
  const hasContract = application.status === "CONTRACT_GENERATED" && application.contract?.id;
  const requester = application.requester;
  const requesterName = requester?.realEstateProfile?.name ?? requester?.name ?? "-";
  const isUnread = isAdmin && isApplicationUnread(application);

  return (
    <article className="rounded-3xl border bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            "shrink-0 rounded-2xl border p-2 transition-colors",
            isUnread
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-border bg-primary/5 text-primary"
          )}
        >
          <FileText className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="wrap-break-word text-base font-semibold text-foreground">
              {formatDocument(application.document, application.documentType)}
            </p>
            {isUnread ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                Nova consulta
              </span>
            ) : null}
          </div>
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
          <Link
            to={`${basePath}/consultas/${application.id}`}
            onClick={() => onViewApplication?.(application)}
          >
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
  const queryClient = useQueryClient();

  const handleView = (application: RentalApplication) => {
    if (isAdmin && isApplicationUnread(application)) {
      markApplicationAsViewed(application.id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["unread-applications-count"] });
      queryClient.setQueriesData({ queryKey: ["rental-applications"] }, (old: any) => {
        if (!old?.applications) return old;
        return {
          ...old,
          applications: old.applications.map((app: RentalApplication) =>
            app.id === application.id
              ? { ...app, adminViewedAt: new Date().toISOString() }
              : app
          ),
        };
      });
      queryClient.setQueriesData(
        { queryKey: ["admin-dashboard-applications"] },
        (old: any) => {
          if (!old?.applications) return old;
          return {
            ...old,
            applications: old.applications.map((app: RentalApplication) =>
              app.id === application.id
                ? { ...app, adminViewedAt: new Date().toISOString() }
                : app
            ),
          };
        }
      );
    }
  };

  const columns = useMemo<ColumnDef<RentalApplication>[]>(() => {
    const baseColumns: ColumnDef<RentalApplication>[] = [
      {
        accessorKey: "document",
        header: "Consulta",
        cell: ({ row }) => {
          const application = row.original;
          const isUnread = isAdmin && isApplicationUnread(application);

          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={cn(
                  "shrink-0 rounded-xl border p-1.5 transition-colors",
                  isUnread
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-border bg-primary/5 text-primary"
                )}
              >
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-medium text-sm text-foreground">
                    {formatDocument(application.document, application.documentType)}
                  </div>
                  {isUnread ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-600 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                      Nova consulta
                    </span>
                  ) : null}
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
          <div className="whitespace-nowrap">
            <div className="font-medium text-sm text-foreground">
              {formatCurrency(row.original.requestedExpense)}
            </div>
            <div className="text-[0.68rem] text-muted-foreground">Aluguel + encargos</div>
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
        cell: ({ row }) => {
          const formatted = formatDate(row.original.createdAt);
          if (formatted === "-") {
            return <span className="text-muted-foreground">-</span>;
          }
          const [date, time] = formatted.split(", ");

          return (
            <div className="text-xs leading-tight whitespace-nowrap">
              <div className="font-medium text-foreground">{date}</div>
              {time ? (
                <div className="text-[0.68rem] text-muted-foreground">{time}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-4">Ações</div>,
        cell: ({ row }) => {
          const application = row.original;
          const hasContract = application.status === "CONTRACT_GENERATED" && application.contract?.id;

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap pr-4">
              {hasContract && onDownloadContract && isAdmin ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  title="Baixar contrato"
                  className="h-8 w-8 rounded-xl"
                  onClick={() => onDownloadContract(application)}
                >
                  <Download className="size-4" />
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm" className="h-8 px-2.5 rounded-xl text-xs">
                <Link
                  to={`${basePath}/consultas/${application.id}`}
                  onClick={() => handleView(application)}
                >
                  <Eye className="size-3.5" />
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
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 rounded-xl bg-stone-100 p-1.5 text-stone-600">
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0 max-w-44 xl:max-w-60">
              <div className="truncate font-medium text-sm text-foreground">{profileName}</div>
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
            onViewApplication={handleView}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border bg-white/85 shadow-sm backdrop-blur lg:block">
        <Table className={cn("w-full")}>
          <TableHeader className="bg-stone-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 px-3 text-xs uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const isUnread = isAdmin && isApplicationUnread(row.original);
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    "bg-white/70 transition-colors",
                    isUnread && "bg-red-500/[0.025] hover:bg-red-500/[0.05]"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
