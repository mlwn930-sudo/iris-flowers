/* ============================================================
   פרחי איריס — שכבת השדרוגים
   ------------------------------------------------------------
   1. אנימציות כניסה בגלילה (Reveal)
   2. פס התקדמות גלילה
   3. טיימר חלון המשלוח — "הזמינו בעוד X ותקבלו היום"
   4. קישור ישיר לזר בודד + שיתוף
   5. Schema.org — מחירים ודירוגים בתוצאות גוגל
   6. תמונות מוקטנות לנייד (srcset)
   ============================================================ */

/* ============================================================
   1. אנימציות כניסה בגלילה
   ============================================================ */
function initReveal() {
  var targets = document.querySelectorAll("[data-reveal],[data-reveal-stagger]");
  if (!targets.length) return;

  // בלי IntersectionObserver (דפדפן ישן) — פשוט מציגים הכול
  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("revealed"); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach(function (el) { io.observe(el); });
}

/** מסמן אלמנטים חדשים שנוצרו ב-JS (כרטיסי מוצר, למשל) */
function revealNew(container) {
  if (!container) return;
  var els = container.querySelectorAll("[data-reveal],[data-reveal-stagger]");
  if (!els.length) return;
  requestAnimationFrame(function () {
    els.forEach(function (el) { el.classList.add("revealed"); });
  });
}

/* ============================================================
   2. פס התקדמות גלילה
   ============================================================ */
function initScrollProgress() {
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var ticking = false;
  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

/* ============================================================
   3. טיימר חלון המשלוח
   ------------------------------------------------------------
   שעות הסגירה להזמנה ליום העסקים הנוכחי.
   0 = ראשון ... 6 = שבת. null = החנות סגורה.
   ============================================================ */
var CUTOFF_HOURS = {
  0: 14, // ראשון
  1: 14, // שני
  2: 14, // שלישי
  3: 14, // רביעי
  4: 14, // חמישי
  5: 11, // שישי — יום קצר
  6: null, // שבת — סגור
};

var DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

/** מחזיר {open:bool, msLeft:number, nextDay:string} */
function deliveryWindow(now) {
  now = now || new Date();
  var cutoff = CUTOFF_HOURS[now.getDay()];

  if (cutoff !== null && cutoff !== undefined) {
    var end = new Date(now);
    end.setHours(cutoff, 0, 0, 0);
    if (now < end) return { open: true, msLeft: end - now, cutoff: cutoff };
  }

  // מצאו את יום העסקים הבא
  for (var i = 1; i <= 7; i++) {
    var d = new Date(now);
    d.setDate(d.getDate() + i);
    if (CUTOFF_HOURS[d.getDay()] !== null && CUTOFF_HOURS[d.getDay()] !== undefined) {
      return {
        open: false,
        nextDay: i === 1 ? "מחר" : "יום " + DAY_NAMES[d.getDay()],
        nextCutoff: CUTOFF_HOURS[d.getDay()],
      };
    }
  }
  return { open: false, nextDay: "היום הקרוב" };
}

function formatCountdown(ms) {
  var total = Math.max(0, Math.floor(ms / 1000));
  var h = Math.floor(total / 3600);
  var m = Math.floor((total % 3600) / 60);
  var s = total % 60;
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  return h > 0 ? h + ":" + pad(m) + ":" + pad(s) : pad(m) + ":" + pad(s);
}

function initCutoffBar() {
  var bar = document.getElementById("cutoffBar");
  if (!bar) return;

  function tick() {
    var w = deliveryWindow();
    if (w.open) {
      bar.classList.remove("closed");
      bar.innerHTML =
        '<span class="pip" aria-hidden="true"></span>' +
        "<span>הזמינו בתוך <span class=\"cutoff-clock\" id=\"cutoffClock\">" +
        formatCountdown(w.msLeft) +
        "</span> — והזר יוצא אליכם <strong>עוד היום</strong> (קריית אתא והקריות)</span>" +
        '<a href="policy.html#delivery">זמני אספקה מלאים</a>';
    } else {
      bar.classList.add("closed");
      bar.innerHTML =
        '<span class="pip" aria-hidden="true"></span>' +
        "<span>חלון המשלוח להיום נסגר — הזמנה שתתקבל עכשיו תישלח <strong>" +
        w.nextDay +
        "</strong>" +
        (w.nextCutoff ? " (עד " + w.nextCutoff + ":00)" : "") +
        "</span>" +
        '<a href="policy.html#delivery">זמני אספקה מלאים</a>';
    }
  }

  tick();
  setInterval(tick, 1000);
}

/* ============================================================
   4. קישור ישיר לזר בודד + שיתוף
   ------------------------------------------------------------
   catalog.html?zer=iris-signature  ← נפתח ישירות על הזר
   ============================================================ */
function productUrl(id, size) {
  var base = location.origin + location.pathname.replace(/[^/]*$/, "") + "catalog.html";
  // קבצים מקומיים (file://) — נשמור על כתובת יחסית שעדיין עובדת
  if (location.protocol === "file:") base = "catalog.html";
  return base + "?zer=" + encodeURIComponent(id) + (size && size !== "standard" ? "&godel=" + size : "");
}

function shareProduct(id, size) {
  var p = findProduct(id);
  if (!p) return;
  var url = productUrl(id, size);
  var text = p.name + " — פרחי איריס · " + p.desc;

  if (navigator.share) {
    navigator
      .share({ title: p.name + " — פרחי איריס", text: text, url: url })
      .catch(function () { /* המשתמש ביטל — לא עושים כלום */ });
    return;
  }
  copyProductLink(id, size);
}

function copyProductLink(id, size) {
  var url = productUrl(id, size);
  var done = function () {
    var el = document.getElementById("pmShareToast");
    if (el) {
      el.textContent = "✓ הקישור לזר הועתק — אפשר להדביק בוואטסאפ";
      setTimeout(function () { el.textContent = ""; }, 3200);
    }
    if (window.announce) window.announce("הקישור לזר הועתק");
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url, done); });
  } else {
    fallbackCopy(url, done);
  }
}

function fallbackCopy(text, done) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done(); } catch (e) {}
  document.body.removeChild(ta);
}

function whatsappProduct(id, size) {
  var p = findProduct(id);
  if (!p) return;
  var msg = "תראה את הזר הזה מפרחי איריס 🌸\n" + p.name + "\n" + productUrl(id, size);
  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener");
}

/** פותח חלון מוצר אם הכתובת מפנה לזר ספציפי */
function initDeepLink() {
  var params = new URLSearchParams(location.search);
  var id = params.get("zer") || params.get("product");
  if (!id && location.hash.indexOf("#zer-") === 0) id = location.hash.slice(5);
  if (!id || typeof findProduct !== "function" || !findProduct(id)) return;

  var size = params.get("godel");
  setTimeout(function () {
    if (typeof openProductModal === "function") openProductModal(id, size);
  }, 350);
}

/* ============================================================
   5. Schema.org — כך גוגל מציג מחיר ודירוג בתוצאות החיפוש
   ============================================================ */
function injectSchema() {
  if (typeof PRODUCTS === "undefined") return;

  var origin = location.protocol === "file:" ? "https://example.com" : location.origin;

  var business = {
    "@context": "https://schema.org",
    "@type": "Florist",
    name: "פרחי איריס",
    alternateName: "Iris Flowers — Haute Floral Studio",
    description: "בוטיק פרחים בקריית אתא. זרים בעבודת יד, שלוש מידות לכל זר, ומשלוחים באזור קריית אתא ומפרץ חיפה.",
    image: origin + "/assets/brand/logo-hero.jpg",
    logo: origin + "/assets/brand/logo-mark.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "איינשטיין 20",
      addressLocality: "קריית אתא",
      addressCountry: "IL",
    },
    priceRange: "₪₪",
    areaServed: (typeof DELIVERY_ZONES !== "undefined" ? DELIVERY_ZONES : []).map(function (z) {
      return { "@type": "City", name: z.city };
    }),
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "127" },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday","Monday","Tuesday","Wednesday","Thursday"], opens: "08:30", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "08:00", closes: "14:00" },
    ],
  };

  var items = PRODUCTS.map(function (p, i) {
    var node = {
      "@type": "Product",
      "@id": origin + "/catalog.html?zer=" + p.id,
      name: p.name,
      description: p.botanical || p.desc,
      image: origin + "/" + p.img,
      brand: { "@type": "Brand", name: "פרחי איריס" },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "ILS",
        lowPrice: priceFor(p, "standard"),
        highPrice: priceFor(p, "premium"),
        offerCount: 3,
        availability: "https://schema.org/InStock",
      },
    };
    var revs = typeof reviewsFor === "function" ? reviewsFor(p.id) : [];
    if (revs.length) {
      node.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: productRating(p.id).toFixed(1),
        reviewCount: revs.length,
      };
      node.review = revs.slice(0, 3).map(function (r) {
        return {
          "@type": "Review",
          reviewRating: { "@type": "Rating", ratingValue: r.stars, bestRating: 5 },
          author: { "@type": "Person", name: r.by },
          reviewBody: r.text,
        };
      });
    }
    return { "@type": "ListItem", position: i + 1, item: node };
  });

  var list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "קטלוג פרחי איריס",
    itemListElement: items,
  };

  [business, list].forEach(function (obj) {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  });
}

/* ============================================================
   6. תמונות מוקטנות לנייד
   ------------------------------------------------------------
   לכל תמונת מוצר נוצרה גרסה מוקטנת ב-assets/products/thumbs/.
   הדפדפן בוחר לבד את הקטנה במסכים קטנים — חיסכון של כ-80%
   בנפח ההורדה בנייד. אם הקובץ המוקטן חסר, הדפדפן פשוט
   ייקח את המקורי, כך שאין סיכון לשבירה.
   ============================================================ */
function thumbFor(src) {
  if (!src || src.indexOf("assets/products/") !== 0) return "";
  return src.replace("assets/products/", "assets/products/thumbs/").replace(/\.jpg$/i, "-420.jpg");
}

/** מחזיר את התכונות srcset/sizes כמחרוזת מוכנה לתגית <img> */
function imgSrcset(src, sizes) {
  var small = thumbFor(src);
  if (!small) return "";
  return ' srcset="' + small + " 420w, " + src + ' 1100w" sizes="' + (sizes || "(max-width:620px) 48vw, 300px") + '"';
}

/* ============================================================
   הפעלה
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  initReveal();
  initScrollProgress();
  initCutoffBar();
  injectSchema();
  initDeepLink();
});
