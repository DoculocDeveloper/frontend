import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Home, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { fetchAddressByCep } from "@/services/cep";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { formatDocument } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import {
  fillContractData,
  getRentalApplication,
} from "@/services/rental-applications";
import type { ContractDataBody } from "@/types/doculoc";

const contractDataSchema = z.object({
  tenantName: z.string().min(3, "Informe o nome completo."),
  tenantDocument: z.string().min(11, "Informe CPF ou CNPJ."),
  tenantEmail: z.string().email("Informe um e-mail válido."),
  tenantPhone: z.string().min(10, "Informe um telefone válido."),
  propertyZipCode: z.string().min(8, "Informe o CEP."),
  propertyStreet: z.string().min(3, "Informe a rua."),
  propertyNumber: z.string().min(1, "Informe o número."),
  propertyComplement: z.string().optional(),
  propertyNeighborhood: z.string().min(2, "Informe o bairro."),
  propertyCity: z.string().min(2, "Informe a cidade."),
  propertyState: z
    .string()
    .min(2, "UF obrigatória.")
    .max(2, "Use a UF com 2 letras."),
});

type ContractDataForm = z.infer<typeof contractDataSchema>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-rose-600">{message}</p> : null;
}

export function ContractDataPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<ContractDataForm>({
    resolver: zodResolver(contractDataSchema),
    defaultValues: {
      tenantName: "",
      tenantDocument: "",
      tenantEmail: "",
      tenantPhone: "",
      propertyZipCode: "",
      propertyStreet: "",
      propertyNumber: "",
      propertyComplement: "",
      propertyNeighborhood: "",
      propertyCity: "",
      propertyState: "",
    },
  });

  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const propertyZipCode = form.watch("propertyZipCode");

  const { data: application } = useQuery({
    queryKey: ["rental-application", applicationId],
    queryFn: () => getRentalApplication(applicationId ?? ""),
    enabled: Boolean(applicationId),
  });

  useEffect(() => {
    if (!application) return;

    form.reset({
      tenantName: application.tenantName ?? "",
      tenantDocument: application.tenantDocument ?? application.document ?? "",
      tenantEmail: application.tenantEmail ?? "",
      tenantPhone: application.tenantPhone ?? "",
      propertyZipCode: application.propertyZipCode ?? "",
      propertyStreet: application.propertyStreet ?? "",
      propertyNumber: application.propertyNumber ?? "",
      propertyComplement: application.propertyComplement ?? "",
      propertyNeighborhood: application.propertyNeighborhood ?? "",
      propertyCity: application.propertyCity ?? "",
      propertyState: application.propertyState ?? "",
    });
  }, [application, form]);

  useEffect(() => {
    const cleanZipCode = propertyZipCode.replace(/\D/g, "");
    if (cleanZipCode.length !== 8) return;

    const timeout = window.setTimeout(async () => {
      try {
        setIsFetchingCep(true);

        const address = await fetchAddressByCep(cleanZipCode);

        form.setValue("propertyStreet", address.street, {
          shouldValidate: true,
          shouldDirty: true,
        });
        form.setValue("propertyNeighborhood", address.neighborhood, {
          shouldValidate: true,
          shouldDirty: true,
        });
        form.setValue("propertyCity", address.city, {
          shouldValidate: true,
          shouldDirty: true,
        });
        form.setValue("propertyState", address.state, {
          shouldValidate: true,
          shouldDirty: true,
        });

        const currentComplement = form.getValues("propertyComplement");

        if (!currentComplement && address.complement) {
          form.setValue("propertyComplement", address.complement, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        form.setFocus("propertyNumber");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível consulta o CEP.",
        );
      } finally {
        setIsFetchingCep(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [propertyZipCode, form]);

  const mutation = useMutation({
    mutationFn: (values: ContractDataBody) =>
      fillContractData(applicationId ?? "", values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-application", applicationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });
      toast.success(
        "Dados enviados. Aguardando geração do contrato pelo admin.",
      );
      navigate(`/real_estate/consultas/${applicationId}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function handleSubmit(values: ContractDataForm) {
    mutation.mutate(values);
  }

  const isAllowed = application?.status === "WAITING_CONTRACT_DATA";

  return (
    <PageShell>
      <Helmet title="Dados para contrato" />

      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to={`/real_estate/consultas/${applicationId}`}>
            <ArrowLeft className="size-4" />
            Voltar para consulta
          </Link>
        </Button>
        <PageHeader
          eyebrow="Contrato"
          title="Preencher dados para contrato"
          description="Complete os dados do locatário e do imóvel. Depois disso, o caso segue para geração do contrato pelo admin."
        />
      </div>

      {application ? (
        <Alert className="border-primary/20 bg-primary/5">
          <Home className="size-4" />
          <AlertTitle>
            Consulta{" "}
            {formatDocument(application.document, application.documentType)}
          </AlertTitle>
          <AlertDescription>
            {isAllowed
              ? "Os dados serão vinculados a essa análise recomendada."
              : "Esta consulta não está no status liberado para preenchimento de contrato."}
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-5">
        <Card className="bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>Dados do locatário</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tenantName">Nome completo</Label>
              <Input
                id="tenantName"
                className="h-11 rounded-2xl"
                {...form.register("tenantName")}
              />
              <FieldError message={form.formState.errors.tenantName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantDocument">CPF ou CNPJ</Label>
              <Input
                id="tenantDocument"
                className="h-11 rounded-2xl"
                {...form.register("tenantDocument")}
              />
              <FieldError
                message={form.formState.errors.tenantDocument?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantPhone">Telefone</Label>
              <Input
                id="tenantPhone"
                className="h-11 rounded-2xl"
                {...form.register("tenantPhone")}
              />
              <FieldError
                message={form.formState.errors.tenantPhone?.message}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tenantEmail">E-mail</Label>
              <Input
                id="tenantEmail"
                type="email"
                className="h-11 rounded-2xl"
                {...form.register("tenantEmail")}
              />
              <FieldError
                message={form.formState.errors.tenantEmail?.message}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>Dados do imóvel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyZipCode">CEP</Label>
              <Input
                id="propertyZipCode"
                className="h-11 rounded-2xl"
                {...form.register("propertyZipCode")}
              />
              <FieldError
                message={form.formState.errors.propertyZipCode?.message}
              />
              {isFetchingCep ? (
                <p className="text-xs text-muted-foreground">
                  Buscando endereço...
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="propertyStreet">Rua/Avenida</Label>
              <Input
                id="propertyStreet"
                className="h-11 rounded-2xl"
                {...form.register("propertyStreet")}
              />
              <FieldError
                message={form.formState.errors.propertyStreet?.message}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyNumber">Número</Label>
              <Input
                id="propertyNumber"
                className="h-11 rounded-2xl"
                {...form.register("propertyNumber")}
              />
              <FieldError
                message={form.formState.errors.propertyNumber?.message}
              />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="propertyComplement">Complemento</Label>
              <Input
                id="propertyComplement"
                className="h-11 rounded-2xl"
                {...form.register("propertyComplement")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyNeighborhood">Bairro</Label>
              <Input
                id="propertyNeighborhood"
                className="h-11 rounded-2xl"
                {...form.register("propertyNeighborhood")}
              />
              <FieldError
                message={form.formState.errors.propertyNeighborhood?.message}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="propertyCity">Cidade</Label>
              <Input
                id="propertyCity"
                className="h-11 rounded-2xl"
                {...form.register("propertyCity")}
              />
              <FieldError
                message={form.formState.errors.propertyCity?.message}
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="propertyState">UF</Label>
              <Input
                id="propertyState"
                className="h-11 rounded-2xl uppercase"
                maxLength={2}
                {...form.register("propertyState")}
              />
              <FieldError
                message={form.formState.errors.propertyState?.message}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <Link to={`/real_estate/consultas/${applicationId}`}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !isAllowed}
            className="beam-button"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enviar dados
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
