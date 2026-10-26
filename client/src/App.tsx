import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CityModal } from './components/CityModal';
import { AuthModal } from './components/AuthModal';

// Pages
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { ShowtimesPage } from './pages/ShowtimesPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { OffersPage } from './pages/OffersPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { HelpPage } from './pages/HelpPage';
import { CancellationPolicyPage, TermsPage, PrivacyPage } from './pages/PolicyPages';

export function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <CityProvider>
            <div className="flex flex-col min-h-screen bg-[#08090C] text-[#F1F5F9]">
              <Navbar />

              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/movie/:identifier" element={<MovieDetailsPage />} />
                  <Route path="/showtimes" element={<ShowtimesPage />} />
                  <Route path="/seats/:showtimeId" element={<SeatSelectionPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
                  <Route path="/my-bookings" element={<MyBookingsPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <Footer />

              {/* Global Modals */}
              <CityModal />
              <AuthModal />
            </div>
          </CityProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
