const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach socket.io instance to global object so we can use it in Next.js API Routes if needed
  global.io = io;

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register room joining
    socket.on('join-room', (roomName) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on('leave-room', (roomName) => {
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left room: ${roomName}`);
    });

    // Notify new order
    socket.on('new-order', (order) => {
      console.log(`New order received: ${order.orderNumber}`);
      // Send to all staff dashboards
      socket.to('staff-dashboard').emit('order-created', order);
      // Waiter floor updates
      socket.to('staff-dashboard').emit('table-status-changed', { tableId: order.tableId, status: 'OCCUPIED' });
    });

    // Update order status
    socket.on('update-order-status', ({ orderId, status, order }) => {
      console.log(`Order ${orderId} updated to ${status}`);
      // Notify customers tracking this order
      io.to(`order-tracker:${orderId}`).emit('order-status-changed', { orderId, status, order });
      // Notify staff dashboards
      io.to('staff-dashboard').emit('order-updated', { orderId, status, order });
      
      // Update table statuses based on order state
      if (status === 'SERVED') {
        io.to('staff-dashboard').emit('table-status-changed', { tableId: order.tableId, status: 'READY_TO_SERVE' });
      } else if (status === 'PREPARING') {
        io.to('staff-dashboard').emit('table-status-changed', { tableId: order.tableId, status: 'OCCUPIED' });
      } else if (status === 'READY') {
        io.to('staff-dashboard').emit('table-status-changed', { tableId: order.tableId, status: 'READY_TO_SERVE' });
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        io.to('staff-dashboard').emit('table-status-changed', { tableId: order.tableId, status: 'AVAILABLE' });
      }
    });

    // Table state changed directly
    socket.on('update-table-status', ({ tableId, status }) => {
      console.log(`Table ${tableId} status updated to ${status}`);
      io.to('staff-dashboard').emit('table-status-changed', { tableId, status });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
