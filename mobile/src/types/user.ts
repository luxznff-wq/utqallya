export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  blocked: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMinutes: number;
  user: UserProfile;
}
