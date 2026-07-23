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
    const { name, slug, image } = body;

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, image },
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { message: 'Error updating category.', error: error.message },
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

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Category deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { message: 'Error deleting category.', error: error.message },
      { status: 500 }
    );
  }
}
