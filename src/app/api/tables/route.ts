import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { number, capacity } = body;

    if (!number || !capacity) {
      return NextResponse.json(
        { message: 'Missing table number or capacity.' },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: {
        number: String(number),
        capacity: parseInt(capacity),
        status: 'AVAILABLE',
        qrCodeUrl: `/menu?table=${number}`,
      },
    });

    return NextResponse.json({ table }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { message: 'Error creating table.', error: error.message },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
    });
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Error fetching tables.', error: error.message },
      { status: 500 }
    );
  }
}
