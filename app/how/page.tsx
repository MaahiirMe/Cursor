import { EditorialNav } from "@/components/EditorialNav";

export default function HowPage() {
  return (
    <>
      <EditorialNav />
      <main className="px-4 py-16 md:px-10">
        <h1 className="font-serif text-[clamp(4.5rem,18vw,14rem)] leading-[0.78] tracking-[-0.07em]">
          SUN.
          <br />
          PEHCHAAN.
          <br />
          LOCK KAR.
        </h1>
        <div className="mt-16 max-w-xl space-y-3 text-xl leading-snug">
          <p>5 gaane. Har gaane ke 5 chances.</p>
          <p>▶ PLAY the intro from 00:00.</p>
          <p>+2 SEC if you need more. HINT if you’re stuck. Both cost points.</p>
          <p>Search the song and artist, then LOCK KAR.</p>
          <p className="pt-6 text-smoke">
            Gaana hamesha 00:00 se. No hook cheating.
          </p>
        </div>
      </main>
    </>
  );
}
