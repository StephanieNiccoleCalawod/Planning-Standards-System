import { getToken, clearToken } from './auth';
const API_BASE = '/api';

async function request(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearToken();
      throw new Error('Your session has expired. Please log in again via ARMS.');
    }

    if (response.status === 503) {
      throw new Error('Authentication service (ARMS) is unreachable. Please try again later.');
    }

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody?.message) {
          errorMsg = Array.isArray(errBody.message)
            ? errBody.message.join(', ')
            : errBody.message;
        }
      } catch (_) { }
      throw new Error(errorMsg);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  } catch (err) {
    console.error(`API request to ${url} failed.`, err);
    throw err;
  }
}

export const api = {
  // Service Catalogue
  getServices: (params = {}) => {
    const query = new URLSearchParams();
    if (params.classification) query.append('classification', params.classification);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.include_archived !== undefined) query.append('include_archived', params.include_archived);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const queryString = query.toString();
    return request(`/services${queryString ? `?${queryString}` : ''}`);
  },
  getServiceById: (id) => request(`/services/${id}`),
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveService: (id) => request(`/services/${id}/archive`, { method: 'PATCH' }),
  activateService: (id) => request(`/services/${id}/activate`, { method: 'PATCH' }),
  deactivateService: (id) => request(`/services/${id}/deactivate`, { method: 'PATCH' }),

  // Service Intake Fields
  getIntakeFields: (serviceId) => request(`/services/${serviceId}/intake-fields`),
  createIntakeField: (serviceId, data) => request(`/services/${serviceId}/intake-fields`, { method: 'POST', body: JSON.stringify(data) }),
  updateIntakeField: (serviceId, fieldId, data) => request(`/services/${serviceId}/intake-fields/${fieldId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIntakeField: (serviceId, fieldId) => request(`/services/${serviceId}/intake-fields/${fieldId}`, { method: 'DELETE' }),

  // Service NA Flags
  getNaFlags: (serviceId) => request(`/services/${serviceId}/na-flags`),
  createNaFlag: (serviceId, data) => request(`/services/${serviceId}/na-flags`, { method: 'POST', body: JSON.stringify(data) }),
  deleteNaFlag: (serviceId, flagId) => request(`/services/${serviceId}/na-flags/${flagId}`, { method: 'DELETE' }),

  // KPIs
  getKpis: (params = {}) => {
    const query = new URLSearchParams();
    if (params.service_id) query.append('service_id', params.service_id);
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);
    if (params.include_inactive !== undefined) query.append('include_inactive', params.include_inactive);

    const queryString = query.toString();
    return request(`/kpis${queryString ? `?${queryString}` : ''}`);
  },

  createKpi: (data) => request('/kpis', { method: 'POST', body: JSON.stringify(data) }),
  updateKpi: (id, data) => request(`/kpis/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKpi: (id) => request(`/kpis/${id}`, { method: 'DELETE' }),

  // SLA Rules
  getSlaRules: () => request('/sla-rules'),
  createSlaRule: (data) => request('/sla-rules', { method: 'POST', body: JSON.stringify(data) }),
  updateSlaRule: (id, data) => request(`/sla-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  restoreSlaVersion: (id, versionId) => request(`/sla-rules/${id}/versions/${versionId}/restore`, { method: 'PATCH' }),

  // Holidays
  getHolidays: (params = {}) => {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.year) query.append('year', params.year);
    if (params.type) query.append('type', params.type);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    return request(`/holidays${queryString ? `?${queryString}` : ''}`);
  },
  createHoliday: (data) => request('/holidays', { method: 'POST', body: JSON.stringify(data) }),
  updateHoliday: (id, data) => request(`/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHoliday: (id) => request(`/holidays/${id}`, { method: 'DELETE' }),

  // Evaluation Periods
  getPeriods: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    return request(`/periods${queryString ? `?${queryString}` : ''}`);
  },
  createPeriod: (data) => request('/periods', { method: 'POST', body: JSON.stringify(data) }),
  updatePeriod: (id, data) => request(`/periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  closePeriod: (id) => request(`/periods/${id}/complete`, { method: 'PATCH' }),
  deletePeriod: (id) => request(`/periods/${id}`, { method: 'DELETE' }),

  // Commitments
  getCommitments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.period_id) query.append('period_id', params.period_id);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const queryString = query.toString();
    return request(`/commitments${queryString ? `?${queryString}` : ''}`);
  },
  getCommitmentById: (id) => request(`/commitments/${id}`),
  createCommitment: (data) => request('/commitments', { method: 'POST', body: JSON.stringify(data) }),
  updateCommitment: (id, data) => request(`/commitments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  lockCommitment: (id) => request(`/commitments/${id}/lock`, { method: 'PATCH' }),

  // Dashboard
  getDashboardSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.office) query.append('office', params.office);
    const queryString = query.toString();
    return request(`/dashboard/summary${queryString ? `?${queryString}` : ''}`);
  },

  // Offices (dynamic integration)
  getOffices: () => request('/offices'),

  // SLA Monitor
  getSlaComputationLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.service_id) query.append('service_id', params.service_id);
    if (params.transaction_id) query.append('transaction_id', params.transaction_id);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const queryString = query.toString();
    return request(`/sla-computation-logs${queryString ? `?${queryString}` : ''}`);
  },
  getServiceUtilization: () => request('/service-utilization'),
};
