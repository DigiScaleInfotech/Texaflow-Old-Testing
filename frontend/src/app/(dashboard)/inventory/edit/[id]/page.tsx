"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Box,
  Tag,
  Hash,
  Briefcase,
  AlertTriangle,
  ShoppingBag,
  Upload,
  Package,
  Warehouse,
  Truck,
  BarChart,
  AlertCircle,
  Info,
  Clock,
  X,
} from "lucide-react";
import Image from "next/image";

interface FormData {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  costPrice: number;
  supplier: string;
  supplierId: string;
  lowStockAlert: number;
  reorderPoint: number;
  reorderQuantity: number;
  description: string;
  sku: string;
  barcode: string;
  unitOfMeasure: string;
  location: string;
  dimensions: {
    width: string;
    unit: string;
  };
  weight: {
    value: string;
    unit: string;
  };
  color: string;
  material: string;
  tags: string[];
}

export default function EditInventoryPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const itemId = params.id;

  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    category: "",
    quantity: 0,
    price: 0,
    costPrice: 0,
    supplier: "",
    supplierId: "",
    lowStockAlert: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    description: "",
    sku: "",
    barcode: "",
    unitOfMeasure: "",
    location: "",
    dimensions: {
      width: "",
      unit: "cm",
    },
    weight: {
      value: "",
      unit: "gsm",
    },
    color: "",
    material: "",
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    // Fetch inventory item data
    setIsLoading(true);

    // Mock API call - replace with actual API
    setTimeout(() => {
      // Mock inventory data based on ID
      const itemData = {
        id: itemId,
        name: "Cotton Fabric",
        category: "Raw Material",
        quantity: 150,
        price: 200,
        costPrice: 150,
        supplier: "ABC Suppliers",
        supplierId: "SUP001",
        lowStockAlert: 50,
        reorderPoint: 75,
        reorderQuantity: 100,
        description:
          "High quality cotton fabric suitable for various textile applications. Soft texture with excellent durability and color retention properties.",
        sku: "CTN-001",
        barcode: "890123456789",
        unitOfMeasure: "Meter",
        location: "Warehouse A, Shelf 12, Bin 3",
        dimensions: {
          width: "150",
          unit: "cm",
        },
        weight: {
          value: "180",
          unit: "gsm",
        },
        color: "White",
        material: "100% Cotton",
        tags: ["Cotton", "Natural", "Fabric", "Wholesale"],
        image: "/default-product.svg",
      };

      setFormData(itemData);
      setImagePreview(itemData.image);
      setIsLoading(false);
    }, 800);
  }, [itemId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checkbox.checked }));
    } else if (
      name === "quantity" ||
      name === "price" ||
      name === "costPrice" ||
      name === "lowStockAlert" ||
      name === "reorderPoint" ||
      name === "reorderQuantity"
    ) {
      const numValue = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else if (name === "width") {
      setFormData((prev) => ({
        ...prev,
        dimensions: { ...prev.dimensions, width: value },
      }));
    } else if (name === "widthUnit") {
      setFormData((prev) => ({
        ...prev,
        dimensions: { ...prev.dimensions, unit: value },
      }));
    } else if (name === "weightValue") {
      setFormData((prev) => ({
        ...prev,
        weight: { ...prev.weight, value: value },
      }));
    } else if (name === "weightUnit") {
      setFormData((prev) => ({
        ...prev,
        weight: { ...prev.weight, unit: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock API call - replace with actual API integration
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Inventory data updated:", formData);

      // Redirect to inventory list after successful submission
      router.push(`/inventory/${itemId}`);
    } catch (error) {
      console.error("Error updating inventory item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProfitMargin = () => {
    if (formData.price && formData.costPrice) {
      return Math.round(
        ((formData.price - formData.costPrice) / formData.price) * 100
      );
    }
    return 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
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
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading item data...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
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

              {/* ID & SKU */}
              <div>
                <label
                  htmlFor="id"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <Tag size={16} />
                  Item ID
                </label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>

              <div>
                <label
                  htmlFor="sku"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <Tag size={16} />
                  SKU*
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Item Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <Box size={16} />
                  Item Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item name"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <ShoppingBag size={16} />
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
                  <option value="">Select category</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="Finished Good">Finished Good</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Tools & Equipment">Tools & Equipment</option>
                </select>
              </div>

              {/* Unit of Measure */}
              <div>
                <label
                  htmlFor="unitOfMeasure"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <Info size={16} />
                  Unit of Measure*
                </label>
                <select
                  id="unitOfMeasure"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select unit</option>
                  <option value="Meter">Meter</option>
                  <option value="Yard">Yard</option>
                  <option value="Kilogram">Kilogram</option>
                  <option value="Piece">Piece</option>
                  <option value="Roll">Roll</option>
                  <option value="Bundle">Bundle</option>
                </select>
              </div>

              {/* Barcode */}
              <div>
                <label
                  htmlFor="barcode"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <Hash size={16} />
                  Barcode
                </label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Technical Details Card */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Technical Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Color */}
              <div>
                <label
                  htmlFor="color"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Material */}
              <div>
                <label
                  htmlFor="material"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Material
                </label>
                <input
                  type="text"
                  id="material"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
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
                />
              </div>

              {/* Width */}
              <div>
                <label
                  htmlFor="width"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Width
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="width"
                    name="width"
                    value={formData.dimensions.width}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    id="widthUnit"
                    name="widthUnit"
                    value={formData.dimensions.unit}
                    onChange={handleInputChange}
                    className="w-20 px-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                    <option value="mm">mm</option>
                  </select>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label
                  htmlFor="weightValue"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Weight
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="weightValue"
                    name="weightValue"
                    value={formData.weight.value}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    id="weightUnit"
                    name="weightUnit"
                    value={formData.weight.unit}
                    onChange={handleInputChange}
                    className="w-20 px-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gsm">gsm</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="md:col-span-3">
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tags
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="tagInput"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory & Pricing Card */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Inventory & Pricing Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inventory section */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Stock Information
                </h3>

                {/* Current Quantity */}
                <div>
                  <label
                    htmlFor="quantity"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    <Package size={16} />
                    Current Quantity*
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Low Stock Alert */}
                <div>
                  <label
                    htmlFor="lowStockAlert"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    <AlertCircle size={16} />
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    id="lowStockAlert"
                    name="lowStockAlert"
                    value={formData.lowStockAlert}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Reorder Point */}
                <div>
                  <label
                    htmlFor="reorderPoint"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    <AlertTriangle size={16} />
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    id="reorderPoint"
                    name="reorderPoint"
                    value={formData.reorderPoint}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Reorder Quantity */}
                <div>
                  <label
                    htmlFor="reorderQuantity"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    <Package size={16} />
                    Reorder Quantity
                  </label>
                  <input
                    type="number"
                    id="reorderQuantity"
                    name="reorderQuantity"
                    value={formData.reorderQuantity}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Supplier */}
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
                  />
                </div>
              </div>

              {/* Pricing section */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Pricing Information
                </h3>

                {/* Selling Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    <span className="text-lg font-semibold">₹</span>
                    Selling Price (₹)*
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label
                    htmlFor="costPrice"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    <span className="text-lg font-semibold">₹</span>
                    Cost Price (₹)*
                  </label>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Profit Margin */}
                {formData.price > 0 && formData.costPrice > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Profit Margin
                    </label>
                    <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Margin
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {calculateProfitMargin()}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{ width: `${calculateProfitMargin()}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Profit per unit
                        </span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          ₹{(formData.price - formData.costPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Description
            </h2>

            <div>
              <label htmlFor="description" className="sr-only">
                Item Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter item description"
              ></textarea>
            </div>
          </div>

          {/* Form Actions - Fixed Bottom Bar */}
          <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sidebar-width,16rem)] h-16 px-6 md:px-8 bg-white/95 dark:bg-[#202936]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700/80 flex items-center justify-end gap-3 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-300">
            <Link
              href="/inventory"
              className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
