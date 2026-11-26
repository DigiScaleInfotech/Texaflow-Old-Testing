'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, X, Upload, Building2 } from 'lucide-react';
import Image from 'next/image';

interface FormData {
  name: string;
  email: string;
  phone: string;
  mobile: string;
  age: string;
  gst: string;
  pan: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressCountry: string;
  website: string;
  paymentTerms: string;
  creditLimit: string;
  notes: string;
  primaryContactName: string;
  primaryContactPosition: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactGender: 'male' | 'female';
}

export default function AddVendorPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    mobile: '',
    age: '',
    gst: '',
    pan: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'India',
    website: '',
    paymentTerms: 'Net 30 days',
    creditLimit: '',
    notes: '',
    primaryContactName: '',
    primaryContactPosition: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactGender: 'male',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogoPreview = () => {
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock API call - replace with actual API integration
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Vendor data submitted:', formData);
      
      // Redirect to vendors list after successful submission
      router.push('/vendors');
      
    } catch (error) {
      console.error('Error submitting vendor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Logo */}
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                    {logoPreview ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={logoPreview}
                          alt="Logo Preview"
                          fill
                          className="object-cover"
                        />
                        <button 
                          type="button"
                          onClick={clearLogoPreview}
                          className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-gray-600">
                        <Building2 size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <Upload size={16} />
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Recommended: 400x400px JPG, PNG</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Company Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
                required
              />
            </div>
            
            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age (Years in Business)
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company age"
                min="0"
              />
            </div>
            
            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>
        
        {/* Contact Information Card */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address*
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="company@example.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number*
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 XXXXX XXXXX"
                required
              />
            </div>
            
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
          
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mt-6 mb-4">Address</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="addressStreet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street Address*
              </label>
              <input
                type="text"
                id="addressStreet"
                name="addressStreet"
                value={formData.addressStreet}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address"
                required
              />
            </div>
            
            <div>
              <label htmlFor="addressCity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City*
              </label>
              <input
                type="text"
                id="addressCity"
                name="addressCity"
                value={formData.addressCity}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City"
                required
              />
            </div>
            
            <div>
              <label htmlFor="addressState" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State/Province*
              </label>
              <input
                type="text"
                id="addressState"
                name="addressState"
                value={formData.addressState}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="State/Province"
                required
              />
            </div>
            
            <div>
              <label htmlFor="addressZip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ZIP/Postal Code*
              </label>
              <input
                type="text"
                id="addressZip"
                name="addressZip"
                value={formData.addressZip}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ZIP/Postal Code"
                required
              />
            </div>
            
            <div>
              <label htmlFor="addressCountry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country*
              </label>
              <input
                type="text"
                id="addressCountry"
                name="addressCountry"
                value={formData.addressCountry}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Country"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Business Information Card */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="gst" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GST Number*
              </label>
              <input
                type="text"
                id="gst"
                name="gst"
                value={formData.gst}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter GST number"
                required
              />
            </div>
            
            <div>
              <label htmlFor="pan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                id="pan"
                name="pan"
                value={formData.pan}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter PAN number"
              />
            </div>
            
            <div>
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Terms*
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Net 15 days">Net 15 days</option>
                <option value="Net 30 days">Net 30 days</option>
                <option value="Net 45 days">Net 45 days</option>
                <option value="Net 60 days">Net 60 days</option>
                <option value="Immediate">Immediate</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                id="creditLimit"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter credit limit"
                min="0"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional notes or information"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Primary Contact Card */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primary Contact Person</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="primaryContactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name*
              </label>
              <input
                type="text"
                id="primaryContactName"
                name="primaryContactName"
                value={formData.primaryContactName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="primaryContactPosition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position/Job Title*
              </label>
              <input
                type="text"
                id="primaryContactPosition"
                name="primaryContactPosition"
                value={formData.primaryContactPosition}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter position"
                required
              />
            </div>
            
            <div>
              <label htmlFor="primaryContactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email*
              </label>
              <input
                type="email"
                id="primaryContactEmail"
                name="primaryContactEmail"
                value={formData.primaryContactEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div>
              <label htmlFor="primaryContactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone*
              </label>
              <input
                type="tel"
                id="primaryContactPhone"
                name="primaryContactPhone"
                value={formData.primaryContactPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
                required
              />
            </div>
            
            <div>
              <label htmlFor="primaryContactGender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <select
                id="primaryContactGender"
                name="primaryContactGender"
                value={formData.primaryContactGender}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between items-center">
          <Link 
            href="/vendors" 
            className="px-6 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Vendor
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
