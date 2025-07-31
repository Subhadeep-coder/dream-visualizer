import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For GCM, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function getKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

export function encrypt(text: string): string {
  const password = process.env.ENCRYPTION_KEY;
  if (!password) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(password, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(salt);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return (
    salt.toString("hex") + iv.toString("hex") + tag.toString("hex") + encrypted
  );
}

export function decrypt(encryptedData: string): string {
  const password = process.env.ENCRYPTION_KEY;
  if (!password) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }

  const salt = Buffer.from(encryptedData.slice(0, SALT_LENGTH * 2), "hex");
  const iv = Buffer.from(
    encryptedData.slice(SALT_LENGTH * 2, TAG_POSITION * 2),
    "hex",
  );
  const tag = Buffer.from(
    encryptedData.slice(TAG_POSITION * 2, ENCRYPTED_POSITION * 2),
    "hex",
  );
  const encrypted = encryptedData.slice(ENCRYPTED_POSITION * 2);

  const key = getKey(password, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(salt);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function safeEncrypt(text: string): string {
  try {
    return encrypt(text);
  } catch (error) {
    console.error("Encryption failed:", error);
    return text;
  }
}

export function safeDecrypt(encryptedData: string): string {
  try {
    return decrypt(encryptedData);
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedData;
  }
}

export function isEncrypted(data: string): boolean {
  const minEncryptedLength = (SALT_LENGTH + IV_LENGTH + TAG_LENGTH) * 2;
  return data.length > minEncryptedLength && /^[0-9a-f]+$/i.test(data);
}
