import { api } from "./api";
import type { AuthUser, RealEstateProfile } from "@/types/auth";

export async function getRealEstateProfile() {
  const response = await api.get<{
    user: AuthUser;
    profile: RealEstateProfile | null;
  }>("/real-estates/profile");

  return response.data;
}

export async function updateRealEstateProfile(data: {
  signatureEmail?: string | null;
}) {
  const response = await api.patch<{
    message: string;
    profile: RealEstateProfile;
  }>("/real-estates/profile", data);

  return response.data;
}
