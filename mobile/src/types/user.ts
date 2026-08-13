export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  blocked: boolean;
  /** Sólo existe en la respuesta privada de /users/me. */
  emergencyContactName?: string | null;
  /** Sólo existe en la respuesta privada de /users/me. */
  emergencyContactPhone?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMinutes: number;
  user: UserProfile;
}
