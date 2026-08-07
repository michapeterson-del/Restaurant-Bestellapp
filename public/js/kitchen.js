(function () {
  const columns = ['neu', 'in_zubereitung', 'fertig'];
  const nextStatus = { neu: 'in_zubereitung', in_zubereitung: 'fertig', fertig: 'abgeholt' };
  const prevStatus = { in_zubereitung: 'neu', fertig: 'in_zubereitung' };
  const advanceLabel = { neu: 'Start Zubereitung', in_zubereitung: 'Fertig melden', fertig: 'Abgeholt' };

  const connStatus = document.getElementById('connStatus');
  const orders = new Map();

  const formatPrice = (n) => n.toFixed(2).replace('.', ',') + ' €';
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    columns.forEach((status) => {
      const container = document.getElementById(`cards-${status}`);
      const countEl = document.getElementById(`count-${status}`);
      const list = Array.from(orders.values())
        .filter((o) => o.status === status)
        .sort((a, b) => a.createdAt - b.createdAt);

      countEl.textContent = list.length;
      container.innerHTML = '';

      list.forEach((order) => {
        const card = document.createElement('div');
        card.className = 'order-card';
        const itemsHtml = order.items
          .map((i) => `<li>${i.qty}× ${escapeHtml(i.name)}</li>`)
          .join('');

        card.innerHTML = `
          <div class="order-card-header">
            <span class="table">${escapeHtml(order.name)}</span>
            <span class="time">#${order.id} · ${formatTime(order.createdAt)}</span>
          </div>
          <ul>${itemsHtml}</ul>
          <div class="order-card-actions"></div>
        `;

        const actions = card.querySelector('.order-card-actions');

        if (prevStatus[status]) {
          const backBtn = document.createElement('button');
          backBtn.className = 'btn-back';
          backBtn.textContent = 'Zurück';
          backBtn.addEventListener('click', () => updateStatus(order.id, prevStatus[status]));
          actions.appendChild(backBtn);
        }

        const advanceBtn = document.createElement('button');
        advanceBtn.className = 'btn-advance';
        advanceBtn.textContent = advanceLabel[status];
        advanceBtn.addEventListener('click', () => updateStatus(order.id, nextStatus[status]));
        actions.appendChild(advanceBtn);

        container.appendChild(card);
      });
    });
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const order = await res.json();
      applyOrder(order);
    } catch {
      alert('Status konnte nicht aktualisiert werden.');
    }
  }

  function applyOrder(order) {
    if (order.status === 'abgeholt') {
      orders.delete(order.id);
    } else {
      orders.set(order.id, order);
    }
    render();
  }

  function playNotification() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio nicht verfügbar, ignorieren.
    }
  }

  fetch('/api/orders')
    .then((r) => r.json())
    .then((list) => {
      list.forEach((o) => {
        if (o.status !== 'abgeholt') orders.set(o.id, o);
      });
      render();
    });

  const socket = io();
  socket.on('connect', () => {
    socket.emit('join:kitchen');
    connStatus.textContent = 'verbunden';
    connStatus.classList.add('connected');
  });
  socket.on('disconnect', () => {
    connStatus.textContent = 'getrennt';
    connStatus.classList.remove('connected');
  });
  socket.on('order:new', (order) => {
    applyOrder(order);
    playNotification();
  });
  socket.on('order:update', (order) => {
    applyOrder(order);
  });
})();
