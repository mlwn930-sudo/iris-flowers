/* ============================================================
   פרחי איריס — עמוד הקופה (3 שלבים) + קופונים + סוכן ברכות
   ============================================================ */

let currentStep = 1;
const STEP_LABELS = ["פרטי משלוח", "ברכה", "תשלום"];

/* ---------- קופונים (הדגמה — להחלפה במערכת אמיתית) ---------- */
const COUPONS = {
  IRIS10: { type: "percent", value: 10, label: "10% הנחה", min: 0 },
  WELCOME: { type: "fixed", value: 20, label: '20 ש"ח הנחה', min: 0 },
  IRIS50: { type: "fixed", value: 50, label: '50 ש"ח הנחה', min: 300 },
};

let appliedCoupon = null;

/* ============================================================
   תוספות לזר + שליחה אנונימית
   ============================================================ */
const selectedAddons = new Set();
let anonymousGift = false;

function addonsTotal() {
  let sum = 0;
  selectedAddons.forEach((id) => {
    const a = findAddon(id);
    if (a) sum += a.price;
  });
  return sum;
}

function renderAddons() {
  const box = document.getElementById("addonsBox");
  if (!box) return;
  box.innerHTML = ADDONS.map(
    (a) => `
    <button type="button" class="addon ${selectedAddons.has(a.id) ? "on" : ""}"
            role="checkbox" aria-checked="${selectedAddons.has(a.id)}"
            onclick="toggleAddon('${a.id}')">
      <span class="emo" aria-hidden="true">${a.emo}</span>
      <span class="txt"><b>${esc(a.name)}</b><small>${esc(a.note)}</small></span>
      <span class="amt">+₪${a.price}</span>
      <span class="tick" aria-hidden="true">✓</span>
    </button>`
  ).join("");
}

function toggleAddon(id) {
  if (selectedAddons.has(id)) selectedAddons.delete(id);
  else selectedAddons.add(id);
  renderAddons();
  renderOrderSummary();
  const a = findAddon(id);
  if (a && typeof announce === "function") {
    announce(selectedAddons.has(id) ? `${a.name} נוסף להזמנה` : `${a.name} הוסר מההזמנה`);
  }
}

function toggleAnonymous() {
  anonymousGift = !anonymousGift;
  const sw = document.getElementById("anonSwitch");
  if (sw) sw.setAttribute("aria-checked", anonymousGift ? "true" : "false");
  const note = document.getElementById("anonNote");
  if (note) {
    note.textContent = anonymousGift
      ? "השם שלך לא יופיע על הכרטיס, והשליח לא יחשוף מי שלח. ניצור איתך קשר רק אם יש בעיה במסירה."
      : "כברירת מחדל שם השולח מופיע על כרטיס הברכה.";
  }
  if (typeof announce === "function") {
    announce(anonymousGift ? "שליחה אנונימית הופעלה" : "שליחה אנונימית כובתה");
  }
}

function discountFor(subtotal) {
  if (!appliedCoupon) return 0;
  const c = COUPONS[appliedCoupon];
  if (!c || subtotal < c.min) return 0;
  const raw = c.type === "percent" ? (subtotal * c.value) / 100 : c.value;
  return Math.min(Math.round(raw), subtotal);
}

function applyCoupon() {
  const input = document.getElementById("couponInput");
  const msg = document.getElementById("couponMsg");
  const code = (input.value || "").trim().toUpperCase();

  if (!code) {
    appliedCoupon = null;
    msg.className = "coupon-msg";
    renderOrderSummary();
    return;
  }

  const coupon = COUPONS[code];
  const subtotal = cartTotal();

  if (!coupon) {
    appliedCoupon = null;
    msg.className = "coupon-msg no";
    msg.textContent = "הקוד לא זוהה. בדקו את האיות ונסו שוב.";
  } else if (subtotal < coupon.min) {
    appliedCoupon = null;
    msg.className = "coupon-msg no";
    msg.textContent = `הקוד תקף מהזמנה של ₪${coupon.min} ומעלה.`;
  } else {
    appliedCoupon = code;
    msg.className = "coupon-msg ok";
    msg.textContent = `✓ הקוד ${code} הופעל — ${coupon.label}`;
  }
  renderOrderSummary();
}

/* ---------- סרגל התקדמות ---------- */
function renderProgress() {
  const bar = document.getElementById("progressBar");
  if (!bar) return;
  bar.innerHTML = STEP_LABELS.map((label, i) => {
    const n = i + 1;
    const state = n < currentStep ? "done" : n === currentStep ? "active" : "";
    const mark = n < currentStep ? "✓" : n;
    return `<div class="step ${state}"><div class="circle">${mark}</div><div class="label">${label}</div></div>${
      n < STEP_LABELS.length ? '<div class="line"></div>' : ""
    }`;
  }).join("");
}

function goStep(step) {
  if (step > currentStep && !validateStep(currentStep)) return;
  currentStep = step;
  document.querySelectorAll(".step-panel").forEach((el) => el.classList.remove("active"));
  document.getElementById(`step${step}`).classList.add("active");
  renderProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStep(step) {
  if (step !== 1) return true;
  if (cartCount() === 0) {
    alert("העגלה ריקה — חזרו לקטלוג כדי לבחור זר");
    return false;
  }
  const required = ["fName", "fPhone", "fAddress", "fDate"];
  for (const id of required) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      alert("נא למלא שם, טלפון, כתובת ותאריך הגעה");
      el.focus();
      return false;
    }
  }
  return true;
}

/* ---------- סיכום ההזמנה בסיידבאר ---------- */
function renderOrderSummary() {
  const lines = cartLines();
  const goods = cartTotal();
  const addons = addonsTotal();
  const subtotal = goods + addons;
  const discount = discountFor(subtotal);
  const shipping = deliveryFeeFor(subtotal - discount);
  const total = subtotal - discount + shipping;

  const countEl = document.getElementById("orderCount");
  if (countEl) countEl.textContent = cartCount();

  const el = document.getElementById("orderLines");
  if (el) {
    el.innerHTML = lines.length
      ? lines
          .map(
            (l) => `
        <div class="aside-row">
          <div class="thumb"><img src="${imageFor(l.product, l.size)}" onerror="this.onerror=null;this.src='${l.product.img}'" alt="${esc(l.product.name)}" /></div>
          <div class="meta">
            <h6>${esc(l.product.name)}</h6>
            <span class="sz">${esc(l.sizeDef.label)} · ${esc(stemLabel(l.product, l.size))}</span>
            <div class="qty">כמות ${l.qty} × ₪${l.unit}</div>
          </div>
          <div class="amt">₪${l.total}</div>
        </div>`
          )
          .join("")
      : `<p class="checkout-empty">העגלה ריקה — <a href="catalog.html">חזרה לקטלוג</a></p>`;
  }

  // שורות התוספות מופיעות בסיכום כמו כל פריט אחר
  const addonEl = document.getElementById("orderAddons");
  if (addonEl) {
    const chosen = ADDONS.filter((a) => selectedAddons.has(a.id));
    addonEl.innerHTML = chosen.length
      ? chosen
          .map(
            (a) =>
              `<div class="order-sub"><span>${a.emo} ${esc(a.name)}</span><span>₪${a.price}</span></div>`
          )
          .join("")
      : "";
  }

  const subEl = document.getElementById("orderSubtotal");
  if (subEl) subEl.innerHTML = `<span>סכום ביניים</span><span>₪${subtotal}</span>`;

  const discEl = document.getElementById("orderDiscount");
  if (discEl) {
    if (discount > 0) {
      discEl.style.display = "flex";
      discEl.innerHTML = `<span>הנחת קופון ${appliedCoupon}</span><span>−₪${discount}</span>`;
    } else {
      discEl.style.display = "none";
    }
  }

  // דמי משלוח — גלויים לפני שלב התשלום, לא הפתעה בסוף
  const shipEl = document.getElementById("orderShipping");
  if (shipEl) {
    shipEl.innerHTML = `<span>משלוח</span><span class="${shipping === 0 ? "free" : ""}">${
      shipping === 0 ? "חינם 🎉" : "₪" + shipping
    }</span>`;
  }
  const shipHint = document.getElementById("shipHint");
  if (shipHint) {
    const missing = FREE_DELIVERY_OVER - (subtotal - discount);
    shipHint.innerHTML =
      shipping === 0
        ? `<span class="ship-free">המשלוח עלינו — עברתם את ₪${FREE_DELIVERY_OVER}</span>`
        : `עוד <b>₪${missing}</b> והמשלוח חינם`;
  }

  document.querySelectorAll(".js-total").forEach((n) => (n.textContent = `₪${total}`));
}

/* ---------- סוכן הברכות ---------- */
const GREETING_TEMPLATES = {
  romantic: [
    "כל פרח בזר הזה הוא עוד סיבה שאני אוהב/ת אותך. שתדע/י כמה את/ה מייחד/ת לי את החיים.",
    "יש דברים שקשה לומר במילים — אז אמרתי אותם בפרחים. שיהיה לך יום מלא באהבה.",
    "מבין כל הפרחים בעולם בחרתי דווקא את אלה, כי הם היחידים שמתקרבים ליופי שלך.",
    "עוד יום שאני מודה שיש אותך. אוהב/ת אותך, היום ותמיד.",
    "לא צריך תאריך מיוחד כדי להגיד לך כמה את/ה חשוב/ה לי. הזר הזה פשוט אומר את זה בקול.",
    "אם הייתי צריך/ה לבחור שוב — הייתי בוחר/ת בך שוב, בלי לחשוב פעמיים.",
    "פרחים נובלים, אבל מה שאני מרגיש/ה כלפיך רק ממשיך לפרוח.",
    "בשבילך, כי כל יום איתך נראה קצת יותר יפה.",
  ],
  birthday: [
    "יום הולדת שמח! שתמשיך/י לפרוח כמו הזר הזה — שנה שלמה של אושר, בריאות והפתעות טובות.",
    "עוד שנה יפה נוספה לך, ואת/ה רק נהיה/ית מדהים/ה יותר. שהיום יהיה מלא בחיוכים.",
    "מזל טוב! שהשנה הקרובה תביא לך בדיוק את מה שהלב שלך מבקש.",
    "יום הולדת שמח! מאחל/ת לך שנה של בריאות, צחוק, ואנשים טובים סביבך.",
    "חוגגים אותך היום — ומגיע לך כל רגע. יום הולדת שמח!",
    "שתהיה לך שנה שבה כל מה שתכננת סוף סוף יקרה. מזל טוב!",
    "יום הולדת שמח לאדם שעושה לכולם סביבו טוב יותר.",
    "עוד סיבוב סביב השמש, ועוד שנה שאני שמח/ה שאת/ה בחיים שלי. מזל טוב!",
  ],
  touching: [
    "אין לי מספיק מילים כדי להגיד כמה את/ה חשוב/ה לי — אז שלחתי פיסת יופי במקום.",
    "הזר הזה הוא רק שבריר קטן ממה שאני מרגיש/ה כלפיך. תודה על הכול.",
    "לפעמים הלב מלא כל כך שקשה למצוא מילים. קיוויתי שהפרחים האלה ידברו בשבילי.",
    "רציתי שתדע/י שחושבים עליך. באמת, ולא רק היום.",
    "יש אנשים שעושים את העולם רך יותר. את/ה אחד מהם.",
    "בלי סיבה מיוחדת — פשוט כי הגיע לך שמישהו יזכיר לך כמה את/ה שווה.",
    "תודה על כל הפעמים שהיית שם בלי שביקשתי. לא שכחתי.",
  ],
  funny: [
    "הזמנתי לך פרחים כי חיבוק בדואר עוד לא המציאו. תיהנה/י, ואל תשכח/י למי את/ה חייב/ת עכשיו.",
    "אזהרה: הזר הזה עלול לגרום לחיוך בלתי נשלט ולרצון פתאומי להתקשר ולהגיד תודה.",
    "קניתי לך פרחים כדי שתפסיק/י להגיד שאני לא רומנטי/ת. עכשיו תורך להתרשם.",
    "הפרחים האלה עלו לי בהרבה כסף, אז תשים/י אותם במקום שרואים. תודה מראש.",
    "שלחתי פרחים כי שוקולד היה נגמר לך תוך יומיים ואז לא היה נשאר ממני זכר.",
    "בחרתי את הזר הכי יפה שהיה, כי מגיע לך — וגם כי לא רציתי שתכעס/י עליי.",
    "הפרחים האלה נבחרו בקפידה על ידי מומחה. (המומחה זו המוכרת. אני רק הצבעתי.)",
  ],
  congrats: [
    "מזל טוב! עבדת קשה בשביל הרגע הזה, ומגיע לך לחגוג אותו בגדול.",
    "כל הכבוד! תמיד ידעתי שתגיע/י לשם. גאה בך.",
    "מזל טוב מכל הלב — שזו תהיה רק ההתחלה של דברים טובים.",
    "אין מילים חוץ מ: הרווחת את זה בצדק. מזל טוב!",
    "חוגגים איתך מרחוק ושמחים בשמחתך. מזל טוב!",
  ],
  thanks: [
    "תודה. באמת. לא לוקח/ת את מה שעשית כמובן מאליו.",
    "רציתי להגיד תודה במשהו קטן ויפה — כי מילים לבד לא הספיקו.",
    "תודה על העזרה, על הסבלנות, ועל זה שתמיד אפשר לסמוך עליך.",
    "מעריך/ה מאוד את מה שעשית. הזר הזה הוא רק תזכורת קטנה לזה.",
    "תודה רבה — עשית את ההבדל, ואני לא אשכח את זה.",
  ],
  recovery: [
    "החלמה מהירה! שתחזור/תחזרי לעצמך מהר, ושהבית יתמלא שוב בצחוק שלך.",
    "חושבים עליך ומחכים לראות אותך שוב על הרגליים. תרגיש/י טוב.",
    "קצת צבע לחדר, וקצת אור ליום. רפואה שלמה!",
    "שתהיה החלמה מהירה וקלה — ושהדבר הכי מלחיץ השבוע יהיה מה לראות בטלוויזיה.",
    "מאחל/ת לך בריאות איתנה וחזרה מהירה לשגרה. אנחנו כאן לכל מה שצריך.",
  ],
  sympathy: [
    "בזמנים כאלה אין מילים שבאמת מנחמות, אבל אני איתך בלב. שיהיה לך כוח.",
    "חושב/ת עליך ברגעים הקשים האלה. שתמצא/י נחמה בזיכרונות היפים ובאהבת הסובבים אותך.",
    "שולח/ת לך חיבוק גדול וכוח להמשך הדרך. אני כאן בשבילך.",
    "משתתף/ת בצערך. שתדע/י רק ימים טובים מכאן והלאה.",
    "אין מה לומר שיקל, רק שתדע/י שאינך לבד. אנחנו איתך.",
  ],
};

let activeTone = null;
const usedGreetings = new Set();

function renderToneButtons() {
  const el = document.getElementById("toneButtons");
  if (!el) return;
  el.innerHTML = GREETING_TONES.map(
    (t) =>
      `<button type="button" class="tone-btn" data-tone="${t.id}" onclick="generateGreeting('${t.id}', this)">${t.label}</button>`
  ).join("");
}

function generateGreeting(toneId, btn) {
  activeTone = toneId;
  document.querySelectorAll(".tone-btn").forEach((b) => b.classList.toggle("active", b.dataset.tone === toneId));
  if (btn) btn.classList.add("loading");

  const bank = GREETING_TEMPLATES[toneId] || GREETING_TEMPLATES.touching;
  const unused = bank.filter((t) => !usedGreetings.has(t));
  const pool = unused.length ? unused : bank;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  if (!unused.length) bank.forEach((t) => usedGreetings.delete(t));
  usedGreetings.add(choice);

  setTimeout(() => {
    document.getElementById("fGreeting").value = choice;
    document.getElementById("regenRow").style.display = "flex";
    if (btn) btn.classList.remove("loading");
  }, 380);
}

function regenerateGreeting() {
  if (activeTone) generateGreeting(activeTone, null);
}

/* ---------- העברת ההזמנה לוואטסאפ של החנות ----------
   מכוון: פרטי כרטיס האשראי לא נכללים כאן ולעולם לא ייכללו.
   כתובת wa.me היא URL — כל מה שנכנס אליה נשמר בהיסטוריית הדפדפן,
   בשרתי וואטסאפ ובצ'אט של החנות. העברת מספר כרטיס בערוץ כזה היא
   הפרת PCI-DSS וסיכון ממשי ללקוח. הסליקה תטופל בעתיד מול ספק מאושר. */
let lastOrderMessage = "";

/* ============================================================
   התראת הזמנה במייל — רשת ביטחון למקרה שהלקוח לא לחץ "שלח" בוואטסאפ.
   ------------------------------------------------------------
   להפעלה (5 דקות, חינם, בלי כרטיס אשראי):
     1. להיכנס ל-https://web3forms.com
     2. להזין את כתובת המייל שאליה ההזמנות יגיעו וללחוץ "Create Access Key"
     3. המפתח יישלח למייל — להדביק אותו כאן למטה
   כתובת המייל עצמה נשמרת אצלם ולא נכנסת לקוד, כך שהיא לא נחשפת
   בריפו הציבורי בגיטהאב.
   שים לב: פרטי ההזמנה עוברים דרך שרתי web3forms. פרטי אשראי
   לא נשלחים לשם, בדיוק כמו בוואטסאפ.
   ============================================================ */
const ORDER_EMAIL_KEY = ""; // ← הדביקו כאן את ה-Access Key

async function sendOrderEmail(orderNum, message) {
  if (!ORDER_EMAIL_KEY) return { ok: false, reason: "no-key" };
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: ORDER_EMAIL_KEY,
        subject: `הזמנה חדשה ${orderNum} — פרחי איריס`,
        from_name: "אתר פרחי איריס",
        message,
      }),
    });
    return { ok: res.ok, reason: res.ok ? "" : "http-" + res.status };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

function setMailStatus(text, kind) {
  const el = document.getElementById("mailStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "mail-status " + (kind || "");
}

function val(id) {
  return (document.getElementById(id)?.value || "").trim();
}

function buildOrderMessage(orderNum) {
  const lines = cartLines();
  const goods = cartTotal();
  const addons = addonsTotal();
  const subtotal = goods + addons;
  const discount = discountFor(subtotal);
  const shipping = deliveryFeeFor(subtotal - discount);
  const total = subtotal - discount + shipping;

  const parts = [
    "🌸 *הזמנה חדשה — פרחי איריס*",
    `מספר הזמנה: ${orderNum}`,
    "",
    "*פרטי הלקוח*",
    `👤 מזמין/ה: ${val("fName")}`,
    `📞 טלפון: ${val("fPhone")}`,
  ];

  if (val("fRecipient")) parts.push(`🎁 מקבל/ת הזר: ${val("fRecipient")}`);
  parts.push(`📍 כתובת: ${val("fAddress")}`);

  const when = [val("fDate"), val("fTime")].filter(Boolean).join(" בשעה ");
  if (when) parts.push(`📅 מועד הגעה: ${when}`);
  if (val("fNote")) parts.push(`🚪 הערה לשליח: ${val("fNote")}`);

  parts.push("", "*ההזמנה*");
  lines.forEach((l) => {
    parts.push(`• ${l.product.name} — ${l.sizeDef.label} (${stemLabel(l.product, l.size)}) × ${l.qty} = ₪${l.total}`);
  });

  const chosenAddons = ADDONS.filter((a) => selectedAddons.has(a.id));
  if (chosenAddons.length) {
    parts.push("", "*תוספות*");
    chosenAddons.forEach((a) => parts.push(`• ${a.emo} ${a.name} = ₪${a.price}`));
  }

  parts.push("", `סכום ביניים: ₪${subtotal}`);
  if (discount > 0) parts.push(`הנחת קופון ${appliedCoupon}: −₪${discount}`);
  parts.push(`משלוח: ${shipping === 0 ? "חינם" : "₪" + shipping}`);
  parts.push(`*סה"כ לתשלום: ₪${total}*`);

  if (val("fGreeting")) {
    parts.push("", "*ברכה להקדשה*", `"${val("fGreeting")}"`);
  }

  if (anonymousGift) {
    parts.push("", "⚠️ *שליחה אנונימית* — אין לציין את שם השולח על הכרטיס ואין לחשוף אותו בפני המקבל/ת.");
  }

  parts.push("", "_נשלח אוטומטית מאתר פרחי איריס. התשלום יתואם טלפונית — פרטי אשראי אינם מועברים בוואטסאפ._");
  return parts.join("\n");
}

function whatsappOrderUrl() {
  const number = typeof SHOP_WHATSAPP !== "undefined" ? SHOP_WHATSAPP : "972500000000";
  return `https://wa.me/${number}?text=${encodeURIComponent(lastOrderMessage)}`;
}

function openOrderWhatsApp() {
  if (!lastOrderMessage) return;
  window.open(whatsappOrderUrl(), "_blank", "noopener");
}

function copyOrderMessage() {
  navigator.clipboard?.writeText(lastOrderMessage).then(() => {
    const el = document.getElementById("copyMsg");
    if (el) {
      el.textContent = "✓ פרטי ההזמנה הועתקו";
      setTimeout(() => (el.textContent = ""), 2600);
    }
  });
}

/* ---------- שליחת ההזמנה (הדגמה) ---------- */
function submitOrder() {
  if (!validateStep(1)) {
    goStep(1);
    return;
  }
  const orderNum = "IRIS-DEMO-" + Math.floor(100000 + Math.random() * 900000);
  lastOrderMessage = buildOrderMessage(orderNum);

  document.getElementById("orderNumber").textContent = orderNum;
  document.getElementById("formView").style.display = "none";
  document.getElementById("successView").style.display = "block";

  // נפתח בתוך אותה לחיצה, אחרת חוסם החלונות הקופצים יעצור את זה
  window.open(whatsappOrderUrl(), "_blank", "noopener");

  // רשת ביטחון: מייל לחנות, גם אם הלקוח לא ילחץ "שלח" בוואטסאפ
  if (ORDER_EMAIL_KEY) {
    setMailStatus("שולח עותק לחנות…", "");
    sendOrderEmail(orderNum, lastOrderMessage).then((r) => {
      setMailStatus(
        r.ok ? "✓ עותק ההזמנה נשלח לחנות במייל" : "לא הצלחנו לשלוח עותק במייל — אנא שלחו בוואטסאפ",
        r.ok ? "ok" : "no"
      );
    });
  }

  clearCart();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- אתחול ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  renderProgress();
  renderAddons();
  renderOrderSummary();
  renderToneButtons();
  updateCartBadge();

  // תאריך ברירת מחדל: היום, ולא מאפשרים לבחור תאריך שעבר
  const dateEl = document.getElementById("fDate");
  if (dateEl) {
    const today = new Date().toISOString().slice(0, 10);
    dateEl.min = today;
    if (!dateEl.value) dateEl.value = today;
  }
});
