import { useState, type KeyboardEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Heart } from "@/shared/icons";
import { t } from "@/shared/i18n";
import { log } from "@/shared/lib/log";
import { IconButton, Input, useToast } from "@/shared/ui";
import { GRATITUDE_TEXT_MAX, type GratitudeEntry } from "../model";
import { createEntry, deleteEntry, updateEntryText } from "../repository";

/** One thing to be grateful for, editable in place and deletable (with undo). */
export function GratitudeItem({ entry }: { entry: GratitudeEntry }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<string | null>(null);

  const save = async () => {
    if (draft === null) return;
    const text = draft.trim();
    setDraft(null);
    if (!text || text === entry.text) return;
    try {
      await updateEntryText(entry.id, text);
    } catch (error) {
      log.error("gratitude: update failed", error);
      toast({ title: t("gratitude.toast.saveError"), variant: "danger" });
    }
  };

  const remove = async () => {
    try {
      await deleteEntry(entry.id);
      toast({
        title: t("gratitude.toast.deleted"),
        action: {
          label: t("gratitude.toast.undo"),
          onClick: () => void createEntry({ date: entry.date, text: entry.text }),
        },
      });
    } catch (error) {
      log.error("gratitude: delete failed", error);
      toast({ title: t("gratitude.toast.deleteError"), variant: "danger" });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void save();
    } else if (event.key === "Escape") {
      // Keep the global Escape handler from closing anything else.
      event.stopPropagation();
      setDraft(null);
    }
  };

  if (draft !== null) {
    return (
      <li className="flex items-center gap-2">
        <Input
          autoFocus
          size="sm"
          value={draft}
          maxLength={GRATITUDE_TEXT_MAX}
          aria-label={t("gratitude.item.editLabel")}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => void save()}
          className="flex-1"
        />
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-hover">
      <Heart size={14} filled className="mt-1 shrink-0 text-accent" />
      <span className="flex-1 text-sm break-words text-text">{entry.text}</span>
      <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity duration-(--dur-fast) group-focus-within:opacity-100 group-hover:opacity-100">
        <IconButton size="sm" label={t("gratitude.item.edit")} onClick={() => setDraft(entry.text)}>
          <Pencil strokeWidth={1.75} />
        </IconButton>
        <IconButton size="sm" label={t("gratitude.item.delete")} onClick={() => void remove()}>
          <Trash2 strokeWidth={1.75} />
        </IconButton>
      </span>
    </li>
  );
}
