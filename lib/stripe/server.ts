import "server-only";

import Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { typescript: true });
  }

  return stripeClient;
}

export function getRequestOrigin(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configuredOrigin) return configuredOrigin;
  return new URL(request.url).origin;
}

async function reusableCustomerId(customerId: string) {
  try {
    const customer = await getStripe().customers.retrieve(customerId);
    return customer.deleted ? null : customer.id;
  } catch (error) {
    // Stripe keeps test and live data completely separate. A profile can retain
    // a customer ID from the other mode while a developer switches API keys.
    if (
      error instanceof Stripe.errors.StripeInvalidRequestError &&
      error.code === "resource_missing"
    ) {
      return null;
    }

    throw error;
  }
}

export async function getOrCreateStripeCustomer(user: User) {
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to read the billing profile: ${profileError.message}`);
  }

  if (profile?.stripe_customer_id) {
    const customerId = await reusableCustomerId(profile.stripe_customer_id);
    if (customerId) return customerId;
  }

  const customer = await getStripe().customers.create({
    email: user.email,
    name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      undefined,
    metadata: { supabase_user_id: user.id },
  });

  const { error: updateError } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);

  if (updateError) {
    await getStripe().customers.del(customer.id).catch(() => undefined);
    throw new Error(`Unable to save the Stripe customer: ${updateError.message}`);
  }

  return customer.id;
}
