import { saveSlot } from "./actions";
import { errorMessage, SLOT_ERRORS } from "@/lib/errors";
import { LANGUAGES, LANGUAGE_LABEL } from "@/lib/language";
import SubmitButton from "@/components/submit-button";

const inputClass =
  "mt-1 w-full rounded-xl border border-accent-200 bg-white px-4 py-3 text-base text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100";

export type SlotFormDefaults = {
  title?: string;
  notes?: string;
  date?: string;
  time?: string;
  language?: string;
  capacity?: string;
  expectedGuests?: string;
};

export default function SlotForm({
  slotId,
  defaults,
  error,
}: {
  slotId?: string;
  defaults?: SlotFormDefaults;
  error?: string;
}) {
  const message = errorMessage(SLOT_ERRORS, error);

  return (
    <form action={saveSlot.bind(null, slotId ?? null)} className="mt-3">
      <label className="block">
        <span className="text-sm font-medium text-ink">Tour title</span>
        <input
          type="text"
          name="title"
          required
          defaultValue={defaults?.title}
          placeholder="Morning Facility Tour"
          className={inputClass}
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-ink">Date</span>
          <input type="date" name="date" required defaultValue={defaults?.date} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Time</span>
          <input type="time" name="time" required defaultValue={defaults?.time} className={inputClass} />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-sm font-medium text-ink">Language</span>
        <select
          name="language"
          defaultValue={defaults?.language ?? "ENGLISH"}
          className={inputClass}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABEL[lang]}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-ink">Guides needed</span>
          <input
            type="number"
            name="capacity"
            required
            min={1}
            defaultValue={defaults?.capacity ?? "4"}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">People attending</span>
          <input
            type="number"
            name="expectedGuests"
            min={0}
            defaultValue={defaults?.expectedGuests ?? "0"}
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-sm font-medium text-ink">Notes (optional)</span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={defaults?.notes}
          placeholder="Meet at the main lobby 10 minutes early."
          className={inputClass}
        />
      </label>

      {message && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      <SubmitButton
        pendingLabel="Saving…"
        className="mt-4 w-full rounded-xl bg-accent-600 px-4 py-3 font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50"
      >
        {slotId ? "Save changes" : "Create tour slot"}
      </SubmitButton>
    </form>
  );
}
