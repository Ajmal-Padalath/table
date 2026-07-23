'use client';

import React, { useState, useEffect } from 'react';
import { X, Flame, ShieldAlert, Clock, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, CartExtra } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice } from '@/lib/utils';

export const IMAGE_FALLBACKS: Record<string, string> = {
  'starters': 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=400&q=80',
  'soups': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80',
  'main-course': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
  'burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  'drinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'desserts': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
  
  // Menu items
  'Cheesy Garlic Bread': 'https://images.unsplash.com/photo-1573145959986-a15c2ec389a8?auto=format&fit=crop&w=400&q=80',
  'Crispy Veg Spring Rolls': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
  'Creamy Tomato Basil Soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80',
  'Margherita Pizza': 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&q=80',
  'Pepperoni Feast Pizza': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
  'Classic Beef Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  'Spicy Quinoa & Veggie Burger': 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=400&q=80',
  'Lemon Herb Grilled Salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
  'Penne Alfredo Pasta': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&q=80',
  'Fresh Mint Lime Soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'Iced Caramel Macchiato': 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=400&q=80',
  'Warm Chocolate Lava Cake': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
  'Classic New York Cheesecake': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80',
};

interface FoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: any;
}

export function FoodItemModal({ isOpen, onClose, foodItem }: FoodItemModalProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const toast = useToastStore((state) => state.toast);

  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedExtras, setSelectedExtras] = useState<CartExtra[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<string>('Medium');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (foodItem) {
      if (foodItem.variants && foodItem.variants.length > 0) {
        setSelectedVariant(foodItem.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setSelectedExtras([]);
      setSpiceLevel('Medium');
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [foodItem]);

  if (!isOpen || !foodItem) return null;

  const imageUrl = IMAGE_FALLBACKS[foodItem.name] || foodItem.image || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80';

  const basePrice = selectedVariant ? selectedVariant.price : foodItem.price;
  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const singleItemPrice = basePrice + extrasTotal;
  const totalPrice = singleItemPrice * quantity;

  const handleToggleExtra = (extra: any) => {
    const exists = selectedExtras.some((e) => e.name === extra.name);
    if (exists) {
      setSelectedExtras(selectedExtras.filter((e) => e.name !== extra.name));
    } else {
      setSelectedExtras([...selectedExtras, { name: extra.name, price: extra.price }]);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      foodItemId: foodItem.id,
      name: foodItem.name,
      image: foodItem.image,
      basePrice: foodItem.price,
      price: singleItemPrice,
      quantity,
      size: selectedVariant ? selectedVariant.name : undefined,
      spiceLevel: foodItem.category?.slug === 'drinks' || foodItem.category?.slug === 'desserts' ? undefined : spiceLevel,
      extras: selectedExtras,
      notes: specialInstructions || undefined,
    });

    toast({
      title: 'Added to Cart',
      description: `${quantity}x ${foodItem.name} added successfully.`,
      variant: 'success',
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Image */}
        <div className="relative h-56 shrink-0 w-full bg-zinc-100 dark:bg-zinc-800">
          <img
            src={imageUrl}
            alt={foodItem.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                foodItem.isVeg ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              {foodItem.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-black/50 backdrop-blur-xs">
              <Clock className="h-3 w-3" /> {foodItem.preparationTime} mins
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <div>
            <h2 className="text-2xl font-bold dark:text-zinc-50">{foodItem.name}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
              {foodItem.description}
            </p>
          </div>

          {/* Variants / Size Section */}
          {foodItem.variants && foodItem.variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-400">
                Choose Size
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {foodItem.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 text-center border-2 rounded-xl transition-all cursor-pointer text-sm font-medium ${
                      selectedVariant?.id === v.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="block">{v.name}</div>
                    <div className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">
                      {formatPrice(v.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extras / Toppings Section */}
          {foodItem.extras && foodItem.extras.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-400">
                Add-ons
              </h3>
              <div className="space-y-2">
                {foodItem.extras.map((ex: any) => {
                  const isChecked = selectedExtras.some((e) => e.name === ex.name);
                  return (
                    <label
                      key={ex.id}
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        isChecked ? 'border-primary/40 bg-primary/2' : 'border-zinc-100 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleExtra(ex)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-zinc-300"
                        />
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {ex.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                        +{formatPrice(ex.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spice Level Selection */}
          {foodItem.category?.slug !== 'drinks' && foodItem.category?.slug !== 'desserts' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" /> Spice Level
              </h3>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                {['Mild', 'Medium', 'Spicy'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSpiceLevel(level)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      spiceLevel === level
                        ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-950 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Requests */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-400">
              Special Instructions
            </h3>
            <textarea
              placeholder="E.g., No onions, extra napkins, allergy to nuts..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full h-20 p-3 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200 resize-none"
            />
          </div>
        </div>

        {/* Footer Add Section */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-6 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1.5 shadow-xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-bold text-lg text-zinc-850 dark:text-zinc-100">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            className="px-8 h-12 rounded-xl text-base font-bold flex items-center gap-2"
          >
            Add to Order • {formatPrice(totalPrice)}
          </Button>
        </div>
      </div>
    </div>
  );
}
