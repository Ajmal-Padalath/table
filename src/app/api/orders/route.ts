import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tableNumber,
      customerName,
      customerPhone,
      sessionToken,
      paymentMethod,
      subtotal,
      tax,
      serviceCharge,
      totalAmount,
      items,
    } = body;

    if (!tableNumber || !customerName || !sessionToken || !items || items.length === 0) {
      return NextResponse.json(
        { message: 'Missing required order fields.' },
        { status: 400 }
      );
    }

    // Find table by number
    const table = await prisma.table.findUnique({
      where: { number: String(tableNumber) },
    });

    if (!table) {
      return NextResponse.json(
        { message: `Table ${tableNumber} not found.` },
        { status: 404 }
      );
    }

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { sessionToken },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          sessionToken,
        },
      });
    } else if (customer.name !== customerName || customer.phone !== customerPhone) {
      // Update customer info if changed
      customer = await prisma.customer.update({
        where: { sessionToken },
        data: {
          name: customerName,
          phone: customerPhone,
        },
      });
    }

    // Determine sequential order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${1001 + orderCount}`;

    // Create order using transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          tableId: table.id,
          customerId: customer.id,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod,
          subtotal,
          tax,
          serviceCharge,
          totalAmount,
          orderItems: {
            create: items.map((item: any) => ({
              foodItemId: item.foodItemId,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
              spiceLevel: item.spiceLevel,
              notes: item.notes,
              extras: item.extras,
            })),
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
      });

      // Update Table Status to OCCUPIED
      await tx.table.update({
        where: { id: table.id },
        data: { status: 'OCCUPIED' },
      });

      return newOrder;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { message: 'Error processing order.', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionToken = searchParams.get('sessionToken');

    if (!sessionToken) {
      // Return all orders if no sessionToken (for staff dashboard)
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
      return NextResponse.json({ orders });
    }

    // Return specific customer orders
    const orders = await prisma.order.findMany({
      where: {
        customer: { sessionToken },
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { message: 'Error fetching orders.', error: error.message },
      { status: 500 }
    );
  }
}
