import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Único requisito real que valida el backend (ver schemas con z.string().min(8, ...)). */
export function isPasswordValid(password: string): boolean {
  return password.length >= 8;
}

/** Lista de criterios visible bajo cualquier campo de "nueva contraseña". */
export function PasswordRequirements({ password }: { password: string }) {
  if (password.length === 0) return null;

  const met = isPasswordValid(password);

  return (
    <ul className="pt-1">
      <li className={cn("flex items-center gap-1.5 text-xs", met ? "text-success" : "text-muted-foreground")}>
        {met ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
        Al menos 8 caracteres
      </li>
    </ul>
  );
}
