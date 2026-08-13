import { apiClient } from './api/client';
import { directionsService } from './directionsService';

jest.mock('./api/client', () => ({ apiClient: { get: jest.fn() } }));

const origin = { latitude: -15.4419, longitude: -74.617 };
const destination = { latitude: -15.4519, longitude: -74.617 };

it('mapea sin alterar la ruta entregada por la API', async () => {
  const route = { distanceKm: 1.2, durationMinutes: 4, polyline: [origin, destination] };
  (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: route });
  await expect(directionsService.getRoute(origin, destination)).resolves.toBe(route);
});

it('genera una línea recta si la API no responde', async () => {
  (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('sin red'));
  const route = await directionsService.getRoute(origin, destination);
  expect(route.distanceKm).toBeCloseTo(1.11, 2);
  expect(route.durationMinutes).toBe(3);
  expect(route.polyline).toEqual([origin, destination]);
});
