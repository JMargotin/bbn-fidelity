import Image from "next/image";

/** Full-bleed GTA-style background used site-wide (rendered once in the root layout). */
export function Ambiance() {
  return (
    <div aria-hidden className="scene">
      <Image src="/GTA_6_Release.jpg" alt="" fill priority sizes="100vw" className="scene-photo" />
      <div className="scene-tint" />
      <div className="scene-vignette" />
    </div>
  );
}
