import nodemailer from "nodemailer";

type ResetMailArgs = {
  to: string;
  resetUrl: string;
  expireMinutes: number;
};

function requiredEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`缺少環境變數 ${name}`);
  }
  return v;
}

export async function sendPasswordResetEmail(args: ResetMailArgs): Promise<void> {
  const host = requiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASS");
  const from = process.env.MEMBER_EMAIL_FROM?.trim() || user;

  const transporter = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: args.to,
    subject: "重設你的 CommTours 會員密碼",
    text: `你收到這封信，是因為有人要求重設你的會員密碼。\n\n請開啟以下連結設定新密碼（${args.expireMinutes} 分鐘內有效）：\n${args.resetUrl}\n\n如果不是你本人操作，請忽略此信。`,
    html: `<p>你收到這封信，是因為有人要求重設你的會員密碼。</p>
<p>請開啟以下連結設定新密碼（${args.expireMinutes} 分鐘內有效）：</p>
<p><a href="${args.resetUrl}">${args.resetUrl}</a></p>
<p>如果不是你本人操作，請忽略此信。</p>`,
  });
}

