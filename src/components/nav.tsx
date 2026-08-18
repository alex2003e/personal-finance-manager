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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Cuentas", icon: Landmark },
  { href: "/debts", label: "Deudas", icon: CreditCard },
  { href: "/recurring", label: "Recurrentes", icon: Repeat },
  { href: "/ledger", label: "Movimientos", icon: Notebook },
  { href: "/assets", label: "Activos e Inversiones", icon: Car },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reports", label: "Proyecciones", icon: LineChart },
];

export function Nav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-muted/20">
      <div className="p-4">
        <p className="text-lg font-semibold">Finanzas</p>
        {userName && (
          <p className="text-sm text-muted-foreground">Hola, {userName}</p>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
