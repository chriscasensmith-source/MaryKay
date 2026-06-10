import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { toInputValues } from "@/lib/format";
import SlotForm from "../../slot-form";

export const dynamic = "force-dynamic";

type SlotQuery = {
  error?: string;
  title?: string;
  notes?: string;
  date?: string;
  time?: string;
  capacity?: string;
};

export default async function EditSlotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SlotQuery>;
}) {
  if (!(await isAdmin())) redirect("/admin");

  const { id } = await params;
  const query = await searchParams;
  const slot = await prisma.slot.findUnique({ where: { id } });
  if (!slot) notFound();

  const { date, time } = toInputValues(slot.startsAt);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/admin" className="text-sm font-medium text-accent-600">
        &larr; Back to admin
      </Link>
      <h1 className="mb-4 mt-3 text-2xl font-bold text-gray-900">Edit tour slot</h1>
      <SlotForm
        slotId={slot.id}
        error={query.error}
        defaults={{
          title: query.title ?? slot.title,
          notes: query.notes ?? slot.notes ?? "",
          date: query.date ?? date,
          time: query.time ?? time,
          capacity: query.capacity ?? String(slot.capacity),
        }}
      />
    </main>
  );
}
