import crypto from 'crypto';

// Use a static key derived from a secret if available, otherwise fallback to a hardcoded key for development.
// In production, you should set ERP_ENCRYPTION_KEY in your environment variables.
const ENCRYPTION_KEY = process.env.ERP_ENCRYPTION_KEY 
    ? crypto.scryptSync(process.env.ERP_ENCRYPTION_KEY, 'salt', 32) 
    : crypto.scryptSync('default_dev_key_loyola_erp_2026', 'salt', 32); 

const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text) {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("Failed to decrypt credentials:", e);
        return null;
    }
}
