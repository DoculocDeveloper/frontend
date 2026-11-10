import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  FileText,
  Gavel,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDocument } from "@/lib/format";

type OragoReportProps = {
  oragoData?: any;
  documentType?: "CPF" | "CNPJ";
};

function formatOragoHtml(rawHtml: string) {
  if (!rawHtml) return "";
  return rawHtml
    .replace(/<div class="describeItem">/gi, '<div class="py-1">')
    .replace(/<span style="[^"]*">/gi, '<span class="text-xs text-muted-foreground italic">')
    .replace(/<strong\s*>/gi, '<strong class="font-semibold text-foreground">');
}

export function OragoAnalysisReport({ oragoData, documentType }: OragoReportProps) {
  if (!oragoData) {
    return (
      <Card className="bg-white/85 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="size-5 text-primary" />
            Relatório de Análise da Órago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Os dados detalhados da análise da Órago ainda não estão disponíveis para esta consulta.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPj = documentType === "CNPJ" || Boolean(oragoData.company);
  const company = oragoData.company;
  const identity = oragoData.identity ?? oragoData.identify;
  const financial = oragoData.financial;
  const judicial = oragoData.judicial;
  const resume = oragoData.resume;

  // Score
  const scoreVal = financial?.score ?? financial?.credit_score ?? resume?.score ?? company?.score;
  const score = scoreVal !== null && scoreVal !== undefined ? Number(scoreVal) : null;

  // Inadimplência
  const defaultProb = financial?.default_prob ?? financial?.default_probability;

  // Faturamento / Renda
  const presumedRevenue =
    financial?.presumedRevenueAmount ??
    financial?.incomeRange ??
    financial?.presumed_income ??
    "-";

  // Situação cadastral
  const registrationStatus = isPj
    ? company?.status ?? "ATIVO"
    : identity?.irs_status ?? "REGULAR";

  // Dívidas e Protestos
  const hasDebts =
    financial?.has_debts === true ||
    (Array.isArray(financial?.debts) && financial.debts.length > 0);
  const debtsCount = Array.isArray(financial?.debts) ? financial.debts.length : hasDebts ? 1 : 0;

  const protests = Array.isArray(financial?.protests) ? financial.protests : [];
  const negatives = Array.isArray(financial?.negative) ? financial.negative : [];

  const pgfn = financial?.active_debt_pgfn?.possui_divida_ativa;

  // Processos
  const passiveHighlight = judicial?.passive?.highlight ?? [];
  const passiveRegular = judicial?.passive?.regular ?? [];
  const allPassive = [...passiveHighlight, ...passiveRegular];
  const activeProcesses = judicial?.active ?? [];

  const hasEviction = judicial?.hasRecentEviction || judicial?.hasOldEviction;
  const hasCriminal = judicial?.hasCriminalLawSuits;

  // Sócios
  const partners = Array.isArray(company?.partners) ? company.partners : [];

  return (
    <Card className="bg-white/90 shadow-sm border-stone-200">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <ShieldCheck className="size-6 text-primary" />
              Relatório Completo — Órago
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Inteligência cadastral, financeira e judicial coletada diretamente na fonte.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {oragoData.pdf_url ? (
              <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium">
                <a href={oragoData.pdf_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  Abrir PDF Oficial
                </a>
              </Button>
            ) : null}
            <Badge variant="outline" className="h-8 border-primary/20 bg-primary/5 text-primary text-xs">
              Órago API v1
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Resumo da IA */}
        {resume?.resume ? (
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/70 p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <FileText className="size-4 text-primary" />
                Parecer da Análise (Órago)
              </h3>
            </div>
            <div
              className="text-sm leading-relaxed text-stone-700 space-y-2"
              dangerouslySetInnerHTML={{ __html: formatOragoHtml(resume.resume) }}
            />
          </div>
        ) : null}

        {/* Indicadores Principais */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Indicadores de Crédito e Risco
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Score */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Score de Crédito</span>
                <TrendingUp className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {score !== null ? score : "-"}
                </span>
                <span className="text-xs text-muted-foreground">/ 1000</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {score !== null
                  ? score >= 700
                    ? "Score considerado bom / excelente"
                    : score >= 400
                    ? "Score regular"
                    : "Faixa de maior risco"
                  : "Não informado"}
              </p>
            </div>

            {/* Inadimplência */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Prob. Inadimplência</span>
                <AlertTriangle className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-foreground">
                  {defaultProb ? `${defaultProb}` : "-"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Estimativa de probabilidade de atraso</p>
            </div>

            {/* Capacidade / Faturamento */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{isPj ? "Faturamento Presumido" : "Renda Presumida"}</span>
                <DollarSign className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2 truncate text-lg font-bold text-foreground" title={String(presumedRevenue)}>
                {presumedRevenue}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Estimativa de capacidade financeira</p>
            </div>

            {/* Situação Cadastral */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Receita Federal</span>
                <Building2 className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{registrationStatus}</span>
                {registrationStatus === "ATIVO" || registrationStatus === "REGULAR" ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <XCircle className="size-4 text-rose-600" />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Situação cadastral oficial</p>
            </div>
          </div>
        </div>

        {/* Restrições Financeiras */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Restrições Financeiras e Protestos
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dívidas Registradas
              </p>
              <div className="mt-2 flex items-center gap-2">
                {hasDebts ? (
                  <>
                    <XCircle className="size-4 text-rose-600" />
                    <span className="font-semibold text-rose-700">{debtsCount} dívida(s)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Nenhuma dívida</span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Protestos
              </p>
              <div className="mt-2 flex items-center gap-2">
                {protests.length > 0 ? (
                  <>
                    <XCircle className="size-4 text-rose-600" />
                    <span className="font-semibold text-rose-700">{protests.length} protesto(s)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Nenhum protesto</span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Negativações
              </p>
              <div className="mt-2 flex items-center gap-2">
                {negatives.length > 0 ? (
                  <>
                    <XCircle className="size-4 text-rose-600" />
                    <span className="font-semibold text-rose-700">{negatives.length} apontamento(s)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Nenhuma negativação</span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dívida Ativa PGFN
              </p>
              <div className="mt-2 flex items-center gap-2">
                {pgfn ? (
                  <>
                    <XCircle className="size-4 text-rose-600" />
                    <span className="font-semibold text-rose-700">Consta dívida ativa</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Sem dívida ativa</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Análise Judicial */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Análise Judicial
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Processos Passivos (Réu)
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Gavel className="size-4 text-muted-foreground" />
                <span className="text-lg font-bold text-foreground">{allPassive.length}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {allPassive.length === 0 ? "Nenhum passivo localizado" : "Processos como réu"}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Processos Ativos (Autor)
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Scale className="size-4 text-muted-foreground" />
                <span className="text-lg font-bold text-foreground">{activeProcesses.length}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Processos movidos pela parte</p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ações de Despejo
              </p>
              <div className="mt-2 flex items-center gap-2">
                {hasEviction ? (
                  <>
                    <XCircle className="size-4 text-rose-600" />
                    <span className="font-semibold text-rose-700">Consta histórico</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Nenhum despejo</span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Processos Criminais
              </p>
              <div className="mt-2 flex items-center gap-2">
                {hasCriminal ? (
                  <>
                    <XCircle className="size-4 text-rose-600" />
                    <span className="font-semibold text-rose-700">Processo criminal</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Nenhum criminal</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Processos Passivos se houver */}
          {allPassive.length > 0 ? (
            <div className="mt-4 rounded-2xl border bg-white p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detalhes dos Processos Passivos
              </p>
              <div className="divide-y text-xs">
                {allPassive.slice(0, 10).map((proc: any, idx: number) => (
                  <div key={idx} className="py-2.5 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {proc.process_number || `Processo #${idx + 1}`}
                      </span>
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-stone-700">
                        {proc.tribunal || proc.branch || "Tribunal"}
                      </span>
                    </div>
                    {proc.subject ? (
                      <p className="text-muted-foreground">Assunto: {proc.subject}</p>
                    ) : null}
                    {proc.valor_causa ? (
                      <p className="text-muted-foreground">Valor da causa: {proc.valor_causa}</p>
                    ) : null}
                    {proc.status ? (
                      <p className="text-muted-foreground">Situação: {proc.status}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Informações Cadastrais / Empresa */}
        {isPj && company ? (
          <div>
            <Separator className="mb-6" />
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Dados Cadastrais da Empresa
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Razão Social</p>
                <p className="mt-1 font-medium text-sm text-foreground">{company.companyName || "-"}</p>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome Fantasia</p>
                <p className="mt-1 font-medium text-sm text-foreground">{company.companyFantasyName || "-"}</p>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data de Fundação</p>
                <p className="mt-1 font-medium text-sm text-foreground">{company.dateFoundation || "-"}</p>
              </div>
              <div className="rounded-2xl border bg-white p-4 sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Atividade Principal</p>
                <p className="mt-1 font-medium text-sm text-foreground">{company.mainActivityDescription || "-"}</p>
              </div>
            </div>

            {/* Quadro Societário */}
            {partners.length > 0 ? (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  Quadro Societário ({partners.length})
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {partners.map((partner: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border bg-stone-50/60 p-3.5 space-y-1">
                      <p className="font-semibold text-sm text-foreground">{partner.name || "Sócio"}</p>
                      {partner.cpf ? (
                        <p className="text-xs text-muted-foreground">CPF: {formatDocument(partner.cpf, "CPF")}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {partner.relationshipDescription || "Participação societária"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Informações Cadastrais PF */}
        {!isPj && identity ? (
          <div>
            <Separator className="mb-6" />
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Dados Cadastrais da Pessoa Física
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome da Mãe</p>
                <p className="mt-1 font-medium text-sm text-foreground">{identity.mother_name || "-"}</p>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data de Nascimento / Idade</p>
                <p className="mt-1 font-medium text-sm text-foreground">
                  {identity.birth_date || (identity.age ? `${identity.age} anos` : "-")}
                </p>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pessoa Politicamente Exposta</p>
                <p className="mt-1 font-medium text-sm text-foreground">{identity.politically_exposed || "Não"}</p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
