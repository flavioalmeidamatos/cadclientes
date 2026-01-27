import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import ClientForm from './pages/ClientForm';
import ClientDelete from './pages/ClientDelete';
import Settings from './pages/Settings';
import { Preloader } from './components/Preloader';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AppContent: React.FC = () => {
  const [loadingPreloader, setLoadingPreloader] = useState(true);
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null; // Or a smaller spinner

  return (
    <>
      {loadingPreloader && <Preloader onComplete={() => setLoadingPreloader(false)} />}

      <div className={loadingPreloader ? 'fixed inset-0 opacity-0 pointer-events-none overflow-hidden' : 'block animate-fade-in'}>
        <Router>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/clients" element={user ? <ClientList /> : <Navigate to="/" />} />
            <Route path="/clients/new" element={user ? <ClientForm mode="create" /> : <Navigate to="/" />} />
            <Route path="/clients/edit/:id" element={user ? <ClientForm mode="edit" /> : <Navigate to="/" />} />
            <Route path="/clients/delete/:id" element={user ? <ClientDelete /> : <Navigate to="/" />} />
            <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
          </Routes>
        </Router>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};


export default App;