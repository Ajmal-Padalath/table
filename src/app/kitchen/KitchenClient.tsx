'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { Clock, Play, CheckCircle, Flame, LogOut, Loader2, ClipboardCheck } from 'lucide-react';

interface KitchenClientProps {
  initialOrders: any[];
}

export function KitchenClient({ initialOrders }: KitchenClientProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const { toast } = useToastStore();
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  
  // Custom force-render state to update elapsed timers
  const [, setTick] = useState(0);

  // Connect to the shared staff dashboard channel
  const { socket, connected } = useSocket('staff-dashboard');

  useEffect(() => {
    // Timer ticker to force re-render every 30 seconds
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Handle new order received in real-time
    socket.on('order-created', (newOrder) => {
      console.log('Realtime order created:', newOrder.orderNumber);
      setOrders((prev) => {
        // Prevent duplicate appending
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [...prev, newOrder];
      });
      toast({
        title: 'New Order Received!',
        description: `Order ${newOrder.orderNumber} placed for Table ${newOrder.table.number}`,
        variant: 'success',
      });
    });

    // Handle order updates from other workers
    socket.on('order-updated', ({ orderId, status, order: updatedOrder }) => {
      console.log('Realtime order updated:', orderId, status);
      setOrders((prev) => {
        // If order was served/completed/cancelled, remove it from kitchen active view
        if (status === 'SERVED' || status === 'COMPLETED' || status === 'CANCELLED') {
          return prev.filter((o) => o.id !== orderId);
        }
        // Otherwise, update the existing order record
        return prev.map((o) => (o.id === orderId ? updatedOrder : o));
      });
    });

    return () => {
      socket.off('order-created');
      socket.off('order-updated');
    };
  }, [socket, toast]);

  const handleUpdateStatus = async (orderId: string, currentStatus: string, nextStatus: string) => {
    setUpdatingIds((prev) => ({ ...prev, [orderId]: true }));

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      // Update local state
      setOrders((prev) => {
        if (nextStatus === 'SERVED') {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => (o.id === orderId ? data.order : o));
      });

      // Emit status changes to all socket listeners
      if (socket) {
        socket.emit('update-order-status', {
          orderId,
          status: nextStatus,
          order: data.order,
        });
      }

      toast({
        title: 'Status Updated',
        description: `Order ${data.order.orderNumber} is now ${nextStatus}`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update order status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const getElapsedTime = (createdAtString: string) => {
    const elapsedMs = Date.now() - new Date(createdAtString).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins < 1) return 'Just now';
    return `${elapsedMins}m ago`;
  };

  // Group active orders
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      
      {/* Header bar */}
      <header className="border-b border-zinc-900 bg-zinc-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
            K
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight">Kitchen Dashboard</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {connected ? 'Live Sync Active' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-850 px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-800">
            Total active orders: <span className="text-primary font-bold">{orders.length}</span>
          </div>

          <Button
            onClick={() => signOut({ callbackUrl: '/login' })}
            variant="ghost"
            className="rounded-xl border border-zinc-850 hover:bg-zinc-900 text-zinc-450 hover:text-white h-9 px-3.5 flex items-center gap-1.5 cursor-pointer text-xs font-bold"
          >
            <LogOut className="h-3.5 w-3.5" /> Out
          </Button>
        </div>
      </header>

      {/* Main Kanban Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
        
        {/* PENDING COLUMN */}
        <div className="flex flex-col h-full bg-zinc-900/40 border border-zinc-900 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <h3 className="font-extrabold text-sm text-zinc-300 uppercase tracking-wider">
                Incoming Orders
              </h3>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-zinc-800 text-zinc-450 rounded-full">
              {pendingOrders.length}
            </span>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
            {pendingOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-600 text-xs">
                <span>No incoming orders.</span>
              </div>
            ) : (
              pendingOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-4 space-y-4 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-sm text-primary block">{o.orderNumber}</span>
                      <span className="text-[10px] font-bold text-zinc-400">Table {o.table.number} • {o.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                      <Clock className="h-3.5 w-3.5 text-zinc-550" />
                      <span>{getElapsedTime(o.createdAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-zinc-850 pt-3">
                    {o.orderItems.map((item: any) => (
                      <div key={item.id} className="text-xs flex justify-between">
                        <div>
                          <span className="font-bold text-zinc-300">
                            {item.foodItem.name} <span className="text-primary font-bold">x{item.quantity}</span>
                          </span>
                          <div className="flex flex-wrap gap-1 mt-0.5 text-[9px] text-zinc-500">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.spiceLevel && <span className="text-orange-500">Spice: {item.spiceLevel}</span>}
                            {item.extras && <span>Addons: {item.extras}</span>}
                          </div>
                          {item.notes && (
                            <p className="text-[9px] italic text-zinc-550 mt-1">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {o.specialRequest && (
                    <div className="p-2 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] text-orange-400">
                      <strong>Special Request:</strong> "{o.specialRequest}"
                    </div>
                  )}

                  <Button
                    onClick={() => handleUpdateStatus(o.id, 'PENDING', 'PREPARING')}
                    disabled={updatingIds[o.id]}
                    className="w-full h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-primary/10"
                  >
                    {updatingIds[o.id] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" /> Accept Order
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PREPARING COLUMN */}
        <div className="flex flex-col h-full bg-zinc-900/40 border border-zinc-900 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <h3 className="font-extrabold text-sm text-zinc-300 uppercase tracking-wider">
                Cooking Queue
              </h3>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-zinc-800 text-zinc-450 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
            {preparingOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-600 text-xs">
                <span>Cooking queue is clear.</span>
              </div>
            ) : (
              preparingOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-4 space-y-4 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-sm text-blue-400 block">{o.orderNumber}</span>
                      <span className="text-[10px] font-bold text-zinc-400">Table {o.table.number} • {o.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                      <Clock className="h-3.5 w-3.5 text-zinc-550" />
                      <span>{getElapsedTime(o.createdAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-zinc-850 pt-3">
                    {o.orderItems.map((item: any) => (
                      <div key={item.id} className="text-xs flex justify-between">
                        <div>
                          <span className="font-bold text-zinc-300">
                            {item.foodItem.name} <span className="text-blue-400 font-bold">x{item.quantity}</span>
                          </span>
                          <div className="flex flex-wrap gap-1 mt-0.5 text-[9px] text-zinc-500">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.spiceLevel && <span className="text-orange-500">Spice: {item.spiceLevel}</span>}
                            {item.extras && <span>Addons: {item.extras}</span>}
                          </div>
                          {item.notes && (
                            <p className="text-[9px] italic text-zinc-550 mt-1">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {o.specialRequest && (
                    <div className="p-2 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] text-orange-400">
                      <strong>Special Request:</strong> "{o.specialRequest}"
                    </div>
                  )}

                  <Button
                    onClick={() => handleUpdateStatus(o.id, 'PREPARING', 'READY')}
                    disabled={updatingIds[o.id]}
                    className="w-full h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/10"
                  >
                    {updatingIds[o.id] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" /> Mark Ready
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* READY TO SERVE COLUMN */}
        <div className="flex flex-col h-full bg-zinc-900/40 border border-zinc-900 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="font-extrabold text-sm text-zinc-300 uppercase tracking-wider">
                Ready to Serve
              </h3>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-zinc-800 text-zinc-450 rounded-full">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
            {readyOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-600 text-xs">
                <span>No orders ready to serve.</span>
              </div>
            ) : (
              readyOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-4 space-y-4 transition-all animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-sm text-emerald-400 block">{o.orderNumber}</span>
                      <span className="text-[10px] font-bold text-zinc-400">Table {o.table.number} • {o.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                      <Clock className="h-3.5 w-3.5 text-zinc-550" />
                      <span>{getElapsedTime(o.createdAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-zinc-850 pt-3">
                    {o.orderItems.map((item: any) => (
                      <div key={item.id} className="text-xs flex justify-between">
                        <div>
                          <span className="font-bold text-zinc-300">
                            {item.foodItem.name} <span className="text-emerald-400 font-bold">x{item.quantity}</span>
                          </span>
                          <div className="flex flex-wrap gap-1 mt-0.5 text-[9px] text-zinc-500">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.spiceLevel && <span className="text-orange-500">Spice: {item.spiceLevel}</span>}
                            {item.extras && <span>Addons: {item.extras}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleUpdateStatus(o.id, 'READY', 'SERVED')}
                    disabled={updatingIds[o.id]}
                    className="w-full h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/10"
                  >
                    {updatingIds[o.id] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <ClipboardCheck className="h-3.5 w-3.5" /> Complete Service
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
