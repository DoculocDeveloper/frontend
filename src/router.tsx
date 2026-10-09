import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "./app/modules/_layouts/auth";
import { AppLayout } from "./app/modules/_layouts/app";
import { Error } from "@/error";
import LoginPage from "./app/modules/auth/pages/login";
import RegisterPage from "./app/modules/auth/pages/register";
import { Dashboard } from "./app/modules/admin/pages/dashboard";
import { RealEstateDashboard } from "./app/modules/real-estate/pages/dashboard";
import { RealEstateSettingsPage } from "./app/modules/real-estate/pages/settings";
import { NewApplicationPage } from "./app/modules/real-estate/pages/new-application";
import { ApplicationsPage } from "./app/modules/applications/pages/applications-page";
import { ApplicationDetailPage } from "./app/modules/applications/pages/application-detail";
import { ContractDataPage } from "./app/modules/applications/pages/contract-data";
import { ContestApplicationPage } from "./app/modules/applications/pages/contest-application";
import { RealEstatesPage } from "./app/modules/admin/pages/real-estates";
import ForgotPasswordPage from "./app/modules/auth/pages/forgot-password";
import ResetPasswordPage from "./app/modules/auth/pages/reset-password";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: "sign-in",
        element: <LoginPage />,
      },
      {
        path: "sign-up",
        element: <RegisterPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: "/real_estate",
    element: <AppLayout expectedRole="REAL_ESTATE" />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Navigate to="/real_estate/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <RealEstateDashboard />,
      },
      {
        path: "nova-consulta",
        element: <NewApplicationPage />,
      },
      {
        path: "consultas",
        element: <ApplicationsPage />,
      },
      {
        path: "consultas/:applicationId",
        element: <ApplicationDetailPage />,
      },
      {
        path: "consultas/:applicationId/contrato",
        element: <ContractDataPage />,
      },
      {
        path: "consultas/:applicationId/contestar",
        element: <ContestApplicationPage />,
      },
      {
        path: "configuracoes",
        element: <RealEstateSettingsPage />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AppLayout expectedRole="ADMIN" />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "consultas",
        element: <ApplicationsPage isAdmin />,
      },
      {
        path: "contestacoes",
        element: (
          <ApplicationsPage
            isAdmin
            forcedStatus="CONTESTED"
            eyebrow="Revisão manual"
            title="Consultas contestadas"
            description="Analise justificativas enviadas pelas imobiliárias e aprove ou reprove manualmente cada caso."
          />
        ),
      },
      {
        path: "contratos",
        element: (
          <ApplicationsPage
            isAdmin
            forcedStatus="WAITING_ADMIN_CONTRACT"
            eyebrow="Contratos"
            title="Contratos pendentes"
            description="Casos com dados de locatário e imóvel preenchidos, prontos para geração do contrato DOCX."
          />
        ),
      },
      {
        path: "consultas/:applicationId",
        element: <ApplicationDetailPage isAdmin />,
      },
      {
        path: "imobiliarias",
        element: <RealEstatesPage />,
      },
    ],
  },
  {
    path: "/real-estate/*",
    element: <Navigate to="/real_estate/dashboard" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/sign-in" replace />,
  },
]);
