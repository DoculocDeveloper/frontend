import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Crown,
  Mail,
  MapPin,
  Phone,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import {
  formatDate,
  formatDocument,
  formatPhone,
  formatZipCode,
} from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { deleteSeller, getRealEstateById } from "@/services/real-estates";
import { CreateSellerDialog } from "../components/create-seller-dialog";
import { CreditEditDialog } from "../components/credit-edit-dialog";

export function RealEstateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");

  const { data: realEstate, isLoading } = useQuery({
    queryKey: ["admin-real-estate", id],
    queryFn: () => getRealEstateById(id!),
    enabled: Boolean(id),
  });

  const deleteSellerMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      return deleteSeller(id!, sellerId);
    },
    onSuccess: () => {
      toast.success("Vendedor removido com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin-real-estate", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-real-estates-list"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="h-64 animate-pulse rounded-3xl border bg-white/70" />
      </PageShell>
    );
  }

  if (!realEstate) {
    return (
      <PageShell>
        <div className="mb-4">
          <Link
            to="/admin/imobiliarias"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para Imobiliárias
          </Link>
        </div>
        <EmptyState
          icon={<Building2 className="size-8" />}
          title="Imobiliária não encontrada"
          description="Os dados solicitados não foram localizados ou você não possui permissão para visualizá-los."
        />
      </PageShell>
    );
  }

  const profile = realEstate.realEstateProfile;
  const displayName = profile?.name ?? realEstate.name;
  const isVip = Boolean(realEstate.wallet?.isVip);
  const sellers = realEstate.sellers ?? [];

  return (
    <PageShell>
      <Helmet title={`${displayName} | Imobiliárias`} />

      <div className="mb-3">
        <Link
          to="/admin/imobiliarias"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Voltar para Imobiliárias
        </Link>
      </div>

      <PageHeader
        eyebrow="Gestão de Imobiliária"
        title={displayName}
        description={`Cadastro vinculado a ${realEstate.email}. Gerencie os dados cadastrais, carteira e vendedores autorizados.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CreditEditDialog userId={realEstate.id} realEstateName={displayName} />
            <CreateSellerDialog realEstateId={realEstate.id} realEstateName={displayName} />
          </div>
        }
      />

      {/* Banner de resumo da imobiliária */}
      <div className="rounded-3xl border bg-white/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-2xl bg-primary/10 p-3 text-primary">
              <Building2 className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
                {isVip ? (
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Crown className="size-3" />
                    VIP
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-stone-300">
                    {realEstate.wallet?.availableCredits ?? 0} créditos
                  </Badge>
                )}
                {profile?.profileType === "AUTONOMOUS_BROKER" ? (
                  <Badge variant="secondary">Corretor autônomo</Badge>
                ) : (
                  <Badge variant="secondary">Imobiliária PJ</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Responsável: <strong className="text-foreground">{profile?.responsibleName ?? realEstate.name}</strong> •{" "}
                {profile?.documentType ?? "CNPJ"}:{" "}
                <span className="font-mono text-foreground">
                  {formatDocument(profile?.document ?? profile?.cnpj ?? undefined, profile?.documentType ?? "CNPJ")}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
            <div className="rounded-2xl border bg-stone-50/80 px-4 py-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground block">
                Total de Consultas
              </span>
              <span className="text-lg font-bold text-foreground">
                {realEstate.applicationsCount}
              </span>
            </div>
            <div className="rounded-2xl border bg-stone-50/80 px-4 py-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground block">
                Vendedores Cadastrados
              </span>
              <span className="text-lg font-bold text-foreground">{sellers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Abas: Dados da Imobiliária e Vendedores */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 w-full">
        <TabsList className="h-11 rounded-2xl bg-white p-1 border shadow-sm">
          <TabsTrigger value="info" className="rounded-xl px-4 py-2 font-medium">
            <Building2 className="mr-2 size-4" />
            Dados da Imobiliária
          </TabsTrigger>
          <TabsTrigger value="sellers" className="rounded-xl px-4 py-2 font-medium">
            <Users className="mr-2 size-4" />
            Vendedores ({sellers.length})
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo Aba 1: Dados da Imobiliária */}
        <TabsContent value="info" className="mt-4 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border bg-white/85 p-6 shadow-sm backdrop-blur">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Identificação e Contato
              </h3>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase font-semibold">Razão Social / Nome</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{displayName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase font-semibold">
                    {profile?.documentType === "CPF" ? "CPF" : "CNPJ"}
                  </dt>
                  <dd className="mt-0.5 font-medium font-mono text-foreground">
                    {formatDocument(profile?.document ?? profile?.cnpj ?? undefined, profile?.documentType ?? "CNPJ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase font-semibold">Nome do Responsável</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {profile?.responsibleName ?? realEstate.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase font-semibold">E-mail Principal</dt>
                  <dd className="mt-0.5 font-medium text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {realEstate.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase font-semibold">E-mail para Assinaturas (Clicksign)</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {profile?.signatureEmail ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5 text-primary" />
                        {profile.signatureEmail}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Usa o e-mail principal</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase font-semibold">Telefone</dt>
                  <dd className="mt-0.5 font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {formatPhone(profile?.phone) || "-"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border bg-white/85 p-6 shadow-sm backdrop-blur">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Endereço
                </h3>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">Logradouro e Número</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {profile?.street ? `${profile.street}, ${profile.number ?? "S/N"}` : "-"}
                      {profile?.complement ? ` - ${profile.complement}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">Bairro</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{profile?.neighborhood || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">Cidade / Estado</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {profile?.city ? `${profile.city} - ${profile.state ?? ""}` : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">CEP</dt>
                    <dd className="mt-0.5 font-medium font-mono text-foreground">
                      {formatZipCode(profile?.zipCode) || "-"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-3xl border bg-white/85 p-6 shadow-sm backdrop-blur">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  Datas e Auditoria
                </h3>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">Cadastro na Plataforma</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{formatDate(realEstate.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">Última Atualização</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{formatDate(realEstate.updatedAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Conteúdo Aba 2: Vendedores */}
        <TabsContent value="sellers" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 rounded-3xl border bg-white/85 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Vendedores Vinculados
              </h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Os vendedores têm acesso ao portal da imobiliária exclusivamente para visualização de contratos e consultas.
              </p>
            </div>
            <CreateSellerDialog realEstateId={realEstate.id} realEstateName={displayName} />
          </div>

          {sellers.length > 0 ? (
            <>
              {/* Visualização mobile dos vendedores */}
              <div className="grid gap-3 lg:hidden">
                {sellers.map((seller) => (
                  <article key={seller.id} className="rounded-3xl border bg-white/85 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{seller.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{seller.email}</p>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Ativo</Badge>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="rounded-2xl border bg-stone-50/80 p-3">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground block">
                          CPF
                        </span>
                        <span className="font-mono font-medium text-foreground mt-0.5 block">
                          {formatDocument(seller.cpf, "CPF")}
                        </span>
                      </div>
                      <div className="rounded-2xl border bg-stone-50/80 p-3">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground block">
                          Cadastrado em
                        </span>
                        <span className="font-medium text-foreground mt-0.5 block">
                          {formatDate(seller.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Deseja realmente remover o vendedor ${seller.name}?`)) {
                            deleteSellerMutation.mutate(seller.id);
                          }
                        }}
                      >
                        <Trash2 className="size-4 mr-1.5" />
                        Remover vendedor
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Tabela desktop dos vendedores */}
              <div className="hidden overflow-hidden rounded-3xl border bg-white/85 shadow-sm backdrop-blur lg:block">
                <Table>
                  <TableHeader className="bg-stone-50/80">
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>E-mail de acesso</TableHead>
                      <TableHead>Data de cadastro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 rounded-2xl bg-primary/10 p-2 text-primary">
                              <UserCheck className="size-4" />
                            </div>
                            <span className="font-medium text-foreground">{seller.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDocument(seller.cpf, "CPF")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{seller.email}</TableCell>
                        <TableCell className="text-sm">{formatDate(seller.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Ativo
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remover vendedor"
                            onClick={() => {
                              if (confirm(`Deseja realmente remover o vendedor ${seller.name}?`)) {
                                deleteSellerMutation.mutate(seller.id);
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Users className="size-8" />}
              title="Nenhum vendedor cadastrado"
              description="Cadastre vendedores para que possam acompanhar os contratos gerados desta imobiliária com visualização segura."
              action={
                <CreateSellerDialog realEstateId={realEstate.id} realEstateName={displayName} />
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
