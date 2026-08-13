import { UserProfile } from './user';

export type VehicleType = 'CAR' | 'MOTOTAXI';
export type DriverApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
export type DriverAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export interface Vehicle {
  id: string;
  type: VehicleType;
  plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  photoUrl: string;
}

export interface DriverProfile {
  id: string;
  user: UserProfile;
  vehicle: Vehicle | null;
  approvalStatus: DriverApprovalStatus;
  availability: DriverAvailability;
  ratingAverage: number;
  totalTrips: number;
  rejectionReason: string | null;
  licenseExpiresAt: string | null;
  soatExpiresAt: string | null;
  yapeHolderName: string | null;
  yapePhone: string | null;
}
