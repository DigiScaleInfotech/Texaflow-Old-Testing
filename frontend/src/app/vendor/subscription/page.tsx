'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubscriptionDialog from '@/components/vendors/SubscriptionDialog';
import AuthCheck from '@/components/Auth/AuthCheck';

export default function VendorSubscriptionPage() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Check if the user is already subscribed or has skipped
    const hasSubscription = localStorage.getItem('vendorSubscriptionPlan');
    const hasSkipped = localStorage.getItem('vendorSubscriptionSkipped');
    
    if (hasSubscription || hasSkipped) {
      // If already handled subscription, redirect to dashboard
      router.push('/dashboard');
    } else {
      // Show subscription dialog
      setShowDialog(true);
    }
  }, [router]);

  const handleCloseDialog = () => {
    // When dialog is closed, redirect to dashboard
    setShowDialog(false);
    router.push('/dashboard');
  };

  return (
    <AuthCheck requiredUserType="vendor">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#202936] dark:to-[#202936]">
        <SubscriptionDialog isOpen={showDialog} onClose={handleCloseDialog} />
      </div>
    </AuthCheck>
  );
}
