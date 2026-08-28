import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

function isoFromUnix(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  return typeof customer === "string" ? customer : customer?.id ?? null;
}

async function userIdForCustomer(stripeCustomerId: string | null) {
  if (!stripeCustomerId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") return;

  const studentId = session.metadata?.supabase_user_id ?? session.client_reference_id;
  if (!studentId) throw new Error(`Checkout Session ${session.id} has no Supabase user ID.`);

  const admin = createAdminClient();
  const stripeCustomerId = customerId(session.customer);
  const amountCents = session.amount_total ?? 0;

  const { error } = await admin.from("subscriptions").upsert(
    {
      student_id: studentId,
      plan: session.metadata?.plan_id ?? "until_sat",
      monthly_price: amountCents / 100,
      started_at: isoFromUnix(session.created),
      status:
        session.payment_status === "paid" || session.payment_status === "no_payment_required"
          ? "active"
          : session.payment_status,
      provider: "stripe",
      stripe_customer_id: stripeCustomerId,
      stripe_checkout_session_id: session.id,
      amount_cents: amountCents,
      currency: session.currency ?? "usd",
      billing_interval: "one_time",
      billing_interval_count: 1,
      access_ends_at: session.metadata?.access_ends_at || null,
      updated_at: new Date().toISOString(),
      metadata: session.metadata ?? {},
    },
    { onConflict: "stripe_checkout_session_id" }
  );

  if (error) throw new Error(error.message);
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const stripeCustomerId = customerId(subscription.customer);
  const studentId =
    subscription.metadata?.supabase_user_id ??
    (await userIdForCustomer(stripeCustomerId));
  if (!studentId) throw new Error(`Subscription ${subscription.id} has no Supabase user ID.`);

  const item = subscription.items.data[0];
  const amountCents = item?.price.unit_amount ?? 0;
  const intervalCount = item?.price.recurring?.interval_count ?? 1;
  const monthlyPrice =
    item?.price.recurring?.interval === "month"
      ? amountCents / 100 / intervalCount
      : amountCents / 100;
  const admin = createAdminClient();

  const { error } = await admin.from("subscriptions").upsert(
    {
      student_id: studentId,
      plan: subscription.metadata?.plan_id ?? "pro",
      monthly_price: monthlyPrice,
      started_at: isoFromUnix(subscription.start_date),
      status: subscription.status,
      provider: "stripe",
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: item?.price.id ?? null,
      amount_cents: amountCents,
      currency: item?.price.currency ?? "usd",
      billing_interval: item?.price.recurring?.interval ?? null,
      billing_interval_count: intervalCount,
      current_period_start: isoFromUnix(item?.current_period_start),
      current_period_end: isoFromUnix(item?.current_period_end),
      access_ends_at: isoFromUnix(item?.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: isoFromUnix(subscription.canceled_at),
      updated_at: new Date().toISOString(),
      metadata: subscription.metadata ?? {},
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (error) throw new Error(error.message);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook signature error", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncCheckoutSession(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handling failed for ${event.id}`, error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

