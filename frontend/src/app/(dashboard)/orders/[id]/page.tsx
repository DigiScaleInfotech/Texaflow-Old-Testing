'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  User, 
  Truck, 
  Clock, 
  CreditCard, 
  FileText, 
  ChevronDown, 
  Edit, 
  Trash2, 
  Printer, 
  Download, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Order } from '@/types';

// Order status badge component
const OrderStatusBadge = ({ status }: { status: string }) => {
  const getStatusDetails = (status: string) => {
    switch(status.toLowerCase()) {
      case 'delivered':
        return {
          bgColor: 'bg-green-100 dark:bg-green-500/10',
          textColor: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle size={14} />
        };
      case 'processing':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-500/10',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          icon: <RefreshCw size={14} />
        };
      case 'cancelled':
        return {
          bgColor: 'bg-red-100 dark:bg-red-500/10',
          textColor: 'text-red-600 dark:text-red-400',
          icon: <XCircle size={14} />
        };
      case 'pending':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-500/10',
          textColor: 'text-blue-600 dark:text-blue-400',
          icon: <Clock size={14} />
        };
      case 'shipped':
        return {
          bgColor: 'bg-purple-100 dark:bg-purple-500/10',
          textColor: 'text-purple-600 dark:text-purple-400',
          icon: <Truck size={14} />
        };
      case 'return requested':
        return {
          bgColor: 'bg-amber-100 dark:bg-amber-500/10',
          textColor: 'text-amber-600 dark:text-amber-400',
          icon: <AlertTriangle size={14} />
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

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState(false);

  // Add click outside handler to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeActionMenu && !target.closest('.action-menu-container')) {
        setActiveActionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeActionMenu]);

  // Function to get profile image - defaults to clean neutral avatar
  const getProfileImage = (gender?: string) => {
    return '/default-avatar.svg';
  };

  useEffect(() => {
    // Mock data - replace with actual API call
    setOrder({
      id: params.id,
      orderNumber: `ORD-${params.id.padStart(6, '0')}`,
      customerId: 'CUS001',
      customerName: 'John Doe',
      customerGender: 'male',
      orderDate: '2024-01-15T10:30:00',
      quantity: 5,
      totalItems: 3,
      subtotal: 2300,
      tax: 200,
      totalPrice: 2500,
      discount: 0,
      status: 'processing',
      paymentStatus: 'paid',
      paymentMethod: 'Credit Card',
      paymentDetails: {
        cardType: 'Visa',
        last4: '4242',
        transactionId: 'TXN12345678',
        paidAt: '2024-01-15T10:35:00'
      },
      items: [
        { id: 1, name: 'Premium Cotton Fabric', sku: 'FAB-COT-001', quantity: 2, price: 450, total: 900, image: '/default-product.svg' },
        { id: 2, name: 'Silk Blend Textile', sku: 'FAB-SLK-002', quantity: 1, price: 1200, total: 1200, image: '/default-product.svg' },
        { id: 3, name: 'Polyester Thread', sku: 'THR-PLY-001', quantity: 2, price: 100, total: 200, image: '/default-product.svg' }
      ],
      shippingAddress: {
        recipient: 'John Doe',
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India',
        phone: '+91 9876543210'
      },
      billingAddress: {
        recipient: 'John Doe',
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India',
        phone: '+91 9876543210'
      },
      notes: 'Please deliver between 10 AM and 5 PM.',
      deliveryTracking: {
        carrier: 'FastShip Express',
        trackingNumber: 'FSE987654321',
        estimatedDelivery: '2024-01-20',
        trackingUrl: 'https://tracking.fastship.com/FSE987654321',
        timeline: [
          { status: 'Order Placed', date: '2024-01-15T10:30:00', description: 'Your order has been placed successfully.' },
          { status: 'Payment Confirmed', date: '2024-01-15T10:35:00', description: 'Payment for your order has been confirmed.' },
          { status: 'Processing', date: '2024-01-16T09:15:00', description: 'Your order is being processed in our warehouse.' },
          { status: 'Pending Shipment', date: '2024-01-17T11:20:00', description: 'Your order is packed and ready for shipment.' }
        ]
      }
    });
  }, [params.id]);

  if (!order) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/orders" 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order {order.orderNumber}</h1>
            <p className="text-sm text-gray-500">
              {new Date(order.orderDate).toLocaleDateString()} • {new Date(order.orderDate).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group action-menu-container">
            <button 
              onClick={() => setActiveActionMenu(!activeActionMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronDown size={16} />
              Actions
            </button>
            {activeActionMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <Edit size={14} className="mr-3" />
                    Edit Order
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <MessageCircle size={14} className="mr-3" />
                    Add Note
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <Printer size={14} className="mr-3" />
                    Print Invoice
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <Download size={14} className="mr-3" />
                    Download Invoice
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <Trash2 size={14} className="mr-3" />
                    Cancel Order
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Printer size={16} />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Truck size={16} />
            Update Status
          </button>
        </div>
      </div>

      {/* Order Status and Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer and Status */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          {/* Status */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Order Status</h2>
              <OrderStatusBadge status={order.status} />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700 dark:text-gray-300">Payment Status</div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                  order.paymentStatus === 'paid' 
                    ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700 dark:text-gray-300">Order Date</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(order.orderDate).toLocaleDateString()}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700 dark:text-gray-300">Payment Method</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{order.paymentMethod}</div>
              </div>
              {order.deliveryTracking?.estimatedDelivery && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700 dark:text-gray-300">Estimated Delivery</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(order.deliveryTracking.estimatedDelivery).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Customer Info */}
          <div className="pt-4 border-t dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Customer</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image 
                  src={getProfileImage(order.customerGender)}
                  alt={order.customerName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <Link href={`/customers/${order.customerId}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  {order.customerName}
                </Link>
                <p className="text-xs text-gray-500">ID: {order.customerId}</p>
              </div>
            </div>
            
            {order.notes && (
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{order.notes}"</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Middle Column - Addresses */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Addresses</h2>
          
          {/* Shipping Address */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Shipping Address</div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{order.shippingAddress.recipient}</p>
              <address className="not-italic text-sm text-gray-700 dark:text-gray-300 mt-1">
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                {order.shippingAddress.country}<br />
                {order.shippingAddress.phone}
              </address>
            </div>
          </div>
          
          {/* Billing Address */}
          <div className="pt-4 border-t dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 mb-2">Billing Address</div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{order.billingAddress.recipient}</p>
              <address className="not-italic text-sm text-gray-700 dark:text-gray-300 mt-1">
                {order.billingAddress.street}<br />
                {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zip}<br />
                {order.billingAddress.country}<br />
                {order.billingAddress.phone}
              </address>
            </div>
          </div>
          
          {/* Payment Details */}
          {order.paymentDetails && (
            <div className="pt-4 border-t dark:border-gray-700">
              <div className="text-sm font-medium text-gray-500 mb-2">Payment Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Method</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {order.paymentDetails.cardType && `${order.paymentDetails.cardType} **** ${order.paymentDetails.last4}`}
                  </span>
                </div>
                {order.paymentDetails.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Transaction ID</span>
                    <span className="text-sm text-gray-900 dark:text-white">{order.paymentDetails.transactionId}</span>
                  </div>
                )}
                {order.paymentDetails.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Paid On</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(order.paymentDetails.paidAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column - Summary and Shipping */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
          
          {/* Order Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Subtotal</span>
              <span className="text-sm text-gray-900 dark:text-white">₹{order.subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Discount</span>
                <span className="text-sm text-green-600 dark:text-green-400">-₹{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Tax</span>
              <span className="text-sm text-gray-900 dark:text-white">₹{order.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t dark:border-gray-700">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Total</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">₹{order.totalPrice.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Shipping Information */}
          {order.deliveryTracking && (
            <div className="pt-4 border-t dark:border-gray-700">
              <div className="text-sm font-medium text-gray-500 mb-2">Shipping Information</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Carrier</span>
                  <span className="text-sm text-gray-900 dark:text-white">{order.deliveryTracking.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Tracking Number</span>
                  <a 
                    href={order.deliveryTracking.trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {order.deliveryTracking.trackingNumber}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Estimated Delivery</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(order.deliveryTracking.estimatedDelivery).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Order Items */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        width={48} 
                        height={48} 
                        className="object-cover rounded-lg"
                      />
                      <Link 
                        href={`/inventory/${item.id}`} 
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                      >
                        <Package size={14} />
                        {item.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">₹{item.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">₹{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-200 dark:border-gray-700">
              <tr>
                <td colSpan={3} className="px-6 py-4"></td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">Subtotal</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">₹{order.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-4"></td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">Tax</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">₹{order.tax.toLocaleString()}</td>
              </tr>
              {order.discount > 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">Discount</td>
                  <td className="px-6 py-4 text-sm text-right text-green-600 dark:text-green-400">-₹{order.discount.toLocaleString()}</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="px-6 py-4"></td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">Total</td>
                <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">₹{order.totalPrice.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Order Timeline */}
      {order.deliveryTracking?.timeline && (
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Order Timeline</h2>
          <div className="relative">
            {/* Timeline connector line */}
            <div className="absolute left-3.5 top-2 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="space-y-6">
              {order.deliveryTracking.timeline.map((event: any, index: number) => (
                <div key={index} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-1.5 h-7 w-7 rounded-full border-2 flex items-center justify-center ${
                    index === 0 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-500'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500'
                  }`}>
                    {index === 0 ? (
                      <Clock size={14} />
                    ) : index === order.deliveryTracking.timeline.length - 1 ? (
                      <CheckCircle size={14} />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{event.status}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(event.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
