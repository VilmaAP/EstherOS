import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { t } from "@/shared/i18n";
import type { DateISO } from "@/shared/lib/dates";
import { log } from "@/shared/lib/log";
import { Button, Input, useToast } from "@/shared/ui";
import { DAILY_GOAL, GRATITUDE_TEXT_MAX } from "../model";
import { createEntry } from "../repository";

interface GratitudeComposerProps {
  date: DateISO;
  /** Entries the day already has; picks the placeholder. */
  count: number;
  /** Each change focuses the field. */
  focusSignal?: number;
}

function placeholder(count: number): string {
  if (count === 0) return t("gratitude.composer.first");
  if (count < DAILY_GOAL) return t("gratitude.composer.next");
  return t("gratitude.composer.more");
}

/** One-line field that adds a thing to be grateful for on `date` when Enter is pressed. */
export function GratitudeComposer({ date, count, focusSignal = 0 }: GratitudeComposerProps) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await createEntry({ date, text });
      setText("");
    } catch (error) {
      log.error("gratitude: create failed", error);
      toast({ title: t("gratitude.toast.saveError"), variant: "danger" });
    } finally {
      setSaving(false);
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder(count)}
        aria-label={t("gratitude.composer.label")}
        maxLength={GRATITUDE_TEXT_MAX}
        className="flex-1"
      />
      <Button type="submit" size="sm" variant="soft" disabled={!text.trim() || saving}>
        <Plus />
        {t("gratitude.composer.add")}
      </Button>
    </form>
  );
}
