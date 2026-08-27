"use client";

import { useState } from "react";
import { Menu, X, Wallet } from "lucide-react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/notifications-bell";
import type { FinanceAlert } from "@/lib/alerts";

export function AppShell({
  userName,
  userImage,
  alerts = [],
  children,
}: {
  userName?: string | null;
  userImage?: string | null;
  alerts?: FinanceAlert[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      {/* Barra superior — solo móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="font-heading text-base font-semibold">Finanzas</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationsBell alerts={alerts} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menú"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Cajón deslizante — solo móvil */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <div className="flex justify-end bg-sidebar px-2 pt-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerrar menú"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Nav userName={userName} userImage={userImage} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Sidebar fija — desktop */}
      <div className="hidden md:block">
        <Nav userName={userName} userImage={userImage} alerts={alerts} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
