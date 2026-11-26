'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, ShieldAlert, ExternalLink, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Image from 'next/image';

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

interface VendorApplication {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  gst: string;
  documentUrls: string[];
  submittedDate: string;
  status: ApplicationStatus;
  notes?: string;
  avatar: string;
}

interface VendorApplicationReviewProps {
  onClose: () => void;
}

const VendorApplicationReview: React.FC<VendorApplicationReviewProps> = ({ onClose }) => {
  // Mock data for vendor applications
  const [applications, setApplications] = useState<VendorApplication[]>([
    {
      id: 'APP001',
      name: 'Silverline Textiles',
      email: 'contact@silverlinetextiles.com',
      mobile: '+91 9876543290',
      address: 'Jaipur, Rajasthan',
      gst: 'GSTIN9876543290',
      documentUrls: ['/doc1.pdf', '/doc2.pdf'],
      submittedDate: '2024-05-15',
      status: 'pending',
      avatar: '/default-avatar.svg',
    },
    {
      id: 'APP002',
      name: 'Crafty Fabrics',
      email: 'info@craftyfabrics.com',
      mobile: '+91 9876543291',
      address: 'Chennai, Tamil Nadu',
      gst: 'GSTIN9876543291',
      documentUrls: ['/doc3.pdf', '/doc4.pdf'],
      submittedDate: '2024-05-16',
      status: 'pending',
      avatar: '/default-avatar.svg',
    },
    {
      id: 'APP003',
      name: 'Modern Textiles Ltd',
      email: 'support@moderntextiles.com',
      mobile: '+91 9876543292',
      address: 'Kolkata, West Bengal',
      gst: 'GSTIN9876543292',
      documentUrls: ['/doc5.pdf'],
      submittedDate: '2024-05-14',
      status: 'pending',
      avatar: '/default-avatar.svg',
    },
  ]);

  const [activeApplication, setActiveApplication] = useState<VendorApplication | null>(
    applications.length > 0 ? applications[0] : null
  );
  
  const [adminNotes, setAdminNotes] = useState('');

  const handleUpdateStatus = (applicationId: string, newStatus: ApplicationStatus) => {
    setApplications(apps => 
      apps.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, notes: adminNotes } 
          : app
      )
    );
    
    // Move to next application if available
    const currentIndex = applications.findIndex(app => app.id === applicationId);
    if (currentIndex < applications.length - 1) {
      setActiveApplication(applications[currentIndex + 1]);
      setAdminNotes('');
    } else if (currentIndex > 0) {
      setActiveApplication(applications[currentIndex - 1]);
      setAdminNotes('');
    } else {
      setActiveApplication(null);
    }
  };

  const navigateApplication = (direction: 'next' | 'prev') => {
    if (!activeApplication) return;
    
    const currentIndex = applications.findIndex(app => app.id === activeApplication.id);
    if (direction === 'next' && currentIndex < applications.length - 1) {
      setActiveApplication(applications[currentIndex + 1]);
      setAdminNotes('');
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveApplication(applications[currentIndex - 1]);
      setAdminNotes('');
    }
  };

  // Filter to only show pending applications
  const pendingApplications = applications.filter(app => app.status === 'pending');

  if (pendingApplications.length === 0 && !activeApplication) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vendor Applications</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="py-10 text-center text-gray-500 dark:text-gray-400">
          <div className="mb-4">
            <CheckCircle size={48} className="mx-auto text-green-500" />
          </div>
          <p className="text-lg">All applications have been reviewed!</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  if (!activeApplication) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-5xl w-full p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vendor Application Review</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {pendingApplications.length} pending applications
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-[70vh] overflow-hidden">
        {/* Left sidebar - List of applications */}
        <div className="w-64 flex-shrink-0 overflow-auto border-r border-gray-200 dark:border-gray-800 pr-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Applications</h3>
          <div className="space-y-2">
            {pendingApplications.map(app => (
              <div 
                key={app.id}
                onClick={() => {
                  setActiveApplication(app);
                  setAdminNotes('');
                }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeApplication?.id === app.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={app.avatar}
                      alt={app.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{app.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{app.submittedDate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right section - Application details & review */}
        <div className="flex-1 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={activeApplication.avatar}
                  alt={activeApplication.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{activeApplication.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {activeApplication.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigateApplication('prev')}
                disabled={applications.findIndex(app => app.id === activeApplication.id) === 0}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => navigateApplication('next')}
                disabled={applications.findIndex(app => app.id === activeApplication.id) === applications.length - 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Application details */}
            <div className="space-y-6">
              <div className="glass-card p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Business Information</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white col-span-2">{activeApplication.email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Mobile:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white col-span-2">{activeApplication.mobile}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">GST Number:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white col-span-2">{activeApplication.gst}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Address:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white col-span-2">{activeApplication.address}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Submitted:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white col-span-2">{activeApplication.submittedDate}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {activeApplication.documentUrls.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Document {index + 1}</span>
                      <div className="flex gap-2">
                        <button className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                          <Eye size={16} />
                        </button>
                        <a 
                          href={doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin review section */}
            <div className="space-y-6">
              <div className="glass-card p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Admin Review</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      id="admin-notes"
                      rows={4}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this application..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-4">Decision</h4>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleUpdateStatus(activeApplication.id, 'approved')}
                    className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
                  >
                    <CheckCircle size={18} />
                    Approve Application
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(activeApplication.id, 'rejected')}
                    className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                  >
                    <XCircle size={18} />
                    Reject Application
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(activeApplication.id, 'blocked')}
                    className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/30 transition-colors"
                  >
                    <ShieldAlert size={18} />
                    Block Vendor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VendorApplicationReview;
