const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');

function loadOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

module.exports = { loadOrders, saveOrders };
