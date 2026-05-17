import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: { group: { select: { id: true, name: true, inviteCode: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ groups: memberships.map((m) => ({ ...m.group, role: m.role })) });
}
