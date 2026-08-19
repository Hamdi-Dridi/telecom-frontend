import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { kpiApi } from '../api/kpi.js';
import { unwrapList } from '../api/client.js';

const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function nextPeriodLabel(label) {
  const [monthName, yearStr] = label.split(' ');
  const idx = MONTH_NAMES_FR.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  const year = parseInt(yearStr, 10);
  if (idx === -1 || isNaN(year)) return null;
  const nextIdx = (idx + 1) % 12;
  const nextYear = idx === 11 ? year + 1 : year;
  return MONTH_NAMES_FR[nextIdx] + ' ' + nextYear;
}

function realCurrentPeriodLabel() {
  const now = new Date();
  return MONTH_NAMES_FR[now.getMonth()] + ' ' + now.getFullYear();
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  // periodObjects: full {id, label, month, year, order} rows from the API,
  // sorted by order. `periods` (array of label strings) is derived from
  // this and kept as the public shape every display component already
  // expects — so most of the app never needs to know periods have real
  // database ids now.
  const [periodObjects, setPeriodObjects] = useState([]);
  const [regionObjects, setRegionObjects] = useState([]);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');
  const [hiddenStatuses, setHiddenStatuses] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshPeriods = useCallback(async () => {
    const data = await kpiApi.listPeriods();
    const list = unwrapList(data).sort((a, b) => a.order - b.order);
    setPeriodObjects(list);
    return list;
  }, []);

  /** Ensures today's real month exists as a Period, adding gap months one
   *  at a time via the API if needed (mirrors the old local-only rolling
   *  calendar logic, now backed by the server). Creating a period is an
   *  admin-only write on the backend — if the current visitor isn't logged
   *  in yet (or isn't an admin), this simply can't happen and we fall back
   *  to whatever the last existing period is; the gap fills in by itself
   *  next time an admin has the app open. */
  const ensureCurrentPeriod = useCallback(async (list) => {
    const label = realCurrentPeriodLabel();
    let current = list;
    let guard = 0;
    while (!current.some(p => p.label === label) && guard < 240) {
      try {
        await kpiApi.addNextPeriod();
      } catch (e) {
        break; // not allowed (not authenticated yet, or not an admin) — degrade gracefully
      }
      current = await refreshPeriods();
      guard++;
    }
    return current;
  }, [refreshPeriods]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError('');
        const [regionsData, periodsListRaw] = await Promise.all([
          kpiApi.listRegions(),
          kpiApi.listPeriods(),
        ]);
        if (cancelled) return;
        const regionsList = unwrapList(regionsData);
        let periodsList = unwrapList(periodsListRaw).sort((a, b) => a.order - b.order);
        periodsList = await ensureCurrentPeriod(periodsList);
        if (cancelled) return;

        setRegionObjects(regionsList);
        setPeriodObjects(periodsList);
        setRegion(regionsList[0]?.name || '');

        const label = realCurrentPeriodLabel();
        const idx = periodsList.findIndex(p => p.label === label);
        const finalIdx = idx !== -1 ? idx : periodsList.length - 1;
        setCurrentPeriodIndex(finalIdx);
        setPeriodIndex(finalIdx);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Impossible de charger les données de référence.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ensureCurrentPeriod]);

  const periods = useMemo(() => periodObjects.map(p => p.label), [periodObjects]);
  const regions = useMemo(() => regionObjects.map(r => r.name), [regionObjects]);

  /** Adds the next month to the rolling calendar (used by "Planifier un
   *  objectif" when the admin plans a month that doesn't exist yet).
   *  Async now — API-backed — returns the new period object {id, label, ...}
   *  straight from the freshly-refetched list, so callers never have to
   *  worry about their own closures being stale. */
  const addPeriod = useCallback(async (label) => {
    const existingIdx = periods.indexOf(label);
    if (existingIdx !== -1) return periodObjects[existingIdx];
    await kpiApi.addNextPeriod();
    const list = await refreshPeriods();
    return list.find(p => p.label === label) || null;
  }, [periods, periodObjects, refreshPeriods]);

  const nextAvailablePeriodLabel = useMemo(
    () => (periods.length ? nextPeriodLabel(periods[periods.length - 1]) : null),
    [periods]
  );

  const toggleStatusFilter = (status) => {
    setHiddenStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  };

  const currentPeriodObj = periodObjects[periodIndex] || null;
  const currentRegionObj = regionObjects.find(r => r.name === region) || null;

  const value = {
    periods, periodObjects, currentPeriodIndex,
    periodIndex, setPeriodIndex,
    currentPeriodId: currentPeriodObj?.id ?? null,
    region, setRegion, regions, regionObjects,
    currentRegionId: currentRegionObj?.id ?? null,
    search, setSearch,
    hiddenStatuses, toggleStatusFilter,
    addPeriod, nextAvailablePeriodLabel,
    goToCurrentPeriod: () => setPeriodIndex(currentPeriodIndex),
    loading, error,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
