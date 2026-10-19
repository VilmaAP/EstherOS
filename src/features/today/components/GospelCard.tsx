import { useNavigate } from "react-router";
import { BookOpenText } from "lucide-react";
import { t } from "@/shared/i18n";
import type { DateISO } from "@/shared/lib/dates";
import { Button } from "@/shared/ui";
import {
  ReadToggle,
  chapterLabel,
  positionLabel,
  useChapterText,
  useTodayGospel,
  type ChapterRef,
} from "@/features/gospel";
import { CardError, CardLoading, TodayCard } from "./TodayCard";

function FirstVerse({ chapter }: { chapter: ChapterRef }) {
  const { verses } = useChapterText(chapter);
  const first = verses[0];
  return first ? (
    <p className="line-clamp-3 font-display text-md text-text-muted italic">«{first}»</p>
  ) : null;
}

/** "Evangelio del día": today's chapter, its first verse and the "Lo leí" checkbox. */
export function GospelCard({ today }: { today: DateISO }) {
  const navigate = useNavigate();
  const { data: gospel, loading, error } = useTodayGospel(today);

  return (
    <TodayCard
      title={t("today.gospel.title")}
      icon={<BookOpenText />}
      footer={
        <>
          {loading || error ? (
            <span className="flex-1" />
          ) : (
            <ReadToggle today={today} gospel={gospel} className="flex-1" />
          )}
          <Button size="sm" variant="ghost" onClick={() => navigate("/gospel")}>
            {t("today.gospel.open")}
          </Button>
        </>
      }
    >
      {error ? (
        <CardError message={t("gospel.loadError")} />
      ) : loading ? (
        <CardLoading rows={1} />
      ) : (
        <button
          type="button"
          onClick={() => navigate("/gospel")}
          className="flex flex-col gap-1.5 rounded-md p-2 text-left hover:bg-surface-hover"
        >
          <span className="flex items-baseline gap-2">
            <span className="flex-1 font-display text-lg font-semibold text-text">
              {chapterLabel(gospel.ref)}
            </span>
            <span className="text-xs text-text-muted">{positionLabel(gospel.position)}</span>
          </span>
          <FirstVerse chapter={gospel.ref} />
        </button>
      )}
    </TodayCard>
  );
}
