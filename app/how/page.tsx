import { EditorialNav } from "@/components/EditorialNav";

export default function HowPage() {
  return (
    <>
      <EditorialNav />
      <main className="px-4 py-16 md:px-10">
        <h1 className="font-serif text-[clamp(4.5rem,18vw,14rem)] leading-[0.78] tracking-[-0.07em]">
          SUN.
          <br />
          SOCH.
          <br />
          BATA.
        </h1>
        <div className="mt-16 max-w-xl space-y-3 text-xl leading-snug">
          <p>5 gaane.</p>
          <p>Har gaane ke 5 chances.</p>
          <p>Jitni jaldi pehchaanoge, utne zyada points.</p>
          <p className="pt-6 text-smoke">
            Aur haan — gaana 00:00 se hi chalega. No famous part cheating.
          </p>
        </div>
      </main>
    </>
  );
}
