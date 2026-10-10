import { api } from "@/services/api";

export interface SignUpBody {
  email: string
  password: string
  role: string
  realEstateProfile?: {
    name: string
    cnpj: string
    document?: string
    phone: string
    responsibleName: string
  }
}

export async function signUp({ email, password, role, realEstateProfile }: SignUpBody) {
  return api.post("/auth/register", {
    email,
    password,
    role,
    realEstateProfile: realEstateProfile
      ? {
          ...realEstateProfile,
          document: realEstateProfile.cnpj,
        }
      : undefined,
  });
}