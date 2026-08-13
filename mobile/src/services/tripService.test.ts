import { apiClient } from './api/client';
import { tripService } from './tripService';

jest.mock('./api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const post = apiClient.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it('crea una oferta con el monto indicado', async () => {
  post.mockResolvedValueOnce({ data: { id: 'offer-1', amount: 12.5 } });
  await expect(tripService.createOffer('trip-1', 12.5)).resolves.toMatchObject({ id: 'offer-1' });
  expect(post).toHaveBeenCalledWith('/trips/trip-1/offers', { amount: 12.5 });
});

it('selecciona una oferta', async () => {
  post.mockResolvedValueOnce({ data: { id: 'trip-1', status: 'DRIVER_ARRIVING' } });
  await tripService.selectOffer('trip-1', 'offer-1');
  expect(post).toHaveBeenCalledWith('/trips/trip-1/offers/offer-1/select');
});

it('confirma el pago', async () => {
  post.mockResolvedValueOnce({ data: { id: 'trip-1', status: 'FINISHED' } });
  await tripService.confirmPayment('trip-1');
  expect(post).toHaveBeenCalledWith('/trips/trip-1/confirm-payment');
});

it('cancela enviando el motivo', async () => {
  post.mockResolvedValueOnce({ data: { id: 'trip-1', status: 'CANCELLED' } });
  await tripService.cancelTrip('trip-1', 'Cambio de planes');
  expect(post).toHaveBeenCalledWith('/trips/trip-1/cancel', { reason: 'Cambio de planes' });
});
