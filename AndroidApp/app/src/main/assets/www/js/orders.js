/**
 * Order Management Logic
 */

const orderManager = {
  // Mock data for incoming orders
  availableOrders: [
    {
      id: 'dd-4821', platform: 'dd', name: 'DoorDash #4821',
      restaurant: "McDonald's", items: 3, earn: 8.50, dist: 2.1, time: 8,
      pickup: { name: "McDonald's — 5th & Main", coords: [40.735610, -73.930242] },
      dropoff: { name: "123 Oak St", coords: [40.740610, -73.920242] }
    },
    {
      id: 'ue-9134', platform: 'ue', name: 'Uber Eats #9134',
      restaurant: "Chipotle", items: 2, earn: 11.20, dist: 3.4, time: 14,
      pickup: { name: "Chipotle — Elm Ave", coords: [40.725610, -73.940242] },
      dropoff: { name: "87 Birch Lane", coords: [40.715610, -73.950242] }
    },
    {
      id: 'dd-5003', platform: 'dd', name: 'DoorDash #5003',
      restaurant: "Subway", items: 1, earn: 6.75, dist: 4.8, time: 20,
      pickup: { name: "Subway — Broadway", coords: [40.745610, -73.910242] },
      dropoff: { name: "500 Park Ave", coords: [40.755610, -73.900242] }
    }
  ],
  
  acceptedOrders: [],

  renderOrders() {
    const list = document.getElementById('ordersList');
    list.innerHTML = '';
    
    this.availableOrders.forEach(o => {
      // Check if platform is active
      if (!app.activePlatforms[o.platform]) return;
      
      const pName = o.platform === 'dd' ? 'DoorDash' : 'Uber Eats';
      const pIcon = o.platform === 'dd' ? 'D' : 'U';
      const prmCost = (o.earn / o.dist).toFixed(2);

      const html = `
        <div class="order-card ${o.platform}-card" id="card-${o.id}">
          <div class="order-top">
            <div class="order-platform">
              <div class="platform-icon ${o.platform}">${pIcon}</div>
              <div>
                <div class="order-id">${o.name} <span class="new-badge">NEW</span></div>
                <div class="order-meta">${o.restaurant} → ${o.items} items</div>
              </div>
            </div>
            <div class="order-earn">$${o.earn.toFixed(2)} <small>/delivery</small></div>
          </div>
          
          <div class="order-details">
            <div class="detail-item"><span class="icon">🛣️</span>${o.dist} mi total</div>
            <div class="detail-item"><span class="icon">⏱️</span>~${o.time} min</div>
            <div class="detail-item"><span class="icon">💵</span>$${prmCost}/mi</div>
          </div>
          
          <div class="order-route">
            <div class="route-step">
              <div class="step-num pickup">P</div>
              <div class="step-label">${o.pickup.name}</div>
            </div>
            <div class="route-step">
              <div class="step-num dropoff">D</div>
              <div class="step-label">${o.dropoff.name}</div>
            </div>
          </div>
          
          <div class="order-actions">
            <button class="btn btn-accept" onclick="orderManager.acceptOrder('${o.id}')">✓ Accept</button>
            <button class="btn btn-skip" onclick="orderManager.skipOrder('${o.id}')">Skip</button>
          </div>
        </div>
      `;
      list.insertAdjacentHTML('beforeend', html);
    });
  },

  filterOrders() {
    this.renderOrders();
  },

  acceptOrder(id) {
    const orderIndex = this.availableOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) return;
    
    const order = this.availableOrders.splice(orderIndex, 1)[0];
    this.acceptedOrders.push(order);
    
    app.updateEarnings(order.earn);
    app.showToast(`✅ Accepted ${order.name}`);
    
    // Animate out card
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.style.transform = 'scale(0.95)';
      card.style.opacity = '0';
      setTimeout(() => {
        this.renderOrders();
        this.updateActiveRoute();
      }, 300);
    } else {
      this.renderOrders();
      this.updateActiveRoute();
    }
  },

  skipOrder(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.classList.add('skipped');
      setTimeout(() => {
        const idx = this.availableOrders.findIndex(o => o.id === id);
        if (idx !== -1) this.availableOrders.splice(idx, 1);
        this.renderOrders();
      }, 300);
    }
  },

  updateActiveRoute() {
    const panel = document.getElementById('acceptedPanel');
    const stopsList = document.getElementById('acceptedStops');
    const navBtn = document.getElementById('navigateAllBtn');
    
    if (this.acceptedOrders.length === 0) {
      panel.style.display = 'none';
      navBtn.style.display = 'none';
      mapManager.clearRoute();
      return;
    }
    
    panel.style.display = 'block';
    navBtn.style.display = 'flex';
    
    // TSP Simulation: For now, simple logic -> Pickups first, Dropoffs second
    const stops = [];
    let stopHtml = '';
    let stopNum = 1;

    this.acceptedOrders.forEach(o => {
      stops.push({ coords: o.pickup.coords, type: `${o.platform}-pickup` });
      stopHtml += `
        <div class="accepted-stop">
          <div class="stop-badge pickup-badge">${stopNum++}</div>
          <div class="stop-info">
            <div class="stop-name">🏪 ${o.pickup.name}</div>
            <div class="stop-type">Pickup</div>
          </div>
          <span class="stop-platform-tag ${o.platform}">${o.platform === 'dd' ? 'DoorDash' : 'Uber Eats'}</span>
        </div>
      `;
    });

    this.acceptedOrders.forEach(o => {
      stops.push({ coords: o.dropoff.coords, type: `${o.platform}-dropoff` });
      stopHtml += `
        <div class="accepted-stop">
          <div class="stop-badge dropoff-badge">${stopNum++}</div>
          <div class="stop-info">
            <div class="stop-name">🏠 ${o.dropoff.name}</div>
            <div class="stop-type">Drop-off</div>
          </div>
          <span class="stop-platform-tag ${o.platform}">${o.platform === 'dd' ? 'DoorDash' : 'Uber Eats'}</span>
        </div>
      `;
    });

    stopsList.innerHTML = stopHtml;
    
    // Update Map Route
    mapManager.calculateAndDrawRoute(stops);
  },

  // This is called directly from the Android Java Accessibility Service!
  handleNativeIntercept(rawText) {
    console.log("Intercepted raw text from Android: ", rawText);
    
    // Very simple mock logic to simulate a new order being read
    // In production, you would parse the rawText string with regex to find the exact addresses
    
    // Let's create a dynamic order based on the intercept
    const newId = 'auto-' + Math.floor(Math.random() * 10000);
    const isUber = rawText.toLowerCase().includes("uber");
    const pName = isUber ? "ue" : "dd";
    
    const newOrder = {
      id: newId, platform: pName, name: (isUber ? 'Uber Eats' : 'DoorDash') + ' (Auto)',
      restaurant: "Intercepted Pickup", items: 1, earn: 10.00, dist: 3.0, time: 12,
      pickup: { name: "Intercepted Pickup", coords: [40.745610 + (Math.random()*0.01), -73.910242] },
      dropoff: { name: "Intercepted Dropoff", coords: [40.755610 + (Math.random()*0.01), -73.900242] }
    };
    
    // Automatically accept it since the driver accepted it natively
    this.acceptedOrders.push(newOrder);
    app.updateEarnings(newOrder.earn);
    app.showToast(`🤖 Auto-Intercepted new ${pName.toUpperCase()} order!`);
    
    // Re-render and recalculate optimal route immediately
    this.renderOrders();
    this.updateActiveRoute();
  }
};
