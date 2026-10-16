import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, FileX, Loader2 } from "lucide-react";
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
import { getApiErrorMessage } from "@/services/api";
import { cancelContractSignature, reopenContractData } from "@/services/contracts";

export function CancelSignatureDialog({
  contractId,
  applicationId,
}: {
  contractId: string;
  applicationId: string;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => cancelContractSignature(contractId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["rental-applications"] });
      toast.success("Assinatura cancelada na Clicksign.");
      setOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
        >
          <Ban className="size-4" />
          Cancelar assinatura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar assinatura no Clicksign?</DialogTitle>
          <DialogDescription>
            O envelope em aberto será cancelado na Clicksign e os signatários não poderão mais assinar este documento.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReopenContractDataDialog({
  contractId,
  applicationId,
}: {
  contractId: string;
  applicationId: string;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => reopenContractData(contractId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["rental-applications"] });
      toast.success("Contrato cancelado e dados reabertos para edição.");
      setOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
        >
          <FileX className="size-4" />
          Cancelar contrato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar contrato e reabrir dados?</DialogTitle>
          <DialogDescription>
            Esta ação cancelará a versão atual do contrato (incluindo o envio para assinatura na Clicksign, se houver) e retornará a consulta para o status <strong>"Aprovado para contrato"</strong>.
            A imobiliária poderá revisar ou editar os dados da locação antes de um novo contrato ser gerado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Cancelar e reabrir dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
