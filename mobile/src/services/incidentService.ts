import { apiClient } from './api/client';

import { PagedResponse } from '@/types';

export type IncidentCategory = 'SAFETY' | 'ACCIDENT' | 'HARASSMENT' | 'LOST_ITEM' | 'PAYMENT_DISPUTE' | 'OTHER';
export type IncidentStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export interface Incident {
  id: string;
  tripId: string;
  category: IncidentCategory;
  description: string;
  status: IncidentStatus;
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export const incidentService = {
  async report(tripId: string, category: IncidentCategory, description: string): Promise<void> {
    await apiClient.post('/incidents', { tripId, category, description });
  },

  async getMine(page = 0, size = 20): Promise<PagedResponse<Incident>> {
    const { data } = await apiClient.get<PagedResponse<Incident>>('/incidents/me', {
      params: { page, size },
    });
    return data;
  },
};
