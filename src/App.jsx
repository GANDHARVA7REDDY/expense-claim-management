import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme.js';
import { AppProvider } from './context/AppContext.jsx';
import Layout from './components/Layout.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Claims from './pages/Claims.jsx';
import ClaimForm from './pages/ClaimForm.jsx';
import ClaimDetails from './pages/ClaimDetails.jsx';
import Approvals from './pages/Approvals.jsx';
import Finance from './pages/Finance.jsx';
import Employees from './pages/Employees.jsx';
import Categories from './pages/Categories.jsx';
import Reports from './pages/Reports.jsx';
import History from './pages/History.jsx';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<RoleRoute feature="dashboard"><Dashboard /></RoleRoute>} />
              <Route path="/claims" element={<RoleRoute feature="claims"><Claims /></RoleRoute>} />
              <Route path="/claims/new" element={<RoleRoute feature="claims"><ClaimForm key="new" /></RoleRoute>} />
              <Route path="/claims/:id/edit" element={<RoleRoute feature="claims"><ClaimForm key="edit" /></RoleRoute>} />
              <Route path="/claims/:id" element={<RoleRoute feature="claims"><ClaimDetails /></RoleRoute>} />
              <Route path="/approvals" element={<RoleRoute feature="approvals"><Approvals /></RoleRoute>} />
              <Route path="/finance" element={<RoleRoute feature="finance"><Finance /></RoleRoute>} />
              <Route path="/employees" element={<RoleRoute feature="employees"><Employees /></RoleRoute>} />
              <Route path="/categories" element={<RoleRoute feature="categories"><Categories /></RoleRoute>} />
              <Route path="/reports" element={<RoleRoute feature="reports"><Reports /></RoleRoute>} />
              <Route path="/history" element={<RoleRoute feature="history"><History /></RoleRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
