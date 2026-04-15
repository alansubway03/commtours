import { createHash, randomBytes } from "crypto";

export const PASSWORD_RESET_EXPIRE_MINUTES = 30;

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

