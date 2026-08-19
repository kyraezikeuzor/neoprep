import Image from "next/image";

/** Legacy logo component retained for older imports. */
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
      alt="Tutormigo"
      width={128}
      height={128}
      priority={priority}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
