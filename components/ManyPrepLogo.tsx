import Image from "next/image";

export default function ManyPrepLogo({
  className = "h-8 w-8",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/manyprep-logo.png"
      alt="ManyPrep"
      width={128}
      height={128}
      priority={priority}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
