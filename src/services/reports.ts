import { api } from "./api";

export interface RealEstateReportItem {
  id: string;
  name: string;
  email: string;
  document: string | null;
  totalApplications: number;
  rejectedApplications: {
    count: number;
    totalValue: number;
    rate: number;
  };
  generatedContracts: {
    count: number;
    totalValue: number;
  };
  signedContracts: {
    count: number;
    totalValue: number;
  };
  declinedContracts: {
    count: number;
    totalValue: number;
  };
  averageTicket: number;
  conversionRate: number; // gerados / consultas (%)
  signedConversionRate: number; // assinados / gerados (%)
  signedSharePercentage: number; // % do total de assinados da Doculoc (ex: 2.0%)
  signedValueSharePercentage: number; // % do valor total de assinados da Doculoc
}

export interface ReportsSummaryResponse {
  period: {
    startDate?: string;
    endDate?: string;
  };
  doculocGlobal: {
    totalApplications: number;
    totalRejectedApplications: {
      count: number;
      totalValue: number;
      rate: number;
    };
    totalGeneratedContracts: {
      count: number;
      totalValue: number;
    };
    totalSignedContracts: {
      count: number;
      totalValue: number;
    };
  };
  totals: {
    totalApplications: number;
    rejectedApplications: {
      count: number;
      totalValue: number;
      rate: number;
    };
    generatedContracts: {
      count: number;
      totalValue: number;
    };
    signedContracts: {
      count: number;
      totalValue: number;
    };
    declinedContracts: {
      count: number;
      totalValue: number;
    };
    averageTicket: number;
    conversionRate: number;
    signedConversionRate: number;
    signedSharePercentage: number;
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
