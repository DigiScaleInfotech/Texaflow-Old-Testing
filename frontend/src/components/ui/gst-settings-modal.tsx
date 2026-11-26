"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Package,
  Truck,
  Warehouse,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";

interface FormData {
  name: string;
  sku: string;
  category: string;
  quantity: string;
  price: string;
  costPrice: string;
  supplier: string;
  location: string;
  reorderPoint: string;
  lowStockAlert: string;
  description: string;
  unit: string;
  barcode: string;
}

export default function AddInventoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    sku: "",
    category: "Raw Material",
    quantity: "",
    price: "",
    costPrice: "",
    supplier: "",
    location: "",
    reorderPoint: "",
    lowStockAlert: "",
    description: "",
    unit: "Meter",
    barcode: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock API call - replace with actual API integration
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Inventory data submitted:", formData);

      // Redirect to inventory list after successful submission
      router.push("/inventory");
    } catch (error) {
      console.error("Error submitting inventory item:", error);
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
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add Inventory Item
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={imagePreview}
                          alt="Product Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={clearImagePreview}
                          className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-gray-600">
                        <Package size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <Upload size={16} />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 400x400px JPG, PNG
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Name */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Product Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* SKU and Barcode */}
            <div>
              <label
                htmlFor="sku"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                SKU Code*
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g., FAB-COT-001"
                required
              />
            </div>

            <div>
              <label
                htmlFor="barcode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Barcode/QR Code
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter barcode if available"
              />
            </div>

            {/* Category and Unit */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Finished Good">Finished Good</option>
                <option value="Accessories">Accessories</option>
                <option value="Packaging">Packaging</option>
                <option value="Tools & Equipment">Tools & Equipment</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Unit of Measure*
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Meter">Meter</option>
                <option value="Yard">Yard</option>
                <option value="Kilogram">Kilogram</option>
                <option value="Piece">Piece</option>
                <option value="Roll">Roll</option>
                <option value="Bundle">Bundle</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Inventory Details Card */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Inventory Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Initial Quantity*
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity"
                min="0"
                required
              />
            </div>

            <div>
              <label
                htmlFor="reorderPoint"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Reorder Point*
              </label>
              <input
                type="number"
                id="reorderPoint"
                name="reorderPoint"
                value={formData.reorderPoint}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reorder point"
                min="0"
                required
              />
            </div>

            <div>
              <label
                htmlFor="lowStockAlert"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Low Stock Alert*
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="lowStockAlert"
                  name="lowStockAlert"
                  value={formData.lowStockAlert}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pl-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Low stock threshold"
                  min="0"
                  required
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-500">
                  <AlertTriangle size={16} />
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="location"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <Warehouse size={16} />
                Storage Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g., Warehouse A, Shelf 12"
              />
            </div>

            <div>
              <label
                htmlFor="supplier"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <Truck size={16} />
                Supplier
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter supplier name"
              />
            </div>
          </div>
        </div>

        {/* Pricing Details Card */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pricing Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="costPrice"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <DollarSign size={16} />
                Cost Price (₹)*
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter cost price"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <DollarSign size={16} />
                Selling Price (₹)*
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter selling price"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Calculated profit margin */}
            {formData.costPrice && formData.price && (
              <div className="md:col-span-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profit Margin:
                    </span>
                    <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs rounded-md">
                      {(
                        ((parseFloat(formData.price) -
                          parseFloat(formData.costPrice)) /
                          parseFloat(formData.price)) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profit per Unit:
                    </span>
                    <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                      ₹
                      {(
                        parseFloat(formData.price) -
                        parseFloat(formData.costPrice)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center">
          <Link
            href="/inventory"
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
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Item
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
