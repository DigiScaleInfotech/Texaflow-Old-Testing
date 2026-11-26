'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import AuthCheck from '@/components/Auth/AuthCheck';
import SubscriptionDialog from '@/components/vendors/SubscriptionDialog';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showSubscription, setShowSubscription] = useState(false);
  
  useEffect(() => {
    // Check if the user is a vendor and hasn't chosen a subscription yet
    const userType = localStorage.getItem('userType');
    const hasSubscription = localStorage.getItem('vendorSubscriptionPlan');
    const hasSkipped = localStorage.getItem('vendorSubscriptionSkipped');
    
    if (userType === 'vendor' && !hasSubscription && !hasSkipped) {
      setShowSubscription(true);
    }
  }, []);
  
  const handleCloseSubscription = () => {
    setShowSubscription(false);
    // Mark as skipped if they close without selecting
    localStorage.setItem('vendorSubscriptionSkipped', 'true');
  };
  
  return (
    <AuthCheck>
      <DashboardLayout>
        {children}
        
        {/* Subscription dialog for vendors */}
        {showSubscription && (
          <SubscriptionDialog 
            isOpen={showSubscription} 
            onClose={handleCloseSubscription} 
          />
        )}
      </DashboardLayout>
    </AuthCheck>
  );
}
