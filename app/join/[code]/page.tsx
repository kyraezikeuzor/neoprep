import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBootcampByJoinCode } from "@/app/actions/bootcamp";
import JoinBootcampClient from "@/components/JoinBootcampClient";

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const code = decodeURIComponent(params.code ?? "").trim();
  const bootcamp = await getBootcampByJoinCode(code);
  if (!bootcamp) return { title: "Join Bootcamp · Tutormigo" };
  return { title: `Join ${bootcamp.name} · Tutormigo` };
}

export default async function JoinBootcampPage({
  params,
}: {
  params: { code: string };
}) {
  const code = decodeURIComponent(params.code ?? "").trim();
  const bootcamp = await getBootcampByJoinCode(code);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-[22rem]">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/neoprep-logo.png"
              alt="Tutormigo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
              priority
            />
            <span className="text-2xl font-semibold tracking-tight text-[#18181B]">
              Tutormigo
            </span>
          </Link>
        </div>

        <div className="mt-10">
          {!bootcamp ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-[#18181B]">
                This invite link isn&apos;t valid or has expired
              </h1>
              <p className="mt-3 text-base leading-relaxed text-[#71717A]">
                Ask your tutor for a new join link, or sign in to continue practicing
                on your own.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#F4F4F5] px-5 py-3.5 text-base font-medium text-[#52525B] transition hover:bg-[#EBEBED]"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <JoinBootcampClient
              bootcampId={bootcamp.id}
              bootcampName={bootcamp.name}
              joinCode={bootcamp.join_code}
              isLoggedIn={Boolean(user)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
