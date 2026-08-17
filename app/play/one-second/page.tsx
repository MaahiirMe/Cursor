import { RunGame } from "@/components/game/RunGame";

export default function OneSecondPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <RunGame mode="one-second" eyebrow="EGO CHECK." headline="1 SEC. BASS." />
    </div>
  );
}
