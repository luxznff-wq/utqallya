import { GeoPoint } from './trip';

export type AuthStackParamList = {
  Login: undefined;
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
  SelectOrigin: undefined;
  SelectDestination: { origin: GeoPoint };
  SearchingDriver: { tripId: string };
  DriverFound: { tripId: string };
  TripTracking: { tripId: string };
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
  Settings: undefined;
};
