import { api } from './client.js';

export const kpiApi = {
  // Reference data
  listRegions: () => api.get('/regions/'),
  listPeriods: () => api.get('/periods/'),
  addNextPeriod: () => api.post('/periods/add_next/'),
  listDomains: () => api.get('/domains/'),
  listGroups: () => api.get('/groups/'),
  listThresholds: () => api.get('/thresholds/'),

  // KPI catalogue (admin-managed)
  listKpis: (activeOnly = false) => api.get(`/kpis/${activeOnly ? '?active_only=true' : ''}`),
  createKpi: (payload) => api.post('/kpis/', payload),
  updateKpi: (id, payload) => api.patch(`/kpis/${id}/`, payload),
  deleteKpi: (id) => api.delete(`/kpis/${id}/`),
  retireKpi: (id) => api.post(`/kpis/${id}/retire/`),
  restoreKpi: (id) => api.post(`/kpis/${id}/restore/`),

  // KPI results (Objectifs page — Manager+Admin write, everyone reads)
  listResults: (periodId, regionName, activeOnly = true) => {
    const params = new URLSearchParams();
    if (periodId != null) params.set('period', periodId);
    if (regionName) params.set('region', regionName);
    if (activeOnly) params.set('active_only', 'true');
    return api.get(`/kpi-results/?${params.toString()}`);
  },
  updateResult: (id, payload) => api.patch(`/kpi-results/${id}/`, payload),

  // Planning
  listPlans: () => api.get('/plans/'),
  createPlan: (payload) => api.post('/plans/', payload),
  deletePlan: (id) => api.delete(`/plans/${id}/`),

  // Dashboard aggregation
  overview: (periodId, regionName) => {
    const params = new URLSearchParams();
    if (periodId != null) params.set('period', periodId);
    if (regionName) params.set('region', regionName);
    return api.get(`/dashboard/overview/?${params.toString()}`);
  },
  history: (regionName, mode = 'monthly') => {
    const params = new URLSearchParams({ mode });
    if (regionName) params.set('region', regionName);
    return api.get(`/dashboard/history/?${params.toString()}`);
  },

  // Activity log
  listActivity: () => api.get('/activity/'),

  // Export / Import / Reset
  exportCsvUrl: (periodId, regionName) => {
    const params = new URLSearchParams();
    if (periodId != null) params.set('period', periodId);
    if (regionName) params.set('region', regionName);
    return `/export/csv/?${params.toString()}`;
  },
  exportJsonUrl: (periodId, regionName) => {
    const params = new URLSearchParams();
    if (periodId != null) params.set('period', periodId);
    if (regionName) params.set('region', regionName);
    return `/export/json/?${params.toString()}`;
  },
  importFile: (file, periodId, regionName) => {
    const form = new FormData();
    form.append('file', file);
    if (periodId != null) form.append('period', periodId);
    if (regionName) form.append('region', regionName);
    return api.postForm('/import/', form);
  },
  reset: () => api.post('/reset/'),
};
