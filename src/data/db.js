// The 10 database entities (Role, User, Region, Period, KPIDomain, KPIGroup,
// KPI, KPIResult, ScoreSnapshot, IndicatorThreshold) — imported directly as
// ES modules. Vite bundles JSON imports at build time, so (unlike the
// vanilla-JS version) no fetch()/CORS dance is needed here.
import roles from './roles.json';
import users from './users.json';
import regions from './regions.json';
import periods from './periods.json';
import domains from './domains.json';
import groups from './groups.json';
import kpis from './kpis.json';
import kpiResults from './kpi_results.json';
import scoreSnapshots from './score_snapshots.json';
import thresholds from './indicator_thresholds.json';

export const DB = {
  roles, users, regions, periods, domains, groups,
  kpis, kpiResults, scoreSnapshots, thresholds,
};

export function roleByKey(key) { return DB.roles.find(r => r.key === key); }
export function roleById(id) { return DB.roles.find(r => r.id === id); }
export function regionById(id) { return DB.regions.find(r => r.id === id); }
export function regionByName(name) { return DB.regions.find(r => r.name === name); }
export function domainById(id) { return DB.domains.find(d => d.id === id); }
export function groupById(id) { return DB.groups.find(g => g.id === id); }
export function defaultThreshold() {
  return DB.thresholds.find(t => t.kpiId === null) ||
    { greenMin: 100, orangeMin: 80, colors: { green: '#2FC299', orange: '#F7A94A', red: '#EF5A6F' } };
}

// Resolves each KPI's domainId/groupId to display names, and carries the
// original entity id along as kpiRefId — mirrors the adapter used in the
// vanilla-JS version so the rest of the app can work with plain
// {domain, sub, name, ...} objects without re-deriving lookups everywhere.
export const BASE_KPIS = DB.kpis.map(k => ({
  domain: domainById(k.domainId)?.name ?? '—',
  sub: groupById(k.groupId)?.name ?? '—',
  name: k.name,
  base: k.base,
  weight: k.weight,
  unit: k.unit,
  kpiRefId: k.id,
}));

export const SEED_PERIOD_LABELS = DB.periods
  .slice()
  .sort((a, b) => a.order - b.order)
  .map(p => p.label);

export function seedResultsFor(kpiRefId) {
  const rows = DB.kpiResults.filter(r => r.kpiId === kpiRefId);
  const byPeriodId = {};
  rows.forEach(r => { byPeriodId[r.periodId] = r; });
  return DB.periods
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(p => (byPeriodId[p.id] ? byPeriodId[p.id].realisation : null));
}

export function seedResultRow(kpiId, periodLabel) {
  const period = DB.periods.find(p => p.label === periodLabel);
  if (!period) return null;
  return DB.kpiResults.find(r => r.kpiId === kpiId && r.periodId === period.id) || null;
}

export const REGION_NAMES = DB.regions.map(r => r.name);
