import { act, render, waitFor } from '@testing-library/react-native';
import React, { useEffect } from 'react';
import { Text } from 'react-native';

import { TripProvider, useTrip } from './TripContext';

import { tripService } from '@/services/tripService';

jest.mock('@/context/AuthContext', () => {
  const authState = { user: { id: 'p1', role: 'PASSENGER' }, isLoading: false };
  return { useAuth: () => authState };
});
jest.mock('@/services/tripService', () => ({
  tripService: { getMyActiveTrip: jest.fn(), getTrip: jest.fn() },
}));
jest.mock('@/constants/config', () => ({
  ...jest.requireActual('@/constants/config'),
  TRIP_POLL_INTERVAL_MS: 10,
}));

function Probe() {
  const { trip, track } = useTrip();
  useEffect(() => track('trip-1'), [track]);
  return <Text>{trip?.status ?? 'SIN_VIAJE'}</Text>;
}

it('detiene el polling cuando el viaje llega a un estado terminal', async () => {
  (tripService.getMyActiveTrip as jest.Mock).mockResolvedValue(null);
  (tripService.getTrip as jest.Mock).mockResolvedValue({
    id: 'trip-1',
    status: 'FINISHED',
  });

  const screen = await render(
    <TripProvider>
      <Probe />
    </TripProvider>
  );
  await waitFor(() => expect(screen.getByText('FINISHED')).toBeTruthy());
  expect(tripService.getTrip).toHaveBeenCalledTimes(1);

  await act(() => new Promise((resolve) => setTimeout(resolve, 40)));
  expect(tripService.getTrip).toHaveBeenCalledTimes(1);
  await screen.unmount();
});
