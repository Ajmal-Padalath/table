import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        customer: true,
        orderItems: {
          include: {
            foodItem: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Error fetching order details.', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { message: 'Missing status value.' },
        { status: 400 }
      );
    }

    // Update order status
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          table: true,
          customer: true,
          orderItems: {
            include: {
              foodItem: true,
            },
          },
        },
      });

      // Update Table statuses based on order state changes
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        await tx.table.update({
          where: { id: updatedOrder.tableId },
          data: { status: 'AVAILABLE' },
        });
      } else if (status === 'SERVED') {
        await tx.table.update({
          where: { id: updatedOrder.tableId },
          data: { status: 'READY_TO_SERVE' },
        });
      } else if (status === 'READY') {
        await tx.table.update({
          where: { id: updatedOrder.tableId },
          data: { status: 'READY_TO_SERVE' },
        });
      } else if (status === 'PREPARING') {
        await tx.table.update({
          where: { id: updatedOrder.tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      return updatedOrder;
    });

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { message: 'Error updating order.', error: error.message },
      { status: 500 }
    );
  }
}
