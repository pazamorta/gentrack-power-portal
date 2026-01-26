import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';

import { Footer } from './components/Footer';
import { EnergyDomainsPage } from './pages/EnergyDomainsPage';
import { StoragePage } from './pages/StoragePage';
import { SolutionsPage } from './pages/SolutionsPage';
import { CustomerInformationPage } from './pages/CustomerInformationPage';
import { InsightsPage } from './pages/InsightsPage';
import { AboutPage } from './pages/AboutPage';
import { ScrollToHashElement } from './components/ScrollToHashElement';

import { GetStartedPage } from './pages/GetStartedPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { LoginPage } from './pages/LoginPage';
import { ScrollToTop } from './components/ScrollToTop';

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
    </>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <>
      <ScrollToTop />
      <div className="relative min-h-screen text-primary font-sans selection:bg-white/20">
        <div className="relative z-10">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/energy-domains" element={<EnergyDomainsPage />} />
              <Route path="/storage" element={<StoragePage />} />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/platform" element={<CustomerInformationPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/get-started" element={<GetStartedPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
              <Route path="*" element={<div className="pt-32 text-center text-white">404 - Page Not Found: {location.pathname}</div>} />
            </Routes>
          </main>
          {!isHomePage && location.pathname !== '/solutions' && location.pathname !== '/storage' && location.pathname !== '/about' && <Footer />}
        </div>
        <ScrollToHashElement />
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;