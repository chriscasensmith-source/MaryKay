export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function formatDateTimeEs(date: Date): string {
  const d = date.toLocaleDateString("es-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const t = date.toLocaleTimeString("es-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${d} a las ${t}`;
}

/** Values for prefilling <input type="date"> and <input type="time"> in server-local time. */
export function toInputValues(date: Date): { date: string; time: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}
