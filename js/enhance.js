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

  /* ------------------------------------------------------------
     רשת ביטחון: כל מה שכבר *מעל* המסך חייב להיות גלוי.

     ה-Observer מדווח רק על מה שנחתך עם המסך. כשהעמוד נטען כבר
     מגולל — או קופץ — כל מה שנדלג עליו נשאר ב-opacity:0 לנצח,
     והמשתמש שגולל למעלה רואה קטעים ריקים.

     זה קורה בארבעה מצבים יומיומיים:
       · כניסה בקישור עם עוגן (policy.html#accessibility)
       · רענון שבו הדפדפן משחזר את מיקום הגלילה
       · חיפוש בעמוד (Ctrl+F) שקופץ לתוצאה
       · מקש End
     ------------------------------------------------------------ */
  function revealPassed() {
    targets.forEach(function (el) {
      if (el.classList.contains("revealed")) return;
      var r = el.getBoundingClientRect();
      // כבר מעל המסך, או נמצא בתוכו — אין סיבה להסתיר
      if (r.bottom < window.innerHeight * 0.92) {
        el.classList.add("revealed");
        io.unobserve(el);
      }
    });
  }

  revealPassed();
  window.addEventListener("load", revealPassed);
  window.addEventListener("hashchange", function () { setTimeout(revealPassed, 700); });

  // סריקה קצרה בשנייה הראשונה, בזמן שתמונות עצלות עדיין מזיזות את הפריסה
  var sweeps = 0;
  var sweep = setInterval(function () {
    revealPassed();
    if (++sweeps > 6) clearInterval(sweep);
  }, 250);
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
      // "מחר" עומד בפני עצמו, אבל שם של יום דורש מילת יחס:
      // "תישלח מחר" — נכון.  "תישלח יום ראשון" — שגוי.
      // "תישלח ביום ראשון" — נכון.
      return {
        open: false,
        nextDay: i === 1 ? "מחר" : "ביום " + DAY_NAMES[d.getDay()],
        nextCutoff: CUTOFF_HOURS[d.getDay()],
      };
    }
  }
  return { open: false, nextDay: "בימים הקרובים" };
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
        (w.nextCutoff ? ", עד השעה " + w.nextCutoff + ":00" : "") +
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
   6.5 המשפט היומי
   ------------------------------------------------------------
   מוזרק מיד מתחת לניווט, בראש כל עמוד. מתחלף פעם ביום ב-08:00.
   ============================================================ */
function initDailyLine() {
  if (typeof dailyLine !== "function") return;
  if (document.querySelector(".daily-line")) return;

  var nav = document.querySelector(".nav");
  if (!nav) return;

  var el = document.createElement("div");
  el.className = "daily-line";
  el.setAttribute("role", "note");
  el.innerHTML = '<span class="bud" aria-hidden="true">🌸</span><span>' + dailyLine() + "</span>";
  nav.parentNode.insertBefore(el, nav.nextSibling);

  // אם הדף נשאר פתוח מעבר ל-08:00, המשפט מתחלף בלי רענון
  setInterval(function () {
    var now = dailyLine();
    var span = el.querySelector("span:last-child");
    if (span && span.textContent !== now) span.textContent = now;
  }, 60000);
}

/* ============================================================
   7. גלילה לעוגן — אמינה גם בנייד
   ------------------------------------------------------------
   שתי בעיות בהתנהגות ברירת המחדל של הדפדפן:

   1. הניווט דביק בראש העמוד, ומעליו רצועת הטיימר. גלילה רגילה
      לעוגן מביאה את הכותרת *מתחת* להם.
   2. בדרך אל היעד נטענות תמונות עצלות והפריסה גדלה — כך שעד
      שהגלילה מסתיימת, היעד כבר זז. בנייד, שבו העמוד ארוך פי
      כמה, זה מה שגרם ללחיצה על "הוראות הגעה" לנחות על קטע
      הסוכנים במקום על קטע ההגעה.

   הפתרון: מחשבים את היעד בעצמנו, גוללים, ואז בודקים שוב אחרי
   שהגלילה נרגעה — ואם היעד זז, מתקנים.
   ============================================================ */
function headerOffset() {
  var nav = document.querySelector(".nav");
  var bar = document.getElementById("cutoffBar");
  var h = nav ? nav.getBoundingClientRect().height : 0;
  // רצועת הטיימר נגללת עם העמוד, אז היא נחשבת רק כשהיא עדיין נראית
  if (bar) {
    var r = bar.getBoundingClientRect();
    if (r.bottom > h) h += r.height;
  }
  return h + 14;
}

function scrollToTarget(el, done) {
  if (!el) return;
  var y = el.getBoundingClientRect().top + window.scrollY - headerOffset();
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });

  // בדיקה חוזרת: אם הפריסה זזה תוך כדי, מתקנים בשקט
  var tries = 0;
  var settle = setInterval(function () {
    tries++;
    var want = el.getBoundingClientRect().top + window.scrollY - headerOffset();
    var drift = Math.abs(want - window.scrollY);
    if (drift > 24 && tries < 8) {
      window.scrollTo({ top: Math.max(0, want), behavior: "smooth" });
    } else if (tries >= 8 || drift <= 24) {
      clearInterval(settle);
      if (typeof done === "function") done();
    }
  }, 420);
}

function initAnchorScroll() {
  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest('a[href*="#"]') : null;
    if (!link) return;

    var href = link.getAttribute("href") || "";
    var hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;

    var hash = href.slice(hashIndex);
    if (hash === "#" || hash.length < 2) return;

    // קישור לעמוד אחר — נותנים לדפדפן לעשות את שלו
    var path = href.slice(0, hashIndex);
    if (path && path !== location.pathname.split("/").pop()) return;

    var target = document.getElementById(hash.slice(1));
    if (!target) return;

    e.preventDefault();
    history.replaceState(null, "", hash);
    scrollToTarget(target, function () {
      // נגישות: מעבירים את המיקוד ליעד, אחרת משתמשי מקלדת
      // "נשארים" בראש העמוד גם אחרי שהתצוגה זזה
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  // כניסה לעמוד עם עוגן בכתובת (למשל policy.html#accessibility)
  if (location.hash.length > 1) {
    var el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(function () { scrollToTarget(el); }, 260);
  }
}

/* ============================================================
   8. חזרה לראש העמוד
   ============================================================ */
function initToTop() {
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "to-top";
  btn.setAttribute("aria-label", "חזרה לראש העמוד");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
    var brand = document.querySelector(".brand");
    if (brand) brand.focus({ preventScroll: true });
  });
  document.body.appendChild(btn);

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle("show", window.scrollY > window.innerHeight * 1.2);
        ticking = false;
      });
    },
    { passive: true }
  );
}

/* ============================================================
   9. וידאו בהירו
   ------------------------------------------------------------
   מתנגן פעם אחת מתחת ללוגו ואז נמוג בחזרה לרקע הקבוע.
   ------------------------------------------------------------
   ⚙️ להפעלה: לשים את קובץ הווידאו ב-assets/brand/ ולכתוב את
   שמו כאן. מחרוזת ריקה = כבוי, והאתר מתנהג בדיוק כמו היום.

   הווידאו מושתק (בלי זה דפדפנים חוסמים ניגון אוטומטי),
   מתנגן פעם אחת, ולא מופעל כלל אם:
     · המשתמש ביקש תנועה מופחתת במערכת ההפעלה
     · המשתמש כיבה אנימציות בתפריט הנגישות
     · החיבור מוגדר כחסכוני בנתונים
   ============================================================ */
var HERO_VIDEO = ""; // ← לדוגמה: "assets/brand/hero-video.mp4"

function initHeroVideo() {
  if (!HERO_VIDEO) return;

  var hero = document.querySelector(".hero");
  if (!hero) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var a11yOff = document.documentElement.getAttribute("data-a11y-motion") === "off";
  var saveData = navigator.connection && navigator.connection.saveData;
  if (reduced || a11yOff || saveData) return;

  var video = document.createElement("video");
  video.className = "hero-video";
  video.src = HERO_VIDEO;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("aria-hidden", "true");
  video.preload = "auto";

  // נכנס אחרי .hero-bg, כך שהרקע הקבוע נשאר מתחתיו תמיד
  var bg = hero.querySelector(".hero-bg");
  if (bg && bg.nextSibling) hero.insertBefore(video, bg.nextSibling);
  else hero.appendChild(video);

  video.addEventListener("canplay", function () {
    var p = video.play();
    if (p && p.catch) p.catch(function () { video.remove(); });
    video.classList.add("playing");
  });

  video.addEventListener("ended", function () {
    video.classList.remove("playing");
    video.classList.add("done");
    // משחררים את הזיכרון אחרי שההנמכה הסתיימה
    setTimeout(function () { video.remove(); }, 1400);
  });

  video.addEventListener("error", function () { video.remove(); });
}

/* ============================================================
   הפעלה
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  initDailyLine();
  initReveal();
  initScrollProgress();
  initCutoffBar();
  initAnchorScroll();
  initToTop();
  initHeroVideo();
  injectSchema();
  initDeepLink();
});
