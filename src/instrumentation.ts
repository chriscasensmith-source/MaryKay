/**
 * Runs once when the Node server starts (Next.js instrumentation hook).
 * Schedules the hourly reminder job — this works on Render because the app
 * runs as a persistent web service.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const globalAny = globalThis as unknown as { __reminderCronStarted?: boolean };
  if (globalAny.__reminderCronStarted) return;
  globalAny.__reminderCronStarted = true;

  // webpackIgnore keeps node-cron out of the bundle (it uses Node built-ins
  // that break the edge-runtime compile); Node resolves it at runtime instead.
  const cron = (await import(/* webpackIgnore: true */ "node-cron")).default;
  const { sendDueReminders } = await import("./lib/reminders");

  cron.schedule("0 * * * *", async () => {
    try {
      await sendDueReminders();
    } catch (err) {
      console.error("[reminders] hourly job failed:", err);
    }
  });

  console.log("[reminders] hourly reminder cron scheduled");
}
