import bcrypt from "bcryptjs";

/**
 * bcrypt work factor. 12 rounds is the current OWASP-recommended minimum
 * for interactive login (enough cost to resist offline brute-forcing,
 * cheap enough to keep login latency imperceptible on a single VPS).
 */
const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Minimum password policy, enforced wherever a password is set — login has
 * no length requirement to check (an existing hash is either right or
 * wrong), but account creation and password changes both funnel through
 * this so the rule is defined once.
 */
export function isPasswordStrongEnough(plainPassword: string): boolean {
  return plainPassword.length >= 8;
}
