import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-5 overflow-x-hidden px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:gap-8 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <span className="mb-3 inline-flex max-w-full items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs sm:tracking-[0.22em]">
            <span className="truncate">{eyebrow}</span>
          </span>
        ) : null}
        <h1 className="max-w-full text-balance wrap-break-word text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-72 min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed bg-white/70 p-6 text-center shadow-sm sm:min-h-80 sm:rounded-3xl sm:p-8">
      {icon ? <div className="mb-4 rounded-2xl border bg-primary/5 p-4 text-primary">{icon}</div> : null}
      <h2 className="text-balance text-lg font-semibold tracking-tight">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6 w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  description,
  icon,
  trend,
  className,
  valueClassName,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: string;
  className?: string;
  valueClassName?: string;
}) {
  const isStringValue = typeof value === "string";
  const isCurrency = isStringValue && value.includes("R$");
  const isLongValue = isStringValue && value.length > 8;

  return (
    <div
      className={cn(
        "flashlight-card group min-w-0 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:rounded-3xl sm:p-5",
        className
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.18em]">
            {label}
          </p>
          <strong
            className={cn(
              "mt-3 block font-semibold tracking-tight text-foreground whitespace-nowrap",
              isCurrency || isLongValue
                ? "text-base sm:text-lg xl:text-xl 2xl:text-2xl"
                : "text-2xl sm:text-3xl",
              valueClassName
            )}
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </strong>
        </div>
        {icon ? (
          <div className="shrink-0 rounded-2xl bg-primary/10 p-2 text-primary sm:p-2.5">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-3.5 flex min-w-0 flex-col gap-1.5 text-xs text-muted-foreground sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:text-xs xl:text-sm">
        {description ? (
          <span className="leading-snug break-words">
            {description}
          </span>
        ) : (
          <span />
        )}
        {trend ? (
          <span className="w-fit shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}
