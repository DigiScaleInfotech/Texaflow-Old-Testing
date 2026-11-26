'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldAlert,
  Calendar,
  MapPin,
  Building,
  Eye,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { vendorService } from '@/services/vendor.service';
import { formatShortId } from '@/utils/format';

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

interface VendorApplication {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  gst: string;
  submittedDate: string;
  status: ApplicationStatus;
  avatar: string;
}

const defaultMockApplications: VendorApplication[] = [
  {
    id: 'APP001',
    name: 'Silverline Textiles',
    email: 'contact@silverlinetextiles.com',
    mobile: '+91 9876543290',
    address: 'Jaipur, Rajasthan',
    gst: 'GSTIN9876543290',
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
    submittedDate: '2024-05-14',
    status: 'pending',
    avatar: '/default-avatar.svg',
  },
  {
    id: 'APP004',
    name: 'Fashion Thread Co.',
    email: 'hello@fashionthread.com',
    mobile: '+91 9876543293',
    address: 'Ahmedabad, Gujarat',
    gst: 'GSTIN9876543293',
    submittedDate: '2024-05-12',
    status: 'approved',
    avatar: '/default-avatar.svg',
  },
  {
    id: 'APP005',
    name: 'Luxe Cotton Mills',
    email: 'info@luxecotton.com',
    mobile: '+91 9876543294',
    address: 'Pune, Maharashtra',
    gst: 'GSTIN9876543294',
    submittedDate: '2024-05-10',
    status: 'rejected',
    avatar: '/default-avatar.svg',
  },
  {
    id: 'APP006',
    name: 'Suspicious Textiles',
    email: 'suspicious@textiles.com',
    mobile: '+91 9876543295',
    address: 'Delhi, Delhi',
    gst: 'GSTIN9876543295',
    submittedDate: '2024-05-09',
    status: 'blocked',
    avatar: '/default-avatar.svg',
  },
];

export default function VendorApplicationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await vendorService.getApplications({
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter
        });

        if (res && res.applications) {
          const mapped: VendorApplication[] = res.applications.map((app: any) => ({
            id: app.id,
            name: app.organizationName || app.name || 'Unnamed Vendor',
            email: app.email || '',
            mobile: app.phone || '',
            address: typeof app.address === 'object' && app.address 
              ? `${app.address.city || ''}${app.address.city && app.address.state ? ', ' : ''}${app.address.state || ''}`.trim() || 'N/A'
              : (app.address || 'N/A'),
            gst: app.gstNumber || 'N/A',
            submittedDate: app.applicationDate ? new Date(app.applicationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: (app.status?.toLowerCase() || 'pending') as ApplicationStatus,
            avatar: app.logo || app.image || '/default-avatar.svg',
          }));
          setApplications(mapped);
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.warn('Vendor applications fetch error:', err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [searchQuery, statusFilter]);

  // Filter applications based on search and status filter
  const filteredApplications = applications.filter(app => {
    // Search filter
    if (searchQuery && 
        !app.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !app.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !app.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !app.mobile.includes(searchQuery) &&
        !app.gst.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Function to get status badge style
  const getStatusBadgeStyle = (status: ApplicationStatus) => {
    switch(status) {
      case 'approved':
        return {
          bg: 'bg-green-100 dark:bg-green-500/10',
          text: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle size={14} />
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-500/10',
          text: 'text-yellow-600 dark:text-yellow-400',
          icon: <Clock size={14} />
        };
      case 'rejected':
        return {
          bg: 'bg-red-100 dark:bg-red-500/10',
          text: 'text-red-600 dark:text-red-400',
          icon: <XCircle size={14} />
        };
      case 'blocked':
        return {
          bg: 'bg-gray-100 dark:bg-gray-500/10',
          text: 'text-gray-600 dark:text-gray-400',
          icon: <ShieldAlert size={14} />
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
      <div className="flex items-center justify-between">
        <Link 
          href="/vendors" 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Vendors
        </Link>
      </div>

      {/* Search and filter bar */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Applications cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((app) => {
              const { bg, text, icon } = getStatusBadgeStyle(app.status);
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                        <Image
                          src={app.avatar}
                          alt={app.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{app.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono" title={app.id}>
                          {formatShortId(app.id, 'APP')}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
                      {icon}
                      <span className="capitalize">{app.status}</span>
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <Building size={16} className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">GST Number</p>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">{app.gst}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                        <p className="text-sm text-gray-900 dark:text-white">{app.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Submitted Date</p>
                        <p className="text-sm text-gray-900 dark:text-white">{app.submittedDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <Link 
                      href={`/vendors/applications/${app.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                    >
                      <Eye size={16} />
                      {app.status === 'pending' ? 'Review Application' : 'View Details'}
                    </Link>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full p-6 text-center text-gray-500 dark:text-gray-400">
              No applications found matching your filters.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
        <div>Showing {filteredApplications.length} of {applications.length} applications</div>
      </div>
    </motion.div>
  );
}
