/* ============================================================
   פרחי איריס — שני סוכנים דיגיטליים (מנוע דור 2)
   ------------------------------------------------------------
   אגם   (צד שמאל) — יועצת פרחים. אנושית, חמה, נותנת דעה.
   מיכאל (צד ימין) — תמיכה טכנית ומשלוחים. מדויק, מספרי, פותר.

   מה שונה מהגרסה הקודמת:
   1. זיהוי כוונה לפי ניקוד ולא לפי "המילה הראשונה שנמצאה" —
      ככה שאלה בעברית חופשית לא נופלת לתשובה גנרית.
   2. זיכרון שיחה (אירוע · תקציב · למי · צבע) — אגם זוכרת מה
      סיפרת לה קודם ומצטברת לתשובה אחת טובה.
   3. כלל הברזל: כל תשובה מכילה *תשובה*. שאלה חוזרת מותרת
      רק אחרי שכבר נתנו משהו — אף פעם לא במקום.
   4. כרטיסי מוצר לחיצים בתוך השיחה.
   5. העברה בין הסוכנים: שאלה טכנית אצל אגם עוברת למיכאל,
      ושאלה על פרחים אצל מיכאל עוברת לאגם.
   6. "אפשר לדבר עם בן אדם?" — מעבר מיידי לוואטסאפ.

   הכול רץ בדפדפן בלבד, בלי שרת ובלי API.
   ============================================================ */

/* ------------------------------------------------------------
   הגדרות חנות — להחלפה בפרטים האמיתיים לפני עלייה לאוויר
   ------------------------------------------------------------ */
const SHOP_WHATSAPP = "972500000000"; // ← מספר דמה! להחליף במספר הוואטסאפ האמיתי (פורמט בינלאומי, בלי +)
const SHOP_PHONE = "04-0000000"; // ← להשלמה
const SHOP_EMAIL = "hello@iris-flowers.co.il"; // ← להשלמה
const SHOP_INSTAGRAM = "https://instagram.com/"; // ← להשלמה
const SHOP_ADDRESS = "רחוב איינשטיין 20, קריית אתא";
const SHOP_HOURS = "ראשון–חמישי 08:30–19:00 · שישי 08:00–14:00 · שבת סגור";

/* ============================================================
   חלק א׳ — תשתית השיחה
   ============================================================ */
const AGENTS = {
  agam: {
    panel: "chatPanel", body: "chatBody", input: "chatInput", name: "אגם",
    history: [], mode: null, lastIntent: null, turns: 0,
    slots: { occasion: null, budget: null, recipient: null, color: null },
    expecting: null, // מה שאלנו בתור הקודם, כדי לקרוא את התשובה בהקשר
    shown: [],
  },
  michael: {
    panel: "supportPanel", body: "supportBody", input: "supportInput", name: "מיכאל",
    history: [], mode: null, lastIntent: null, turns: 0, lastOrder: null,
  },
};

const usedReplies = new Set();

function pickFresh(arr, key) {
  const fresh = arr.filter((t) => !usedReplies.has(key + "|" + t));
  const pool = fresh.length ? fresh : arr;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  if (!fresh.length) arr.forEach((t) => usedReplies.delete(key + "|" + t));
  usedReplies.add(key + "|" + choice);
  return choice;
}

function agentBody(key) {
  return document.getElementById(AGENTS[key].body);
}

function agentScroll(key) {
  const b = agentBody(key);
  if (b) b.scrollTop = b.scrollHeight;
}

function agentAdd(key, text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  agentBody(key).appendChild(div);
  agentScroll(key);
}

function agentSay(key, text) {
  agentAdd(key, text, "bot");
  AGENTS[key].history.push({ role: "assistant", content: text });
  if (typeof announce === "function") announce(`${AGENTS[key].name}: ${text}`);
}

/**
 * מנקה תפריטים וכפתורי המשך ישנים לפני שמוסיפים חדשים.
 * כרטיסי המוצר (.chat-cards) נשארים בכוונה — הם חלק מהשיחה,
 * בדיוק כמו הודעה, ולא ווידג'ט שצריך להיעלם.
 */
function agentClearWidgets(key) {
  agentBody(key).querySelectorAll(".chat-menu, .chat-chips").forEach((el) => el.remove());
}

function agentMenu(key, items) {
  agentClearWidgets(key);
  const box = document.createElement("div");
  box.className = "chat-menu";
  box.innerHTML = items
    .map((i) => `<button type="button" onclick="${i.action}"><span class="ico" aria-hidden="true">${i.icon}</span> ${esc(i.label)}</button>`)
    .join("");
  agentBody(key).appendChild(box);
  agentScroll(key);
}

function agentChips(key, items) {
  agentClearWidgets(key);
  const box = document.createElement("div");
  box.className = "chat-chips";
  box.innerHTML = items.map((i) => `<button type="button" onclick="${i.action}">${esc(i.label)}</button>`).join("");
  agentBody(key).appendChild(box);
  agentScroll(key);
}

/** כרטיסי מוצר לחיצים בתוך השיחה */
function agentCards(key, products, note) {
  if (!products || !products.length) return;
  const box = document.createElement("div");
  box.className = "chat-cards";
  box.innerHTML =
    (note ? `<div class="cards-note">${esc(note)}</div>` : "") +
    products
      .map(
        (p) => `
      <div class="chat-card">
        <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" />
        <div class="cc-info">
          <b>${esc(p.name)}</b>
          <small>${esc(p.desc)}</small>
          <span class="cc-price">מ־₪${p.price}</span>
        </div>
        <div class="cc-actions">
          <button type="button" onclick="openProductModal('${p.id}')">לצפייה</button>
          <button type="button" class="alt" onclick="addToCart('${p.id}')">לסל</button>
        </div>
      </div>`
      )
      .join("");
  agentBody(key).appendChild(box);
  agentScroll(key);
}

function agentTyping(key, on) {
  if (!on) {
    document.getElementById("typing-" + key)?.remove();
    return;
  }
  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "typing-" + key;
  div.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  agentBody(key).appendChild(div);
  agentScroll(key);
}

function agentTogglePanel(key) {
  const a = AGENTS[key];
  const panel = document.getElementById(a.panel);
  if (!panel) return false;
  const open = panel.classList.toggle("open");
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) setTimeout(() => document.getElementById(a.input)?.focus(), 260);
  return open;
}

/* ============================================================
   חלק ב׳ — הבנת עברית חופשית
   ============================================================ */
const FINALS = { "ם": "מ", "ן": "נ", "ץ": "צ", "ף": "פ", "ך": "כ" };

/** מנרמל טקסט: מוריד ניקוד, סימני פיסוק, ומאחד אותיות סופיות */
function nrm(text) {
  return String(text || "")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[״׳"'`.,!?;:()\[\]{}\-–—_\/\\]/g, " ")
    .replace(/[םןץףך]/g, (c) => FINALS[c])
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * מנקד כוונה מול הודעה.
 * strong = ביטוי חד־משמעי (3 נק')   kw = מילה תומכת (1 נק')
 *
 * maxWords: כוונות כמו "שלום" או "מה קורה" נכונות רק במשפט קצר.
 * בלעדיו, "מה קורה אם אין לכם את הפרח" היה מזוהה כברכת שלום —
 * וזו בדיוק הסיבה שסוכנים כאלה נשמעים מטומטמים.
 */
function scoreIntent(text, intent) {
  if (intent.maxWords && text.split(" ").length > intent.maxWords) return 0;
  let score = 0;
  (intent.strong || []).forEach((phrase) => {
    if (text.includes(nrm(phrase))) score += 3;
  });
  (intent.kw || []).forEach((word) => {
    if (text.includes(nrm(word))) score += 1;
  });
  return score;
}

/** מחזיר את הכוונה המנצחת, או null אם אף אחת לא עברה את הסף */
function detectIntent(message, table, threshold = 2) {
  const text = nrm(message);
  let best = null;
  let bestScore = 0;
  table.forEach((intent) => {
    const s = scoreIntent(text, intent);
    if (s > bestScore) {
      bestScore = s;
      best = intent;
    }
  });
  return bestScore >= threshold ? best : null;
}

/* ---------- חילוץ "סלוטים" מתוך ההודעה ---------- */
/**
 * מילות אירוע.
 * strong = מילה שמתארת את האירוע עצמו ("ברית", "חתונה", "ניחומים").
 * soft   = מילה שמתארת את מי שמקבל ("אשתי", "חבר שלי") ולכן חלשה יותר.
 *
 * בלי ההפרדה הזו, "זר לברית של הבן של חבר שלי" היה מזוהה כזר רומנטי,
 * כי "חבר שלי" ארוך מ"ברית".
 */
const OCCASION_WORDS = {
  love: {
    strong: ["רומנטי", "אהבה", "אוהב", "דייט", "יום האהבה", "ולנטיין", "יום נישואין", "נישואין", "לפייס", "התנצלות", "רבתי"],
    soft: ["בת זוג", "בן זוג", "אשתי", "בעלי", "חברה שלי", "חבר שלי", "ריב"],
  },
  birthday: { strong: ["יום הולדת", "יומולדת", "הולדת", "חוגג", "חוגגת", "מסיבה"], soft: [] },
  thanks: { strong: ["תודה", "להודות", "מתנת תודה"], soft: ["מורה", "גננת", "מטפלת", "רופא", "אחות"] },
  congrats: { strong: ["מזל טוב", "מזלטוב", "הצלחה", "קידום", "חנוכת בית", "בית חדש", "סיום", "תואר", "גיוס", "משרד חדש"], soft: [] },
  newborn: { strong: ["לידה", "נולד", "נולדה", "תינוק", "תינוקת", "ברית", "בריתה", "יולדת"], soft: [] },
  recovery: { strong: ["החלמה", "מחלים", "מחלימה", "חולה", "חולים", "בית חולים", "ניתוח", "מאושפז", "מאושפזת", "תרגיש טוב", "רפואה שלמה"], soft: [] },
  sympathy: { strong: ["ניחומים", "לוויה", "שבעה", "פטירה", "נפטר", "נפטרה", "השתתפות בצער", "אזכרה"], soft: ["אבל"] },
  wedding: { strong: ["חתונה", "כלה", "חתן", "בר מצווה", "בת מצווה", "רכב חתן", "אולם"], soft: ["אירוע", "כנס"] },
  home: { strong: ["חנוכת בית", "לסלון", "למשרד", "לקישוט"], soft: ["לבית", "עציץ", "לעצמי", "מטבח"] },
};

/* ============================================================
   מי מקבל את הזר
   ------------------------------------------------------------
   לא מספיק לדעת ש"נאמרה מילה של נמען". צריך לדעת *מי זה*,
   כי זה משנה שלושה דברים בבת אחת:
     label  — איך אגם מדברת עליו ("אשתך", ולא "אישה")
     bond   — סוג הקשר, שקובע מה בכלל מתאים להציע
     warmth — כמה חופש יש לה בטון

   בלי זה, "לאשתי" ו"למנהל שלי" מקבלים בדיוק אותה תשובה —
   וזה בדיוק מה שגורם לסוכן להישמע כמו טופס.

   ממוין מהארוך לקצר: אחרת "חברה שלי" נקרא כ"חבר".
   ============================================================ */
const RELATIONS = [
  { w: "קולגה", label: "לקולגה שלך", bond: "work", warmth: "formal" },
  { w: "שכנה", label: "לשכנה שלך", bond: "social", warmth: "warm" },
  { w: "אשתי", label: "לאשתך", bond: "partner", gender: "f", warmth: "intimate" },
  { w: "בעלי", label: "לבעלך", bond: "partner", gender: "m", warmth: "intimate" },
  { w: "סבתא", label: "לסבתא שלך", bond: "grandparent", gender: "f", warmth: "tender" },
  { w: "חברה", label: "לחברה שלך", bond: "partner", gender: "f", warmth: "intimate" },
  { w: "מנהל", label: "למנהל שלך", bond: "work", warmth: "formal" },
  { w: "אחות", label: "לאחות שלך", bond: "sibling", gender: "f", warmth: "warm" },
  { w: "מורה", label: "למורה", bond: "work", warmth: "formal" },
  { w: "אמא", label: "לאמא שלך", bond: "parent", gender: "f", warmth: "tender" },
  { w: "אבא", label: "לאבא שלך", bond: "parent", gender: "m", warmth: "tender" },
  { w: "סבא", label: "לסבא שלך", bond: "grandparent", gender: "m", warmth: "tender" },
  { w: "אישה", label: "לאשתך", bond: "partner", gender: "f", warmth: "intimate" },
  { w: "דודה", label: "לדודה שלך", bond: "family", gender: "f", warmth: "warm" },
  { w: "חבר", label: "לחבר שלך", bond: "friend", gender: "m", warmth: "warm" },
  { w: "בעל", label: "לבעלך", bond: "partner", gender: "m", warmth: "intimate" },
  { w: "עצמי", label: "לעצמך", bond: "self", warmth: "warm" },
  { w: "בוס", label: "לבוס שלך", bond: "work", warmth: "formal" },
  { w: "דוד", label: "לדוד שלך", bond: "family", gender: "m", warmth: "warm" },
  { w: "בת", label: "לבת שלך", bond: "child", gender: "f", warmth: "tender" },
  { w: "בן", label: "לבן שלך", bond: "child", gender: "m", warmth: "tender" },
  { w: "אח", label: "לאח שלך", bond: "sibling", gender: "m", warmth: "warm" },

  /* כתיבים נפוצים ונטיות שמירה. אנשים כותבים "לאישתי" עם י'
     לפחות כמו "לאשתי" — וסוכן שלא מזהה את זה נראה מטומטם
     בדיוק ברגע הכי חשוב. */
  { w: "אישתי", label: "לאשתך", bond: "partner", gender: "f", warmth: "intimate" },
  { w: "אישתו", label: "לאשתו", bond: "partner", gender: "f", warmth: "intimate" },
  { w: "אשתו", label: "לאשתו", bond: "partner", gender: "f", warmth: "intimate" },
  { w: "בעלה", label: "לבעלה", bond: "partner", gender: "m", warmth: "intimate" },
  { w: "אחותי", label: "לאחות שלך", bond: "sibling", gender: "f", warmth: "warm" },
  { w: "סבתי", label: "לסבתא שלך", bond: "grandparent", gender: "f", warmth: "tender" },
  { w: "אמי", label: "לאמא שלך", bond: "parent", gender: "f", warmth: "tender" },
  { w: "אבי", label: "לאבא שלך", bond: "parent", gender: "m", warmth: "tender" },
  { w: "בתי", label: "לבת שלך", bond: "child", gender: "f", warmth: "tender" },
  { w: "בני", label: "לבן שלך", bond: "child", gender: "m", warmth: "tender" },
  { w: "הורים", label: "להורים שלך", bond: "parent", warmth: "tender" },
  { w: "גיסה", label: "לגיסה שלך", bond: "family", gender: "f", warmth: "warm" },
  { w: "גיס", label: "לגיס שלך", bond: "family", gender: "m", warmth: "warm" },
  { w: "כלה", label: "לכלה", bond: "family", gender: "f", warmth: "warm" },
];

const RECIPIENT_WORDS = RELATIONS.map((r) => r.w);

function relationOf(word) {
  return RELATIONS.find((r) => r.w === word) || null;
}

const COLOR_WORDS = {
  "סגול": ["סגול", "אירוס", "לילך"],
  "אדום": ["אדום", "אדומים", "ורדים אדומים"],
  "לבן": ["לבן", "לבנים", "שמנת"],
  "ורוד": ["ורוד", "ורודים", "פסטל", "אפרסק"],
  "צהוב": ["צהוב", "חמניות", "שמש"],
  "צבעוני": ["צבעוני", "מעורב", "מגוון", "שמח"],
};

/**
 * בדיקה אם מילה מופיעה בטקסט.
 *
 * מילה באורך 5 ומעלה, או ביטוי עם רווח — חיפוש מחרוזת רגיל.
 * מילה קצרה — נדרש גבול מילה, עם אות שימוש אחת אופציונלית לפניה.
 *
 * למה זה קריטי: בלי זה "שמחלימה" מכיל "שמח", ואגם מחליטה שרוצים
 * זר צבעוני לאדם שמחלים ממחלה. זו בדיוק סוג הטעות שגורמת לסוכן
 * להישמע מטומטם.
 */
function hasWord(text, word) {
  const w = nrm(word);
  if (!w) return false;
  if (w.length >= 5 || w.indexOf(" ") !== -1) return text.indexOf(w) !== -1;
  const safe = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|\\s)[והבלמשכה]?" + safe + "(\\s|$)").test(text);
}

/** מחזיר את ההתאמה הארוכה ביותר מתוך רשימת מילים, או null */
function bestMatch(text, words) {
  let best = null;
  words.forEach((w) => {
    if (hasWord(text, w) && (!best || nrm(w).length > nrm(best).length)) best = w;
  });
  return best;
}

function extractSlots(message, slots) {
  const t = nrm(message);

  // אירוע — מנוקד, לא לפי סדר הרשימה.
  // מילת אירוע מקבלת בונוס של 10 מעל מילת נמען, וביניהן מכריע האורך.
  let bestOcc = null;
  let bestOccScore = 0;
  for (const id in OCCASION_WORDS) {
    const def = OCCASION_WORDS[id];
    const strongHit = bestMatch(t, def.strong || []);
    const softHit = bestMatch(t, def.soft || []);
    const score = Math.max(
      strongHit ? nrm(strongHit).length + 10 : 0,
      softHit ? nrm(softHit).length : 0
    );
    if (score > bestOccScore) {
      bestOcc = id;
      bestOccScore = score;
    }
  }
  if (bestOcc) slots.occasion = bestOcc;

  // תקציב — מספר סביר. מתעלמים ממספרי הזמנה, משעות וממספרי טלפון.
  if (!/IRIS-?DEMO/i.test(message)) {
    const nums = t.match(/(^|\s)(\d{2,4})(\s|$)/g);
    if (nums) {
      const cand = nums.map((s) => Number(s.trim())).filter((n) => n >= 50 && n <= 3000);
      if (cand.length) slots.budget = Math.max.apply(null, cand);
    }
  }

  // למי — גם כאן ההתאמה הארוכה מנצחת ("חברה" ולא "חבר")
  const who = bestMatch(t, RECIPIENT_WORDS);
  if (who) slots.recipient = who;

  // צבע
  let bestColor = null;
  let bestColorLen = 0;
  for (const color in COLOR_WORDS) {
    const hit = bestMatch(t, COLOR_WORDS[color]);
    if (hit && nrm(hit).length > bestColorLen) {
      bestColor = color;
      bestColorLen = nrm(hit).length;
    }
  }
  if (bestColor) slots.color = bestColor;

  return slots;
}

/* ============================================================
   חלק ג׳ — מאגר הידע המשותף
   ------------------------------------------------------------
   עובדות שאסור שיהיו שונות בין שני הסוכנים.
   הכול נשאב מהקבצים עצמם, כך ששינוי מחיר משלוח בקובץ אחד
   מתעדכן אוטומטית גם בפה של אגם וגם בפה של מיכאל.
   ============================================================ */
const KB = {
  get shipping() {
    return `דמי המשלוח הם ₪${DELIVERY_FEE}, ומעל ₪${FREE_DELIVERY_OVER} המשלוח עלינו.`;
  },
  get cutoff() {
    return "הזמנה שנכנסת עד 14:00 יוצאת עוד באותו יום לקריית אתא, ועד 13:00 לקריות ולחיפה. בשישי חלון ההזמנה נסגר ב-11:00.";
  },
  get zones() {
    return `אנחנו מחלקים בקריית אתא, קריית חיים, קריית ביאליק, קריית מוצקין וקריית ים. לחיפה ולנשר מגיעים בהזמנות מעל ₪${LARGE_ORDER_MIN}.`;
  },
  get seasonal() {
    return "פרחים זה חקלאות ולא מלאי במחסן. אם פרח מסוים לא הגיע טרי בבוקר — אנחנו מחליפים אותו בפרח מקביל באותו גוון ובאותו ערך או גבוה ממנו, אף פעם לא פחות. אם השינוי מהותי, מתקשרים לפני שיוצאים.";
  },
  get sizes() {
    return "לכל זר יש שלוש מידות: קלאסי, מורחב (+25%) ושופע (+50%). בלחיצה על הזר בקטלוג רואים בדיוק כמה גבעולים יש בכל מידה, כך שאין הפתעות.";
  },
  get hours() {
    return `שעות הפתיחה: ${SHOP_HOURS}. הכתובת: ${SHOP_ADDRESS}.`;
  },
  get cancel() {
    return "אפשר לבטל או לשנות עד 3 שעות לפני מועד המשלוח, בלי עלות. אחרי שהזר כבר נשזר קשה לנו להחזיר אותו למדף, אז זה הגבול.";
  },
  get anonymous() {
    return "בהחלט. בעמוד התשלום יש מתג \"שליחה אנונימית\" — הברכה מגיעה בלי השם שלך, והשליח לא חושף מי הזמין.";
  },
  get addons() {
    return `אפשר לצרף לזר שוקולד בלגי (₪39), אגרטל זכוכית (₪59), בלון הליום (₪25) או כרטיס ברכה מודפס (₪12). הכול נבחר בעמוד התשלום.`;
  },
  get payment() {
    return "האתר כרגע במצב הדגמה — לא מתבצע חיוב אמיתי בכרטיס. ההזמנה נקלטת אצלנו ואנחנו חוזרים אליך לתיאום ותשלום.";
  },
  get freshness() {
    return "כל זר נשזר ביום המשלוח עצמו — לא מראש ולא מהמקרר. הפרחים נבחרים בבוקר, וזה מה שקובע אם הזר יחזיק שבוע או יומיים.";
  },
  get care() {
    return "הכלל הכי חשוב: חיתוך אלכסוני של הגבעול, מים נקיים והחלפה כל יומיים, והרחקה משמש ישירה, ממזגן ומפירות מבשילים. בכל עמוד מוצר יש לשונית טיפול ייעודית לזר הספציפי.";
  },
};

/* ============================================================
   חלק ד׳ — אגם: יועצת הפרחים
   ============================================================ */
const AGAM_INTENTS = [
  {
    name: "greeting",
    maxWords: 4,
    strong: ["היי", "הי", "שלום", "אהלן", "בוקר טוב", "ערב טוב", "מה נשמע", "מה קורה"],
    reply: () => [
      "היי! 🌸 אני אגם. ספר/י לי למי הזר ולאיזו הזדמנות — ואני כבר אדע לאן לכוון.",
      "אהלן, כיף שנכנסת. למי אנחנו קונים היום?",
    ],
  },
  {
    name: "human",
    strong: ["בן אדם", "אדם אמיתי", "נציג", "לדבר עם מישהו", "את רובוט", "אתה רובוט", "מי את", "בן אנוש"],
    kw: ["טלפון", "להתקשר", "בוט"],
    reply: () => [
      `כן, אני סוכנת דיגיטלית — ולכן כשצריך בן אדם אני לא מנסה להחליף אותו.\nהכי מהיר: וואטסאפ ישיר לחנות, שם עונה מישהי מהצוות. הכתובת שלנו ${SHOP_ADDRESS}, וטלפון ${SHOP_PHONE}.`,
    ],
    after: (key) =>
      agentChips(key, [
        { label: "💬 לוואטסאפ של החנות", action: "openShopWhatsApp()" },
        { label: "חזרה לתפריט", action: "agamMenu()" },
      ]),
  },
  {
    name: "price",
    strong: ["כמה עולה", "מה המחיר", "מחירים", "כמה זה", "עלות"],
    kw: ["יקר", "זול", "מחיר", "תקציב", "שקל"],
    reply: () =>
      `הטווח שלנו בגודל הקלאסי הוא ₪99–₪389. זר החתימה — האירוס הסגול — עומד על ₪189.\n${KB.sizes}\n${KB.shipping}`,
    recommend: true,
  },
  {
    name: "shipping_cost",
    strong: ["כמה עולה משלוח", "דמי משלוח", "מחיר המשלוח", "משלוח חינם", "עלות משלוח"],
    kw: ["משלוח"],
    reply: () => `${KB.shipping}\n${KB.cutoff}`,
  },
  {
    name: "delivery_time",
    strong: ["מתי מגיע", "תוך כמה זמן", "אותו יום", "היום", "דחוף", "מחר"],
    kw: ["זמן אספקה", "מתי"],
    reply: () => `${KB.cutoff}\n${KB.zones}\nרוצה לבדוק כתובת ספציפית? מיכאל, התמיכה שלנו, עושה את זה בשנייה.`,
  },
  {
    name: "sizes",
    strong: ["מה ההבדל בין הגדלים", "איזה גודל", "כמה פרחים", "כמה גבעולים", "גודל"],
    kw: ["שופע", "מורחב", "קלאסי", "גדול", "קטן"],
    reply: () =>
      `${KB.sizes}\nמניסיון: המורחב הוא הבחירה הכי נכונה למתנה — הוא נראה נדיב בלי לקפוץ במחיר. את השופע שומרים לרגעים הגדולים באמת.`,
  },
  {
    name: "care",
    strong: ["מחזיק", "איך לטפל", "טיפול בפרחים", "איזה אגרטל", "נובל", "מתייבש", "שורד", "להאריך"],
    kw: ["מים", "אגרטל", "לטפל", "כמה זמן", "כמה ימים", "פרחים"],
    reply: () => `${KB.care}\nרוב הזרים שלנו מחזיקים 7–12 יום עם טיפול נכון. חרציות וסחלבים אפילו יותר.`,
  },
  {
    name: "seasonal",
    strong: [
      "בדיוק כמו בתמונה", "אותו זר שבתמונה", "כמו בתמונה", "שבתמונה", "אין את הפרח",
      "אין לכם את הפרח", "אם אין פרח", "מחליפים פרחים", "מחליפים", "פרח אחר", "לא בעונה",
    ],
    kw: ["תמונה", "עונתי", "עונה", "החלפה", "יגיע"],
    reply: () => `${KB.seasonal}\nהתמונה באתר מראה את הסגנון והגודל — לא הבטחה על גבעול ספציפי. זה כתוב אצלנו בגלוי, כי עדיף לדעת מראש.`,
  },
  {
    name: "freshness",
    strong: ["טריים", "טרי", "מהמקרר", "מוכן מראש"],
    kw: ["טריות"],
    reply: () => KB.freshness,
  },
  {
    name: "anonymous",
    strong: [
      "אנונימי", "בלי שם", "בלי לחשוף", "שלא ידעו ממי", "שידעו ממי", "ידעו ממי",
      "בלי לגלות", "בלי להזדהות", "בעילום", "מי שלח", "בלי שידעו", "בהפתעה",
    ],
    kw: ["סוד", "הפתעה"],
    reply: () => `${KB.anonymous}\nזה אחד הדברים שהכי מבקשים מאיתנו, אז בנינו לזה מקום קבוע.`,
  },
  {
    name: "addons",
    strong: [
      "שוקולד", "בלון", "אגרטל בתוספת", "להוסיף משהו", "מתנה נוספת", "דובי",
      "ליד הפרח", "ליד הזר", "יחד עם הזר", "עם הזר", "משהו נוסף", "עוד משהו",
      "מה עוד", "להוסיף לזר", "בנוסף לזר", "מלווה",
    ],
    kw: ["תוספת", "תוספות", "כרטיס ברכה", "להוסיף"],
    reply: () =>
      `${KB.addons}\nאם אתה שואל אותי מה באמת עובד: השוקולד. הוא נפתח באותו רגע, והזר נשאר לשבוע — אז מקבלים גם משהו עכשיו וגם משהו שנשאר.\nהאגרטל שווה רק אם אתה לא בטוח שיש לה אחד בבית.`,
  },
  {
    /* קיצורי שיחה אנושיים: "נשמע טוב", "אולי", "לא יודע" —
       בלי אלה כל משפט קצר נופל לתשובת ברירת המחדל, והשיחה
       מרגישה כמו טופס ולא כמו שיחה. */
    name: "smalltalk_positive",
    maxWords: 5,
    strong: ["נשמע טוב", "נשמע מעניין", "יפה", "אהבתי", "מגניב", "בסדר", "אוקיי", "אוקי", "סבבה", "כן", "בטח"],
    reply: () => [
      "יופי. אז בוא נצמצם — תגיד לי למי ולאיזו הזדמנות, ואני מביאה שתיים־שלוש אפשרויות מדויקות.",
      "אז אנחנו בכיוון 🙂 מה שיעזור לי הכי הרבה עכשיו: למי זה הולך.",
    ],
  },
  {
    name: "smalltalk_unsure",
    maxWords: 6,
    strong: ["לא בטוח", "לא בטוחה", "אולי", "תחליטי", "תחליט את", "מה דעתך", "מה את חושבת", "מה היית עושה"],
    reply: () =>
      "אז אני אחליט ואסביר למה — ואתה תגיד לי אם קלעתי.\nהכלל שלי: זר שנראה נדיב מנצח זר שנראה מדויק. מבין המידות, המורחב הוא כמעט תמיד הבחירה הנכונה למתנה.",
    recommend: "bestsellers",
  },
  {
    name: "why_this",
    strong: ["למה דווקא", "מה מיוחד ב", "למה זה", "מה ההבדל בין", "במה זה שונה"],
    kw: ["למה", "הבדל"],
    reply: () =>
      "שאלה טובה, ואני אענה בכנות: ההבדל בין הזרים שלנו הוא בעיקר סוג הפרח וכמה זמן הוא מחזיק.\nאירוסים — הכי מיוחדים ויזואלית, מחזיקים 5–7 ימים. ורדים — קלאסיקה בטוחה, 7–10 ימים. חרציות וצבעונים — הכי עמידים, עד שבועיים.\nאם אתה שולח למקום שלא תבקר בו — לך על העמידים.",
  },
  {
    name: "when_arrives_gift",
    strong: ["רוצה שיגיע בהפתעה", "בלי שידע", "בלי שתדע", "להפתיע"],
    kw: ["הפתעה"],
    reply: () =>
      "אז שני דברים חשובים: אל תשים את השם שלך בברכה (יש מתג \"שליחה אנונימית\" בקופה), ותוודא שמישהו בבית.\nהטעות הכי נפוצה בהפתעות היא שהשליח מגיע ואין מי שיפתח — ואז ההפתעה הופכת לטלפון מביך.",
  },
  {
    name: "greeting_text",
    strong: ["מה לכתוב", "ברכה", "הקדשה", "לנסח", "מילים"],
    reply: () =>
      "בעמוד התשלום יש מסך ניסוח ברכה — בוחרים סגנון (רומנטי, יום הולדת, מרגש, מצחיק ועוד) ואני מנסחת. אפשר לערוך, ואפשר ללחוץ שוב לניסוח אחר.\nהעצה שלי: משפט אחד אישי שווה יותר מפסקה יפה וכללית.",
  },
  {
    name: "allergy",
    strong: ["אלרגיה", "אלרגי", "ריח חזק", "בלי ריח", "חתול", "כלב", "רעיל"],
    reply: () =>
      "שאלה חשובה. לחולי אלרגיה או לחדר שאסור שיהיה בו ריח — אני ממליצה על חרציות, ורדים או צבעונים, שכמעט חסרי ריח. שושנים (ליליות) וחלק מהסחלבים רעילים לחתולים, אז בבית עם חיות אני מעדיפה זר ורדים או סוקולנטים.\nכתבו לי מה המצב ואתאים בהתאם.",
  },
  {
    name: "hospital",
    strong: ["בית חולים", "מחלקה", "מאושפז", "מאושפזת"],
    reply: () =>
      "לבתי חולים אנחנו שולחים — אבל לפני שאתה מזמין, דבר אחד שחוסך אכזבה: יש מחלקות (אונקולוגיה, טיפול נמרץ, יולדות בחלק מהמקומות) שלא מכניסות פרחים חיים. שיחה של דקה למחלקה פותרת את זה.\nואם אסור — סוקולנט או מארז מתוק עוברים בכל מקום.\nבהנחה שמותר, אלה הזרים שאני שולחת לבתי חולים: קטנים יחסית, בלי ריח, ובצבע שמכניס אור לחדר:",
    recommend: "recovery",
  },
  {
    name: "pickup",
    strong: ["לאסוף", "איסוף עצמי", "לבוא לחנות", "לקחת מהחנות"],
    reply: () => `בוודאי, איסוף עצמי מהחנות ב${SHOP_ADDRESS} הוא בחינם ומקצר את ההמתנה.\n${KB.hours}`,
  },
  {
    name: "signature",
    strong: ["למה אירוס", "מה זה איריס", "למה קוראים", "הסיפור שלכם", "מי אתם", "על העסק"],
    reply: () =>
      "השם הגיע מפרח האירוס הסגול — הוא נתן לנו את השם, את הצבע ואת החתימה, ותמצאו אותו כמעט בכל זר שיוצא מכאן.\nאנחנו בוטיק קטן בקריית אתא, וכל זר נבנה ידנית לפי ההזמנה הספציפית שלכם.",
  },
  {
    name: "compliment",
    strong: ["תודה רבה", "מעולה", "אחלה", "מושלם", "אלופה", "אלוף", "יפה", "מדהים"],
    kw: ["תודה", "סבבה", "יופי"],
    reply: () => ["בשמחה! 🌸 אני כאן אם צריך עוד משהו.", "כיף לעזור. שיהיה לך יום מהמם 🌷"],
  },
  {
    name: "undecided",
    strong: ["לא יודע", "לא יודעת", "אין לי מושג", "תחליטי", "מה תמליצי", "מה הכי נמכר", "הכי פופולרי"],
    reply: () =>
      "אז בוא/י נעשה את זה פשוט. אלה שלושת הזרים שהכי הרבה אנשים חוזרים אליהם — אחד מהם כמעט תמיד מתאים:",
    recommend: "bestsellers",
  },
];

/* ---------- נושאים שהם בכלל של מיכאל ---------- */
const TO_MICHAEL = [
  {
    name: "handoff",
    strong: ["האתר לא עובד", "תקלה", "באג", "לא נטען", "העגלה נעלמה", "סטטוס הזמנה", "איפה ההזמנה", "מספר הזמנה", "לא מצליח לשלם", "שגיאה"],
    kw: ["תקוע", "נתקע", "מעקב"],
  },
];

/** בניית המלצות אמיתיות מתוך הקטלוג לפי מה שאגם יודעת */
function agamRecommend(slots, mode) {
  let list = PRODUCTS.slice();

  if (mode === "bestsellers") {
    list = list.filter((p) => (p.badges || []).includes("הכי נמכר") || p.tag === "הכי נמכר");
    if (list.length < 3) list = PRODUCTS.slice();
    list.sort((a, b) => productRating(b.id) - productRating(a.id));
    return list.slice(0, 3);
  }

  if (slots.occasion) {
    const byOccasion = list.filter((p) => occasionsOf(p.id).includes(slots.occasion));
    if (byOccasion.length) list = byOccasion;
  }

  if (slots.color) {
    const byColor = list.filter((p) =>
      (COLOR_WORDS[slots.color] || []).some((w) => nrm(p.name + " " + p.desc + " " + (p.botanical || "")).includes(nrm(w)))
    );
    if (byColor.length) list = byColor;
  }

  if (slots.budget) {
    const inBudget = list.filter((p) => p.price <= slots.budget);
    if (inBudget.length) {
      list = inBudget;
      list.sort((a, b) => b.price - a.price); // הכי יפה שאפשר בתקציב
    } else {
      // אין כלום בתקציב — מציעים את הזול ביותר בכנות
      list.sort((a, b) => a.price - b.price);
      return list.slice(0, 2);
    }
  } else {
    list.sort((a, b) => productRating(b.id) - productRating(a.id));
  }

  return list.slice(0, 3);
}

/* ============================================================
   מד הרצינות
   ------------------------------------------------------------
   grave   — מישהו מת או חולה. אין הומור. נקודה.
   tender  — רגיש אבל לא כבד (לידה, הורים, סבים)
   light   — מותר להיות חצופה
   ============================================================ */
function toneFor(slots) {
  if (slots.occasion === "sympathy") return "grave";
  if (slots.occasion === "recovery") return "grave";
  if (slots.occasion === "newborn") return "tender";
  const rel = slots.recipient ? relationOf(slots.recipient) : null;
  if (rel && (rel.warmth === "tender" || rel.warmth === "formal")) return "tender";
  return "light";
}

/* שורות ההומור. נשלפות *רק* בטון light — הרשימה הזו לא מגיעה
   לעולם ליד אבל או מחלה. */
const AGAM_WINKS = {
  partner: [
    "על הגודל הקלאסי אני לא נותנת להתפשר כאן. תסמוך עליי 😉",
    "זה לא הרגע לחסוך ₪40. ההפרש הזה נזכר.",
    "זר בלי סיבה מיוחדת עובד פי שניים מזר בתאריך צפוי. עובדה מהשטח.",
  ],
  friend: ["חבר טוב מקבל משהו שמח, לא משהו מנומס. הנה מה שאני אוהבת:"],
  work: ["למקום עבודה אני הולכת על משהו יפה ומאופק — נדיב, בלי להיות אישי מדי."],
  self: ["לעצמך? מצוין. אנשים קונים לעצמם פרחים הרבה פחות ממה שמגיע להם 🌷"],
  generic: [
    "בוא נעשה את זה כמו שצריך.",
    "יש לי שלוש אפשרויות שאני עומדת מאחוריהן.",
  ],
};

/**
 * המשפט האנושי שפותח את ההמלצה.
 * זה הלב של אגם — ההבדל בין יועצת לבין מנוע סינון.
 */
function agamRecommendLead(slots, picks) {
  const tone = toneFor(slots);
  const rel = slots.recipient ? relationOf(slots.recipient) : null;
  const occ = slots.occasion ? (OCCASIONS.find((o) => o.id === slots.occasion) || {}).label : null;

  /* ---- אבל ---- */
  if (slots.occasion === "sympathy") {
    if (rel && (rel.bond === "grandparent" || rel.bond === "parent")) {
      return `אני מצטערת. ${rel.label.replace("ל", "")} — זה לא סתם עוד זר.\nלרגעים כאלה אני לא מנסה למכור. משהו לבן, מאופק, בלי ריח חזק ובלי צבעים צועקים — שיהיה נוכח בחדר בלי לתפוס אותו:`;
    }
    return "אני משתתפת בצער.\nזה לא הזמן להמלצות מוצר, אז אני אקצר: לבן ומאופק, בלי ריח חזק, בלי צבעים. זה מה שמתאים:";
  }

  /* ---- מחלה והחלמה ---- */
  if (slots.occasion === "recovery") {
    const who = rel ? rel.label : "למי שמחלים";
    return `רפואה שלמה ${who}.\nשני דברים שחשוב לדעת: חדרי חולים לא אוהבים ריח חזק, ויש מחלקות שלא מכניסות פרחים בכלל — שווה לוודא לפני. מה שכן עובד תמיד זה צבע שמכניס אור:`;
  }

  /* ---- תקציב שלא מתאים — אומרים את זה ---- */
  if (slots.budget && picks.length && picks[0].price > slots.budget) {
    return `אני לא אמכור לך משהו שלא מתאים: בתקציב של ₪${slots.budget} האפשרויות מצומצמות.\nזה הכי יפה שיש באזור הזה — ואם אפשר למתוח קצת, אני אראה לך מה מקבלים:`;
  }

  /* ---- הכול טוב: כאן מותר אישיות ---- */
  const bits = [];
  if (occ) bits.push(`ל${occ}`);
  if (rel) bits.push(rel.label);
  if (slots.budget) bits.push(`עד ₪${slots.budget}`);
  if (slots.color) bits.push(`בגוון ${slots.color}`);

  const head = bits.length ? `${bits.join(" · ")} —` : "";

  if (tone === "light" && rel && Math.random() > 0.35) {
    const pool = AGAM_WINKS[rel.bond] || AGAM_WINKS.generic;
    return `${head} ${pickFresh(pool, "wink-" + rel.bond)}`.trim();
  }

  if (head) return `${head} הייתי הולכת על אחד מאלה:`;
  return "אלה שלושת הזרים שאני עומדת מאחוריהם כרגע:";
}

/**
 * שאלת המשך.
 * הכלל: שואלים *רק* כשהתשובה באמת משנה את ההמלצה.
 * שאלה סתמית אחרי המלצה טובה גורמת ללקוח להרגיש שלא הקשיבו לו.
 */
function agamNextQuestion(slots) {
  const tone = toneFor(slots);

  // באבל יש שאלה אחת שבאמת משנה — וזו לא שאלה על תקציב
  if (slots.occasion === "sympathy") {
    return "רק תגיד לי אם זה לבית האבלים או לאזכרה — זה שני זרים שונים לגמרי, ואני אתאים.";
  }

  if (slots.occasion === "recovery") {
    return "זה לבית או לבית חולים? בבית חולים אני מצמצמת את הגודל ונמנעת מריח לגמרי.";
  }

  if (tone === "grave") return null;

  // מסמנים למה אנחנו מצפים, כדי שהתשובה הבאה תיקרא בהקשר הנכון
  if (!slots.occasion) {
    AGENTS.agam.expecting = "occasion";
    return "לאיזו הזדמנות זה? עם זה אני כבר קולעת.";
  }
  if (slots.occasion === "birthday" && !slots.budget) {
    return "יום הולדת עגול, או אחד רגיל? זה משנה לי אם ללכת על נדיב או על מדויק.";
  }
  if (slots.occasion === "wedding") {
    return "מתי האירוע? זרי אירועים אנחנו מתאמים מראש, וזה שווה תיאום קצר בוואטסאפ.";
  }
  if (!slots.budget) {
    AGENTS.agam.expecting = "budget";
    return "יש סכום שנוח לך? אני אתאים אליו בלי להעליב אף אחד.";
  }
  if (!slots.color) return "צבע שהוא אוהב במיוחד? אם לא — אני בוחרת, וזה בדרך כלל יוצא טוב.";
  return null;
}

function agamReply(message) {
  const a = AGENTS.agam;
  a.turns++;

  // 1. האם זה בכלל תחום של מיכאל?
  if (detectIntent(message, TO_MICHAEL, 3)) {
    return {
      text:
        "זה בדיוק התחום של מיכאל, התמיכה שלנו — הוא מטפל בתקלות באתר, במעקב הזמנות ובמשלוחים, ועושה את זה טוב ממני בהרבה 🙂\nאני פותחת לך אותו כאן בצד.",
      after: (key) =>
        agentChips(key, [
          { label: "🛠️ לפתוח את מיכאל", action: "toggleSupport()" },
          { label: "חזרה לתפריט", action: "agamMenu()" },
        ]),
    };
  }

  // 2. הזכירו שם של עיר? זו שאלה עם תשובה חד־משמעית — עונים עליה,
  //    גם אם היא "של מיכאל". לקוח לא צריך לדעת מי אחראי על מה.
  const area = typeof checkDeliveryArea === "function" ? checkDeliveryArea(message) : null;
  if (area) {
    return {
      text:
        area.tier === "core"
          ? `כן, ל${area.area} אנחנו מגיעים — ${area.info}.\n${KB.shipping}`
          : `ל${area.area} אנחנו מגיעים, אבל ${area.info}.\nאם זה לא מסתדר — איסוף עצמי מהחנות הוא תמיד בחינם.`,
    };
  }

  // 3. עדכון הזיכרון מהמשפט הנוכחי
  const before = JSON.stringify(a.slots);
  extractSlots(message, a.slots);
  const slotsChanged = JSON.stringify(a.slots) !== before;

  // 4. כוונת ידע
  const intent = detectIntent(message, AGAM_INTENTS, 2);

  if (intent) {
    a.lastIntent = intent.name;
    const raw = intent.reply();
    const text = Array.isArray(raw) ? pickFresh(raw, intent.name) : raw;

    // כוונה שמתבקש לצרף אליה המלצות.
    // intent.recommend יכול להיות true, "bestsellers", או מזהה אירוע —
    // ואז הוא גם קובע את האירוע בזיכרון, כדי שההמשך יישאר עקבי.
    if (intent.recommend) {
      let mode = null;
      if (intent.recommend === "bestsellers") mode = "bestsellers";
      else if (typeof intent.recommend === "string" && OCCASIONS.some((o) => o.id === intent.recommend)) {
        a.slots.occasion = intent.recommend;
      }
      const picks = agamRecommend(a.slots, mode);
      return { text, cards: picks, after: intent.after };
    }
    return { text, after: intent.after };
  }

  // 5. אין כוונה מזוהה — אבל יש מידע חדש: ממליצים
  if (slotsChanged && (a.slots.occasion || a.slots.budget || a.slots.recipient || a.slots.color)) {
    const picks = agamRecommend(a.slots);
    const lead = agamRecommendLead(a.slots, picks);
    const q = agamNextQuestion(a.slots);
    return { text: lead, cards: picks, tail: q };
  }

  /* 6. לא הבנו.
     אבל אם *אנחנו* שאלנו שאלה בתור הקודם — אל תזרוק על הלקוח
     רשימת רבי־מכר. תחזור לשאלה, והפעם עם כפתורים.
     זה ההבדל בין שיחה לבין מנוע שמתאפס בכל תור. */
  if (a.expecting === "occasion") {
    a.expecting = null;
    return {
      text: "לא קלטתי את האירוע, אז בוא נעשה את זה קל — בחר אחד ואני לוקחת משם:",
      after: (key) =>
        agentChips(
          key,
          OCCASIONS.slice(0, 8).map((o) => ({ label: `${o.emo} ${o.label}`, action: `agamOccasion('${o.id}')` }))
        ),
    };
  }

  if (a.expecting === "budget") {
    a.expecting = null;
    return {
      text: "תן לי טווח ואני אסתדר:",
      after: (key) =>
        agentChips(key, [
          { label: "עד ₪150", action: "agamBudget(150)" },
          { label: "עד ₪250", action: "agamBudget(250)" },
          { label: "₪250 ומעלה", action: "agamBudget(400)" },
          { label: "אין תקציב מוגדר", action: "agamPick('best')" },
        ]),
    };
  }

  // באמת לא הבנו — מנחשים בגלוי, אף פעם לא משאירים ריק
  a.lastIntent = null;
  const picks = agamRecommend(a.slots, a.slots.occasion ? null : "bestsellers");
  return {
    text: pickFresh(
      [
        "לא בטוחה שקלטתי, אז אני מנחשת בקול — ואתה מתקן אותי בלי בושה 🙂",
        "בוא ננסה מזווית אחרת. אני מתחילה ממה שעובד הכי הרבה, ואתה מכוון אותי משם:",
        "פספסתי משהו. הנה נקודת פתיחה, ותגיד לי איפה אני לא קולעת:",
      ],
      "fallback"
    ),
    cards: picks,
    tail: "מספיק שתכתוב לי למי זה — \"לאמא\", \"לאשתי\", \"לבוס\" — וזה כבר משנה לי הכול.",
  };
}

function toggleChat() {
  const opened = agentTogglePanel("agam");
  if (opened && AGENTS.agam.history.length === 0) {
    // המשפט היומי פותח את השיחה — אותו משפט שבראש הדף,
    // כך שהאתר והסוכנת מדברים באותו קול באותו יום
    if (typeof dailyLine === "function") {
      agentSay("agam", `🌸 ${dailyLine()}`);
    }
    agentSay(
      "agam",
      "אני אגם, היועצת כאן.\nתגיד לי במילים שלך למי זה ובשביל מה — \"לאשתי ליום הולדת\", \"סבא שלי נפטר\", \"משהו לאמא סתם ככה\" — ואני כבר אדע לאן לקחת את זה.\nגם \"אין לי מושג מה לקנות\" זו תשובה לגיטימית לגמרי, אני עובדת איתה מצוין."
    );
    agamMenu();
  }
}

function agamMenu() {
  agentMenu("agam", [
    { icon: "🎁", label: "התאמת זר לפי אירוע", action: "agamPick('event')" },
    { icon: "💰", label: "המלצה לפי תקציב", action: "agamPick('budget')" },
    { icon: "⭐", label: "מה הכי נמכר אצלכם?", action: "agamPick('best')" },
    { icon: "🌿", label: "שאלה על טיפול בפרחים", action: "agamPick('care')" },
    { icon: "🚚", label: "משלוחים ומחירים", action: "agamPick('ship')" },
  ]);
}

function agamPick(kind) {
  agentClearWidgets("agam");
  const a = AGENTS.agam;

  if (kind === "event") {
    agentAdd("agam", "התאמת זר לפי אירוע", "user");
    agentSay("agam", "בוא/י נתחיל מהאירוע — בחר/י מהרשימה, או פשוט כתוב/י לי במילים שלך.");
    agentChips(
      "agam",
      OCCASIONS.slice(0, 8).map((o) => ({ label: `${o.emo} ${o.label}`, action: `agamOccasion('${o.id}')` }))
    );
    return;
  }

  if (kind === "budget") {
    agentAdd("agam", "המלצה לפי תקציב", "user");
    agentSay("agam", "בחר/י טווח, או פשוט כתוב/י לי סכום — למשל 150 — ואני אראה מה הכי יפה שאפשר לקבל בו.");
    agentChips("agam", [
      { label: "עד ₪150", action: "agamBudget(150)" },
      { label: "עד ₪250", action: "agamBudget(250)" },
      { label: "₪250 ומעלה", action: "agamBudget(400)" },
    ]);
    return;
  }

  if (kind === "best") {
    agentAdd("agam", "מה הכי נמכר אצלכם?", "user");
    agentSay("agam", "אלה הזרים שהכי הרבה אנשים חוזרים אליהם — ולא במקרה:");
    agentCards("agam", agamRecommend(a.slots, "bestsellers"));
    agentChips("agam", [
      { label: "חזרה לתפריט", action: "agamMenu()" },
      { label: "לקטלוג המלא", action: "location.href='catalog.html'" },
    ]);
    return;
  }

  if (kind === "ship") {
    agentAdd("agam", "משלוחים ומחירים", "user");
    agentSay("agam", `${KB.shipping}\n${KB.cutoff}\n${KB.zones}`);
    agentChips("agam", [
      { label: "בדיקת כתובת מדויקת", action: "toggleSupport()" },
      { label: "חזרה לתפריט", action: "agamMenu()" },
    ]);
    return;
  }

  agentAdd("agam", "שאלה על טיפול בפרחים", "user");
  agentSay("agam", `${KB.care}\n\nתשאל/י אותי כל דבר ספציפי — כמה זמן זר מסוים מחזיק, איזה אגרטל מתאים לו, או מה עושים אם הפרחים הגיעו סגורים.`);
  agentChips("agam", [
    { label: "חזרה לתפריט", action: "agamMenu()" },
    { label: "לקטלוג המלא", action: "location.href='catalog.html'" },
  ]);
}

function agamOccasion(id) {
  const a = AGENTS.agam;
  const occ = OCCASIONS.find((o) => o.id === id);
  agentClearWidgets("agam");
  agentAdd("agam", occ ? occ.label : id, "user");
  a.slots.occasion = id;
  const picks = agamRecommend(a.slots);
  agentSay("agam", agamRecommendLead(a.slots, picks));
  agentCards("agam", picks);
  const q = agamNextQuestion(a.slots);
  if (q) agentSay("agam", q);
  agentChips("agam", [
    { label: "חזרה לתפריט", action: "agamMenu()" },
    { label: "לקטלוג המלא", action: "location.href='catalog.html'" },
  ]);
}

function agamBudget(amount) {
  const a = AGENTS.agam;
  agentClearWidgets("agam");
  agentAdd("agam", `תקציב עד ₪${amount}`, "user");
  a.slots.budget = amount;
  const picks = agamRecommend(a.slots);
  agentSay("agam", agamRecommendLead(a.slots, picks));
  agentCards("agam", picks);
  const q = agamNextQuestion(a.slots);
  if (q) agentSay("agam", q);
  agentChips("agam", [
    { label: "חזרה לתפריט", action: "agamMenu()" },
    { label: "לקטלוג המלא", action: "location.href='catalog.html'" },
  ]);
}

function sendChat(event) {
  event.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  agentClearWidgets("agam");
  agentAdd("agam", text, "user");
  AGENTS.agam.history.push({ role: "user", content: text });
  input.value = "";
  agentTyping("agam", true);

  setTimeout(() => {
    agentTyping("agam", false);
    const res = agamReply(text);
    agentSay("agam", res.text);
    if (res.cards && res.cards.length) agentCards("agam", res.cards);
    if (res.tail) agentSay("agam", res.tail);
    if (typeof res.after === "function") res.after("agam");
    else if (!res.cards) agamMenu();
    else
      agentChips("agam", [
        { label: "חזרה לתפריט", action: "agamMenu()" },
        { label: "לקטלוג המלא", action: "location.href='catalog.html'" },
      ]);
  }, 480 + Math.random() * 480);
}

/* ============================================================
   חלק ה׳ — מיכאל: תמיכה טכנית ומשלוחים
   ============================================================ */
const ORDER_STATES = [
  { label: "התקבלה", text: (n) => `הזמנה ${n} — סטטוס: התקבלה ✅\nהיא נקלטה במערכת וממתינה לשזירה בבוקר הקרוב.\nזה השלב שבו הכי קל לשנות כתובת, שעה או ברכה — אם צריך, עכשיו זה הזמן.` },
  { label: "בשזירה", text: (n) => `הזמנה ${n} — סטטוס: בשזירה 🌿\nהפרחים נבחרו הבוקר והזר מורכב ידנית ברגעים אלה.\nשינוי כתובת עדיין אפשרי, שינוי הרכב הזר כבר לא.` },
  { label: "יצאה לשליח", text: (n) => `הזמנה ${n} — סטטוס: יצאה לשליח 🚚\nהזר בדרך ואמור להגיע בטווח השעות שנבחר.\nאם אין אף אחד בכתובת — השליח מתקשר למספר שהשארת לפני שהוא עוזב.` },
  { label: "נמסרה", text: (n) => `הזמנה ${n} — סטטוס: נמסרה ✔️\nהמסירה הושלמה.\nאם משהו לא היה תקין — יש לך 24 שעות לדווח ואנחנו מסדרים את זה, בלי ויכוחים.` },
];

/* ============================================================
   הכוונות של מיכאל
   ------------------------------------------------------------
   כלל הסגנון: תשובה = אבחון + פעולה. בלי "בשמחה", בלי
   "אשמח לעזור", בלי לרכך. מי שנכנס לתמיכה יש לו בעיה והוא
   רוצה אותה פתורה, לא שיחה.

   מבנה קבוע לתקלה:  מה קרה → מה לעשות → מה אם זה לא עזר.
   ============================================================ */
const MICHAEL_INTENTS = [
  {
    name: "human",
    strong: ["בן אדם", "נציג", "לדבר עם מישהו", "אתה רובוט", "מי אתה", "בן אנוש", "אדם אמיתי"],
    kw: ["בוט", "טלפון"],
    reply: () =>
      `אני בוט. לדברים שדורשים החלטה — בן אדם עדיף.\nוואטסאפ · ${SHOP_PHONE} · ${SHOP_EMAIL}\nמענה: ${SHOP_HOURS}`,
    chips: [{ label: "💬 לוואטסאפ עכשיו", action: "openShopWhatsApp()" }],
  },
  {
    name: "tech_load",
    strong: ["לא נטען", "לא עולה", "מסך לבן", "נתקע", "תקוע", "קורס", "נסגר לבד", "איטי", "נתקע לי"],
    kw: ["שגיאה", "באג", "לא עובד", "אייפון", "אנדרואיד", "סמסונג"],
    reply: (text) => deviceFix(detectPlatform(text), "load"),
  },
  {
    name: "tech_cart",
    strong: ["העגלה נעלמה", "הסל התרוקן", "לא נשמר", "איבדתי את העגלה", "נעלמה", "נעלם", "התרוקן", "איבדתי"],
    kw: ["עגלה", "סל", "נשמר"],
    reply: (text) => deviceFix(detectPlatform(text), "cart"),
  },
  {
    name: "tech_images",
    strong: ["תמונות לא נטענות", "לא רואה תמונות", "תמונה שבורה", "ריק"],
    kw: ["תמונה", "תמונות"],
    reply: (text) => {
      const p = detectPlatform(text);
      if (p === "android")
        return "באנדרואיד תמונות שבורות זה כמעט תמיד חיסכון בנתונים.\nכרום ← הגדרות ← חיסכון בנתונים ← כבה. בדפדפן סמסונג זה נקרא \"מצב Lite\".\nאם זה לא זה — חוסם הפרסומות המובנה של סמסונג חוסם לנו את תיקיית התמונות.\nעברת את שניהם וזה נשאר — זו תקלה אצלנו. באיזה עמוד?";
      if (p === "ios")
        return "באייפון תמונות שבורות זה בדרך כלל חוסם תוכן.\nהגדרות ← Safari ← הרחבות — כבה לרגע וטען מחדש.\nאם אין לך חוסם — משיכה למטה לרענון מלא, ואז הגדרות ← Safari ← נקה היסטוריה ונתוני אתרים.\nעברת את שניהם וזה נשאר — זו תקלה אצלנו. באיזה עמוד?";
      return "שלוש אפשרויות, לפי שכיחות:\n1. חיבור איטי — התמונה בדרך.\n2. חוסם פרסומות שחוסם את התיקייה.\n3. גרסה ישנה במטמון — Ctrl+F5.\nעברת את שלושתן וזה נשאר — זו תקלה אצלנו. באיזה עמוד?";
    },
  },
  {
    name: "payment",
    strong: ["לא מצליח לשלם", "התשלום נכשל", "חיוב", "כרטיס אשראי", "סליקה"],
    kw: ["תשלום", "לשלם", "אשראי"],
    reply: () =>
      `${KB.payment}\nפרטי אשראי לא נשלחים בוואטסאפ ולא נשמרים באתר. זו הפרת תקן PCI וסיכון ממשי ללקוח. התיאום הכספי — מול החנות ישירות.`,
  },
  {
    name: "track",
    strong: ["מעקב", "סטטוס", "איפה ההזמנה", "מספר הזמנה", "מה קורה עם ההזמנה"],
    kw: ["הזמנה", "iris"],
    reply: () => "מספר ההזמנה. מופיע במסך האישור, בפורמט IRIS-DEMO-123456. אפשר רק את הספרות.",
    mode: "track",
  },
  {
    name: "shipping_cost",
    strong: ["כמה עולה משלוח", "דמי משלוח", "מחיר משלוח", "משלוח חינם"],
    kw: ["משלוח"],
    reply: () => `${KB.shipping}\n${KB.cutoff}\n${KB.zones}`,
  },
  {
    name: "delivery_zone",
    strong: ["מגיעים", "לאן אתם", "אתם מחלקים", "מחלקים", "אזור חלוקה", "שולחים ל", "איפה אתם מחלקים"],
    kw: ["אזור", "עיר", "כתובת", "לאן", "שולחים"],
    reply: () => `${KB.zones}\nתן לי שם של עיר או שכונה ואבדוק מול הרשימה.`,
    mode: "delivery",
  },
  {
    name: "cancel",
    strong: ["לבטל", "ביטול", "לשנות הזמנה", "לשנות כתובת", "לשנות שעה"],
    kw: ["שינוי", "החלפה"],
    reply: () => `${KB.cancel}\nהדרך המהירה: וואטסאפ, מספר הזמנה, ומה לשנות. מסומן דחוף.`,
    chips: [{ label: "💬 לשלוח בקשת שינוי", action: "openShopWhatsApp()" }],
  },
  {
    name: "damaged",
    strong: ["הגיע פגום", "לא מרוצה", "הזר לא יפה", "התלונה", "תלונה", "החזר", "כסף בחזרה", "נבל מהר"],
    reply: () =>
      "זה מטופל, ובלי ויכוחים.\nנוהל: דיווח תוך 24 שעות מהמסירה, עם תמונה של הזר. משם — זר חלופי או זיכוי מלא. ההחלטה שלך, לא שלנו.\nהכי מהיר: תמונה בוואטסאפ עם מספר ההזמנה.",
    chips: [{ label: "💬 לשלוח תמונה בוואטסאפ", action: "openShopWhatsApp()" }],
  },
  {
    name: "nobody_home",
    strong: ["אין אף אחד בבית", "לא יהיו בבית", "לא ענו", "השליח לא מצא"],
    reply: () =>
      "השליח מתקשר למספר שהשארת לפני שהוא עוזב.\nאין מענה — פועל לפי ההערה לשליח: שכן, לובי, או חזרה לחנות ותיאום מחדש.\nתכתוב מראש בשדה \"הערה לשליח\" מה אתה מעדיף. חוסך את כל הסיפור.",
  },
  {
    name: "hours",
    strong: ["שעות פתיחה", "שעות הפתיחה", "מתי פתוח", "מתי פתוחים", "פתוחים", "שבת", "בשישי"],
    kw: ["שעות", "סגור", "פתיחה", "פתוח"],
    reply: () => KB.hours,
  },
  {
    name: "address",
    strong: ["איפה אתם", "כתובת החנות", "איך מגיעים", "ניווט", "waze", "וייז", "חנייה"],
    kw: ["חנות", "כתובת"],
    reply: () => `${SHOP_ADDRESS}.\nבעמוד הבית, קטע "איך מגיעים אלינו" — מפה וכפתורי Waze ו-Google Maps.\n${KB.hours}`,
    chips: [{ label: "פתיחת קטע ההגעה", action: "location.href='index.html#visit'" }],
  },
  {
    name: "invoice",
    strong: ["חשבונית", "קבלה", "מס", "עוסק", "הוצאה מוכרת"],
    reply: () =>
      "חשבונית מס נשלחת במייל אחרי השלמת התשלום מול החנות.\nעל שם חברה — שם ומספר ח.פ. בהערה להזמנה, או בוואטסאפ.",
  },
  {
    name: "privacy",
    strong: ["פרטיות", "מידע אישי", "שומרים עלי", "מוחקים", "cookies", "עוגיות"],
    reply: () =>
      "אין לנו שרת, אז אין לנו מה לשמור.\nהעגלה, הדירוג והגדרות הנגישות — בדפדפן שלך בלבד. ניקוי נתוני האתר מוחק אותם.\nפרטי ההזמנה עוברים לחנות בוואטסאפ — לאותו מקום שהיית שולח אליו הודעה ממילא.",
  },
  {
    name: "accessibility",
    strong: ["נגישות", "נגיש", "קורא מסך", "עיוור", "לקוי ראייה", "ניגודיות", "להגדיל טקסט"],
    reply: () =>
      "תפריט נגישות מלא: הכפתור הכחול בצד המסך, או Alt+Shift+A.\nהגדלת טקסט, ניגודיות גבוהה, רקע בהיר, עצירת אנימציות, הדגשת קישורים, סמן גדול, סרגל קריאה. נשמר לביקור הבא.\nההצהרה המלאה בעמוד המדיניות.",
    chips: [{ label: "פתיחת תפריט הנגישות", action: "openA11yPanel()" }],
  },
];

/* ---------- נושאים שהם בכלל של אגם ---------- */
const TO_AGAM = [
  {
    name: "handoff",
    strong: [
      "איזה זר", "רוצה זר", "מחפש זר", "מחפשת זר", "מה להביא", "מה מתאים", "מה לקנות",
      "להמליץ", "המלצה", "איזה פרחים", "יום הולדת", "רומנטי", "ניחומים", "לאמא", "מתנה",
    ],
    kw: ["זר", "פרחים", "תקציב", "שקל", "מחפש", "לקנות"],
  },
];

/* ============================================================
   זיהוי מכשיר — כדי שמיכאל ייתן הוראות שקיימות במכשיר שלך
   ------------------------------------------------------------
   "רענון עם Ctrl+F5" הוא עצה חסרת משמעות באייפון. "נקה מטמון
   בהגדרות ← Safari" הוא חסר משמעות באנדרואיד. סוכן תמיכה
   שנותן הוראה שלא קיימת אצלך נשמע כאילו נפל מהשמיים.

   מזהים גם מהודעת המשתמש עצמה ("אני באייפון") וגם מ-userAgent,
   כי המשתמש יודע טוב יותר מאיתנו על איזה מכשיר הוא מדבר.
   ============================================================ */
function detectPlatform(text) {
  const t = nrm(text || "");
  if (/אייפון|ايفون|iphone|ios|ipad|אייפד|ספארי|safari/i.test(text || "")) return "ios";
  if (/אנדרואיד|android|סמסונג|samsung|שיאומי|xiaomi|גלקסי|galaxy|כרום|chrome/i.test(text || "")) return "android";
  if (/מחשב|לפטופ|windows|mac|דפדפן במחשב/i.test(text || "")) return "desktop";
  if (t.includes("נייד") || t.includes("טלפון") || t.includes("סלולרי")) return "mobile";

  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/* הוראות פתרון לפי מכשיר — כתובות כמו שהמסכים נראים באמת */
const FIXES = {
  ios: {
    name: "אייפון",
    reload: "משיכה מלמעלה למטה בתוך הדף (לא משורת הכתובת) — זה רענון מלא.",
    cache: "הגדרות ← Safari ← נקה היסטוריה ונתוני אתרים. שים לב שזה מנתק אותך מאתרים אחרים.",
    privateTab: "בספארי: כפתור הכרטיסיות למטה ← \"פרטי\" ← פלוס.",
    known:
      "שתי תקלות מוכרות באייפון:\n· חוסם תוכן (Content Blocker) שמותקן דרך הגדרות ← Safari ← הרחבות — הוא חוסם תמונות ולפעמים את הצ'אט. כבה אותו לרגע.\n· \"מנע מעקב חוצה אתרים\" מוחק אחסון מקומי אחרי 7 ימים, ולכן העגלה מתאפסת אם לא נכנסת שבוע.",
    cart: "גלישה פרטית מוחקת את העגלה ברגע שסוגרים את הכרטיסייה, ו\"מנע מעקב חוצה אתרים\" מוחק אותה אחרי 7 ימים בלי ביקור. שניהם של ספארי, לא שלנו.",
  },
  android: {
    name: "אנדרואיד",
    reload: "משיכה מלמעלה למטה בתוך הדף, או תפריט שלוש הנקודות ← סמל הרענון.",
    cache: "כרום ← שלוש נקודות ← היסטוריה ← נקה נתוני גלישה ← \"תמונות וקבצים בקאש\".",
    privateTab: "כרום: שלוש נקודות ← \"כרטיסיית פרטיות\".",
    known:
      "שלוש תקלות מוכרות באנדרואיד:\n· מצב חיסכון בנתונים (Data Saver) דוחס תמונות ולפעמים שובר אותן. כרום ← הגדרות ← חיסכון בנתונים ← כבה.\n· \"מצב Lite\" בדפדפן סמסונג עושה אותו דבר.\n· חוסם פרסומות מובנה בדפדפן סמסונג חוסם לנו את הצ'אט. הגדרות ← אתרים והורדות ← חוסמי פרסומות.",
    cart: "העגלה שורדת סגירת כרטיסייה, אלא אם ניקית נתוני גלישה או שהמכשיר מחק אותם בלחץ זיכרון.",
  },
  desktop: {
    name: "מחשב",
    reload: "Ctrl+F5 בווינדוס, Cmd+Shift+R במאק. רענון שמתעלם מהקאש.",
    cache: "Ctrl+Shift+Delete ← \"תמונות וקבצים בקאש\".",
    privateTab: "Ctrl+Shift+N בכרום, Ctrl+Shift+P בפיירפוקס.",
    known:
      "במחשב האשם כמעט תמיד הרחבה: חוסם פרסומות, VPN או אנטי־וירוס עם \"הגנת גלישה\". בדוק בחלון פרטי — שם ההרחבות כבויות.",
    cart: "העגלה שורדת סגירת דפדפן, אלא אם ניקית היסטוריה או גלשת בחלון פרטי.",
  },
};
FIXES.mobile = FIXES.android; // ברירת מחדל סבירה כשיודעים רק "נייד"

/** בונה תשובת תקלה מותאמת למכשיר */
function deviceFix(platform, kind) {
  const f = FIXES[platform] || FIXES.desktop;
  if (kind === "cart") {
    return (
      "העגלה יושבת בדפדפן שלך, לא בשרת. מכוון — אנחנו לא שומרים עליך מידע שלא צריך.\n" +
      `ב${f.name}: ${f.cart}\n` +
      "אם היא נעלמה בלי שעשית אחד מאלה — תגיד לי איזה דפדפן, ואבדוק."
    );
  }
  return (
    `זיהיתי ${f.name}. לפי הסדר:\n` +
    `1. רענון: ${f.reload}\n` +
    `2. עדיין? ${f.privateTab} אם שם זה עובד — האשם הוא תוסף או הגדרה, לא האתר.\n` +
    `3. ניקוי קאש: ${f.cache}\n\n` +
    f.known +
    "\n\nלא עזר — תגיד לי מה בדיוק היה על המסך ואעביר הלאה עם הפרטים."
  );
}

function extractOrderNumber(text) {
  const clean = (text || "").toUpperCase().replace(/\s+/g, "");
  const full = clean.match(/IRIS-?DEMO-?(\d{4,8})/);
  if (full) return "IRIS-DEMO-" + full[1];
  const digits = clean.match(/\d{4,8}/);
  return digits ? "IRIS-DEMO-" + digits[0] : null;
}

function orderStatusFor(orderNumber) {
  const digits = orderNumber.replace(/\D/g, "");
  let sum = 0;
  for (const d of digits) sum += Number(d);
  return ORDER_STATES[sum % ORDER_STATES.length];
}

function toggleSupport() {
  const opened = agentTogglePanel("michael");
  if (opened && AGENTS.michael.history.length === 0) {
    agentSay("michael", "מיכאל, תמיכה. מה הבעיה?");
    michaelMenu();
  }
}

function michaelMenu() {
  agentMenu("michael", [
    { icon: "📦", label: "מעקב אחר הזמנה", action: "michaelPick('track')" },
    { icon: "🚚", label: "משלוחים, מחירים ואזורי חלוקה", action: "michaelPick('delivery')" },
    { icon: "🛠️", label: "תקלה טכנית באתר", action: "michaelPick('tech')" },
    { icon: "🔄", label: "ביטול, שינוי או בעיה בהזמנה", action: "michaelPick('change')" },
    { icon: "💬", label: "מעבר לוואטסאפ של החנות", action: "openShopWhatsApp()" },
  ]);
}

function michaelPick(kind) {
  const m = AGENTS.michael;
  agentClearWidgets("michael");
  m.mode = kind;

  if (kind === "track") {
    agentAdd("michael", "מעקב אחר הזמנה", "user");
    agentSay("michael", "מספר ההזמנה. הפורמט: IRIS-DEMO-123456, או רק הספרות.");
  } else if (kind === "delivery") {
    agentAdd("michael", "משלוחים ואזורי חלוקה", "user");
    agentSay("michael", `${KB.shipping}\n${KB.cutoff}\n${KB.zones}\n\nשם של עיר או שכונה — ואבדוק מול רשימת החלוקה.`);
  } else if (kind === "change") {
    agentAdd("michael", "ביטול, שינוי או בעיה בהזמנה", "user");
    agentSay("michael", `${KB.cancel}\n\nזר שכבר הגיע ומשהו לא תקין: דיווח תוך 24 שעות עם תמונה. משם — זר חלופי או זיכוי מלא, לבחירתך.`);
  } else {
    agentAdd("michael", "תקלה טכנית באתר", "user");
    const p = FIXES[detectPlatform("")] || FIXES.desktop;
    agentSay(
      "michael",
      `אני רואה שאתה על ${p.name}. תגיד לי מה ניסית לעשות ומה קרה בפועל — ואתן הוראות שמתאימות למכשיר שלך, לא הוראות כלליות.\nאם זיהיתי לא נכון, פשוט תכתוב "אני באייפון" או "אני באנדרואיד".`
    );
  }

  agentChips("michael", [
    { label: "חזרה לתפריט", action: "michaelMenu()" },
    { label: "💬 וואטסאפ", action: "openShopWhatsApp()" },
  ]);
}

function michaelReply(text) {
  const m = AGENTS.michael;
  m.turns++;

  // 1. מספר הזמנה — במצב מעקב מספיקות ספרות בודדות, ומחוץ למצב
  //    מעקב נדרש הפורמט המלא כדי ש"עד 250 שקל" לא ייחשב להזמנה.
  const looksLikeOrder = /IRIS-?DEMO/i.test(text);
  if (m.mode === "track" || looksLikeOrder) {
    const orderNumber = extractOrderNumber(text);
    if (orderNumber) {
      m.lastOrder = orderNumber;
      return {
        text:
          orderStatusFor(orderNumber).text(orderNumber) +
          "\n\n(האתר במצב הדגמה — הסטטוס כאן להמחשה. למעקב אמיתי אני מעביר לוואטסאפ של החנות עם המספר.)",
        chips: [
          { label: "💬 מעקב אמיתי בוואטסאפ", action: "openShopWhatsApp()" },
          { label: "חזרה לתפריט", action: "michaelMenu()" },
        ],
      };
    }
  }

  // 2. בדיקת אזור חלוקה — לפני כל השאר, כי שם עיר הוא תשובה חד־משמעית
  const area = typeof checkDeliveryArea === "function" ? checkDeliveryArea(text) : null;
  if (area) {
    return {
      text:
        area.tier === "core"
          ? `כן — ${area.area} נמצאת באזור החלוקה הרגיל שלנו.\n${area.info}.\n${KB.shipping}`
          : `ל${area.area} אנחנו מגיעים, אבל ${area.info}.\nמתחת לסכום הזה יש שתי אפשרויות: לצרף עוד פריט ולעבור את הסף, או איסוף עצמי מהחנות ב${SHOP_ADDRESS} — בחינם.`,
    };
  }

  // 3. האם זה בכלל תחום של אגם?
  if (detectIntent(text, TO_AGAM, 3)) {
    return {
      text: "זה לא אצלי. בחירת זרים — אגם. היא בצד השני של המסך.",
      chips: [
        { label: "🌸 לפתוח את אגם", action: "toggleChat()" },
        { label: "חזרה לתפריט", action: "michaelMenu()" },
      ],
    };
  }

  // 4. כוונה טכנית
  const intent = detectIntent(text, MICHAEL_INTENTS, 2);
  if (intent) {
    m.lastIntent = intent.name;
    if (intent.mode) m.mode = intent.mode;
    // התשובה מקבלת את ההודעה המקורית, כדי שתוכל להתאים את עצמה
    // למכשיר שהמשתמש הזכיר ("נתקע לי באייפון")
    return { text: intent.reply(text), chips: intent.chips };
  }

  // 5. לא זוהה — אומרים את זה ישר, בלי לנחש ובלי להתנצל
  return {
    text:
      "לא זיהיתי. לא אנחש.\nמה שאני מטפל בו: תקלות באתר · מעקב הזמנה · אזורי חלוקה וזמני אספקה · ביטול ושינוי · תשלום וחשבונית · נגישות ופרטיות.\nאם זה אחד מאלה — תכתוב מילה אחת ואתפוס. אם לא — וואטסאפ, שם יענה בן אדם.",
    chips: [
      { label: "💬 לוואטסאפ של החנות", action: "openShopWhatsApp()" },
      { label: "חזרה לתפריט", action: "michaelMenu()" },
    ],
  };
}

function sendSupport(event) {
  event.preventDefault();
  const input = document.getElementById("supportInput");
  const text = input.value.trim();
  if (!text) return;
  agentClearWidgets("michael");
  agentAdd("michael", text, "user");
  AGENTS.michael.history.push({ role: "user", content: text });
  input.value = "";
  agentTyping("michael", true);

  setTimeout(() => {
    agentTyping("michael", false);
    const res = michaelReply(text);
    agentSay("michael", res.text);
    agentChips(
      "michael",
      res.chips || [
        { label: "חזרה לתפריט", action: "michaelMenu()" },
        { label: "💬 וואטסאפ", action: "openShopWhatsApp()" },
      ]
    );
  }, 480 + Math.random() * 480);
}

/* ---------- וואטסאפ ---------- */
function openShopWhatsApp() {
  let text = "היי פרחי איריס! הגעתי מהאתר ואשמח לעזרה 🌸";
  const m = AGENTS.michael;
  const a = AGENTS.agam;

  if (m.lastOrder) {
    text = `היי פרחי איריס! אשמח לבדוק סטטוס להזמנה ${m.lastOrder} 🌸`;
  } else if (m.mode === "tech" || m.lastIntent === "tech_load" || m.lastIntent === "tech_cart") {
    text = "היי פרחי איריס! נתקלתי בתקלה באתר ואשמח לעזרה 🙏";
  } else if (m.lastIntent === "damaged") {
    text = "היי פרחי איריס! משהו בהזמנה שלי לא היה תקין, מצרף/ת תמונה ומספר הזמנה 🙏";
  } else if (a.slots.occasion) {
    const occ = (OCCASIONS.find((o) => o.id === a.slots.occasion) || {}).label;
    text = `היי פרחי איריס! אשמח לעזרה בבחירת זר ל${occ}${a.slots.budget ? ` בתקציב של עד ₪${a.slots.budget}` : ""} 🌸`;
  }

  window.open(`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
