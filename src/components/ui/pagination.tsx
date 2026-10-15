import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  lastPage?: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  isLoading?: boolean;
  perPageOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export function Pagination({
  page,
  perPage,
  total,
  lastPage: providedLastPage,
  onPageChange,
  onPerPageChange,
  isLoading = false,
  perPageOptions = [10, 20, 50],
  className,
  itemLabel = "consultas",
}: PaginationProps) {
  const totalPages = Math.max(1, providedLastPage ?? Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  function getPageNumbers(): (number | string)[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Paginação"
      className={cn(
        "flex flex-col gap-4 rounded-3xl border bg-white/85 p-3.5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5",
        className
      )}
    >
      {/* Texto de contagem e seletor de itens */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground sm:justify-start sm:text-sm">
        <span>
          Mostrando <strong className="font-semibold text-foreground">{from}</strong> a{" "}
          <strong className="font-semibold text-foreground">{to}</strong> de{" "}
          <strong className="font-semibold text-foreground">{total}</strong> {itemLabel}
        </span>

        {onPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">|</span>
            <span className="hidden text-xs sm:inline">Exibir:</span>
            <Select
              value={String(perPage)}
              onValueChange={(val) => onPerPageChange(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-20 rounded-xl bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs">/ pág</span>
          </div>
        )}
      </div>

      {/* Controles de navegação */}
      <div className="flex items-center justify-center gap-1 sm:justify-end">
        {/* Ir para primeira página */}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8 rounded-xl border-border bg-white text-muted-foreground hover:bg-stone-50 hover:text-foreground disabled:opacity-40"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Primeira página"
          title="Primeira página"
        >
          <ChevronsLeft className="size-4" />
        </Button>

        {/* Página anterior */}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8 rounded-xl border-border bg-white text-muted-foreground hover:bg-stone-50 hover:text-foreground disabled:opacity-40"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Páginas numéricas (visíveis em telas sm+) */}
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex size-8 items-center justify-center text-xs text-muted-foreground"
                >
                  …
                </span>
              );
            }

            const pageNum = p as number;
            const isCurrent = pageNum === currentPage;

            return (
              <Button
                key={pageNum}
                type="button"
                variant={isCurrent ? "default" : "outline"}
                size="icon-sm"
                className={cn(
                  "size-8 rounded-xl text-xs transition-all",
                  isCurrent
                    ? "font-semibold shadow-sm"
                    : "border-border bg-white text-foreground hover:bg-stone-50"
                )}
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Página ${pageNum}`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Indicador simples para mobile */}
        <span className="px-2 text-xs font-medium text-foreground sm:hidden">
          {currentPage} / {totalPages}
        </span>

        {/* Próxima página */}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8 rounded-xl border-border bg-white text-muted-foreground hover:bg-stone-50 hover:text-foreground disabled:opacity-40"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="Próxima página"
          title="Próxima página"
        >
          <ChevronRight className="size-4" />
        </Button>

        {/* Ir para última página */}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8 rounded-xl border-border bg-white text-muted-foreground hover:bg-stone-50 hover:text-foreground disabled:opacity-40"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="Última página"
          title="Última página"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
