"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getStripe, PLAN_PRICE_IDS, type PlanInterval } from "@/lib/stripe";

function appUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

async function getOrCreateStripeCustomerId(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId },
  });

  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

const planSchema = z.object({ interval: z.enum(["monthly", "yearly"]) });

/** Crea una sesión de Stripe Checkout y devuelve la URL a la que redirigir. */
export async function createCheckoutSession(
  input: z.infer<typeof planSchema>
): Promise<string> {
  const userId = await requireUserId();
  const { interval } = planSchema.parse(input);

  const priceId = PLAN_PRICE_IDS[interval as PlanInterval];
  if (!priceId) {
    throw new Error(
      `Falta configurar el precio de Stripe para el plan ${interval} (STRIPE_PRICE_ID_${interval.toUpperCase()}).`
    );
  }

  const customerId = await getOrCreateStripeCustomerId(userId);
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/profile?checkout=success`,
    cancel_url: `${appUrl()}/profile?checkout=cancelled`,
    subscription_data: { metadata: { userId } },
  });

  if (!session.url) throw new Error("No se pudo crear la sesión de pago");
  return session.url;
}

/** Crea una sesión del Customer Portal de Stripe (gestionar tarjeta, cancelar, ver facturas). */
export async function createPortalSession(): Promise<string> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.stripeCustomerId) {
    throw new Error("Todavía no tienes una suscripción para gestionar.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl()}/profile`,
  });

  return session.url;
}

export async function getSubscriptionInfo() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
    },
  });
  return user;
}
