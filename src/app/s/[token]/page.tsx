import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
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
              <h1 className="text-2xl font-bold text-gray-900">Signup cancelled</h1>
              <p className="mt-2 text-gray-500">
                Thanks for letting us know — your spot is open for someone else.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Link no longer valid</h1>
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

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {query.new ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">You&apos;re signed up! 🎉</h1>
            <p className="mt-2 text-gray-500">
              A confirmation email is on its way to <strong>{signup.email}</strong>. It
              includes this page&apos;s link in case you need to cancel later.
            </p>
          </>
        ) : (
          <h1 className="text-2xl font-bold text-gray-900">Your signup</h1>
        )}

        <div className="mt-5 rounded-xl bg-accent-50 p-4">
          <p className="font-semibold text-gray-900">{slot.title}</p>
          <p className="mt-1 font-medium text-accent-600">{formatDate(slot.startsAt)}</p>
          <p className="text-gray-500">{formatTime(slot.startsAt)}</p>
          {slot.notes && <p className="mt-2 text-sm text-gray-500">{slot.notes}</p>}
        </div>

        {slotCancelled ? (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            This tour has been cancelled by the organizer.
          </p>
        ) : (
          <form action={cancelSignup.bind(null, token)} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-base font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
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
