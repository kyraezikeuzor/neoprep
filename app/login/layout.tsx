import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In · NeoPrep",
  description: "Sign in to NeoPrep to continue practicing for the SAT.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
