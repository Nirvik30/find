import dotenv from 'dotenv';
dotenv.config();

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_for_development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  cookieExpires: process.env.COOKIE_EXPIRES || 30,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};