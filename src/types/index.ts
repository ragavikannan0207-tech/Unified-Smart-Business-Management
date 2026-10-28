export type PaymentMethod = 'cash' | 'card' | 'upi' | 'store_credit' | 'split';
export type PaymentStatus = 'paid' | 'partial' | 'refunded';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string; // 'pcs' | 'kg' | 'g' | 'litre' | 'pack' | 'box'
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert: number;
  supplierId?: string;
  supplierName?: string;
  taxRate: number; // percentage, e.g. 5, 12, 18 or 0
  image?: string;
  description?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage or flat
  discountType: 'percentage' | 'flat';
  taxRate: number;
  total: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  items: SaleItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    cashReceived?: number;
    changeGiven?: number;
    transactionRef?: string;
    splitDetails?: { method: PaymentMethod; amount: number }[];
  };
  paymentStatus: PaymentStatus;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  outstandingCredit: number;
  loyaltyPoints: number;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  gstOrTaxId?: string;
  totalOrders: number;
  balancePayable: number;
  notes?: string;
}

export interface POItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  costPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  items: POItem[];
  totalAmount: number;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'return';
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  referenceId?: string; // invoice # or PO #
  reason?: string;
}

export interface BusinessSettings {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string; // GST/VAT/Tax ID
  taxRateDefault: number;
  currencySymbol: string;
  currencyCode: string;
  receiptHeader: string;
  receiptFooter: string;
  lowStockThresholdDefault: number;
  enableSoundEffects: boolean;
}

export type PageId =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'products'
  | 'purchasing'
  | 'suppliers'
  | 'customers'
  | 'reports'
  | 'ai-assistant'
  | 'settings';
