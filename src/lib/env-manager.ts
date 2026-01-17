
import crypto from 'crypto';

export interface EnvValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    fixedContent?: string;
    fixed?: boolean;
}

const ALGORITHM = 'aes-256-gcm';

/**
 * Validates .env content for common issues like missing newlines.
 */
export function validateEnv(content: string): EnvValidationResult {
    const result: EnvValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    const lines = content.split('\n');

    // Rule 1: Must end with a newline
    if (content.length > 0 && !content.endsWith('\n')) {
        result.errors.push('File does not end with a newline character');
        result.valid = false;
        // We can offer a fix
        result.fixedContent = content + '\n';
    }

    // Rule 2: Basic syntax check (KEY=VALUE)
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return; // Skip empty lines and comments

        // Check for spaces around equals (common mistake: KEY = VALUE)
        if (line.match(/^[^=]+ =/)) {
            result.warnings.push(`Line ${index + 1}: Key contains a trailing space, which will be part of the key name '${line.split('=')[0]}'`);
        }
        if (line.match(/= [^=]/)) {
            result.warnings.push(`Line ${index + 1}: Value starts with a space, which will be part of the value '${line.split('=')[1]}'`);
        }

        // Check for valid format
        if (!line.includes('=')) {
            result.errors.push(`Line ${index + 1}: Missing '=' separator`);
            result.valid = false;
        }
    });

    return result;
}

/**
 * Generates a strong random key for encryption.
 */
export function generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates that a key is a 64-character hex string.
 */
export function validateKey(key: string): boolean {
    return /^[0-9a-f]{64}$/i.test(key);
}

/**
 * Encrypts content using AES-256-GCM.
 * Returns formatted string: "iv:authTag:encryptedContent"
 */
export function encryptEnv(content: string, keyHex: string): string {
    if (!validateKey(keyHex)) {
        throw new Error('Invalid key format. Key must be a 64-character hex string.');
    }
    const key = Buffer.from(keyHex, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: IV:AuthTag:Content
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts content using AES-256-GCM.
 */
export function decryptEnv(encryptedPackage: string, keyHex: string): string {
    if (!validateKey(keyHex)) {
        throw new Error('Invalid key format. Key must be a 64-character hex string.');
    }
    const parts = encryptedPackage.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format. Expected IV:AuthTag:Content');
    }

    const [ivHex, authTagHex, encryptedContent] = parts;
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // TODO: Add error handling for auth tag mismatch (wrong key cases)
    let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
