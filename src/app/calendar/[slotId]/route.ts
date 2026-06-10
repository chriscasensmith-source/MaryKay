import { prisma } from "@/lib/db";
import { buildIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.status !== "ACTIVE") {
    return new Response("Not found", { status: 404 });
  }

  return new Response(buildIcs(slot), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="r3-tour.ics"`,
    },
  });
}
