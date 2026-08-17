import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="display text-5xl">GALAT BOOTH.</h1>
      <p className="mt-4 text-sm text-mute">Ye page scene mein nahi hai.</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center bg-acid px-5 text-[12px] tracking-[0.16em] text-bg">
        DAILY BEAT
      </Link>
    </div>
  );
}
