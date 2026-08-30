"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import MarketingNavbar from "@/components/MarketingNavbar";
import CheckoutButton from "@/components/billing/CheckoutButton";
import {
  formatPrice,
  getPricingPolicy,
  getUntilSatQuote,
  MONTHLY_PRICE_DOLLARS,
  PricingPlanId,
  QUARTERLY_PRICE_DOLLARS,
  SAT_WEEKLY_RATE_DOLLARS,
  SIX_MONTH_PRICE_DOLLARS,
} from "@/lib/pricing";
import SAT_DATES from "@/lib/sat-dates.json";
import { typography } from "@/lib/typography";

const FREE_FEATURES = [
  "Explore the SAT question bank",
  "Clear answer explanations",
  "Saved questions and mistake review",
  "Basic progress tracking",
];

const PRO_FEATURES = [
  "A personalized weekly Roadmap",
  "Full access to 1,000+ original SAT questions",
  "Weekly live Math and Reading & Writing lessons",
  "Open office hours for student questions",
  "Adaptive Question Sets based on recent work",
  "Full progress, streak, and accuracy tracking",
];

const COMPARISON_ROWS = [
  { label: "Original SAT-style practice", free: "Limited", pro: "Full access" },
  { label: "Worked answer explanations", free: true, pro: true },
  { label: "Personalized weekly Roadmap", free: false, pro: true },
  { label: "Weekly live lessons", free: false, pro: true },
  { label: "Office hours and Q&A", free: false, pro: true },
  { label: "Adaptive Question Sets", free: false, pro: true },
];

const FAQS = [
  {
    question: "What makes Pro different from a question bank?",
    answer:
      "Pro gives students a weekly path through the platform. Their Roadmap responds to completed work, while live lessons and office hours add the instruction and accountability that self-guided apps usually leave out.",
  },
  {
    question: "Can I start without paying?",
    answer:
      "Yes. The free plan lets students explore the practice experience before choosing Pro. No credit card is required to create an account.",
  },
  {
    question: "Is Tutormigo affiliated with College Board?",
    answer:
      "No. Tutormigo is an independent SAT prep platform. Its questions are original and are not official College Board materials.",
  },
  {
    question: "Can a parent or guardian pay for Pro?",
    answer:
      "Yes. Use the “Ask a parent” button to prepare an email with the plan details and a link back to this page.",
  },
];

function CheckIcon({ muted = false }: { muted?: boolean }) {
  return (
    <span
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
        muted ? "bg-[#F1F1F1] text-[#747474]" : "bg-[#E4F7FF] text-[#079FDF]"
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.25 4.25L19 7" />
      </svg>
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 5-5 4 4 7-8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h5v5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon({ open = false }: { open?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function formatSatDate(dateValue: string, short = false) {
  return new Date(`${dateValue}T12:00:00`).toLocaleDateString("en-US", {
    month: short ? "short" : "long",
    day: "numeric",
    year: short ? undefined : "numeric",
  });
}

function StudentAvatars() {
  const avatars = [
    { initial: "E", background: "#FFE4F1", color: "#B92F72" },
    { initial: "R", background: "#E4F7FF", color: "#087FAE" },
    { initial: "M", background: "#EAF8EE", color: "#247A48" },
  ];

  return (
    <div className="flex -space-x-3" aria-label="Tutormigo students">
      {avatars.map((avatar) => (
        <span
          key={avatar.initial}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-white font-sans text-sm font-semibold shadow-sm"
          style={{ backgroundColor: avatar.background, color: avatar.color }}
          aria-label={`Student ${avatar.initial}`}
        >
          {avatar.initial}
        </span>
      ))}
    </div>
  );
}

function ComparisonValue({ value, featured = false }: { value: boolean | string; featured?: boolean }) {
  if (typeof value === "string") {
    return <span className={featured ? "font-semibold text-[#0A0A0A]" : "text-[#747474]"}>{value}</span>;
  }

  return value ? (
    <span className={`mx-auto grid h-7 w-7 place-items-center rounded-full ${featured ? "bg-[#1BB1F6] text-white" : "bg-[#F1F1F1] text-[#747474]"}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-label="Included">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.25 4.25L19 7" />
      </svg>
    </span>
  ) : (
    <span className="mx-auto block h-px w-4 bg-[#CFCFCF]" aria-label="Not included" />
  );
}

function ParentEmailModal({ onClose, planLabel, priceLabel }: { onClose: () => void; planLabel: string; priceLabel: string }) {
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const greeting = parentName.trim() ? `Hi ${parentName.trim()},` : "Hi,";
    const from = studentName.trim() || "your student";
    const subject = encodeURIComponent(`${from} wants to try Tutormigo Pro`);
    const body = encodeURIComponent(
      `${greeting}\n\n${from} would like to use Tutormigo Pro for SAT prep. The ${planLabel} option is ${priceLabel} and combines a personalized weekly Roadmap, 1,000+ original practice questions, and weekly live lessons.\n\nYou can review the plan here: ${window.location.origin}/pricing\n\nThanks!`
    );
    window.location.href = `mailto:${encodeURIComponent(parentEmail.trim())}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="parent-modal-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border-2 border-white/30 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden min-h-[34rem] overflow-hidden bg-[linear-gradient(155deg,#E7F8FF_0%,#F1FBFF_45%,#FFF2F8_100%)] p-10 md:flex md:flex-col md:justify-end">
          <div className="absolute -left-20 top-8 h-64 w-64 rounded-full bg-[#91DDFF]/55 blur-3xl" />
          <div className="absolute -right-16 top-32 h-52 w-52 rounded-full bg-[#F6A8D1]/45 blur-3xl" />
          <div className="relative mb-auto grid h-20 w-20 place-items-center rounded-[1.7rem] border-2 border-white bg-[#1BB1F6] shadow-[0_16px_35px_rgba(27,177,246,0.24)]">
            <Image src="/neoprep-mark-white.png" alt="" width={58} height={58} className="h-14 w-14 object-contain" />
          </div>
          <p className={`relative mb-3 ${typography.marketingSectionTitle}`}>
            SAT prep is easier with a team.
          </p>
          <p className="relative max-w-sm font-sans text-base leading-7 text-[#747474]">
            We&apos;ll open your email app with a ready-to-send note. You can review every word before it goes anywhere.
          </p>
        </div>

        <div className="relative p-6 sm:p-9 md:p-11">
          <button type="button" onClick={onClose} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full text-[#747474] transition hover:bg-[#F4F4F4] hover:text-[#0A0A0A]" aria-label="Close">
            <CloseIcon />
          </button>
          <p className="mb-2 text-sm font-semibold text-[#079FDF]">PARENT OR GUARDIAN</p>
          <h2 id="parent-modal-title" className={`pr-10 ${typography.marketingCardTitle}`}>
            Share Tutormigo Pro
          </h2>
          <p className="mt-3 font-sans text-base leading-7 text-[#747474]">
            Add their details and we&apos;ll prepare an email in your device&apos;s email app. Nothing is sent automatically.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block font-sans text-sm font-medium text-[#525252]">Parent or guardian&apos;s first name</span>
              <input value={parentName} onChange={(event) => setParentName(event.target.value)} placeholder="e.g. Sarah" className="h-12 w-full rounded-xl border-2 border-[#E8E8E8] bg-[#F7F7F7] px-4 font-sans text-base text-[#0A0A0A] outline-none transition placeholder:text-[#A1A1A1] focus:border-[#1BB1F6] focus:bg-white" />
            </label>
            <label className="block">
              <span className="mb-2 block font-sans text-sm font-medium text-[#525252]">Their email</span>
              <input required type="email" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} placeholder="parent@example.com" className="h-12 w-full rounded-xl border-2 border-[#E8E8E8] bg-[#F7F7F7] px-4 font-sans text-base text-[#0A0A0A] outline-none transition placeholder:text-[#A1A1A1] focus:border-[#1BB1F6] focus:bg-white" />
            </label>
            <label className="block">
              <span className="mb-2 block font-sans text-sm font-medium text-[#525252]">Your name</span>
              <input required value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="e.g. Jordan" className="h-12 w-full rounded-xl border-2 border-[#E8E8E8] bg-[#F7F7F7] px-4 font-sans text-base text-[#0A0A0A] outline-none transition placeholder:text-[#A1A1A1] focus:border-[#1BB1F6] focus:bg-white" />
            </label>
            <button type="submit" className="flex h-13 min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-[#1BB1F6] px-5 font-sans text-base font-semibold text-white transition hover:bg-[#079FDF]">
              Prepare email <ArrowIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [showParentModal, setShowParentModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanId>("until_sat");
  const [testDate, setTestDate] = useState(SAT_DATES[0].date);
  const [satMenuOpen, setSatMenuOpen] = useState(false);
  const satMenuRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);
  const untilSatQuote = useMemo(() => getUntilSatQuote(testDate, today), [testDate, today]);
  const selectedPolicy = getPricingPolicy(selectedPlan);
  const selectedSat = SAT_DATES.find((satDate) => satDate.date === testDate) ?? SAT_DATES[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan") as PricingPlanId | null;
    const requestedTestDate = params.get("testDate");
    if (plan && ["until_sat", "monthly", "quarterly", "six_months"].includes(plan)) {
      setSelectedPlan(plan);
    }
    if (requestedTestDate && SAT_DATES.some((satDate) => satDate.date === requestedTestDate)) {
      setTestDate(requestedTestDate);
    }
  }, []);

  useEffect(() => {
    if (!satMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!satMenuRef.current?.contains(event.target as Node)) setSatMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSatMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [satMenuOpen]);
  const selectedPricing = useMemo(() => {
    if (selectedPlan === "until_sat") {
      return {
        amount: untilSatQuote.hasTestDate ? formatPrice(untilSatQuote.price) : `From ${formatPrice(untilSatQuote.price)}`,
        cadence: "one-time",
        detail: untilSatQuote.hasTestDate
          ? `${untilSatQuote.weeks} weeks × ${formatPrice(SAT_WEEKLY_RATE_DOLLARS)} per week`
          : `${formatPrice(SAT_WEEKLY_RATE_DOLLARS)} per week · ${untilSatQuote.weeks}-week minimum`,
      };
    }
    if (selectedPlan === "quarterly") {
      return {
        amount: formatPrice(QUARTERLY_PRICE_DOLLARS),
        cadence: "every 3 months",
        detail: `Approximately ${formatPrice(QUARTERLY_PRICE_DOLLARS / 3)} per month`,
      };
    }
    if (selectedPlan === "six_months") {
      return {
        amount: formatPrice(SIX_MONTH_PRICE_DOLLARS),
        cadence: "every 6 months",
        detail: `Approximately ${formatPrice(SIX_MONTH_PRICE_DOLLARS / 6)} per month`,
      };
    }
    return {
      amount: formatPrice(MONTHLY_PRICE_DOLLARS),
      cadence: "per month",
      detail: "Renews monthly until canceled",
    };
  }, [selectedPlan, untilSatQuote]);
  const selectedBillingDescription =
    selectedPlan === "until_sat"
      ? `One payment of ${selectedPricing.amount}. No subscription.`
      : selectedPlan === "monthly"
        ? `Billed ${formatPrice(MONTHLY_PRICE_DOLLARS)} monthly. Cancel anytime.`
        : selectedPlan === "quarterly"
          ? `Billed ${formatPrice(QUARTERLY_PRICE_DOLLARS)} every 3 months. Cancel anytime.`
          : `Billed ${formatPrice(SIX_MONTH_PRICE_DOLLARS)} every 6 months. Cancel anytime.`;

  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#FFFFFF] text-[#0A0A0A]">
      <MarketingNavbar currentPage="pricing" />

      <section className="relative px-5 pb-3 pt-20 sm:px-8 sm:pb-4 sm:pt-24 lg:px-10 lg:pt-28">
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className={`${typography.marketingPageTitle} !text-4xl sm:!text-[2.75rem] lg:!text-5xl`}>
            <span className="block">Ace the SAT with 1,000+ questions</span>
            <span className="block">&amp; expert live tutoring</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <StudentAvatars />
            <p className="font-sans text-lg leading-8 text-[#747474] sm:text-xl">
              Learn directly from Kyra, a 1560 scorer &amp; Ivy League student
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-3 rounded-full border-2 border-[#E5E5E5] bg-transparent px-5 py-2.5 font-sans text-sm font-medium text-[#525252] sm:text-base">
            <span className="text-[#16A765]">
              <TrendUpIcon />
            </span>
            <span>Tutormigo Pro users improve SAT scores on average</span>
          </div>
        </div>
      </section>

      <section id="plans" className="scroll-mt-20 px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mt-1 max-w-4xl pb-5 text-center sm:mt-2 sm:pb-7">
            <div className="flex flex-wrap items-end justify-center gap-3" aria-label="Tutormigo Pro billing options">
              <div ref={satMenuRef} className={`relative w-full sm:w-auto ${satMenuOpen ? "z-40" : "z-10"}`}>
                <p className="mb-2 font-sans text-sm font-semibold text-[#079FDF]">Best value</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan("until_sat");
                    setSatMenuOpen((open) => !open);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={satMenuOpen}
                  aria-pressed={selectedPlan === "until_sat"}
                  className={`flex h-11 w-full cursor-pointer select-none items-center justify-between gap-2 rounded-full px-4 font-sans text-sm font-semibold transition sm:w-[10.5rem] ${
                    selectedPlan === "until_sat"
                      ? "bg-[#1BB1F6] text-white"
                      : "bg-[#F2F2F2] text-[#747474] hover:bg-[#EAEAEA] hover:text-[#525252]"
                  }`}
                >
                  {selectedSat.label}
                  <ChevronIcon open={satMenuOpen} />
                </button>

                {satMenuOpen ? (
                  <div className="absolute left-0 z-30 mt-2 max-h-[31rem] w-full overflow-y-auto rounded-[1.4rem] border-2 border-[#E5E5E5] bg-white p-2 text-left shadow-[0_22px_60px_rgba(24,24,27,0.16)] sm:w-[23rem]" role="menu">
                    {SAT_DATES.map((satDate, index) => (
                      <div key={satDate.id}>
                        {index === 0 || SAT_DATES[index - 1].season !== satDate.season ? (
                          <p className="px-3 pb-1 pt-3 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A0A0A0]">{satDate.season}</p>
                        ) : null}
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={testDate === satDate.date}
                          onClick={() => {
                            setTestDate(satDate.date);
                            setSelectedPlan("until_sat");
                            setSatMenuOpen(false);
                          }}
                          className={`mt-1 w-full cursor-pointer rounded-xl px-3 py-3 text-left transition ${
                            testDate === satDate.date ? "bg-[#E7F8FF]" : "hover:bg-[#F5F5F5]"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-sans text-sm font-semibold text-[#3F3F46]">{satDate.label}</span>
                            <span className="font-sans text-xs text-[#747474]">{formatSatDate(satDate.date)}</span>
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                aria-pressed={selectedPlan === "monthly"}
                onClick={() => {
                  setSelectedPlan("monthly");
                  setSatMenuOpen(false);
                }}
                className={`h-11 flex-1 cursor-pointer select-none rounded-full px-4 font-sans text-sm font-semibold transition sm:flex-none sm:min-w-[8rem] ${
                  selectedPlan === "monthly"
                    ? "bg-[#1BB1F6] text-white"
                    : "bg-[#F2F2F2] text-[#747474] hover:bg-[#EAEAEA] hover:text-[#525252]"
                }`}
              >
                1 Month
              </button>

              <button
                type="button"
                aria-pressed={selectedPlan === "quarterly"}
                onClick={() => {
                  setSelectedPlan("quarterly");
                  setSatMenuOpen(false);
                }}
                className={`h-11 flex-1 cursor-pointer select-none rounded-full px-4 font-sans text-sm font-semibold transition sm:flex-none sm:min-w-[10rem] ${
                  selectedPlan === "quarterly"
                    ? "bg-[#1BB1F6] text-white"
                    : "bg-[#F2F2F2] text-[#747474] hover:bg-[#EAEAEA] hover:text-[#525252]"
                }`}
              >
                3 Months
              </button>

              <button
                type="button"
                aria-pressed={selectedPlan === "six_months"}
                onClick={() => {
                  setSelectedPlan("six_months");
                  setSatMenuOpen(false);
                }}
                className={`h-11 flex-1 cursor-pointer select-none rounded-full px-4 font-sans text-sm font-semibold transition sm:flex-none sm:min-w-[9rem] ${
                  selectedPlan === "six_months"
                    ? "bg-[#1BB1F6] text-white"
                    : "bg-[#F2F2F2] text-[#747474] hover:bg-[#EAEAEA] hover:text-[#525252]"
                }`}
              >
                6 Months
              </button>
            </div>

            <p className="mt-3 font-sans text-sm text-[#747474]">Upgrade or cancel anytime</p>
          </div>

          <div className="mx-auto mt-4 grid max-w-[49rem] items-stretch gap-5 md:grid-cols-[0.92fr_1.08fr]">
          <article className="flex flex-col rounded-[1.65rem] border-2 border-[#E2E2E2] bg-[#F1F1F1] p-[6px] shadow-[0_12px_34px_rgba(24,24,27,0.05)]">
            <header className="px-3 pb-2 pt-1.5">
              <p className="font-sans text-2xl font-semibold text-[#747474]">Free</p>
            </header>
            <div className="flex flex-1 flex-col rounded-[1.35rem] border-2 border-[#E5E5E5] bg-white p-4">
              <div className="flex items-end gap-2">
                <span className="font-dm text-[2.65rem] font-medium tracking-normal text-[#3F3F46]">$0</span>
                <span className="pb-1 font-sans text-sm text-[#747474]">forever</span>
              </div>
              <p className="mt-2 font-sans text-sm leading-5 text-[#747474]">No credit card required.</p>
              <div className="my-4 h-px bg-[#E8E8E8]" />
              <ul className="grid gap-y-1.5">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 font-sans text-[15px] leading-5 text-[#525252]"><CheckIcon muted />{feature}</li>
                ))}
              </ul>
              <Link href="/signup" className="arc-btn-secondary mt-auto h-10 gap-2 px-4 text-sm">
                Continue with Free <ArrowIcon />
              </Link>
            </div>
          </article>

          <article className="relative flex flex-col rounded-[1.65rem] border-2 border-[#1BB1F6] bg-[#1BB1F6] p-[6px] shadow-[0_14px_38px_rgba(27,177,246,0.13)]">
            {selectedPlan === "until_sat" ? <div className="absolute -top-4 left-7 rounded-full border-2 border-[#1BB1F6] bg-white px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.1em] text-[#079FDF] shadow-[0_6px_18px_rgba(27,177,246,0.18)]">Best value</div> : null}
            <header className="px-3 pb-2 pt-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-sans text-2xl font-semibold text-white">Pro</p>
                <span className="rounded-full border border-white/65 bg-white/15 px-3 py-1.5 font-sans text-xs font-semibold text-white">{selectedPolicy.cadence}</span>
              </div>
            </header>
            <div className="flex flex-1 flex-col rounded-[1.35rem] border-2 border-[#BDE8FA] bg-white p-4">
              <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                <span className="font-dm text-[2.65rem] font-medium tracking-normal text-[#3F3F46]">{selectedPricing.amount}</span>
                <span className="pb-1 font-sans text-sm text-[#747474]">{selectedPricing.cadence}</span>
              </div>
              <p
                aria-hidden={selectedPlan === "until_sat"}
                className={`${selectedPlan === "until_sat" ? "hidden" : "mt-2"} font-sans text-sm font-medium text-[#087FAE]`}
              >
                {selectedPricing.detail}
              </p>
              <p className="mt-2.5 font-sans text-sm leading-5 text-[#747474]">{selectedBillingDescription}</p>
              <div className="my-4 h-px bg-[#CAEFFF]" />
              <ul className="grid gap-y-1.5">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 font-sans text-[15px] leading-5 text-[#313131]"><CheckIcon />{feature}</li>
                ))}
              </ul>
              <div className="mt-auto pt-4">
                <CheckoutButton planId={selectedPlan} testDate={testDate} />
                <button type="button" onClick={() => setShowParentModal(true)} className="arc-btn-secondary mt-2 h-9 w-full px-4 text-base">
                  Ask a parent to pay
                </button>
              </div>
            </div>
          </article>
          </div>
        </div>
      </section>

      <section id="compare" className="scroll-mt-20 border-y-2 border-[#E8E8E8] bg-white px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[#079FDF]">Compare plans</p>
            <h2 className={`mt-3 ${typography.marketingSectionTitle}`}>Know exactly what you&apos;re getting.</h2>
            <p className="mt-4 font-sans text-lg leading-8 text-[#747474]">Free is for trying the practice experience. Pro adds the structure and live support that turn practice into a weekly habit.</p>
          </div>
          <div className="mt-10 overflow-hidden rounded-[1.7rem] border-2 border-[#E8E8E8]">
            <div className="grid grid-cols-[minmax(0,1.7fr)_0.65fr_0.65fr] bg-[#F7F7F7] px-5 py-4 font-sans text-sm font-semibold text-[#525252] sm:px-7">
              <span>Feature</span><span className="text-center">Free</span><span className="text-center text-[#079FDF]">Pro</span>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} className="grid min-h-[4.5rem] grid-cols-[minmax(0,1.7fr)_0.65fr_0.65fr] items-center border-t border-[#E8E8E8] px-5 py-4 font-sans text-sm sm:px-7 sm:text-base">
                <span className="pr-3 font-medium text-[#525252]">{row.label}</span>
                <span className="text-center"><ComparisonValue value={row.free} /></span>
                <span className="text-center"><ComparisonValue value={row.pro} featured /></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faqs" className="scroll-mt-20 px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[#079FDF]">FAQs</p>
            <h2 className={`mt-3 ${typography.marketingSectionTitle}`}>A few things parents ask.</h2>
          </div>
          <div className="divide-y-2 divide-[#E8E8E8] border-y-2 border-[#E8E8E8]">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question}>
                  <button type="button" onClick={() => setOpenFaq(isOpen ? null : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left font-sans text-base font-semibold text-[#0A0A0A] sm:text-lg" aria-expanded={isOpen}>
                    {faq.question}
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F2F2F2] text-xl font-normal transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {isOpen ? <p className="pb-6 pr-10 font-sans text-base leading-7 text-[#747474]">{faq.answer}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#0A0A0A] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#1BB1F6]/35 blur-3xl" />
          <div className="absolute -bottom-28 -right-10 h-64 w-64 rounded-full bg-[#E54D96]/30 blur-3xl" />
          <h2 className="relative font-dm text-3xl font-medium leading-[1.08] tracking-normal text-white sm:text-4xl">
            Start where you are.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl font-sans text-lg leading-8 text-white/70">Try Tutormigo for free, then add the Roadmap and live support when you&apos;re ready.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-white px-6 font-sans text-base font-semibold text-[#0A0A0A] transition hover:bg-[#F2F2F2]">Start free <ArrowIcon /></Link>
            <button type="button" onClick={() => setShowParentModal(true)} className="inline-flex min-h-[3.25rem] items-center justify-center rounded-xl border-2 border-white/20 px-6 font-sans text-base font-semibold text-white transition hover:bg-white/10">Ask a parent</button>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-[#E8E8E8] bg-white px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[78rem] flex-col gap-3 font-sans text-sm text-[#747474] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tutormigo</p>
          <p>SAT® is a trademark of College Board, which is not affiliated with Tutormigo.</p>
        </div>
      </footer>

      {showParentModal ? (
        <ParentEmailModal
          onClose={() => setShowParentModal(false)}
          planLabel={selectedPolicy.label}
          priceLabel={`${selectedPricing.amount} ${selectedPricing.cadence}`}
        />
      ) : null}
    </main>
  );
}
