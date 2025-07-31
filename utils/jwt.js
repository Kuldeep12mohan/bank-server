import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key'; // keep this in .env in production

export function signToken(payload) {
return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}

export function verifyToken(token) {
return jwt.verify(token, SECRET_KEY);
}