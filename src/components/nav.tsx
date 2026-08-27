"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Landmark,
  CreditCard,
  Repeat,
  Notebook,
  Car,
  Target,
  LineChart,
  LogOut,
  Wallet,
  Compass,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/notifications-bell";
import type { FinanceAlert } from "@/lib/alerts";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Cuentas", icon: Landmark },
  { href: "/debts", label: "Deudas / Tarjetas de Crédito", icon: CreditCard },
  { href: "/recurring", label: "Recurrentes", icon: Repeat },
  { href: "/ledger", label: "Movimientos", icon: Notebook },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/assets", label: "Activos e Inversiones", icon: Car },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reports", label: "Proyecciones", icon: LineChart },
  { href: "/strategy", label: "Estrategia", icon: Compass },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Nav({
  userName,
  userImage,
  onNavigate,
  alerts = [],
}: {
  userName?: string | null;
  userImage?: string | null;
  onNavigate?: () => void;
  alerts?: FinanceAlert[];
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <p className="font-heading text-lg leading-none font-semibold tracking-tight">
              Finanzas
            </p>
            {userName && (
              <p className="mt-1 text-xs text-sidebar-foreground/60">Hola, {userName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationsBell alerts={alerts} />
          <ThemeToggle />
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:py-2",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border p-3">
        <Link
          href="/profile"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:py-2",
            pathname.startsWith("/profile")
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-primary text-[10px] font-semibold text-sidebar-primary-foreground">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(userName ?? "?")
            )}
          </span>
          Perfil
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
