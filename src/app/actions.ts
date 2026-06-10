"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Actions always redirect (never return state) so they work identically
// with and without JavaScript. Errors round-trip via query params.
export async function signUp(slotId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const back = (error: string): never => {
    const q = new URLSearchParams({ error, name, email });
    redirect(`/signup/${slotId}?${q}`);
  };

  if (!name) back("name");
  if (!EMAIL_RE.test(email)) back("email");

  let cancelToken: string | null = null;
  let errorCode: string | null = null;

  try {
    const signup = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: { _count: { select: { signups: true } } },
      });
      if (!slot || slot.status !== "ACTIVE" || slot.startsAt < new Date()) {
        throw new Error("unavailable");
      }
      if (slot._count.signups >= slot.capacity) {
        throw new Error("full");
      }
      return tx.signup.create({
        data: { slotId, name, email },
        include: { slot: true },
      });
    });

    cancelToken = signup.cancelToken;
    await sendConfirmationEmail(email, name, signup.slot, signup.cancelToken);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      errorCode = "duplicate";
    } else if (err instanceof Error && (err.message === "full" || err.message === "unavailable")) {
      errorCode = err.message;
    } else {
      console.error("[signup] failed:", err);
      errorCode = "unknown";
    }
  }

  if (errorCode || !cancelToken) back(errorCode ?? "unknown");

  revalidatePath("/");
  redirect(`/s/${cancelToken}?new=1`);
}

export async function cancelSignup(token: string) {
  const signup = await prisma.signup.findUnique({ where: { cancelToken: token } });
  if (signup) {
    await prisma.signup.delete({ where: { id: signup.id } });
    revalidatePath("/");
  }
  redirect(`/s/${token}?cancelled=1`);
}
