import { useState } from "react";
import { HandHeart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Heart, RibbonDivider } from "@/shared/icons";
import { t } from "@/shared/i18n";
import { parseDateISO, type DateISO } from "@/shared/lib/dates";
import { useCurrentDay } from "@/shared/lib";
import { Button, Card, EmptyState, Skeleton } from "@/shared/ui";
import { useGratitudeForDate, useGratitudeStreak, useRecentGratitude } from "../hooks";
import { DAILY_GOAL, groupByDay, streakText } from "../model";
import { GratitudeComposer } from "./GratitudeComposer";
import { GratitudeItem } from "./GratitudeItem";

const HISTORY_PAGE_DAYS = 30;

function dayLabel(date: DateISO): string {
  const text = format(parseDateISO(date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  return text.charAt(0).toLocaleUpperCase("es") + text.slice(1);
}

function TodaySection({ today }: { today: DateISO }) {
  const { data: entries, loading, error } = useGratitudeForDate(today);
  const streak = useGratitudeStreak(today);

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <h2 className="flex-1 font-display text-xl font-semibold">{t("gratitude.today.title")}</h2>
        <span className="text-sm text-text-muted">
          {t("gratitude.today.progress", {
            count: Math.min(entries.length, DAILY_GOAL),
            goal: DAILY_GOAL,
          })}
        </span>
      </header>
      {error ? (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {t("gratitude.loadError")}
        </p>
      ) : loading ? (
        <Skeleton className="h-[40px]! rounded-md!" />
      ) : entries.length > 0 ? (
        <ul aria-label={t("gratitude.today.title")} className="flex flex-col gap-0.5">
          {entries.map((entry) => (
            <GratitudeItem key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">{t("gratitude.today.hint")}</p>
      )}
      <GratitudeComposer date={today} count={entries.length} />
      <p className="flex items-center gap-1.5 text-xs text-text-muted">
        <Heart size={12} filled={streak.days > 0} className="text-accent" />
        {streakText(streak.days)}
      </p>
    </Card>
  );
}

function HistorySection({ today }: { today: DateISO }) {
  const [days, setDays] = useState(HISTORY_PAGE_DAYS);
  // One extra day because today may be among the loaded ones.
  const { data, loading } = useRecentGratitude(days + 1);
  const groups = groupByDay(data).filter((group) => group.date !== today);
  const hasMore = groupByDay(data).length > days;

  return (
    <section aria-labelledby="gratitude-history" className="flex flex-col gap-4">
      <h2 id="gratitude-history" className="font-display text-xl font-semibold">
        {t("gratitude.history.title")}
      </h2>
      {groups.length === 0 && !loading ? (
        <EmptyState
          size="sm"
          icon={<HandHeart className="size-[22px]" />}
          title={t("gratitude.history.emptyTitle")}
          description={t("gratitude.history.emptyHint")}
        />
      ) : (
        <ol className="flex flex-col gap-4">
          {groups.slice(0, days).map((group) => (
            <li key={group.date}>
              <Card padding="md" className="flex flex-col gap-2">
                <h3 className="font-display text-md font-semibold text-text-muted">
                  {dayLabel(group.date)}
                </h3>
                <ul className="flex flex-col gap-0.5">
                  {group.entries.map((entry) => (
                    <GratitudeItem key={entry.id} entry={entry} />
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ol>
      )}
      {hasMore ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-center"
          onClick={() => setDays((n) => n + HISTORY_PAGE_DAYS)}
        >
          {t("gratitude.history.more")}
        </Button>
      ) : null}
    </section>
  );
}

/** Gratitude screen (route `/gratitude`): today's list and the days before. */
export function GratitudePage() {
  const today = useCurrentDay();
  return (
    <section
      aria-label={t("gratitude.label")}
      className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-8 py-7"
    >
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold text-text">{t("gratitude.title")}</h1>
        <p className="font-display text-lg text-text-muted">{t("gratitude.subtitle")}</p>
      </header>
      <TodaySection today={today} />
      <RibbonDivider size={18} className="text-border" />
      <HistorySection today={today} />
    </section>
  );
}
