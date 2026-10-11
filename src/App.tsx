/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, useOutletContext, useLocation } from 'react-router-dom';
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
import PageLoader from './components/ui/PageLoader';
import BookingModal from './components/ui/BookingModal';
import VendorSection from './components/vendors/VendorSection';
import PWAInstallButton from './components/ui/PWAInstallButton';

// Lazy-loaded pages for optimal performance and smaller bundle size
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const DashboardOverview = React.lazy(() => import('./pages/admin/DashboardOverview'));
const FinanceManager = React.lazy(() => import('./pages/admin/FinanceManager'));
const BookingManager = React.lazy(() => import('./pages/admin/BookingManager'));
const ContentManager = React.lazy(() => import('./pages/admin/ContentManager'));
const InventoryManager = React.lazy(() => import('./pages/admin/InventoryManager'));
const VendorManager = React.lazy(() => import('./pages/admin/VendorManager'));
const AccountRules = React.lazy(() => import('./pages/admin/AccountRules'));
const RulesProcedures = React.lazy(() => import('./pages/RulesProcedures'));
const Login = React.lazy(() => import('./pages/admin/Login'));
const DocumentVerification = React.lazy(() => import('./pages/DocumentVerification'));
const AuditTrailManager = React.lazy(() => import('./pages/admin/AuditTrailManager'));


function MainLayout() {
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<string | undefined>();
  const [selectedDate, setSelectedDate] = React.useState<string | undefined>();

  const openBooking = (pkg?: string, date?: string) => {
    setSelectedPackage(pkg);
    setSelectedDate(date);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full">
      <header className="fixed top-0 left-0 right-0 z-50 shadow-sm">
        <AnnouncementTicker />
        <Navbar onOpenBooking={() => openBooking()} />
      </header>
      <div className="flex-grow w-full">
        <Outlet context={{ openBooking }} />
        <Footer />
      </div>
      <BottomNavbar onOpenBooking={() => openBooking()} />
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedDate(undefined);
        }} 
        selectedPackage={selectedPackage}
        initialDate={selectedDate}
      />
      <PWAInstallButton />
    </div>
  );
}

function LandingPage() {
  const { openBooking } = useOutletContext() as { openBooking: (pkg?: string, date?: string) => void };

  return (
    <main>
      <Hero onOpenBooking={() => openBooking()} />
      <AvailabilityWidget onOpenBooking={openBooking} />
      <FacilitiesGrid onOpenBooking={(pkg) => openBooking(pkg)} />
      <TransparencyDashboard />
      <GallerySection />
      <VendorSection />
      <FAQSection />
      <FeedbackSection />
      <ContactSection />
    </main>
  );
}

import { useAppStore } from './store/useAppStore';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  React.useEffect(() => {
    if (hash) {
      const timer = setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  const initSubscriptions = useAppStore(state => state.initSubscriptions);

  React.useEffect(() => {
    const unsub = initSubscriptions();
    return () => unsub();
  }, [initSubscriptions]);

  return (
    <BrowserRouter>
      <ScrollManager />
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/rules" element={<RulesProcedures />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/verifikasi" element={<DocumentVerification />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="bookings" element={<BookingManager />} />
            <Route path="finance" element={<FinanceManager />} />
            <Route path="inventory" element={<InventoryManager />} />
            <Route path="vendors" element={<VendorManager />} />
            <Route path="rules" element={<AccountRules />} />
            <Route path="audit-logs" element={<AuditTrailManager />} />
            <Route path="settings" element={<ContentManager />} />
          </Route>
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
