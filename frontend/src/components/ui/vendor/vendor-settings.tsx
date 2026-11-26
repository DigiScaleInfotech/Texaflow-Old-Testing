'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  FileText, 
  Shield, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Clock, 
  Pencil,
  Tag,
  Calendar,
  Check,
  Star
} from 'lucide-react';

interface VendorSettingsProps {
  onClose: () => void;
}

interface VendorPolicy {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'draft';
  updatedAt: string;
}

interface GSTSetting {
  rate: number;
  isCompulsory: boolean;
  exemptionCategories: string[];
  verificationRequired: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  isActive: boolean;
}

const VendorSettings: React.FC<VendorSettingsProps> = ({ onClose }) => {
  // Tabs state
  const [activeTab, setActiveTab] = useState<'gst' | 'policies' | 'subscription' | 'documents'>('gst');
  
  // Settings state
  const [gstSettings, setGstSettings] = useState<GSTSetting>({
    rate: 18,
    isCompulsory: true,
    exemptionCategories: ['Export', 'Special Economic Zone'],
    verificationRequired: true
  });
  
  const [policies, setPolicies] = useState<VendorPolicy[]>([
    {
      id: 'policy-1',
      title: 'Vendor Code of Conduct',
      description: 'Guidelines for ethical business practices, labor standards, and environmental responsibilities.',
      status: 'active',
      updatedAt: '2024-01-15'
    },
    {
      id: 'policy-2',
      title: 'Payment Terms',
      description: 'Standard payment schedule, accepted payment methods, and late payment consequences.',
      status: 'active',
      updatedAt: '2024-02-20'
    },
    {
      id: 'policy-3',
      title: 'Quality Control Standards',
      description: 'Requirements for product quality, inspection procedures, and defect rate tolerances.',
      status: 'draft',
      updatedAt: '2024-03-10'
    }
  ]);
  
  // Subscription plans state
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([
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
  ]);
  
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([
    'GST Registration Certificate',
    'PAN Card',
    'Business Registration/Certificate of Incorporation',
    'Bank Account Details',
    'Product Catalog'
  ]);
  
  // Handler for saving changes
  const handleSave = () => {
    // Here you would normally save the settings to your backend
    console.log('Saving settings:', {
      gstSettings,
      policies,
      subscriptionPlans,
      requiredDocuments
    });
    
    // Show success message (in a real app)
    alert('Settings saved successfully');
    
    onClose();
  };
  
  // Handler for updating GST settings
  const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setGstSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) : value
    }));
  };
  
  // Handler for adding a new policy
  const handleAddPolicy = () => {
    const newPolicy: VendorPolicy = {
      id: `policy-${Date.now()}`,
      title: 'New Policy',
      description: 'Enter policy description here',
      status: 'draft',
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    setPolicies([...policies, newPolicy]);
  };
  
  // Handler for deleting a policy
  const handleDeletePolicy = (id: string) => {
    setPolicies(policies.filter(policy => policy.id !== id));
  };
  
  // Handler for adding a new subscription plan
  const handleAddPlan = () => {
    const newPlan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: 'New Plan',
      price: 0,
      billingCycle: 'monthly',
      features: ['Feature 1'],
      isActive: false
    };
    
    setSubscriptionPlans([...subscriptionPlans, newPlan]);
  };
  
  // Handler for toggling plan active status
  const handleTogglePlanStatus = (id: string) => {
    setSubscriptionPlans(subscriptionPlans.map(plan => 
      plan.id === id ? { ...plan, isActive: !plan.isActive } : plan
    ));
  };
  
  // Handler for deleting a subscription plan
  const handleDeletePlan = (id: string) => {
    setSubscriptionPlans(subscriptionPlans.filter(plan => plan.id !== id));
  };
  
  // Handler for adding a new feature to a plan
  const handleAddFeature = (planId: string) => {
    const featureName = prompt('Enter new feature:');
    if (featureName && featureName.trim() !== '') {
      setSubscriptionPlans(subscriptionPlans.map(plan => 
        plan.id === planId 
          ? { ...plan, features: [...plan.features, featureName.trim()] }
          : plan
      ));
    }
  };
  
  // Handler for removing a feature from a plan
  const handleRemoveFeature = (planId: string, featureIndex: number) => {
    setSubscriptionPlans(subscriptionPlans.map(plan => 
      plan.id === planId
        ? {
            ...plan,
            features: plan.features.filter((_, index) => index !== featureIndex)
          }
        : plan
    ));
  };
  
  // Handler for adding a new document requirement
  const handleAddDocument = () => {
    const documentName = prompt('Enter the name of the required document:');
    if (documentName && documentName.trim() !== '') {
      setRequiredDocuments([...requiredDocuments, documentName.trim()]);
    }
  };
  
  // Handler for removing a document requirement
  const handleRemoveDocument = (index: number) => {
    setRequiredDocuments(requiredDocuments.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full"
    >
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vendor Management Settings</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('gst')}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'gst'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          GST Settings
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'policies'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Vendor Policies
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'subscription'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Subscription Plans
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'documents'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Required Documents
        </button>
      </div>
      
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {/* GST Settings Tab */}
        {activeTab === 'gst' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-3">
              <HelpCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">GST Configuration</p>
                <p>Configure GST settings for vendor registration and invoices. These settings determine how GST is handled for all vendors.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="gst-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default GST Rate (%)
                  </label>
                  <input
                    type="number"
                    id="gst-rate"
                    name="rate"
                    value={gstSettings.rate}
                    onChange={handleGSTChange}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Standard GST rate applied to vendor invoices.</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="gst-required"
                      name="isCompulsory"
                      checked={gstSettings.isCompulsory}
                      onChange={handleGSTChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="gst-required" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      GST Registration Mandatory
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">If enabled, vendors must provide a valid GST number during registration.</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="gst-verification"
                      name="verificationRequired"
                      checked={gstSettings.verificationRequired}
                      onChange={handleGSTChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="gst-verification" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Verify GST Numbers
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">Automatically validate GST numbers with the government database.</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GST Exemption Categories
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-[150px] overflow-y-auto">
                  {gstSettings.exemptionCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{category}</span>
                      <button 
                        onClick={() => setGstSettings(prev => ({
                          ...prev,
                          exemptionCategories: prev.exemptionCategories.filter((_, i) => i !== index)
                        }))}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const category = prompt('Enter exemption category:');
                      if (category && category.trim() !== '') {
                        setGstSettings(prev => ({
                          ...prev,
                          exemptionCategories: [...prev.exemptionCategories, category.trim()]
                        }));
                      }
                    }}
                    className="mt-3 text-sm flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus size={14} className="mr-1" />
                    Add Category
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Vendor categories that are exempt from GST requirements.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Vendor Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vendor Policies</h3>
              <button
                onClick={handleAddPolicy}
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
              >
                <Plus size={16} className="mr-1" />
                New Policy
              </button>
            </div>
            
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center">
                      <Shield size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">{policy.title}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        policy.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                          : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                      </span>
                      <div className="flex">
                        <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeletePolicy(policy.id)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {policy.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={14} className="mr-1" />
                      Last updated: {policy.updatedAt}
                    </div>
                  </div>
                </div>
              ))}
              
              {policies.length === 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No vendor policies defined yet</p>
                  <button
                    onClick={handleAddPolicy}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Create First Policy
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Subscription Plans Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vendor Subscription Plans</h3>
              <button
                onClick={handleAddPlan}
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
              >
                <Plus size={16} className="mr-1" />
                New Plan
              </button>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 rounded-lg p-4 text-sm text-purple-800 dark:text-purple-300 flex items-start gap-3">
              <HelpCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Subscription Plans</p>
                <p>Configure vendor subscription plans with different features and pricing. These plans will be available for vendors to choose from during registration.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star size={20} className={plan.isActive ? "text-yellow-500" : "text-gray-400"} />
                      <h4 className="font-medium text-gray-900 dark:text-white">{plan.name}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleTogglePlanStatus(plan.id)}
                        className={`p-1 rounded-md ${
                          plan.isActive
                            ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        title={plan.isActive ? "Deactivate plan" : "Activate plan"}
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md"
                        title="Edit plan"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md"
                        title="Delete plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Tag size={18} className="text-blue-500" />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        /{plan.billingCycle}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <Calendar size={16} className="mr-2" />
                        Billing Cycle
                      </h5>
                      <select 
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={plan.billingCycle}
                        onChange={(e) => {
                          const cycle = e.target.value as 'monthly' | 'quarterly' | 'yearly';
                          setSubscriptionPlans(subscriptionPlans.map(p => 
                            p.id === plan.id ? { ...p, billingCycle: cycle } : p
                          ));
                        }}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</h5>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start justify-between">
                          <div className="flex items-start">
                            <Check size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveFeature(plan.id, index)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handleAddFeature(plan.id)}
                      className="w-full border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      <Plus size={14} className="inline-block mr-1" />
                      Add Feature
                    </button>
                  </div>
                  
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        plan.isActive 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {subscriptionPlans.length === 0 && (
                <div className="col-span-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No subscription plans defined yet</p>
                  <button
                    onClick={handleAddPlan}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Create First Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Required Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Required Vendor Documents</h3>
              <button
                onClick={handleAddDocument}
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
              >
                <Plus size={16} className="mr-1" />
                Add Document
              </button>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-lg p-4 text-sm text-green-800 dark:text-green-300 flex items-start gap-3">
              <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Required Documents</p>
                <p>These documents will be requested from vendors during the registration process. Documents marked as required must be uploaded before a vendor application can be submitted.</p>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Document Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {requiredDocuments.map((document, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 flex items-center">
                        <FileText size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                        {document}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleRemoveDocument(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {requiredDocuments.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No required documents defined
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end items-center gap-3 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
        >
          <Save size={16} className="mr-2" />
          Save Settings
        </button>
      </div>
    </motion.div>
  );
};

export default VendorSettings;
