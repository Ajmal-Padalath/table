import React from 'react';
import { prisma } from '@/lib/db';
import { WaiterClient } from './WaiterClient';

export default async function WaiterPage() {
  const tables = await prisma.table.findMany({
    orderBy: {
      number: 'asc',
    },
  });

  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ['PENDING', 'PREPARING', 'READY', 'SERVED'],
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
      createdAt: 'desc',
    },
  });

  return <WaiterClient initialTables={tables} initialOrders={activeOrders} />;
}
