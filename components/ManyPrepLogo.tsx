import Image from "next/image";

/** @deprecated Prefer NeoPrepLogo — kept for older imports. */
export default function ManyPrepLogo({
  className = "h-8 w-8",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/neoprep-logo.png"
      alt="NeoPrep"
      width={128}
      height={128}
      priority={priority}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
