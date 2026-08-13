import { DriverProfile, VehicleType } from './driver';
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
export type CancelledBy = 'PASSENGER' | 'DRIVER' | 'SYSTEM';

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
  vehicleType: VehicleType;
  distanceKm: number;
  estimatedDurationMinutes: number;
  agreedFare: number | null;
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
  passengerPaymentConfirmedAt: string | null;
  driverPaymentConfirmedAt: string | null;
  cancelReason: string | null;
  cancelledBy: CancelledBy | null;
}

export interface TripOffer {
  id: string;
  tripId: string;
  amount: number;
  status: 'PENDING' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  driver: DriverProfile;
  createdAt: string;
}

export interface CreateTripPayload {
  origin: GeoPoint;
  destination: GeoPoint;
  paymentMethod: PaymentMethodCode;
  vehicleType: VehicleType;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}
