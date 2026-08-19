import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { kpiApi } from '../api/kpi.js';
import { unwrapList, getToken } from '../api/client.js';
import { useAppState } from './AppStateContext.jsx';
import { useAuth } from './AuthContext.jsx';

const KpiDataContext = createContext(null);

/** Normalizes a KPIResult row from the API (snake_case-ish field names
 *  chosen server-side) into the shape components already use. Taux/Score/
 *  Statut arrive pre-computed from the backend now — no client math. */
function normalizeResultRow(r) {
  return {
    id: r.id, kpiId: r.kpi, name: r.kpi_name, domain: r.domain, sub: r.group,
    period: r.period, region: r.region_name,
    weight: r.weight, realisation: r.realisation, objectif: r.objectif,
    taux: r.taux, score: r.score, statut: r.statut, statutLabel: r.statut_label,
    comment: r.comment, validation: r.validation,
  };
}

function normalizeKpi(k) {
  return {
    id: k.id, domain: k.domain, sub: k.group, name: k.name, unit: k.unit,
    weight: k.weight, isCustom: k.is_custom, isRetired: k.is_retired,
  };
}

export function KpiDataProvider({ children }) {
  const { currentPeriodId, region, periodIndex } = useAppState();
  const { currentUser } = useAuth();

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  const [kpis, setKpis] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  const refreshOverview = useCallback(async () => {
    if (currentPeriodId == null || !region) return;
    try {
      setOverviewLoading(true); setOverviewError('');
      const data = await kpiApi.overview(currentPeriodId, region);
      setOverview(data);
    } catch (e) {
      setOverviewError(e.message || 'Impossible de charger la Vue d\'ensemble.');
    } finally {
      setOverviewLoading(false);
    }
  }, [currentPeriodId, region]);

  const refreshResults = useCallback(async () => {
    if (currentPeriodId == null || !region) return;
    try {
      setResultsLoading(true);
      const data = await kpiApi.listResults(currentPeriodId, region, true);
      setResults(unwrapList(data).map(normalizeResultRow));
    } finally {
      setResultsLoading(false);
    }
  }, [currentPeriodId, region]);

  const refreshKpis = useCallback(async () => {
    const data = await kpiApi.listKpis(false);
    setKpis(unwrapList(data).map(normalizeKpi));
  }, []);

  const refreshPlans = useCallback(async () => {
    const data = await kpiApi.listPlans();
    setPlans(unwrapList(data));
  }, []);

  const refreshActivity = useCallback(async () => {
    const data = await kpiApi.listActivity();
    setActivityLog(unwrapList(data));
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshOverview(), refreshResults(), refreshKpis(), refreshPlans(), refreshActivity()]);
  }, [refreshOverview, refreshResults, refreshKpis, refreshPlans, refreshActivity]);

  // Re-fetch everything whenever the logged-in state, period, or region
  // changes. currentUser is included so login/logout re-triggers this even
  // when period/region were already resolved (they're public endpoints
  // fetched before login) — otherwise Vue d'ensemble would stay stuck on
  // its initial loading state after signing in.
  useEffect(() => {
    if (!getToken() || !currentUser) return;
    refreshOverview();
    refreshResults();
    refreshKpis();
    refreshPlans();
    refreshActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPeriodId, region, periodIndex, currentUser]);

  // ---- Mutations — each hits the API, then refreshes whatever views depend on it ----

  const updateResult = useCallback(async (resultId, patch) => {
    await kpiApi.updateResult(resultId, patch);
    await Promise.all([refreshResults(), refreshOverview(), refreshActivity()]);
  }, [refreshResults, refreshOverview, refreshActivity]);

  const setWeight = useCallback(async (kpiId, value) => {
    await kpiApi.updateKpi(kpiId, { weight: value });
    await Promise.all([refreshKpis(), refreshResults(), refreshOverview()]);
  }, [refreshKpis, refreshResults, refreshOverview]);

  // Full-field edit (name, domain, sub-group, unit, weight) — domain/group
  // are resolved-or-created by name server-side, same as creation.
  const editKpi = useCallback(async (kpiId, { domain, sub, name, unit, weight }) => {
    const patch = {};
    if (domain !== undefined) patch.domain = domain;
    if (sub !== undefined) patch.group = sub;
    if (name !== undefined) patch.name = name;
    if (unit !== undefined) patch.unit = unit;
    if (weight !== undefined) patch.weight = weight;
    await kpiApi.updateKpi(kpiId, patch);
    await refreshAll();
  }, [refreshAll]);

  // Standalone creation — just the indicator itself, with a starting value
  // for the currently-selected period/region. Unlike addCustomKpi (used by
  // the planning form), this doesn't also create a KPIPlan.
  const createIndicator = useCallback(async ({ domain, sub, name, unit, weight, base }) => {
    const created = await kpiApi.createKpi({ domain, group: sub, name, unit: unit || '%', weight: weight ?? 1 });
    if (base !== undefined && base !== null && base !== '' && currentPeriodId != null && region) {
      const freshResults = await kpiApi.listResults(currentPeriodId, region, false);
      const row = unwrapList(freshResults).find(r => r.kpi === created.id);
      if (row) await kpiApi.updateResult(row.id, { realisation: base });
    }
    await refreshAll();
    return created.id;
  }, [currentPeriodId, region, refreshAll]);

  const deleteKpi = useCallback(async (id) => {
    await kpiApi.deleteKpi(id);
    await refreshAll();
  }, [refreshAll]);

  const addCustomKpi = useCallback(async ({ domain, sub, name, base, target, weight }) => {
    const created = await kpiApi.createKpi({ domain, group: sub, name, weight: weight ?? 1 });
    // Seed this period/region's result row with the starting values, since
    // the backend creates the KPI with blank results everywhere.
    const freshResults = await kpiApi.listResults(currentPeriodId, region, false);
    const row = unwrapList(freshResults).find(r => r.kpi === created.id);
    if (row) {
      await kpiApi.updateResult(row.id, { realisation: base, objectif: target && target > 0 ? target : 100 });
    }
    await refreshAll();
    return created.id;
  }, [currentPeriodId, region, refreshAll]);

  const retireKpi = useCallback(async (id) => {
    await kpiApi.retireKpi(id);
    await refreshAll();
  }, [refreshAll]);

  const restoreKpi = useCallback(async (id) => {
    await kpiApi.restoreKpi(id);
    await refreshAll();
  }, [refreshAll]);

  const addPlan = useCallback(async ({ kpiId, target, months, sites }) => {
    // months/sites here are arrays of *ids* (period ids, region ids) —
    // callers resolve those from index/name before calling this.
    await kpiApi.createPlan({ kpi: kpiId, target, periods: months, regions: sites });
    await refreshAll();
  }, [refreshAll]);

  const removePlan = useCallback(async (id) => {
    await kpiApi.deletePlan(id);
    await refreshPlans();
  }, [refreshPlans]);

  const importFile = useCallback(async (file) => {
    const summary = await kpiApi.importFile(file, currentPeriodId, region);
    await refreshAll();
    return summary;
  }, [currentPeriodId, region, refreshAll]);

  const resetData = useCallback(async () => {
    await kpiApi.reset();
    await refreshAll();
  }, [refreshAll]);

  const value = {
    overview, overviewLoading, overviewError, refreshOverview,
    results, resultsLoading, refreshResults,
    kpis, refreshKpis,
    plans, refreshPlans,
    activityLog, refreshActivity,
    updateResult, setWeight, editKpi, createIndicator, deleteKpi, addCustomKpi, retireKpi, restoreKpi,
    addPlan, removePlan, importFile, resetData,
    refreshAll,
  };

  return <KpiDataContext.Provider value={value}>{children}</KpiDataContext.Provider>;
}

export function useKpiData() {
  const ctx = useContext(KpiDataContext);
  if (!ctx) throw new Error('useKpiData must be used within a KpiDataProvider');
  return ctx;
}
