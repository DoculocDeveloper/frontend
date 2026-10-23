import { api } from "./api";
import type { AuthUser, RealEstateProfile } from "@/types/auth";

export type Seller = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  role?: string;
  realEstateId?: string;
  createdAt: string;
  updatedAt?: string;
};

export type RealEstateListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  realEstateProfile: RealEstateProfile | null;
  wallet: {
    id: string;
    availableCredits: number;
    isVip: boolean;
    createdAt?: string;
  } | null;
  applicationsCount: number;
  sellersCount: number;
};

export type RealEstateDetail = RealEstateListItem & {
  sellers: Seller[];
};

export type CreateSellerInput = {
  name: string;
  cpf: string;
  email: string;
  password: string;
};

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

export async function listRealEstates(search?: string) {
  const response = await api.get<{ realEstates: RealEstateListItem[] }>("/real-estates", {
    params: { search },
  });

  return response.data.realEstates;
}

export async function getRealEstateById(id: string) {
  const response = await api.get<{ realEstate: RealEstateDetail }>(`/real-estates/${id}`);

  return response.data.realEstate;
}

export async function listSellers(realEstateId: string) {
  const response = await api.get<{ sellers: Seller[] }>(`/real-estates/${realEstateId}/sellers`);

  return response.data.sellers;
}

export async function createSeller(realEstateId: string, data: CreateSellerInput) {
  const response = await api.post<{ message: string; seller: Seller }>(
    `/real-estates/${realEstateId}/sellers`,
    data,
  );

  return response.data;
}
export async function deleteSeller(realEstateId: string, sellerId: string) {
  const response = await api.delete<{ message: string }>(
    `/real-estates/${realEstateId}/sellers/${sellerId}`,
  );

  return response.data;
}

export type AvailableSeller = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  createdAt: string;
  associatedRealEstates: string[];
};

export async function listAvailableSellers(realEstateId: string, search?: string) {
  const response = await api.get<{ sellers: AvailableSeller[] }>(
    `/real-estates/${realEstateId}/available-sellers`,
    {
      params: { search },
    },
  );

  return response.data.sellers;
}

export async function associateSeller(realEstateId: string, sellerId: string) {
  const response = await api.post<{ message: string; seller: Seller }>(
    `/real-estates/${realEstateId}/sellers/associate`,
    { sellerId },
  );

  return response.data;
}

