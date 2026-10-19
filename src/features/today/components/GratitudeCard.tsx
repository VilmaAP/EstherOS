import { useNavigate } from "react-router";
import { HandHeart } from "lucide-react";
import { Heart } from "@/shared/icons";
import { t } from "@/shared/i18n";
import type { DateISO } from "@/shared/lib/dates";
import { Button } from "@/shared/ui";
import {
  GratitudeComposer,
  GratitudeItem,
  streakText,
  useGratitudeForDate,
  useGratitudeStreak,
} from "@/features/gratitude";
import { CardError, CardLoading, TodayCard } from "./TodayCard";

/** "Doy gracias por…": today's list with a quick field to add one more. */
export function GratitudeCard({ today }: { today: DateISO }) {
  const navigate = useNavigate();
  const { data: entries, loading, error } = useGratitudeForDate(today);
  const streak = useGratitudeStreak(today);

  return (
    <TodayCard
      title={t("today.gratitude.title")}
      icon={<HandHeart />}
      footer={
        <>
          <span className="flex flex-1 items-center gap-1.5 text-xs text-text-muted">
            <Heart size={12} filled={streak.days > 0} className="text-accent" />
            {streakText(streak.days)}
          </span>
          <Button size="sm" variant="ghost" onClick={() => navigate("/gratitude")}>
            {t("today.gratitude.open")}
          </Button>
        </>
      }
    >
      {error ? (
        <CardError message={t("gratitude.loadError")} />
      ) : loading ? (
        <CardLoading rows={1} />
      ) : entries.length > 0 ? (
        <ul aria-label={t("today.gratitude.title")} className="flex flex-col gap-0.5">
          {entries.map((entry) => (
            <GratitudeItem key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">{t("gratitude.today.hint")}</p>
      )}
      <GratitudeComposer date={today} count={entries.length} />
    </TodayCard>
  );
}
