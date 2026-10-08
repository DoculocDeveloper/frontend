import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  FileText,
  Loader2,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { formatCurrency, onlyDigits } from "@/lib/format";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/services/api";
import {
  createCnpjApplication,
  createCpfApplication,
} from "@/services/rental-applications";
import type { CreateApplicationBody, DocumentType } from "@/types/doculoc";

const newApplicationSchema = z
  .object({
    documentType: z.enum(["CPF", "CNPJ"]),
    document: z.string().min(11, "Informe um CPF ou CNPJ válido."),
    rentValue: z.number().positive("Informe o valor do aluguel."),
    condominiumValue: z.number().min(0, "Valor inválido."),
    feesValue: z.number().min(0, "Valor inválido."),
  })
  .superRefine((data, context) => {
    const length = onlyDigits(data.document).length;

    if (data.documentType === "CPF" && length !== 11) {
      context.addIssue({
        code: "custom",
        path: ["document"],
        message: "CPF deve conter 11 dígitos.",
      });
    }

    if (data.documentType === "CNPJ" && length !== 14) {
      context.addIssue({
        code: "custom",
        path: ["document"],
        message: "CNPJ deve conter 14 dígitos.",
      });
    }
  });

type NewApplicationForm = z.infer<typeof newApplicationSchema>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-rose-600">{message}</p> : null;
}

export function NewApplicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<NewApplicationForm>({
    resolver: zodResolver(newApplicationSchema),
    defaultValues: {
      documentType: "CPF",
      document: "",
      rentValue: 0,
      condominiumValue: 0,
      feesValue: 0,
    },
  });

  const documentType = form.watch("documentType");
  const rentValue = Number(form.watch("rentValue") || 0);
  const condominiumValue = Number(form.watch("condominiumValue") || 0);
  const feesValue = Number(form.watch("feesValue") || 0);
  const requestedExpense = rentValue + condominiumValue + feesValue;

  const mutation = useMutation({
    mutationFn: (values: NewApplicationForm) => {
      const body: CreateApplicationBody = {
        document: values.document,
        rentValue: values.rentValue,
        condominiumValue: values.condominiumValue,
        feesValue: values.feesValue,
      };

      return values.documentType === "CPF"
        ? createCpfApplication(body)
        : createCnpjApplication(body);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });
      const recommended = data.application.recommendation === "RECOMMENDED";

      toast.success(
        recommended ? "Consulta recomendada." : "Consulta em análise.",
        {
          description: recommended
            ? "Agora preencha os dados para o contrato."
            : "A análise está em verificação pela equipe Doculoc.",
        },
      );
      navigate(`/real_estate/consultas/${data.application.id}`);
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      const code = getApiErrorCode(error);
      const status = getApiErrorStatus(error);

      if (
        code === "DOCUMENT_ALREADY_CONSULTED" ||
        code === "DOCUMENT_CONSULT_IN_PROGRESS" ||
        status === 409
      ) {
        form.setError("document", {
          type: "server",
          message:
            "Este CPF/CNPJ já possui uma consulta cadastrada ou em processamento.",
        });

        toast.error("Documento já consultado", {
          description:
            "Não é permitido realizar uma nova consulta para o mesmo CPF ou CNPJ.",
        });

        return;
      }

      toast.error(message, {
        description:
          message.includes("sem consultas") || status === 402
            ? "Solicite ao admin a liberação de novos créditos ou ativação VIP."
            : undefined,
      });
    },
  });

  function handleDocumentTypeChange(value: string) {
    form.setValue("documentType", value as DocumentType);
    form.setValue("document", "");
  }

  function handleSubmit(values: NewApplicationForm) {
    mutation.mutate(values);
  }

  return (
    <PageShell>
      <Helmet title="Nova consulta" />

      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/real_estate/dashboard">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
        <PageHeader
          eyebrow="Nova análise"
          title="Consultar garantia locatícia"
          description="Informe CPF ou CNPJ e os valores do pacote locatício. A análise retorna se o perfil é recomendado ou não recomendado."
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="flashlight-card bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>Dados da consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label>Tipo de documento</Label>
                <Tabs
                  value={documentType}
                  onValueChange={handleDocumentTypeChange}
                >
                  <TabsList className="h-auto w-full flex-col rounded-2xl sm:h-11 sm:w-fit sm:flex-row">
                    <TabsTrigger
                      value="CPF"
                      className="h-10 w-full px-3 sm:w-auto sm:px-5"
                    >
                      <UserRound className="size-4" />
                      Pessoa física
                    </TabsTrigger>
                    <TabsTrigger
                      value="CNPJ"
                      className="h-10 w-full px-3 sm:w-auto sm:px-5"
                    >
                      <Building2 className="size-4" />
                      Pessoa jurídica
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">
                  {documentType === "CPF" ? "CPF" : "CNPJ"}
                </Label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="document"
                    className="h-12 rounded-2xl pl-10"
                    placeholder={
                      documentType === "CPF"
                        ? "000.000.000-00"
                        : "00.000.000/0000-00"
                    }
                    {...form.register("document")}
                  />
                </div>
                <FieldError message={form.formState.errors.document?.message} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="rentValue">Aluguel</Label>
                  <Input
                    id="rentValue"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-12 rounded-2xl"
                    {...form.register("rentValue", { valueAsNumber: true })}
                  />
                  <FieldError
                    message={form.formState.errors.rentValue?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condominiumValue">Condomínio</Label>
                  <Input
                    id="condominiumValue"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-12 rounded-2xl"
                    {...form.register("condominiumValue", {
                      valueAsNumber: true,
                    })}
                  />
                  <FieldError
                    message={form.formState.errors.condominiumValue?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feesValue">Taxas</Label>
                  <Input
                    id="feesValue"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-12 rounded-2xl"
                    {...form.register("feesValue", { valueAsNumber: true })}
                  />
                  <FieldError
                    message={form.formState.errors.feesValue?.message}
                  />
                </div>
              </div>

              <Alert className="border-primary/20 bg-primary/5">
                <ShieldCheck className="size-4" />
                <AlertTitle>Consumo de crédito</AlertTitle>
                <AlertDescription>
                  Cada consulta consome 1 crédito. A análise pode levar alguns
                  minutos enquanto a Órago processa os dados. Mantenha esta tela
                  aberta até o resultado.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link to="/real_estate/consultas">Cancelar</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="beam-button px-6"
                >
                  {mutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {mutation.isPending
                    ? "Aguardando resultado da análise..."
                    : "Consultar agora"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="bg-stone-950 text-white shadow-2xl">
            <CardHeader>
              <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
                Resumo
              </Badge>
              <CardTitle className="text-2xl text-white">
                Pacote locatício
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 my-auto">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-white/60">Valor analisado</p>
                <strong className="mt-2 block wrap-break-word text-3xl font-semibold tracking-tight sm:text-4xl">
                  {formatCurrency(requestedExpense)}
                </strong>
              </div>
              <div className="grid gap-3 text-sm text-white/70">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span>Aluguel</span>
                  <span className="shrink-0">{formatCurrency(rentValue)}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span>Condomínio</span>
                  <span className="shrink-0">
                    {formatCurrency(condominiumValue)}
                  </span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span>Taxas</span>
                  <span className="shrink-0">{formatCurrency(feesValue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
