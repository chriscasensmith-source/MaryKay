"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { TourLanguage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, setAdminCookie, clearAdminCookie } from "@/lib/auth";
import { emailEnabled, sendSlotCancelledEmail, sendSlotChangedEmail } from "@/lib/email";
import { LANGUAGES } from "@/lib/language";

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
  const language = String(formData.get("language") ?? "ENGLISH") as TourLanguage;
  const capacity = Number(formData.get("capacity"));
  const guestsRaw = String(formData.get("expectedGuests") ?? "").trim();
  const expectedGuests = guestsRaw === "" ? 0 : Number(guestsRaw);

  const back = (error: string): never => {
    const q = new URLSearchParams({
      error,
      form: slotId ?? "new",
      title,
      notes: notes ?? "",
      date,
      time,
      language,
      capacity: String(formData.get("capacity") ?? ""),
      expectedGuests: guestsRaw,
    });
    redirect(`/admin?${q}#form-${slotId ?? "new"}`);
  };

  if (!title) back("title");
  if (!LANGUAGES.includes(language)) back("language");
  if (!Number.isInteger(capacity) || capacity < 1) back("capacity");
  if (!Number.isInteger(expectedGuests) || expectedGuests < 0) back("guests");

  // Parsed in the server's local timezone (set TZ env var on Render).
  const startsAt = date && time ? new Date(`${date}T${time}`) : new Date(NaN);
  if (Number.isNaN(startsAt.getTime())) back("datetime");

  const data = { title, notes, startsAt, language, capacity, expectedGuests };

  if (slotId) {
    const existing = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { signups: true },
    });
    if (!existing) redirect("/admin");

    const updated = await prisma.slot.update({ where: { id: slotId }, data });

    // Date or time changed → let every signed-up guide know (when email is on).
    if (
      emailEnabled() &&
      existing.startsAt.getTime() !== startsAt.getTime() &&
      existing.signups.length > 0
    ) {
      await Promise.allSettled(
        existing.signups.map((s) =>
          sendSlotChangedEmail(s.email, s.name, updated, s.cancelToken)
        )
      );
    }
  } else {
    await prisma.slot.create({ data });
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

    if (emailEnabled()) {
      await Promise.allSettled(
        slot.signups.map((s) => sendSlotCancelledEmail(s.email, s.name, slot))
      );
    }

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
