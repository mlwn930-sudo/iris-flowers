/* ============================================================
   פרחי איריס — מיכל, הסוכנת הדיגיטלית
   רצה בדפדפן, ללא שרת. שני מסלולים: ייעוץ זר, ומעקב הזמנות.
   ============================================================ */

/* ------------------------------------------------------------
   הגדרות חנות — להחלפה בפרטים האמיתיים לפני עלייה לאוויר
   ------------------------------------------------------------ */
const SHOP_WHATSAPP = "972500000000"; // ← מספר דמה. להחליף במספר הוואטסאפ האמיתי של החנות (פורמט בינלאומי, בלי +)
const WA_DEFAULT_TEXT = "היי פרחי איריס! הגעתי מהאתר ואשמח לעזרה 🌸";

let chatHistory = [];
let chatMode = null; // null | "advice" | "track"
let lastIntent = null;
let lastOrderNumber = null;
const usedReplies = new Set();

/* ---------- מנוע כוונות (מסלול ייעוץ) ---------- */
const INTENTS = [
  {
    name: "greeting",
    keywords: ["היי", "הי ", "שלום", "אהלן", "בוקר טוב", "ערב טוב", "מה נשמע", "מה קורה", "הלו"],
    replies: [
      "היי! 🌸 מחפש/ת זר למישהו מסוים, או בא/ה להסתכל קצת?",
      "אהלן! כיף שנכנסת. לאיזה אירוע אנחנו מחפשים היום?",
      "שלום שלום! ספר/י לי למי הזר מיועד ואני כבר אדע לכוון אותך.",
    ],
  },
  {
    name: "delivery",
    keywords: ["משלוח", "לשלוח", "מתי מגיע", "זמן אספקה", "שליח", "עד מתי", "היום", "מחר", "לשלח"],
    replies: [
      "אנחנו מחלקים בקריית אתא ובכל מפרץ חיפה. הזמנה שנסגרת עד 14:00 יוצאת עוד באותו יום 🌸 לאן צריך שיגיע?",
      "משלוחים יוצאים כל יום. באזור קריית אתא זה אפילו באותו יום אם מזמינים לפני 14:00. יש תאריך שאת/ה מכוון/ת אליו?",
      "אפשר לבחור בקופה תאריך ושעת הגעה מועדפים, כדי שהזר יגיע בדיוק ברגע הנכון. לאן שולחים?",
    ],
  },
  {
    name: "price",
    keywords: ["כמה עולה", "מחיר", "מחירים", "עלות", "כמה זה", "יקר", "זול", "תקציב"],
    replies: [
      'הטווח שלנו הוא 99–349 ש"ח בגודל הקלאסי. זר החתימה, זר האירוס הסגול, עומד על 189. יש סכום שנוח לך שאתאים אליו?',
      'לכל זר יש שלושה גדלים — קלאסי, מורחב (+25%) ושופע (+50%). ככה אפשר להתאים כמעט לכל תקציב. מה בערך התקציב שלך?',
      'תלוי בגודל ובסוג. הכי פופולרי אצלנו זה הטווח 139–219 ש"ח. תגיד/י לי מספר ואמליץ בול.',
    ],
  },
  {
    name: "size",
    keywords: ["גודל", "גדול יותר", "קטן", "שופע", "מורחב", "קלאסי", "כמה פרחים", "גבעולים"],
    replies: [
      "לכל זר יש שלוש מידות: קלאסי (כ-12 גבעולים), מורחב (כ-18, ‎+25% למחיר) ושופע (כ-26, ‎+50%). אפשר לראות ולהשוות בלחיצה על כל זר בקטלוג.",
      "המורחב הוא הבחירה הכי נפוצה למתנה — הוא נראה נדיב בלי לקפוץ במחיר. השופע שמור לאירועים ולרגעים הגדולים.",
    ],
  },
  {
    name: "birthday",
    keywords: ["יום הולדת", "יומולדת", "הולדת", "חוגג", "חוגגת"],
    replies: [
      'ליום הולדת אני הכי אוהבת את הזר הצבעוני העונתי (139 ש"ח) או את זר החמניות (149) — שמחים, מלאי חיים ותמיד עושים חיוך.',
      'תלוי כמה גדול הרגע 🙂 לזר יומיומי-שמח — העונתי ב-139. למשהו שעושה "וואו" בכניסה — זר האירוע המפואר ב-349, או העונתי בגודל שופע.',
    ],
  },
  {
    name: "romantic",
    keywords: ["רומנטי", "אהבה", "בת זוג", "בן זוג", "אישה שלי", "בעל שלי", "חברה שלי", "חבר שלי", "נישואין", "דייט", "התנצלות", "לפייס"],
    replies: [
      'לרגעים רומנטיים הקלאסיקה מנצחת: זר ורדים אדומים (159 ש"ח). ואם רוצים משהו קצת פחות צפוי — אירוסים וורדים לבנים (219) ממש מרגש.',
      'ורדים אדומים זה תמיד בטוח, אבל אם את/ה רוצה שזה ייראה אישי יותר — האירוסים הסגולים שלנו עושים רושם אחר לגמרי.',
      'מניסיון, מה שבאמת עובד זה זר יפה עם ברכה אישית טובה. את הזר אני אעזור לבחור, ואת הברכה אפשר לכתוב יחד בשלב התשלום.',
    ],
  },
  {
    name: "sympathy",
    keywords: ["ניחומים", "לוויה", "שבעה", "פטירה", "נפטר", "נפטרה", "השתתפות בצער"],
    replies: [
      'משתתפת בצער. הזר שלנו לרגעים כאלה הוא הלבן-סגול (179 ש"ח) — רגוע, מכובד, בלי צבעים צועקים ובלי ריח חזק.',
      'מצטערת לשמוע. יש לנו זר ניחומים שנבנה בדיוק לרגישות הזו. אם תרצה/י, אפשר לצרף אליו ברכה מכובדת ואני אעזור לנסח.',
    ],
  },
  {
    name: "thanks_gift",
    keywords: ["תודה ל", "להודות", "מתנת תודה", "להגיד תודה", "מורה", "מטפלת", "רופא"],
    replies: [
      'ל"תודה" יש לנו זר קטן ועדין ב-99 ש"ח — בדיוק במידה, לא מוגזם ולא קמצני.',
      'זר התודה שלנו (99 ש"ח) הוא הכי מבוקש למתנות כאלה. עם ברכה קצרה ואישית זה ממש קולע.',
    ],
  },
  {
    name: "signature",
    keywords: ["למה אירוס", "מה זה איריס", "שם המותג", "למה קוראים", "הסיפור שלכם", "מי אתם"],
    replies: [
      "השם הגיע מפרח האירוס הסגול — הוא נותן לנו את הצבע ואת החתימה. תמצא/י אותו כמעט בכל זר שאנחנו מרכיבים 🌸",
      "אנחנו בוטיק קטן בקריית אתא. כל זר נבנה ידנית לפי ההזמנה, ולא מוציאים כלום שלא היינו שולחים למישהו קרוב.",
    ],
  },
  {
    name: "care",
    keywords: ["כמה זמן מחזיק", "לטפל", "טיפול", "אגרטל", "להחזיק", "נובל", "מים"],
    replies: [
      "בכל עמוד מוצר יש לשונית 'המלצות לשזירה וטיפול באגרטל' עם הוראות מדויקות לזר הספציפי. הכלל הכי חשוב: חיתוך אלכסוני והחלפת מים כל יומיים.",
      "רוב הזרים שלנו מחזיקים 7–12 יום עם טיפול נכון. הסוד הוא מים נקיים והרחקה משמש ישירה ומפירות מבשילים.",
    ],
  },
  {
    name: "payment",
    keywords: ["תשלום", "אשראי", "לשלם", "כרטיס", "חיוב", "ביט", "מזומן", "חשבונית", "קופון", "הנחה"],
    replies: [
      "כרגע האתר במצב הדגמה, כך שלא מתבצע חיוב אמיתי — זה כדי שתוכל/י לעבור על התהליך בנוחות. בגרסה הסופית התשלום יהיה מאובטח לגמרי.",
      "בעמוד הקופה יש גם שדה לקוד קופון. כרגע זה במצב הדגמה, בלי חיוב אמיתי.",
    ],
  },
  {
    name: "complaint",
    keywords: ["בעיה", "לא מרוצה", "מקולקל", "התאכזבתי", "מאוחר", "לא הגיע", "תלונה", "גרוע", "כמוש"],
    replies: [
      "אני ממש מצטערת, וזה לגמרי לא הסטנדרט שלנו. ספר/י לי בדיוק מה קרה ואני אדאג שזה יטופל — ואם צריך, נעביר ישירות לבעלת החנות.",
      "זה מתסכל ואני מבינה אותך לגמרי. תן/י לי את הפרטים ונמצא פתרון — החלפה או זיכוי, מה שנכון יותר. אפשר גם לעבור לוואטסאפ בכפתור למטה ולטפל בזה מהר.",
    ],
  },
  {
    name: "human",
    keywords: ["בנאדם", "לדבר עם מישהו", "מנהל", "בעלים", "טלפון", "להתקשר", "נציג", "וואטסאפ", "ווצאפ"],
    replies: [
      "בכיף — הכפתור הירוק למטה מעביר ישירות לוואטסאפ של החנות למענה אישי.",
      "אפשר לעבור לשיחה אישית בוואטסאפ בכפתור הירוק למטה. אם בינתיים יש משהו שאני יכולה לעזור בו, אני כאן.",
    ],
  },
  {
    name: "hours",
    keywords: ["שעות", "פתוח", "סגור", "שבת", "מתי אתם"],
    replies: [
      "שעות הפעילות המדויקות מתעדכנות בתחתית האתר — הכי בטוח לבדוק שם. הזמנות באתר אפשר לבצע מסביב לשעון.",
    ],
  },
  {
    name: "wedding",
    keywords: ["חתונה", "אירוע", "בר מצווה", "בת מצווה", "ברית", "כנס", "עיצוב אולם"],
    replies: [
      'לאירועים יש לנו את הזר המפואר (349 ש"ח), ובגודל שופע הוא באמת עושה רושם. אפשר גם לתאם הזמנה מיוחדת בכמויות. מתי האירוע?',
      "אירועים זה משהו שאנחנו אוהבים במיוחד — אפשר להתאים גם צבעים וסגנון. לתכנון מלא שווה לעבור לוואטסאפ.",
    ],
  },
  {
    name: "thanks",
    keywords: ["תודה רבה", "מעולה", "אחלה", "יופי", "סבבה", "מושלם", "תודה", "אלוף"],
    replies: ["בשמחה! 🌸 אם צריך עוד משהו, אני כאן.", "כיף לעזור! שיהיה לך יום מהמם.", "תמיד! מקווה שהזר יעשה בדיוק את הרושם שרצית."],
  },
];

const EVENT_CATEGORY_MAP = {
  birthday: "seasonal",
  romantic: "roses",
  sympathy: "sympathy",
  thanks_gift: "thanks",
  wedding: "events",
};

const CHAT_FALLBACK = [
  "אשמח לכוון אותך — למי הזר מיועד ולאיזו הזדמנות?",
  "תן/י לי קצת הקשר: אירוע, תקציב, או למי זה הולך — ואני אמליץ בול.",
  "לא בטוחה שהבנתי במדויק 🙂 רוצה שאמליץ לפי אירוע, או שנלך לפי תקציב?",
];

const FOLLOW_UPS = ["רוצה שאראה לך אותו בקטלוג?", "יש משהו נוסף שחשוב לך שיהיה בזר?", "שנבדוק גם גודל מורחב?"];

/* ---------- מעקב הזמנות (הדגמה) ---------- */
const ORDER_STATES = [
  {
    label: "התקבלה",
    text: (n) =>
      `הזמנה ${n} התקבלה ונקלטה אצלנו במערכת ✅\nהיא ממתינה לשזירה ותיכנס לעבודה בבוקר הקרוב. אם צריך לשנות משהו — עכשיו זה הרגע הכי קל.`,
  },
  {
    label: "בשזירה",
    text: (n) =>
      `הזמנה ${n} נמצאת כרגע בשזירה 🌿\nהפרחים נבחרו הבוקר והזר מורכב ידנית ברגעים אלה. בסיום הוא עובר בדיקת איכות ויוצא לדרך.`,
  },
  {
    label: "יצאה לשליח",
    text: (n) =>
      `הזמנה ${n} כבר בדרך 🚚\nהזר יצא עם השליח והוא אמור להגיע בטווח השעות שנבחר. אם אף אחד לא יהיה בבית — השליח ייצור קשר טלפוני לתיאום.`,
  },
  {
    label: "נמסרה",
    text: (n) =>
      `הזמנה ${n} נמסרה בהצלחה 🌸\nמקווה שהזר עשה בדיוק את הרושם שרצית. אם משהו לא היה מושלם — ספר/י לי ונטפל בזה מיד.`,
  },
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

/* ---------- בחירת תשובה ---------- */
function pickFresh(arr, key) {
  const fresh = arr.filter((t) => !usedReplies.has(key + "|" + t));
  const pool = fresh.length ? fresh : arr;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  if (!fresh.length) arr.forEach((t) => usedReplies.delete(key + "|" + t));
  usedReplies.add(key + "|" + choice);
  return choice;
}

function chatDetectIntent(message) {
  const text = (message || "").toLowerCase();
  return INTENTS.find((intent) => intent.keywords.some((k) => text.includes(k))) || null;
}

function chatBudgetReply(message, intent) {
  const match = (message || "").match(/(\d{2,4})/);
  const budget = match ? parseInt(match[1], 10) : null;
  if (!budget || budget < 40 || budget > 5000) return null;

  const preferred = intent && EVENT_CATEGORY_MAP[intent.name];
  let candidates = PRODUCTS.filter((p) => p.price <= budget);
  if (preferred) {
    const inCategory = candidates.filter((p) => p.category === preferred);
    if (inCategory.length) candidates = inCategory;
  }
  if (!candidates.length) {
    const cheapest = PRODUCTS.reduce((a, b) => (a.price < b.price ? a : b));
    return `בתקציב הזה קצת צר — הכי משתלם אצלנו הוא ${cheapest.name} ב-${cheapest.price} ש"ח. רוצה לראות אותו?`;
  }
  candidates.sort((a, b) => b.price - a.price);
  const list = candidates.slice(0, 2).map((p) => `${p.name} (${p.price} ש"ח)`).join(", או ");
  return `בתקציב של עד ${budget} ש"ח הייתי הולכת על ${list}. ${FOLLOW_UPS[Math.floor(Math.random() * FOLLOW_UPS.length)]}`;
}

function michalReply(message) {
  const intent = chatDetectIntent(message);
  const budgetReply = chatBudgetReply(message, intent);
  if (budgetReply) {
    lastIntent = intent ? intent.name : "budget";
    return budgetReply;
  }
  if (intent) {
    let reply = pickFresh(intent.replies, intent.name);
    if (intent.name === lastIntent && Math.random() > 0.5) {
      reply += " " + FOLLOW_UPS[Math.floor(Math.random() * FOLLOW_UPS.length)];
    }
    lastIntent = intent.name;
    return reply;
  }
  lastIntent = null;
  return pickFresh(CHAT_FALLBACK, "fallback");
}

/* ============================================================
   ממשק
   ============================================================ */

function toggleChat() {
  const panel = document.getElementById("chatPanel");
  const isOpen = panel.classList.toggle("open");
  if (isOpen && chatHistory.length === 0) {
    addBotMessage("היי, אני מיכל 🌸 הסוכנת הדיגיטלית של פרחי איריס.\nבמה אפשר לעזור?");
    showMainMenu();
  }
  if (isOpen) setTimeout(() => document.getElementById("chatInput")?.focus(), 260);
}

function chatBodyEl() {
  return document.getElementById("chatBody");
}

function scrollChat() {
  const body = chatBodyEl();
  body.scrollTop = body.scrollHeight;
}

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatBodyEl().appendChild(div);
  scrollChat();
}

function addBotMessage(text) {
  addMessage(text, "bot");
  chatHistory.push({ role: "assistant", content: text });
}

function clearChatWidgets() {
  chatBodyEl()
    .querySelectorAll(".chat-menu, .chat-chips")
    .forEach((el) => el.remove());
}

function showMainMenu() {
  clearChatWidgets();
  const box = document.createElement("div");
  box.className = "chat-menu";
  box.innerHTML = `
    <button onclick="chatChooseMode('advice')"><span class="ico">🌸</span> ייעוץ והתאמת זר אישי</button>
    <button onclick="chatChooseMode('track')"><span class="ico">📦</span> תמיכה ומעקב הזמנות</button>`;
  chatBodyEl().appendChild(box);
  scrollChat();
}

function showChips(options) {
  clearChatWidgets();
  const box = document.createElement("div");
  box.className = "chat-chips";
  box.innerHTML = options
    .map((o) => `<button onclick="chatChip('${o.action}')">${esc(o.label)}</button>`)
    .join("");
  chatBodyEl().appendChild(box);
  scrollChat();
}

function chatChip(action) {
  if (action === "menu") {
    chatMode = null;
    lastOrderNumber = null;
    addBotMessage("בטח — נחזור לתפריט הראשי. במה נמשיך?");
    showMainMenu();
    return;
  }
  if (action === "catalog") {
    window.location.href = "catalog.html";
    return;
  }
  if (action === "whatsapp") {
    openShopWhatsApp();
    return;
  }
}

function chatChooseMode(mode) {
  chatMode = mode;
  clearChatWidgets();

  if (mode === "advice") {
    addMessage("ייעוץ והתאמת זר אישי", "user");
    addBotMessage(
      "מעולה 🌸 ספר/י לי קצת: לאיזו הזדמנות הזר, למי הוא מיועד, ואם יש תקציב שנוח לך — ואני אתאים בדיוק.\nאפשר גם פשוט לכתוב סכום, ואמליץ לפי זה."
    );
    showChips([
      { label: "חזרה לתפריט", action: "menu" },
      { label: "לקטלוג המלא", action: "catalog" },
    ]);
  } else {
    addMessage("תמיכה ומעקב הזמנות", "user");
    addBotMessage(
      'בשמחה 📦 הקלד/י את מספר ההזמנה ואבדוק עבורך את הסטטוס.\nהמספר מופיע באישור ההזמנה ונראה כך: IRIS-DEMO-123456'
    );
    showChips([
      { label: "חזרה לתפריט", action: "menu" },
      { label: "שיחה אישית בוואטסאפ", action: "whatsapp" },
    ]);
  }
}

function showTyping() {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "typingIndicator";
  div.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  chatBodyEl().appendChild(div);
  scrollChat();
}

function hideTyping() {
  document.getElementById("typingIndicator")?.remove();
}

function sendChat(event) {
  event.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  clearChatWidgets();
  addMessage(text, "user");
  chatHistory.push({ role: "user", content: text });
  input.value = "";
  showTyping();

  setTimeout(() => {
    hideTyping();
    handleChatMessage(text);
  }, 520 + Math.random() * 520);
}

function handleChatMessage(text) {
  if (chatMode === "track") {
    const orderNumber = extractOrderNumber(text);
    if (!orderNumber) {
      addBotMessage(
        "לא הצלחתי לזהות מספר הזמנה בהודעה 🙂\nהוא מורכב מספרות ונראה כך: IRIS-DEMO-123456. אפשר גם להקליד רק את הספרות."
      );
      showChips([
        { label: "חזרה לתפריט", action: "menu" },
        { label: "שיחה אישית בוואטסאפ", action: "whatsapp" },
      ]);
      return;
    }
    lastOrderNumber = orderNumber;
    const state = orderStatusFor(orderNumber);
    addBotMessage(state.text(orderNumber));
    addBotMessage("שים/י לב: האתר במצב הדגמה, כך שהסטטוס כאן הוא לדוגמה בלבד. למעקב אמיתי — מעבר לוואטסאפ ונבדוק ידנית.");
    showChips([
      { label: "בדיקת הזמנה נוספת", action: "menu" },
      { label: "שיחה אישית בוואטסאפ", action: "whatsapp" },
    ]);
    return;
  }

  addBotMessage(michalReply(text));
  if (!chatMode) showMainMenu();
}

/* ---------- וואטסאפ ---------- */
function openShopWhatsApp() {
  let text = WA_DEFAULT_TEXT;
  if (chatMode === "track" && lastOrderNumber) {
    text = `היי פרחי איריס! אשמח לבדוק סטטוס להזמנה ${lastOrderNumber} 🌸`;
  } else if (chatMode === "advice") {
    text = "היי פרחי איריס! אשמח לעזרה בבחירת זר מתאים 🌸";
  }
  window.open(`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
