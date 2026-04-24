/**
 * Application Core Logic
 */

const app = {
  activePlatforms: { dd: true, ue: true },
  earnings: 47.20,
  activeDeliveries: 2,
  
  init() {
    console.log("MultiRun App Initialized");
    // Initialize map
    mapManager.init();
    // Render initial mocked orders
    orderManager.renderOrders();
  },

  togglePlatform(platform) {
    this.activePlatforms[platform] = !this.activePlatforms[platform];
    const el = document.getElementById(`${platform}Toggle`);
    if (this.activePlatforms[platform]) {
      el.classList.add('active');
      this.showToast(`✅ ${platform === 'dd' ? 'DoorDash' : 'Uber Eats'} resumed`);
    } else {
      el.classList.remove('active');
      this.showToast(`⏸️ ${platform === 'dd' ? 'DoorDash' : 'Uber Eats'} paused`);
    }
    orderManager.filterOrders();
  },

  updateEarnings(amount) {
    this.earnings += amount;
    document.getElementById('totalEarnings').textContent = `$${this.earnings.toFixed(2)}`;
    
    // Increment active deliveries
    this.activeDeliveries++;
    document.getElementById('statActive').textContent = this.activeDeliveries;
  },

  switchTab(el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    this.showToast('Feature coming soon in beta!');
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  },

  navigateAll() {
    if (orderManager.acceptedOrders.length === 0) {
      this.showToast('No active orders to navigate!');
      return;
    }
    
    // In a real app, we'd build a Google Maps intent URL.
    // Format: https://www.google.com/maps/dir/?api=1&origin=LAT,LNG&destination=LAT,LNG&waypoints=LAT,LNG|LAT,LNG
    
    let url = 'https://www.google.com/maps/dir/?api=1';
    
    // Simple mock logic: driver loc -> all pickups -> all dropoffs
    const stops = [];
    orderManager.acceptedOrders.forEach(o => stops.push(o.pickup.name));
    orderManager.acceptedOrders.forEach(o => stops.push(o.dropoff.name));
    
    if (stops.length > 0) {
      url += `&destination=${encodeURIComponent(stops[stops.length-1])}`;
    }
    
    this.showToast('🗺️ Opening Google Maps Navigation...');
    setTimeout(() => {
      window.open(url, '_blank');
    }, 600);
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());
