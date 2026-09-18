/* ============================================================
   פרחי איריס — שני הסוכנים
   ------------------------------------------------------------
   אגם   (שמאל) — יועצת הבוטיק. בוחרת זרים, מכירה פרחים.
   מיכאל (ימין) — תמיכה *טכנית*. האתר, העגלה, מעקב הזמנה.

   חלוקת האחריות, וזה הכלל החשוב ביותר בקובץ:

     האתר לא עובד        → מיכאל
     איפה ההזמנה שלי      → מיכאל
     איזה זר לקנות        → אגם
     ⚠️ בעיה בזר עצמו    → ישר לוואטסאפ. לא מיכאל, לא אגם.

   זר שהגיע פגום, נבל מהר, לא נראה כמו שציפו, או בקשת החזר —
   זו לא תקלה טכנית ולא שאלת ייעוץ. זה משהו שדורש בן אדם
   שרואה תמונה ומחליט. כל ניסיון לטפל בזה בצ'אט רק מעכב.

   הכול רץ בדפדפן. אין שרת, אין API.
   ============================================================ */

/* ------------------------------------------------------------
   פרטי החנות — להחלפה לפני עלייה לאוויר
   ------------------------------------------------------------ */
const SHOP_WHATSAPP = "972500000000"; // ← מספר דמה! פורמט בינלאומי, בלי +
const SHOP_PHONE = "04-0000000"; // ← להשלמה
const SHOP_EMAIL = "hello@iris-flowers.co.il"; // ← להשלמה
const SHOP_INSTAGRAM = "https://instagram.com/"; // ← להשלמה
const SHOP_ADDRESS = "רחוב איינשטיין 20, קריית אתא";
const SHOP_HOURS = "ראשון–חמישי 08:30–19:00 · שישי 08:00–14:00 · שבת סגור";

/** מי עונה בוואטסאפ — לעריכה לפי מי שבאמת שם */
const HUMAN_TEAM = "מיכל או אבנר";

/** מדרגות התקציב להרכבת זר בהתאמה אישית */
const CUSTOM_TIERS = [139, 189, 249, 349];

/* ============================================================
   חלק א׳ — תשתית השיחה
   ============================================================ */
const AGENTS = {
  agam: {
    panel: "chatPanel", body: "chatBody", input: "chatInput", name: "אגם",
    history: [], mode: null, lastIntent: null, turns: 0, expecting: null,
    // הזיכרון של השיחה. נצבר תור אחר תור ומשפיע גם על ההמלצה וגם על הטון.
    slots: { occasion: null, budget: null, recipient: null, color: null, city: null, style: null, rush: false },
  },
  michael: {
    panel: "supportPanel", body: "supportBody", input: "supportInput", name: "מיכאל",
    history: [], mode: null, lastIntent: null, turns: 0, lastOrder: null,
  },
};

const usedReplies = new Set();

/** בוחר תשובה שטרם נאמרה, כדי שהסוכן לא יחזור על עצמו */
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

/** מנקה תפריטים וכפתורים ישנים. כרטיסי מוצר נשארים — הם חלק מהשיחה. */
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

/** מנרמל טקסט: מוריד ניקוד, פיסוק, ומאחד אותיות סופיות */
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
 * בדיקה אם מילה מופיעה בטקסט.
 * מילה ארוכה — חיפוש מחרוזת. מילה קצרה — נדרש גבול מילה, עם
 * אות שימוש אחת אופציונלית לפניה.
 *
 * בלי זה "שמחלימה" מכיל את "שמח", ואגם ממליצה על זר צבעוני שמח
 * למישהו שמחלים ממחלה.
 */
function hasWord(text, word) {
  const w = nrm(word);
  if (!w) return false;
  if (w.length >= 5 || w.indexOf(" ") !== -1) return text.indexOf(w) !== -1;
  const safe = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|\\s)[והבלמשכה]?" + safe + "(\\s|$)").test(text);
}

/** ההתאמה הארוכה ביותר מתוך רשימה, או null */
function bestMatch(text, words) {
  let best = null;
  words.forEach((w) => {
    if (hasWord(text, w) && (!best || nrm(w).length > nrm(best).length)) best = w;
  });
  return best;
}

/**
 * מנקד כוונה מול הודעה.
 * strong = ביטוי חד־משמעי (3 נק')   kw = מילה תומכת (1 נק')
 * maxWords = הכוונה תקפה רק במשפט קצר. בלעדיו "מה קורה אם אין
 * לכם את הפרח" מזוהה כברכת שלום.
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

/* ============================================================
   חלק ג׳ — מי מקבל, ולאיזו הזדמנות
   ============================================================ */

/**
 * לא מספיק לדעת שנאמרה מילה של נמען. צריך לדעת מי זה, כי זה
 * משנה גם את הניסוח וגם את הטון. "לאשתי" ו"למנהל שלי" לא
 * יכולים לקבל את אותה תשובה.
 *
 * כולל כתיבים נפוצים — "אישתי" עם י' נפוץ בדיוק כמו "אשתי".
 */
const RELATIONS = [
  { w: "קולגה", label: "לקולגה שלך", bond: "work", warmth: "formal" },
  { w: "שכנה", label: "לשכנה שלך", bond: "social", warmth: "warm" },
  { w: "אשתי", label: "לאשתך", bond: "partner", warmth: "intimate" },
  { w: "אישתי", label: "לאשתך", bond: "partner", warmth: "intimate" },
  { w: "בעלי", label: "לבעלך", bond: "partner", warmth: "intimate" },
  { w: "סבתא", label: "לסבתא שלך", bond: "grandparent", warmth: "tender" },
  { w: "סבתי", label: "לסבתא שלך", bond: "grandparent", warmth: "tender" },
  { w: "חברה", label: "לחברה שלך", bond: "partner", warmth: "intimate" },
  { w: "מנהל", label: "למנהל שלך", bond: "work", warmth: "formal" },
  { w: "אחות", label: "לאחות שלך", bond: "sibling", warmth: "warm" },
  { w: "אחותי", label: "לאחות שלך", bond: "sibling", warmth: "warm" },
  { w: "מורה", label: "למורה", bond: "work", warmth: "formal" },
  { w: "אמא", label: "לאמא שלך", bond: "parent", warmth: "tender" },
  { w: "אמי", label: "לאמא שלך", bond: "parent", warmth: "tender" },
  { w: "אבא", label: "לאבא שלך", bond: "parent", warmth: "tender" },
  { w: "אבי", label: "לאבא שלך", bond: "parent", warmth: "tender" },
  { w: "סבא", label: "לסבא שלך", bond: "grandparent", warmth: "tender" },
  { w: "אישה", label: "לאשתך", bond: "partner", warmth: "intimate" },
  { w: "דודה", label: "לדודה שלך", bond: "family", warmth: "warm" },
  { w: "חבר", label: "לחבר שלך", bond: "friend", warmth: "warm" },
  { w: "בעל", label: "לבעלך", bond: "partner", warmth: "intimate" },
  { w: "הורים", label: "להורים שלך", bond: "parent", warmth: "tender" },
  { w: "עצמי", label: "לעצמך", bond: "self", warmth: "warm" },
  { w: "בוס", label: "לבוס שלך", bond: "work", warmth: "formal" },
  { w: "דוד", label: "לדוד שלך", bond: "family", warmth: "warm" },
  { w: "כלה", label: "לכלה", bond: "family", warmth: "warm" },
  { w: "בת", label: "לבת שלך", bond: "child", warmth: "tender" },
  { w: "בתי", label: "לבת שלך", bond: "child", warmth: "tender" },
  { w: "בן", label: "לבן שלך", bond: "child", warmth: "tender" },
  { w: "בני", label: "לבן שלך", bond: "child", warmth: "tender" },
  { w: "אח", label: "לאח שלך", bond: "sibling", warmth: "warm" },
];

const RECIPIENT_WORDS = RELATIONS.map((r) => r.w);

function relationOf(word) {
  return RELATIONS.find((r) => r.w === word) || null;
}

/**
 * מילות אירוע.
 * strong = מילה שמתארת את האירוע ("ברית", "חתונה")
 * soft   = מילה שמתארת את מי שמקבל ("אשתי", "חבר שלי")
 *
 * בלי ההפרדה, "זר לברית של הבן של חבר שלי" מזוהה כזר רומנטי,
 * כי "חבר שלי" ארוך מ"ברית".
 */
const OCCASION_WORDS = {
  love: {
    strong: ["רומנטי", "אהבה", "אוהב", "דייט", "יום האהבה", "ולנטיין", "יום נישואין", "נישואין", "לפייס", "התנצלות", "רבתי", "הצעת נישואין"],
    soft: ["בת זוג", "בן זוג", "אשתי", "אישתי", "בעלי", "חברה שלי", "חבר שלי", "ריב"],
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

const COLOR_WORDS = {
  "סגול": ["סגול", "אירוס", "לילך"],
  "אדום": ["אדום", "אדומים", "ורדים אדומים"],
  "לבן": ["לבן", "לבנים", "שמנת"],
  "ורוד": ["ורוד", "ורודים", "פסטל", "אפרסק"],
  "צהוב": ["צהוב", "חמניות", "שמש"],
  "צבעוני": ["צבעוני", "מעורב", "מגוון"],
};

function extractSlots(message, slots) {
  const t = nrm(message);

  // אירוע — מנוקד. מילת אירוע מקבלת בונוס 10 מעל מילת נמען,
  // וביניהן מכריע האורך.
  let bestOcc = null;
  let bestOccScore = 0;
  for (const id in OCCASION_WORDS) {
    const def = OCCASION_WORDS[id];
    const strongHit = bestMatch(t, def.strong || []);
    const softHit = bestMatch(t, def.soft || []);
    const score = Math.max(strongHit ? nrm(strongHit).length + 10 : 0, softHit ? nrm(softHit).length : 0);
    if (score > bestOccScore) {
      bestOcc = id;
      bestOccScore = score;
    }
  }
  if (bestOcc) slots.occasion = bestOcc;

  // תקציב — מספר סביר. לא מספרי הזמנה ולא שעות.
  if (!/IRIS-?DEMO/i.test(message)) {
    const nums = t.match(/(^|\s)(\d{2,4})(\s|$)/g);
    if (nums) {
      const cand = nums.map((s) => Number(s.trim())).filter((n) => n >= 50 && n <= 3000);
      if (cand.length) slots.budget = Math.max.apply(null, cand);
    }
  }

  const who = bestMatch(t, RECIPIENT_WORDS);
  if (who) slots.recipient = who;

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

  if (/דחוף|לעכשיו|בהול|מהר|היום|עוד שעה|תכף/.test(message)) slots.rush = true;
  if (/קלאסי|יוקרתי|אלגנטי/.test(message)) slots.style = "classic";
  if (/כפרי|צבעוני|שופע|פרוע|עליז/.test(message)) slots.style = "wild";

  return slots;
}

/* ============================================================
   חלק ד׳ — מאגר ידע משותף
   ------------------------------------------------------------
   כל מספר נשאב מ-products.js. שני הסוכנים קוראים מכאן, ולכן
   הם לא יכולים לסתור זה את זה או להמציא מחיר שלא קיים.
   ============================================================ */
const KB = {
  get shipping() {
    return `דמי המשלוח הם ₪${DELIVERY_FEE}, ומעל ₪${FREE_DELIVERY_OVER} המשלוח עלינו.`;
  },
  get cutoff() {
    return "הזמנה עד 14:00 יוצאת עוד היום לקריית אתא, ועד 13:00 לשאר הקריות. בשישי עד 11:00.";
  },
  get zones() {
    return typeof deliveryCitiesText === "function"
      ? deliveryCitiesText()
      : `מחלקים בקריות. לחיפה ולנשר בהזמנות מעל ₪${LARGE_ORDER_MIN}.`;
  },
  get cancel() {
    return "אפשר לבטל או לשנות עד 3 שעות לפני מועד המשלוח, בלי עלות.";
  },
  get payment() {
    return "האתר במצב הדגמה — לא מתבצע חיוב אמיתי. ההזמנה נקלטת ואנחנו חוזרים אליך לתיאום.";
  },
  get hours() {
    return `${SHOP_HOURS}. הכתובת: ${SHOP_ADDRESS}.`;
  },
};

/* ============================================================
   חלק ה׳ — בעיה בזר: ישר לוואטסאפ
   ------------------------------------------------------------
   זה לא תחום של מיכאל וזה לא תחום של אגם. זר שהגיע פגום או
   לקוח שלא מרוצה — צריך בן אדם שרואה תמונה ומחליט. שניהם
   מזהים את זה ומעבירים מיד, בלי טריאז' ובלי שאלות.
   ============================================================ */
const BOUQUET_ISSUE = [
  {
    name: "issue",
    strong: [
      "הגיע פגום", "הזר פגום", "פרחים נבלו", "נבל מהר", "נבלו", "הגיע קמל", "קמל",
      "לא מרוצה", "לא מרוצת", "הזר לא יפה", "לא כמו שהזמנתי", "הזמנתי משהו אחר",
      "הזר לא הגיע", "לא הגיע הזר", "הגיע שבור", "שבור", "מעוך", "חסר",
      "החזר כספי", "כסף בחזרה", "רוצה החזר", "לבטל אחרי", "תלונה", "להתלונן",
      "לא בסדר", "אכזבה", "מאוכזב", "מאוכזבת", "הזר התקלקל",
    ],
    kw: ["פגום", "תלונה", "החזר", "נבל"],
  },
];

/** הודעה מוכנה לוואטסאפ עבור בעיה בזר */
function whatsappIssueText() {
  const order = AGENTS.michael.lastOrder ? ` (הזמנה ${AGENTS.michael.lastOrder})` : "";
  return `היי פרחי איריס! יש לי בעיה עם הזר שקיבלתי${order}. מצרף/ת תמונה ופרטים 🙏`;
}

/** פותח את הוואטסאפ של החנות עם הודעה על בעיה בזר */
function openWhatsAppIssue() {
  window.open(`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(whatsappIssueText())}`, "_blank", "noopener");
}

/**
 * התשובה האחידה לבעיה בזר. זהה בשני הסוכנים בכוונה —
 * הלקוח לא צריך לגלות שהוא פנה ל"אדם הלא נכון".
 */
function bouquetIssueReply(who) {
  const sorry = who === "agam" ? "אני ממש מצטערת לשמוע" : "מצטער לשמוע";
  const backTo = who === "agam" ? "agamMenu()" : "michaelMenu()";
  return {
    text:
      `${sorry}, וזה מטופל — אבל לא כאן.\n` +
      `בעיה בזר עוברת ישירות ל${HUMAN_TEAM} בוואטסאפ, כי צריך לראות תמונה.\n` +
      `דיווח תוך 24 שעות מהמסירה, ומשם זר חלופי או זיכוי מלא — לבחירתך.`,
    chips: [
      { label: "💬 לשלוח עכשיו בוואטסאפ", action: "openWhatsAppIssue()" },
      { label: "חזרה לתפריט", action: backTo },
    ],
  };
}

/* ============================================================
   חלק ו׳ — אגם
   ------------------------------------------------------------
   כללי הדיבור, לפי סדר חשיבות:
     1. 2–4 שורות. לא יותר.
     2. שאלה אחת בכל תור.
     3. מילות קישור אנושיות — "לגמרי", "בטח", "האמת ש", "תקשיב".
     4. הטון לפי המצב: אבל רך · חגיגה נלהבת · לחץ זמן ענייני.
     5. לא מתווכחת, לא דוחפת, לא ממציאה מחיר.
   ============================================================ */

function toneFor(slots) {
  if (slots.rush) return "rush";
  if (slots.occasion === "sympathy" || slots.occasion === "recovery") return "grave";
  if (["birthday", "congrats", "newborn", "wedding", "love"].indexOf(slots.occasion) !== -1) return "celebrate";
  const rel = slots.recipient ? relationOf(slots.recipient) : null;
  if (rel && rel.warmth === "formal") return "neutral";
  return "warm";
}

const OPENERS = {
  celebrate: ["איזה כיף!", "וואו, איזה יופי.", "אוהבת את זה."],
  warm: ["לגמרי.", "בטח.", "האמת שזו בחירה טובה.", "אין בעיה."],
  neutral: ["בסדר גמור.", "ברור."],
  rush: ["תקשיב, אפשר לסדר את זה.", "בוא נזוז מהר."],
  grave: [""],
};

function opener(tone, slots) {
  // לאירוע שמברכים עליו — ברכה אמיתית, לא פתיח כללי
  if (slots) {
    if (slots.occasion === "birthday") return "מזל טוב! איזה כיף.";
    if (slots.occasion === "congrats") return "מזל טוב!";
    if (slots.occasion === "newborn") return "מזל טוב! 👶";
    if (slots.occasion === "wedding") return "מזל טוב! איזה אירוע.";
  }
  const pool = OPENERS[tone] || OPENERS.warm;
  return pool.length === 1 ? pool[0] : pickFresh(pool, "opener-" + tone);
}

/** ידע בוטני וידע חנות */
const AGAM_KNOWS = {
  get sizes() {
    return "קלאסי זה הזר כמו שאנחנו מרכיבים אותו. מורחב זה שכבה נוספת, פלוס 25%. שופע זה הגרסה המלאה, פלוס 50%.";
  },
  get roses() {
    return "ורדים מחזיקים 7–10 ימים והם הבחירה הבטוחה. אדום רומנטי, לבן אלגנטי, פסטל רך.";
  },
  get iris() {
    return "האירוס הוא החתימה שלנו. מגיע כניצן חצי פתוח וממשיך להיפתח אצלך יומיים־שלושה — ואז הוא הכי יפה.";
  },
  get water() {
    return "חיתוך אלכסוני, מים נקיים כל יומיים, הרחק משמש ישירה וממזגן. זה כל הסוד.";
  },
};

const AGAM_INTENTS = [
  {
    name: "greeting",
    maxWords: 4,
    strong: ["היי", "הי", "שלום", "אהלן", "בוקר טוב", "ערב טוב", "מה נשמע", "מה קורה"],
    reply: () => [
      "היי, כיף שקפצת! 🌸\nמחפש משהו מיוחד להיום, או סתם בא לך לפנק מישהו?",
      "אהלן! אני אגם.\nספר לי למי אנחנו קונים ואני כבר אדע לכוון.",
    ],
  },
  {
    name: "identity",
    strong: ["את בוט", "את רובוט", "בינה מלאכותית", "את אמיתית", "מי את", "את בן אדם", "את אדם"],
    kw: ["בוט", "רובוט"],
    reply: () => [
      "אני אגם, היועצת של הבוטיק! 😉\nמכינה לך את הזר הכי יפה שיש. למי אנחנו קונים?",
      "אגם, מהבוטיק 🌸\nבוא נתמקד במה שחשוב — למי הזר?",
    ],
  },
  {
    name: "human",
    strong: ["לדבר עם מישהו", "נציג", "מענה אנושי", "טלפון", "להתקשר", "אדם אמיתי"],
    reply: () => `בטח, אין בעיה.\n${HUMAN_TEAM} עונים בוואטסאפ ויסגרו איתך בשנייה.`,
    after: (key) =>
      agentChips(key, [
        { label: "💬 לוואטסאפ", action: "openShopWhatsApp()" },
        { label: "נשארים כאן", action: "agamMenu()" },
      ]),
  },
  {
    name: "price",
    strong: ["כמה עולה", "מה המחיר", "מחירים", "כמה זה", "עלות"],
    kw: ["יקר", "זול", "מחיר", "תקציב", "שקל"],
    reply: () => `הטווח שלנו ₪99–₪389, וזר החתימה עומד על ₪189.\nיש סכום שנוח לך?`,
  },
  {
    name: "shipping_cost",
    strong: ["כמה עולה משלוח", "דמי משלוח", "מחיר המשלוח", "משלוח חינם", "עלות משלוח"],
    kw: ["משלוח"],
    reply: () => `${KB.shipping}\nאיסוף עצמי מהחנות בחינם, אם נוח לך.`,
  },
  {
    name: "delivery_time",
    strong: ["מתי מגיע", "תוך כמה זמן", "אותו יום", "דחוף", "לעכשיו", "בהול", "מהר"],
    kw: ["זמן אספקה", "מתי", "היום"],
    reply: () => `${KB.cutoff}\nלאיזו עיר צריך להגיע?`,
  },
  {
    name: "sizes",
    strong: ["מה ההבדל בין הגדלים", "איזה גודל", "כמה פרחים", "כמה גבעולים", "גודל"],
    kw: ["שופע", "מורחב", "קלאסי", "גדול", "קטן"],
    reply: () => `${AGAM_KNOWS.sizes}\nהאמת? למתנה המורחב הוא כמעט תמיד הבחירה הנכונה.`,
  },
  {
    name: "care",
    strong: ["מחזיק", "איך לטפל", "טיפול בפרחים", "איזה אגרטל", "מתייבש", "שורד", "להאריך"],
    kw: ["מים", "אגרטל", "לטפל", "כמה זמן", "כמה ימים"],
    reply: () => `${AGAM_KNOWS.water}\nרוב הזרים שלנו מחזיקים ככה 7–12 יום.`,
  },
  {
    name: "roses",
    strong: ["ורדים", "ורד אדום", "ורדים אדומים", "ורדים לבנים"],
    reply: () => `${AGAM_KNOWS.roses}\nלאיזה גוון את/ה נמשך?`,
  },
  {
    name: "iris_info",
    strong: ["אירוס", "אירוסים", "למה איריס", "השם שלכם", "הסיפור שלכם", "מי אתם"],
    reply: () => `${AGAM_KNOWS.iris}\nרוצה לראות אותו?`,
    recommend: "signature",
  },
  {
    name: "seasonal",
    strong: ["כמו בתמונה", "שבתמונה", "אין את הפרח", "אין לכם את הפרח", "מחליפים", "פרח אחר", "לא בעונה"],
    kw: ["תמונה", "עונתי", "עונה", "החלפה"],
    reply: () =>
      "האמת שכן, זה קורה — פרחים זה חקלאות.\nאם פרח לא הגיע טרי, מחליפים בפרח מקביל באותו גוון ובאותו ערך או גבוה. בשינוי משמעותי מתקשרים לפני.",
  },
  {
    name: "anonymous",
    strong: ["אנונימי", "בלי שם", "בלי לחשוף", "שידעו ממי", "ידעו ממי", "בלי לגלות", "מי שלח", "בהפתעה", "להפתיע"],
    kw: ["סוד", "הפתעה"],
    reply: () =>
      "בטח. בקופה יש מתג \"שליחה אנונימית\" — הברכה מגיעה בלי השם שלך.\nרק תוודא שיש מי שיפתח את הדלת, זו הטעות הכי נפוצה בהפתעות 🙂",
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
      "שאלה מעולה. אפשר שוקולד פרימיום (₪39), אגרטל תואם (₪59) או כרטיס ברכה מודפס (₪12).\nהאמת? השוקולד הכי עובד — נפתח באותו רגע, והזר נשאר לשבוע.",
  },
  {
    name: "greeting_text",
    strong: ["מה לכתוב", "ברכה", "הקדשה", "לנסח", "מילים"],
    reply: () =>
      "בקופה יש מסך ניסוח — בוחרים סגנון ואני מנסחת, ואפשר לערוך.\nהעצה שלי: משפט אחד אישי שווה יותר מפסקה יפה וכללית.",
  },
  {
    name: "allergy",
    strong: ["אלרגיה", "אלרגי", "ריח חזק", "בלי ריח", "חתול", "כלב", "רעיל"],
    reply: () =>
      "תקשיב, טוב ששאלת.\nלבלי ריח — חרציות, ורדים או צבעונים. בבית עם חתול להימנע משושנים, הן רעילות להם.\nמה המצב אצלכם?",
  },
  {
    name: "hospital",
    strong: ["בית חולים", "מחלקה", "מאושפז", "מאושפזת"],
    reply: () =>
      "שולחים, בשמחה. רק שים לב — יש מחלקות שלא מכניסות פרחים חיים.\nשיחה קצרה למחלקה חוסכת אכזבה.",
    recommend: "recovery",
  },
  {
    name: "pickup",
    strong: ["לאסוף", "איסוף עצמי", "לבוא לחנות", "לקחת מהחנות"],
    reply: () => `לגמרי, ואיסוף עצמי בחינם.\n${SHOP_ADDRESS}, ${SHOP_HOURS}.`,
  },
  {
    name: "custom",
    strong: ["להרכיב", "זר מותאם", "בהתאמה אישית", "לבנות זר", "זר משלי", "לפי מה שאני רוצה"],
    kw: ["מותאם", "אישי"],
    reply: () =>
      `לגמרי אפשר. מרכיבים לפי תקציב — ${CUSTOM_TIERS.map((t) => "₪" + t).join(" · ")} ומעלה.\nאיזה סכום מתאים לך?`,
  },
  {
    name: "compliment",
    strong: ["תודה רבה", "מעולה", "אחלה", "מושלם", "אלופה", "יפה", "מדהים", "אהבתי"],
    kw: ["תודה", "סבבה", "יופי"],
    reply: () => ["בשמחה! 🌸", "כיף לעזור. שיהיה לך יום מהמם 🌷"],
  },
  {
    name: "smalltalk_positive",
    maxWords: 5,
    strong: ["נשמע טוב", "נשמע מעניין", "מגניב", "בסדר", "אוקיי", "אוקי", "סבבה", "כן", "בטח"],
    reply: () => ["יופי 🙂 אז למי זה הולך?", "אז אנחנו בכיוון. למי אנחנו קונים?"],
  },
  {
    name: "smalltalk_unsure",
    maxWords: 6,
    strong: ["לא בטוח", "לא בטוחה", "אולי", "תחליטי", "תחליט את", "מה דעתך", "מה את חושבת", "אין לי מושג", "לא יודע", "לא יודעת"],
    reply: () => "אל תדאג, בשביל זה אני פה.\nתגיד לי רק למי זה — ואני לוקחת מכאן.",
  },
  {
    name: "style_classic",
    strong: ["קלאסי", "יוקרתי", "אלגנטי", "מכובד"],
    reply: () => "בחירה בטוחה. קלאסי אצלנו זה ורדים או אירוסים, קו נקי:",
    recommend: "classic",
  },
  {
    name: "style_wild",
    strong: ["כפרי", "צבעוני", "שופע", "פרוע", "שדה", "עליז"],
    reply: () => "אוהבת את הכיוון הזה. צבעוני ושופע, בדיוק:",
    recommend: "wild",
  },
];

/** נושאים שהם של מיכאל — תקלות באתר ומעקב הזמנה בלבד */
const TO_MICHAEL = [
  {
    name: "handoff",
    strong: ["האתר לא עובד", "תקלה באתר", "באג", "לא נטען", "העגלה נעלמה", "סטטוס הזמנה", "איפה ההזמנה", "מספר הזמנה", "לא מצליח לשלם", "שגיאה"],
    kw: ["תקוע", "נתקע", "מעקב"],
  },
];

/** בקשות חריגות שדורשות אדם — אירוע גדול, חשבונית, מנהל */
const TO_HUMAN = [
  {
    name: "escalate",
    strong: ["רוצה לדבר עם מנהל", "אירוע גדול", "חתונה שלמה", "כמות גדולה", "חשבונית", "מאה זרים", "הזמנה לעסק"],
  },
];

/* ---------- ההמלצות ---------- */
function agamRecommend(slots, mode) {
  let list = PRODUCTS.slice();

  if (mode === "bestsellers") {
    list = list.filter((p) => (p.badges || []).includes("הכי נמכר") || p.tag === "הכי נמכר");
    if (list.length < 3) list = PRODUCTS.slice();
    list.sort((a, b) => productRating(b.id) - productRating(a.id));
    return list.slice(0, 3);
  }
  if (mode === "signature") return PRODUCTS.filter((p) => p.category === "signature").slice(0, 2);
  if (mode === "classic") return PRODUCTS.filter((p) => ["signature", "roses"].indexOf(p.category) !== -1).slice(0, 3);
  if (mode === "wild") return PRODUCTS.filter((p) => ["seasonal", "gifts"].indexOf(p.category) !== -1).slice(0, 3);
  if (mode && OCCASIONS.some((o) => o.id === mode)) {
    const byMode = list.filter((p) => occasionsOf(p.id).includes(mode));
    if (byMode.length) return byMode.slice(0, 3);
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
      list.sort((a, b) => a.price - b.price);
      return list.slice(0, 2);
    }
  } else {
    list.sort((a, b) => productRating(b.id) - productRating(a.id));
  }
  return list.slice(0, 3);
}

/** המשפט שמלווה את ההמלצה. בלי שאלה — היא מגיעה בנפרד. */
function agamRecommendLead(slots, picks) {
  const tone = toneFor(slots);
  const rel = slots.recipient ? relationOf(slots.recipient) : null;

  if (slots.occasion === "sympathy") {
    return rel && (rel.bond === "grandparent" || rel.bond === "parent")
      ? "אני מצטערת לשמוע.\nלרגעים כאלה אני הולכת על לבן ומאופק, בלי ריח חזק:"
      : "אני משתתפת בצער.\nמשהו שקט ולבן, שיהיה נוכח בחדר בלי לתפוס אותו:";
  }
  if (slots.occasion === "recovery") {
    return "רפואה שלמה.\nצבע שמכניס אור לחדר, וכמעט בלי ריח:";
  }
  if (slots.budget && picks.length && picks[0].price > slots.budget) {
    return `תקשיב, בתקציב הזה האפשרויות מצומצמות — ולא אמכור לך משהו שלא מתאים.\nזה הכי יפה שיש באזור:`;
  }

  const bits = [];
  if (rel) bits.push(rel.label);
  if (slots.budget) bits.push(`עד ₪${slots.budget}`);
  const head = opener(tone, slots);
  const target = bits.length ? ` ${bits.join(", ")}` : "";

  return tone === "rush" ? `${head}${target} — אלה יוצאים הכי מהר:` : `${head}${target} הייתי הולכת על אחד מאלה:`;
}

/** שאלה אחת. לא שתיים. */
function agamNextQuestion(slots) {
  const a = AGENTS.agam;
  a.expecting = null;

  if (slots.occasion === "sympathy") return "זה לבית האבלים או לאזכרה? זה שני זרים שונים.";
  if (slots.occasion === "recovery") return "זה לבית או לבית חולים?";
  if (toneFor(slots) === "grave") return null;

  if (slots.rush && !slots.city) {
    a.expecting = "city";
    return "לאיזו עיר? אני בודקת אם נספיק היום.";
  }
  if (!slots.occasion) {
    a.expecting = "occasion";
    return "לאיזו הזדמנות זה?";
  }
  if (!slots.style) {
    a.expecting = "style";
    return "היא יותר קלאסי ויוקרתי, או כפרי וצבעוני?";
  }
  if (!slots.budget) {
    a.expecting = "budget";
    return "יש סכום שנוח לך?";
  }
  return null;
}

function agamReply(message) {
  const a = AGENTS.agam;
  a.turns++;

  /* 1. בעיה בזר — ישר לוואטסאפ, לפני כל בדיקה אחרת */
  if (detectIntent(message, BOUQUET_ISSUE, 3)) {
    const r = bouquetIssueReply("agam");
    return { text: r.text, after: (key) => agentChips(key, r.chips) };
  }

  /* 2. בקשה חריגה שדורשת אדם */
  if (detectIntent(message, TO_HUMAN, 3)) {
    return {
      text: `זה משהו ש${HUMAN_TEAM} יטפלו בו הכי טוב.\nהם בוואטסאפ ויחזרו אליך מהר.`,
      after: (key) =>
        agentChips(key, [
          { label: "💬 לוואטסאפ", action: "openShopWhatsApp()" },
          { label: "חזרה לתפריט", action: "agamMenu()" },
        ]),
    };
  }

  /* 3. תקלה טכנית — התחום של מיכאל */
  if (detectIntent(message, TO_MICHAEL, 3)) {
    return {
      text: "זה התחום של מיכאל, התמיכה שלנו.\nאני פותחת לך אותו בצד.",
      after: (key) =>
        agentChips(key, [
          { label: "🛠️ לפתוח את מיכאל", action: "toggleSupport()" },
          { label: "חזרה לתפריט", action: "agamMenu()" },
        ]),
    };
  }

  /* 4. שם עיר — תשובה חד־משמעית, עונים מיד */
  const area = typeof checkDeliveryArea === "function" ? checkDeliveryArea(message) : null;
  if (area) {
    a.slots.city = area.area;
    a.expecting = null;
    return {
      text:
        area.tier === "core"
          ? `לגמרי, ${area.area} זה ממש האזור שלנו.\n${area.info}.\nבאיזה גודל זר חשבת?`
          : `ל${area.area} אנחנו מגיעים, אבל ${area.info}.\nאם זה לא מסתדר — איסוף עצמי מהחנות תמיד בחינם.`,
    };
  }

  /* 5. עדכון הזיכרון */
  const before = JSON.stringify(a.slots);
  extractSlots(message, a.slots);
  const slotsChanged = JSON.stringify(a.slots) !== before;

  /* 6. כוונת ידע */
  const intent = detectIntent(message, AGAM_INTENTS, 2);
  if (intent) {
    a.lastIntent = intent.name;
    a.expecting = null;
    const raw = intent.reply();
    const text = Array.isArray(raw) ? pickFresh(raw, intent.name) : raw;

    if (intent.recommend) {
      let mode = null;
      if (["bestsellers", "signature", "classic", "wild"].indexOf(intent.recommend) !== -1) mode = intent.recommend;
      else if (OCCASIONS.some((o) => o.id === intent.recommend)) a.slots.occasion = intent.recommend;
      return { text, cards: agamRecommend(a.slots, mode), after: intent.after };
    }
    return { text, after: intent.after };
  }

  /* 7. מידע חדש — ממליצים, ושואלים שאלה אחת */
  if (slotsChanged && (a.slots.occasion || a.slots.budget || a.slots.recipient || a.slots.color || a.slots.style)) {
    const mode = a.slots.style === "classic" ? "classic" : a.slots.style === "wild" ? "wild" : null;
    const picks = agamRecommend(a.slots, mode);
    return { text: agamRecommendLead(a.slots, picks), cards: picks, tail: agamNextQuestion(a.slots) };
  }

  /* 8. לא הבנו — אם *אנחנו* שאלנו, חוזרים לשאלה עם כפתורים */
  if (a.expecting === "occasion") {
    a.expecting = null;
    return {
      text: "לא קלטתי את האירוע, אז בוא נעשה את זה קל:",
      after: (key) =>
        agentChips(key, OCCASIONS.slice(0, 8).map((o) => ({ label: `${o.emo} ${o.label}`, action: `agamOccasion('${o.id}')` }))),
    };
  }
  if (a.expecting === "style") {
    a.expecting = null;
    return {
      text: "בוא נפשט: איזה כיוון מדבר אליה?",
      after: (key) =>
        agentChips(key, [
          { label: "🌹 קלאסי ויוקרתי", action: "agamStyle('classic')" },
          { label: "🌻 כפרי וצבעוני", action: "agamStyle('wild')" },
        ]),
    };
  }
  if (a.expecting === "budget") {
    a.expecting = null;
    return {
      text: "תן לי טווח ואני אסתדר:",
      after: (key) => agentChips(key, CUSTOM_TIERS.map((t) => ({ label: `עד ₪${t}`, action: `agamBudget(${t})` }))),
    };
  }

  a.lastIntent = null;
  return {
    text: pickFresh(
      [
        "לא בטוחה שקלטתי 🙂\nתגיד לי רק למי זה — \"לאשתי\", \"לאמא\", \"לחבר\" — וזה כבר משנה לי הכול.",
        "פספסתי משהו.\nלמי אנחנו קונים, ולאיזו הזדמנות?",
      ],
      "fallback"
    ),
  };
}

/* ---------- ממשק אגם ---------- */
function toggleChat() {
  const opened = agentTogglePanel("agam");
  if (opened && AGENTS.agam.history.length === 0) {
    // המשפט היומי — אותו משפט שבראש הדף, מתחלף ב-08:00
    if (typeof dailyLine === "function") agentSay("agam", `🌸 ${dailyLine()}`);
    agentSay("agam", "היי, כיף שקפצת אלינו! אני אגם.\nמחפש משהו מיוחד להיום, או סתם בא לך לפנק מישהו שאתה אוהב?");
    agamMenu();
  }
}

function agamMenu() {
  agentMenu("agam", [
    { icon: "🎁", label: "לפי אירוע", action: "agamPick('event')" },
    { icon: "💰", label: "לפי תקציב", action: "agamPick('budget')" },
    { icon: "⭐", label: "מה הכי נמכר", action: "agamPick('best')" },
    { icon: "✨", label: "להרכיב זר משלי", action: "agamPick('custom')" },
    { icon: "🚚", label: "משלוחים", action: "agamPick('ship')" },
  ]);
}

function agamTailChips() {
  agentChips("agam", [
    { label: "חזרה לתפריט", action: "agamMenu()" },
    { label: "לקטלוג", action: "location.href='catalog.html'" },
    { label: "💬 וואטסאפ", action: "openShopWhatsApp()" },
  ]);
}

function agamPick(kind) {
  const a = AGENTS.agam;
  agentClearWidgets("agam");

  if (kind === "event") {
    agentAdd("agam", "לפי אירוע", "user");
    agentSay("agam", "בטח. לאיזו הזדמנות?");
    a.expecting = "occasion";
    agentChips("agam", OCCASIONS.slice(0, 8).map((o) => ({ label: `${o.emo} ${o.label}`, action: `agamOccasion('${o.id}')` })));
    return;
  }
  if (kind === "budget") {
    agentAdd("agam", "לפי תקציב", "user");
    agentSay("agam", "איזה סכום נוח לך?\nאפשר גם פשוט לכתוב לי מספר.");
    a.expecting = "budget";
    agentChips("agam", CUSTOM_TIERS.map((t) => ({ label: `עד ₪${t}`, action: `agamBudget(${t})` })));
    return;
  }
  if (kind === "best") {
    agentAdd("agam", "מה הכי נמכר", "user");
    agentSay("agam", "אלה שחוזרים אליהם הכי הרבה — ולא במקרה:");
    agentCards("agam", agamRecommend(a.slots, "bestsellers"));
    agamTailChips();
    return;
  }
  if (kind === "custom") {
    agentAdd("agam", "להרכיב זר משלי", "user");
    agentSay("agam", `לגמרי אפשר. מרכיבים לפי תקציב — ${CUSTOM_TIERS.map((t) => "₪" + t).join(" · ")} ומעלה.\nאיזה סכום מתאים לך?`);
    a.expecting = "budget";
    agentChips("agam", CUSTOM_TIERS.map((t) => ({ label: `₪${t}`, action: `agamBudget(${t})` })));
    return;
  }

  agentAdd("agam", "משלוחים", "user");
  agentSay("agam", `${KB.shipping}\n${KB.cutoff}`);
  agentSay("agam", "לאיזו עיר צריך להגיע?");
  a.expecting = "city";
  agamTailChips();
}

function agamOccasion(id) {
  const a = AGENTS.agam;
  const occ = OCCASIONS.find((o) => o.id === id);
  agentClearWidgets("agam");
  agentAdd("agam", occ ? occ.label : id, "user");
  a.slots.occasion = id;
  a.expecting = null;
  const picks = agamRecommend(a.slots);
  agentSay("agam", agamRecommendLead(a.slots, picks));
  agentCards("agam", picks);
  const q = agamNextQuestion(a.slots);
  if (q) agentSay("agam", q);
  agamTailChips();
}

function agamBudget(amount) {
  const a = AGENTS.agam;
  agentClearWidgets("agam");
  agentAdd("agam", `עד ₪${amount}`, "user");
  a.slots.budget = amount;
  a.expecting = null;
  const picks = agamRecommend(a.slots);
  agentSay("agam", agamRecommendLead(a.slots, picks));
  agentCards("agam", picks);
  const q = agamNextQuestion(a.slots);
  if (q) agentSay("agam", q);
  agamTailChips();
}

function agamStyle(kind) {
  const a = AGENTS.agam;
  agentClearWidgets("agam");
  agentAdd("agam", kind === "classic" ? "קלאסי ויוקרתי" : "כפרי וצבעוני", "user");
  a.slots.style = kind;
  a.expecting = null;
  agentSay("agam", kind === "classic" ? "בחירה בטוחה, ואני אוהבת אותה:" : "אוהבת את הכיוון הזה:");
  agentCards("agam", agamRecommend(a.slots, kind));
  const q = agamNextQuestion(a.slots);
  if (q) agentSay("agam", q);
  agamTailChips();
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
    else agamTailChips();
  }, 480 + Math.random() * 480);
}

/* ============================================================
   חלק ז׳ — מיכאל: תמיכה טכנית בלבד
   ------------------------------------------------------------
   ישיר. בלי "בשמחה", בלי "אשמח לעזור".
   מבנה קבוע: מה קרה → מה לעשות → מה אם זה לא עזר.
   בעיה בזר אינה שלו — היא עוברת לוואטסאפ.
   ============================================================ */

/**
 * זיהוי מכשיר. "רענון עם Ctrl+F5" הוא הוראה שלא קיימת באייפון,
 * ו"הגדרות ← Safari" לא קיים באנדרואיד. סוכן שנותן הוראה שלא
 * קיימת אצלך נשמע כאילו נפל מהשמיים.
 *
 * מזהים גם מההודעה עצמה — המשתמש יודע טוב מאיתנו על מה הוא.
 */
function detectPlatform(text) {
  if (/אייפון|iphone|ios|ipad|אייפד|ספארי|safari/i.test(text || "")) return "ios";
  if (/אנדרואיד|android|סמסונג|samsung|שיאומי|xiaomi|גלקסי|galaxy/i.test(text || "")) return "android";
  if (/מחשב|לפטופ|windows|mac/i.test(text || "")) return "desktop";

  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

const FIXES = {
  ios: {
    name: "אייפון",
    reload: "משיכה מלמעלה למטה בתוך הדף (לא משורת הכתובת) — זה רענון מלא.",
    cache: "הגדרות ← Safari ← נקה היסטוריה ונתוני אתרים. שים לב שזה מנתק אותך מאתרים אחרים.",
    privateTab: "בספארי: כפתור הכרטיסיות למטה ← \"פרטי\" ← פלוס.",
    known:
      "שתי תקלות מוכרות באייפון:\n· חוסם תוכן שמותקן דרך הגדרות ← Safari ← הרחבות — חוסם תמונות ולפעמים את הצ'אט.\n· \"מנע מעקב חוצה אתרים\" מוחק אחסון מקומי אחרי 7 ימים, ולכן העגלה מתאפסת אם לא נכנסת שבוע.",
    cart: "גלישה פרטית מוחקת את העגלה כשסוגרים כרטיסייה, ו\"מנע מעקב חוצה אתרים\" מוחק אותה אחרי 7 ימים בלי ביקור. שניהם של ספארי.",
    images:
      "באייפון תמונות שבורות זה בדרך כלל חוסם תוכן.\nהגדרות ← Safari ← הרחבות — כבה לרגע וטען מחדש.\nאם אין לך חוסם — משיכה למטה לרענון, ואז ניקוי נתוני אתרים.",
  },
  android: {
    name: "אנדרואיד",
    reload: "משיכה מלמעלה למטה בתוך הדף, או תפריט שלוש הנקודות ← סמל הרענון.",
    cache: "כרום ← שלוש נקודות ← היסטוריה ← נקה נתוני גלישה ← \"תמונות וקבצים בקאש\".",
    privateTab: "כרום: שלוש נקודות ← \"כרטיסיית פרטיות\".",
    known:
      "שלוש תקלות מוכרות באנדרואיד:\n· מצב חיסכון בנתונים דוחס תמונות ולפעמים שובר אותן. כרום ← הגדרות ← חיסכון בנתונים ← כבה.\n· \"מצב Lite\" בדפדפן סמסונג עושה אותו דבר.\n· חוסם פרסומות מובנה בדפדפן סמסונג חוסם לנו את הצ'אט. הגדרות ← אתרים והורדות ← חוסמי פרסומות.",
    cart: "העגלה שורדת סגירת כרטיסייה, אלא אם ניקית נתוני גלישה או שהמכשיר מחק אותם בלחץ זיכרון.",
    images:
      "באנדרואיד תמונות שבורות זה כמעט תמיד חיסכון בנתונים.\nכרום ← הגדרות ← חיסכון בנתונים ← כבה. בדפדפן סמסונג זה \"מצב Lite\".\nאם לא זה — חוסם הפרסומות המובנה של סמסונג.",
  },
  desktop: {
    name: "מחשב",
    reload: "Ctrl+F5 בווינדוס, Cmd+Shift+R במאק. רענון שמתעלם מהקאש.",
    cache: "Ctrl+Shift+Delete ← \"תמונות וקבצים בקאש\".",
    privateTab: "Ctrl+Shift+N בכרום, Ctrl+Shift+P בפיירפוקס.",
    known:
      "במחשב האשם כמעט תמיד הרחבה: חוסם פרסומות, VPN או אנטי־וירוס עם \"הגנת גלישה\". בדוק בחלון פרטי — שם ההרחבות כבויות.",
    cart: "העגלה שורדת סגירת דפדפן, אלא אם ניקית היסטוריה או גלשת בחלון פרטי.",
    images:
      "שלוש אפשרויות, לפי שכיחות:\n1. חיבור איטי — התמונה בדרך.\n2. חוסם פרסומות שחוסם את התיקייה.\n3. גרסה ישנה במטמון — Ctrl+F5.",
  },
};

function deviceFix(platform, kind) {
  const f = FIXES[platform] || FIXES.desktop;
  if (kind === "cart") {
    return `העגלה יושבת בדפדפן שלך, לא בשרת. מכוון — אנחנו לא שומרים עליך מידע שלא צריך.\nב${f.name}: ${f.cart}\nנעלמה בלי אחד מאלה — תגיד לי איזה דפדפן.`;
  }
  if (kind === "images") {
    return `${f.images}\nעברת את אלה וזה נשאר — זו תקלה אצלנו. באיזה עמוד?`;
  }
  return (
    `זיהיתי ${f.name}. לפי הסדר:\n` +
    `1. רענון: ${f.reload}\n` +
    `2. עדיין? ${f.privateTab} אם שם זה עובד — האשם תוסף או הגדרה, לא האתר.\n` +
    `3. ניקוי קאש: ${f.cache}\n\n${f.known}\n\nלא עזר — תגיד לי מה בדיוק היה על המסך ואעביר הלאה.`
  );
}

const ORDER_STATES = [
  { label: "התקבלה", text: (n) => `הזמנה ${n} — סטטוס: התקבלה ✅\nנקלטה וממתינה לשזירה בבוקר הקרוב.\nזה השלב שבו הכי קל לשנות כתובת, שעה או ברכה.` },
  { label: "בשזירה", text: (n) => `הזמנה ${n} — סטטוס: בשזירה 🌿\nהפרחים נבחרו הבוקר והזר מורכב ידנית עכשיו.\nשינוי כתובת עדיין אפשרי, שינוי הרכב כבר לא.` },
  { label: "יצאה לשליח", text: (n) => `הזמנה ${n} — סטטוס: יצאה לשליח 🚚\nבדרך, בטווח השעות שנבחר.\nאין מי שיפתח — השליח מתקשר למספר שהשארת לפני שהוא עוזב.` },
  { label: "נמסרה", text: (n) => `הזמנה ${n} — סטטוס: נמסרה ✔️\nהמסירה הושלמה.\nמשהו לא היה תקין? יש 24 שעות לדווח בוואטסאפ.` },
];

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

const MICHAEL_INTENTS = [
  {
    name: "human",
    strong: ["בן אדם", "נציג", "לדבר עם מישהו", "אתה רובוט", "מי אתה", "אדם אמיתי"],
    kw: ["בוט", "טלפון"],
    reply: () => `אני בוט. לדברים שדורשים החלטה — בן אדם עדיף.\nוואטסאפ · ${SHOP_PHONE} · ${SHOP_EMAIL}\nמענה: ${SHOP_HOURS}`,
    chips: [{ label: "💬 לוואטסאפ עכשיו", action: "openShopWhatsApp()" }],
  },
  {
    name: "tech_load",
    strong: ["לא נטען", "לא עולה", "מסך לבן", "נתקע", "תקוע", "קורס", "נסגר לבד", "איטי"],
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
    strong: ["תמונות לא נטענות", "לא רואה תמונות", "תמונה שבורה"],
    kw: ["תמונה", "תמונות"],
    reply: (text) => deviceFix(detectPlatform(text), "images"),
  },
  {
    name: "payment",
    strong: ["לא מצליח לשלם", "התשלום נכשל", "חיוב", "כרטיס אשראי", "סליקה"],
    kw: ["תשלום", "לשלם", "אשראי"],
    reply: () => `${KB.payment}\nפרטי אשראי לא נשלחים בוואטסאפ ולא נשמרים באתר. זו הפרת תקן PCI וסיכון ממשי ללקוח.`,
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
    strong: ["מגיעים", "לאן אתם", "אתם מחלקים", "מחלקים", "אזור חלוקה", "שולחים ל"],
    kw: ["אזור", "עיר", "כתובת", "לאן", "שולחים"],
    reply: () => `${KB.zones}\nתן לי שם של עיר ואבדוק מול הרשימה.`,
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
    name: "nobody_home",
    strong: ["אין אף אחד בבית", "לא יהיו בבית", "לא ענו", "השליח לא מצא"],
    reply: () =>
      "השליח מתקשר למספר שהשארת לפני שהוא עוזב.\nאין מענה — פועל לפי ההערה לשליח: שכן, לובי, או חזרה לחנות.\nתכתוב מראש מה אתה מעדיף. חוסך את כל הסיפור.",
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
    reply: () => `${SHOP_ADDRESS}.\nבעמוד הבית יש קטע "איך מגיעים אלינו" עם מפה וכפתורי ניווט.\n${SHOP_HOURS}`,
    chips: [{ label: "פתיחת קטע ההגעה", action: "location.href='index.html#visit'" }],
  },
  {
    name: "invoice",
    strong: ["חשבונית", "קבלה", "מס", "עוסק", "הוצאה מוכרת"],
    reply: () => "חשבונית מס נשלחת במייל אחרי השלמת התשלום מול החנות.\nעל שם חברה — שם ומספר ח.פ. בהערה להזמנה, או בוואטסאפ.",
  },
  {
    name: "privacy",
    strong: ["פרטיות", "מידע אישי", "שומרים עלי", "מוחקים", "cookies", "עוגיות"],
    reply: () =>
      "אין לנו שרת, אז אין לנו מה לשמור.\nהעגלה, הדירוג והגדרות הנגישות — בדפדפן שלך בלבד.\nפרטי ההזמנה עוברים לחנות בוואטסאפ.",
  },
  {
    name: "accessibility",
    strong: ["נגישות", "נגיש", "קורא מסך", "עיוור", "לקוי ראייה", "ניגודיות", "להגדיל טקסט"],
    reply: () =>
      "תפריט נגישות מלא: הכפתור הכחול בצד המסך, או Alt+Shift+A.\nהגדלת טקסט, ניגודיות גבוהה, עצירת אנימציות, סמן גדול, סרגל קריאה. נשמר לביקור הבא.",
    chips: [{ label: "פתיחת תפריט הנגישות", action: "openA11yPanel()" }],
  },
];

/** נושאים שהם של אגם */
const TO_AGAM = [
  {
    name: "handoff",
    strong: ["איזה זר", "רוצה זר", "מחפש זר", "מחפשת זר", "מה להביא", "מה מתאים", "מה לקנות", "להמליץ", "המלצה", "איזה פרחים", "יום הולדת", "רומנטי", "ניחומים", "לאמא", "מתנה"],
    kw: ["זר", "פרחים", "תקציב", "שקל", "מחפש", "לקנות"],
  },
];

function michaelReply(text) {
  const m = AGENTS.michael;
  m.turns++;

  /* 1. בעיה בזר — לא שלי. ישר לוואטסאפ. */
  if (detectIntent(text, BOUQUET_ISSUE, 3)) {
    m.lastIntent = "bouquet_issue";
    return bouquetIssueReply("michael");
  }

  /* 2. מספר הזמנה. במצב מעקב מספיקות ספרות; מחוץ לו נדרש
        הפורמט המלא, כדי ש"עד 250 שקל" לא ייחשב להזמנה. */
  if (m.mode === "track" || /IRIS-?DEMO/i.test(text)) {
    const orderNumber = extractOrderNumber(text);
    if (orderNumber) {
      m.lastOrder = orderNumber;
      return {
        text: orderStatusFor(orderNumber).text(orderNumber) + "\n\n(מצב הדגמה — הסטטוס להמחשה. למעקב אמיתי, וואטסאפ עם המספר.)",
        chips: [
          { label: "💬 מעקב אמיתי בוואטסאפ", action: "openShopWhatsApp()" },
          { label: "חזרה לתפריט", action: "michaelMenu()" },
        ],
      };
    }
  }

  /* 3. שם עיר — תשובה חד־משמעית */
  const area = typeof checkDeliveryArea === "function" ? checkDeliveryArea(text) : null;
  if (area) {
    return {
      text:
        area.tier === "core"
          ? `כן — ${area.area} באזור החלוקה הרגיל.\n${area.info}.\n${KB.shipping}`
          : `ל${area.area} מגיעים, אבל ${area.info}.\nשתי אפשרויות: לצרף עוד פריט ולעבור את הסף, או איסוף עצמי מהחנות — בחינם.`,
    };
  }

  /* 4. בחירת זר — התחום של אגם */
  if (detectIntent(text, TO_AGAM, 3)) {
    return {
      text: "זה לא אצלי. בחירת זרים — אגם.\nהיא בצד השני של המסך.",
      chips: [
        { label: "🌸 לפתוח את אגם", action: "toggleChat()" },
        { label: "חזרה לתפריט", action: "michaelMenu()" },
      ],
    };
  }

  /* 5. כוונה טכנית */
  const intent = detectIntent(text, MICHAEL_INTENTS, 2);
  if (intent) {
    m.lastIntent = intent.name;
    if (intent.mode) m.mode = intent.mode;
    return { text: intent.reply(text), chips: intent.chips };
  }

  /* 6. לא זוהה — אומרים את זה ישר */
  return {
    text:
      "לא זיהיתי. לא אנחש.\nמה שאני מטפל בו: תקלות באתר · מעקב הזמנה · אזורי חלוקה · ביטול ושינוי · תשלום וחשבונית · נגישות.\nבעיה בזר עצמו — זה ישר לוואטסאפ, לא דרכי.",
    chips: [
      { label: "💬 לוואטסאפ של החנות", action: "openShopWhatsApp()" },
      { label: "חזרה לתפריט", action: "michaelMenu()" },
    ],
  };
}

/* ---------- ממשק מיכאל ---------- */
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
    { icon: "🚚", label: "משלוחים ואזורי חלוקה", action: "michaelPick('delivery')" },
    { icon: "🛠️", label: "תקלה טכנית באתר", action: "michaelPick('tech')" },
    { icon: "🔄", label: "ביטול או שינוי הזמנה", action: "michaelPick('change')" },
    { icon: "🥀", label: "בעיה בזר שקיבלתי", action: "michaelPick('issue')" },
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
    agentSay("michael", `${KB.shipping}\n${KB.cutoff}\n${KB.zones}\n\nשם של עיר ואבדוק מול הרשימה.`);
  } else if (kind === "change") {
    agentAdd("michael", "ביטול או שינוי הזמנה", "user");
    agentSay("michael", KB.cancel + "\nמה צריך לשנות?");
  } else if (kind === "issue") {
    // בעיה בזר — לא מטפלים כאן, מעבירים מיד
    agentAdd("michael", "בעיה בזר שקיבלתי", "user");
    const r = bouquetIssueReply("michael");
    AGENTS.michael.lastIntent = "bouquet_issue";
    agentSay("michael", r.text);
    agentChips("michael", r.chips);
    return;
  } else {
    agentAdd("michael", "תקלה טכנית באתר", "user");
    const p = FIXES[detectPlatform("")] || FIXES.desktop;
    agentSay(
      "michael",
      `אני רואה שאתה על ${p.name}. תגיד לי מה ניסית לעשות ומה קרה בפועל.\nזיהיתי לא נכון? תכתוב "אני באייפון" או "אני באנדרואיד".`
    );
  }

  agentChips("michael", [
    { label: "חזרה לתפריט", action: "michaelMenu()" },
    { label: "💬 וואטסאפ", action: "openShopWhatsApp()" },
  ]);
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

/* ============================================================
   חלק ח׳ — וואטסאפ
   ============================================================ */
function openShopWhatsApp() {
  let text = "היי פרחי איריס! הגעתי מהאתר ואשמח לעזרה 🌸";
  const m = AGENTS.michael;
  const a = AGENTS.agam;

  if (m.lastIntent === "bouquet_issue") {
    text = whatsappIssueText();
  } else if (m.lastOrder) {
    text = `היי פרחי איריס! אשמח לבדוק סטטוס להזמנה ${m.lastOrder} 🌸`;
  } else if (m.mode === "tech" || m.lastIntent === "tech_load" || m.lastIntent === "tech_cart") {
    text = "היי פרחי איריס! נתקלתי בתקלה באתר ואשמח לעזרה 🙏";
  } else if (a.slots.occasion) {
    const occ = (OCCASIONS.find((o) => o.id === a.slots.occasion) || {}).label;
    text = `היי פרחי איריס! אשמח לעזרה בבחירת זר ל${occ}${a.slots.budget ? ` בתקציב של עד ₪${a.slots.budget}` : ""} 🌸`;
  }

  window.open(`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
