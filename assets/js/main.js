// ===== Dropdowns (click/touch-friendly) =====
document.querySelectorAll('.dropdown .dropbtn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const content = btn.parentElement.querySelector('.dropdown-content');
    const isGrid = getComputedStyle(content).display === 'grid';
    document.querySelectorAll('.dropdown-content').forEach(dc => dc.style.display = 'none');
    content.style.display = isGrid ? 'none' : 'grid';
    e.stopPropagation();
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-content').forEach(dc => dc.style.display = 'none');
});

// ===== Cart state =====
const RH = {
  state: { cart: JSON.parse(localStorage.getItem('rh_cart') || '[]') },
  saveCart(){ localStorage.setItem('rh_cart', JSON.stringify(this.state.cart)); RH.updateCartBadge(); },
  updateCartBadge(){
    const count = RH.state.cart.reduce((n,i)=>n + (i.qty||0), 0);
    const el = document.querySelector('.cart-link');
    if(el){ el.textContent = `Cart (${count})`; }
  }
};
RH.updateCartBadge();

// ===== Product data loader =====
function productsUrl(){
  const path = location.pathname;
  const nested = path.includes('/men/') || path.includes('/women/');
  return nested ? '../assets/data/products.json' : 'assets/data/products.json';
}
async function loadProducts(){
  try{
    const res = await fetch(productsUrl(), {cache:'no-store'});
    if(!res.ok) throw new Error('Failed to load products');
    return await res.json();
  }catch(err){
    console.error(err);
    return [];
  }
}

// ===== Home: New Arrivals =====
(async function(){
  const grid = document.getElementById('home-grid');
  if(!grid) return;

  const products = await loadProducts();
  const priority = ['men/hoodies','men/shoes','men/tees','women/sets','women/purses','women/sunglasses'];
  const featured = [
    ...products.filter(p => priority.includes(p.category)).slice(0,6),
    ...products.slice(0,6)
  ].slice(0,6);

  if(!featured.length){
    grid.innerHTML = `<p class="muted">Products coming soon.</p>`;
    return;
  }

  grid.innerHTML = featured.map(p => `
    <a class="card reveal" href="product.html?id=${encodeURIComponent(p.id)}">
      <img src="${p.image}" alt="${p.name}">
      <div class="label">
        <div class="kicker">${p.gender==='men'?'Men':'Women'}</div>
        <div class="title">${p.name} — $${p.price}</div>
      </div>
    </a>
  `).join('');
  observeReveals();
})();

// ===== PDP =====
(async function(){
  const holder = document.getElementById('pdp');
  if(!holder) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const products = await loadProducts();
  const p = products.find(x=>x.id===id) || products[0];
  if(!p) return;

  holder.innerHTML = `
    <div class="container" style="display:grid;grid-template-columns:1fr 1fr;gap:24px; padding:40px 0;">
      <div><img src="${p.images?.[0]||p.image}" alt="${p.name}" style="border:1px solid var(--border);border-radius:8px; width:100%;"></div>
      <div>
        <div class="kicker">${p.gender==='men'?'Men':'Women'} • ${p.category.split('/')[1].replace('-', ' ')}</div>
        <h1 class="title" style="font-size:32px;">${p.name}</h1>
        <div style="margin:8px 0 16px; font-weight:600;">$${p.price}</div>
        <p class="muted" style="max-width:46ch;">${p.desc}</p>
        <div class="sep"></div>
        ${p.sizes?.length ? `
          <label class="kicker" for="size">Size</label>
          <div style="margin-top:8px;">
            <select id="size" style="background:var(--panel);color:var(--text);border:1px solid var(--border);padding:10px;border-radius:8px;min-width:180px;">
              ${p.sizes.map(s=>`<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>` : ''}
        <div style="margin-top:14px;">
          <label class="kicker" for="qty">Qty</label>
          <input id="qty" type="number" min="1" value="1" style="margin-left:8px;width:80px;background:var(--panel);color:var(--text);border:1px solid var(--border);padding:8px;border-radius:8px;">
        </div>
        <div style="margin-top:18px;display:flex;gap:10px;">
          <button id="addToCart" class="btn primary">Add to Cart</button>
          <a class="btn" href="cart.html">View Cart</a>
        </div>
      </div>
    </div>`;
  const add = document.getElementById('addToCart');
  if(add){
    add.addEventListener('click', ()=>{
      const size = (document.getElementById('size')||{value:null}).value;
      const qty = Math.max(1, parseInt(document.getElementById('qty').value||'1',10));
      RH.state.cart.push({ id:p.id, name:p.name, price:p.price, image:p.image, size, qty });
      RH.saveCart();
      alert('Added to cart');
    });
  }
})();

// ===== Cart page =====
(function(){
  const wrap = document.getElementById('cart-page');
  if(!wrap) return;
  const items = RH.state.cart;
  if(!items.length){ wrap.innerHTML = '<section class="section container"><h2>Your Cart</h2><p class="muted">Cart is empty.</p></section>'; return; }
  const subtotal = items.reduce((n,i)=>n + (i.price*i.qty), 0);
  wrap.innerHTML = `
    <section class="section container">
      <h2>Your Cart</h2>
      <div class="sep"></div>
      <div style="display:grid;grid-template-columns:1fr 360px;gap:24px;">
        <div>${items.map((i,idx)=>`
          <div style="display:grid;grid-template-columns:90px 1fr 100px;gap:14px;align-items:center;border-bottom:1px solid var(--border);padding:12px 0;">
            <img src="${i.image}" style="width:90px;height:90px;object-fit:cover;border:1px solid var(--border);border-radius:8px;">
            <div><div style="font-weight:600;">${i.name}</div><div class="muted">${i.size?('Size '+i.size+' • '):''}Qty ${i.qty}</div></div>
            <div style="text-align:right;">$${(i.price*i.qty).toFixed(2)}</div>
            <div style="grid-column:1 / -1; text-align:right;">
              <button data-remove="${idx}" class="btn" style="padding:6px 10px;">Remove</button>
            </div>
          </div>`).join('')}
        </div>
        <aside style="border:1px solid var(--border);border-radius:8px;padding:16px;background:var(--panel);height:max-content;">
          <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><strong>$${subtotal.toFixed(2)}</strong></div>
          <p class="muted" style="font-size:12px;">Shipping & taxes calculated at checkout.</p>
          <a class="btn primary" href="#" id="checkoutBtn">Checkout (Coming Soon)</a>
        </aside>
      </div>
    </section>`;
  wrap.querySelectorAll('button[data-remove]').forEach(btn=>btn.addEventListener('click', ()=>{
    const idx = parseInt(btn.dataset.remove,10);
    RH.state.cart.splice(idx,1); RH.saveCart(); location.reload();
  }));
  const checkout = document.getElementById('checkoutBtn');
  if(checkout){
    checkout.addEventListener('click', (e)=>{
      e.preventDefault(); alert('Checkout flow coming: Stripe + Netlify Functions.');
    });
  }
})();

// ===== Reveal on scroll (for .reveal elements) =====
function observeReveals(){
  const els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(el=>el.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el=>io.observe(el));
}
observeReveals();
