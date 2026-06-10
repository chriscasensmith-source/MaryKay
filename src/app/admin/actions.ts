"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, setAdminCookie, clearAdminCookie } from "@/lib/auth";
import { sendSlotCancelledEmail } from "@/lib/email";

// Like the public actions, these always redirect (never return state) so
// they work identically with and without JavaScript.
export async function login(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  if (!process.env.ADMIN_PASSCODE) {
    redirect("/admin?error=config");
  }
  if (passcode !== process.env.ADMIN_PASSCODE) {
    redirect("/admin?error=passcode");
  }
  await setAdminCookie(passcode);
  redirect("/admin");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/admin");
}

export async function saveSlot(slotId: string | null, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const capacity = Number(formData.get("capacity"));

  const back = (error: string): never => {
    const q = new URLSearchParams({
      error,
      title,
      notes: notes ?? "",
      date,
      time,
      capacity: String(formData.get("capacity") ?? ""),
    });
    redirect(`${slotId ? `/admin/slots/${slotId}` : "/admin/new"}?${q}`);
  };

  if (!title) back("title");
  if (!Number.isInteger(capacity) || capacity < 1) back("capacity");

  // Parsed in the server's local timezone (set TZ env var on Render).
  const startsAt = date && time ? new Date(`${date}T${time}`) : new Date(NaN);
  if (Number.isNaN(startsAt.getTime())) back("datetime");

  if (slotId) {
    await prisma.slot.update({
      where: { id: slotId },
      data: { title, notes, startsAt, capacity },
    });
  } else {
    await prisma.slot.create({ data: { title, notes, startsAt, capacity } });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function cancelSlot(slotId: string) {
  await requireAdmin();

  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { signups: true },
  });

  if (slot && slot.status !== "CANCELLED") {
    await prisma.slot.update({ where: { id: slotId }, data: { status: "CANCELLED" } });

    await Promise.allSettled(
      slot.signups.map((s) => sendSlotCancelledEmail(s.email, s.name, slot))
    );

    revalidatePath("/");
    revalidatePath("/admin");
  }

  redirect("/admin");
}

export async function removeSignup(signupId: string) {
  await requireAdmin();
  await prisma.signup.delete({ where: { id: signupId } }).catch(() => {});
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}
