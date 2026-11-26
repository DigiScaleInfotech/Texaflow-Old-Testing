'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Star, 
  Tag, 
  Calendar, 
  Check,
  AlertTriangle,
  CreditCard,
  Receipt
} from 'lucide-react';
import Link from 'next/link';
import SubscriptionDialog from '@/components/vendors/SubscriptionDialog';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  isActive: boolean;
}

export default function VendorSubscriptionPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  
  useEffect(() => {
    // Get the current user type and subscription info
    const type = localStorage.getItem('userType');
    setUserType(type);
    
    // Get the current subscription plan
    const planId = localStorage.getItem('vendorSubscriptionPlan');
    setCurrentPlan(planId);
  }, []);

  // Sample subscription plans
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'plan-1',
      name: 'Basic',
      price: 999,
      billingCycle: 'monthly',
      features: ['5 products listing', 'Basic analytics', 'Email support'],
      isActive: true
    },
    {
      id: 'plan-2',
      name: 'Professional',
      price: 2499,
      billingCycle: 'monthly',
      features: [
        'Unlimited product listings', 
        'Advanced analytics', 
        'Priority email support',
        'Featured placement in search'
      ],
      isActive: true
    },
    {
      id: 'plan-3',
      name: 'Enterprise',
      price: 9999,
      billingCycle: 'quarterly',
      features: [
        'Unlimited product listings',
        'Premium analytics dashboard',
        'Dedicated account manager',
        'Featured placement in search',
        'Bulk order processing',
        'API access'
      ],
      isActive: true
    }
  ];
  
  // Get current subscription plan details
  const getCurrentPlan = () => {
    return subscriptionPlans.find(plan => plan.id === currentPlan) || null;
  };
  
  const plan = getCurrentPlan();
  
  // Only vendors can access this page
  if (userType !== 'vendor') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg p-4 text-sm text-red-800 dark:text-red-300 flex items-start gap-3 max-w-lg">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Access Restricted</p>
            <p>This page is only accessible to vendor accounts.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If no subscription yet, show the subscription dialog directly
  if (!plan && !showDialog) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3 max-w-lg">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">No Active Subscription</p>
            <p>You don't have an active subscription plan yet.</p>
          </div>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Choose a Subscription Plan
        </button>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        
        <button
          onClick={() => setShowDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
        >
          Change Plan
        </button>
      </div>
      
      {/* Current Subscription */}
      {plan && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current Subscription</h2>
          </div>
          
          <div className="p-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <Star size={24} className="text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{plan.name} Plan</h3>
                    <div className="flex items-center mt-1">
                      <Tag size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                      <span className="ml-1 text-gray-500 dark:text-gray-400">
                        /{plan.billingCycle}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 mb-2">
                    <Check size={12} className="mr-1" /> Active
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar size={14} className="mr-1" />
                    Next billing: July 30, 2024
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Plan Features</h3>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Method</h3>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center mb-4">
                    <CreditCard size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">XXXX XXXX XXXX 4242</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expires 12/2025</p>
                    </div>
                  </div>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-800 dark:hover:text-blue-300">
                    Update payment method
                  </button>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Billing History</h4>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-center">
                        <Receipt size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">June 30, 2024</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">₹{plan.price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <Receipt size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">May 30, 2024</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">₹{plan.price.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription Dialog */}
      <SubscriptionDialog 
        isOpen={showDialog} 
        onClose={() => setShowDialog(false)} 
      />
    </motion.div>
  );
}
