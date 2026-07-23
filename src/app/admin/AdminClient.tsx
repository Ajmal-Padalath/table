'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { formatPrice } from '@/lib/utils';
import { useToastStore } from '@/store/useToastStore';
import QRCode from 'qrcode';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  LayoutDashboard,
  Utensils,
  QrCode,
  History,
  Grid,
  FileText,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Download,
  Printer,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

interface AdminClientProps {
  initialTables: any[];
  initialCategories: any[];
  initialFoodItems: any[];
  initialOrders: any[];
}

export function AdminClient({
  initialTables,
  initialCategories,
  initialFoodItems,
  initialOrders,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'qrs' | 'orders' | 'tables' | 'reports'>('overview');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToastStore();

  // State Management
  const [tables, setTables] = useState<any[]>(initialTables);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [foodItems, setFoodItems] = useState<any[]>(initialFoodItems);
  const [orders, setOrders] = useState<any[]>(initialOrders);

  // Modal and Form States
  const [modalOpen, setModalOpen] = useState<'none' | 'category' | 'foodItem' | 'table'>('none');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Socket
  const { socket, connected } = useSocket('staff-dashboard');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('order-created', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
    });
    socket.on('order-updated', ({ orderId, status, order: updatedOrder }) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    });
    socket.on('table-status-changed', ({ tableId, status }) => {
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status } : t)));
    });
    return () => {
      socket.off('order-created');
      socket.off('order-updated');
      socket.off('table-status-changed');
    };
  }, [socket]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Loading admin console...
      </div>
    );
  }

  // --- OVERVIEW ANALYTICS CALCULATIONS ---
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'SERVED');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  // Popular dishes calculation
  const dishCounts: Record<string, { count: number; name: string; price: number }> = {};
  orders.forEach((o) => {
    o.orderItems.forEach((item: any) => {
      const name = item.foodItem.name;
      if (!dishCounts[name]) {
        dishCounts[name] = { count: 0, name, price: item.price };
      }
      dishCounts[name].count += item.quantity;
    });
  });
  const popularDishes = Object.values(dishCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const activeTablesCount = tables.filter((t) => t.status !== 'AVAILABLE').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  // Chart configuration (Last 7 orders or daily revenue mock)
  const chartData = {
    labels: orders.slice(0, 7).reverse().map((o) => o.orderNumber),
    datasets: [
      {
        fill: true,
        label: 'Order Total ($)',
        data: orders.slice(0, 7).reverse().map((o) => o.totalAmount),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // --- EXPORT TO CSV HANDLER ---
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Table', 'Customer', 'Subtotal', 'Tax', 'Service Charge', 'Total Amount', 'Status', 'Payment Method', 'Date'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.table.number,
      o.customer.name,
      o.subtotal,
      o.tax,
      o.serviceCharge,
      o.totalAmount,
      o.status,
      o.paymentMethod,
      new Date(o.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({
      title: 'Report Downloaded',
      description: 'CSV report has been exported successfully.',
      variant: 'success',
    });
  };

  // --- CRUD OPERATIONS ---
  
  // Tables CRUD
  const handleTableSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const number = formData.get('number') as string;
    const capacity = parseInt(formData.get('capacity') as string);

    try {
      let res: any, data: any;
      if (editMode && selectedItem) {
        res = await fetch(`/api/tables/${selectedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number, capacity }),
        });
        data = await res.json();
        setTables(tables.map((t) => (t.id === selectedItem.id ? data.table : t)));
        toast({ title: 'Table Updated', variant: 'success' });
      } else {
        res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number, capacity }),
        });
        data = await res.json();
        setTables([...tables, data.table]);
        toast({ title: 'Table Added', variant: 'success' });
      }
      setModalOpen('none');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTableDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      setTables(tables.filter((t) => t.id !== id));
      toast({ title: 'Table Deleted', variant: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  // Categories CRUD
  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const image = formData.get('image') as string;

    try {
      let res: any, data: any;
      if (editMode && selectedItem) {
        res = await fetch(`/api/categories/${selectedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug, image }),
        });
        data = await res.json();
        setCategories(categories.map((c) => (c.id === selectedItem.id ? data.category : c)));
        toast({ title: 'Category Updated', variant: 'success' });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug, image }),
        });
        data = await res.json();
        setCategories([...categories, data.category]);
        toast({ title: 'Category Added', variant: 'success' });
      }
      setModalOpen('none');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All its food items will be deleted too.')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      setCategories(categories.filter((c) => c.id !== id));
      setFoodItems(foodItems.filter((f) => f.categoryId !== id));
      toast({ title: 'Category Deleted', variant: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  // Food Items CRUD
  const handleFoodItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const preparationTime = parseInt(formData.get('preparationTime') as string);
    const categoryId = formData.get('categoryId') as string;
    const isVeg = formData.get('isVeg') === 'true';
    const isAvailable = formData.get('isAvailable') === 'true';
    const image = formData.get('image') as string;

    const payload = {
      name,
      description,
      price,
      isVeg,
      preparationTime,
      isAvailable,
      image,
      categoryId,
      variants: [],
      extras: [],
    };

    try {
      let res: any, data: any;
      if (editMode && selectedItem) {
        res = await fetch(`/api/fooditems/${selectedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        setFoodItems(foodItems.map((f) => (f.id === selectedItem.id ? data.foodItem : f)));
        toast({ title: 'Food Item Updated', variant: 'success' });
      } else {
        res = await fetch('/api/fooditems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        setFoodItems([...foodItems, data.foodItem]);
        toast({ title: 'Food Item Added', variant: 'success' });
      }
      setModalOpen('none');
    } catch (err) {
      console.error(err);
    }
  };

  const handleFoodItemDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;
    try {
      await fetch(`/api/fooditems/${id}`, { method: 'DELETE' });
      setFoodItems(foodItems.filter((f) => f.id !== id));
      toast({ title: 'Food Item Deleted', variant: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  // --- QR DOWNLOAD HELPER ---
  const handleDownloadQR = async (tableNumber: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/menu?table=${tableNumber}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 500, margin: 3 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `table_${tableNumber}_qr.png`;
      a.click();
      toast({
        title: 'QR Code Generated',
        description: `Downloaded PNG for Table ${tableNumber}`,
        variant: 'success',
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to trigger window print for the active tab view (we can build a simple QR cards print layout)
  const handlePrintAllQRs = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col sm:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full sm:w-64 bg-zinc-900 border-r border-zinc-850 flex flex-col justify-between shrink-0">
        <div className="p-6 space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
              A
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight">Admin Console</h2>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Control Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" /> Overview
            </button>
            
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'menu' ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
              }`}
            >
              <Utensils className="h-4.5 w-4.5" /> Menu Catalog
            </button>

            <button
              onClick={() => setActiveTab('qrs')}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'qrs' ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
              }`}
            >
              <QrCode className="h-4.5 w-4.5" /> QR Management
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'orders' ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
              }`}
            >
              <History className="h-4.5 w-4.5" /> Orders List
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'tables' ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
              }`}
            >
              <Grid className="h-4.5 w-4.5" /> Table Setup
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'reports' ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
              }`}
            >
              <FileText className="h-4.5 w-4.5" /> Export Reports
            </button>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-6 border-t border-zinc-850">
          <Button
            onClick={() => signOut({ callbackUrl: '/login' })}
            variant="ghost"
            className="w-full justify-start rounded-xl text-zinc-400 hover:bg-zinc-850 hover:text-white h-11 text-xs font-bold flex items-center gap-3 cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto no-scrollbar space-y-6 print:p-0 print:bg-white print:text-zinc-950">
        
        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 print:hidden">
            <div>
              <h1 className="text-2xl font-black text-zinc-100">Executive Summary</h1>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">Real-time revenue monitoring and activity stats</p>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Total Sales</span>
                  <p className="text-lg font-black text-zinc-150 mt-0.5">{formatPrice(totalRevenue)}</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">All Orders</span>
                  <p className="text-lg font-black text-zinc-150 mt-0.5">{orders.length}</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Active Tables</span>
                  <p className="text-lg font-black text-zinc-150 mt-0.5">{activeTablesCount}</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <Clock className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Pending Orders</span>
                  <p className="text-lg font-black text-zinc-150 mt-0.5">{pendingOrdersCount}</p>
                </div>
              </div>
            </div>

            {/* Sales Chart & Popular Dishes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sales Chart */}
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-850 p-6 rounded-3xl flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4.5 w-4.5 text-primary" /> Sales Performance Trend
                  </h3>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Popular items list */}
              <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">
                  Popular Dishes
                </h3>
                <div className="divide-y divide-zinc-850">
                  {popularDishes.length === 0 ? (
                    <div className="text-center py-12 text-zinc-650 text-xs">No order statistics yet.</div>
                  ) : (
                    popularDishes.map((dish, i) => (
                      <div key={dish.name} className="py-3 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 bg-zinc-850 rounded flex items-center justify-center font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-zinc-250">{dish.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-zinc-300 block">{dish.count} sold</span>
                          <span className="text-[9px] text-zinc-550">{formatPrice(dish.price)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MENU CATALOG TAB --- */}
        {activeTab === 'menu' && (
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-100">Menu Catalog Manager</h1>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">Configure food categories and menu item descriptions</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setSelectedItem(null);
                    setModalOpen('category');
                  }}
                  className="h-10 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Category
                </Button>
                
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setSelectedItem(null);
                    setModalOpen('foodItem');
                  }}
                  className="h-10 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Food Item
                </Button>
              </div>
            </div>

            {/* Categories list */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div key={c.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl flex justify-between items-center group">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-250">{c.name}</h4>
                      <span className="text-[10px] text-zinc-500">{c.foodItems?.length || 0} items</span>
                    </div>
                    <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditMode(true);
                          setSelectedItem(c);
                          setModalOpen('category');
                        }}
                        className="p-1.5 text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleCategoryDelete(c.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Food items list */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">Food Items</h3>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs divide-y divide-zinc-850">
                  <thead>
                    <tr className="text-zinc-500 uppercase text-[9px] font-bold">
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Prep Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {foodItems.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-850/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-zinc-250">{item.name}</td>
                        <td className="py-3.5 px-4 text-zinc-400">{item.category?.name}</td>
                        <td className="py-3.5 px-4 font-extrabold text-zinc-300">{formatPrice(item.price)}</td>
                        <td className="py-3.5 px-4 text-zinc-400">{item.preparationTime} mins</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              item.isAvailable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditMode(true);
                                setSelectedItem(item);
                                setModalOpen('foodItem');
                              }}
                              className="p-1.5 text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleFoodItemDelete(item.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- QR MANAGEMENT TAB --- */}
        {activeTab === 'qrs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
              <div>
                <h1 className="text-2xl font-black text-zinc-100">Table QR Generator</h1>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">Manage digital menus mapped to specific tables</p>
              </div>

              <Button
                onClick={handlePrintAllQRs}
                className="h-10 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print QR Cards
              </Button>
            </div>

            {/* QRs Display Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 print:grid print:grid-cols-2 print:gap-10">
              {tables.map((table) => {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const pathUrl = `${origin}/menu?table=${table.number}`;

                return (
                  <div
                    key={table.id}
                    className="bg-zinc-900 border border-zinc-850 p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm break-inside-avoid print:bg-white print:border-zinc-300 print:text-zinc-950"
                  >
                    <div className="border border-zinc-800 dark:border-zinc-800 rounded-2xl p-4 bg-white">
                      {/* We display a live canvas helper */}
                      <TableQRImg tableNumber={table.number} url={pathUrl} />
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-150 print:text-zinc-950">Table #{table.number} Label</h4>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Capacity: {table.capacity} guests</p>
                    </div>

                    <div className="flex gap-2 w-full print:hidden">
                      <Button
                        onClick={() => handleDownloadQR(table.number)}
                        variant="outline"
                        className="flex-1 h-9 rounded-xl border-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- ORDER HISTORY TAB --- */}
        {activeTab === 'orders' && (
          <div className="space-y-6 print:hidden">
            <div>
              <h1 className="text-2xl font-black text-zinc-100">Order Logs</h1>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">Historical overview of transactions and status checks</p>
            </div>

            {/* Orders list grid */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs divide-y divide-zinc-850">
                  <thead>
                    <tr className="text-zinc-500 uppercase text-[9px] font-bold">
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Table</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-850/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-zinc-250">{o.orderNumber}</td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-350">#{o.table?.number}</td>
                        <td className="py-3.5 px-4 text-zinc-400">{o.customer?.name}</td>
                        <td className="py-3.5 px-4 font-extrabold text-zinc-250">{formatPrice(o.totalAmount)}</td>
                        <td className="py-3.5 px-4 text-[10px] uppercase font-bold text-zinc-500">
                          {o.paymentMethod.replace('COUNTER_', '')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                              o.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : o.status === 'CANCELLED'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : o.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-500">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TABLES TAB --- */}
        {activeTab === 'tables' && (
          <div className="space-y-6 print:hidden">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-zinc-100">Restaurant Table Setup</h1>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">Configure floor layout capacity and tags</p>
              </div>

              <Button
                onClick={() => {
                  setEditMode(false);
                  setSelectedItem(null);
                  setModalOpen('table');
                }}
                className="h-10 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Table
              </Button>
            </div>

            {/* Tables List */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between h-32 hover:border-zinc-800 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xl font-black text-zinc-200">Table #{table.number}</span>
                        <div className="text-[10px] text-zinc-500 font-semibold mt-1">Capacity: {table.capacity} guests</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border border-zinc-800 bg-zinc-900 text-zinc-400">
                        {table.status}
                      </span>
                    </div>

                    <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity pt-2 border-t border-zinc-900">
                      <button
                        onClick={() => {
                          setEditMode(true);
                          setSelectedItem(table);
                          setModalOpen('table');
                        }}
                        className="p-1.5 text-zinc-450 hover:text-primary transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTableDelete(table.id)}
                        className="p-1.5 text-zinc-450 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- REPORTS EXPORT TAB --- */}
        {activeTab === 'reports' && (
          <div className="space-y-6 print:hidden">
            <div>
              <h1 className="text-2xl font-black text-zinc-100">Export Reports</h1>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">Download database logs and transaction metrics</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-850 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-200">Sales Spreadsheet</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  Export all transaction metrics including customer tags, service charges, taxes, and payment methods in standard CSV format.
                </p>
              </div>
              <Button
                onClick={handleExportCSV}
                className="w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-primary/15 cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download Sales Report (.csv)
              </Button>
            </div>
          </div>
        )}

      </main>

      {/* --- CRUD MODALS --- */}

      {/* 1. Category Modal */}
      {modalOpen === 'category' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-zinc-250">
              {editMode ? 'Edit Category' : 'Create Category'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</label>
                <Input
                  name="name"
                  defaultValue={selectedItem?.name || ''}
                  placeholder="E.g., Starters, Pizzas"
                  required
                  className="bg-zinc-950 border-zinc-850 text-zinc-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Image Path / Link</label>
                <Input
                  name="image"
                  defaultValue={selectedItem?.image || ''}
                  placeholder="/images/categories/starters.jpg"
                  className="bg-zinc-950 border-zinc-850 text-zinc-200 rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 rounded-xl text-xs font-bold h-10">
                  {editMode ? 'Save Changes' : 'Create Category'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setModalOpen('none')}
                  variant="outline"
                  className="flex-1 rounded-xl text-xs font-bold border-zinc-850 text-zinc-400 h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Table Modal */}
      {modalOpen === 'table' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-zinc-250">
              {editMode ? 'Edit Table Configuration' : 'Create Table'}
            </h3>
            <form onSubmit={handleTableSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Table Number</label>
                <Input
                  name="number"
                  type="number"
                  defaultValue={selectedItem?.number || ''}
                  placeholder="E.g. 7"
                  required
                  className="bg-zinc-950 border-zinc-850 text-zinc-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Guest Capacity</label>
                <Input
                  name="capacity"
                  type="number"
                  defaultValue={selectedItem?.capacity || '4'}
                  placeholder="E.g. 4"
                  required
                  className="bg-zinc-950 border-zinc-850 text-zinc-200 rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 rounded-xl text-xs font-bold h-10">
                  {editMode ? 'Save Changes' : 'Create Table'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setModalOpen('none')}
                  variant="outline"
                  className="flex-1 rounded-xl text-xs font-bold border-zinc-850 text-zinc-400 h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Food Item Modal */}
      {modalOpen === 'foodItem' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-base font-extrabold text-zinc-250">
              {editMode ? 'Edit Menu Item' : 'Create Menu Item'}
            </h3>
            <form onSubmit={handleFoodItemSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Item Name</label>
                  <Input
                    name="name"
                    defaultValue={selectedItem?.name || ''}
                    placeholder="E.g., Pepperoni Pizza"
                    required
                    className="bg-zinc-950 border-zinc-850 text-zinc-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Base Price ($)</label>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={selectedItem?.price || ''}
                    placeholder="12.99"
                    required
                    className="bg-zinc-950 border-zinc-850 text-zinc-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Description</label>
                <textarea
                  name="description"
                  defaultValue={selectedItem?.description || ''}
                  placeholder="Detailed description of taste, portion size, ingredients..."
                  className="w-full h-16 p-3 text-xs border border-zinc-850 rounded-xl bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-primary text-zinc-200 placeholder:text-zinc-550 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Preparation Time (mins)</label>
                  <Input
                    name="preparationTime"
                    type="number"
                    defaultValue={selectedItem?.preparationTime || '15'}
                    placeholder="15"
                    required
                    className="bg-zinc-950 border-zinc-850 text-zinc-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Category</label>
                  <select
                    name="categoryId"
                    defaultValue={selectedItem?.categoryId || categories[0]?.id || ''}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 text-zinc-350 rounded-xl text-xs focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Dietary</label>
                  <select
                    name="isVeg"
                    defaultValue={selectedItem?.isVeg ? 'true' : 'false'}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 text-zinc-350 rounded-xl text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="true">Veg</option>
                    <option value="false">Non-Veg</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Availability</label>
                  <select
                    name="isAvailable"
                    defaultValue={selectedItem?.isAvailable ? 'true' : 'false'}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 text-zinc-350 rounded-xl text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Image URL</label>
                  <Input
                    name="image"
                    defaultValue={selectedItem?.image || ''}
                    placeholder="/images/menu/burger.jpg"
                    className="bg-zinc-950 border-zinc-850 text-zinc-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 rounded-xl text-xs font-bold h-10">
                  {editMode ? 'Save Changes' : 'Create Item'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setModalOpen('none')}
                  variant="outline"
                  className="flex-1 rounded-xl text-xs font-bold border-zinc-850 text-zinc-400 h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENT TO RENDER TABLE QR BASE64 IMAGE ---
function TableQRImg({ tableNumber, url }: { tableNumber: string; url: string }) {
  const [qrSrc, setQrSrc] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(url, { width: 300, margin: 2 })
      .then((src) => setQrSrc(src))
      .catch((err) => console.error(err));
  }, [url]);

  if (!qrSrc) return <div className="h-40 w-40 bg-zinc-800 animate-pulse rounded-lg" />;

  return (
    <img
      src={qrSrc}
      alt={`Table ${tableNumber} QR Code`}
      className="h-40 w-40 object-contain"
    />
  );
}
