"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Flip to true when Pricing should return on the landing page. */
const SHOW_PRICING = false;
/** Flip to true when the SAT fee-waiver callout should return. */
const SHOW_FEE_WAIVER = false;

const TESTIMONIALS = [
  {
    quote: "She was super helpful with my questions! I really appreciate it.",
    tag: "Super helpful",
  },
  {
    quote: "Helped clarify some things.",
    tag: "Helpful",
  },
  {
    quote: "The explanations were helpful and it was interactive.",
    tag: "Interactive",
  },
  {
    quote:
      "I appreciate her showing us ways to get more experience with SAT questions.",
    tag: "Fun",
  },
] as const;

const TESTIMONIAL_ATTRIBUTION =
  "Anonymous Student, Kyra's Khan Academy Schoolhouse.world Bootcamp";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is the platform really free?",
    a: "Yes. There is no payment required to participate. At the end of the platform period, you will not be automatically charged — any future paid plans will be communicated separately before payment is required.",
  },
  {
    q: "What do I get as a platform participant?",
    a: "One week of live SAT instruction (two hours of group teaching), access to 1,000 original SAT practice questions with explanations, the NeoPrep Discord community, and full platform access for the platform period.",
  },
  {
    q: "What are platform participants expected to do?",
    a: "Practice regularly, attend the live session when you can, report bugs or confusing questions, share honest feedback, and complete occasional short surveys. Your input helps us improve NeoPrep before public launch.",
  },
  {
    q: "Are these official College Board questions?",
    a: "No. NeoPrep’s bank is 1,000 original questions designed to reflect the format, skills, and difficulty of the SAT — not official College Board material.",
  },
  {
    q: "What happens when the platform period ends?",
    a: "NeoPrep may transition to a paid program later. Participation does not obligate you to purchase anything. We’ll share future pricing and terms before anyone is asked to pay.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Join the free platform",
    desc: "Sign up and get platform access — no payment required.",
  },
  {
    n: "02",
    title: "Practice with 1,000+ questions",
    desc: "Original problems modeled on the real SAT, each with a clear explanation.",
  },
  {
    n: "03",
    title: "Learn live & get unstuck",
    desc: "Two hours of live group instruction, plus Discord for questions and feedback.",
  },
] as const;

/** Shared landing tokens — sleek flat gray, no shadows */
const ink = "text-arc-ink";
const muted = "text-[#71717A]";
const border = "border-2 border-[#E5E5E5]";
const softBlue = "bg-[#EEF3F8]";
const headingTrack = "tracking-wide";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 shrink-0 text-[#9CA3AF] transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function LandingPage() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setQuoteIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={`landing-page min-h-[100dvh] bg-white font-dm ${ink}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b-2 border-[#E5E5E5] bg-white`}>
        <div className="mx-auto flex h-14 max-w-[70rem] items-center justify-between px-6 sm:px-10 lg:px-14">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/neoprep-logo.png"
              alt="NeoPrep"
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg object-cover"
              priority
            />
            <span className={`text-lg font-medium ${headingTrack} ${ink}`}>NeoPrep</span>
          </Link>
          <nav className={`hidden items-center gap-6 text-base font-medium ${muted} md:flex`}>
            <a href="#platform" className="transition hover:text-[#111111]">
              Platform
            </a>
            <a href="#steps" className="transition hover:text-[#111111]">
              How it works
            </a>
            <a href="#reviews" className="transition hover:text-[#111111]">
              Reviews
            </a>
            <a href="#faqs" className="transition hover:text-[#111111]">
              FAQs
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-full bg-[#F4F4F5] px-5 py-2.5 text-base font-medium text-[#52525B] transition hover:bg-[#EBEBED]"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-[#18181B] bg-[#18181B] px-5 py-2.5 text-base font-medium text-white transition hover:bg-[#3F3F46]"
            >
              Join free platform
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — mentor-style card, circular photo + score by name */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[70rem] items-center gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:px-14 lg:py-20">
          <div className="max-w-xl">
            <p className="mb-3 inline-flex rounded-full border-2 border-[#E4E4E7] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#71717A]">
              Free platform
            </p>
            <h1 className={`text-4xl font-semibold leading-[1.1] tracking-wide text-arc-ink sm:text-5xl lg:text-[3.25rem]`}>
              Get better at the SAT, one question at a time.
            </h1>
            <p className="landing-body mt-5 text-base font-normal leading-relaxed text-[#71717A] sm:text-lg">
              Join the NeoPrep platform for free. Get 1,000 original SAT questions, clear
              explanations, live group instruction, and a community to keep you on track.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex rounded-full border-2 border-[#27272A] bg-[#27272A] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#3F3F46]"
              >
                Join free platform
              </Link>
              <a
                href="https://discord.gg/bCcrzEPQuc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full border-2 border-arc-accent bg-arc-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-arc-accentDeep"
              >
                Join Discord Community
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[22rem] rounded-[1.75rem] border-2 border-[#EEEEEE] bg-[#F5F5F5] p-4 sm:max-w-[24rem] sm:p-5">
              {/* White frame behind circular photo + overlapping tags */}
              <div className="relative rounded-[1.25rem] border-2 border-[#EEEEEE] bg-white p-3 sm:p-3.5">
                <div className="relative mx-auto aspect-square w-full">
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    <Image
                      src="/landing/kyra-hero.jpg"
                      alt="Kyra, NeoPrep tutor"
                      fill
                      priority
                      sizes="(max-width: 640px) 70vw, 360px"
                      className="object-cover object-[center_20%]"
                    />
                  </div>
                  <span className="absolute right-0 top-[6%] z-10 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium text-[#166534]">
                    1560 SAT
                  </span>
                  <span className="absolute bottom-[6%] left-0 z-10 rounded-full bg-[#FCE7F3] px-3 py-1 text-xs font-medium text-[#9D174D]">
                    Columbia University
                  </span>
                </div>
              </div>

              <div className="px-1 pt-4 pb-0.5 sm:px-1.5">
                <h2 className={`text-xl font-medium ${headingTrack} text-arc-ink sm:text-2xl`}>
                  Learn from a 1560 scorer.
                </h2>
                <p className="landing-body mt-1.5 text-sm leading-relaxed text-[#71717A]">
                  I&apos;m Kyra. I built NeoPrep to help students practice with clear
                  explanations and real SAT structure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform screenshots */}
      <section id="platform" className="border-t-2 border-[#E5E5E5] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[70rem] space-y-16 px-6 sm:px-10 lg:px-14 sm:space-y-20">
          <div>
            <h2 className={`text-3xl font-medium ${headingTrack} ${ink} sm:text-4xl`}>
              Practice in a real SAT-style question bank.
            </h2>
            <p className={`landing-body mt-3 max-w-2xl text-lg leading-relaxed ${muted}`}>
              Browse topics, drill questions, and work through passages the way you will
              on test day.
            </p>
            <div className={`mt-8 overflow-hidden rounded-3xl ${border} bg-white`}>
              <Image
                src="/landing/dashboard.jpg"
                alt="NeoPrep question bank dashboard"
                width={1024}
                height={499}
                className="h-auto w-full"
                sizes="(max-width: 1152px) 100vw, 1152px"
              />
            </div>
          </div>

          <div>
            <h2 className={`text-3xl font-medium ${headingTrack} ${ink} sm:text-4xl`}>
              Get step-by-step explanations when you need them.
            </h2>
            <p className={`landing-body mt-3 max-w-2xl text-lg leading-relaxed ${muted}`}>
              Answer, check your work, and open a clear explanation panel — including
              why each choice is right or wrong.
            </p>
            <div className={`mt-8 overflow-hidden rounded-3xl ${border} bg-white`}>
              <Image
                src="/landing/question-explanation.jpg"
                alt="NeoPrep practice question with explanation panel"
                width={1024}
                height={497}
                className="h-auto w-full"
                sizes="(max-width: 1152px) 100vw, 1152px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Three steps — sleek split cards, flat borders, muted numbers */}
      <section id="steps" className="border-t-2 border-[#E5E5E5] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[70rem] px-6 sm:px-10 lg:px-14">
          <h2 className={`text-center text-3xl font-medium ${headingTrack} ${ink} sm:text-4xl`}>
            Three steps to your dream score.
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step) => (
              <article
                key={step.n}
                className={`flex flex-col overflow-hidden rounded-3xl ${border} bg-white`}
              >
                <div
                  className={`flex h-40 items-center justify-center sm:h-44 ${softBlue}`}
                >
                  <span className="text-6xl font-medium tabular-nums tracking-tight text-[#D1D5DB]">
                    {step.n}
                  </span>
                </div>
                <div className="flex flex-1 flex-col px-6 pb-7 pt-6">
                  <p className="text-sm font-medium tabular-nums text-[#D1D5DB]">{step.n}</p>
                  <h3 className={`mt-1 text-xl font-medium ${headingTrack} ${ink}`}>{step.title}</h3>
                  <p className={`landing-body mt-2 text-sm font-normal leading-relaxed ${muted}`}>{step.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials carousel */}
      <section id="reviews" className="border-t-2 border-[#E5E5E5] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10 lg:px-14">
          <h2 className={`text-3xl font-medium ${headingTrack} ${ink} sm:text-4xl`}>
            What students are saying
          </h2>

          <div className="relative mt-12 min-h-[16rem]">
            {TESTIMONIALS.map((item, i) => (
              <blockquote
                key={item.quote}
                aria-hidden={i !== quoteIndex}
                className={`absolute inset-x-0 top-0 transition-opacity duration-500 ${
                  i === quoteIndex ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <div
                  className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${border} ${softBlue} text-[#71717A]`}
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                    <path d="M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0 1.75c-3.6 0-6.75 1.85-6.75 4.13V19.5h13.5v-1.62c0-2.28-3.15-4.13-6.75-4.13z" />
                  </svg>
                </div>
                <p className={`landing-body text-2xl font-medium leading-snug ${headingTrack} ${ink} sm:text-3xl`}>
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="mt-5">
                  <span
                    className={`inline-flex rounded-full ${border} bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${muted}`}
                  >
                    {item.tag}
                  </span>
                </div>
                <footer className={`landing-body mt-4 text-sm font-normal ${muted}`}>
                  {TESTIMONIAL_ATTRIBUTION}
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === quoteIndex}
                onClick={() => setQuoteIndex(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === quoteIndex
                    ? "w-6 bg-[#111111]"
                    : "w-2.5 bg-[#D1D5DB] hover:bg-[#9CA3AF]"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — gated */}
      {SHOW_PRICING && (
        <section id="pricing" className={`border-t-2 border-[#E5E5E5] bg-white py-16 sm:py-20`}>
          <div className="mx-auto max-w-[70rem] px-6 sm:px-10 lg:px-14">
            <h2 className={`text-center text-3xl font-medium ${headingTrack} ${ink} sm:text-4xl`}>
              Pricing
            </h2>
            <p className={`landing-body mt-3 text-center text-base ${muted}`}>
              Coming after the free platform period. Platform participants are never auto-charged.
            </p>
          </div>
        </section>
      )}

      {/* Fee waiver — gated */}
      {SHOW_FEE_WAIVER && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-3xl px-6 sm:px-10 lg:px-14">
            <div className={`rounded-3xl ${border} bg-white p-6 sm:p-8`}>
              <h2 className={`text-xl font-medium ${headingTrack} ${ink}`}>Have an SAT fee waiver?</h2>
              <p className={`landing-body mt-2 text-sm leading-relaxed ${muted}`}>
                Details for fee-waiver support will be shared when paid plans launch.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Platform program policy */}
      <section className="border-t-2 border-[#E5E5E5] bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-6 sm:px-10 lg:px-14">
          <div className={`rounded-3xl ${border} bg-white p-6 sm:p-8`}>
            <h2 className={`text-xl font-medium ${headingTrack} ${ink}`}>Platform program policy</h2>
            <p className={`landing-body mt-2 text-sm leading-relaxed ${muted}`}>
              The NeoPrep Platform Program is free. You get live instruction, the question bank,
              Discord, and platform access. In return, we ask you to
              practice, share feedback, and report issues. You will not be automatically
              charged when the free platform period ends.
            </p>
            <ul className={`landing-body mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed ${muted}`}>
              <li>No payment required to participate</li>
              <li>Platform access lasts for the testing period and may change as we ship updates</li>
              <li>Future pricing will be communicated separately before any purchase</li>
              <li>Joining the platform does not obligate you to buy a future plan</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQs — Inter throughout */}
      <section id="faqs" className="landing-faqs border-t-2 border-[#E5E5E5] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 sm:px-10 lg:px-14">
          <h2 className={`text-3xl font-medium ${headingTrack} ${ink} sm:text-4xl`}>
            Frequently asked questions
          </h2>
          <div className={`mt-8 divide-y-2 divide-[#E5E5E5] border-y-2 border-[#E5E5E5]`}>
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition hover:bg-[#FAFAFA]"
                  >
                    <span className="text-xl font-medium tracking-wide text-arc-ink">{item.q}</span>
                    <Chevron open={open} />
                  </button>
                  {open && (
                    <p className={`pb-5 pr-10 text-lg font-normal leading-relaxed ${muted}`}>
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-[#E5E5E5] py-8">
        <div
          className={`landing-body mx-auto flex max-w-[70rem] flex-col items-center justify-between gap-3 px-6 text-sm ${muted} sm:flex-row sm:px-10 lg:px-14`}
        >
          <p>© {new Date().getFullYear()} NeoPrep</p>
          <div className="flex gap-4">
            <Link href="/login" className="transition hover:text-[#111111]">
              Join free platform
            </Link>
            <a href="#faqs" className="transition hover:text-[#111111]">
              FAQs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
