import React from 'react';
import { prisma } from '@/lib/db';
import { MenuClient } from './MenuClient';

interface MenuPageProps {
  searchParams: Promise<{ table?: string }>;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const resolvedParams = await searchParams;
  const initialTable = resolvedParams.table || null;

  // Fetch restaurant configuration
  const restaurant = await prisma.restaurant.findFirst();

  // Fetch active categories and food items
  const categories = await prisma.category.findMany({
    include: {
      foodItems: {
        include: {
          variants: true,
          extras: true,
        },
      },
    },
  });

  // Fetch tables
  const tables = await prisma.table.findMany();

  return (
    <MenuClient
      restaurant={restaurant}
      categories={categories}
      initialTable={initialTable}
      tables={tables}
    />
  );
}
