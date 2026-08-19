import React from 'react';
import DomainScoreCard from '../../kpi/DomainScoreCard.jsx';

export default function DomainScoresRow({ domainScores }) {
  return (
    <div className="domain-scores-row">
      {domainScores.map(entry => <DomainScoreCard key={entry.domain} entry={entry} />)}
    </div>
  );
}
