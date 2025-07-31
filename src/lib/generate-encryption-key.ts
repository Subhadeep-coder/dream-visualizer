import crypto from "crypto";

// Utility function to generate a secure encryption key
// Run this once to generate your ENCRYPTION_KEY
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Uncomment and run this to generate a key:
// console.log('Generated encryption key:', generateEncryptionKey())
