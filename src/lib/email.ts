import { Resend } from "resend";
import { formatDateTime } from "./format";

type SlotInfo = { title: string; notes: string | null; startsAt: Date };

function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function fromAddress(): string {
  return process.env.RESEND_FROM ?? "R3 Tour Team <onboarding@resend.dev>";
}

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: fromAddress(), to, subject, html });
  if (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
  }
}

function layout(body: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937;">
    ${body}
    <p style="color:#9ca3af;font-size:13px;margin-top:32px;">R3 Tour Team</p>
  </div>`;
}

function slotDetails(slot: SlotInfo): string {
  return `
  <div style="background:#fdf2f8;border-radius:12px;padding:16px 20px;margin:16px 0;">
    <p style="margin:0;font-weight:600;font-size:16px;">${escapeHtml(slot.title)}</p>
    <p style="margin:6px 0 0;">${formatDateTime(slot.startsAt)}</p>
    ${slot.notes ? `<p style="margin:6px 0 0;color:#6b7280;">${escapeHtml(slot.notes)}</p>` : ""}
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendConfirmationEmail(
  to: string,
  name: string,
  slot: SlotInfo,
  cancelToken: string
) {
  const cancelLink = `${appUrl()}/s/${cancelToken}`;
  await send(
    to,
    `You're signed up: ${slot.title}`,
    layout(`
      <h2 style="margin:0 0 8px;">You're signed up! 🎉</h2>
      <p>Hi ${escapeHtml(name)}, thanks for volunteering. Here are the details:</p>
      ${slotDetails(slot)}
      <p>Need to back out? No problem — just use this link:</p>
      <p><a href="${cancelLink}" style="color:#db2777;">Cancel my signup</a></p>
    `)
  );
}

export async function sendReminderEmail(
  to: string,
  name: string,
  slot: SlotInfo,
  cancelToken: string
) {
  const cancelLink = `${appUrl()}/s/${cancelToken}`;
  await send(
    to,
    `Reminder: ${slot.title} is coming up`,
    layout(`
      <h2 style="margin:0 0 8px;">See you soon!</h2>
      <p>Hi ${escapeHtml(name)}, a friendly reminder that you're signed up for a tour in the next 24 hours:</p>
      ${slotDetails(slot)}
      <p>Can't make it after all? Please cancel so someone else can take your spot:</p>
      <p><a href="${cancelLink}" style="color:#db2777;">Cancel my signup</a></p>
    `)
  );
}

export async function sendSlotCancelledEmail(to: string, name: string, slot: SlotInfo) {
  await send(
    to,
    `Cancelled: ${slot.title}`,
    layout(`
      <h2 style="margin:0 0 8px;">Tour cancelled</h2>
      <p>Hi ${escapeHtml(name)}, unfortunately this tour has been cancelled by the organizer:</p>
      ${slotDetails(slot)}
      <p>You don't need to do anything — your signup has been removed. Keep an eye out for future tours at <a href="${appUrl()}" style="color:#db2777;">${appUrl()}</a>.</p>
    `)
  );
}
