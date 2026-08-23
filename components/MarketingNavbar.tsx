import Image from "next/image";
import Link from "next/link";

type MarketingNavbarProps = {
  currentPage?: "home" | "pricing";
};

const NAV_ITEMS = [
  { label: "How it works", homeHref: "#steps", pricingHref: "/#steps" },
  { label: "Reviews", homeHref: "#reviews", pricingHref: "/#reviews" },
  { label: "Pricing", homeHref: "/pricing", pricingHref: "#plans" },
  { label: "FAQs", homeHref: "#faqs", pricingHref: "#faqs" },
] as const;

export default function MarketingNavbar({
  currentPage = "home",
}: MarketingNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#E8E8E8] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[78rem] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/neoprep-logo.png"
            alt="Tutormigo"
            width={34}
            height={34}
            className="h-8 w-8 rounded-[0.7rem] object-cover"
            priority
          />
          <span className="font-dm text-xl font-medium tracking-[-0.025em] text-[#0A0A0A]">
            Tutormigo
          </span>
        </Link>

        <nav className="hidden items-center gap-5 font-sans text-sm font-medium text-[#747474] lg:flex xl:gap-7">
          {NAV_ITEMS.map((item) => {
            const href =
              currentPage === "pricing" ? item.pricingHref : item.homeHref;
            const isCurrent =
              item.label === "Pricing" && currentPage === "pricing";

            return (
              <Link
                key={item.label}
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`whitespace-nowrap transition hover:text-[#0A0A0A] ${
                  isCurrent ? "text-[#0A0A0A]" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/login"
            className="rounded-full bg-[#F2F2F2] px-3 py-2.5 font-sans text-sm font-semibold text-[#525252] transition hover:bg-[#E8E8E8] sm:px-4"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#0A0A0A] px-4 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-[#2D2D2D] sm:px-5"
          >
            Open app
          </Link>
        </div>
      </div>
    </header>
  );
}
