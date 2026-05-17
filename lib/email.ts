import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@newex.app";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function sendReminderEmail(to: string, username: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "오늘의 새로운 경험을 기록해주세요 ⏰",
    html: reminderTemplate(username),
  });
}

export async function sendMonthlyReportEmail(
  to: string,
  username: string,
  year: number,
  month: number,
  averageRating: number,
  missedDays: number
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `[${month}월 리포트] 이번 달 당신의 경험을 돌아보세요`,
    html: monthlyReportTemplate(username, year, month, averageRating, missedDays),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "비밀번호 재설정 링크",
    html: passwordResetTemplate(resetUrl),
  });
}

function reminderTemplate(username: string) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Pretendard','Noto Sans KR',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:#1a1f36;padding:40px 40px 32px;">
      <p style="margin:0;color:#f59e0b;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">NEW EXPERIENCE</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.3;">오늘의 경험을<br>아직 기록하지 않으셨어요</h1>
    </div>
    <div style="padding:40px;">
      <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.7;">${username}님, 오늘 하루 새로운 경험을 하셨나요? 아직 기록하지 않으셨다면 오늘이 끝나기 전에 기록해보세요!</p>
      <p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.7;">매일 하나씩 쌓이는 경험들이 나중에 멋진 이야기가 됩니다 ✨</p>
      <a href="${BASE_URL}/write" style="display:inline-block;background:#f59e0b;color:#1a1f36;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">지금 기록하러 가기 →</a>
    </div>
    <div style="padding:24px 40px;background:#f8f7f4;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">이 이메일은 newex 서비스에서 발송된 알림입니다.</p>
    </div>
  </div>
</body>
</html>`;
}

function monthlyReportTemplate(
  username: string,
  year: number,
  month: number,
  averageRating: number,
  missedDays: number
) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Pretendard','Noto Sans KR',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:#1a1f36;padding:40px 40px 32px;">
      <p style="margin:0;color:#f59e0b;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">${year}년 ${month}월 리포트</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.3;">이번 달 어떠셨나요?</h1>
    </div>
    <div style="padding:40px;">
      <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">${username}님의 ${month}월 경험 리포트가 준비되었습니다!</p>
      <div style="display:flex;gap:16px;margin-bottom:32px;">
        <div style="flex:1;background:#f8f7f4;border-radius:12px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">평균 별점</p>
          <p style="margin:0;color:#1a1f36;font-size:28px;font-weight:700;">⭐ ${averageRating.toFixed(1)}</p>
        </div>
        <div style="flex:1;background:#f8f7f4;border-radius:12px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">미등록 일수</p>
          <p style="margin:0;color:#1a1f36;font-size:28px;font-weight:700;">${missedDays}일</p>
        </div>
      </div>
      <a href="${BASE_URL}/report/monthly/${year}/${month}" style="display:inline-block;background:#f59e0b;color:#1a1f36;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">전체 리포트 보기 →</a>
    </div>
    <div style="padding:24px 40px;background:#f8f7f4;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">이 이메일은 newex 서비스에서 발송된 알림입니다.</p>
    </div>
  </div>
</body>
</html>`;
}

function passwordResetTemplate(resetUrl: string) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Pretendard','Noto Sans KR',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:#1a1f36;padding:40px 40px 32px;">
      <p style="margin:0;color:#f59e0b;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">NEW EXPERIENCE</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.3;">비밀번호 재설정</h1>
    </div>
    <div style="padding:40px;">
      <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.7;">비밀번호 재설정 요청이 접수되었습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>
      <p style="margin:0 0 32px;color:#9ca3af;font-size:13px;">이 링크는 1시간 후 만료됩니다. 요청하지 않으셨다면 이 이메일을 무시해주세요.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#f59e0b;color:#1a1f36;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">비밀번호 재설정 →</a>
    </div>
    <div style="padding:24px 40px;background:#f8f7f4;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">이 이메일은 newex 서비스에서 발송된 알림입니다.</p>
    </div>
  </div>
</body>
</html>`;
}
