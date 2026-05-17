import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/reset-password"];
const API_PREFIX = "/api";
const WRITE_PATH = "/write";
const HOF_SELECT_PATH = "/hall-of-fame/select";
const GROUP_SETUP_PATH = "/group/setup";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일, API, 공개 경로는 통과
  if (
    pathname.startsWith(API_PREFIX) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // 1. 비로그인 → /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. 그룹 없는 유저 → /group/setup
  if (pathname !== GROUP_SETUP_PATH) {
    const groupRes = await fetch(`${request.nextUrl.origin}/api/group/my`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });

    if (groupRes.ok) {
      const groupData = await groupRes.json();
      const groups: { id: string }[] = groupData.groups ?? [];

      if (groups.length === 0) {
        return NextResponse.redirect(new URL(GROUP_SETUP_PATH, request.url));
      }

      // 3. 오늘 경험 미등록 → /write (첫 번째 그룹 기준으로 체크)
      if (pathname !== WRITE_PATH && pathname !== HOF_SELECT_PATH) {
        const firstGroupId = groups[0].id;
        const todayRes = await fetch(
          `${request.nextUrl.origin}/api/experiences/today-status?groupId=${firstGroupId}`,
          { headers: { cookie: request.headers.get("cookie") ?? "" } }
        );

        if (todayRes.ok) {
          const todayData = await todayRes.json();
          if (!todayData.hasRegisteredToday) {
            return NextResponse.redirect(new URL(WRITE_PATH, request.url));
          }
        }
      }
    }
  }

  // 4. 말일 명예의 전당 미선택 → /hall-of-fame/select
  if (pathname !== HOF_SELECT_PATH && pathname !== GROUP_SETUP_PATH) {
    const pendingRes = await fetch(`${request.nextUrl.origin}/api/hall-of-fame/pending`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    if (pendingRes.ok) {
      const pendingData = await pendingRes.json();
      if (pendingData.pending) {
        return NextResponse.redirect(new URL(HOF_SELECT_PATH, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
