import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  size?: number;
  showText?: boolean;
};

export function BrandMark({ href = "/", size = 40, showText = true }: Props) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      <span
        className="relative shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15 transition-transform duration-200 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <Image
          src="/brand/logo.png"
          alt="Burger by Night"
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority
        />
      </span>
      {showText && (
        <span className="flex items-baseline gap-1.5 leading-none">
          <span className="font-display text-lg tracking-wide text-cream">Burger</span>
          <span className="script text-xl text-magenta-soft">by Night</span>
        </span>
      )}
    </Link>
  );
}
