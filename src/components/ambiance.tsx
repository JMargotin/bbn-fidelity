import Image from "next/image";

type Variant = "full" | "calm";

export function Ambiance({ variant = "full" }: { variant?: Variant }) {
  return (
    <div aria-hidden className="scene">
      <Image
        src="/GTA_6_Release.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="scene-photo"
      />
      <div className="scene-tint" />
      {variant === "calm" && <div className="scene-tint-calm" />}
    </div>
  );
}
