
import { apiClient } from '../apiClient';
import { Agency, Scheme } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';

export const agencyApi = {
  // Generic Agency/AMC
  getAgencies: (endpoint: string) => apiClient.get<Agency[]>(endpoint),
  createAgency: (endpoint: string, data: Agency) => apiClient.post<Agency>(endpoint, data),
  updateAgency: (endpoint: string, id: number | string, data: Agency) => apiClient.put<Agency>(`${endpoint}/${id}`, data),
  patchAgency: (endpoint: string, id: number | string, data: Partial<Agency>) => apiClient.patch<Agency>(`${endpoint}/${id}`, data),
  deleteAgency: (endpoint: string, id: number | string) => apiClient.delete<any>(`${endpoint}/${id}`),

  // Generic Scheme/MF-Scheme
  getSchemes: (endpoint: string) => apiClient.get<Scheme[]>(endpoint),
  createScheme: (endpoint: string, data: Scheme) => apiClient.post<Scheme>(endpoint, data),
  updateScheme: (endpoint: string, id: number | string, data: Scheme) => apiClient.put<Scheme>(`${endpoint}/${id}`, data),
  patchScheme: (endpoint: string, id: number | string, data: Partial<Scheme>) => apiClient.patch<Scheme>(`${endpoint}/${id}`, data),
  deleteScheme: (endpoint: string, id: number | string) => apiClient.delete<any>(`${endpoint}/${id}`),
};
