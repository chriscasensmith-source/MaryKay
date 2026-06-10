import { saveSlot } from "./actions";
import { errorMessage, SLOT_ERRORS } from "@/lib/errors";
import SubmitButton from "@/components/submit-button";

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200";

export default function SlotForm({
  slotId,
  defaults,
  error,
}: {
  slotId?: string;
  defaults?: { title?: string; notes?: string; date?: string; time?: string; capacity?: string };
  error?: string;
}) {
  const message = errorMessage(SLOT_ERRORS, error);

  return (
    <form action={saveSlot.bind(null, slotId ?? null)} className="rounded-2xl bg-white p-6 shadow-sm">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Tour title</span>
        <input
          type="text"
          name="title"
          required
          defaultValue={defaults?.title}
          placeholder="Morning Facility Tour"
          className={inputClass}
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Date</span>
          <input type="date" name="date" required defaultValue={defaults?.date} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Time</span>
          <input type="time" name="time" required defaultValue={defaults?.time} className={inputClass} />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-gray-700">Volunteers needed</span>
        <input
          type="number"
          name="capacity"
          required
          min={1}
          defaultValue={defaults?.capacity ?? "4"}
          className={inputClass}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-gray-700">Notes (optional)</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults?.notes}
          placeholder="Meet at the main lobby 10 minutes early."
          className={inputClass}
        />
      </label>

      {message && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      <SubmitButton
        pendingLabel="Saving…"
        className="mt-5 w-full rounded-xl bg-accent-600 px-4 py-3 font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
      >
        {slotId ? "Save changes" : "Create tour slot"}
      </SubmitButton>
    </form>
  );
}
