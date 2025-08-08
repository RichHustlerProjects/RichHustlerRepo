// Dropdowns (touch-friendly)
document.querySelectorAll('.dropdown .dropbtn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const content = btn.parentElement.querySelector('.dropdown-content');
    const shown = content.style.display === 'grid';
    document.querySelectorAll('.dropdown-content').forEach(dc => dc.style.display = 'none');
    content.style.display = shown ? 'none' : 'grid';
  });
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-content').forEach(dc => dc.style.display = 'none');
  }
});

// Simple cart + product rendering
const RH = {
  state: { cart: JSON.parse(localStorage.getItem('rh_cart')||'[]') },
  saveCart(){ localStorage.setItem('rh_cart', JSON.stringify(this.state.cart)); RH.updateCartBadge(); },
  addToCart(item){ 
    const idx = RH.state.cart.findIndex(i=>i.id===item.id && i.size===item.size);
    if (idx>-1) RH.state.cart[idx].qty += item.qty; else RH.state.cart.push(item);
    RH.saveCart(); alert('Added to cart');
  },
  updateCartBadge(){
    const count = RH.state.cart.reduce((n,i)=>n+i.qty,0);
    const el = document.querySelector('.cart-link');
    if(el){ el.textContent = `Cart (${count})`; }
  },
  fmt(n){ return `$${n.toFixed(2)}`; }
};
RH.updateCartBadge();

function productsUrl(){
  const path = location.pathname;
  const nested = path.includes('/men/') || path.includes('/women/');
  return nested ? '../assets/data/products.json' : 'assets/data/products.json';
}
async function loadProducts(){ const res = await fetch(productsUrl()); return await res.json(); }

// Category grid renderer
(async function(){
  const grid = document.getElementById('product-grid');
  if(!grid) return;
  const cat = grid.dataset.category;
  const items = (await loadProducts()).filter(p => p.category === cat);
  const rootRel = (location.pathname.includes('/men/') || location.pathname.includes('/women/')) ? '../' : '';
  grid.innerHTML = items.map(p => `
    <a class="card" href="${rootRel}product.html?id=${encodeURIComponent(p.id)}">
      <img src="${p.image}" alt="${p.name}">
      <div class="label">
        <div class="kicker">${p.gender==='men'?'Men':'Women'}</div>
        <div class="title">${p.name} — $${p.price}</div>
      </div>
    </a>
  `).join('');
})();

// PDP renderer
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
      <div><img src="${p.images?.[0]||p.image}" alt="${p.name}" style="border:1px solid var(--border);border-radius:8px;"></div>
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
  document.getElementById('addToCart').addEventListener('click', ()=>{
    const size = (document.getElementById('size')||{value:null}).value;
    const qty = Math.max(1, parseInt(document.getElementById('qty').value||'1',10));
    RH.addToCart({ id:p.id, name:p.name, price:p.price, image:p.image, size, qty });
  });
})();

// Cart page
(function(){
  const wrap = document.getElementById('cart-page');
  if(!wrap) return;
  const items = RH.state.cart;
  if(!items.length){ wrap.innerHTML = '<section class="section container"><h2>Your Cart</h2><p class="muted">Cart is empty.</p></section>'; return; }
  const subtotal = items.reduce((n,i)=>n+i.price*i.qty,0);
  wrap.innerHTML = `
    <section class="section container">
      <h2>Your Cart</h2>
      <div class="sep"></div>
      <div style="display:grid;grid-template-columns:1fr 360px;gap:24px;">
        <div>${items.map((i,idx)=>`
          <div style="display:grid;grid-template-columns:90px 1fr 100px;gap:14px;align-items:center;border-bottom:1px solid var(--border);padding:12px 0;">
            <img src="${i.image}" style="width:90px;height:90px;object-fit:cover;border:1px solid var(--border);border-radius:8px;">
            <div><div style="font-weight:600;">${i.name}</div><div class="muted">${i.size?('Size '+i.size+' • '):''}Qty ${i.qty}</div></div>
            <div style="text-align:right;">${RH.fmt(i.price*i.qty)}</div>
            <div style="grid-column:1 / -1; text-align:right;">
              <button data-remove="${idx}" class="btn" style="padding:6px 10px;">Remove</button>
            </div>
          </div>`).join('')}
        </div>
        <aside style="border:1px solid var(--border);border-radius:8px;padding:16px;background:var(--panel);height:max-content;">
          <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><strong>${RH.fmt(subtotal)}</strong></div>
          <p class="muted" style="font-size:12px;">Shipping & taxes calculated at checkout.</p>
          <a class="btn primary" href="#" id="checkoutBtn">Checkout (Coming Soon)</a>
        </aside>
      </div>
    </section>`;
  wrap.querySelectorAll('button[data-remove]').forEach(btn=>btn.addEventListener('click', ()=>{
    const idx = parseInt(btn.dataset.remove,10);
    RH.state.cart.splice(idx,1); RH.saveCart(); location.reload();
  }));
  document.getElementById('checkoutBtn').addEventListener('click', (e)=>{
    e.preventDefault(); alert('Checkout flow coming next: Stripe + Netlify Functions.');
  });
})();
