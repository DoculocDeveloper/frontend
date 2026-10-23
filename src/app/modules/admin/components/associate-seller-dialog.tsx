import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDocument } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { associateSeller, listAvailableSellers } from "@/services/real-estates";

interface AssociateSellerDialogProps {
  realEstateId: string;
  realEstateName: string;
  trigger?: React.ReactNode;
  onAssociated?: () => void;
}

export function AssociateSellerDialog({
  realEstateId,
  realEstateName,
  trigger,
  onAssociated,
}: AssociateSellerDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: availableSellers = [], isLoading } = useQuery({
    queryKey: ["admin-available-sellers", realEstateId, search],
    queryFn: () => listAvailableSellers(realEstateId, search),
    enabled: open,
  });

  const associateMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      return associateSeller(realEstateId, sellerId);
    },
    onSuccess: (data) => {
      toast.success(data.message || "Vendedor associado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin-real-estate", realEstateId] });
      queryClient.invalidateQueries({ queryKey: ["admin-available-sellers", realEstateId] });
      queryClient.invalidateQueries({ queryKey: ["admin-real-estates-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sellers", realEstateId] });
      onAssociated?.();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="outline" className="gap-2 border-stone-300">
            <Users className="size-4" />
            Lista de vendedores
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Lista de vendedores
          </DialogTitle>
          <DialogDescription>
            Vendedores cadastrados na plataforma. Clique em <strong>Associar</strong> para vincular o vendedor à imobiliária{" "}
            <strong>{realEstateName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="mt-2 max-h-[360px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="mt-2 text-xs">Carregando vendedores cadastrados...</span>
            </div>
          ) : availableSellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <UserCheck className="size-8 stroke-1 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium text-foreground">
                {search
                  ? "Nenhum vendedor encontrado com essa busca."
                  : "Todos os vendedores cadastrados já estão associados a esta imobiliária."}
              </p>
              <p className="mt-1 text-xs">
                {search
                  ? "Tente buscar por outro termo ou cadastre um novo vendedor."
                  : "Você pode cadastrar um novo vendedor pelo botão 'Cadastrar vendedor'."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 py-1">
              {availableSellers.map((seller) => {
                const isPending =
                  associateMutation.isPending &&
                  associateMutation.variables === seller.id;

                return (
                  <div
                    key={seller.id}
                    className="flex flex-col gap-3 rounded-2xl border bg-stone-50/60 p-3.5 transition-colors hover:bg-stone-100/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-foreground text-sm">
                          {seller.name}
                        </span>
                        {seller.associatedRealEstates.length > 0 ? (
                          <Badge variant="secondary" className="text-[0.65rem] px-1.5 py-0 h-4 shrink-0">
                            {seller.associatedRealEstates.length === 1
                              ? "1 imobiliária"
                              : `${seller.associatedRealEstates.length} imobiliárias`}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="truncate">{seller.email}</span>
                        {seller.cpf ? (
                          <span className="font-mono">
                            {formatDocument(seller.cpf, "CPF")}
                          </span>
                        ) : null}
                      </div>

                      {seller.associatedRealEstates.length > 0 ? (
                        <p className="text-[0.7rem] text-muted-foreground/90 truncate">
                          Já vinculado a: {seller.associatedRealEstates.join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5 self-end sm:self-center"
                      disabled={associateMutation.isPending}
                      onClick={() => associateMutation.mutate(seller.id)}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Associando...
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          Associar
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
