import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateObject } from "@/lib/dateUtils";
import { uploadImage } from "@/lib/cloudinary";
import type { Category } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const experience = await prisma.experience.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, username: true, profileImage: true } } },
  });

  if (!experience) return NextResponse.json({ error: "경험을 찾을 수 없습니다." }, { status: 404 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: experience.groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });

  return NextResponse.json(experience);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const experience = await prisma.experience.findUnique({ where: { id: params.id } });
  if (!experience) return NextResponse.json({ error: "경험을 찾을 수 없습니다." }, { status: 404 });
  if (experience.userId !== session.user.id) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const today = getTodayDateObject();
  if (experience.experienceDate.getTime() !== today.getTime()) {
    return NextResponse.json({ error: "오늘 등록한 경험만 수정할 수 있습니다." }, { status: 400 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const review = formData.get("review") as string;
  const ratingStr = formData.get("rating") as string;
  const category = formData.get("category") as Category;
  const photo = formData.get("photo") as File | null;

  if (!title || !review || !ratingStr || !category) {
    return NextResponse.json({ error: "모든 필수 항목을 입력해주세요." }, { status: 400 });
  }

  const rating = parseFloat(ratingStr);
  if (isNaN(rating) || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
    return NextResponse.json({ error: "별점은 0.5 단위로 0.5~5.0이어야 합니다." }, { status: 400 });
  }

  if (review.length > 100) {
    return NextResponse.json({ error: "한줄평은 100자 이내로 입력해주세요." }, { status: 400 });
  }

  let photoUrl = experience.photoUrl;
  if (photo && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "사진은 5MB 이하만 업로드 가능합니다." }, { status: 400 });
    }
    const buffer = Buffer.from(await photo.arrayBuffer());
    photoUrl = await uploadImage(buffer);
  }

  const updated = await prisma.experience.update({
    where: { id: params.id },
    data: { title, review, rating, category, photoUrl },
  });

  return NextResponse.json(updated);
}
