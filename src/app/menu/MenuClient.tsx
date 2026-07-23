'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Sun, Moon, Utensils, Star, Clock, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { FoodItemModal, IMAGE_FALLBACKS } from '@/components/shared/FoodItemModal';
import { CartDrawer } from '@/components/shared/CartDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MenuClientProps {
  restaurant: any;
  categories: any[];
  initialTable: string | null;
  tables: any[];
}

export function MenuClient({ restaurant, categories, initialTable, tables }: MenuClientProps) {
  const { tableNumber, setTable, cartItems, initializeSession } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFoodItem, setSelectedFoodItem] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Initialize session and set table from QR code URL if present
  useEffect(() => {
    initializeSession();
    if (initialTable) {
      setTable(initialTable);
    } else if (!tableNumber) {
      // Fallback: If no table context, auto assign Table 1 for demo purposes
      setTable('1');
    }
  }, [initialTable, setTable, tableNumber, initializeSession]);

  // Dark Mode side effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Filter food items
  const allFoodItems = categories.flatMap((cat) =>
    cat.foodItems.map((item: any) => ({ ...item, category: cat }))
  );

  const filteredFoodItems = allFoodItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category.slug === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 transition-colors duration-250">
      
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
              {restaurant?.name?.charAt(0) || 'G'}
            </div>
            <div>
              <h1 className="font-bold text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                {restaurant?.name || 'Gourmet Haven'}
              </h1>
              <p className="text-xs text-zinc-400 font-medium">
                {tableNumber ? `Table ${tableNumber}` : 'Scanning Table...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-550 dark:text-zinc-400 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Desktop Cart Button */}
            <Button
              onClick={() => setIsCartOpen(true)}
              variant="outline"
              className="relative hidden sm:flex items-center gap-2 rounded-xl border-zinc-200 dark:border-zinc-700 h-10 px-4"
            >
              <ShoppingBag className="h-4.5 w-4.5 text-primary" />
              <span className="font-bold text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary text-white font-extrabold rounded-full">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-8">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-orange-500/10">
          <div className="relative z-10 max-w-lg space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Order directly from your table
            </h2>
            <p className="text-orange-50/80 text-xs sm:text-sm font-medium leading-relaxed">
              {restaurant?.description || 'Browse our categories, customize your order, and track the process in real-time. No sign-up required.'}
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center justify-center pr-6">
            <Utensils className="h-48 w-48 rotate-12" />
          </div>
        </div>

        {/* Search & Category Filter Section */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search dishes, ingredients, starters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-sm focus-visible:ring-primary shadow-xs"
            />
          </div>

          {/* Categories Tab Scroll */}
          <div className="overflow-x-auto no-scrollbar py-2 -mx-4 px-4 flex gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-3 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
              }`}
            >
              All Dishes
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                  selectedCategory === cat.slug
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Food Items Display */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 capitalize">
              {selectedCategory === 'all' ? 'Popular Menu' : selectedCategory}
            </h3>
            <span className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">
              {filteredFoodItems.length} items found
            </span>
          </div>

          {filteredFoodItems.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-400 flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="h-10 w-10 text-zinc-400" />
              <p className="text-sm font-semibold">No items match your search.</p>
              <p className="text-xs text-zinc-500">Try looking for something else on our menu!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoodItems.map((item) => {
                const imageUrl = IMAGE_FALLBACKS[item.name] || item.image || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80';
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFoodItem(item)}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    {/* Item Image */}
                    <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white ${
                            item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        >
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/55 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        <Clock className="h-3 w-3" /> {item.preparationTime}m
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors">
                            {item.name}
                          </h4>
                          <div className="flex items-center text-amber-500 gap-0.5 shrink-0 mt-0.5">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
                            <span className="text-[10px] font-extrabold">{item.rating}</span>
                          </div>
                        </div>
                        <p className="text-zinc-450 dark:text-zinc-400 text-xs leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-50 dark:border-zinc-800">
                        <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-50">
                          {formatPrice(item.price)}
                        </span>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFoodItem(item);
                          }}
                          size="sm"
                          className="h-8 rounded-lg px-3 font-bold text-xs flex items-center gap-1 hover:scale-103 cursor-pointer"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Cart Indicator (Mobile First) */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white/90 dark:bg-zinc-900/90 border-t border-zinc-150 dark:border-zinc-800 backdrop-blur-md sm:hidden flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold">{cartCount} items selected</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatPrice(cartTotal)}</p>
            </div>
          </div>
          
          <Button
            onClick={() => setIsCartOpen(true)}
            className="px-6 h-11 rounded-xl font-bold text-sm cursor-pointer shadow-md shadow-primary/20"
          >
            View Cart
          </Button>
        </div>
      )}

      {/* Food Details Selection Modal */}
      <FoodItemModal
        isOpen={!!selectedFoodItem}
        onClose={() => setSelectedFoodItem(null)}
        foodItem={selectedFoodItem}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        taxRate={restaurant?.taxRate || 5}
        serviceChargeRate={restaurant?.serviceChargeRate || 10}
      />
    </div>
  );
}
