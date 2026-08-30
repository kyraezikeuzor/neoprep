import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up · Tutormigo",
  description:
    "Create a Tutormigo account and start practicing for the SAT for free.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
