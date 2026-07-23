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
    const { status, capacity, number } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (capacity !== undefined) data.capacity = parseInt(capacity);
    if (number !== undefined) {
      data.number = String(number);
      data.qrCodeUrl = `/menu?table=${number}`;
    }

    const table = await prisma.table.update({
      where: { id },
      data,
    });

    return NextResponse.json({ table });
  } catch (error: any) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { message: 'Error updating table.', error: error.message },
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

    await prisma.table.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Table deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { message: 'Error deleting table.', error: error.message },
      { status: 500 }
    );
  }
}
