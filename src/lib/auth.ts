import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_auth";

export async function isAdmin(): Promise<boolean> {
  const passcode = process.env.ADMIN_PASSCODE;
  if (!passcode) return false;
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === passcode;
}

export async function setAdminCookie(passcode: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, passcode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    redirect("/admin");
  }
}
