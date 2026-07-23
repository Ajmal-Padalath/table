import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, image } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { message: 'Missing name or slug.' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: { name, slug, image },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: 'Error creating category.', error: error.message },
      { status: 500 }
    );
  }
}
