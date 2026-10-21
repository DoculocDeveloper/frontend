import type { ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  MessageSquareWarning,
  PlusCircle,
  Settings,
} from "lucide-react";

import doculocLogo from "@/assets/logo.svg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { initials } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { getRoleBasePath, normalizeRole } from "@/types/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUnreadApplicationsCount } from "@/services/rental-applications";

type NavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const adminItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    title: "Todas as consultas",
    href: "/admin/consultas",
    icon: ClipboardList,
  },
  {
    title: "Contestadas",
    href: "/admin/contestacoes",
    icon: MessageSquareWarning,
  },
  { title: "Contratos", href: "/admin/contratos", icon: FileClock },
  { title: "Imobiliárias", href: "/admin/imobiliarias", icon: Building2 },
];

const realEstateItems: NavItem[] = [
  { title: "Dashboard", href: "/real_estate/dashboard", icon: LayoutDashboard },
  {
    title: "Nova consulta",
    href: "/real_estate/nova-consulta",
    icon: PlusCircle,
  },
  {
    title: "Minhas consultas",
    href: "/real_estate/consultas",
    icon: ClipboardList,
  },
  {
    title: "Configurações",
    href: "/real_estate/configuracoes",
    icon: Settings,
  },
];

const sellerItems: NavItem[] = [
  { title: "Dashboard", href: "/real_estate/dashboard", icon: LayoutDashboard },
  {
    title: "Consultas e Contratos",
    href: "/real_estate/consultas",
    icon: ClipboardList,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href.endsWith("dashboard")) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const { session } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const role = normalizeRole(session?.user.role);
  const basePath = getRoleBasePath(role);

  const { data: unreadData } = useQuery({
    queryKey: ["unread-applications-count"],
    queryFn: getUnreadApplicationsCount,
    enabled: role === "ADMIN",
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const unreadCount = role === "ADMIN" ? (unreadData?.count ?? 0) : 0;

  const items =
    role === "ADMIN"
      ? adminItems
      : role === "SELLER"
        ? sellerItems
        : realEstateItems;

  const companyName =
    session?.user.realEstateProfile?.name ?? session?.user.realEstate?.name;
  const displayName =
    role === "SELLER"
      ? session?.user.name ?? "Vendedor"
      : companyName ?? session?.user.name ?? "Doculoc";
  const subName =
    role === "SELLER" && companyName
      ? companyName
      : session?.user.email;

  function closeMobileNav() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar variant="floating" className="border-none">
      <SidebarHeader>
        <Link
          to={`${basePath}/dashboard`}
          onClick={closeMobileNav}
          className="flex min-w-0 flex-col gap-2 p-4"
        >
          <img src={doculocLogo} className="w-36 max-w-full" alt="Doculoc" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Garantia Locatícia
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(location.pathname, item.href);
                const isConsultasItem = item.href === "/admin/consultas";
                const showUnreadBadge = isConsultasItem && unreadCount > 0;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={
                        showUnreadBadge
                          ? `${item.title} (${unreadCount} ${unreadCount === 1 ? "nova" : "novas"})`
                          : item.title
                      }
                      className="rounded-2xl"
                    >
                      <Link
                        to={item.href}
                        onClick={closeMobileNav}
                        className="flex items-center gap-2 w-full"
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                        {showUnreadBadge ? (
                          <span
                            title={`${unreadCount} ${unreadCount === 1 ? "nova consulta" : "novas consultas"}`}
                            className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-red-100 dark:ring-red-950 animate-in fade-in zoom-in"
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="rounded-lg border bg-white/70 p-2 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {subName}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
