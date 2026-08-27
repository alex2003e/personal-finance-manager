import { z } from "zod";

export interface PasswordRule {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: "length", label: "Al menos 8 caracteres", test: (p) => p.length >= 8 },
  { key: "lower", label: "Una letra minúscula", test: (p) => /[a-z]/.test(p) },
  { key: "upper", label: "Una letra mayúscula", test: (p) => /[A-Z]/.test(p) },
  { key: "number", label: "Un número", test: (p) => /[0-9]/.test(p) },
  {
    key: "special",
    label: "Un carácter especial (ej. !@#$%)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

const PASSWORD_ERROR_MESSAGE =
  "La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y carácter especial";

/** Reusar en cualquier schema de Zod que reciba una contraseña nueva. */
export const passwordFieldSchema = z
  .string()
  .min(8, PASSWORD_ERROR_MESSAGE)
  .refine(isPasswordValid, PASSWORD_ERROR_MESSAGE);
