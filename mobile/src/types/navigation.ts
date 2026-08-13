import { GeoPoint } from './trip';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  ChooseUserType: undefined;
  RegisterPassenger: undefined;
  RegisterDriver: undefined;
};

export type PassengerTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type PassengerStackParamList = {
  PassengerTabs: undefined;
  ChooseVehicle: { origin: GeoPoint; destination: GeoPoint };
  SearchingDriver: { tripId: string };
  DriverFound: { tripId: string };
  TripTracking: { tripId: string };
  IncidentReport: { tripId: string };
  MyIncidents: undefined;
  RateTrip: { tripId: string };
  Settings: undefined;
};

export type DriverTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type DriverStackParamList = {
  DriverTabs: undefined;
  DriverTrip: { tripId: string };
  IncidentReport: { tripId: string };
  MyIncidents: undefined;
  RenewDocuments: undefined;
  Settings: undefined;
};
