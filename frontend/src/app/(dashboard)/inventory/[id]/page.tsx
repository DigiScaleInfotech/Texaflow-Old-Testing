'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  Warehouse, 
  AlertCircle, 
  TrendingUp, 
  Box, 
  Truck,
  BarChart,
  Calendar,
  Tag,
  ChevronDown,
  Edit,
  Trash2,
  ShoppingCart,
  FileText,
  RefreshCw,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';

// Stock status badge component
const StockStatusBadge = ({ quantity, lowStockAlert }: { quantity: number, lowStockAlert: number }) => {
  let status: string;
  let statusDetails: { bgColor: string; textColor: string; icon: React.ReactNode };

  if (quantity <= 0) {
    status = 'Out of Stock';
    statusDetails = {
      bgColor: 'bg-red-100 dark:bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400',
      icon: <XCircle size={14} />
    };
  } else if (quantity <= lowStockAlert) {
    status = 'Low Stock';
    statusDetails = {
      bgColor: 'bg-amber-100 dark:bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
      icon: <AlertCircle size={14} />
    };
  } else {
    status = 'In Stock';
    statusDetails = {
      bgColor: 'bg-green-100 dark:bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
      icon: <CheckCircle size={14} />
    };
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusDetails.bgColor} ${statusDetails.textColor}`}>
      {statusDetails.icon}
      <span>{status}</span>
    </span>
  );
};

// Transaction type badge component
const TransactionTypeBadge = ({ type }: { type: string }) => {
  const badgeDetails = type.toLowerCase() === 'incoming' ? {
    bgColor: 'bg-green-100 dark:bg-green-500/10',
    textColor: 'text-green-600 dark:text-green-400',
    icon: <TrendingUp size={14} className="rotate-45" />
  } : {
    bgColor: 'bg-blue-100 dark:bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
    icon: <TrendingUp size={14} className="-rotate-45" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badgeDetails.bgColor} ${badgeDetails.textColor}`}>
      {badgeDetails.icon}
      <span>{type}</span>
    </span>
  );
};

export default function InventoryDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<any | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState(false);
  const [activeChart, setActiveChart] = useState<'stock' | 'price'>('stock');

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

  useEffect(() => {
    // Mock data - replace with actual API call
    setProduct({
      id: params.id,
      name: 'Cotton Fabric',
      category: 'Raw Material',
      quantity: 150,
      price: 200,
      cost: 150,
      supplier: 'ABC Suppliers',
      supplierId: 'SUP001',
      lowStockAlert: 50,
      description: 'High quality cotton fabric suitable for various textile applications. Soft texture with excellent durability and color retention properties. Perfect for garments and home furnishings.',
      sku: 'CTN-001',
      barcode: '890123456789',
      unitOfMeasure: 'Meter',
      reorderPoint: 75,
      reorderQuantity: 100,
      lastRestocked: '2024-01-10',
      lastOrdered: '2024-01-05',
      createdAt: '2023-09-15',
      updatedAt: '2024-01-10',
      location: 'Warehouse A, Shelf 12, Bin 3',
      dimensions: {
        width: '150',
        unit: 'cm'
      },
      weight: {
        value: '180',
        unit: 'gsm'
      },
      color: 'White',
      material: '100% Cotton',
      tags: ['Cotton', 'Natural', 'Fabric', 'Wholesale'],
      status: 'active',
      stockValue: 30000,
      stockHistory: [
        { date: '2023-12-10', quantity: 100 },
        { date: '2023-12-15', quantity: 120 },
        { date: '2023-12-20', quantity: 90 },
        { date: '2023-12-25', quantity: 70 },
        { date: '2023-12-30', quantity: 100 },
        { date: '2024-01-05', quantity: 130 },
        { date: '2024-01-10', quantity: 150 }
      ],
      priceHistory: [
        { date: '2023-09-15', price: 180 },
        { date: '2023-10-20', price: 185 },
        { date: '2023-11-25', price: 190 },
        { date: '2024-01-01', price: 200 }
      ],
      transactions: [
        { id: 1, type: 'Incoming', quantity: 100, date: '2024-01-10', reference: 'PO-001', referenceType: 'Purchase Order', user: 'Admin' },
        { id: 2, type: 'Outgoing', quantity: 30, date: '2024-01-12', reference: 'ORD-002', referenceType: 'Sales Order', user: 'Sales Staff' },
        { id: 3, type: 'Incoming', quantity: 80, date: '2024-01-15', reference: 'PO-003', referenceType: 'Purchase Order', user: 'Admin' },
        { id: 4, type: 'Outgoing', quantity: 15, date: '2024-01-18', reference: 'ORD-004', referenceType: 'Sales Order', user: 'Sales Staff' },
        { id: 5, type: 'Adjustment', quantity: 15, date: '2024-01-20', reference: 'ADJ-001', referenceType: 'Inventory Adjustment', user: 'Inventory Manager' }
      ],
      relatedProducts: [
        { id: 'P002', name: 'Polyester Blend', category: 'Raw Material', price: 180, image: '/default-product.svg' },
        { id: 'P003', name: 'Silk Fabric', category: 'Premium Material', price: 450, image: '/default-product.svg' },
        { id: 'P004', name: 'Cotton Thread', category: 'Accessories', price: 75, image: '/default-product.svg' }
      ],
      image: '/default-product.svg',
    });
  }, [params.id]);

  if (!product) return null;

  // Format the date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
            href="/inventory" 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>ID: {product.id}</span>
              <span>•</span>
              <span>SKU: {product.sku}</span>
            </div>
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
                    onClick={() => router.push(`/inventory/adjust/${product.id}`)}
                  >
                    <RefreshCw size={14} className="mr-3" />
                    Adjust Stock
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                    onClick={() => router.push(`/inventory/edit/${product.id}`)}
                  >
                    <Edit size={14} className="mr-3" />
                    Edit Product
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <Printer size={14} className="mr-3" />
                    Print Barcode
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <Trash2 size={14} className="mr-3" />
                    Delete Product
                  </button>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => router.push(`/purchase-orders/add?product=${product.id}`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Truck size={16} />
            Order More
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => router.push(`/inventory/adjust/${product.id}`)}
          >
            <RefreshCw size={16} />
            Adjust Stock
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main product info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Image and Basic Info */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Product Information</h2>
              <StockStatusBadge quantity={product.quantity} lowStockAlert={product.lowStockAlert} />
            </div>
            
            <div className="flex justify-center py-4">
              <div className="relative w-40 h-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Package size={16} className="min-w-4" />
                  <span>SKU: <span className="text-gray-900 dark:text-white">{product.sku}</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Box size={16} className="min-w-4" />
                  <span>Category: <span className="text-gray-900 dark:text-white">{product.category}</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Tag size={16} className="min-w-4" />
                  <span>Unit Price: <span className="text-gray-900 dark:text-white">₹{product.price}</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Warehouse size={16} className="min-w-4" />
                  <span>Location: <span className="text-gray-900 dark:text-white">{product.location}</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Truck size={16} className="min-w-4" />
                  <Link 
                    href={`/vendors/${product.supplierId}`} 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {product.supplier}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Calendar size={16} className="min-w-4" />
                  <span>Last Restocked: <span className="text-gray-900 dark:text-white">{formatDate(product.lastRestocked)}</span></span>
                </div>
              </div>
              
              <div className="pt-4 border-t dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.description}
                </div>
              </div>
            </div>
          </div>
          
          {/* Stock Levels */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Stock Levels</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Stock</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{product.quantity} {product.unitOfMeasure}</span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    product.quantity <= product.lowStockAlert 
                      ? 'bg-red-500' 
                      : product.quantity <= product.reorderPoint 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`}
                  style={{width: `${Math.min(100, (product.quantity / (product.reorderQuantity * 2)) * 100)}%`}}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Low Stock: {product.lowStockAlert}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Reorder Point: {product.reorderPoint}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Reorder Quantity</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{product.reorderQuantity} {product.unitOfMeasure}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Stock Value</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">₹{product.stockValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Ordered</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(product.lastOrdered)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Middle column - Charts and Additional Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Charts */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {activeChart === 'stock' ? 'Stock History' : 'Price History'}
              </h2>
              <div className="flex gap-2 text-sm">
                <button 
                  onClick={() => setActiveChart('stock')}
                  className={`px-2.5 py-1 rounded ${
                    activeChart === 'stock' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Stock
                </button>
                <button 
                  onClick={() => setActiveChart('price')}
                  className={`px-2.5 py-1 rounded ${
                    activeChart === 'price' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Price
                </button>
              </div>
            </div>
            
            <div className="pt-4 h-60 flex items-center justify-center">
              {activeChart === 'stock' ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 relative">
                    <div className="absolute inset-0">
                      {/* Placeholder for stock chart - would be replaced with a real chart component */}
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <BarChart size={48} className="text-gray-300 dark:text-gray-700" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">{formatDate(product.stockHistory[0].date)}</span>
                    <span className="text-xs text-gray-500">{formatDate(product.stockHistory[product.stockHistory.length - 1].date)}</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 relative">
                    <div className="absolute inset-0">
                      {/* Placeholder for price chart - would be replaced with a real chart component */}
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <TrendingUp size={48} className="text-gray-300 dark:text-gray-700" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">{formatDate(product.priceHistory[0].date)}</span>
                    <span className="text-xs text-gray-500">{formatDate(product.priceHistory[product.priceHistory.length - 1].date)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Product Details */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Technical Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Barcode</div>
                <div className="text-sm text-gray-900 dark:text-white">{product.barcode}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Unit of Measure</div>
                <div className="text-sm text-gray-900 dark:text-white">{product.unitOfMeasure}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Material</div>
                <div className="text-sm text-gray-900 dark:text-white">{product.material}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Color</div>
                <div className="text-sm text-gray-900 dark:text-white">{product.color}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Width</div>
                <div className="text-sm text-gray-900 dark:text-white">{product.dimensions.width} {product.dimensions.unit}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Weight</div>
                <div className="text-sm text-gray-900 dark:text-white">{product.weight.value} {product.weight.unit}</div>
              </div>
            </div>
            
            <div className="pt-4 border-t dark:border-gray-700">
              <div className="text-xs text-gray-500 mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string) => (
                  <span 
                    key={tag} 
                    className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Created On</div>
                <div className="text-sm text-gray-900 dark:text-white">{formatDate(product.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                <div className="text-sm text-gray-900 dark:text-white">{formatDate(product.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Transactions and Related Products */}
        <div className="lg:col-span-1 space-y-6">
          {/* Financial Summary */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Financial Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                <div className="text-xs text-gray-500 mb-1">Selling Price</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price}</div>
                <div className="text-xs text-gray-500 mt-1">per {product.unitOfMeasure}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                <div className="text-xs text-gray-500 mb-1">Cost Price</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">₹{product.cost}</div>
                <div className="text-xs text-gray-500 mt-1">per {product.unitOfMeasure}</div>
              </div>
            </div>
            
            <div className="pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round(((product.price - product.cost) / product.price) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 my-2">
                <div 
                  className="h-1.5 rounded-full bg-green-500"
                  style={{width: `${Math.round(((product.price - product.cost) / product.price) * 100)}%`}}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Profit per Unit</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  ₹{product.price - product.cost}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Inventory Value</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ₹{(product.quantity * product.cost).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Potential Revenue</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ₹{(product.quantity * product.price).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Related Products */}
          {/* <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Related Products</h2>
            <div className="space-y-4">
              {product.relatedProducts.map((relatedProduct: any) => (
                <Link 
                  key={relatedProduct.id}
                  href={`/inventory/${relatedProduct.id}`}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="relative w-12 h-12 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 overflow-hidden mr-4">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-600">
                      <Package size={24} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{relatedProduct.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{relatedProduct.category}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{relatedProduct.price}
                  </div>
                </Link>
              ))}
            </div>
          </div> */}
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Stock Movement History</h2>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
              </tr>
            </thead>
            <tbody>
              {product.transactions.map((transaction: any) => (
                <tr 
                  key={transaction.id} 
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(transaction.date)}</td>
                  <td className="px-6 py-4">
                    <TransactionTypeBadge type={transaction.type} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={transaction.type.toLowerCase() === 'outgoing' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                      {transaction.type.toLowerCase() === 'outgoing' ? '-' : '+'}{Math.abs(transaction.quantity)} {product.unitOfMeasure}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link 
                        href={`/${transaction.referenceType === 'Purchase Order' ? 'purchase-orders' : 'orders'}/${transaction.reference}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {transaction.reference}
                      </Link>
                      <span className="text-xs text-gray-500">{transaction.referenceType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{transaction.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
