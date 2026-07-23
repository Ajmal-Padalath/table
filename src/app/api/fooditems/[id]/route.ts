import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
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
      variants,
      extras,
    } = body;

    const foodItem = await prisma.$transaction(async (tx) => {
      // 1. Delete existing variants and extras
      await tx.variant.deleteMany({ where: { foodItemId: id } });
      await tx.extra.deleteMany({ where: { foodItemId: id } });

      // 2. Update food item and insert new variants/extras
      return await tx.foodItem.update({
        where: { id },
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
    });

    return NextResponse.json({ foodItem });
  } catch (error: any) {
    console.error('Error updating food item:', error);
    return NextResponse.json(
      { message: 'Error updating food item.', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await prisma.foodItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Food item deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting food item:', error);
    return NextResponse.json(
      { message: 'Error deleting food item.', error: error.message },
      { status: 500 }
    );
  }
}
