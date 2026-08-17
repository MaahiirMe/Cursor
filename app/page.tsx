import { DailyGame } from "@/components/game/DailyGame";
import { HomeRail } from "@/components/game/HomeRail";

export default function HomePage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-10">
      <DailyGame />
      <HomeRail />
    </div>
  );
}
