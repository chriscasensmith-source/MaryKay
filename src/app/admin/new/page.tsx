import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import SlotForm from "../slot-form";

export const dynamic = "force-dynamic";

type SlotQuery = {
  error?: string;
  title?: string;
  notes?: string;
  date?: string;
  time?: string;
  capacity?: string;
};

export default async function NewSlotPage({
  searchParams,
}: {
  searchParams: Promise<SlotQuery>;
}) {
  if (!(await isAdmin())) redirect("/admin");

  const query = await searchParams;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/admin" className="text-sm font-medium text-accent-600">
        &larr; Back to admin
      </Link>
      <h1 className="mb-4 mt-3 text-2xl font-bold text-gray-900">New tour slot</h1>
      <SlotForm defaults={query} error={query.error} />
    </main>
  );
}
