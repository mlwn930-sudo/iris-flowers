/* ============================================================
   פרחי איריס — מנוע הנגישות
   ------------------------------------------------------------
   מה יש כאן:
   1. כפתור נגישות צף + חלונית הגדרות מלאה
   2. 13 מצבי תצוגה שנשמרים בדפדפן ומוחלים על כל העמודים
   3. קישור "דילוג לתוכן" למשתמשי מקלדת
   4. אזור הכרזות לקורא מסך (aria-live) — window.announce()
   5. מלכודת פוקוס לכל חלון קופץ — window.trapFocus()
   6. סרגל קריאה שעוקב אחרי העכבר

   מכוון ל-WCAG 2.1 AA ולתקן הישראלי ת"י 5568.
   הקובץ עצמאי לגמרי — אין לו תלות בשום קובץ אחר באתר.
   ============================================================ */

(function () {
  "use strict";

  var STORE_KEY = "iris_a11y_v1";
  var root = document.documentElement;

  /* ---------- הגדרות המצבים ----------
     attr  = שם התכונה על <html>
     on    = הערך כשהמצב דלוק
     group = מצבים באותה קבוצה מכבים זה את זה */
  var TOGGLES = [
    { id: "contrastHigh", attr: "data-a11y-contrast", on: "high", group: "contrast",
      emo: "◐", label: "ניגודיות גבוהה (שחור־צהוב)" },
    { id: "contrastLight", attr: "data-a11y-contrast", on: "light", group: "contrast",
      emo: "☀", label: "רקע בהיר (שחור על לבן)" },
    { id: "grayscale", attr: "data-a11y-grayscale", on: "on", emo: "▦", label: "גווני אפור" },
    { id: "invert", attr: "data-a11y-invert", on: "on", emo: "◑", label: "היפוך צבעים" },
    { id: "motion", attr: "data-a11y-motion", on: "off", emo: "⏸", label: "עצירת אנימציות וזוהר" },
    { id: "links", attr: "data-a11y-links", on: "on", emo: "🔗", label: "הדגשת קישורים" },
    { id: "fontFace", attr: "data-a11y-font-face", on: "on", emo: "🔤", label: "גופן קריא" },
    { id: "spacing", attr: "data-a11y-spacing", on: "on", emo: "↕", label: "ריווח שורות מוגדל" },
    { id: "cursor", attr: "data-a11y-cursor", on: "on", emo: "🖱", label: "סמן עכבר גדול" },
    { id: "guide", attr: "data-a11y-guide", on: "on", emo: "▬", label: "סרגל קריאה" },
    { id: "focus", attr: "data-a11y-focus", on: "on", emo: "⬚", label: "הדגשת מיקוד מוגברת" },
    { id: "highlight", attr: "data-a11y-highlight", on: "on", emo: "🖍", label: "הדגשת טקסט בריחוף" },
  ];

  var FONT_STEPS = [-1, 0, 1, 2, 3, 4];
  var FONT_LABELS = { "-1": "92%", "0": "100%", "1": "110%", "2": "120%", "3": "132%", "4": "145%" };

  var state = { font: 0 };

  /* ============================================================
     שמירה וטעינה
     ============================================================ */
  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && typeof saved === "object") state = Object.assign({ font: 0 }, saved);
    } catch (e) {
      /* מצב פרטי / אחסון חסום — ממשיכים עם ברירות המחדל */
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  /* ============================================================
     החלת המצבים על העמוד
     ============================================================ */
  function apply() {
    // גודל טקסט
    if (state.font && state.font !== 0) root.setAttribute("data-a11y-font", String(state.font));
    else root.removeAttribute("data-a11y-font");

    // שאר המצבים
    var handled = {};
    TOGGLES.forEach(function (t) {
      if (handled[t.attr]) return;
      var active = TOGGLES.filter(function (o) {
        return o.attr === t.attr && state[o.id];
      });
      if (active.length) root.setAttribute(t.attr, active[active.length - 1].on);
      else root.removeAttribute(t.attr);
      handled[t.attr] = true;
    });

    syncUI();
  }

  function setToggle(id, value) {
    var def = TOGGLES.filter(function (t) { return t.id === id; })[0];
    if (!def) return;

    // מצבים באותה קבוצה — רק אחד דלוק בכל רגע
    if (def.group && value) {
      TOGGLES.forEach(function (t) {
        if (t.group === def.group && t.id !== id) state[t.id] = false;
      });
    }
    state[id] = !!value;
    save();
    apply();
    announce((value ? "הופעל: " : "כובה: ") + def.label);
  }

  function setFont(step) {
    var i = FONT_STEPS.indexOf(state.font);
    var next = FONT_STEPS[Math.min(FONT_STEPS.length - 1, Math.max(0, i + step))];
    if (next === state.font) return;
    state.font = next;
    save();
    apply();
    announce("גודל הטקסט: " + FONT_LABELS[String(next)]);
  }

  function resetAll() {
    state = { font: 0 };
    save();
    // ניקוי ידני — ליתר ביטחון גם אם נשארה תכונה ישנה
    ["data-a11y-font", "data-a11y-contrast", "data-a11y-grayscale", "data-a11y-invert",
     "data-a11y-motion", "data-a11y-links", "data-a11y-font-face", "data-a11y-spacing",
     "data-a11y-cursor", "data-a11y-guide", "data-a11y-focus", "data-a11y-highlight"]
      .forEach(function (a) { root.removeAttribute(a); });
    syncUI();
    announce("הגדרות הנגישות אופסו");
  }

  /* ============================================================
     אזור ההכרזות לקורא מסך
     ============================================================ */
  var liveRegion = null;
  function announce(text, assertive) {
    if (!liveRegion) return;
    liveRegion.setAttribute("aria-live", assertive ? "assertive" : "polite");
    // ניקוי לפני כתיבה — אחרת קורא מסך מתעלם מטקסט זהה
    liveRegion.textContent = "";
    setTimeout(function () { liveRegion.textContent = text; }, 60);
  }
  window.announce = announce;

  /* ============================================================
     מלכודת פוקוס לחלונות קופצים
     ------------------------------------------------------------
     שימוש:  var release = trapFocus(element);   ... release();
     ============================================================ */
  var FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
    'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function trapFocus(container, onEscape) {
    if (!container) return function () {};
    var previous = document.activeElement;

    function items() {
      return Array.prototype.filter.call(container.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
    }

    function onKey(e) {
      if (e.key === "Escape") {
        if (typeof onEscape === "function") onEscape();
        return;
      }
      if (e.key !== "Tab") return;
      var list = items();
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKey);
    // מיקוד ראשוני על האיבר הראשון בחלון
    setTimeout(function () {
      var list = items();
      if (list.length) list[0].focus();
    }, 60);

    return function release() {
      container.removeEventListener("keydown", onKey);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }
  window.trapFocus = trapFocus;

  /* ============================================================
     בניית הממשק
     ============================================================ */
  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 12 2zm9 5.2-6 1.05v4.1l2.1 8.3a1.15 1.15 0 0 1-2.22.57L13.1 14.4h-2.2l-1.78 6.82a1.15 1.15 0 0 1-2.22-.57l2.1-8.3v-4.1L3 7.2a1.1 1.1 0 0 1 .38-2.17l5.5.96a18 18 0 0 0 6.24 0l5.5-.96A1.1 1.1 0 0 1 21 7.2z"/></svg>';

  var fab, panel, backdrop, releaseTrap = null;

  function build() {
    // ---- אזור הכרזות ----
    liveRegion = document.createElement("div");
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.id = "a11yLive";
    document.body.appendChild(liveRegion);

    // ---- קישור דילוג לתוכן ----
    if (!document.querySelector(".skip-link")) {
      var skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#mainContent";
      skip.textContent = "דילוג לתוכן הראשי";
      document.body.insertBefore(skip, document.body.firstChild);
    }

    // ---- סרגל קריאה ----
    var guide = document.createElement("div");
    guide.className = "a11y-guide";
    guide.id = "a11yGuide";
    guide.setAttribute("aria-hidden", "true");
    document.body.appendChild(guide);

    // ---- כפתור צף ----
    fab = document.createElement("button");
    fab.className = "a11y-fab";
    fab.id = "a11yFab";
    fab.type = "button";
    fab.setAttribute("aria-label", "פתיחת תפריט נגישות");
    fab.setAttribute("aria-expanded", "false");
    fab.innerHTML = ICON;
    fab.addEventListener("click", toggle);
    document.body.appendChild(fab);

    // ---- רקע כהה ----
    backdrop = document.createElement("div");
    backdrop.className = "a11y-backdrop";
    backdrop.id = "a11yBackdrop";
    backdrop.addEventListener("click", close);
    document.body.appendChild(backdrop);

    // ---- החלונית ----
    panel = document.createElement("div");
    panel.className = "a11y-panel";
    panel.id = "a11yPanel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "a11yTitle");

    var groups = [
      { title: "טקסט וקריאוּת", ids: ["fontFace", "spacing", "links", "highlight"] },
      { title: "צבע וניגודיות", ids: ["contrastHigh", "contrastLight", "grayscale", "invert"] },
      { title: "תנועה וניווט", ids: ["motion", "cursor", "guide", "focus"] },
    ];

    var html =
      '<div class="a11y-head">' + ICON +
      '<h2 id="a11yTitle">הגדרות נגישות</h2>' +
      '<button type="button" class="close" id="a11yClose" aria-label="סגירת תפריט הנגישות">✕</button>' +
      "</div><div class=\"a11y-body\">" +
      '<div class="a11y-group"><h3>גודל הטקסט</h3>' +
      '<div class="a11y-stepper">' +
      '<span class="lbl">הגדלת טקסט</span>' +
      '<button type="button" id="a11yFontDown" aria-label="הקטנת גודל הטקסט">−</button>' +
      '<span class="val" id="a11yFontVal" aria-live="polite">100%</span>' +
      '<button type="button" id="a11yFontUp" aria-label="הגדלת גודל הטקסט">+</button>' +
      "</div></div>";

    groups.forEach(function (g) {
      html += '<div class="a11y-group"><h3>' + g.title + "</h3>";
      g.ids.forEach(function (id) {
        var t = TOGGLES.filter(function (x) { return x.id === id; })[0];
        if (!t) return;
        html +=
          '<button type="button" class="a11y-opt" data-toggle="' + t.id + '" aria-pressed="false">' +
          '<span class="emo" aria-hidden="true">' + t.emo + "</span>" +
          '<span class="lbl">' + t.label + "</span>" +
          '<span class="state" aria-hidden="true">כבוי</span>' +
          "</button>";
      });
      html += "</div>";
    });

    html +=
      '<button type="button" class="a11y-reset" id="a11yReset">↺ איפוס כל ההגדרות</button>' +
      '<div class="a11y-foot">ההגדרות נשמרות בדפדפן שלכם ונשארות גם בביקור הבא.<br>' +
      'נתקלתם בבעיית נגישות? <a href="policy.html#accessibility">להצהרת הנגישות ולפנייה אלינו</a>.<br>' +
      "קיצור מקלדת: <b>Alt + Shift + A</b> לפתיחה וסגירה.</div></div>";

    panel.innerHTML = html;
    document.body.appendChild(panel);

    // ---- חיווט ----
    panel.querySelector("#a11yClose").addEventListener("click", close);
    panel.querySelector("#a11yReset").addEventListener("click", resetAll);
    panel.querySelector("#a11yFontUp").addEventListener("click", function () { setFont(1); });
    panel.querySelector("#a11yFontDown").addEventListener("click", function () { setFont(-1); });
    panel.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-toggle");
        setToggle(id, !state[id]);
      });
    });

    // ---- סרגל הקריאה עוקב אחרי העכבר ----
    document.addEventListener("mousemove", function (e) {
      if (root.getAttribute("data-a11y-guide") !== "on") return;
      guide.style.top = Math.max(0, e.clientY - 37) + "px";
    });

    // ---- קיצור מקלדת ----
    document.addEventListener("keydown", function (e) {
      if (e.altKey && e.shiftKey && (e.key === "A" || e.key === "a" || e.code === "KeyA")) {
        e.preventDefault();
        toggle();
      }
    });
  }

  function syncUI() {
    if (!panel) return;
    panel.querySelectorAll("[data-toggle]").forEach(function (btn) {
      var id = btn.getAttribute("data-toggle");
      var on = !!state[id];
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      var badge = btn.querySelector(".state");
      if (badge) badge.textContent = on ? "פועל" : "כבוי";
    });
    var val = panel.querySelector("#a11yFontVal");
    if (val) val.textContent = FONT_LABELS[String(state.font || 0)];
    var i = FONT_STEPS.indexOf(state.font || 0);
    panel.querySelector("#a11yFontDown").disabled = i <= 0;
    panel.querySelector("#a11yFontUp").disabled = i >= FONT_STEPS.length - 1;
  }

  function open() {
    panel.classList.add("open");
    backdrop.classList.add("open");
    fab.setAttribute("aria-expanded", "true");
    releaseTrap = trapFocus(panel, close);
  }

  function close() {
    panel.classList.remove("open");
    backdrop.classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
  }

  function toggle() {
    if (panel.classList.contains("open")) close();
    else open();
  }

  window.openA11yPanel = open;

  /* ============================================================
     הפעלה
     ============================================================ */
  load();
  // מחילים את המצבים מיד, עוד לפני שה-DOM מוכן, כדי שלא תהיה "הבהוב"
  apply();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { build(); apply(); });
  } else {
    build();
    apply();
  }
})();
