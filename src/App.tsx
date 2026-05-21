/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, useOutletContext } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNavbar from './components/BottomNavbar';
import Hero from './components/Hero';
import AvailabilityWidget from './components/AvailabilityWidget';
import TransparencyDashboard from './components/TransparencyDashboard';
import FacilitiesGrid from './components/FacilitiesGrid';
import GallerySection from './components/GallerySection';
import FAQSection from './components/FAQSection';
import FeedbackSection from './components/FeedbackSection';
import ContactSection from './components/ContactSection';
import AnnouncementTicker from './components/AnnouncementTicker';
import Footer from './components/Footer';
import AdminLayout from './components/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import FinanceManager from './pages/admin/FinanceManager';
import BookingManager from './pages/admin/BookingManager';
import ContentManager from './pages/admin/ContentManager';
import InventoryManager from './pages/admin/InventoryManager';
import AccountRules from './pages/admin/AccountRules';
import RulesProcedures from './pages/RulesProcedures';
import Login from './pages/admin/Login';
import BookingModal from './components/ui/BookingModal';

function MainLayout() {
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<string | undefined>();

  const openBooking = (pkg?: string) => {
    setSelectedPackage(pkg);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <AnnouncementTicker />
      <Navbar onOpenBooking={() => openBooking()} />
      <div className="flex-grow">
        <Outlet context={{ openBooking }} />
        <Footer />
      </div>
      <BottomNavbar onOpenBooking={() => openBooking()} />
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        selectedPackage={selectedPackage}
      />
    </div>
  );
}

function LandingPage() {
  const { openBooking } = useOutletContext() as { openBooking: (pkg?: string) => void };

  return (
    <main>
      <Hero onOpenBooking={() => openBooking()} />
      <AvailabilityWidget />
      <FacilitiesGrid onOpenBooking={(pkg) => openBooking(pkg)} />
      <GallerySection />
      <FAQSection />
      <FeedbackSection />
      <ContactSection />
      <TransparencyDashboard />
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/rules" element={<RulesProcedures />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="bookings" element={<BookingManager />} />
          <Route path="finance" element={<FinanceManager />} />
          <Route path="inventory" element={<InventoryManager />} />
          <Route path="rules" element={<AccountRules />} />
          <Route path="settings" element={<ContentManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
