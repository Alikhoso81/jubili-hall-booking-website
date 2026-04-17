import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { Page, AdminUser } from './lib/types';
import { getAdminSession } from './lib/adminAuth';

const ADMIN_PAGES: Page[] = ['admin-login', 'admin-dashboard'];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [admin, setAdmin] = useState<AdminUser | null>(getAdminSession);

  const handleNavigate = (page: Page) => {
    if (page === 'admin-dashboard' && !admin) {
      setCurrentPage('admin-login');
      return;
    }
    setCurrentPage(page);
  };

  const handleLogin = (adminUser: AdminUser) => {
    setAdmin(adminUser);
  };

  const isAdminPage = ADMIN_PAGES.includes(currentPage);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'gallery' && <GalleryPage />}
        {currentPage === 'contact' && <ContactPage />}
        {currentPage === 'admin-login' && (
          <AdminLogin onNavigate={handleNavigate} onLogin={handleLogin} />
        )}
        {currentPage === 'admin-dashboard' && admin && (
          <AdminDashboard admin={admin} onNavigate={handleNavigate} />
        )}
        {currentPage === 'admin-dashboard' && !admin && (
          <AdminLogin onNavigate={handleNavigate} onLogin={handleLogin} />
        )}
      </main>
      {!isAdminPage && <Footer onNavigate={handleNavigate} />}
    </div>
  );
}
