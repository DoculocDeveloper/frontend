import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDocument, onlyDigits } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { createSeller } from "@/services/real-estates";

const sellerSchema = z.object({
  name: z.string().min(2, "Informe o nome completo do vendedor."),
  cpf: z
    .string()
    .min(11, "Informe um CPF válido com 11 dígitos.")
    .refine((val) => onlyDigits(val).length === 11, "CPF deve ter 11 dígitos."),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type SellerForm = z.infer<typeof sellerSchema>;

export function CreateSellerDialog({
  realEstateId,
  realEstateName,
  trigger,
}: {
  realEstateId: string;
  realEstateName: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<SellerForm>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SellerForm) => {
      return createSeller(realEstateId, {
        name: values.name.trim(),
        cpf: onlyDigits(values.cpf),
        email: values.email.trim(),
        password: values.password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-real-estate", realEstateId] });
      queryClient.invalidateQueries({ queryKey: ["admin-real-estates-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sellers", realEstateId] });
      toast.success("Vendedor cadastrado com sucesso.");
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  function onSubmit(values: SellerForm) {
    mutation.mutate(values);
  }

  function handleCpfChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = onlyDigits(event.target.value).slice(0, 11);
    const masked = formatDocument(raw, "CPF");
    form.setValue("cpf", masked, { shouldValidate: true });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="beam-button gap-2 shadow-sm">
            <UserPlus className="size-4" />
            Cadastrar vendedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar vendedor</DialogTitle>
          <DialogDescription>
            Vincule um vendedor à imobiliária <strong>{realEstateName}</strong>. Ele terá acesso de
            visualização aos contratos gerados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="seller-name">Nome completo</Label>
            <Input
              id="seller-name"
              placeholder="ex: Carlos Alberto Santos"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seller-cpf">CPF</Label>
            <Input
              id="seller-cpf"
              placeholder="000.000.000-00"
              value={form.watch("cpf")}
              onChange={handleCpfChange}
            />
            {form.formState.errors.cpf ? (
              <p className="text-xs text-destructive">{form.formState.errors.cpf.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seller-email">E-mail</Label>
            <Input
              id="seller-email"
              type="email"
              placeholder="carlos@imobiliaria.com.br"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seller-password">Senha de acesso</Label>
            <div className="relative">
              <Input
                id="seller-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Salvar vendedor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
