
import { apiClient } from '../apiClient';
import { MutualFundProcessFlow, MutualFundField } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';

const PROCESS_ENDPOINT = API_ENDPOINTS.MASTER_DATA.MUTUAL_FUND_PROCESS;
const FIELD_ENDPOINT = API_ENDPOINTS.MASTER_DATA.MUTUAL_FUND_FIELD;

export const mutualFundApi = {
  // Process Flows
  getProcessFlows: () => apiClient.get<MutualFundProcessFlow[]>(PROCESS_ENDPOINT),
  createProcess: (data: MutualFundProcessFlow) => apiClient.post<MutualFundProcessFlow>(PROCESS_ENDPOINT, data),
  updateProcess: (id: number | string, data: MutualFundProcessFlow) => apiClient.put<MutualFundProcessFlow>(`${PROCESS_ENDPOINT}/${id}`, data),
  patchProcess: (id: number | string, data: Partial<MutualFundProcessFlow>) => apiClient.patch<MutualFundProcessFlow>(`${PROCESS_ENDPOINT}/${id}`, data),
  deleteProcess: (id: number | string) => apiClient.delete<any>(`${PROCESS_ENDPOINT}/${id}`),

  // Custom Fields
  getFields: () => apiClient.get<MutualFundField[]>(FIELD_ENDPOINT),
  createField: (data: MutualFundField) => apiClient.post<MutualFundField>(FIELD_ENDPOINT, data),
  updateField: (id: number | string, data: MutualFundField) => apiClient.put<MutualFundField>(`${FIELD_ENDPOINT}/${id}`, data),
  patchField: (id: number | string, data: Partial<MutualFundField>) => apiClient.patch<MutualFundField>(`${FIELD_ENDPOINT}/${id}`, data),
  deleteField: (id: number | string) => apiClient.delete<any>(`${FIELD_ENDPOINT}/${id}`),
};
