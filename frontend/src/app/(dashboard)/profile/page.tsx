'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Save, UserCircle, Mail, Lock, Bell, Shield, AlertTriangle, Tag, Calendar, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SubscriptionDialog from '@/components/vendors/SubscriptionDialog';

export default function ProfilePage() {
  const [userType, setUserType] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionCancelling, setSubscriptionCancelling] = useState(false);

  useEffect(() => {
    // Get user type and subscription plan from localStorage
    const type = localStorage.getItem('userType');
    const plan = localStorage.getItem('vendorSubscriptionPlan');
    
    setUserType(type);
    setSubscriptionPlan(plan);
  }, []);

  const handleCancelSubscription = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = () => {
    setSubscriptionCancelling(true);
    
    // Simulate API call to cancel subscription
    setTimeout(() => {
      // Remove subscription from localStorage
      localStorage.removeItem('vendorSubscriptionPlan');
      localStorage.removeItem('vendorSubscriptionSkipped');
      
      setSubscriptionPlan(null);
      setSubscriptionCancelling(false);
      setShowCancelDialog(false);
      
      // Show confirmation message
      alert('Your subscription has been cancelled successfully. You will be prompted to select a new plan on your next login.');
    }, 1500);
  };

  const handleChooseNewPlan = () => {
    setShowSubscriptionDialog(true);
  };

  // Get plan details based on the plan ID
  const getPlanDetails = () => {
    const plans = {
      'plan-1': { name: 'Basic', price: 999, cycle: 'monthly' },
      'plan-2': { name: 'Professional', price: 2499, cycle: 'monthly' },
      'plan-3': { name: 'Enterprise', price: 9999, cycle: 'quarterly' }
    };
    
    return subscriptionPlan ? plans[subscriptionPlan as keyof typeof plans] : null;
  };
  
  const planDetails = getPlanDetails();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-700">
                <Image
                  src="/default-avatar.svg"
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors">
                <Camera size={16} className="text-white" />
              </button>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {userType === 'vendor' ? 'Vendor User' : 'Admin User'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {userType === 'vendor' ? 'vendor@texttile.com' : 'admin@texttile.com'}
              </p>
            </div>
          </div>
          
          {/* Vendor Subscription Info */}
          {userType === 'vendor' && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Subscription Status</h3>
              
              {subscriptionPlan && planDetails ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center">
                    <Star size={18} className="text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">{planDetails.name} Plan</span>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <Tag size={14} className="text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{planDetails.price.toLocaleString('en-IN')}
                    </span>
                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                      /{planDetails.cycle}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      onClick={handleCancelSubscription}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center justify-center"
                    >
                      Cancel Subscription
                    </button>
                    <Link
                      href="/vendors/subscription"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center"
                    >
                      View Subscription Details
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 mr-2" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300">No active subscription</p>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        You don't have an active subscription plan.
                      </p>
                      <button
                        onClick={handleChooseNewPlan}
                        className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Choose a Plan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Settings Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="glass-card p-6 rounded-xl space-y-6">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <UserCircle size={20} />
              <h2 className="text-lg font-semibold">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Display Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter display name"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="glass-card p-6 rounded-xl space-y-6">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Mail size={20} />
              <h2 className="text-lg font-semibold">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="glass-card p-6 rounded-xl space-y-6">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Lock size={20} />
              <h2 className="text-lg font-semibold">Security Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Current Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400">New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="glass-card p-6 rounded-xl space-y-6">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Bell size={20} />
              <h2 className="text-lg font-semibold">Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
          <Save size={20} />
          Save Changes
        </button>
      </div>

      {/* Cancel Subscription Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Cancel Subscription
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to cancel your subscription? You will lose access to premium features and will need to choose a new plan to access them again.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                No, Keep My Plan
              </button>
              <button
                onClick={confirmCancelSubscription}
                disabled={subscriptionCancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {subscriptionCancelling ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  <>Yes, Cancel Subscription</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription Dialog */}
      <SubscriptionDialog 
        isOpen={showSubscriptionDialog} 
        onClose={() => setShowSubscriptionDialog(false)} 
      />
    </motion.div>
  );
}
