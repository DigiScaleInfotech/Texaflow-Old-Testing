export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  lowStockAlert?: number;
  reorderPoint?: number;
  unitOfMeasure?: string;
  location?: string;
  dimensions?: {
    width: string;
    unit: string;
  };
  weight?: {
    value: string;
    unit: string;
  };
  color?: string;
  material?: string;
  tags?: string[];
  imageUrl?: string;
  supplier?: string;
  supplierId?: string;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreateDTO {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category: string;
  price: number;
  costPrice?: number;
  quantity: number;
  lowStockAlert?: number;
  reorderPoint?: number;
  unitOfMeasure?: string;
  location?: string;
  dimensions?: {
    width: string;
    unit: string;
  };
  weight?: {
    value: string;
    unit: string;
  };
  color?: string;
  material?: string;
  tags?: string[];
  imageUrl?: string;
  supplier?: string;
  supplierId?: string;
}

export interface ProductUpdateDTO extends Partial<ProductCreateDTO> {}
