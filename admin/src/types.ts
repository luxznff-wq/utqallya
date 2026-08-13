export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'DRIVER' | 'PASSENGER';
  active?: boolean;
  blocked?: boolean;
}

export interface Driver {
  id: string;
  user: User;
  vehicle: { type: string; plate: string };
  approvalStatus: string;
  ratingAverage: number;
  totalTrips: number;
  rejectionReason?: string;
}

export interface Trip {
  id: string;
  status: string;
  passenger: User;
  driver?: { id: string; user?: User };
  vehicleType: string;
  agreedFare?: number;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export type Stats = Record<string, number>;
