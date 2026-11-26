'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { orderService } from '@/services/order.service';
import { customerService } from '@/services/customer.service';
import { inventoryService } from '@/services/inventory.service';
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Minus,
  Calendar,
  User,
  Clock,
  Phone,
  Mail,
  MapPin,
  Package,
  Search,
  DollarSign,
  Truck
} from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  orderDate: string;
  deliveryDate: string;
  paymentMethod: string;
  orderNotes: string;
  items: OrderItem[];
}

export default function AddOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Load real customers and products from Supabase
    customerService.getCustomers().then((res) => {
      if (res && res.customers) {
        setCustomers(
          res.customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email || '',
            phone: c.phone || c.mobile || '',
            gender: c.gender || 'male',
            address: {
              street: c.address || '',
              city: c.city || '',
              state: c.state || '',
              zip: c.zipCode || c.postalCode || '',
              country: c.country || 'India',
            },
          }))
        );
      }
    }).catch(console.error);

    inventoryService.getInventory().then((res) => {
      if (res && res.products) {
        setProducts(
          res.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || '',
            price: parseFloat(p.price) || 0,
            stock: p.quantity || 0,
          }))
        );
      }
    }).catch(console.error);
  }, []);
  
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: 'India',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    paymentMethod: 'Cash on Delivery',
    orderNotes: '',
    items: []
  });
  
  // Function to get profile image - defaults to clean neutral avatar
  const getProfileImage = (gender?: string) => {
    return '/default-avatar.svg';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomerId(customer.id);
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingStreet: customer.address?.street || '',
      shippingCity: customer.address?.city || '',
      shippingState: customer.address?.state || '',
      shippingZip: customer.address?.zip || '',
      shippingCountry: customer.address?.country || 'India'
    }));
    setShowCustomerSearch(false);
  };
  
  const handleAddItem = (product: typeof products[0]) => {
    const newItem: OrderItem = {
      id: product.id,
      name: product.name,
      description: product.name,
      quantity: 1,
      unitPrice: product.price,
      total: product.price
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowProductSearch(false);
  };
  
  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };
  
  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalculate total if quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = 
        Number(updatedItems[index].quantity) * Number(updatedItems[index].unitPrice);
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => total + item.total, 0);
  };
  
  const calculateTax = () => {
    // Assuming 18% GST
    return calculateSubtotal() * 0.18;
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (formData.items.length === 0) {
        alert('Please add at least one item to the order');
        setIsSubmitting(false);
        return;
      }

      await orderService.createOrder({
        customerId: selectedCustomerId || undefined,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingAddress: `${formData.shippingStreet}, ${formData.shippingCity}, ${formData.shippingState}`,
        shippingCity: formData.shippingCity,
        shippingState: formData.shippingState,
        shippingZip: formData.shippingZip,
        shippingCountry: formData.shippingCountry || 'India',
        orderDate: formData.orderDate ? new Date(formData.orderDate) : new Date(),
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        paymentMethod: formData.paymentMethod || 'Cash on Delivery',
        notes: formData.orderNotes,
        status: 'pending',
        paymentStatus: 'pending',
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        items: formData.items.map(it => ({
          productId: it.id,
          productName: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total
        }))
      });

      console.log('Order created successfully in Supabase DB');
      router.push('/orders');
    } catch (error: any) {
      console.error('Error submitting order:', error);
      alert(error?.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information Card */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Information</h2>
            <button 
              type="button"
              onClick={() => setShowCustomerSearch(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Search size={14} />
              Search Customer
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <User size={16} />
                Customer Name*
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter customer name"
                required
              />
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="customerEmail" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Mail size={16} />
                Email*
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
                required
              />
            </div>
            
            {/* Phone */}
            <div>
              <label htmlFor="customerPhone" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Phone size={16} />
                Phone*
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
                required
              />
            </div>
            
            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign size={16} />
                Payment Method*
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI">UPI</option>
                <option value="PayPal">PayPal</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <MapPin size={16} />
                Shipping Address
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="shippingStreet" className="text-xs text-gray-500 mb-1 block">Street Address*</label>
                  <input
                    type="text"
                    id="shippingStreet"
                    name="shippingStreet"
                    value={formData.shippingStreet}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter street address"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="shippingCity" className="text-xs text-gray-500 mb-1 block">City*</label>
                  <input
                    type="text"
                    id="shippingCity"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="shippingState" className="text-xs text-gray-500 mb-1 block">State*</label>
                  <input
                    type="text"
                    id="shippingState"
                    name="shippingState"
                    value={formData.shippingState}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter state"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="shippingZip" className="text-xs text-gray-500 mb-1 block">ZIP Code*</label>
                  <input
                    type="text"
                    id="shippingZip"
                    name="shippingZip"
                    value={formData.shippingZip}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ZIP code"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="shippingCountry" className="text-xs text-gray-500 mb-1 block">Country*</label>
                  <input
                    type="text"
                    id="shippingCountry"
                    name="shippingCountry"
                    value={formData.shippingCountry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter country"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Customer Search Modal */}
          {showCustomerSearch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Customer</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowCustomerSearch(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(customer => (
                        <tr key={customer.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                <Image
                                  src={getProfileImage(customer.gender)}
                                  alt={customer.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">{customer.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{customer.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{customer.phone}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectCustomer(customer)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Order Information Card */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Date */}
            <div>
              <label htmlFor="orderDate" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar size={16} />
                Order Date*
              </label>
              <input
                type="date"
                id="orderDate"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Delivery Date */}
            <div>
              <label htmlFor="deliveryDate" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock size={16} />
                Expected Delivery Date*
              </label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Shipping Method */}
            <div>
              <label htmlFor="shippingMethod" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Truck size={16} />
                Shipping Method*
              </label>
              <select
                id="shippingMethod"
                name="shippingMethod"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Standard">Standard Delivery</option>
                <option value="Express">Express Delivery</option>
                <option value="Next Day">Next Day Delivery</option>
                <option value="Pickup">Store Pickup</option>
              </select>
            </div>
            
            {/* Notes */}
            <div className="md:col-span-3">
              <label htmlFor="orderNotes" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order Notes
              </label>
              <textarea
                id="orderNotes"
                name="orderNotes"
                value={formData.orderNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any specific instructions or notes for this order"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Order Items Card */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Items</h2>
            <button 
              type="button"
              onClick={() => setShowProductSearch(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
          
          <div className="overflow-x-auto -mx-6 mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unit Price (₹)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total (₹)</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.length > 0 ? (
                  formData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{item.id}</td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          className="w-24 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                          className="w-32 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300 font-medium">
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 mx-auto flex hover:bg-red-50 dark:hover:bg-red-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Minus size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No products added yet. Click "Add Product" to add order items.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal:</td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">₹{calculateSubtotal().toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm text-gray-500">GST (18%):</td>
                  <td className="px-6 py-3 text-right text-sm text-gray-700 dark:text-gray-300">₹{calculateTax().toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right text-base font-semibold text-gray-900 dark:text-white">Total:</td>
                  <td className="px-6 py-4 text-right text-base font-semibold text-gray-900 dark:text-white">₹{calculateTotal().toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Product Search Modal */}
          {showProductSearch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Product</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowProductSearch(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{product.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-gray-400" />
                              <span className="text-sm text-gray-900 dark:text-white">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{product.sku}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{product.stock}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">₹{product.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleAddItem(product)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors flex items-center gap-1 mx-auto"
                            >
                              <Plus size={12} />
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Perfectly Fixed Bottom Actions Bar */}
        <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sidebar-width,16rem)] h-16 px-6 md:px-8 bg-white/95 dark:bg-[#202936]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700/80 flex items-center justify-end gap-3 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-300">
          <Link 
            href="/orders" 
            className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            disabled={isSubmitting || formData.items.length === 0}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Order...
              </>
            ) : (
              <>
                <Save size={16} />
                Create Order
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
