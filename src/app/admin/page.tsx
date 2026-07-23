import React from 'react';
import { prisma } from '@/lib/db';
import { AdminClient } from './AdminClient';

export default async function AdminPage() {
  const tables = await prisma.table.findMany({
    orderBy: { number: 'asc' },
  });

  const categories = await prisma.category.findMany({
    include: {
      foodItems: true,
    },
    orderBy: { name: 'asc' },
  });

  const foodItems = await prisma.foodItem.findMany({
    include: {
      category: true,
      variants: true,
      extras: true,
    },
    orderBy: { name: 'asc' },
  });

  const orders = await prisma.order.findMany({
    include: {
      table: true,
      customer: true,
      orderItems: {
        include: {
          foodItem: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminClient
      initialTables={tables}
      initialCategories={categories}
      initialFoodItems={foodItems}
      initialOrders={orders}
    />
  );
}
