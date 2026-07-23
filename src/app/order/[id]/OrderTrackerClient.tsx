'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, ChefHat, BellRing, Sparkles, Send, Star } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToastStore } from '@/store/useToastStore';
import confetti from 'canvas-confetti';

interface OrderTrackerClientProps {
  initialOrder: any;
}

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Received', desc: 'We have received your order and sent it to the kitchen.', icon: BellRing },
  { key: 'PREPARING', label: 'Preparing', desc: 'Our master chefs are cooking your fresh gourmet meal.', icon: ChefHat },
  { key: 'READY', label: 'Ready to Serve', desc: 'Your food is cooked and ready! A waiter is bringing it shortly.', icon: Sparkles },
  { key: 'SERVED', label: 'Served & Enjoying', desc: 'Food is served! Bon appétit!', icon: CheckCircle2 },
];

export function OrderTrackerClient({ initialOrder }: OrderTrackerClientProps) {
  const [order, setOrder] = useState(initialOrder);
  const { toast } = useToastStore();

  // Socket connection to order status channel
  const { socket } = useSocket(`order-tracker:${order.id}`);

  // Feedback form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('order-status-changed', ({ status, order: updatedOrder }) => {
      console.log('Order status updated via socket:', status);
      setOrder(updatedOrder);
      
      let title = 'Order Status Updated';
      let desc = `Your order status is now ${status}.`;

      if (status === 'PREPARING') {
        title = 'Chef has started cooking!';
        desc = 'Your food is now being prepared.';
      } else if (status === 'READY') {
        title = 'Food is ready!';
        desc = 'A waiter is bringing your meal to table ' + updatedOrder.table.number;
        confetti({ particleCount: 60, spread: 60 });
      } else if (status === 'SERVED') {
        title = 'Served!';
        desc = 'Your order has been served. Enjoy your meal!';
        confetti({ particleCount: 100, spread: 80 });
      }

      toast({
        title,
        description: desc,
        variant: 'success',
      });
    });

    return () => {
      socket.off('order-status-changed');
    };
  }, [socket, toast]);

  // Find active step index
  const activeStepIndex = STATUS_STEPS.findIndex((step) => step.key === order.status);

  // Calculate estimated time remaining
  const maxPrepTime = order.orderItems.reduce(
    (max: number, item: any) => Math.max(max, item.foodItem.preparationTime || 15),
    0
  );

  const createdAtTime = new Date(order.createdAt).getTime();
  const timeElapsed = Math.floor((Date.now() - createdAtTime) / 60000);
  const estimatedRemaining = Math.max(0, maxPrepTime - timeElapsed);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      // Send feedback details (or simulate successful submission to server)
      console.log('Submitted Feedback for Order:', order.id, { rating, feedbackComment });
      
      confetti({
        particleCount: 150,
        spread: 80,
        colors: ['#f97316', '#fb923c', '#fdba74'],
      });

      setFeedbackSubmitted(true);
      toast({
        title: 'Feedback Received',
        description: 'Thank you for your valuable feedback!',
        variant: 'success',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 transition-colors duration-200">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
          <h2 className="text-zinc-400 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
            Order Status Tracking
          </h2>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            {order.orderNumber}
          </span>
          <p className="text-xs font-semibold text-zinc-500">
            Table {order.table.number} • {order.customer.name}
          </p>

          {/* Time Estimator */}
          {order.status !== 'SERVED' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <div className="mt-4 flex items-center gap-2 bg-primary/5 px-4 py-2.5 rounded-2xl text-primary border border-primary/10">
              <Clock className="h-4.5 w-4.5 animate-pulse" />
              <span className="text-xs font-bold">
                Est. Delivery: {estimatedRemaining > 0 ? `${estimatedRemaining} mins` : 'Any moment now!'}
              </span>
            </div>
          )}
        </div>

        {/* Real-time Order Process Timeline */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-450 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            Track Progress
          </h3>
          
          <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < activeStepIndex;
              const isActive = idx === activeStepIndex;
              const isPending = idx > activeStepIndex;

              return (
                <div key={step.key} className="relative group">
                  {/* Circle Indicator */}
                  <div
                    className={`absolute -left-8 top-0.5 h-7.5 w-7.5 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-primary text-white border border-primary'
                        : isActive
                        ? 'bg-orange-500 text-white border-2 border-orange-200 dark:border-orange-950 animate-pulse'
                        : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-bold transition-colors ${
                        isActive
                          ? 'text-primary'
                          : isCompleted
                          ? 'text-zinc-850 dark:text-zinc-200'
                          : 'text-zinc-400 dark:text-zinc-550'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className={`text-xs mt-1 leading-relaxed ${isActive ? 'text-zinc-600 dark:text-zinc-350' : 'text-zinc-400 dark:text-zinc-500'}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & Summary Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-450 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            Items Ordered
          </h3>
          
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
            {order.orderItems.map((item: any) => (
              <div key={item.id} className="py-3 flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {item.foodItem.name} <span className="text-zinc-400 text-xs">x{item.quantity}</span>
                  </h4>
                  {item.size && (
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.5 rounded font-medium mr-1.5">
                      {item.size}
                    </span>
                  )}
                  {item.spiceLevel && (
                    <span className="text-[10px] bg-orange-50 dark:bg-orange-950/20 text-orange-600 px-1 py-0.5 rounded font-medium mr-1.5">
                      Spice: {item.spiceLevel}
                    </span>
                  )}
                  {item.extras && (
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Addons: {item.extras}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-zinc-400 italic mt-0.5">
                      Note: "{item.notes}"
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Tax ({order.taxRate || 5}%)</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Service Charge ({order.serviceChargeRate || 10}%)</span>
              <span>{formatPrice(order.serviceCharge)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-zinc-800 dark:text-zinc-50 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span>Total Amount</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Feedback section (only shown when order is SERVED or COMPLETED) */}
        {(order.status === 'SERVED' || order.status === 'COMPLETED') && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 animate-in slide-in-from-bottom-5 duration-350">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
                Rate Your Experience
              </h3>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>

            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-xs text-zinc-500">
                  We look forward to serving you again. Have a wonderful day!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {/* Rating stars */}
                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 cursor-pointer transition-transform duration-100 hover:scale-115"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-450 dark:text-zinc-500">
                    Your suggestions / comments
                  </label>
                  <textarea
                    placeholder="Tell us what you liked, or how we can improve..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full h-20 p-3 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" /> Submit Review
                </Button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
