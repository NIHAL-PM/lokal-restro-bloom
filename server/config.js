import dotenv from 'dotenv';
dotenv.config();

export const config = {
  sessionSecret: process.env.SESSION_SECRET || 'defaultsecret',
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || 'development',
};
