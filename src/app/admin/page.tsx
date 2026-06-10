import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { formatDateTime, toInputValues } from "@/lib/format";
import { LANGUAGE_BADGE } from "@/lib/language";
import type { Slot, Signup } from "@prisma/client";
import CopyLinkButton from "./copy-link-button";
import ConfirmButton from "./confirm-button";
import SubmitButton from "@/components/submit-button";
import SlotForm, { type SlotFormDefaults } from "./slot-form";
import { cancelSlot, removeSignup, logout, login } from "./actions";

export const dynamic = "force-dynamic";

type AdminQuery = SlotFormDefaults & { error?: string; form?: string };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminQuery>;
}) {
  const query = await searchParams;

  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <form action={login} className="mx-auto mt-10 max-w-sm rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-ink">Organizer sign-in</h1>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-ink">Passcode</span>
            <input
              type="password"
              name="passcode"
              required
              autoFocus
              className="mt-1 w-full rounded-xl border border-accent-200 px-4 py-3 text-base text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </label>
          {query.error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {query.error === "config"
                ? "ADMIN_PASSCODE is not configured on the server."
                : "Wrong passcode."}
            </p>
          )}
          <SubmitButton
            pendingLabel="Checking…"
            className="mt-4 w-full rounded-xl bg-accent-600 px-4 py-3 font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
          >
            Enter
          </SubmitButton>
        </form>
      </main>
    );
  }

  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.slot.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { signups: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.slot.findMany({
      where: { startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: 20,
      include: { signups: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tour Admin</h1>
          <p className="text-sm text-gray-500">Manage slots and signups</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyLinkButton />
          <form action={logout}>
            <button className="rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-accent-50">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <details
        id="form-new"
        open={query.form === "new"}
        className="group rounded-2xl bg-white p-5 shadow-sm"
      >
        <summary className="cursor-pointer list-none rounded-xl bg-accent-600 px-4 py-3.5 text-center text-base font-semibold text-white transition hover:bg-accent-700 group-open:bg-accent-50 group-open:text-accent-700">
          + New tour slot
        </summary>
        <SlotForm defaults={query.form === "new" ? query : undefined} error={query.form === "new" ? query.error : undefined} />
      </details>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-ink">Upcoming</h2>
      {upcoming.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          No upcoming slots yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {upcoming.map((slot) => (
            <SlotCard key={slot.id} slot={slot} query={query} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-lg font-semibold text-ink">
            Past tours ({past.length})
          </summary>
          <ul className="mt-3 space-y-4">
            {past.map((slot) => (
              <SlotCard key={slot.id} slot={slot} query={query} isPast />
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}

function SlotCard({
  slot,
  query,
  isPast = false,
}: {
  slot: Slot & { signups: Signup[] };
  query: AdminQuery;
  isPast?: boolean;
}) {
  const cancelled = slot.status === "CANCELLED";
  const badge = LANGUAGE_BADGE[slot.language];
  const { date, time } = toInputValues(slot.startsAt);
  const isEditing = query.form === slot.id;
  const defaults: SlotFormDefaults = isEditing
    ? query
    : {
        title: slot.title,
        notes: slot.notes ?? "",
        date,
        time,
        language: slot.language,
        capacity: String(slot.capacity),
        expectedGuests: String(slot.expectedGuests),
      };

  return (
    <li
      id={`form-${slot.id}`}
      className={`rounded-2xl bg-white p-5 shadow-sm ${cancelled ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">
            {slot.title}
            {badge && (
              <span className="ml-2 inline-block rounded-full bg-gold-500 px-2.5 py-0.5 align-middle text-xs font-bold uppercase tracking-wide text-white">
                {badge}
              </span>
            )}
            {cancelled && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                Cancelled
              </span>
            )}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{formatDateTime(slot.startsAt)}</p>
          <p className="mt-0.5 text-sm text-gray-400">
            ~{slot.expectedGuests} people attending
          </p>
          {slot.notes && <p className="mt-1 text-sm text-gray-400">{slot.notes}</p>}
        </div>
        <span
          className="shrink-0 rounded-full bg-accent-100 px-3 py-1 text-sm font-semibold text-accent-700"
          title="Guides signed up / guides needed"
        >
          {slot.signups.length}/{slot.capacity} guides
        </span>
      </div>

      <div className="mt-3">
        {slot.signups.length === 0 ? (
          <p className="text-sm text-gray-400">No signups yet</p>
        ) : (
          <ul className="divide-y divide-accent-50 rounded-xl bg-accent-50/60 px-4">
            {slot.signups.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                  <p className="truncate text-xs text-gray-500">{s.email}</p>
                </div>
                {!cancelled && (
                  <ConfirmButton
                    action={removeSignup.bind(null, s.id)}
                    confirmMessage={`Remove ${s.name} from "${slot.title}"? They will NOT be emailed automatically.`}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                  >
                    Remove
                  </ConfirmButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isPast && !cancelled && (
        <div className="mt-4">
          <details open={isEditing} className="group">
            <summary className="cursor-pointer list-none rounded-xl border border-accent-200 px-4 py-2.5 text-center text-sm font-semibold text-accent-700 transition hover:bg-accent-50 group-open:rounded-b-none group-open:bg-accent-50">
              Edit slot
            </summary>
            <div className="rounded-b-xl border border-t-0 border-accent-200 px-4 pb-4">
              <SlotForm
                slotId={slot.id}
                defaults={defaults}
                error={isEditing ? query.error : undefined}
              />
              <p className="mt-2 text-xs text-gray-400">
                Changing the date or time emails everyone who&apos;s signed up.
              </p>
            </div>
          </details>
          <ConfirmButton
            action={cancelSlot.bind(null, slot.id)}
            confirmMessage={`Cancel "${slot.title}"? Everyone signed up (${slot.signups.length}) will be emailed that it's cancelled.`}
            className="mt-2 w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Cancel tour
          </ConfirmButton>
        </div>
      )}
    </li>
  );
}
