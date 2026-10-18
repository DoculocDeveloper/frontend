import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, Crown, Search, Users, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { formatDocument } from "@/lib/format";
import { listRealEstates, type RealEstateListItem } from "@/services/real-estates";
import { CreditEditDialog } from "../components/credit-edit-dialog";
import { CreateSellerDialog } from "../components/create-seller-dialog";

function WalletStatus({ wallet }: { wallet: RealEstateListItem["wallet"] }) {
  if (!wallet) return <span className="text-sm text-muted-foreground">Sem carteira</span>;

  if (wallet.isVip) {
    return (
      <Badge className="h-7 rounded-full bg-primary text-primary-foreground gap-1">
        <Crown className="size-3" />
        VIP
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="h-7 rounded-full border-stone-200 bg-stone-50 px-3">
      {wallet.availableCredits} créditos
    </Badge>
  );
}

function RealEstateInfoCard({ realEstate }: { realEstate: RealEstateListItem }) {
  const profile = realEstate.realEstateProfile;
  const name = profile?.name ?? realEstate.name;
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/admin/imobiliarias/${realEstate.id}`)}
      className="cursor-pointer rounded-3xl border bg-white/85 p-4 shadow-sm backdrop-blur transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-2xl bg-primary/10 p-2 text-primary">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">{name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{realEstate.email}</p>
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-stone-50/80 p-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Responsável
          </p>
          <p className="mt-1 wrap-break-word text-sm font-medium text-foreground">
            {profile?.responsibleName ?? realEstate.name}
          </p>
        </div>
        <div className="rounded-2xl border bg-stone-50/80 p-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            CNPJ
          </p>
          <p className="mt-1 wrap-break-word text-sm font-medium text-foreground">
            {formatDocument(profile?.document ?? profile?.cnpj ?? undefined, profile?.documentType ?? "CNPJ")}
          </p>
        </div>
        <div className="rounded-2xl border bg-stone-50/80 p-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Consultas
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{realEstate.applicationsCount}</p>
        </div>
        <div className="rounded-2xl border bg-stone-50/80 p-3" onClick={(e) => e.stopPropagation()}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Vendedores
          </p>
          <div className="mt-1">
            <CreateSellerDialog
              realEstateId={realEstate.id}
              realEstateName={name}
              trigger={
                <button
                  type="button"
                  title="Cadastrar vendedor"
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-normal text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95"
                >
                  <Users className="size-3.5 text-primary" />
                  <span>{realEstate.sellersCount ?? 0}</span>
                </button>
              }
            />
          </div>
        </div>
        <div className="rounded-2xl border bg-stone-50/80 p-3 sm:col-span-2" onClick={(e) => e.stopPropagation()}>
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Carteira
          </p>
          <WalletStatus wallet={realEstate.wallet} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <CreditEditDialog userId={realEstate.id} realEstateName={name} />
      </div>
    </article>
  );
}

export function RealEstatesPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: allRealEstates = [], isLoading } = useQuery({
    queryKey: ["admin-real-estates-list", search],
    queryFn: () => listRealEstates(search),
  });

  const realEstates = allRealEstates.filter(
    (realEstate) => realEstate.applicationsCount > 0,
  );

  return (
    <PageShell>
      <Helmet title="Imobiliárias" />

      <PageHeader
        eyebrow="Rede Parceira"
        title="Imobiliárias"
        description="Gerencie imobiliárias, carteira de créditos e seus vendedores autorizados para visualização dos contratos."
      />

      <div className="rounded-3xl border bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-2xl bg-white pl-10"
            placeholder="Buscar imobiliária por nome, email ou documento"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-3xl border bg-white/70" />
      ) : realEstates.length > 0 ? (
        <>
          <div className="grid gap-3 lg:hidden">
            {realEstates.map((realEstate) => (
              <RealEstateInfoCard key={realEstate.id} realEstate={realEstate} />
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-3xl border bg-white/85 shadow-sm backdrop-blur lg:block">
            <Table className="min-w-235">
              <TableHeader className="bg-stone-50/80">
                <TableRow>
                  <TableHead>Imobiliária</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Consultas</TableHead>
                  <TableHead>Vendedores</TableHead>
                  <TableHead>Carteira</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realEstates.map((realEstate) => {
                  const profile = realEstate.realEstateProfile;
                  const name = profile?.name ?? realEstate.name;

                  return (
                    <TableRow
                      key={realEstate.id}
                      onClick={() => navigate(`/admin/imobiliarias/${realEstate.id}`)}
                      className="cursor-pointer transition-colors hover:bg-stone-50/90"
                    >
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="shrink-0 rounded-2xl bg-primary/10 p-2 text-primary">
                            <Building2 className="size-4" />
                          </div>
                          <div className="min-w-0 max-w-64">
                            <div className="truncate font-semibold text-foreground">{name}</div>
                            <div className="truncate text-xs text-muted-foreground">{realEstate.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {profile?.responsibleName ?? realEstate.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDocument(profile?.document ?? profile?.cnpj ?? undefined, profile?.documentType ?? "CNPJ")}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {realEstate.applicationsCount}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CreateSellerDialog
                          realEstateId={realEstate.id}
                          realEstateName={name}
                          trigger={
                            <button
                              type="button"
                              title="Cadastrar vendedor"
                              className="group inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-normal text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95"
                            >
                              <Users className="size-3 text-primary transition-transform group-hover:scale-110" />
                              <span>{realEstate.sellersCount ?? 0}</span>
                            </button>
                          }
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="cursor-default">
                        <WalletStatus wallet={realEstate.wallet} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <CreditEditDialog userId={realEstate.id} realEstateName={name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<WalletCards className="size-7" />}
          title="Nenhuma imobiliária encontrada"
          description="Nenhuma imobiliária cadastrada corresponde aos filtros de busca informados."
        />
      )}
    </PageShell>
  );
}
