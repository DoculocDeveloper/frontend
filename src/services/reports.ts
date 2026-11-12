import { api } from "./api";

export interface RealEstateReportItem {
  id: string;
  name: string;
  email: string;
  document: string | null;
  totalApplications: number;
  generatedContracts: {
    count: number;
    totalValue: number;
  };
  declinedContracts: {
    count: number;
    totalValue: number;
  };
  averageTicket: number;
  conversionRate: number;
}

export interface ReportsSummaryResponse {
  period: {
    startDate?: string;
    endDate?: string;
  };
  totals: {
    totalApplications: number;
    generatedContracts: {
      count: number;
      totalValue: number;
    };
    declinedContracts: {
      count: number;
      totalValue: number;
    };
    averageTicket: number;
    conversionRate: number;
  };
  realEstates: RealEstateReportItem[];
}

export interface GetReportsSummaryParams {
  startDate?: string;
  endDate?: string;
  requesterId?: string;
}

export async function getReportsSummary(params?: GetReportsSummaryParams) {
  const response = await api.get<ReportsSummaryResponse>("/reports/summary", {
    params,
  });
  return response.data;
}
