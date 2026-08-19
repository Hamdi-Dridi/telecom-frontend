import React from 'react';

export default function PlaceholderView({ title, note }) {
  return (
    <div className="view active">
      <div className="card">
        <h3>{title}</h3>
        <div className="hint">{note} — sera construit dans une prochaine phase.</div>
      </div>
    </div>
  );
}
