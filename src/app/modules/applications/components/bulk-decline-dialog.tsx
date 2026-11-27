import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bulkDeclineRentalApplications } from "@/services/rental-applications";
import { getApiErrorMessage } from "@/services/api";

export function BulkDeclineDialog({
  selectedIds,
  onSuccess,
}: {
  selectedIds: string[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      bulkDeclineRentalApplications(selectedIds, reason.trim() || undefined),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-applications"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["unread-applications-count"],
      });

      const updatedMsg =
        data.updatedCount === 1
          ? "1 consulta marcada como Declinado pelo Locatário."
          : `${data.updatedCount} consultas marcadas como Declinado pelo Locatário.`;

      if (data.skippedCount > 0) {
        toast.success(updatedMsg, {
          description: `${data.skippedCount} consulta(s) foram ignoradas pois já estavam assinadas.`,
        });
      } else {
        toast.success(updatedMsg);
      }

      setOpen(false);
      setReason("");
      onSuccess();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-xl border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 shadow-2xs"
        >
          <UserX className="size-4 mr-1.5" />
          Declinado pelo Locatário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <UserX className="size-5" />
            Declinar consultas selecionadas
          </DialogTitle>
          <DialogDescription>
            Tem certeza de que deseja marcar{" "}
            <strong>
              {selectedIds.length}{" "}
              {selectedIds.length === 1
                ? "consulta selecionada"
                : "consultas selecionadas"}
            </strong>{" "}
            como <strong>Declinado pelo Locatário</strong>? O status delas passará para{" "}
            <strong>Contrato declinado</strong>.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="bulk-decline-reason">
              Motivo ou observação{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="bulk-decline-reason"
              rows={3}
              placeholder="Ex: Locatário desistiu da locação..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending}
              className="gap-1.5"
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserX className="size-4" />
              )}
              Confirmar ({selectedIds.length})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
