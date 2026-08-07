(function () {
  const params = new URLSearchParams(location.search);
  const table = (params.get('tisch') || params.get('table') || '').trim();

  const tableBadge = document.getElementById('tableBadge');
  tableBadge.textContent = table ? `Tisch ${table}` : 'Kein Tisch angegeben';

  const menuEl = document.getElementById('menu');
  const cartButton = document.getElementById('cartButton');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const cartSheet = document.getElementById('cartSheet');
  const cartItemsEl = document.getElementById('cartItems');
  const sheetTotal = document.getElementById('sheetTotal');
  const overlay = document.getElementById('overlay');
  const closeCart = document.getElementById('closeCart');
  const submitOrder = document.getElementById('submitOrder');
  const orderNote = document.getElementById('orderNote');
  const confirmation = document.getElementById('confirmation');
  const confirmOrderId = document.getElementById('confirmOrderId');
  const confirmStatus = document.getElementById('confirmStatus');
  const newOrderBtn = document.getElementById('newOrder');

  const cart = new Map(); // id -> qty
  let menuById = new Map();
  let currentOrderId = null;

  const formatPrice = (n) => n.toFixed(2).replace('.', ',') + ' €';

  function renderMenu(menu) {
    menuEl.innerHTML = '';
    menu.forEach((category) => {
      const title = document.createElement('h2');
      title.className = 'category-title';
      title.textContent = category.category;
      menuEl.appendChild(title);

      category.items.forEach((item) => {
        menuById.set(item.id, item);

        const row = document.createElement('div');
        row.className = 'menu-item';
        row.innerHTML = `
          <div class="menu-item-info">
            <div class="name">${escapeHtml(item.name)}</div>
            ${item.description ? `<div class="desc">${escapeHtml(item.description)}</div>` : ''}
            <div class="price">${formatPrice(item.price)}</div>
          </div>
          <div class="qty-control" data-id="${item.id}"></div>
        `;
        menuEl.appendChild(row);
        renderQtyControl(row.querySelector('.qty-control'), item.id);
      });
    });
  }

  function renderQtyControl(el, id) {
    const qty = cart.get(id) || 0;
    if (qty === 0) {
      el.innerHTML = `<button class="add-btn" type="button">Hinzufügen</button>`;
      el.querySelector('.add-btn').addEventListener('click', () => changeQty(id, 1));
    } else {
      el.innerHTML = `
        <button type="button" class="minus">–</button>
        <span class="qty-value">${qty}</span>
        <button type="button" class="plus">+</button>
      `;
      el.querySelector('.minus').addEventListener('click', () => changeQty(id, -1));
      el.querySelector('.plus').addEventListener('click', () => changeQty(id, 1));
    }
  }

  function changeQty(id, delta) {
    const next = (cart.get(id) || 0) + delta;
    if (next <= 0) cart.delete(id);
    else cart.set(id, next);

    const control = menuEl.querySelector(`.qty-control[data-id="${id}"]`);
    if (control) renderQtyControl(control, id);
    updateCartSummary();
  }

  function cartTotalValue() {
    let total = 0;
    cart.forEach((qty, id) => {
      const item = menuById.get(id);
      if (item) total += item.price * qty;
    });
    return total;
  }

  function updateCartSummary() {
    const count = Array.from(cart.values()).reduce((a, b) => a + b, 0);
    const total = cartTotalValue();
    cartCount.textContent = count;
    cartTotal.textContent = formatPrice(total);
    sheetTotal.textContent = formatPrice(total);
    cartButton.hidden = count === 0;
  }

  function renderCartSheet() {
    cartItemsEl.innerHTML = '';
    cart.forEach((qty, id) => {
      const item = menuById.get(id);
      if (!item) return;
      const line = document.createElement('div');
      line.className = 'cart-line';
      line.innerHTML = `
        <div>
          <div class="cart-line-name">${qty}× ${escapeHtml(item.name)}</div>
          <div class="cart-line-price">${formatPrice(item.price * qty)}</div>
        </div>
      `;
      cartItemsEl.appendChild(line);
    });
  }

  function openCart() {
    renderCartSheet();
    cartSheet.hidden = false;
    overlay.hidden = false;
  }

  function closeCartSheet() {
    cartSheet.hidden = true;
    overlay.hidden = true;
  }

  cartButton.addEventListener('click', openCart);
  closeCart.addEventListener('click', closeCartSheet);
  overlay.addEventListener('click', closeCartSheet);

  submitOrder.addEventListener('click', async () => {
    if (!table) {
      alert('Bitte öffne den Link von deinem Tisch (QR-Code), damit die Küche weiß, wohin die Bestellung geht.');
      return;
    }
    if (cart.size === 0) return;

    submitOrder.disabled = true;
    submitOrder.textContent = 'Wird gesendet…';

    try {
      const items = Array.from(cart.entries()).map(([id, qty]) => ({ id, qty }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, items, note: orderNote.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden der Bestellung.');

      currentOrderId = data.id;
      cart.clear();
      updateCartSummary();
      closeCartSheet();
      orderNote.value = '';

      confirmOrderId.textContent = `#${data.id}`;
      confirmStatus.textContent = statusLabel(data.status);
      confirmation.hidden = false;

      if (window.socket && table) {
        window.socket.emit('join:table', table);
      }
    } catch (err) {
      alert(err.message || 'Bestellung konnte nicht gesendet werden.');
    } finally {
      submitOrder.disabled = false;
      submitOrder.textContent = 'Bestellung senden';
    }
  });

  newOrderBtn.addEventListener('click', () => {
    confirmation.hidden = true;
    currentOrderId = null;
  });

  function statusLabel(status) {
    return {
      neu: 'Neu',
      in_zubereitung: 'Wird zubereitet',
      fertig: 'Fertig',
      abgeholt: 'Abgeholt',
    }[status] || status;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  fetch('/api/menu')
    .then((r) => r.json())
    .then(renderMenu)
    .catch(() => {
      menuEl.innerHTML = '<p>Speisekarte konnte nicht geladen werden.</p>';
    });

  if (window.io) {
    const socket = io();
    window.socket = socket;
    socket.on('connect', () => {
      if (table) socket.emit('join:table', table);
    });
    socket.on('order:update', (order) => {
      if (order.id === currentOrderId) {
        confirmStatus.textContent = statusLabel(order.status);
      }
    });
  }
})();
