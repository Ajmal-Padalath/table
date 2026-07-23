'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { LogOut, RefreshCcw, DollarSign, Ban, ShieldAlert, Check, HelpCircle, Users } from 'lucide-react';

interface WaiterClientProps {
  initialTables: any[];
  initialOrders: any[];
}

export function WaiterClient({ initialTables, initialOrders }: WaiterClientProps) {
  const [tables, setTables] = useState<any[]>(initialTables);
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    initialTables.length > 0 ? initialTables[0].id : null
  );
  const { toast } = useToastStore();
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Connect to the shared staff dashboard channel
  const { socket, connected } = useSocket('staff-dashboard');

  useEffect(() => {
    if (!socket) return;

    // Listen to real-time table status changes
    socket.on('table-status-changed', ({ tableId, status }) => {
      console.log('Realtime table status change:', tableId, status);
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );
    });

    // Listen to incoming new orders to flag table as OCCUPIED
    socket.on('order-created', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      setTables((prev) =>
        prev.map((t) => (t.id === newOrder.tableId ? { ...t, status: 'OCCUPIED' } : t))
      );
      toast({
        title: 'New Order Placed!',
        description: `Order ${newOrder.orderNumber} placed for Table ${newOrder.table.number}`,
        variant: 'default',
      });
    });

    // Listen to status updates of orders
    socket.on('order-updated', ({ orderId, status, order: updatedOrder }) => {
      setOrders((prev) => {
        // If order completed/cancelled, remove from active list
        if (status === 'COMPLETED' || status === 'CANCELLED') {
          return prev.filter((o) => o.id !== orderId);
        }
        // Otherwise, update details
        if (prev.some((o) => o.id === orderId)) {
          return prev.map((o) => (o.id === orderId ? updatedOrder : o));
        } else {
          return [updatedOrder, ...prev];
        }
      });

      // Update corresponding table status based on order update
      const tableStatus =
        status === 'SERVED' || status === 'READY'
          ? 'READY_TO_SERVE'
          : status === 'COMPLETED' || status === 'CANCELLED'
          ? 'AVAILABLE'
          : 'OCCUPIED';

      setTables((prev) =>
        prev.map((t) => (t.id === updatedOrder.tableId ? { ...t, status: tableStatus } : t))
      );
    });

    return () => {
      socket.off('table-status-changed');
      socket.off('order-created');
      socket.off('order-updated');
    };
  }, [socket, toast]);

  const handleUpdateTableStatus = async (tableId: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update table');

      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: data.table.status } : t))
      );

      // Emit status changes to socket
      if (socket) {
        socket.emit('update-table-status', { tableId, status });
      }

      toast({
        title: 'Table Status Updated',
        description: `Table status is now ${status}`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update table status.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompletePayment = async (orderId: string, tableId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to complete order');

      // Update state
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: 'AVAILABLE' } : t))
      );

      // Emit socket notification
      if (socket) {
        socket.emit('update-order-status', {
          orderId,
          status: 'COMPLETED',
          order: data.order,
        });
      }

      toast({
        title: 'Payment Completed',
        description: `Order ${data.order.orderNumber} successfully paid and table cleared.`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Transaction Failed',
        description: err.message || 'Could not record payment.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const activeTableOrder = orders.find(
    (o) => o.tableId === selectedTableId && ['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-150 flex flex-col font-sans">
      
      {/* Header bar */}
      <header className="border-b border-zinc-900 bg-zinc-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
            W
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight">Waiter Floor Service</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {connected ? 'Live Sync Active' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => signOut({ callbackUrl: '/login' })}
            variant="ghost"
            className="rounded-xl border border-zinc-850 hover:bg-zinc-900 text-zinc-450 hover:text-white h-9 px-3.5 flex items-center gap-1.5 cursor-pointer text-xs font-bold"
          >
            <LogOut className="h-3.5 w-3.5" /> Out
          </Button>
        </div>
      </header>

      {/* Main Floor Grid Layout */}
      <main className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* Floor Map Layout */}
        <div className="flex-1 bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 flex flex-col space-y-4 overflow-y-auto no-scrollbar">
          <div>
            <h2 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">Restaurant Floor Plan</h2>
            <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Select a table to manage guest orders and bills</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {tables.map((table) => {
              const isSelected = selectedTableId === table.id;
              const hasOrder = orders.some((o) => o.tableId === table.id);

              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`p-5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-36 relative ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-zinc-850 bg-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <span className="text-2xl font-black text-zinc-200">#{table.number}</span>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1 font-semibold">
                        <Users className="h-3 w-3" /> Cap: {table.capacity}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold tracking-wider uppercase border ${
                        table.status === 'AVAILABLE'
                          ? 'bg-zinc-800/50 text-zinc-400 border-zinc-850'
                          : table.status === 'READY_TO_SERVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : table.status === 'WAITING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}
                    >
                      {table.status.replace('_', ' ')}
                    </span>
                  </div>

                  {hasOrder && (
                    <div className="text-[10px] font-bold text-primary animate-pulse flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Active Order
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Workspace */}
        <div className="w-full md:w-[400px] bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6 flex flex-col h-full shrink-0 overflow-y-auto no-scrollbar">
          {selectedTable ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="border-b border-zinc-850 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-zinc-150">Table #{selectedTable.number} Details</h3>
                  <span className="text-xs text-zinc-550 font-semibold">Capacity: {selectedTable.capacity} guests</span>
                </div>
                
                {/* Manual override Status */}
                <select
                  value={selectedTable.status}
                  onChange={(e) => handleUpdateTableStatus(selectedTable.id, e.target.value)}
                  disabled={actionLoading}
                  className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-xs rounded-xl px-2.5 py-1.5 text-zinc-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="WAITING">Waiting / Help</option>
                  <option value="READY_TO_SERVE">Ready to Serve</option>
                </select>
              </div>

              {/* Active Guest Info */}
              {activeTableOrder ? (
                <div className="space-y-6">
                  <div className="bg-zinc-950/40 p-4 border border-zinc-850 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Guest Name</span>
                      <span className="font-bold text-zinc-300">{activeTableOrder.customer.name}</span>
                    </div>
                    {activeTableOrder.customer.phone && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-semibold">Phone</span>
                        <span className="font-bold text-zinc-350">{activeTableOrder.customer.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Order ID</span>
                      <span className="font-mono text-zinc-400 font-bold">{activeTableOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Order Status</span>
                      <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] uppercase tracking-wider">
                        {activeTableOrder.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ordered Menu Items</h4>
                    <div className="divide-y divide-zinc-850 border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden">
                      {activeTableOrder.orderItems.map((item: any) => (
                        <div key={item.id} className="p-3 text-xs flex justify-between items-start gap-4">
                          <div>
                            <span className="font-bold text-zinc-300">
                              {item.foodItem.name} <span className="text-zinc-500 font-bold">x{item.quantity}</span>
                            </span>
                            <div className="flex flex-wrap gap-1 text-[8.5px] text-zinc-550 mt-0.5">
                              {item.size && <span>{item.size}</span>}
                              {item.spiceLevel && <span>Spice: {item.spiceLevel}</span>}
                              {item.extras && <span>Addons: {item.extras}</span>}
                            </div>
                          </div>
                          <span className="font-bold text-zinc-300">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bill Summary */}
                  <div className="bg-zinc-950/40 p-4 border border-zinc-850 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal</span>
                      <span className="font-bold text-zinc-300">{formatPrice(activeTableOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Tax</span>
                      <span className="font-bold text-zinc-300">{formatPrice(activeTableOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Service Charge</span>
                      <span className="font-bold text-zinc-300">{formatPrice(activeTableOrder.serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-zinc-150 pt-2 border-t border-dashed border-zinc-800 text-sm">
                      <span>Total Invoice</span>
                      <span className="text-primary">{formatPrice(activeTableOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-850">
                      <span>Payment Method</span>
                      <span className="font-bold uppercase tracking-wider text-zinc-400">
                        {activeTableOrder.paymentMethod.replace('COUNTER_', 'COUNTER ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      onClick={() => handleCompletePayment(activeTableOrder.id, selectedTable.id)}
                      disabled={actionLoading}
                      className="rounded-xl h-10 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <DollarSign className="h-4 w-4" /> Paid & Clear
                    </Button>
                    
                    <Button
                      onClick={() => handleUpdateTableStatus(selectedTable.id, 'AVAILABLE')}
                      disabled={actionLoading}
                      variant="outline"
                      className="rounded-xl h-10 text-xs font-bold border-zinc-850 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <Ban className="h-4 w-4" /> Reset Table
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-64 border border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-zinc-600 space-y-2">
                  <Check className="h-10 w-10 text-zinc-700" />
                  <h4 className="font-semibold text-xs text-zinc-400">No active orders</h4>
                  <p className="text-[10px] text-zinc-500">Table is available and ready for guests.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-zinc-600 text-xs">
              <span>Select a table from the floor map to get started.</span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
