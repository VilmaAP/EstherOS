import { useId, useState } from "react";
import { t } from "@/shared/i18n";
import type { DateISO } from "@/shared/lib/dates";
import { log } from "@/shared/lib/log";
import { Checkbox, cn, useToast } from "@/shared/ui";
import type { TodayGospel } from "../model";
import { markRead, unmarkReading } from "../repository";

interface ReadToggleProps {
  today: DateISO;
  gospel: TodayGospel;
  className?: string;
}

/** "Lo leí" checkbox: marks today's chapter as read, or takes the mark back. */
export function ReadToggle({ today, gospel, className }: ReadToggleProps) {
  const id = useId();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const read = gospel.reading !== null;

  const toggle = async (checked: boolean) => {
    setBusy(true);
    try {
      if (checked) await markRead(today, gospel.ref);
      else if (gospel.reading) await unmarkReading(gospel.reading.id);
    } catch (error) {
      log.error("gospel: toggle failed", error);
      toast({ title: t("gospel.toast.saveError"), variant: "danger" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Checkbox
        id={id}
        checked={read}
        disabled={busy}
        onCheckedChange={(checked) => void toggle(checked)}
      />
      <label
        htmlFor={id}
        className={cn("cursor-pointer text-sm font-semibold", read ? "text-accent" : "text-text")}
      >
        {read ? t("gospel.readToday") : t("gospel.markRead")}
      </label>
    </div>
  );
}
