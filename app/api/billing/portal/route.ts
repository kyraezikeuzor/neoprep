import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateStripeCustomer,
  getRequestOrigin,
  getStripe,
} from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
    }

    const customer = await getOrCreateStripeCustomer(user);

    const session = await getStripe().billingPortal.sessions.create({
      customer,
      return_url: `${getRequestOrigin(request)}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to open billing." },
      { status: 500 }
    );
  }
}
