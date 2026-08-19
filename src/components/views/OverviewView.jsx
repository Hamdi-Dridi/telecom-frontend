import React, { useMemo, useState } from 'react';
import { useKpiData } from '../../context/KpiDataContext.jsx';
import { useAppState } from '../../context/AppStateContext.jsx';
import OverviewHero from './overview/OverviewHero.jsx';
import DomainScoresRow from './overview/DomainScoresRow.jsx';
import RecentTrendCard from './overview/RecentTrendCard.jsx';
import MonthlyTable from './overview/MonthlyTable.jsx';
import InsightsRow from './overview/InsightsRow.jsx';
import KpiCard from '../kpi/KpiCard.jsx';
import KpiDetailModal from '../kpi/KpiDetailModal.jsx';

const DOMAINS_ORDER = ['Commercial', 'Technique', 'Stratégique', 'Financier'];

export default function OverviewView({ onNavigate }) {
  const { overview, overviewLoading, overviewError } = useKpiData();
  const { search, setSearch, hiddenStatuses, toggleStatusFilter } = useAppState();
  const [openRow, setOpenRow] = useState(null);

  const rows = overview?.kpis || [];

  const passesFilters = (row) => {
    if (search && !row.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (hiddenStatuses.has(row.statut)) return false;
    return true;
  };

  const grouped = useMemo(() => {
    return DOMAINS_ORDER.map(domainName => {
      const domainRows = rows.filter(r => r.domain === domainName);
      const subs = [];
      domainRows.forEach(r => { if (!subs.includes(r.group)) subs.push(r.group); });
      return {
        domainName,
        subgroups: subs.map(sub => ({ sub, items: domainRows.filter(r => r.group === sub) })),
        count: domainRows.length,
      };
    }).filter(d => d.count > 0);
  }, [rows]);

  if (overviewLoading && !overview) {
    return <div className="view active"><div className="card"><div className="hint">Chargement de la Vue d'ensemble…</div></div></div>;
  }
  if (overviewError) {
    return <div className="view active"><div className="card"><div className="auth-error show">{overviewError}</div></div></div>;
  }
  if (!overview) return null;

  let anyVisible = false;

  return (
    <div className="view active">
      <OverviewHero
        search={search} onSearchChange={setSearch}
        globalScore={overview.stats.global_score} total={overview.stats.total}
        red={overview.stats.red} orange={overview.stats.orange} green={overview.stats.green}
        hiddenStatuses={hiddenStatuses} onToggleStatus={toggleStatusFilter}
      />

      <DomainScoresRow domainScores={overview.domain_scores} />
      <RecentTrendCard onViewHistory={() => onNavigate('historique')} />

      {grouped.map(({ domainName, subgroups, count }) => (
        <section className="domain" key={domainName}>
          <div className="domain-title">
            <span className="chip">{domainName}</span>
            <h2>{domainName}</h2>
            <span className="count">{count} indicateurs</span>
          </div>
          <div className="subgroups">
            {subgroups.map(({ sub, items }) => {
              const visibleItems = items.filter(passesFilters);
              if (visibleItems.length) anyVisible = true;
              return (
                <div className="subgroup" key={sub}>
                  <h4>{sub}</h4>
                  <div className="kpi-grid">
                    {items.map(row => (
                      <KpiCard key={row.kpi_id} row={row} onOpen={() => setOpenRow(row)} hidden={!passesFilters(row)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {!anyVisible && (
        <div className="empty-state">
          {rows.length === 0
            ? "Aucun indicateur pour le moment — importez un fichier Excel/CSV depuis l'onglet Export, ou ajoutez-en un manuellement depuis Objectifs → Gestion des indicateurs."
            : 'Aucun indicateur ne correspond à votre recherche ou aux filtres actifs.'}
        </div>
      )}

      <MonthlyTable rows={rows} />
      <InsightsRow overview={overview} />

      <KpiDetailModal row={openRow} onClose={() => setOpenRow(null)} />
    </div>
  );
}
