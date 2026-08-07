(function () {
  const nameInput = document.getElementById('customerName');
  const menuList = document.getElementById('menuList');
  const orderBar = document.getElementById('orderBar');
  const orderCount = document.getElementById('orderCount');
  const orderTotal = document.getElementById('orderTotal');
  const submitOrder = document.getElementById('submitOrder');
  const confirmation = document.getElementById('confirmation');
  const confirmName = document.getElementById('confirmName');
  const confirmOrderId = document.getElementById('confirmOrderId');
  const confirmStatus = document.getElementById('confirmStatus');
  const newOrderBtn = document.getElementById('newOrder');

  const cart = new Map(); // id -> qty
  let menuById = new Map();
  let currentOrderId = null;

  const savedName = localStorage.getItem('bestellapp:name');
  if (savedName) nameInput.value = savedName;

  const formatPrice = (n) => n.toFixed(2).replace('.', ',') + ' €';

  function renderMenu(menu) {
    menuList.innerHTML = '';
    menu.forEach((category) => {
      const title = document.createElement('h2');
      title.className = 'category-title';
      title.textContent = category.category;
      menuList.appendChild(title);

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
        menuList.appendChild(row);
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

    const control = menuList.querySelector(`.qty-control[data-id="${id}"]`);
    if (control) renderQtyControl(control, id);
    updateOrderBar();
  }

  function updateOrderBar() {
    let count = 0;
    let total = 0;
    cart.forEach((qty, id) => {
      const item = menuById.get(id);
      if (!item) return;
      count += qty;
      total += item.price * qty;
    });
    orderCount.textContent = count;
    orderTotal.textContent = formatPrice(total);
    orderBar.hidden = count === 0;
  }

  submitOrder.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert('Bitte gib deinen Namen ein.');
      nameInput.focus();
      return;
    }
    if (cart.size === 0) return;

    localStorage.setItem('bestellapp:name', name);

    submitOrder.disabled = true;
    submitOrder.textContent = 'Wird gesendet…';

    try {
      const items = Array.from(cart.entries()).map(([id, qty]) => ({ id, qty }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden der Bestellung.');

      currentOrderId = data.id;
      cart.clear();
      updateOrderBar();
      resetQtyControls();

      confirmName.textContent = data.name;
      confirmOrderId.textContent = `#${data.id}`;
      confirmStatus.textContent = statusLabel(data.status);
      confirmation.hidden = false;

      if (window.socket) {
        window.socket.emit('join:order', data.id);
      }
    } catch (err) {
      alert(err.message || 'Bestellung konnte nicht gesendet werden.');
    } finally {
      submitOrder.disabled = false;
      submitOrder.textContent = 'Bestellung senden';
    }
  });

  function resetQtyControls() {
    menuList.querySelectorAll('.qty-control').forEach((el) => {
      renderQtyControl(el, el.dataset.id);
    });
  }

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
      menuList.innerHTML = '<p>Speisekarte konnte nicht geladen werden.</p>';
    });

  if (window.io) {
    const socket = io();
    window.socket = socket;
    socket.on('order:update', (order) => {
      if (order.id === currentOrderId) {
        confirmStatus.textContent = statusLabel(order.status);
      }
    });
  }
})();
