import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In · Tutormigo",
  description: "Sign in to Tutormigo to continue practicing for the SAT.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
