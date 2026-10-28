import React, { useState } from 'react';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { SalesHistory } from './pages/SalesHistory';
import { Products } from './pages/Products';
import { Purchasing } from './pages/Purchasing';
import { Suppliers } from './pages/Suppliers';
import { Customers } from './pages/Customers';
import { Reports } from './pages/Reports';
import { AIAssistant } from './pages/AIAssistant';
import { Settings } from './pages/Settings';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { Sale } from './types';

const MainLayout: React.FC = () => {
  const { activePage, setActivePage } = useBusiness();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Global trigger for creating a PO
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);

  const handleOpenReceipt = (sale: Sale) => {
    setActiveReceiptSale(sale);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            onOpenReceipt={handleOpenReceipt}
            onOpenAddProduct={() => setActivePage('products')}
            onOpenCreatePO={() => {
              setActivePage('purchasing');
              setIsCreatePOOpen(true);
            }}
          />
        );
      case 'pos':
        return (
          <POS
            onSaleComplete={handleOpenReceipt}
            onOpenAddProduct={() => setActivePage('products')}
          />
        );
      case 'sales':
        return <SalesHistory onOpenReceipt={handleOpenReceipt} />;
      case 'products':
        return (
          <Products
            onOpenCreatePO={() => {
              setActivePage('purchasing');
              setIsCreatePOOpen(true);
            }}
          />
        );
      case 'purchasing':
        return (
          <Purchasing
            isOpenCreateModal={isCreatePOOpen}
            onCloseCreateModal={() => setIsCreatePOOpen(false)}
          />
        );
      case 'suppliers':
        return <Suppliers />;
      case 'customers':
        return <Customers />;
      case 'reports':
        return <Reports />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard
            onOpenReceipt={handleOpenReceipt}
            onOpenAddProduct={() => setActivePage('products')}
            onOpenCreatePO={() => {
              setActivePage('purchasing');
              setIsCreatePOOpen(true);
            }}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenAddProduct={() => setActivePage('products')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>

      {/* Digital & Printable Thermal Receipt Modal */}
      <ReceiptModal
        sale={activeReceiptSale}
        isOpen={!!activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BusinessProvider>
      <MainLayout />
    </BusinessProvider>
  );
}
