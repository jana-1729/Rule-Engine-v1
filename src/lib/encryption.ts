import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const algorithm = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-replace-in-production';

/**
 * Encrypts sensitive data (OAuth tokens, API keys)
 */
export async function encrypt(text: string): Promise<string> {
  const iv = randomBytes(16);
  const salt = randomBytes(32);
  
  const key = (await scryptAsync(ENCRYPTION_KEY, salt, 32)) as Buffer;
  const cipher = createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: salt:iv:authTag:encryptedData
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts sensitive data
 */
export async function decrypt(encryptedData: string): Promise<string> {
  const [saltHex, ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const key = (await scryptAsync(ENCRYPTION_KEY, salt, 32)) as Buffer;
  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

