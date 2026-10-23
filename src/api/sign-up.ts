import { api } from "@/services/api";
import { onlyDigits } from "@/lib/format";

export interface SignUpBody {
  email: string;
  password: string;
  role: string;
  realEstateProfile?: {
    name: string;
    cnpj?: string;
    cpf?: string;
    document?: string;
    phone: string;
    responsibleName: string;
    profileType?: "COMPANY" | "AUTONOMOUS_BROKER";
  };
}

export async function signUp({ email, password, role, realEstateProfile }: SignUpBody) {
  const cnpjDigits = onlyDigits(realEstateProfile?.cnpj);
  const cpfDigits = onlyDigits(realEstateProfile?.cpf);
  const document = cnpjDigits || cpfDigits || undefined;
  const profileType = cnpjDigits ? "COMPANY" : "AUTONOMOUS_BROKER";

  return api.post("/auth/register", {
    email,
    password,
    role,
    realEstateProfile: realEstateProfile
      ? {
          ...realEstateProfile,
          cnpj: cnpjDigits || undefined,
          cpf: cpfDigits || undefined,
          document,
          profileType,
        }
      : undefined,
  });
}