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
    <div class="pm" role="dialog" aria-modal="true" aria-labelledby="pmTitle" id="pmDialog">
      <div class="pm-media">
        <img class="pm-photo" id="pmImg" src="" alt="" />
        <div id="pmBadges"></div>
        <span class="pm-size-flag" id="pmSizeFlag"></span>
        <img class="pm-seal" src="assets/brand/logo-mark-96.png" alt="" />
      </div>
      <button class="pm-close" onclick="closeProductModal()" aria-label="סגירת חלון הזר">✕</button>
      <div class="pm-body">
        <span class="pm-tag" id="pmTag"></span>
        <h3 id="pmTitle"></h3>
        <p class="pm-botanical" id="pmBotanical"></p>

        <div class="pm-share-row" id="pmShareRow"></div>
        <div class="share-toast" id="pmShareToast" role="status" aria-live="polite"></div>

        <div class="pm-price-row">
          <span class="pm-price" id="pmPrice">₪0</span>
          <span class="pm-price-note" id="pmPriceNote"></span>
        </div>
        <div class="ship-note" id="pmShipNote"></div>

        <div class="size-label" id="pmSizeLabel">בחירת גודל הזר</div>
        <div class="size-picker" id="pmSizes" role="radiogroup" aria-labelledby="pmSizeLabel"></div>
        <p class="size-note" id="pmSizeNote"></p>

        <div class="comp-card">
          <div class="comp-head">
            <span>מה בדיוק יש בזר</span>
            <span class="comp-total" id="pmStemTotal"></span>
          </div>
          <ul class="comp-list" id="pmComposition"></ul>
        </div>

        <div class="season-note">
          <span class="leaf" aria-hidden="true">🌿</span>
          <div>
            <strong>${esc(SEASON_POLICY.title)}</strong>
            ${esc(SEASON_POLICY.body)}
            <a href="policy.html#seasonal" style="color:var(--neon-cyan);text-decoration:underline">למדיניות המלאה</a>
          </div>
        </div>

        <div class="pm-tabs" role="tablist">
          <button class="pm-tab" data-tab="care" role="tab" aria-selected="false" aria-controls="pmPanelCare"
                  onclick="pmSwitchTab('care')">המלצות לשזירה וטיפול באגרטל</button>
          <button class="pm-tab" data-tab="delivery" role="tab" aria-selected="false" aria-controls="pmPanelDelivery"
                  onclick="pmSwitchTab('delivery')">פרטי משלוח והגעה</button>
        </div>
        <div class="pm-panel" id="pmPanelCare" role="tabpanel"></div>
        <div class="pm-panel" id="pmPanelDelivery" role="tabpanel"></div>

        <div class="pm-reviews" id="pmReviews"></div>

        <div class="pm-added" id="pmAdded" role="status" aria-live="polite"></div>
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

let pmReleaseTrap = null;
let pmPrevUrl = null;

function openProductModal(id, size) {
  const product = findProduct(id);
  if (!product) return;
  pmProduct = product;
  pmSize = findSize(size || DEFAULT_SIZE).id;
  pmTab = "care";

  const el = pmEnsureDOM();
  document.getElementById("pmImg").alt = product.name;
  document.getElementById("pmBadges").innerHTML = badgesHTML(product);

  document.getElementById("pmTag").textContent = product.tag || "בוטיק פרחי איריס";
  document.getElementById("pmTitle").textContent = product.name;
  document.getElementById("pmBotanical").textContent = product.botanical;

  pmRenderShare();
  pmRenderReviews();
  document.getElementById("pmShareToast").textContent = "";

  // דמי המשלוח מופיעים כאן, ליד המחיר — ולא רק בסוף בקופה
  document.getElementById("pmShipNote").innerHTML =
    `<span aria-hidden="true">🚚</span> <span>משלוח <strong>₪${DELIVERY_FEE}</strong> · ` +
    `<span class="ship-free">חינם מעל ₪${FREE_DELIVERY_OVER}</span> · נשזר ביום המשלוח</span>`;

  document.getElementById("pmPanelCare").innerHTML = `
    <ul>${product.care.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    <p style="margin-top:12px"><strong>אגרטל מומלץ:</strong> ${esc(product.vase)}</p>`;

  // נשאב מ-DELIVERY_ZONES ולא נכתב ידנית, כדי שלא ייווצרו שוב
  // סתירות בין החלון הזה, עמוד המדיניות ובודק אזור החלוקה
  document.getElementById("pmPanelDelivery").innerHTML = `
    <ul>
      <li><strong>דמי משלוח ₪${DELIVERY_FEE}</strong> — ומשלוח חינם בהזמנה מעל ₪${FREE_DELIVERY_OVER}. איסוף עצמי מהחנות בחינם.</li>
      ${deliveryTableRows()
        .map((r) => `<li>${esc(r.city)} — ${esc(r.info)}.</li>`)
        .join("")}
      <li>בעמוד התשלום אפשר לבחור תאריך ושעת הגעה מועדפים.</li>
      <li>הזר נשזר ביום המשלוח — לא מראש, ולא מהמקרר.</li>
    </ul>
    <p style="margin-top:12px">לא בטוחים שאנחנו מגיעים אליכם? בדקו בבודק אזור החלוקה בעמוד הבית, או שאלו את מיכאל בצ'אט.</p>`;

  pmRenderSizes();
  pmSetImage(pmSize, true);
  pmSwitchTab("care");
  document.getElementById("pmAdded").classList.remove("show");

  el.classList.add("open");
  document.body.style.overflow = "hidden";
  document.body.classList.add("overlay-open");
  document.addEventListener("keydown", pmEscHandler);

  // מלכודת פוקוס — המקלדת לא "בורחת" מהחלון אל הדף שמאחור
  if (typeof trapFocus === "function") {
    pmReleaseTrap = trapFocus(document.getElementById("pmDialog"), closeProductModal);
  }
  if (typeof announce === "function") {
    announce(`נפתח חלון הזר ${product.name}. לסגירה — מקש Escape.`);
  }

  // קישור ישיר: הכתובת בשורת הכתובת מצביעה על הזר הספציפי
  pmSyncUrl();
}

/** מעדכן את שורת הכתובת כך שרענון או העתקה יפתחו את אותו זר */
function pmSyncUrl() {
  if (!pmProduct || location.protocol === "file:") return;
  if (!/catalog\.html$|\/$|index\.html$/.test(location.pathname)) return;
  if (pmPrevUrl === null) pmPrevUrl = location.pathname + location.search + location.hash;
  const suffix = pmSize !== DEFAULT_SIZE ? `&godel=${pmSize}` : "";
  history.replaceState(null, "", `?zer=${encodeURIComponent(pmProduct.id)}${suffix}`);
}

function closeProductModal() {
  document.getElementById("pmOverlay")?.classList.remove("open");
  document.body.style.overflow = "";
  document.body.classList.remove("overlay-open");
  document.removeEventListener("keydown", pmEscHandler);
  if (pmReleaseTrap) {
    pmReleaseTrap();
    pmReleaseTrap = null;
  }
  if (pmPrevUrl !== null && location.protocol !== "file:") {
    history.replaceState(null, "", pmPrevUrl);
    pmPrevUrl = null;
  }
}

function pmEscHandler(e) {
  if (e.key === "Escape") closeProductModal();
}

/* ---------- שיתוף הזר ---------- */
function pmRenderShare() {
  const id = pmProduct.id;
  document.getElementById("pmShareRow").innerHTML = `
    <button type="button" class="pm-share-btn wa" onclick="whatsappProduct('${id}', pmSize)">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.7 1 3.7 1.5 5.8 1.5 6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.4zM12 21.5c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4A9.4 9.4 0 0 1 2.5 12C2.5 6.8 6.8 2.5 12 2.5S21.5 6.8 21.5 12 17.2 21.5 12 21.5zm5.2-7.1c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.6.1l-.9 1.1c-.2.2-.3.2-.6.1a7.7 7.7 0 0 1-3.8-3.3c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>
      שליחה בוואטסאפ
    </button>
    <button type="button" class="pm-share-btn" onclick="copyProductLink('${id}', pmSize)">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7h-4a5 5 0 0 0 0 10h4v-1.9h-4A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z"/></svg>
      העתקת קישור לזר
    </button>
    <button type="button" class="pm-share-btn" onclick="shareProduct('${id}', pmSize)">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7l7-4.1c.6.5 1.3.8 2.1.8a3 3 0 1 0-3-3c0 .3 0 .5.1.7L8 9.8A3 3 0 1 0 6 15a3 3 0 0 0 2-.8l7.1 4.2c0 .2-.1.4-.1.6a2.9 2.9 0 1 0 3-2.9z"/></svg>
      שיתוף
    </button>`;
}

/* ---------- ביקורות למוצר הספציפי ---------- */
function pmRenderReviews() {
  const box = document.getElementById("pmReviews");
  const list = reviewsFor(pmProduct.id);
  if (!list.length) {
    box.innerHTML = "";
    box.style.display = "none";
    return;
  }
  box.style.display = "block";
  const avg = productRating(pmProduct.id);
  box.innerHTML = `
    <h5>מה כתבו על הזר הזה <span class="avg">${avg.toFixed(1)} ★ · ${list.length} ביקורות</span></h5>
    ${list
      .map(
        (r) => `
      <div class="mini-review">
        <div class="stars">${starsMini(r.stars)}</div>
        <p>"${esc(r.text)}"</p>
        <div class="by">${esc(r.by)} <span>· ${esc(r.where)}${r.when ? " · " + esc(r.when) : ""}</span>
          <span class="verified">✓ הזמנה מאומתת</span></div>
      </div>`
      )
      .join("")}`;
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
