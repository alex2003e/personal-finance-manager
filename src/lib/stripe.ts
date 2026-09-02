import Stripe from "stripe";

let stripe: Stripe | null = null;

/** Instancia perezosa: evita reventar el build/dev si la key aún no está configurada. */
export function getStripe(): Stripe {
  if (stripe) return stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Falta configurar STRIPE_SECRET_KEY en las variables de entorno para usar Stripe."
    );
  }

  stripe = new Stripe(key);
  return stripe;
}

export const PLAN_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
} as const;

export type PlanInterval = keyof typeof PLAN_PRICE_IDS;
