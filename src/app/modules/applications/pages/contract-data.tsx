import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Home, Loader2, Plus, Save, Trash2, Users } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/services/api";
import {
  fillContractData,
  getRentalApplication,
} from "@/services/rental-applications";
import type { ContractDataBody } from "@/types/doculoc";

const tenantSchema = z.object({
  name: z.string().min(3, "Informe o nome completo."),
  document: z.string().min(11, "Informe CPF ou CNPJ."),
  email: z.string().email("Informe um e-mail válido."),
  phone: z.string().min(10, "Informe um telefone válido com DDD."),
});

const contractDataSchema = z.object({
  tenants: z
    .array(tenantSchema)
    .min(1, "Informe pelo menos 1 locatário.")
    .max(3, "É permitido informar no máximo 3 locatários."),
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
      tenants: [
        {
          name: "",
          document: "",
          email: "",
          phone: "",
        },
      ],
      propertyZipCode: "",
      propertyStreet: "",
      propertyNumber: "",
      propertyComplement: "",
      propertyNeighborhood: "",
      propertyCity: "",
      propertyState: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tenants",
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

    const initialTenants =
      application.tenants && application.tenants.length > 0
        ? application.tenants.map((t) => ({
            name: t.name ?? "",
            document: t.document ?? "",
            email: t.email ?? "",
            phone: t.phone ?? "",
          }))
        : [
            {
              name: application.tenantName ?? "",
              document:
                application.tenantDocument ?? application.document ?? "",
              email: application.tenantEmail ?? "",
              phone: application.tenantPhone ?? "",
            },
          ];

    form.reset({
      tenants: initialTenants,
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

  const isEditing = application?.status === "WAITING_ADMIN_CONTRACT";
  const isAllowed =
    application?.status === "WAITING_CONTRACT_DATA" || isEditing;

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
        isEditing
          ? "Dados do contrato atualizados com sucesso."
          : "Dados enviados. Aguardando geração do contrato pelo admin.",
      );
      navigate(`/real_estate/consultas/${applicationId}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function handleSubmit(values: ContractDataForm) {
    mutation.mutate({
      tenants: values.tenants,
      propertyZipCode: values.propertyZipCode,
      propertyStreet: values.propertyStreet,
      propertyNumber: values.propertyNumber,
      propertyComplement: values.propertyComplement,
      propertyNeighborhood: values.propertyNeighborhood,
      propertyCity: values.propertyCity,
      propertyState: values.propertyState,
    });
  }

  return (
    <PageShell>
      <Helmet title={isEditing ? "Editar dados para contrato" : "Dados para contrato"} />

      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to={`/real_estate/consultas/${applicationId}`}>
            <ArrowLeft className="size-4" />
            Voltar para consulta
          </Link>
        </Button>
        <PageHeader
          eyebrow="Contrato"
          title={isEditing ? "Editar dados para contrato" : "Aprovado para contrato"}
          description={
            isEditing
              ? "Atualize os dados do locatário ou do imóvel antes da geração do contrato pelo admin."
              : "Cadastro aprovado. Complete os dados do locatário e do imóvel para que o admin possa gerar o contrato."
          }
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
              ? isEditing
                ? "Edição liberada: o contrato ainda não foi gerado pelo admin."
                : "Os dados serão vinculados a essa análise recomendada."
              : "Esta consulta não está no status liberado para preenchimento de contrato."}
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-5">
        <Card className="bg-white/85 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Dados dos locatários
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Informe até 3 locatários que constarão no contrato de locação.
              </p>
            </div>
            {fields.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ name: "", document: "", email: "", phone: "" })
                }
                className="gap-1.5 rounded-xl border-dashed self-start sm:self-auto"
              >
                <Plus className="size-4" />
                Adicionar locatário ({fields.length}/3)
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {fields.map((field, index) => {
              const isMain = index === 0;
              return (
                <div
                  key={field.id}
                  className={cn(
                    "rounded-2xl border p-4 sm:p-5 transition-colors",
                    isMain
                      ? "border-primary/20 bg-primary/[0.02]"
                      : "border-border bg-stone-50/50"
                  )}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-foreground">
                        {isMain
                          ? "Locatário principal"
                          : `Locatário adicional ${index + 1}`}
                      </h4>
                      {isMain ? (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[0.65rem] font-medium text-stone-600">
                          Titular da análise
                        </span>
                      ) : null}
                    </div>
                    {!isMain && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="h-8 gap-1 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="size-4" />
                        <span className="text-xs">Remover</span>
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`tenant-${index}-name`}>Nome completo</Label>
                      <Input
                        id={`tenant-${index}-name`}
                        className="h-11 rounded-2xl bg-white"
                        placeholder="Nome completo do locatário"
                        {...form.register(`tenants.${index}.name` as const)}
                      />
                      <FieldError
                        message={form.formState.errors.tenants?.[index]?.name?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`tenant-${index}-document`}>CPF ou CNPJ</Label>
                      <Input
                        id={`tenant-${index}-document`}
                        className="h-11 rounded-2xl bg-white"
                        placeholder="000.000.000-00"
                        {...form.register(`tenants.${index}.document` as const)}
                      />
                      <FieldError
                        message={
                          form.formState.errors.tenants?.[index]?.document?.message
                        }
                      />
                      {isMain && (
                        <p className="text-[0.7rem] text-muted-foreground">
                          Deve corresponder ao CPF/CNPJ da consulta.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`tenant-${index}-phone`}>Telefone</Label>
                      <Input
                        id={`tenant-${index}-phone`}
                        className="h-11 rounded-2xl bg-white"
                        placeholder="(00) 00000-0000"
                        {...form.register(`tenants.${index}.phone` as const)}
                      />
                      <FieldError
                        message={form.formState.errors.tenants?.[index]?.phone?.message}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`tenant-${index}-email`}>E-mail</Label>
                      <Input
                        id={`tenant-${index}-email`}
                        type="email"
                        className="h-11 rounded-2xl bg-white"
                        placeholder="locatario@email.com"
                        {...form.register(`tenants.${index}.email` as const)}
                      />
                      <FieldError
                        message={form.formState.errors.tenants?.[index]?.email?.message}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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
            {isEditing ? "Salvar alterações" : "Enviar dados"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
