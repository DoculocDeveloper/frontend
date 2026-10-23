export function onlyDigits(value?: string | number | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatCurrency(value?: string | number | null) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDocument(value?: string | null, type?: "CPF" | "CNPJ" | string) {
  const digits = onlyDigits(value);

  if (type === "CPF" || digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (type === "CNPJ" || digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  return value || "-";
}

export function formatPhone(value?: string | null) {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value || "-";
}

export function formatZipCode(value?: string | null) {
  const digits = onlyDigits(value);

  if (digits.length === 8) {
    return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
  }

  return value || "-";
}

export function initials(name?: string | null) {
  const parts = String(name ?? "Doculoc")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "DL";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function normalizeReasons(reasons?: string[] | string | null) {
  if (!reasons) return [];

  if (Array.isArray(reasons)) return reasons;

  try {
    const parsed = JSON.parse(reasons) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [String(reasons)];
  } catch {
    return [String(reasons)];
  }
}

export function parseCurrency(value?: string | number | null): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  const str = String(value).trim().replace(/^R\$\s?/, "").trim();
  if (!str) return 0;

  // Se tiver ponto e vírgula: "2.000,50" -> 2000.50
  if (str.includes(".") && str.includes(",")) {
    const normalized = str.replace(/\./g, "").replace(",", ".");
    const num = Number(normalized);
    return isNaN(num) ? 0 : num;
  }

  // Se tiver só vírgula: "2000,50" ou "2,00" -> 2000.50
  if (str.includes(",")) {
    const num = Number(str.replace(",", "."));
    return isNaN(num) ? 0 : num;
  }

  // Se tiver só ponto: "2.000" ou "2.5" ou "10.000"
  if (str.includes(".")) {
    const parts = str.split(".");
    // Se tiver grupos de milhar com 3 dígitos (ex: 2.000, 10.000, 1.500.000)
    const isThousands =
      parts.length > 1 && parts.slice(1).every((p) => p.length === 3);
    if (isThousands) {
      const num = Number(str.replace(/\./g, ""));
      return isNaN(num) ? 0 : num;
    }
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  }

  const num = Number(str);
  return isNaN(num) ? 0 : num;
}

export function formatCurrencyInput(value?: number | string | null): string {
  const num = parseCurrency(value);
  if (num === 0) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

