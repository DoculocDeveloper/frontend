import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { applicationStatusLabels } from "@/lib/status";
import type { RentalApplicationStatus } from "@/types/doculoc";

const statusClasses: Record<RentalApplicationStatus, string> = {
  CONSULTED: "border-sky-200 bg-sky-50 text-sky-700",
  WAITING_CONTRACT_DATA: "border-blue-200 bg-blue-50 text-blue-700",
  WAITING_ADMIN_CONTRACT: "border-indigo-200 bg-indigo-50 text-indigo-700",
  CONTRACT_GENERATED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-amber-200 bg-amber-50 text-amber-700",
  CONTESTED: "border-orange-200 bg-orange-50 text-orange-700",
  ADMIN_REJECTED: "border-zinc-300 bg-zinc-100 text-zinc-700",
  CANCELLED: "border-stone-300 bg-stone-100 text-stone-700",
};

export function ApplicationStatusBadge({ status }: { status: RentalApplicationStatus }) {
  return (
    <Badge variant="outline" className={cn("h-7 rounded-full px-3", statusClasses[status])}>
      {applicationStatusLabels[status]}
    </Badge>
  );
}

export function RecommendationBadge({ recommendation }: { recommendation?: string | null }) {
  const recommended = recommendation === "RECOMMENDED" || recommendation === "recommended";

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-full px-3",
        recommended
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {recommended ? "Recomendado" : "Em análise"}
    </Badge>
  );
}
