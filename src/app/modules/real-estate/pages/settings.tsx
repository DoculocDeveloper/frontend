import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Info, Loader2, Mail, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getRealEstateProfile, updateRealEstateProfile } from "@/services/real-estates";
import { getApiErrorMessage } from "@/services/api";

const settingsSchema = z.object({
  signatureEmail: z
    .string()
    .email("Informe um e-mail válido.")
    .or(z.literal(""))
    .optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function RealEstateSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["real-estate-profile"],
    queryFn: getRealEstateProfile,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      signatureEmail: "",
    },
  });

  useEffect(() => {
    if (data?.profile) {
      form.reset({
        signatureEmail: data.profile.signatureEmail ?? "",
      });
    }
  }, [data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: SettingsFormValues) =>
      updateRealEstateProfile({
        signatureEmail: values.signatureEmail?.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["real-estate-profile"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  function onSubmit(values: SettingsFormValues) {
    updateMutation.mutate(values);
  }

  const user = data?.user;
  const profile = data?.profile;

  return (
    <PageShell>
      <Helmet>
        <title>Configurações | Doculoc</title>
      </Helmet>

      <PageHeader
        title="Configurações"
        description="Gerencie preferências da sua conta e o recebimento de contratos para assinatura."
      />

      <div className="mx-auto grid max-w-4xl gap-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="size-5 text-primary" />
                Recebimento de Contratos para Assinatura
              </CardTitle>
              <CardDescription>
                Defina o endereço de e-mail que receberá os contratos gerados para assinatura eletrônica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signatureEmail">E-mail para assinatura</Label>
                <Input
                  id="signatureEmail"
                  type="email"
                  placeholder="ex: juridico@imobiliaria.com.br ou contratos@..."
                  {...form.register("signatureEmail")}
                  disabled={isLoading || updateMutation.isPending}
                />
                {form.formState.errors.signatureEmail && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.signatureEmail.message}
                  </p>
                )}
              </div>

              <Alert className="border-primary/20 bg-primary/5 text-muted-foreground">
                <Info className="size-4 text-primary" />
                <AlertDescription className="text-xs leading-relaxed sm:text-sm">
                  <strong>Como funciona:</strong> Se este campo for preenchido, os contratos enviados para assinatura pela DocuLoc na plataforma Clicksign serão disparados para este e-mail. Se for deixado em branco, o sistema utilizará automaticamente o e-mail de login da conta{" "}
                  <span className="font-semibold text-foreground">
                    ({user?.email || "seu e-mail principal"})
                  </span>.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || updateMutation.isPending}
                  className="gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <Card className="border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="size-5 text-primary" />
              Dados Cadastrais
            </CardTitle>
            <CardDescription>
              Informações da imobiliária ou corretor autônomo vinculadas à sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="size-5 animate-spin mr-2" />
                Carregando dados cadastrais...
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Nome / Razão Social</p>
                  <p className="font-medium text-foreground">{profile?.name || user?.name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">E-mail de Login</p>
                  <p className="font-medium text-foreground">{user?.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Responsável</p>
                  <p className="font-medium text-foreground">{profile?.responsibleName || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium text-foreground">{profile?.phone || "—"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
