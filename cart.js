/* ============================================================
   פרחי איריס — עגלת קניות (localStorage, צד לקוח בלבד)
   כל שורה בעגלה מזוהה לפי מוצר + גודל זר.
   ============================================================ */

const CART_KEY = "iris_cart_v2";

function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    return raw.map((l) => ({ id: l.id, size: l.size || DEFAULT_SIZE, qty: l.qty || 1 }));
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function findLine(cart, id, size) {
  return cart.find((l) => l.id === id && l.size === size);
}

function addToCart(id, size = DEFAULT_SIZE, qty = 1) {
  const product = findProduct(id);
  if (!product) return;
  const cart = getCart();
  const line = findLine(cart, id, size);
  if (line) line.qty += qty;
  else cart.push({ id, size, qty });
  saveCart(cart);
  pulseCartButton();
  showCartToast(`${product.name} · ${findSize(size).label} נוסף לסל`);
}

function removeLine(id, size) {
  saveCart(getCart().filter((l) => !(l.id === id && l.size === size)));
}

function setLineQty(id, size, qty) {
  if (qty <= 0) return removeLine(id, size);
  const cart = getCart();
  const line = findLine(cart, id, size);
  if (!line) return;
  line.qty = qty;
  saveCart(cart);
}

function cartLines() {
  return getCart()
    .map((l) => {
      const product = findProduct(l.id);
      if (!product) return null;
      const sizeDef = findSize(l.size);
      const unit = priceFor(product, l.size);
      return { ...l, product, sizeDef, unit, total: unit * l.qty };
    })
    .filter(Boolean);
}

function cartCount() {
  return getCart().reduce((sum, l) => sum + l.qty, 0);
}

function cartTotal() {
  return cartLines().reduce((sum, l) => sum + l.total, 0);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function updateCartBadge() {
  const count = cartCount();
  document.querySelectorAll(".cart-badge").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

function pulseCartButton() {
  document.querySelectorAll(".cart-btn").forEach((btn) => {
    btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.13)" }, { transform: "scale(1)" }], {
      duration: 340,
      easing: "ease-out",
    });
  });
}

let toastTimer = null;
function showCartToast(text) {
  let el = document.getElementById("cartToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "cartToast";
    el.style.cssText =
      "position:fixed;bottom:26px;right:26px;z-index:130;background:#180A28;color:#E3CFA5;" +
      "border:1px solid rgba(197,160,89,.5);border-radius:999px;padding:13px 24px;font-size:.88rem;" +
      "font-weight:600;font-family:'Assistant',sans-serif;box-shadow:0 14px 34px rgba(18,7,32,.4);" +
      "opacity:0;transform:translateY(14px);transition:opacity .28s,transform .28s;pointer-events:none;max-width:82vw;";
    document.body.appendChild(el);
  }
  el.textContent = text;
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(14px)";
  }, 2400);
}

/* ---------- מגירת העגלה ---------- */
function renderCartDrawer() {
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotalValue");
  if (!itemsEl) return;
  const lines = cartLines();

  if (!lines.length) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <img src="assets/brand/logo-mark.png" alt="" />
        העגלה שלך ריקה כרגע.<br>זמן לבחור זר מהקטלוג!
      </div>`;
  } else {
    itemsEl.innerHTML = lines
      .map(
        (l) => `
      <div class="cart-row">
        <div class="thumb"><img src="${l.product.img}" alt="${esc(l.product.name)}" /></div>
        <div class="info">
          <h5>${esc(l.product.name)}</h5>
          <span class="size-chip">${esc(l.sizeDef.label)} · ₪${l.unit}</span>
          <div class="qty">
            <button onclick="setLineQty('${l.id}','${l.size}',${l.qty - 1});renderCartDrawer();" aria-label="הפחת">−</button>
            <span>${l.qty}</span>
            <button onclick="setLineQty('${l.id}','${l.size}',${l.qty + 1});renderCartDrawer();" aria-label="הוסף">+</button>
          </div>
          <button class="remove" onclick="removeLine('${l.id}','${l.size}');renderCartDrawer();">הסר</button>
        </div>
        <div class="price">₪${l.total}</div>
      </div>`
      )
      .join("");
  }
  if (totalEl) totalEl.textContent = `₪${cartTotal()}`;
}

function openCart() {
  document.getElementById("cartDrawer")?.classList.add("open");
  document.getElementById("cartOverlay")?.classList.add("open");
  renderCartDrawer();
}

function closeCart() {
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.getElementById("cartOverlay")?.classList.remove("open");
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
