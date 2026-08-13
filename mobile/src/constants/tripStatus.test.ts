import { TRIP_STATUS_META } from './tripStatus';

describe('TRIP_STATUS_META', () => {
  it('defines a visible label for every backend trip status', () => {
    expect(Object.keys(TRIP_STATUS_META)).toEqual([
      'REQUESTED',
      'SEARCHING_DRIVER',
      'ACCEPTED',
      'DRIVER_ARRIVING',
      'WAITING_CONFIRMATION',
      'IN_PROGRESS',
      'FINISHED',
      'RATED',
      'CANCELLED',
    ]);

    Object.values(TRIP_STATUS_META).forEach((status) => {
      expect(status.label.trim()).not.toHaveLength(0);
      expect(status.color).toMatch(/^#/);
    });
  });
});
