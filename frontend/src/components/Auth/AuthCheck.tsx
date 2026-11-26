'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthCheckProps {
  children: React.ReactNode;
  requiredUserType?: 'admin' | 'vendor' | 'both';
}

export default function AuthCheck({ children, requiredUserType = 'both' }: AuthCheckProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated and get user type
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const currentUserType = localStorage.getItem('userType');
    
    setIsAuthenticated(authStatus);
    setUserType(currentUserType);
    setIsLoading(false);
    
    if (!authStatus) {
      router.push('/auth/login');
      return;
    }

    // Check if user has the right type to access this route
    if (requiredUserType !== 'both' && currentUserType !== requiredUserType) {
      // Redirect to appropriate dashboard
      router.push('/dashboard');
    }
  }, [router, requiredUserType, pathname]);

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render children if authenticated and has the right user type
  const hasRightType = requiredUserType === 'both' || userType === requiredUserType;
  return (isAuthenticated && hasRightType) ? <>{children}</> : null;
}
