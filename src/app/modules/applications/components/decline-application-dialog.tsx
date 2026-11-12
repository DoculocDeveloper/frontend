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
import { declineRentalApplication } from "@/services/rental-applications";
import { getApiErrorMessage } from "@/services/api";

export function DeclineApplicationDialog({
  applicationId,
}: {
  applicationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => declineRentalApplication(applicationId, reason.trim() || undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-application", applicationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-applications"],
      });
      toast.success("Contrato marcado como declinado pelo locatário.");
      setOpen(false);
      setReason("");
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
          variant="outline"
          className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 shadow-2xs"
        >
          <UserX className="size-4 mr-1.5" />
          Declinado pelo Locatário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <UserX className="size-5" />
            Declinado pelo Locatário
          </DialogTitle>
          <DialogDescription>
            Tem certeza de que deseja marcar esta consulta/contrato como declinada pelo locatário?
            O status da consulta passará para <strong>Contrato declinado</strong>.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="decline-reason">
              Motivo ou observação <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="decline-reason"
              rows={4}
              placeholder="Ex: Locatário optou por outro imóvel / desistiu da locação..."
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
              Confirmar declínio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

