import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  size = "md",
  href = "/",
  priority = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string | null;
  priority?: boolean;
}) {
  const dims = {
    sm: { box: "h-9 w-9", px: 36 },
    md: { box: "h-11 w-11", px: 44 },
    lg: { box: "h-16 w-16 sm:h-20 sm:w-20", px: 80 },
    xl: { box: "h-24 w-24 sm:h-32 sm:w-32", px: 128 },
  }[size];

  const image = (
    <Image
      src="/logo.png"
      alt="Sharp Music"
      width={dims.px}
      height={dims.px}
      priority={priority}
      className={`${dims.box} rounded-md object-cover`}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="Sharp Music home">
      {image}
    </Link>
  );
}
