import crypto from 'crypto';

export const GenerateToken = () => crypto.randomBytes(64).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
