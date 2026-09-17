/* ============================================================
   פרחי איריס — חלון מוצר מורחב (Quick View)
   נבנה פעם אחת ומוזרק ל-body בלחיצה הראשונה על כרטיס מוצר.
   מעבר בין גדלים מחליף את התמונה עצמה (לא מגדיל אותה)
   ומעדכן את פירוט ההרכב.
   ============================================================ */

let pmProduct = null;
let pmSize = DEFAULT_SIZE;
let pmTab = "care";

function pmEnsureDOM() {
  let el = document.getElementById("pmOverlay");
  if (el) return el;

  el = document.createElement("div");
  el.className = "pm-overlay";
  el.id = "pmOverlay";
  el.innerHTML = `
    <div class="pm" role="dialog" aria-modal="true" aria-labelledby="pmTitle">
      <div class="pm-media">
        <img class="pm-photo" id="pmImg" src="" alt="" />
        <div id="pmBadges"></div>
        <span class="pm-size-flag" id="pmSizeFlag"></span>
        <img class="pm-seal" src="assets/brand/logo-mark.png" alt="" />
      </div>
      <button class="pm-close" onclick="closeProductModal()" aria-label="סגור">✕</button>
      <div class="pm-body">
        <span class="pm-tag" id="pmTag"></span>
        <h3 id="pmTitle"></h3>
        <p class="pm-botanical" id="pmBotanical"></p>

        <div class="pm-price-row">
          <span class="pm-price" id="pmPrice">₪0</span>
          <span class="pm-price-note" id="pmPriceNote"></span>
        </div>

        <div class="size-label">בחירת גודל הזר</div>
        <div class="size-picker" id="pmSizes"></div>
        <p class="size-note" id="pmSizeNote"></p>

        <div class="comp-card">
          <div class="comp-head">
            <span>מה בדיוק יש בזר</span>
            <span class="comp-total" id="pmStemTotal"></span>
          </div>
          <ul class="comp-list" id="pmComposition"></ul>
        </div>

        <div class="pm-tabs">
          <button class="pm-tab" data-tab="care" onclick="pmSwitchTab('care')">המלצות לשזירה וטיפול באגרטל</button>
          <button class="pm-tab" data-tab="delivery" onclick="pmSwitchTab('delivery')">פרטי משלוח והגעה</button>
        </div>
        <div class="pm-panel" id="pmPanelCare"></div>
        <div class="pm-panel" id="pmPanelDelivery"></div>

        <div class="pm-added" id="pmAdded"></div>
        <div class="pm-actions">
          <button class="btn btn-ghost" onclick="pmAddToCart()">הוסף לסל</button>
          <button class="btn btn-gold" onclick="pmQuickBuy()">רכישה מהירה</button>
        </div>
      </div>
    </div>`;

  el.addEventListener("click", (e) => {
    if (e.target === el) closeProductModal();
  });
  document.body.appendChild(el);
  return el;
}

function openProductModal(id) {
  const product = findProduct(id);
  if (!product) return;
  pmProduct = product;
  pmSize = DEFAULT_SIZE;
  pmTab = "care";

  const el = pmEnsureDOM();
  document.getElementById("pmImg").alt = product.name;
  document.getElementById("pmBadges").innerHTML = badgesHTML(product);

  document.getElementById("pmTag").textContent = product.tag || "בוטיק פרחי איריס";
  document.getElementById("pmTitle").textContent = product.name;
  document.getElementById("pmBotanical").textContent = product.botanical;

  document.getElementById("pmPanelCare").innerHTML = `
    <ul>${product.care.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    <p style="margin-top:12px"><strong>אגרטל מומלץ:</strong> ${esc(product.vase)}</p>`;

  document.getElementById("pmPanelDelivery").innerHTML = `
    <ul>
      <li>קריית אתא — משלוח באותו יום בהזמנה עד 14:00.</li>
      <li>חיפה, קריית ביאליק, מוצקין, חיים ונשר — באותו יום בהזמנה עד 13:00.</li>
      <li>קריית ים, טירת כרמל, עכו ויגור — משלוח למחרת.</li>
      <li>בעמוד התשלום אפשר לבחור תאריך ושעת הגעה מועדפים.</li>
      <li>הזר נשזר ביום המשלוח — לא מראש, ולא מהמקרר.</li>
    </ul>
    <p style="margin-top:12px">לא בטוחים שאנחנו מגיעים אליכם? בדקו בבודק אזור החלוקה בעמוד הבית, או שאלו את מיכל בצ'אט.</p>`;

  pmRenderSizes();
  pmSetImage(pmSize, true);
  pmSwitchTab("care");
  document.getElementById("pmAdded").classList.remove("show");

  el.classList.add("open");
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", pmEscHandler);
}

function closeProductModal() {
  document.getElementById("pmOverlay")?.classList.remove("open");
  document.body.style.overflow = "";
  document.removeEventListener("keydown", pmEscHandler);
}

function pmEscHandler(e) {
  if (e.key === "Escape") closeProductModal();
}

/* ---------- תמונה לפי גודל ---------- */
function pmSetImage(sizeId, instant) {
  const el = document.getElementById("pmImg");
  const target = imageFor(pmProduct, sizeId);
  const apply = (src) => {
    el.src = src;
    el.classList.remove("fading");
  };
  const pre = new Image();
  pre.onload = () => apply(target);
  pre.onerror = () => apply(pmProduct.img); // אין עדיין קובץ לגודל הזה — נופלים לתמונה הראשית
  if (instant) {
    pre.src = target;
    return;
  }
  el.classList.add("fading");
  setTimeout(() => {
    pre.src = target;
  }, 170);
}

/* ---------- גדלים ---------- */
function pmRenderSizes() {
  document.getElementById("pmSizes").innerHTML = SIZES.map(
    (s) => `
    <button type="button" class="size-opt ${s.id === pmSize ? "active" : ""}" data-size="${s.id}" onclick="pmSelectSize('${s.id}')">
      <span class="s-name">${esc(s.label)}</span>
      <span class="s-stems">${stemCount(pmProduct, s.id)} ${esc(pmProduct.unitLabel || "גבעולים")}</span>
      <span class="s-price">₪${priceFor(pmProduct, s.id)}</span>
    </button>`
  ).join("");
  pmRenderPrice(false);
  pmRenderComposition();
}

function pmSelectSize(sizeId) {
  if (sizeId === pmSize) return;
  pmSize = sizeId;
  document.querySelectorAll(".size-opt").forEach((b) => b.classList.toggle("active", b.dataset.size === sizeId));
  pmSetImage(sizeId, false);
  pmRenderPrice();
  pmRenderComposition();
  document.getElementById("pmAdded").classList.remove("show");
}

function pmRenderPrice(animate = true) {
  const size = findSize(pmSize);
  const priceEl = document.getElementById("pmPrice");
  const write = () => {
    priceEl.textContent = `₪${priceFor(pmProduct, pmSize)}`;
    priceEl.classList.remove("flash");
  };
  if (animate) {
    priceEl.classList.add("flash");
    setTimeout(write, 120);
  } else {
    write();
  }

  document.getElementById("pmPriceNote").textContent =
    size.mult > 1
      ? `מחיר בסיס ₪${pmProduct.price} · ${size.label} (+${Math.round((size.mult - 1) * 100)}%)`
      : "מחיר בסיס";

  document.getElementById("pmSizeFlag").textContent = `${size.label} · ${stemLabel(pmProduct, pmSize)}`;
  document.getElementById("pmSizeNote").textContent = size.note;
}

/* ---------- פירוט ההרכב ---------- */
function pmRenderComposition() {
  const items = compositionFor(pmProduct, pmSize);
  const list = document.getElementById("pmComposition");
  list.innerHTML = items
    .map(([name, qty]) => `<li><span class="c-name">${esc(name)}</span><span class="c-qty">${qty}</span></li>`)
    .join("");
  list.classList.remove("pop");
  void list.offsetWidth;
  list.classList.add("pop");
  document.getElementById("pmStemTotal").textContent = `סה״כ ${stemLabel(pmProduct, pmSize)}`;
}

function pmSwitchTab(name) {
  pmTab = name;
  document.querySelectorAll(".pm-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.getElementById("pmPanelCare").classList.toggle("active", name === "care");
  document.getElementById("pmPanelDelivery").classList.toggle("active", name === "delivery");
}

function pmAddToCart() {
  addToCart(pmProduct.id, pmSize);
  const el = document.getElementById("pmAdded");
  el.textContent = `✓ ${pmProduct.name} בגודל ${findSize(pmSize).label} (${stemLabel(pmProduct, pmSize)}) נוסף לסל — ₪${priceFor(pmProduct, pmSize)}`;
  el.classList.add("show");
}

function pmQuickBuy() {
  addToCart(pmProduct.id, pmSize);
  window.location.href = "checkout.html";
}
