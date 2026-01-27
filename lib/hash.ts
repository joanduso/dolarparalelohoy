import crypto from 'node:crypto';

export function hashValue(value: string) {
  const salt = process.env.HASH_SALT ?? '';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
}
