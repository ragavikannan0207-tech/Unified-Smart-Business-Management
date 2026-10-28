import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Product,
  Customer,
  Supplier,
  PurchaseOrder,
  Sale,
  CartItem,
  BusinessSettings,
  InventoryMovement,
  PageId,
  PaymentMethod,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_SALES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SETTINGS,
  INITIAL_MOVEMENTS,
} from '../data/mockData';
import { formatCurrencyINR } from '../utils/currency';

interface BusinessContextType {
  // Navigation
  activePage: PageId;
  setActivePage: (page: PageId) => void;

  // Settings
  settings: BusinessSettings;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;

  // Products & Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, newStock: number, reason: string) => void;
  lowStockProducts: Product[];
  totalInventoryValuation: { costValue: number; retailValue: number; totalUnits: number };

  // Cart & POS
  cart: CartItem[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  cartDiscountType: 'percentage' | 'flat';
  setCartDiscountType: (type: 'percentage' | 'flat') => void;
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartQty: (productId: string, delta: number) => void;
  setCartItemQuantity: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotals: {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    itemCount: number;
  };
  completeSale: (saleData: {
    paymentMethod: PaymentMethod;
    paymentDetails?: Sale['paymentDetails'];
    notes?: string;
    overrideCustomerId?: string;
  }) => Sale | null;
  refundSale: (saleId: string) => void;

  // Sales
  sales: Sale[];
  todaySalesStats: {
    revenue: number;
    cost: number;
    profit: number;
    orderCount: number;
  };

  // Customers
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'loyaltyPoints'>) => Customer;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (sup: Omit<Supplier, 'id' | 'totalOrders'>) => Supplier;
  updateSupplier: (id: string, sup: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Purchasing
  purchaseOrders: PurchaseOrder[];
  createPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>) => PurchaseOrder;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;
  receivePurchaseOrder: (poId: string) => void;

  // Inventory Movements
  movements: InventoryMovement[];

  // Utilities
  formatCurrency: (amount: number) => string;
  resetDemoData: () => void;
  playBeep: (type?: 'scan' | 'success' | 'alert') => void;
}

const STORAGE_KEYS = {
  SETTINGS: 'sbms_settings_inr_v2',
  PRODUCTS: 'sbms_products_inr_v2',
  CUSTOMERS: 'sbms_customers_inr_v2',
  SUPPLIERS: 'sbms_suppliers_inr_v2',
  SALES: 'sbms_sales_inr_v2',
  POS: 'sbms_po_inr_v2',
  MOVEMENTS: 'sbms_movements_inr_v2',
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  // Load from localStorage or initialize with demo data
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POS);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  // Audio synthesis feedback (Web Audio API)
  const playBeep = (type: 'scan' | 'success' | 'alert' = 'scan') => {
    if (!settings.enableSoundEffects) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'scan') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio not permitted or supported, silent ignore
    }
  };

  // Currency Formatter with en-IN Indian number grouping (e.g. ₹1,13,490.00)
  const formatCurrency = (amount: number): string => {
    return formatCurrencyINR(amount, settings.currencyCode, settings.currencySymbol);
  };

  // Cart State for POS
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-1');
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartDiscountType, setCartDiscountType] = useState<'percentage' | 'flat'>('percentage');

  // Add to cart with stock validation
  const addToCart = (product: Product, quantity = 1): boolean => {
    // Check available stock
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentCartQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const requestedTotal = currentCartQty + quantity;

    if (requestedTotal > product.currentStock) {
      playBeep('alert');
      return false;
    }

    playBeep('scan');

    setCart((prev) => {
      if (existingIndex > -1) {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + quantity;
        const total = newQty * item.unitPrice;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          total,
        };
        return updated;
      } else {
        const unitPrice = product.sellingPrice;
        const total = unitPrice * quantity;
        return [
          ...prev,
          {
            product,
            quantity,
            unitPrice,
            discount: 0,
            discountType: 'percentage',
            taxRate: product.taxRate ?? settings.taxRateDefault,
            total,
          },
        ];
      }
    });
    return true;
  };

  const updateCartQty = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > product.currentStock) {
              playBeep('alert');
              return item;
            }
            playBeep('scan');
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const setCartItemQuantity = (productId: string, qty: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product || qty <= 0) {
      removeFromCart(productId);
      return;
    }
    const finalQty = Math.min(qty, product.currentStock);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: finalQty, total: finalQty * item.unitPrice }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
  };

  // Cart Calculations
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let itemCount = 0;

    cart.forEach((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      subtotal += lineSubtotal;
      itemCount += item.quantity;
      const lineTax = (lineSubtotal * (item.taxRate / 100));
      taxTotal += lineTax;
    });

    let discountTotal = 0;
    if (cartDiscount > 0) {
      if (cartDiscountType === 'percentage') {
        discountTotal = (subtotal * cartDiscount) / 100;
      } else {
        discountTotal = Math.min(cartDiscount, subtotal);
      }
    }

    const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);

    return {
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      itemCount,
    };
  }, [cart, cartDiscount, cartDiscountType]);

  // Complete Sale (Deducts stock automatically, saves sale, updates customer, logs inventory)
  const completeSale = (saleData: {
    paymentMethod: PaymentMethod;
    paymentDetails?: Sale['paymentDetails'];
    notes?: string;
    overrideCustomerId?: string;
  }): Sale | null => {
    if (cart.length === 0) return null;

    const customerId = saleData.overrideCustomerId || selectedCustomerId;
    const customer = customers.find((c) => c.id === customerId);

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const saleItems = cart.map((item) => {
      const lineSub = item.quantity * item.unitPrice;
      const lineTax = lineSub * (item.taxRate / 100);
      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        unit: item.product.unit,
        quantity: item.quantity,
        costPrice: item.product.costPrice,
        unitPrice: item.unitPrice,
        discount: 0,
        taxAmount: lineTax,
        total: lineSub + lineTax,
      };
    });

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      date: now.toISOString(),
      items: saleItems,
      subtotal: cartTotals.subtotal,
      taxTotal: cartTotals.taxTotal,
      discountTotal: cartTotals.discountTotal,
      grandTotal: cartTotals.grandTotal,
      paymentMethod: saleData.paymentMethod,
      paymentDetails: saleData.paymentDetails,
      paymentStatus: 'paid',
      customerId: customer?.id,
      customerName: customer?.name || 'Walk-in Customer',
      customerPhone: customer?.phone,
      cashierName: 'Admin Cashier',
      notes: saleData.notes,
    };

    // 1. Deduct Product Stock & generate movements
    const newMovements: InventoryMovement[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = cart.find((ci) => ci.product.id === prod.id);
        if (soldItem) {
          const newStock = Math.max(0, prod.currentStock - soldItem.quantity);
          newMovements.push({
            id: `mov-${Date.now()}-${prod.id}`,
            date: now.toISOString(),
            productId: prod.id,
            productName: prod.name,
            type: 'sale',
            quantityChanged: -soldItem.quantity,
            previousStock: prod.currentStock,
            newStock,
            referenceId: invoiceNumber,
            reason: `Sold in ${invoiceNumber}`,
          });
          return {
            ...prod,
            currentStock: newStock,
            updatedAt: now.toISOString(),
          };
        }
        return prod;
      })
    );

    // 2. Append movements
    setMovements((prev) => [...newMovements, ...prev]);

    // 3. Update Customer stats (1 loyalty point per ₹100 spent)
    if (customer && customer.id !== 'cust-1') {
      const pointsEarned = Math.floor(cartTotals.grandTotal / 100);
      const isCredit = saleData.paymentMethod === 'store_credit';
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? {
                ...c,
                totalPurchases: c.totalPurchases + cartTotals.grandTotal,
                loyaltyPoints: c.loyaltyPoints + pointsEarned,
                outstandingCredit: isCredit ? c.outstandingCredit + cartTotals.grandTotal : c.outstandingCredit,
              }
            : c
        )
      );
    }

    // 4. Save Sale
    setSales((prev) => [newSale, ...prev]);

    // 5. Sound & Clear Cart
    playBeep('success');
    clearCart();

    return newSale;
  };

  // Refund / Void Sale
  const refundSale = (saleId: string) => {
    const saleToRefund = sales.find((s) => s.id === saleId);
    if (!saleToRefund || saleToRefund.paymentStatus === 'refunded') return;

    const now = new Date().toISOString();
    const returnMovements: InventoryMovement[] = [];

    // Restore stock
    setProducts((prev) =>
      prev.map((prod) => {
        const item = saleToRefund.items.find((i) => i.productId === prod.id);
        if (item) {
          const restoredStock = prod.currentStock + item.quantity;
          returnMovements.push({
            id: `mov-refund-${Date.now()}-${prod.id}`,
            date: now,
            productId: prod.id,
            productName: prod.name,
            type: 'return',
            quantityChanged: item.quantity,
            previousStock: prod.currentStock,
            newStock: restoredStock,
            referenceId: saleToRefund.invoiceNumber,
            reason: `Refund of ${saleToRefund.invoiceNumber}`,
          });
          return { ...prod, currentStock: restoredStock, updatedAt: now };
        }
        return prod;
      })
    );

    setMovements((prev) => [...returnMovements, ...prev]);

    // Mark sale refunded
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, paymentStatus: 'refunded' as const } : s))
    );

    playBeep('alert');
  };

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      sku: prodData.sku.trim() || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      barcode: prodData.barcode.trim() || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Log movement for initial stock
    if (newProduct.currentStock > 0) {
      setMovements((prev) => [
        {
          id: `mov-init-${Date.now()}`,
          date: now,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'adjustment',
          quantityChanged: newProduct.currentStock,
          previousStock: 0,
          newStock: newProduct.currentStock,
          reason: 'Initial stock intake on creation',
        },
        ...prev,
      ]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updatedFields, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = (productId: string, newStock: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const diff = newStock - prod.currentStock;
    const now = new Date().toISOString();

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, currentStock: newStock, updatedAt: now } : p))
    );

    setMovements((prev) => [
      {
        id: `mov-adj-${Date.now()}`,
        date: now,
        productId: prod.id,
        productName: prod.name,
        type: 'adjustment',
        quantityChanged: diff,
        previousStock: prod.currentStock,
        newStock,
        reason: reason || 'Manual stock adjustment',
      },
      ...prev,
    ]);
  };

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStockAlert);
  }, [products]);

  // Total inventory valuation
  const totalInventoryValuation = useMemo(() => {
    return products.reduce(
      (acc, p) => {
        acc.costValue += p.currentStock * p.costPrice;
        acc.retailValue += p.currentStock * p.sellingPrice;
        acc.totalUnits += p.currentStock;
        return acc;
      },
      { costValue: 0, retailValue: 0, totalUnits: 0 }
    );
  }, [products]);

  // Today's Sales Stats
  const todaySalesStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter(
      (s) => s.paymentStatus !== 'refunded' && s.date.slice(0, 10) === today
    );

    let revenue = 0;
    let cost = 0;

    todaySales.forEach((sale) => {
      revenue += sale.grandTotal;
      sale.items.forEach((item) => {
        cost += item.quantity * item.costPrice;
      });
    });

    return {
      revenue,
      cost,
      profit: revenue - cost,
      orderCount: todaySales.length,
    };
  }, [sales]);

  // Customers CRUD
  const addCustomer = (custData: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'loyaltyPoints'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      totalPurchases: 0,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setCustomers((prev) => [...prev, newCust]);
    return newCust;
  };

  const updateCustomer = (id: string, cust: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...cust } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Suppliers CRUD
  const addSupplier = (supData: Omit<Supplier, 'id' | 'totalOrders'>): Supplier => {
    const newSup: Supplier = {
      ...supData,
      id: `sup-${Date.now()}`,
      totalOrders: 0,
    };
    setSuppliers((prev) => [...prev, newSup]);
    return newSup;
  };

  const updateSupplier = (id: string, sup: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...sup } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  // Purchasing & Goods Receiving
  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>): PurchaseOrder => {
    const now = new Date();
    const poNumber = `PO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
      poNumber,
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);

    // Update supplier total orders
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === poData.supplierId ? { ...s, totalOrders: s.totalOrders + 1 } : s
      )
    );

    return newPO;
  };

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    if (status === 'received') {
      receivePurchaseOrder(id);
      return;
    }
    setPurchaseOrders((prev) => prev.map((po) => (po.id === id ? { ...po, status } : po)));
  };

  // Receive PO: critically increases stock and updates cost price
  const receivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status === 'received') return;

    const now = new Date().toISOString();
    const receiveMovements: InventoryMovement[] = [];

    // Increase stock of items
    setProducts((prev) =>
      prev.map((prod) => {
        const poItem = po.items.find((item) => item.productId === prod.id);
        if (poItem) {
          const qtyToReceive = poItem.quantityOrdered;
          const updatedStock = prod.currentStock + qtyToReceive;

          receiveMovements.push({
            id: `mov-recv-${Date.now()}-${prod.id}`,
            date: now,
            productId: prod.id,
            productName: prod.name,
            type: 'purchase',
            quantityChanged: qtyToReceive,
            previousStock: prod.currentStock,
            newStock: updatedStock,
            referenceId: po.poNumber,
            reason: `Received PO ${po.poNumber} from ${po.supplierName}`,
          });

          return {
            ...prod,
            currentStock: updatedStock,
            costPrice: poItem.costPrice || prod.costPrice,
            updatedAt: now,
          };
        }
        return prod;
      })
    );

    setMovements((prev) => [...receiveMovements, ...prev]);

    // Update PO status to received
    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              status: 'received' as const,
              receivedDate: now.slice(0, 10),
              items: p.items.map((i) => ({ ...i, quantityReceived: i.quantityOrdered })),
            }
          : p
      )
    );

    // Update supplier balance payable
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === po.supplierId ? { ...s, balancePayable: s.balancePayable + po.totalAmount } : s
      )
    );

    playBeep('success');
  };

  // Settings
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Reset Demo Data
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.POS);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);

    setSettings(INITIAL_SETTINGS);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSales(INITIAL_SALES);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setMovements(INITIAL_MOVEMENTS);
    setCart([]);
    playBeep('success');
  };

  return (
    <BusinessContext.Provider
      value={{
        activePage,
        setActivePage,
        settings,
        updateSettings,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        lowStockProducts,
        totalInventoryValuation,
        cart,
        selectedCustomerId,
        setSelectedCustomerId,
        cartDiscount,
        setCartDiscount,
        cartDiscountType,
        setCartDiscountType,
        addToCart,
        updateCartQty,
        setCartItemQuantity,
        removeFromCart,
        clearCart,
        cartTotals,
        completeSale,
        refundSale,
        sales,
        todaySalesStats,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        purchaseOrders,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        receivePurchaseOrder,
        movements,
        formatCurrency,
        resetDemoData,
        playBeep,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = (): BusinessContextType => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
