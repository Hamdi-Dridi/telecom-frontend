import React from 'react';
import ExportActions from './export/ExportActions.jsx';
import ImportPanel from './export/ImportPanel.jsx';
import ResetDataCard from './export/ResetDataCard.jsx';
import PrintReport from './export/PrintReport.jsx';

export default function ExportView() {
  return (
    <div className="view active">
      <ExportActions onPrint={() => window.print()} />
      <ImportPanel />
      <ResetDataCard />
      <PrintReport />
    </div>
  );
}
