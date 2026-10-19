import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpenText } from "lucide-react";
import { Heart, RibbonDivider } from "@/shared/icons";
import { t } from "@/shared/i18n";
import { parseDateISO, type DateISO } from "@/shared/lib/dates";
import { useCurrentDay } from "@/shared/lib";
import { Card, EmptyState, Skeleton } from "@/shared/ui";
import {
  useChapterText,
  useGospelStreak,
  useReadingCount,
  useRecentReadings,
  useTodayGospel,
} from "../hooks";
import { chapterLabel, positionLabel, streakText } from "../model";
import type { ChapterRef } from "../plan";
import { ReadToggle } from "./ReadToggle";

const RECENT_LIMIT = 14;

function dayLabel(date: DateISO): string {
  const text = format(parseDateISO(date), "EEEE d 'de' MMMM", { locale: es });
  return text.charAt(0).toLocaleUpperCase("es") + text.slice(1);
}

/** Verses of a chapter as running text with small verse numbers. */
function ChapterVerses({ chapter }: { chapter: ChapterRef }) {
  const { verses, translation, loading, error } = useChapterText(chapter);
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
        {t("gospel.textError")}
      </p>
    );
  }
  if (loading) {
    return (
      <div role="status" aria-label={t("gospel.loading")} className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[20px]! rounded-md!" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-md leading-8 text-text">
        {verses.map((verse, index) => (
          <span key={index}>
            <sup className="mr-0.5 text-xs font-semibold text-accent">{index + 1}</sup>
            {verse}{" "}
          </span>
        ))}
      </p>
      <p className="text-xs text-text-faint">{t("gospel.attribution", { translation })}</p>
    </div>
  );
}

function TodayReading({ today }: { today: DateISO }) {
  const { data: gospel, loading, error } = useTodayGospel(today);
  const streak = useGospelStreak(today);

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
        {t("gospel.loadError")}
      </p>
    );
  }

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <h2 className="flex-1 font-display text-2xl font-semibold">
          {loading ? t("gospel.loading") : chapterLabel(gospel.ref)}
        </h2>
        <span className="text-sm text-text-muted">{positionLabel(gospel.position)}</span>
      </header>
      {loading ? null : <ChapterVerses chapter={gospel.ref} />}
      <footer className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {loading ? null : <ReadToggle today={today} gospel={gospel} className="flex-1" />}
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Heart size={12} filled={streak.days > 0} className="text-accent" />
          {streakText(streak.days)}
        </span>
      </footer>
    </Card>
  );
}

function RecentReadings() {
  const { data: readings, loading } = useRecentReadings(RECENT_LIMIT);
  const total = useReadingCount();

  return (
    <section aria-labelledby="gospel-recent" className="flex flex-col gap-4">
      <header className="flex items-baseline gap-2">
        <h2 id="gospel-recent" className="flex-1 font-display text-xl font-semibold">
          {t("gospel.recent.title")}
        </h2>
        {total > 0 ? (
          <span className="text-sm text-text-muted">
            {t("gospel.recent.total", { count: total })}
          </span>
        ) : null}
      </header>
      {readings.length === 0 && !loading ? (
        <EmptyState
          size="sm"
          icon={<BookOpenText className="size-[22px]" />}
          title={t("gospel.recent.emptyTitle")}
          description={t("gospel.recent.emptyHint")}
        />
      ) : (
        <Card padding="sm">
          <ul className="flex flex-col">
            {readings.map((reading) => (
              <li
                key={reading.id}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-surface-hover"
              >
                <Heart size={12} filled className="shrink-0 text-accent" />
                <span className="flex-1 font-semibold text-text">{chapterLabel(reading)}</span>
                <span className="text-text-muted">{dayLabel(reading.date)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

/** Gospel screen (route `/gospel`): today's chapter to read and the recent readings. */
export function GospelPage() {
  const today = useCurrentDay();
  return (
    <section
      aria-label={t("gospel.label")}
      className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-8 py-7"
    >
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold text-text">{t("gospel.title")}</h1>
        <p className="font-display text-lg text-text-muted">{t("gospel.subtitle")}</p>
      </header>
      <TodayReading today={today} />
      <RibbonDivider size={18} className="text-border" />
      <RecentReadings />
    </section>
  );
}
