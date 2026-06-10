import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const slots = await prisma.slot.findMany({
    where: { status: "ACTIVE", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { signups: true } } },
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">
          R3 Tour Team
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Upcoming Tours</h1>
        <p className="mt-2 text-gray-500">
          Tap a tour to sign up. It takes about 10 seconds.
        </p>
      </header>

      {slots.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-gray-700">No upcoming tours right now</p>
          <p className="mt-1 text-gray-500">Check back soon — new tours are added regularly.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {slots.map((slot) => {
            const remaining = Math.max(0, slot.capacity - slot._count.signups);
            const isFull = remaining === 0;
            const card = (
              <div
                className={`rounded-2xl bg-white p-5 shadow-sm transition ${
                  isFull ? "opacity-60" : "active:scale-[0.98] hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{slot.title}</h2>
                    <p className="mt-1 font-medium text-accent-600">
                      {formatDate(slot.startsAt)}
                    </p>
                    <p className="text-gray-500">{formatTime(slot.startsAt)}</p>
                    {slot.notes && <p className="mt-2 text-sm text-gray-500">{slot.notes}</p>}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                      isFull
                        ? "bg-gray-100 text-gray-500"
                        : "bg-accent-100 text-accent-700"
                    }`}
                  >
                    {isFull ? "Full" : `${remaining} spot${remaining === 1 ? "" : "s"} left`}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  {slot._count.signups} of {slot.capacity} volunteers signed up
                </p>
              </div>
            );

            return (
              <li key={slot.id}>
                {isFull ? card : <Link href={`/signup/${slot.id}`}>{card}</Link>}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
