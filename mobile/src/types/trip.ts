import { DriverProfile } from './driver';
import { UserProfile } from './user';

export type TripStatus =
  | 'REQUESTED'
  | 'SEARCHING_DRIVER'
  | 'ACCEPTED'
  | 'DRIVER_ARRIVING'
  | 'WAITING_CONFIRMATION'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'RATED'
  | 'CANCELLED';

export type PaymentMethodCode = 'CASH' | 'YAPE';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  address?: string | null;
}

export interface Trip {
  id: string;
  status: TripStatus;
  origin: GeoPoint;
  destination: GeoPoint;
  paymentMethod: { code: PaymentMethodCode; displayName: string };
  distanceKm: number;
  estimatedDurationMinutes: number;
  fare: number;
  searchRadiusMeters: number;
  confirmationCode: string | null;
  driver: DriverProfile | null;
  passenger: UserProfile;
  createdAt: string;
  acceptedAt: string | null;
  driverArrivedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface CreateTripPayload {
  origin: GeoPoint;
  destination: GeoPoint;
  paymentMethod: PaymentMethodCode;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}
