/**
 * Models Index
 * 
 * Central export point for all Mongoose models
 * This allows importing models from a single location:
 * 
 * import { User, JWTToken } from './models';
 */

export { default as User } from './User';
export { default as JWTToken } from './JWTToken';

// Export interfaces
export type { IUser } from './User';
export type { IJWTToken } from './JWTToken';
