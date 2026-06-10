import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import CopyLinkButton from "./copy-link-button";
import ConfirmButton from "./confirm-button";
import SubmitButton from "@/components/submit-button";
import { cancelSlot, removeSignup, logout, login } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <form action={login} className="mx-auto mt-10 max-w-sm rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Organizer sign-in</h1>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">Passcode</span>
            <input
              type="password"
              name="passcode"
              required
              autoFocus
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
            />
          </label>
          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error === "config"
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
          <h1 className="text-2xl font-bold text-gray-900">Tour Admin</h1>
          <p className="text-sm text-gray-500">Manage slots and signups</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyLinkButton />
          <form action={logout}>
            <button className="rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <Link
        href="/admin/new"
        className="block w-full rounded-2xl bg-accent-600 px-4 py-4 text-center text-base font-semibold text-white transition hover:bg-accent-700 active:scale-[0.99]"
      >
        + New tour slot
      </Link>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Upcoming</h2>
      {upcoming.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          No upcoming slots yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {upcoming.map((slot) => (
            <SlotCard key={slot.id} slot={slot} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-lg font-semibold text-gray-900">
            Past tours ({past.length})
          </summary>
          <ul className="mt-3 space-y-4">
            {past.map((slot) => (
              <SlotCard key={slot.id} slot={slot} isPast />
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}

type SlotWithSignups = {
  id: string;
  title: string;
  notes: string | null;
  startsAt: Date;
  capacity: number;
  status: string;
  signups: { id: string; name: string; email: string }[];
};

function SlotCard({ slot, isPast = false }: { slot: SlotWithSignups; isPast?: boolean }) {
  const cancelled = slot.status === "CANCELLED";

  return (
    <li className={`rounded-2xl bg-white p-5 shadow-sm ${cancelled ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {slot.title}
            {cancelled && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                Cancelled
              </span>
            )}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{formatDateTime(slot.startsAt)}</p>
          {slot.notes && <p className="mt-1 text-sm text-gray-400">{slot.notes}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-accent-100 px-3 py-1 text-sm font-semibold text-accent-700">
          {slot.signups.length}/{slot.capacity}
        </span>
      </div>

      <div className="mt-3">
        {slot.signups.length === 0 ? (
          <p className="text-sm text-gray-400">No signups yet</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl bg-gray-50 px-4">
            {slot.signups.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="truncate text-xs text-gray-500">{s.email}</p>
                </div>
                <ConfirmButton
                  action={removeSignup.bind(null, s.id)}
                  confirmMessage={`Remove ${s.name} from "${slot.title}"? They will NOT be emailed automatically.`}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                >
                  Remove
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isPast && !cancelled && (
        <div className="mt-4 flex gap-2">
          <Link
            href={`/admin/slots/${slot.id}`}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <ConfirmButton
            action={cancelSlot.bind(null, slot.id)}
            confirmMessage={`Cancel "${slot.title}"? Everyone signed up (${slot.signups.length}) will be emailed that it's cancelled.`}
            className="flex-1 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Cancel tour
          </ConfirmButton>
        </div>
      )}
    </li>
  );
}
