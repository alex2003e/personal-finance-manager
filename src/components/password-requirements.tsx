import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/password-policy";

export { isPasswordValid };

/** Lista de criterios visible bajo cualquier campo de "nueva contraseña". */
export function PasswordRequirements({ password }: { password: string }) {
  if (password.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-0.5 pt-1 sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.key}
            className={cn("flex items-center gap-1.5 text-xs", met ? "text-success" : "text-muted-foreground")}
          >
            {met ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
