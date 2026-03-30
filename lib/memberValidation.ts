export const MEMBER_NAME_REGEX = /^[A-Za-z0-9]{2,20}$/;
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TEL_REGEX = /^(?=.*\d)[0-9+\-() ]{6,20}$/;

export function normalizeEmail(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

export function normalizeTel(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function normalizeMemberName(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidTel(tel: string): boolean {
  const normalized = tel.trim();
  if (!TEL_REGEX.test(normalized)) return false;
  const digitCount = normalized.replace(/\D/g, "").length;
  return digitCount >= 6;
}

export function isValidMemberName(memberName: string): boolean {
  return MEMBER_NAME_REGEX.test(memberName);
}

export function isStrongPassword(password: string): boolean {
  return PASSWORD_STRENGTH_REGEX.test(password);
}
