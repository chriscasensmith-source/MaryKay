import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import { errorMessage, SIGNUP_ERRORS } from "@/lib/errors";
import { LANGUAGE_BADGE } from "@/lib/language";
import { signUp } from "@/app/actions";
import SubmitButton from "@/components/submit-button";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-xl border border-accent-200 px-4 py-3 text-base text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100";

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ error?: string; name?: string; email?: string }>;
}) {
  const { slotId } = await params;
  const query = await searchParams;
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { _count: { select: { signups: true } } },
  });

  if (!slot || slot.status !== "ACTIVE") notFound();

  const remaining = Math.max(0, slot.capacity - slot._count.signups);
  const isFull = remaining === 0;
  const error = errorMessage(SIGNUP_ERRORS, query.error);
  const badge = LANGUAGE_BADGE[slot.language];

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/" className="text-sm font-medium text-accent-600">
        &larr; All tours
      </Link>

      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        {badge && (
          <span className="mb-2 inline-block rounded-full bg-gold-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-white shadow-sm">
            {badge}
          </span>
        )}
        <h1 className="text-2xl font-bold text-ink">{slot.title}</h1>
        <p className="mt-2 font-medium text-accent-600">{formatDate(slot.startsAt)}</p>
        <p className="text-gray-500">{formatTime(slot.startsAt)}</p>
        {slot.expectedGuests > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Group size: ~{slot.expectedGuests} guests
          </p>
        )}
        {slot.notes && <p className="mt-3 text-gray-600">{slot.notes}</p>}
        <p className="mt-3 text-sm text-gray-400">
          {remaining} spot{remaining === 1 ? "" : "s"} left
        </p>
      </div>

      {isFull ? (
        <div className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-ink">This tour is full.</p>
          <Link href="/" className="mt-2 inline-block font-medium text-accent-600">
            See other tours
          </Link>
        </div>
      ) : (
        <form
          action={signUp.bind(null, slot.id)}
          className="mt-6 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-ink">Sign me up</h2>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-ink">Your name</span>
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              defaultValue={query.name}
              className={inputClass}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-ink">Your email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              defaultValue={query.email}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-gray-400">
              We&apos;ll send your confirmation and a reminder here.
            </span>
          </label>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <SubmitButton
            pendingLabel="Signing you up…"
            className="mt-5 w-full rounded-xl bg-accent-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-accent-700 active:scale-[0.98] disabled:opacity-50"
          >
            Confirm signup
          </SubmitButton>
        </form>
      )}
    </main>
  );
}
