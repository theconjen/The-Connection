import crypto from 'crypto';

// Simple function to generate password hash in the same format as our application
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

// Generate hash for 'password123'
const hashedPassword = hashPassword('password123');
console.log('Hashed password for password123:', hashedPassword);