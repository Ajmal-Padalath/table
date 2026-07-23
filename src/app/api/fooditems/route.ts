import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      isVeg,
      preparationTime,
      isAvailable,
      image,
      categoryId,
      variants, // array of { name, price }
      extras,   // array of { name, price }
    } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { message: 'Missing name, price, or category.' },
        { status: 400 }
      );
    }

    const foodItem = await prisma.foodItem.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        isVeg: Boolean(isVeg),
        preparationTime: parseInt(preparationTime) || 15,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        image: image || null,
        categoryId,
        variants: {
          create: variants && Array.isArray(variants) 
            ? variants.map((v) => ({ name: v.name, price: parseFloat(v.price) }))
            : [],
        },
        extras: {
          create: extras && Array.isArray(extras) 
            ? extras.map((e) => ({ name: e.name, price: parseFloat(e.price) }))
            : [],
        },
      },
      include: {
        variants: true,
        extras: true,
        category: true,
      },
    });

    return NextResponse.json({ foodItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating food item:', error);
    return NextResponse.json(
      { message: 'Error creating food item.', error: error.message },
      { status: 500 }
    );
  }
}
