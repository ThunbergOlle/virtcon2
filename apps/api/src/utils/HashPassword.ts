import crypto from 'crypto';
const salt = 'fake_salt';
export const HashPassword = (password: string) => {
  const hash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return hash;
};
