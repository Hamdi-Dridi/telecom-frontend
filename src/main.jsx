import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppStateProvider } from './context/AppStateContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { KpiDataProvider } from './context/KpiDataContext.jsx';
import './styles/styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppStateProvider>
      <AuthProvider>
        <KpiDataProvider>
          <App />
        </KpiDataProvider>
      </AuthProvider>
    </AppStateProvider>
  </React.StrictMode>
);
