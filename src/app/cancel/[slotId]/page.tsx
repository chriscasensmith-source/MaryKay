import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCardDateTime, formatDate } from "@/lib/format";
import { errorMessage, CANCEL_ERRORS } from "@/lib/errors";
import { LANGUAGE_BADGE } from "@/lib/language";
import { cancelByEmail } from "@/app/actions";
import SubmitButton from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function CancelBySlotPage({
  params,
  searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ error?: string; email?: string; done?: string }>;
}) {
  const { slotId } = await params;
  const query = await searchParams;

  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) notFound();

  const badge = LANGUAGE_BADGE[slot.language];
  const error = errorMessage(CANCEL_ERRORS, query.error);

  if (query.done) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-ink">You&apos;re off the list ✅</h1>
          <p className="mt-3 text-gray-500">
            Your signup for <strong className="text-ink">{slot.title}</strong> on{" "}
            {formatDate(slot.startsAt)} has been cancelled. Thanks for letting us know —
            your spot is open for someone else.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-accent-600 px-6 py-3 font-semibold text-white transition hover:bg-accent-700"
          >
            See upcoming tours
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/" className="text-sm font-medium text-accent-600">
        &larr; All tours
      </Link>

      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Can&apos;t make it?</h1>
        <p className="mt-2 text-gray-500">No problem — it happens! This will take you off the list for:</p>

        <div className="mt-4 rounded-xl bg-accent-100 p-4">
          {badge && (
            <span className="mb-2 inline-block rounded-full bg-gold-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-white shadow-sm">
              {badge}
            </span>
          )}
          <p className="font-semibold text-ink">{slot.title}</p>
          <p className="mt-1 font-medium text-accent-600">{formatCardDateTime(slot.startsAt)}</p>
        </div>

        <form action={cancelByEmail.bind(null, slot.id)} className="mt-5">
          <label className="block">
            <span className="text-sm font-medium text-ink">
              The email you signed up with
            </span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              defaultValue={query.email}
              className="mt-1 w-full rounded-xl border border-accent-200 px-4 py-3 text-base text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </label>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <SubmitButton
            pendingLabel="One moment…"
            className="mt-5 w-full rounded-xl bg-accent-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-accent-700 active:scale-[0.98] disabled:opacity-50"
          >
            Cancel my signup
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
