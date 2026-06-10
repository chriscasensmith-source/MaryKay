import { Resend } from "resend";
import type { TourLanguage } from "@prisma/client";
import { formatDateTime, formatDateTimeEs } from "./format";
import { LANGUAGE_LABEL } from "./language";

type SlotInfo = {
  title: string;
  notes: string | null;
  startsAt: Date;
  language: TourLanguage;
  expectedGuests: number;
};

const PINK = "#e8348b";
const BLUSH = "#fbe4ef";
const INK = "#2d2a2e";
const GOLD = "#8f7119";

function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function fromAddress(): string {
  return process.env.RESEND_FROM ?? "R3 Tour Team <onboarding@resend.dev>";
}

/** Email is optional — without RESEND_API_KEY the app runs with all sends skipped. */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function send(to: string, subject: string, html: string) {
  if (!emailEnabled()) return; // running without email — skip silently
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: fromAddress(), to, subject, html });
  if (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(body: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:${INK};">
    ${body}
    <p style="color:#9b939e;font-size:13px;margin-top:32px;">R3 Tour Team</p>
  </div>`;
}

function slotDetails(slot: SlotInfo, es: boolean): string {
  const when = es ? formatDateTimeEs(slot.startsAt) : formatDateTime(slot.startsAt);
  const langLine =
    slot.language === "ENGLISH"
      ? ""
      : `<p style="margin:6px 0 0;color:${GOLD};font-weight:700;">${
          es ? "Idioma" : "Language"
        }: ${LANGUAGE_LABEL[slot.language]}</p>`;
  const guestsLine =
    slot.expectedGuests > 0
      ? `<p style="margin:6px 0 0;color:#6f6873;">${
          es ? "Tamaño del grupo" : "Group size"
        }: ~${slot.expectedGuests} ${es ? "personas" : "guests"}</p>`
      : "";
  return `
  <div style="background:${BLUSH};border-radius:12px;padding:16px 20px;margin:16px 0;">
    <p style="margin:0;font-weight:600;font-size:16px;color:${INK};">${escapeHtml(slot.title)}</p>
    <p style="margin:6px 0 0;color:${PINK};font-weight:600;">${when}</p>
    ${langLine}
    ${guestsLine}
    ${slot.notes ? `<p style="margin:6px 0 0;color:#6f6873;">${escapeHtml(slot.notes)}</p>` : ""}
  </div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BLUSH};margin:28px 0;" />`;
}

const link = (href: string, label: string) =>
  `<p><a href="${href}" style="color:${PINK};font-weight:600;">${label}</a></p>`;

/** Spanish tours get a bilingual email: Spanish first, then English. */
function bilingualBody(slot: SlotInfo, esSection: string, enSection: string): string {
  if (slot.language !== "SPANISH") return enSection;
  return `${esSection}${divider()}${enSection}`;
}

function subjectFor(slot: SlotInfo, es: string, en: string): string {
  return slot.language === "SPANISH" ? `${es} / ${en}` : en;
}

export async function sendConfirmationEmail(
  to: string,
  name: string,
  slot: SlotInfo,
  cancelToken: string
) {
  const cancelLink = `${appUrl()}/s/${cancelToken}`;
  const safeName = escapeHtml(name);

  const en = `
    <h2 style="margin:0 0 8px;color:${INK};">You're signed up! 🎉</h2>
    <p>Hi ${safeName}, thanks for volunteering as a guide. Here are the details:</p>
    ${slotDetails(slot, false)}
    <p>Need to back out? No problem — just use this link:</p>
    ${link(cancelLink, "Cancel my signup")}`;
  const es = `
    <h2 style="margin:0 0 8px;color:${INK};">¡Estás inscrito/a! 🎉</h2>
    <p>Hola ${safeName}, gracias por ser guía voluntario/a. Aquí están los detalles:</p>
    ${slotDetails(slot, true)}
    <p>¿Necesitas cancelar? No hay problema — usa este enlace:</p>
    ${link(cancelLink, "Cancelar mi inscripción")}`;

  await send(
    to,
    subjectFor(slot, `Estás inscrito/a: ${slot.title}`, `You're signed up: ${slot.title}`),
    layout(bilingualBody(slot, es, en))
  );
}

export async function sendReminderEmail(
  to: string,
  name: string,
  slot: SlotInfo,
  cancelToken: string
) {
  const cancelLink = `${appUrl()}/s/${cancelToken}`;
  const safeName = escapeHtml(name);

  const en = `
    <h2 style="margin:0 0 8px;color:${INK};">See you soon!</h2>
    <p>Hi ${safeName}, a friendly reminder that you're signed up to guide a tour in the next 24 hours:</p>
    ${slotDetails(slot, false)}
    <p>Can't make it after all? Please cancel so someone else can take your spot:</p>
    ${link(cancelLink, "Cancel my signup")}`;
  const es = `
    <h2 style="margin:0 0 8px;color:${INK};">¡Nos vemos pronto!</h2>
    <p>Hola ${safeName}, un recordatorio de que estás inscrito/a para guiar un tour en las próximas 24 horas:</p>
    ${slotDetails(slot, true)}
    <p>¿No puedes asistir? Por favor cancela para que otra persona pueda tomar tu lugar:</p>
    ${link(cancelLink, "Cancelar mi inscripción")}`;

  await send(
    to,
    subjectFor(slot, `Recordatorio: ${slot.title}`, `Reminder: ${slot.title} is coming up`),
    layout(bilingualBody(slot, es, en))
  );
}

export async function sendSlotChangedEmail(
  to: string,
  name: string,
  slot: SlotInfo,
  cancelToken: string
) {
  const cancelLink = `${appUrl()}/s/${cancelToken}`;
  const safeName = escapeHtml(name);

  const en = `
    <h2 style="margin:0 0 8px;color:${INK};">Schedule change</h2>
    <p>Hi ${safeName}, the date or time of a tour you signed up for has changed. Here are the new details:</p>
    ${slotDetails(slot, false)}
    <p>If the new time doesn't work for you, you can cancel here:</p>
    ${link(cancelLink, "Cancel my signup")}`;
  const es = `
    <h2 style="margin:0 0 8px;color:${INK};">Cambio de horario</h2>
    <p>Hola ${safeName}, la fecha u hora de un tour en el que estás inscrito/a ha cambiado. Estos son los nuevos detalles:</p>
    ${slotDetails(slot, true)}
    <p>Si el nuevo horario no te funciona, puedes cancelar aquí:</p>
    ${link(cancelLink, "Cancelar mi inscripción")}`;

  await send(
    to,
    subjectFor(slot, `Cambio de horario: ${slot.title}`, `Schedule change: ${slot.title}`),
    layout(bilingualBody(slot, es, en))
  );
}

export async function sendSlotCancelledEmail(to: string, name: string, slot: SlotInfo) {
  const safeName = escapeHtml(name);

  const en = `
    <h2 style="margin:0 0 8px;color:${INK};">Tour cancelled</h2>
    <p>Hi ${safeName}, unfortunately this tour has been cancelled by the organizer:</p>
    ${slotDetails(slot, false)}
    <p>You don't need to do anything — your signup has been removed. Keep an eye out for future tours at <a href="${appUrl()}" style="color:${PINK};">${appUrl()}</a>.</p>`;
  const es = `
    <h2 style="margin:0 0 8px;color:${INK};">Tour cancelado</h2>
    <p>Hola ${safeName}, lamentablemente este tour ha sido cancelado por la organizadora:</p>
    ${slotDetails(slot, true)}
    <p>No necesitas hacer nada — tu inscripción ha sido eliminada. Mantente al pendiente de futuros tours en <a href="${appUrl()}" style="color:${PINK};">${appUrl()}</a>.</p>`;

  await send(
    to,
    subjectFor(slot, `Cancelado: ${slot.title}`, `Cancelled: ${slot.title}`),
    layout(bilingualBody(slot, es, en))
  );
}
