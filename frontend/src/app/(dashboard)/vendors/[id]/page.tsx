'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Package
} from 'lucide-react';
import Image from 'next/image';

type VendorStatus = 'approved' | 'pending' | 'rejected';

interface VendorProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
}

interface VendorOrder {
  id: string;
  date: string;
  amount: number;
  status: string;
  items: number;
}

interface VendorContact {
  name: string;
  position: string;
  email: string;
  phone: string;
  primary: boolean;
  gender: 'male' | 'female'; // Added gender property
}

interface Vendor {
  id: string;
  name: string;
  logo?: string;
  email: string;
  phone: string;
  mobile: string;
  gst: string;
  pan?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  website?: string;
  status: VendorStatus;
  joinDate: string;
  paymentTerms: string;
  creditLimit?: number;
  notes?: string;
  contacts: VendorContact[];
  rating?: number;
  totalOrders: number;
  totalSpending: number;
}

// Component for vendor status badge
const VendorStatusBadge = ({ status }: { status: VendorStatus }) => {
  const getStatusDetails = (status: VendorStatus) => {
    switch(status) {
      case 'approved':
        return {
          bgColor: 'bg-green-100 dark:bg-green-500/10',
          textColor: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle size={14} />
        };
      case 'pending':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-500/10',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          icon: <Clock size={14} />
        };
      case 'rejected':
        return {
          bgColor: 'bg-red-100 dark:bg-red-500/10',
          textColor: 'text-red-600 dark:text-red-400',
          icon: <XCircle size={14} />
        };
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-700/50',
          textColor: 'text-gray-600 dark:text-gray-400',
          icon: null
        };
    }
  };

  const { bgColor, textColor, icon } = getStatusDetails(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      <span className="capitalize">{status}</span>
    </span>
  );
};

// Main component
export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  
  // Mock data for the vendor
  const [vendor, setVendor] = useState<Vendor>({
    id: vendorId,
    name: 'ABC Textiles',
    logo: '/default-avatar.svg',
    email: 'contact@abctextiles.com',
    phone: '+91 22 4567 8901',
    mobile: '+91 9876543210',
    gst: 'GSTIN9876543210',
    pan: 'ABCDE1234F',
    address: {
      street: '123, Textile Market, Sector 15',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400001',
      country: 'India'
    },
    website: 'https://www.abctextiles.com',
    status: 'approved',
    joinDate: '2022-06-15',
    paymentTerms: 'Net 30 days',
    creditLimit: 500000,
    notes: 'Premium quality fabric supplier with consistent delivery record. Specializes in cotton and silk fabrics.',
    contacts: [
      {
        name: 'Rajesh Kumar',
        position: 'Sales Manager',
        email: 'rajesh@abctextiles.com',
        phone: '+91 9876543211',
        primary: true,
        gender: 'male' // Added gender property
      },
      {
        name: 'Priya Sharma',
        position: 'Accounts Manager',
        email: 'priya@abctextiles.com',
        phone: '+91 9876543212',
        primary: false,
        gender: 'female' // Added gender property
      }
    ],
    rating: 4.5,
    totalOrders: 32,
    totalSpending: 1450000
  });

  // Mock vendor products
  const vendorProducts: VendorProduct[] = [
    { id: 'P001', name: 'Premium Cotton Fabric', sku: 'FAB-COT-001', price: 450, category: 'Raw Materials' },
    { id: 'P002', name: 'Silk Blend Textile', sku: 'FAB-SLK-002', price: 1200, category: 'Raw Materials' },
    { id: 'P003', name: 'Polyester Thread', sku: 'THR-PLY-001', price: 85, category: 'Accessories' },
  ];

  // Mock recent orders
  const recentOrders: VendorOrder[] = [
    { id: 'PO-1234', date: '2023-12-10', amount: 125000, status: 'delivered', items: 3 },
    { id: 'PO-1235', date: '2023-11-22', amount: 78500, status: 'delivered', items: 2 },
    { id: 'PO-1236', date: '2023-10-15', amount: 96000, status: 'delivered', items: 4 },
  ];

  // Get random image for contacts based on gender
  const getRandomContactImage = (gender: string) => {
    return '/default-avatar.svg';
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
            href="/vendors" 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.name}</h1>
            <p className="text-sm text-gray-500">
              ID: {vendor.id} • Joined: {vendor.joinDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <ChevronDown size={16} />
              Actions
            </button>
            <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button 
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                  role="menuitem"
                >
                  <FileText size={14} className="mr-3" />
                  Create Order
                </button>
                <button 
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                  role="menuitem"
                >
                  <Edit size={14} className="mr-3" />
                  Edit Vendor
                </button>
                <button 
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" 
                  role="menuitem"
                >
                  <Trash2 size={14} className="mr-3" />
                  Delete Vendor
                </button>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Mail size={16} />
            Contact
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            <FileText size={16} />
            Create Order
          </button>
        </div>
      </div>
      
      {/* Vendor Info Card */}
      <div className="glass-card rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Basic Info */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="relative h-full w-full">
                  <Image
                    src={vendor.logo || '/default-avatar.svg'} 
                    alt={vendor.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              <div className="space-y-4 w-full">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                    <VendorStatusBadge status={vendor.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-500 mb-1">Rating</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(vendor.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">{vendor.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Orders</div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{vendor.totalOrders}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Spending</div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">₹{vendor.totalSpending.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle - Contact Info */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Contact Information</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-500" />
                    <a href={`mailto:${vendor.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {vendor.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-500" />
                    <a href={`tel:${vendor.phone}`} className="text-sm text-gray-700 dark:text-gray-300">
                      {vendor.phone}
                    </a>
                  </div>
                  {vendor.mobile && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-500" />
                      <a href={`tel:${vendor.mobile}`} className="text-sm text-gray-700 dark:text-gray-300">
                        {vendor.mobile} (Mobile)
                      </a>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-500 mt-0.5" />
                    <address className="not-italic text-sm text-gray-700 dark:text-gray-300">
                      {vendor.address.street}<br />
                      {vendor.address.city}, {vendor.address.state} {vendor.address.zip}<br />
                      {vendor.address.country}
                    </address>
                  </div>
                  {vendor.website && (
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        {vendor.website.replace(/(^\w+:|^)\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t dark:border-gray-700">
                <div className="text-sm font-medium text-gray-500 mb-2">Business Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">GST Number</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{vendor.gst}</div>
                  </div>
                  {vendor.pan && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">PAN Number</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">{vendor.pan}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Financial & Notes */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Payment Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Payment Terms</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{vendor.paymentTerms}</div>
                  </div>
                  {vendor.creditLimit && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Credit Limit</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">₹{vendor.creditLimit.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {vendor.notes && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-500 mb-2">Notes</div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{vendor.notes}</p>
                </div>
              )}
              
              {vendor.contacts && vendor.contacts.length > 0 && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-500 mb-2">Key Contacts</div>
                  <div className="space-y-3">
                    {vendor.contacts.map((contact, idx) => {
                      const contactImage = getRandomContactImage(contact.gender);
                      return (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                <Image
                                  src={contactImage}
                                  alt={contact.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</div>
                                <div className="text-xs text-gray-500">{contact.position}</div>
                              </div>
                            </div>
                            {contact.primary && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1 ml-11">
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-gray-500" />
                              <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                {contact.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={12} className="text-gray-500" />
                              <a href={`tel:${contact.phone}`} className="text-xs text-gray-700 dark:text-gray-300">
                                {contact.phone}
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Products Section */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Products</h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
              </tr>
            </thead>
            <tbody>
              {vendorProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{product.id}</td>
                  <td className="px-6 py-4">
                    <Link 
                      href={`/inventory/${product.id}`} 
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                    >
                      <Package size={14} />
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{product.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">₹{product.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Purchase Orders</h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    <Link href={`/orders/${order.id}`}>{order.id}</Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{order.date}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700 dark:text-gray-300">{order.items}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">₹{order.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
