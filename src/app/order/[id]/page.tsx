import React from 'react';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { OrderTrackerClient } from './OrderTrackerClient';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      customer: true,
      orderItems: {
        include: {
          foodItem: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return <OrderTrackerClient initialOrder={order} />;
}
