import React from 'react';
import { prisma } from '@/lib/db';
import { KitchenClient } from './KitchenClient';

export default async function KitchenPage() {
  const initialOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ['PENDING', 'PREPARING', 'READY'],
      },
    },
    include: {
      table: true,
      customer: true,
      orderItems: {
        include: {
          foodItem: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return <KitchenClient initialOrders={initialOrders} />;
}
