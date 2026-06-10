import { prisma } from "./db";
import { sendReminderEmail } from "./email";

/**
 * Finds active slots starting within the next 24 hours that haven't had
 * reminders sent yet, and emails every signed-up volunteer.
 * Runs hourly via node-cron (see src/instrumentation.ts).
 */
export async function sendDueReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const slots = await prisma.slot.findMany({
    where: {
      status: "ACTIVE",
      reminderSentAt: null,
      startsAt: { gte: now, lte: in24h },
    },
    include: { signups: true },
  });

  for (const slot of slots) {
    // Mark first so a crash mid-send can't cause duplicate reminder blasts.
    await prisma.slot.update({
      where: { id: slot.id },
      data: { reminderSentAt: now },
    });

    const results = await Promise.allSettled(
      slot.signups.map((s) => sendReminderEmail(s.email, s.name, slot, s.cancelToken))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(
      `[reminders] "${slot.title}": sent ${slot.signups.length - failed}/${slot.signups.length} reminder(s)`
    );
  }
}
