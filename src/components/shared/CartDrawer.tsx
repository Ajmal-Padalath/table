'use client';

import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taxRate?: number;
  serviceChargeRate?: number;
}

export function CartDrawer({ isOpen, onClose, taxRate = 5, serviceChargeRate = 10 }: CartDrawerProps) {
  const router = useRouter();
  const { cartItems, tableNumber, customerName, customerPhone, updateQuantity, removeFromCart, clearCart, setCustomerInfo, initializeSession } = useCartStore();
  const toast = useToastStore((state) => state.toast);

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [paymentMethod, setPaymentMethod] = useState<'COUNTER_CASH' | 'COUNTER_CARD' | 'ONLINE_STRIPE'>('COUNTER_CASH');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = (subtotal * taxRate) / 100;
  const serviceCharge = (subtotal * serviceChargeRate) / 100;
  const totalAmount = subtotal + tax + serviceCharge;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) {
      toast({
        title: 'Error',
        description: 'No table selected. Please scan a table QR code.',
        variant: 'destructive',
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name to place the order.',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'ONLINE_STRIPE') {
      if (!cardNumber || !cardExpiry || !cardCVC) {
        toast({
          title: 'Card Details Required',
          description: 'Please fill in your payment card details.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    setCustomerInfo(name, phone);
    const sessionToken = initializeSession();

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          customerName: name,
          customerPhone: phone || null,
          sessionToken,
          paymentMethod,
          subtotal,
          tax,
          serviceCharge,
          totalAmount,
          items: cartItems.map((item) => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity,
            price: item.price,
            size: item.size || null,
            spiceLevel: item.spiceLevel || null,
            notes: item.notes || null,
            extras: item.extras.map((e) => e.name).join(', ') || null,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Emit new order to staff dashboards
      const socket = io();
      socket.emit('new-order', data.order);
      socket.disconnect();

      // Show success toast
      toast({
        title: 'Order Placed!',
        description: `Your order ${data.order.orderNumber} has been received.`,
        variant: 'success',
      });

      // Clear local cart
      clearCart();
      onClose();

      // Redirect to tracking page
      router.push(`/order/${data.order.id}`);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Order Failed',
        description: err.message || 'Could not place your order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-zinc-50">Your Order Cart</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Table {tableNumber || 'None'} • {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {cartItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-400 space-y-3">
              <span className="text-4xl">😋</span>
              <p className="text-sm font-medium">Your cart is empty.</p>
              <p className="text-xs text-zinc-500">Scan and add some items to get started!</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50/40 dark:bg-zinc-900/40"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </h4>
                    <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                  
                  {/* Customizations tags */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.size && (
                      <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded text-[10px] font-medium">
                        {item.size}
                      </span>
                    )}
                    {item.spiceLevel && (
                      <span className="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded text-[10px] font-medium">
                        Spice: {item.spiceLevel}
                      </span>
                    )}
                    {item.extras.map((ex) => (
                      <span
                        key={ex.name}
                        className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded text-[10px] font-medium"
                      >
                        +{ex.name}
                      </span>
                    ))}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-zinc-400 italic mt-1.5">
                      " {item.notes} "
                    </p>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 bg-white dark:bg-zinc-800">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-zinc-800 dark:text-zinc-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Form & Summary */}
        {cartItems.length > 0 && (
          <form
            onSubmit={handlePlaceOrder}
            className="border-t border-zinc-100 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-4 shrink-0"
          >
            {/* Customer Details */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Customer Details
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Your Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10"
                />
                <Input
                  placeholder="Phone (Optional)"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COUNTER_CASH')}
                  className={`flex flex-col items-center py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    paymentMethod === 'COUNTER_CASH'
                      ? 'bg-white dark:bg-zinc-700 shadow-xs text-zinc-950 dark:text-white'
                      : 'text-zinc-550 dark:text-zinc-400'
                  }`}
                >
                  <DollarSign className="h-4 w-4 mb-0.5" />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COUNTER_CARD')}
                  className={`flex flex-col items-center py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    paymentMethod === 'COUNTER_CARD'
                      ? 'bg-white dark:bg-zinc-700 shadow-xs text-zinc-950 dark:text-white'
                      : 'text-zinc-550 dark:text-zinc-400'
                  }`}
                >
                  <CreditCard className="h-4 w-4 mb-0.5" />
                  Counter Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE_STRIPE')}
                  className={`flex flex-col items-center py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    paymentMethod === 'ONLINE_STRIPE'
                      ? 'bg-white dark:bg-zinc-700 shadow-xs text-zinc-950 dark:text-white'
                      : 'text-zinc-550 dark:text-zinc-400'
                  }`}
                >
                  <Smartphone className="h-4 w-4 mb-0.5" />
                  Stripe Pay
                </button>
              </div>
            </div>

            {/* Mock Credit Card Fields if Online Stripe selected */}
            {paymentMethod === 'ONLINE_STRIPE' && (
              <div className="p-3 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Input
                  placeholder="Card Number (mock)"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  maxLength={19}
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 h-9 text-xs rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    maxLength={5}
                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 h-9 text-xs rounded-lg"
                  />
                  <Input
                    placeholder="CVC"
                    type="password"
                    value={cardCVC}
                    onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ''))}
                    maxLength={3}
                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 h-9 text-xs rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Order Price Details */}
            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Taxes ({taxRate}%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Service Charge ({serviceChargeRate}%)</span>
                <span>{formatPrice(serviceCharge)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-800 dark:text-zinc-150 pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                <span>Total Amount</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Order button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/25 transition-all hover:scale-101 cursor-pointer"
            >
              {isSubmitting ? 'Processing Order...' : `Place Order • ${formatPrice(totalAmount)}`}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
