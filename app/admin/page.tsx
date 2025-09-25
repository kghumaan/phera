'use client';

import { useState, useEffect } from 'react';
import AdminPinEntry from '@/components/admin/AdminPinEntry';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already authenticated
    if (typeof window !== 'undefined') {
      const adminAuth = localStorage.getItem('phera_admin_authenticated');
      const adminTimestamp = localStorage.getItem('phera_admin_timestamp');
      
      if (adminAuth === 'true' && adminTimestamp) {
        try {
          const timestamp = parseInt(adminTimestamp);
          const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
          if (isRecent) {
            setIsAuthenticated(true);
          } else {
            // Remove expired admin authentication
            localStorage.removeItem('phera_admin_authenticated');
            localStorage.removeItem('phera_admin_timestamp');
          }
        } catch (error) {
          console.error('Error checking admin authentication:', error);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const handlePinVerified = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <>
      {!isAuthenticated ? (
        <AdminPinEntry onPinVerified={handlePinVerified} />
      ) : (
        <AdminDashboard />
      )}
    </>
  );
}
