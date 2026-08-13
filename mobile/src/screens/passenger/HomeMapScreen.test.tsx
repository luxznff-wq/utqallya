import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { HomeMapScreen } from './HomeMapScreen';

import { locationService } from '@/services/locationService';

jest.mock('@/services/locationService', () => ({
  locationService: {
    requestPermission: jest.fn(),
    getCurrentPosition: jest.fn(),
  },
}));
jest.mock('@/components/AppMap', () => {
  const ReactNative = jest.requireActual('react-native');
  const Map = ({ children }: { children?: React.ReactNode }) => <ReactNative.View>{children}</ReactNative.View>;
  return { __esModule: true, default: Map, Marker: () => null };
});
jest.mock('@/components/icons', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    MarcadorIcon: () => <ReactNative.Text>origen-icon</ReactNative.Text>,
    DestinoIcon: () => <ReactNative.Text>destino-icon</ReactNative.Text>,
    MapaIcon: () => <ReactNative.Text>elegir-en-mapa</ReactNative.Text>,
  };
});

it('fijar origen y destino habilita Buscar vehículo', async () => {
  (locationService.requestPermission as jest.Mock).mockResolvedValue(false);
  const navigation = { navigate: jest.fn() };
  const screen = await render(<HomeMapScreen navigation={navigation as never} route={{} as never} />);

  const search = screen.getByText('Buscar vehículo');
  expect(search.parent?.props.accessibilityState?.disabled).toBe(true);

  await fireEvent.press(screen.getAllByText('elegir-en-mapa')[0]);
  await fireEvent.press(screen.getByText('Confirmar'));
  await fireEvent.press(screen.getAllByText('elegir-en-mapa')[1]);
  await fireEvent.press(screen.getByText('Confirmar'));

  await waitFor(() =>
    expect(screen.getByText('Buscar vehículo').parent?.props.accessibilityState?.disabled).not.toBe(true)
  );
  await fireEvent.press(screen.getByText('Buscar vehículo'));
  expect(navigation.navigate).toHaveBeenCalledWith(
    'ChooseVehicle',
    expect.objectContaining({
      origin: expect.objectContaining({ latitude: expect.any(Number) }),
      destination: expect.objectContaining({ latitude: expect.any(Number) }),
    })
  );
});
