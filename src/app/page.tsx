import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCardDateTime } from "@/lib/format";
import { LANGUAGE_BADGE } from "@/lib/language";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const slots = await prisma.slot.findMany({
    where: { status: "ACTIVE", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    include: { signups: { select: { name: true }, orderBy: { createdAt: "asc" } } },
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">
          R3 Tour Team
        </p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Upcoming Tours</h1>
        <p className="mt-2 text-gray-500">Tap a tour to sign up as a guide.</p>
      </header>

      {slots.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-ink">No upcoming tours right now</p>
          <p className="mt-1 text-gray-500">Check back soon — new tours are added regularly.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {slots.map((slot) => {
            const remaining = Math.max(0, slot.capacity - slot.signups.length);
            const isFull = remaining === 0;
            const badge = LANGUAGE_BADGE[slot.language];

            const card = (
              <div className={`p-4 ${isFull ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-snug text-ink">
                      {badge && (
                        <span className="mr-2 inline-block translate-y-[-1px] rounded-full bg-gold-500 px-2.5 py-0.5 align-middle text-xs font-bold uppercase tracking-wide text-white">
                          {badge}
                        </span>
                      )}
                      {slot.title}
                    </h2>
                    <p className="mt-0.5 font-medium text-accent-600">
                      {formatCardDateTime(slot.startsAt)}
                      {slot.expectedGuests > 0 && (
                        <span className="font-normal text-gray-400">
                          {" "}
                          · ~{slot.expectedGuests} guests
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                      isFull ? "bg-gold-500 font-bold text-white" : "bg-accent-100 text-accent-700"
                    }`}
                  >
                    {isFull ? "Full" : `${remaining} spot${remaining === 1 ? "" : "s"} left`}
                  </span>
                </div>

                {slot.notes && <p className="mt-1.5 text-sm text-gray-500">{slot.notes}</p>}

                <p className="mt-1.5 text-sm">
                  {slot.signups.length === 0 ? (
                    <span className="font-medium text-accent-600">Be the first to sign up!</span>
                  ) : (
                    <span className="text-gray-500">
                      <span className="font-medium text-ink">Going:</span>{" "}
                      {slot.signups.map((s) => s.name).join(", ")}
                    </span>
                  )}
                </p>
              </div>
            );

            return (
              <li key={slot.id}>
                <div className="rounded-2xl bg-white shadow-sm transition hover:shadow-md">
                  {isFull ? (
                    card
                  ) : (
                    <Link href={`/signup/${slot.id}`} className="block active:scale-[0.98]">
                      {card}
                    </Link>
                  )}
                  <div className="border-t border-accent-100 px-4 py-2 text-right">
                    <Link
                      href={`/cancel/${slot.id}`}
                      className="text-sm font-medium text-gray-400 transition hover:text-accent-600"
                    >
                      Can&apos;t make it?
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
