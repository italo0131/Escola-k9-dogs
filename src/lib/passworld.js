// lib/password.js
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export function verifyPassword(stored, input) {
  const [, salt, hash] = stored.split(':');
  const derivedInput = scryptSync(input, salt, 64);
  return timingSafeEqual(Buffer.from(hash, 'hex'), derivedInput);
}