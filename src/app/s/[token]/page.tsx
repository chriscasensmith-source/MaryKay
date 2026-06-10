import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCardDateTime } from "@/lib/format";
import { LANGUAGE_BADGE, LANGUAGE_LABEL } from "@/lib/language";
import { emailEnabled } from "@/lib/email";
import { cancelSignup } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ManageSignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string; cancelled?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;

  const signup = await prisma.signup.findUnique({
    where: { cancelToken: token },
    include: { slot: true },
  });

  if (!signup) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          {query.cancelled ? (
            <>
              <h1 className="text-2xl font-bold text-ink">Signup cancelled</h1>
              <p className="mt-2 text-gray-500">
                Thanks for letting us know — your spot is open for someone else.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-ink">Link no longer valid</h1>
              <p className="mt-2 text-gray-500">
                This signup may have already been cancelled.
              </p>
            </>
          )}
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-accent-600 px-6 py-3 font-semibold text-white"
          >
            See upcoming tours
          </Link>
        </div>
      </main>
    );
  }

  const { slot } = signup;
  const slotCancelled = slot.status === "CANCELLED";
  const badge = LANGUAGE_BADGE[slot.language];

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {query.new ? (
          <>
            <h1 className="text-2xl font-bold text-ink">You&apos;re signed up! 🎉</h1>
            {emailEnabled() ? (
              <p className="mt-2 text-gray-500">
                A confirmation email is on its way to <strong>{signup.email}</strong>. It
                includes this page&apos;s link in case you need to cancel later.
              </p>
            ) : (
              <p className="mt-2 text-gray-500">
                You&apos;re on the list as <strong>{signup.email}</strong>. Want to cancel
                later? Just come back to the tours page and tap{" "}
                <strong>&ldquo;Can&apos;t make it?&rdquo;</strong> on this tour.
              </p>
            )}
          </>
        ) : (
          <h1 className="text-2xl font-bold text-ink">Your signup</h1>
        )}

        <div className="mt-5 rounded-xl bg-accent-100 p-4">
          {badge && (
            <span className="mb-2 inline-block rounded-full bg-gold-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-white shadow-sm">
              {badge}
            </span>
          )}
          <p className="font-semibold text-ink">{slot.title}</p>
          <p className="mt-1 font-medium text-accent-600">{formatCardDateTime(slot.startsAt)}</p>
          <p className="mt-1 text-sm text-gray-500">Language: {LANGUAGE_LABEL[slot.language]}</p>
          {slot.expectedGuests > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Group size: ~{slot.expectedGuests} guests
            </p>
          )}
          {slot.notes && <p className="mt-2 text-sm text-gray-500">{slot.notes}</p>}
        </div>

        {!slotCancelled && (
          <div className="mt-5">
            <a
              href={`/calendar/${slot.id}`}
              download
              className="block w-full rounded-xl bg-accent-600 px-4 py-4 text-center text-base font-semibold text-white transition hover:bg-accent-700 active:scale-[0.98]"
            >
              📅 Add to calendar
            </a>
            <p className="mt-1.5 text-center text-xs text-gray-400">
              Works with Outlook, Google, and Apple Calendar. Includes a reminder 1 hour
              before the tour.
            </p>
          </div>
        )}

        {slotCancelled ? (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            This tour has been cancelled by the organizer.
          </p>
        ) : (
          <form action={cancelSignup.bind(null, token)} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-xl border-2 border-accent-100 px-4 py-4 text-base font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
            >
              Cancel my signup
            </button>
          </form>
        )}

        <Link href="/" className="mt-5 block text-center font-medium text-accent-600">
          See all upcoming tours
        </Link>
      </div>
    </main>
  );
}
