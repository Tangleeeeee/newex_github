import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExperienceDate, getTodayDateObject } from "@/lib/dateUtils";
import { uploadImage } from "@/lib/cloudinary";
import type { Category } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const cursor = searchParams.get("cursor");
  const limit = 20;

  if (!groupId) return NextResponse.json({ error: "groupId 필요" }, { status: 400 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "해당 그룹에 속해있지 않습니다." }, { status: 403 });

  const experiences = await prisma.experience.findMany({
    where: { groupId },
    orderBy: { experienceDate: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { user: { select: { id: true, username: true, nickname: true, profileImage: true } } },
  });

  const hasMore = experiences.length > limit;
  const data = hasMore ? experiences.slice(0, limit) : experiences;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({ experiences: data, nextCursor });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const review = formData.get("review") as string;
  const ratingStr = formData.get("rating") as string;
  const category = formData.get("category") as Category;
  const groupId = formData.get("groupId") as string;
  const photo = formData.get("photo") as File | null;

  if (!title || !review || !ratingStr || !category || !groupId) {
    return NextResponse.json({ error: "모든 필수 항목을 입력해주세요." }, { status: 400 });
  }

  const rating = parseFloat(ratingStr);
  if (isNaN(rating) || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
    return NextResponse.json({ error: "별점은 0.5 단위로 0.5~5.0이어야 합니다." }, { status: 400 });
  }

  if (review.length > 100) {
    return NextResponse.json({ error: "한줄평은 100자 이내로 입력해주세요." }, { status: 400 });
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "해당 그룹에 속해있지 않습니다." }, { status: 403 });

  const today = getTodayDateObject();
  const alreadyExists = await prisma.experience.findFirst({
    where: { userId: session.user.id, groupId, experienceDate: today },
  });
  if (alreadyExists) {
    return NextResponse.json({ error: "오늘 이미 경험을 등록하셨습니다." }, { status: 400 });
  }

  let photoUrl: string | null = null;
  if (photo) {
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "사진은 5MB 이하만 업로드 가능합니다." }, { status: 400 });
    }
    const buffer = Buffer.from(await photo.arrayBuffer());
    photoUrl = await uploadImage(buffer);
  }

  const experienceDate = getExperienceDate();
  const experience = await prisma.experience.create({
    data: {
      userId: session.user.id,
      groupId,
      title,
      review,
      rating,
      category,
      photoUrl,
      experienceDate,
    },
  });

  return NextResponse.json(experience, { status: 201 });
}
