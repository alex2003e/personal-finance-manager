"use client";

import Link from "next/link";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FinanceAlert } from "@/lib/alerts";

export function NotificationsBell({ alerts }: { alerts: FinanceAlert[] }) {
  const count = alerts.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificaciones"
            className="relative text-sidebar-foreground hover:bg-sidebar-accent"
          />
        }
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[90vw] rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg"
      >
        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Notificaciones
        </p>
        {count === 0 ? (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Todo al día, sin alertas.
          </div>
        ) : (
          <ul className="max-h-96 space-y-1 overflow-y-auto">
            {alerts.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="flex gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                >
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      a.severity === "destructive" ? "text-destructive" : "text-warning"
                    )}
                  />
                  <span>
                    <span className="block font-medium leading-tight">{a.title}</span>
                    <span className="block text-xs text-muted-foreground">{a.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
