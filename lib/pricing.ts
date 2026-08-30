export const SAT_WEEKLY_RATE_DOLLARS = 15;
export const MINIMUM_SAT_WEEKS = 3;
export const MONTHLY_PRICE_DOLLARS = 44.99;
export const QUARTERLY_PRICE_DOLLARS = 134.99;
export const SIX_MONTH_PRICE_DOLLARS = 269.94;

export type PricingPlanId = "until_sat" | "monthly" | "quarterly" | "six_months";

export type PricingPolicy = {
  id: PricingPlanId;
  label: string;
  eyebrow: string;
  cadence: string;
  description: string;
  cardDescription: string;
};

export const PRICING_POLICIES: PricingPolicy[] = [
  {
    id: "until_sat",
    label: "Until SAT",
    eyebrow: "Best value",
    cadence: "One-time",
    description:
      "Choose the SAT date you are working toward. Your price is fixed upfront, your access ends after that test, and there is nothing to cancel.",
    cardDescription:
      "A bounded prep commitment with one payment and a fixed end date tied to your SAT.",
  },
  {
    id: "monthly",
    label: "Monthly",
    eyebrow: "Most flexible",
    cadence: "Renews monthly",
    description:
      "Pay as you go with no fixed end date. This works well when your test date is flexible or you want access through multiple attempts.",
    cardDescription:
      "Ongoing access that renews monthly until canceled, with the flexibility to prepare across multiple test dates.",
  },
  {
    id: "quarterly",
    label: "Every 3 months",
    eyebrow: "Longer runway",
    cadence: "Renews every 3 months",
    description:
      "Pay for three months of uninterrupted prep at a time. Your plan renews every three months until canceled.",
    cardDescription:
      "Three months of ongoing Roadmap access, live instruction, and guided practice in one payment.",
  },
  {
    id: "six_months",
    label: "6 Months",
    eyebrow: "Extended prep",
    cadence: "Renews every 6 months",
    description:
      "Pay for six months of uninterrupted prep at a time. Your plan renews every six months until canceled.",
    cardDescription:
      "Six months of ongoing Roadmap access, live instruction, and guided practice in one payment.",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function parseLocalDate(dateValue: string) {
  if (!dateValue) return null;
  const parsed = new Date(`${dateValue}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getUntilSatQuote(testDateValue: string, today = new Date()) {
  const testDate = parseLocalDate(testDateValue);
  if (!testDate) {
    return {
      hasTestDate: false,
      weeks: MINIMUM_SAT_WEEKS,
      price: MINIMUM_SAT_WEEKS * SAT_WEEKLY_RATE_DOLLARS,
      testDate: null,
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const rawWeeks = Math.ceil((testDate.getTime() - start.getTime()) / (7 * DAY_MS));
  const weeks = Math.max(rawWeeks, MINIMUM_SAT_WEEKS);

  return {
    hasTestDate: true,
    weeks,
    price: weeks * SAT_WEEKLY_RATE_DOLLARS,
    testDate,
  };
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getLocalDateInputMinimum(today = new Date()) {
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPricingPolicy(planId: PricingPlanId) {
  return PRICING_POLICIES.find((policy) => policy.id === planId) ?? PRICING_POLICIES[0];
}

// $134.99 is approximately $45/month and is not 10% below the monthly rate.
// Keep discount copy out of the UI unless the quarterly price changes.
// The six-month policy currently uses six times the monthly rate. Revisit this
// constant when the final six-month discount and checkout product are decided.
