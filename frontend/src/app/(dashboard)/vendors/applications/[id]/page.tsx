'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  ShieldAlert, 
  ExternalLink, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { vendorService } from '@/services/vendor.service';
import { formatShortId } from '@/utils/format';

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
}

interface VendorApplication {
  id: string;
  name: string;
  email: string;
  mobile: string;
  contactPerson: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  gst: string;
  pan?: string;
  website?: string;
  businessType: string;
  yearEstablished: string;
  documents: Document[];
  submittedDate: string;
  status: ApplicationStatus;
  notes?: string;
  avatar: string;
}

export default function VendorApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch application data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const res = await vendorService.getApplicationById(applicationId);
        if (res && (res.application || res.id)) {
          const app = res.application || res;
          setApplication({
            id: app.id,
            name: app.organizationName || app.name || 'Vendor',
            email: app.email || '',
            mobile: app.phone || '',
            contactPerson: app.contactPerson || '',
            address: typeof app.address === 'object' && app.address ? {
              street: app.address.street || '',
              city: app.address.city || '',
              state: app.address.state || '',
              zip: app.address.postalCode || app.address.zip || '',
              country: app.address.country || 'India'
            } : {
              street: '',
              city: '',
              state: '',
              zip: '',
              country: 'India'
            },
            gst: app.gstNumber || '',
            pan: app.panNumber || '',
            website: app.website || '',
            businessType: app.businessType || 'Vendor',
            yearEstablished: app.yearEstablished || '2020',
            documents: app.documents || [],
            submittedDate: app.applicationDate ? new Date(app.applicationDate).toISOString().split('T')[0] : '2024-05-15',
            status: (app.status?.toLowerCase() || 'pending') as ApplicationStatus,
            notes: app.notes || app.adminNotes || '',
            avatar: app.logo || app.image || '/default-avatar.svg'
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend fetch failed, using mock fallback:', err);
      }

      // Mock application data fallback based on ID
      const mockApplication: VendorApplication = {
        id: applicationId,
        name: 'Silverline Textiles',
        email: 'contact@silverlinetextiles.com',
        mobile: '+91 9876543290',
        contactPerson: 'Raj Kumar',
        address: {
          street: '123 Textile Lane, Industrial Area',
          city: 'Jaipur',
          state: 'Rajasthan',
          zip: '302001',
          country: 'India'
        },
        gst: 'GSTIN9876543290',
        pan: 'AAPCS2394K',
        website: 'https://www.silverlinetextiles.com',
        businessType: 'Manufacturer & Wholesaler',
        yearEstablished: '2010',
        documents: [
          {
            id: 'DOC001',
            name: 'GST Certificate',
            type: 'PDF',
            url: '/docs/gst_certificate.pdf',
            uploadDate: '2024-05-10'
          },
          {
            id: 'DOC002',
            name: 'PAN Card Copy',
            type: 'PDF',
            url: '/docs/pan_card.pdf',
            uploadDate: '2024-05-10'
          },
          {
            id: 'DOC003',
            name: 'Business Registration',
            type: 'PDF',
            url: '/docs/business_registration.pdf',
            uploadDate: '2024-05-10'
          },
          {
            id: 'DOC004',
            name: 'Product Catalog',
            type: 'PDF',
            url: '/docs/product_catalog.pdf',
            uploadDate: '2024-05-11'
          }
        ],
        submittedDate: '2024-05-15',
        status: 'pending',
        avatar: '/default-avatar.svg'
      };
      
      setApplication(mockApplication);
      setIsLoading(false);
    };

    fetchData();
  }, [applicationId]);

  const handleUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (!application) return;
    
    setIsSubmitting(true);
    
    try {
      await vendorService.updateApplicationStatus(application.id, newStatus, adminNotes);
      setApplication({
        ...application,
        status: newStatus,
        notes: adminNotes.trim() !== '' ? adminNotes : application.notes
      });
      router.push('/vendors/applications');
    } catch (error) {
      console.error('Error updating application status:', error);
      setApplication({
        ...application,
        status: newStatus,
        notes: adminNotes.trim() !== '' ? adminNotes : application.notes
      });
      router.push('/vendors/applications');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get status badge style
  const getStatusBadgeStyle = (status: ApplicationStatus) => {
    switch(status) {
      case 'approved':
        return {
          bg: 'bg-green-100 dark:bg-green-500/10',
          text: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle size={16} />
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-500/10',
          text: 'text-yellow-600 dark:text-yellow-400',
          icon: <div className="w-4 h-4 relative">
            <div className="absolute inset-0 border-2 border-yellow-600 dark:border-yellow-400 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
          </div>
        };
      case 'rejected':
        return {
          bg: 'bg-red-100 dark:bg-red-500/10',
          text: 'text-red-600 dark:text-red-400',
          icon: <XCircle size={16} />
        };
      case 'blocked':
        return {
          bg: 'bg-gray-100 dark:bg-gray-500/10',
          text: 'text-gray-600 dark:text-gray-400',
          icon: <ShieldAlert size={16} />
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-500/10',
          text: 'text-gray-600 dark:text-gray-400',
          icon: null
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/vendors/applications" 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Application</h1>
            <p className="text-sm text-gray-500 font-mono" title={applicationId}>
              ID: {formatShortId(applicationId, 'APP')} • Submitted: {application?.submittedDate || 'Loading...'}
            </p>
          </div>
        </div>
        {application?.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateStatus('approved')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Approve
            </button>
            <button
              onClick={() => handleUpdateStatus('rejected')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors flex items-center gap-2"
            >
              <XCircle size={16} />
              Reject
            </button>
            <button
              onClick={() => handleUpdateStatus('blocked')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
            >
              <ShieldAlert size={16} />
              Block
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading application data...</p>
          </div>
        </div>
      ) : application ? (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={application.avatar}
                    alt={application.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{application.name}</h2>
                  <p className="text-sm text-gray-500">{application.businessType} • Est. {application.yearEstablished}</p>
                </div>
              </div>
              <div>
                {(() => {
                  const { bg, text, icon } = getStatusBadgeStyle(application.status);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${bg} ${text}`}>
                      {icon}
                      <span className="capitalize">{application.status}</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Business Information */}
            <div className="glass-card rounded-xl p-6 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contact Person</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.contactPerson}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  <a href={`mailto:${application.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{application.email}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  <a href={`tel:${application.mobile}`} className="text-gray-700 dark:text-gray-300">{application.mobile}</a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-500 mt-1" />
                  <address className="not-italic text-gray-700 dark:text-gray-300">
                    {application.address.street}<br />
                    {application.address.city}, {application.address.state} {application.address.zip}<br />
                    {application.address.country}
                  </address>
                </div>
                {application.website && (
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-500" />
                    <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {application.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Legal Information */}
            <div className="glass-card rounded-xl p-6 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Legal Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">GST Number</p>
                  <p className="text-base text-gray-900 dark:text-white font-mono">{application.gst}</p>
                </div>
                {application.pan && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">PAN Number</p>
                    <p className="text-base text-gray-900 dark:text-white font-mono">{application.pan}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Business Type</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.businessType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Year Established</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.yearEstablished}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Application Date</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.submittedDate}</p>
                </div>
              </div>
            </div>

            {/* Admin Review Section */}
            <div className="glass-card rounded-xl p-6 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Application</h3>
              
              {application.status === 'pending' ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      id="admin-notes"
                      rows={5}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this application..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-3">Application Decision</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUpdateStatus('approved')}
                        disabled={isSubmitting}
                        className="w-full py-2 px-3 flex flex-col items-center justify-center gap-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
                      >
                        <CheckCircle size={20} />
                        <span className="text-xs">Approve</span>
                      </button>
                      
                      <button
                        onClick={() => handleUpdateStatus('rejected')}
                        disabled={isSubmitting}
                        className="w-full py-2 px-3 flex flex-col items-center justify-center gap-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                      >
                        <XCircle size={20} />
                        <span className="text-xs">Reject</span>
                      </button>
                      
                      <button
                        onClick={() => handleUpdateStatus('blocked')}
                        disabled={isSubmitting}
                        className="w-full py-2 px-3 flex flex-col items-center justify-center gap-1 bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <ShieldAlert size={20} />
                        <span className="text-xs">Block</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Application Status</p>
                    <div>
                      {(() => {
                        const { bg, text, icon } = getStatusBadgeStyle(application.status);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${bg} ${text}`}>
                            {icon}
                            <span className="capitalize">{application.status}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {application.notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Admin Notes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        {application.notes}
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => router.push('/vendors/applications')}
                    className="w-full mt-4 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Back to Applications
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Uploaded Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {application.documents.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <FileText size={24} />
                    </div>
                    <div className="text-xs text-gray-500">{doc.uploadDate}</div>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{doc.name}</h4>
                  <p className="text-xs text-gray-500 mb-3">{doc.type.toUpperCase()} Document</p>
                  <div className="flex gap-2">
                    <button className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                      <Eye size={16} />
                    </button>
                    <a 
                      href={doc.url} 
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
      ) : (
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            Application not found or has been removed.
          </div>
          <Link 
            href="/vendors/applications" 
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Applications
          </Link>
        </div>
      )}
    </motion.div>
  );
}

// Web Globe Icon Component
function Globe(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const size = props.size || 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
