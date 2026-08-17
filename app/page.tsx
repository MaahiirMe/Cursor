import { DailyGame } from "@/components/game/DailyGame";
import { HomeRail } from "@/components/game/HomeRail";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <DailyGame />
      <HomeRail />
    </div>
  );
}
