/**
 * Shared application typography and neutral-color tokens.
 *
 * Use these semantic styles instead of rebuilding font size, weight,
 * line-height, and gray combinations inside individual pages.
 */
export const APP_GRAYS = {
  ink: "#0A0A0A",
  heading: "#3F3F46",
  body: "#525252",
  muted: "#747474",
  subtle: "#A3A3A3",
  line: "#ECECEC",
  surface: "#F4F4F4",
} as const;

export const textColor = {
  ink: "text-[#0A0A0A]",
  heading: "text-arc-heading",
  body: "text-[#525252]",
  muted: "text-arc-muted",
  subtle: "text-[#A3A3A3]",
} as const;

export const typography = {
  pageTitle:
    "font-sans text-2xl font-medium tracking-tight text-arc-heading sm:text-3xl",
  pageDescription:
    "font-sans text-base font-normal leading-[1.6] text-arc-muted",
  sectionTitle:
    "font-sans text-lg font-medium tracking-tight text-arc-heading sm:text-xl",
  sectionDescription:
    "font-sans text-sm font-normal leading-relaxed text-arc-muted sm:text-[15px]",
  cardTitle: "font-sans text-base font-medium text-arc-heading sm:text-lg",
  cardItemTitle: "font-sans text-sm font-normal text-arc-heading",
  cardLabel: "font-sans text-[13px] font-normal text-arc-muted",
  cardValue:
    "font-sans text-2xl font-normal tabular-nums leading-none tracking-tight text-arc-heading",
  cardValueLarge:
    "font-sans text-3xl font-normal tabular-nums leading-none tracking-tight text-arc-heading sm:text-4xl",
  cardValueText:
    "font-sans text-base font-normal leading-normal tracking-normal text-arc-heading sm:text-lg",
  cardBody: "font-sans text-sm font-normal leading-relaxed text-[#525252]",
  cardHint: "font-sans text-sm font-normal text-arc-muted",
  body: "font-sans text-base font-normal leading-relaxed text-[#525252]",
  bodySmall: "font-sans text-sm font-normal leading-relaxed text-[#525252]",
  caption: "font-sans text-xs font-normal leading-relaxed text-arc-muted",
  metadata: "font-sans text-xs font-normal text-arc-muted",
  eyebrow:
    "font-sans text-xs font-medium uppercase tracking-[0.08em] text-arc-muted",
  button: "font-sans text-sm font-semibold",
  buttonSmall: "font-sans text-xs font-medium",
  navItem: "font-sans text-sm font-medium",
  navSection:
    "font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A3A3A3]",
  input: "font-sans text-sm font-normal text-arc-heading",
  // Public marketing pages only. Keeping these separate prevents a public-site
  // redesign from changing typography inside the student platform.
  marketingHeroTitle:
    "font-dm text-4xl font-medium leading-[1.04] tracking-normal text-arc-heading sm:text-6xl lg:text-[4rem]",
  marketingPageTitle:
    "font-dm text-4xl font-medium leading-[1.06] tracking-normal text-arc-heading sm:text-5xl lg:text-[3.5rem]",
  marketingSectionTitle:
    "font-dm text-3xl font-medium leading-[1.08] tracking-normal text-arc-heading sm:text-5xl",
  marketingCardTitle:
    "font-dm text-2xl font-medium leading-tight tracking-normal text-arc-heading sm:text-3xl",
  marketingItemTitle:
    "font-dm text-xl font-medium leading-tight tracking-normal text-arc-heading",
  marketingPrice:
    "font-dm text-6xl font-semibold tracking-normal text-arc-heading",
} as const;

export type TypographyStyle = keyof typeof typography;
