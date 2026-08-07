const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const { loadOrders, saveOrders } = require('./store');

const MENU = require('../data/menu.json');

const PORT = process.env.PORT || 3000;
const STATUSES = ['neu', 'in_zubereitung', 'fertig', 'abgeholt'];

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

let orders = loadOrders();

function menuItemById(id) {
  for (const category of MENU) {
    const item = category.items.find((i) => i.id === id);
    if (item) return item;
  }
  return null;
}

app.get('/api/menu', (req, res) => {
  res.json(MENU);
});

app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let result = orders;
  if (status) {
    result = orders.filter((o) => o.status === status);
  }
  res.json(result.sort((a, b) => a.createdAt - b.createdAt));
});

app.post('/api/orders', (req, res) => {
  const { name, items } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name fehlt.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Die Bestellung enthält keine Artikel.' });
  }

  const orderItems = [];
  for (const raw of items) {
    const menuItem = menuItemById(raw && raw.id);
    const qty = Number(raw && raw.qty);
    if (!menuItem || !Number.isInteger(qty) || qty < 1 || qty > 50) {
      return res.status(400).json({ error: 'Ungültiger Artikel in der Bestellung.' });
    }
    orderItems.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      qty,
    });
  }

  const order = {
    id: nanoid(8),
    name: name.trim().slice(0, 40),
    items: orderItems,
    status: 'neu',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  orders.push(order);
  saveOrders(orders);
  io.to('kitchen').emit('order:new', order);

  res.status(201).json(order);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status.' });
  }
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Bestellung nicht gefunden.' });
  }
  order.status = status;
  order.updatedAt = Date.now();
  saveOrders(orders);
  io.to('kitchen').emit('order:update', order);
  io.to(`order:${order.id}`).emit('order:update', order);
  res.json(order);
});

app.get('/kitchen', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'kitchen.html'));
});

io.on('connection', (socket) => {
  socket.on('join:kitchen', () => {
    socket.join('kitchen');
  });
  socket.on('join:order', (orderId) => {
    if (typeof orderId === 'string' && orderId.trim()) {
      socket.join(`order:${orderId.trim()}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Restaurant-Bestellapp läuft auf http://localhost:${PORT}`);
  console.log(`Küchen-Ansicht: http://localhost:${PORT}/kitchen`);
});
