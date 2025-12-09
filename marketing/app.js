// RageVFX Marketing Website - Interactive Features & Stripe Integration

// ============================================================================
// Configuration
// ============================================================================

// NOTE: Replace with your actual Stripe publishable key
// For testing, use test mode keys from https://dashboard.stripe.com/test/apikeys
// IMPORTANT: Create config.js from config.example.js and add your real keys
// Never commit real API keys to version control!
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE'; // Replace in production or use config.js

// Price IDs from Stripe Dashboard (create products first)
const STRIPE_PRICES = {
  standard: 'price_YOUR_STANDARD_PRICE_ID',
  pro: 'price_YOUR_PRO_PRICE_ID',
};

// Pricing display values (for consistency across UI)
const PRICING_INFO = {
  standard: {
    name: 'RageVFX Standard',
    price: '$9.95/month',
  },
  pro: {
    name: 'RageVFX Pro',
    price: '$29.95/month',
  },
};

// Backend API URL (update for production)
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : '/api';

// ============================================================================
// Stripe Initialization
// ============================================================================

let stripe = null;
let elements = null;
let cardElement = null;

function initStripe() {
  try {
    if (typeof Stripe === 'undefined') {
      console.warn('Stripe.js not loaded. Payment functionality disabled.');
      return false;
    }
    
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    const appearance = {
      theme: 'night',
      variables: {
        colorPrimary: '#ff6b35',
        colorBackground: '#252525',
        colorText: '#f0f0f0',
        colorDanger: '#f44336',
        fontFamily: 'Inter, Segoe UI, sans-serif',
        borderRadius: '8px',
      },
    };
    
    elements = stripe.elements({ appearance });
    cardElement = elements.create('card');
    
    return true;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return false;
  }
}

// ============================================================================
// Hero Particle Animation
// ============================================================================

function initHeroParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationFrame;
  
  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  
  class Particle {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
      this.opacity = Math.random() * 0.5;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 107, 53, ${this.opacity})`;
      ctx.fill();
    }
  }
  
  function createParticles() {
    particles = [];
    const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    // Draw connections
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(255, 107, 53, ${0.15 * (1 - distance / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  resizeCanvas();
  createParticles();
  animate();
  
  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });
}

// ============================================================================
// Subscription Modal & Payment
// ============================================================================

function openCheckoutModal(plan) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;
  
  // Store the selected plan
  modal.dataset.selectedPlan = plan;
  
  // Update modal title and price based on plan
  const titleElement = document.getElementById('modal-plan-title');
  const priceElement = document.getElementById('modal-plan-price');
  
  const planInfo = PRICING_INFO[plan];
  if (planInfo) {
    if (titleElement) titleElement.textContent = `Subscribe to ${planInfo.name}`;
    if (priceElement) priceElement.textContent = `${planInfo.price} • Cancel anytime`;
  }
  
  modal.classList.add('active');
  
  // Mount card element if not already mounted
  if (cardElement && !cardElement._mounted) {
    const cardElementContainer = document.getElementById('card-element');
    if (cardElementContainer) {
      cardElement.mount('#card-element');
      cardElement._mounted = true;
    }
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

async function handlePaymentSubmit(event) {
  event.preventDefault();
  
  if (!stripe || !cardElement) {
    alert('Payment system is not initialized. Please refresh the page and try again.');
    return;
  }
  
  const submitButton = document.getElementById('submit-payment');
  const emailInput = document.getElementById('email');
  const errorElement = document.getElementById('card-errors');
  
  // Disable button
  submitButton.disabled = true;
  submitButton.textContent = 'Processing...';
  
  try {
    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        email: emailInput.value,
      },
    });
    
    if (error) {
      errorElement.textContent = error.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Start 7-Day Free Trial';
      return;
    }
    
    // Get selected plan from modal
    const modal = document.getElementById('checkout-modal');
    const selectedPlan = modal?.dataset.selectedPlan || 'pro';
    
    // Send to backend to create subscription
    const response = await fetch(`${API_URL}/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        email: emailInput.value,
        priceId: STRIPE_PRICES[selectedPlan],
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create subscription');
    }
    
    // Store customer ID for future use
    localStorage.setItem('ragevfx_customer_id', data.customer.id);
    localStorage.setItem('ragevfx_subscription_id', data.subscription.id);
    localStorage.setItem('ragevfx_tier', selectedPlan);
    
    // Show success
    console.log('Subscription created:', data.subscription.id);
    document.getElementById('checkout-form').classList.add('hidden');
    document.getElementById('payment-success').classList.remove('hidden');
    
  } catch (error) {
    console.error('Payment error:', error);
    errorElement.textContent = 'An error occurred. Please try again.';
    submitButton.disabled = false;
    submitButton.textContent = 'Start 7-Day Free Trial';
  }
}

// ============================================================================
// Download Handling
// ============================================================================

async function handleDownload(platform) {
  // Check if user has Pro subscription
  const customerId = localStorage.getItem('ragevfx_customer_id');
  
  if (!customerId) {
    alert('Pro subscription required to download the desktop app. Please subscribe first!');
    window.location.hash = '#pricing';
    return;
  }
  
  try {
    // Verify subscription status
    const statusResponse = await fetch(`${API_URL}/subscription-status?customerId=${customerId}`);
    const statusData = await statusResponse.json();
    
    if (!statusData.hasSubscription) {
      alert('No active Pro subscription found. Please subscribe first!');
      window.location.hash = '#pricing';
      return;
    }
    
    // Generate download token
    const tokenResponse = await fetch(`${API_URL}/generate-download-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, platform }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.success) {
      // In production, this would download the actual file
      console.log(`Download URL: ${tokenData.downloadUrl}`);
      
      // For now, show info message
      alert(`Download ready for ${platform}!\n\nBuild the desktop app first using:\nnpm run dist:${platform === 'macos' ? 'mac' : platform === 'windows' ? 'win' : 'linux'}\n\nThen serve the files from the release/ directory.`);
    }
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to generate download. Please try again or contact support.');
  }
}

// ============================================================================
// Mobile Menu Toggle
// ============================================================================

function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (!toggle || !navLinks) return;
  
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    toggle.classList.toggle('active');
  });
}

// ============================================================================
// Smooth Scroll Enhancement
// ============================================================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80; // Account for fixed navbar
        const targetPosition = target.offsetTop - offset;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================================================
// Scroll Animations
// ============================================================================

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );
  
  // Observe feature cards, pricing cards, etc.
  document.querySelectorAll('.feature-card, .pricing-card, .download-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ============================================================================
// Event Listeners
// ============================================================================

function initEventListeners() {
  // Subscribe buttons (multiple with data-plan attribute)
  const subscribeButtons = document.querySelectorAll('.subscribe-btn');
  subscribeButtons.forEach(btn => {
    const plan = btn.dataset.plan || 'pro';
    btn.addEventListener('click', () => {
      openCheckoutModal(plan);
    });
  });
  
  // Modal close button
  const modalClose = document.querySelector('.modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', closeCheckoutModal);
  }
  
  // Click outside modal to close
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCheckoutModal();
      }
    });
  }
  
  // Payment form submit
  const submitButton = document.getElementById('submit-payment');
  if (submitButton) {
    submitButton.addEventListener('click', handlePaymentSubmit);
  }
  
  // Download buttons
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = btn.dataset.platform;
      if (platform) {
        handleDownload(platform);
      }
    });
  });
  
  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCheckoutModal();
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('RageVFX Marketing Website loaded');
  
  // Initialize features
  initStripe();
  initHeroParticles();
  initMobileMenu();
  initSmoothScroll();
  initScrollAnimations();
  initEventListeners();
  
  // Show warning if Stripe keys not configured
  if (STRIPE_PUBLISHABLE_KEY.includes('YOUR_KEY_HERE')) {
    console.warn(
      '%cStripe Integration Not Configured',
      'color: #ff6b35; font-size: 14px; font-weight: bold;',
      '\nTo enable payment functionality:\n' +
      '1. Create a Stripe account at https://stripe.com\n' +
      '2. Get your publishable key from https://dashboard.stripe.com/test/apikeys\n' +
      '3. Create a product and price in https://dashboard.stripe.com/test/products\n' +
      '4. Update STRIPE_PUBLISHABLE_KEY and STRIPE_PRICES in app.js\n' +
      '5. Implement backend API to handle subscription creation'
    );
  }
});
