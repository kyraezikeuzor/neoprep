import type { Metadata } from "next";
import PricingPage from "@/components/PricingPage";

export const metadata: Metadata = {
  title: "Pricing · Tutormigo",
  description:
    "Choose the Tutormigo SAT prep plan that fits your week, with adaptive practice and live instruction.",
};

export default function Pricing() {
  return <PricingPage />;
}
