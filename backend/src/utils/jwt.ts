import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { config } from '../config';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  gymId: string | null;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  } as SignOptions);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};

export const getTokenExpiry = (expiry: string): Date => {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [, num, unit] = match;
  return new Date(Date.now() + parseInt(num, 10) * (units[unit] ?? 1000));
};
