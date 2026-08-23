import { NextResponse } from "next/server";
import SAT_DATES from "@/lib/sat-dates.json";
import {
  getPricingPolicy,
  getUntilSatQuote,
  MONTHLY_PRICE_DOLLARS,
  PricingPlanId,
  QUARTERLY_PRICE_DOLLARS,
  SIX_MONTH_PRICE_DOLLARS,
} from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateStripeCustomer,
  getRequestOrigin,
  getStripe,
} from "@/lib/stripe/server";

export const runtime = "nodejs";

const PLAN_IDS: PricingPlanId[] = [
  "until_sat",
  "monthly",
  "quarterly",
  "six_months",
];

function isPlanId(value: unknown): value is PricingPlanId {
  return typeof value === "string" && PLAN_IDS.includes(value as PricingPlanId);
}

function recurringAmount(planId: Exclude<PricingPlanId, "until_sat">) {
  if (planId === "quarterly") return QUARTERLY_PRICE_DOLLARS;
  if (planId === "six_months") return SIX_MONTH_PRICE_DOLLARS;
  return MONTHLY_PRICE_DOLLARS;
}

function recurringIntervalCount(planId: Exclude<PricingPlanId, "until_sat">) {
  if (planId === "quarterly") return 3;
  if (planId === "six_months") return 6;
  return 1;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      planId?: unknown;
      testDate?: unknown;
    };

    if (!isPlanId(body.planId)) {
      return NextResponse.json({ error: "Choose a valid billing option." }, { status: 400 });
    }

    const planId = body.planId;
    const testDate = typeof body.testDate === "string" ? body.testDate : "";
    const selectedSat = SAT_DATES.find((satDate) => satDate.date === testDate);

    if (planId === "until_sat" && !selectedSat) {
      return NextResponse.json({ error: "Choose a valid upcoming SAT date." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const origin = getRequestOrigin(request);
    const pricingQuery = new URLSearchParams({ plan: planId });
    if (selectedSat) pricingQuery.set("testDate", selectedSat.date);

    if (!user) {
      const returnPath = `/pricing?${pricingQuery.toString()}`;
      return NextResponse.json(
        {
          error: "AUTH_REQUIRED",
          loginUrl: `/login?next=${encodeURIComponent(returnPath)}`,
        },
        { status: 401 }
      );
    }

    const customer = await getOrCreateStripeCustomer(user);
    const policy = getPricingPolicy(planId);
    const isOneTime = planId === "until_sat";
    const quote = isOneTime ? getUntilSatQuote(selectedSat!.date) : null;
    const amount = isOneTime
      ? quote!.price
      : recurringAmount(planId as Exclude<PricingPlanId, "until_sat">);
    const amountCents = Math.round(amount * 100);
    const metadata = {
      supabase_user_id: user.id,
      plan_id: planId,
      test_date: selectedSat?.date ?? "",
      access_ends_at: selectedSat ? `${selectedSat.date}T23:59:59.999Z` : "",
    };

    const priceData = isOneTime
      ? {
          currency: "usd" as const,
          unit_amount: amountCents,
          product_data: {
            name: `Tutormigo Pro — ${selectedSat!.label}`,
            description: `Pro access through ${selectedSat!.date}`,
            metadata: { plan_id: planId },
          },
        }
      : {
          currency: "usd" as const,
          unit_amount: amountCents,
          recurring: {
            interval: "month" as const,
            interval_count: recurringIntervalCount(
              planId as Exclude<PricingPlanId, "until_sat">
            ),
          },
          product_data: {
            name: `Tutormigo Pro — ${policy.label}`,
            metadata: { plan_id: planId },
          },
        };

    const session = await getStripe().checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ quantity: 1, price_data: priceData }],
      metadata,
      ...(isOneTime ? {} : { subscription_data: { metadata } }),
      success_url: `${origin}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=canceled&${pricingQuery.toString()}`,
      billing_address_collection: "auto",
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start Checkout." },
      { status: 500 }
    );
  }
}

