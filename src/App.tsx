/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AvailabilityWidget from './components/AvailabilityWidget';
import TransparencyDashboard from './components/TransparencyDashboard';
import FacilitiesGrid from './components/FacilitiesGrid';
import Footer from './components/Footer';
import AdminLayout from './components/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import FinanceManager from './pages/admin/FinanceManager';
import BookingManager from './pages/admin/BookingManager';
import ContentManager from './pages/admin/ContentManager';
import AccountRules from './pages/admin/AccountRules';
import RulesProcedures from './pages/RulesProcedures';
import Login from './pages/admin/Login';
import BookingModal from './components/ui/BookingModal';

function LandingPage() {
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<string | undefined>();

  const openBooking = (pkg?: string) => {
    setSelectedPackage(pkg);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar onOpenBooking={() => openBooking()} />
      <main>
        <Hero onOpenBooking={() => openBooking()} />
        <AvailabilityWidget />
        <FacilitiesGrid onOpenBooking={(pkg) => openBooking(pkg)} />
        <TransparencyDashboard />
      </main>
      <Footer />
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        selectedPackage={selectedPackage}
      />
    </div>
  );
}

// Simple placeholder components for admin routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
    <p className="text-gray-500 italic">Fitur ini sedang dalam pengembangan oleh Teras RT 02 Digital Ecosystem.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/rules" element={<RulesProcedures />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="bookings" element={<BookingManager />} />
          <Route path="finance" element={<FinanceManager />} />
          <Route path="rules" element={<AccountRules />} />
          <Route path="settings" element={<ContentManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
