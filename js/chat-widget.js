/* ============================================================
   פרחי איריס — שני סוכנים דיגיטליים
   אגם   (צד שמאל)  — ייעוץ והתאמת זר אישי
   מיכאל (צד ימין)  — תמיכה טכנית, משלוחים ומעקב הזמנות
   שניהם רצים בדפדפן בלבד, ללא שרת.
   ============================================================ */

/* ------------------------------------------------------------
   הגדרות חנות — להחלפה בפרטים האמיתיים לפני עלייה לאוויר
   ------------------------------------------------------------ */
const SHOP_WHATSAPP = "972500000000"; // ← מספר דמה! להחליף במספר הוואטסאפ האמיתי (פורמט בינלאומי, בלי +)
const SHOP_PHONE = "04-0000000"; // ← להשלמה
const SHOP_EMAIL = "hello@iris-flowers.co.il"; // ← להשלמה
const SHOP_INSTAGRAM = "https://instagram.com/"; // ← להשלמה
const SHOP_ADDRESS = "רחוב איינשטיין 20, קריית אתא";

/* ============================================================
   מנוע משותף
   ============================================================ */
const AGENTS = {
  agam: { panel: "chatPanel", body: "chatBody", input: "chatInput", name: "אגם", history: [], mode: null, lastIntent: null },
  michael: { panel: "supportPanel", body: "supportBody", input: "supportInput", name: "מיכאל", history: [], mode: null, lastOrder: null },
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
}

function agentClearWidgets(key) {
  agentBody(key).querySelectorAll(".chat-menu, .chat-chips").forEach((el) => el.remove());
}

function agentMenu(key, items) {
  agentClearWidgets(key);
  const box = document.createElement("div");
  box.className = "chat-menu";
  box.innerHTML = items
    .map((i) => `<button onclick="${i.action}"><span class="ico">${i.icon}</span> ${esc(i.label)}</button>`)
    .join("");
  agentBody(key).appendChild(box);
  agentScroll(key);
}

function agentChips(key, items) {
  agentClearWidgets(key);
  const box = document.createElement("div");
  box.className = "chat-chips";
  box.innerHTML = items.map((i) => `<button onclick="${i.action}">${esc(i.label)}</button>`).join("");
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
  if (open) setTimeout(() => document.getElementById(a.input)?.focus(), 260);
  return open;
}

/* ============================================================
   אגם — ייעוץ והתאמת זר
   ============================================================ */
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
    name: "price",
    keywords: ["כמה עולה", "מחיר", "מחירים", "עלות", "כמה זה", "יקר", "זול", "תקציב"],
    replies: [
      'הטווח שלנו הוא 99–349 ש"ח בגודל הקלאסי. זר החתימה, זר האירוס הסגול, עומד על 189. יש סכום שנוח לך שאתאים אליו?',
      "לכל זר יש שלושה גדלים — קלאסי, מורחב (+25%) ושופע (+50%). ככה אפשר להתאים כמעט לכל תקציב. מה בערך התקציב שלך?",
    ],
  },
  {
    name: "size",
    keywords: ["גודל", "גדול יותר", "קטן", "שופע", "מורחב", "קלאסי", "כמה פרחים", "גבעולים"],
    replies: [
      "לכל זר יש שלוש מידות: קלאסי, מורחב (‎+25%) ושופע (‎+50%). בלחיצה על כל זר בקטלוג רואים בדיוק כמה פרחים יש בכל מידה.",
      "המורחב הוא הבחירה הכי נפוצה למתנה — נראה נדיב בלי לקפוץ במחיר. השופע שמור לאירועים ולרגעים הגדולים.",
    ],
  },
  {
    name: "birthday",
    keywords: ["יום הולדת", "יומולדת", "הולדת", "חוגג", "חוגגת"],
    replies: [
      'ליום הולדת אני הכי אוהבת את הזר הצבעוני העונתי (139 ש"ח) או את זר החמניות (149) — שמחים ותמיד עושים חיוך.',
      'למשהו שעושה "וואו" בכניסה — זר האירוע המפואר ב-349, או העונתי בגודל שופע.',
    ],
  },
  {
    name: "romantic",
    keywords: ["רומנטי", "אהבה", "בת זוג", "בן זוג", "אישה שלי", "בעל שלי", "חברה שלי", "חבר שלי", "נישואין", "דייט", "התנצלות", "לפייס"],
    replies: [
      'לרגעים רומנטיים הקלאסיקה מנצחת: זר ורדים אדומים (159 ש"ח). ואם רוצים משהו פחות צפוי — אירוסים וורדים לבנים (219) ממש מרגש.',
      "ורדים אדומים זה תמיד בטוח, אבל אם את/ה רוצה שזה ייראה אישי יותר — האירוסים הסגולים שלנו עושים רושם אחר לגמרי.",
    ],
  },
  {
    name: "sympathy",
    keywords: ["ניחומים", "לוויה", "שבעה", "פטירה", "נפטר", "נפטרה", "השתתפות בצער"],
    replies: [
      'משתתפת בצער. הזר שלנו לרגעים כאלה הוא הלבן-סגול (179 ש"ח) — רגוע, מכובד, בלי צבעים צועקים ובלי ריח חזק.',
      "מצטערת לשמוע. יש לנו זר ניחומים שנבנה בדיוק לרגישות הזו, ואפשר לצרף אליו ברכה מכובדת.",
    ],
  },
  {
    name: "thanks_gift",
    keywords: ["תודה ל", "להודות", "מתנת תודה", "להגיד תודה", "מורה", "מטפלת", "רופא"],
    replies: [
      'ל"תודה" יש לנו זר קטן ועדין ב-99 ש"ח — בדיוק במידה, לא מוגזם ולא קמצני.',
      "זר התודה שלנו הוא הכי מבוקש למתנות כאלה. עם ברכה קצרה ואישית זה ממש קולע.",
    ],
  },
  {
    name: "wedding",
    keywords: ["חתונה", "אירוע", "בר מצווה", "בת מצווה", "ברית", "כנס", "עיצוב אולם"],
    replies: [
      'לאירועים יש לנו את הזר המפואר (349 ש"ח), ובגודל שופע הוא באמת עושה רושם. מתי האירוע?',
      "אירועים זה משהו שאנחנו אוהבים במיוחד — אפשר להתאים צבעים וסגנון. לתכנון מלא שווה לעבור למיכאל שיחבר אתכם לוואטסאפ.",
    ],
  },
  {
    name: "care",
    keywords: ["כמה זמן מחזיק", "לטפל", "טיפול", "אגרטל", "להחזיק", "נובל", "מים"],
    replies: [
      "בכל עמוד מוצר יש לשונית 'המלצות לשזירה וטיפול באגרטל' עם הוראות לזר הספציפי. הכלל הכי חשוב: חיתוך אלכסוני והחלפת מים כל יומיים.",
      "רוב הזרים שלנו מחזיקים 7–12 יום עם טיפול נכון. הסוד הוא מים נקיים והרחקה משמש ישירה ומפירות מבשילים.",
    ],
  },
  {
    name: "signature",
    keywords: ["למה אירוס", "מה זה איריס", "שם המותג", "למה קוראים", "הסיפור שלכם", "מי אתם"],
    replies: [
      "השם הגיע מפרח האירוס הסגול — הוא נותן לנו את הצבע ואת החתימה. תמצא/י אותו כמעט בכל זר שאנחנו מרכיבים 🌸",
      "אנחנו בוטיק קטן בקריית אתא. כל זר נבנה ידנית לפי ההזמנה.",
    ],
  },
  {
    name: "thanks",
    keywords: ["תודה רבה", "מעולה", "אחלה", "יופי", "סבבה", "מושלם", "תודה", "אלוף"],
    replies: ["בשמחה! 🌸 אם צריך עוד משהו, אני כאן.", "כיף לעזור! שיהיה לך יום מהמם."],
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

function agamReply(message) {
  const a = AGENTS.agam;
  const intent = chatDetectIntent(message);
  const budgetReply = chatBudgetReply(message, intent);
  if (budgetReply) {
    a.lastIntent = intent ? intent.name : "budget";
    return budgetReply;
  }
  if (intent) {
    let reply = pickFresh(intent.replies, intent.name);
    if (intent.name === a.lastIntent && Math.random() > 0.5) {
      reply += " " + FOLLOW_UPS[Math.floor(Math.random() * FOLLOW_UPS.length)];
    }
    a.lastIntent = intent.name;
    return reply;
  }
  a.lastIntent = null;
  return pickFresh(CHAT_FALLBACK, "fallback");
}

function toggleChat() {
  const opened = agentTogglePanel("agam");
  if (opened && AGENTS.agam.history.length === 0) {
    agentSay("agam", "היי, אני אגם 🌸 היועצת של פרחי איריס.\nהתפקיד שלי הוא לעזור לך לבחור בדיוק את הזר הנכון — לפי האירוע, האדם והתקציב.\nבמה נתחיל?");
    agamMenu();
  }
}

function agamMenu() {
  agentMenu("agam", [
    { icon: "🎁", label: "התאמת זר לפי אירוע", action: "agamPick('event')" },
    { icon: "💰", label: "המלצה לפי תקציב", action: "agamPick('budget')" },
    { icon: "🌿", label: "שאלה על טיפול בפרחים", action: "agamPick('care')" },
  ]);
}

function agamPick(kind) {
  agentClearWidgets("agam");
  if (kind === "event") {
    agentAdd("agam", "התאמת זר לפי אירוע", "user");
    agentSay("agam", "מעולה. לאיזה אירוע זה — יום הולדת, רומנטי, תודה, ניחומים או אירוע גדול?\nתכתוב/י לי במילים שלך ואני אתאים.");
  } else if (kind === "budget") {
    agentAdd("agam", "המלצה לפי תקציב", "user");
    agentSay("agam", "פשוט תכתוב/י לי סכום — למשל 150 — ואני אראה לך מה הכי יפה שאפשר לקבל בו.");
  } else {
    agentAdd("agam", "שאלה על טיפול בפרחים", "user");
    agentSay("agam", "תשאל/י אותי כל דבר — כמה זמן הזר מחזיק, איזה אגרטל, כל כמה זמן להחליף מים. בכל עמוד מוצר יש גם לשונית טיפול מלאה.");
  }
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
    agentSay("agam", agamReply(text));
    agamMenu();
  }, 520 + Math.random() * 520);
}

/* ============================================================
   מיכאל — תמיכה טכנית, משלוחים ומעקב הזמנות
   ============================================================ */
const ORDER_STATES = [
  { label: "התקבלה", text: (n) => `הזמנה ${n} התקבלה ונקלטה במערכת ✅\nהיא ממתינה לשזירה ותיכנס לעבודה בבוקר הקרוב. אם צריך לשנות משהו — עכשיו זה הרגע הכי קל.` },
  { label: "בשזירה", text: (n) => `הזמנה ${n} נמצאת כרגע בשזירה 🌿\nהפרחים נבחרו הבוקר והזר מורכב ידנית ברגעים אלה.` },
  { label: "יצאה לשליח", text: (n) => `הזמנה ${n} כבר בדרך 🚚\nהזר יצא עם השליח ואמור להגיע בטווח השעות שנבחר. אם אף אחד לא יהיה בבית — השליח ייצור קשר טלפוני.` },
  { label: "נמסרה", text: (n) => `הזמנה ${n} נמסרה בהצלחה 🌸\nמקווה שהזר עשה בדיוק את הרושם שרצית. אם משהו לא היה מושלם — ספר/י לי ונטפל בזה מיד.` },
];

const TECH_FAQ = [
  { keywords: ["לא נטען", "לא עולה", "תקוע", "נתקע", "שגיאה", "לא עובד", "באג", "קורס"], reply: "בוא ננסה את הבסיס: רענון עם Ctrl+F5 (או משיכה למטה בנייד) פותר את רוב המקרים, כי הוא מנקה גרסה ישנה שנתקעה בזיכרון. אם זה ממשיך — תאר/י לי מה בדיוק קורה ובאיזה מכשיר." },
  { keywords: ["עגלה", "סל", "נעלם", "התרוקן", "לא נשמר"], reply: "העגלה נשמרת בדפדפן שלך בלבד. היא מתאפסת אם גלשת במצב פרטי, ניקית היסטוריה, או עברת למכשיר אחר. אם היא נעלמה באותו דפדפן — ספר/י לי ואבדוק." },
  { keywords: ["תמונה", "תמונות", "לא נראה", "לא מוצג", "ריק"], reply: "אם תמונות לא נטענות זה כמעט תמיד חיבור אינטרנט איטי או חוסם פרסומות אגרסיבי. נסה/י לרענן או לכבות את החוסם לרגע." },
  { keywords: ["תשלום", "אשראי", "כרטיס", "חיוב", "לשלם", "סליקה"], reply: "האתר כרגע במצב הדגמה — לא מתבצע חיוב אמיתי בכרטיס, וזה בכוונה. ההזמנה נרשמת אצלנו ואנחנו חוזרים אליך לתיאום ותשלום." },
  { keywords: ["ביטול", "לבטל", "לשנות", "שינוי"], reply: "אפשר לבטל או לשנות עד 3 שעות לפני מועד המשלוח. הכי מהיר — לפנות אלינו בוואטסאפ עם מספר ההזמנה, ואני אעביר את זה מיד." },
  { keywords: ["משלוח", "שליח", "מתי מגיע", "זמן אספקה", "עד מתי", "אזור"], reply: `אנחנו מחלקים בקריית אתא, חיים, ביאליק, מוצקין וים — משלוח באותו יום בהזמנה מוקדמת. לחיפה ולנשר מגיעים בהזמנות מעל ₪${LARGE_ORDER_MIN}. אפשר לבדוק כתובת מדויקת בבודק אזור החלוקה בעמוד הבית.` },
  { keywords: ["כתובת", "איפה אתם", "להגיע", "חנות", "ניווט", "waze", "וייז"], reply: `החנות נמצאת ב${SHOP_ADDRESS}. יש באתר קטע "איך מגיעים אלינו" עם כפתורי ניווט ל-Waze ול-Google Maps.` },
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

function toggleSupport() {
  const opened = agentTogglePanel("michael");
  if (opened && AGENTS.michael.history.length === 0) {
    agentSay("michael", "היי, אני מיכאל 🛠️ התמיכה של פרחי איריס.\nאני כאן לתקלות באתר, לשאלות על משלוחים, למעקב אחרי הזמנה ולחיבור מהיר לוואטסאפ של החנות.\nבמה לעזור?");
    michaelMenu();
  }
}

function michaelMenu() {
  agentMenu("michael", [
    { icon: "📦", label: "מעקב אחר הזמנה", action: "michaelPick('track')" },
    { icon: "🚚", label: "שאלות על משלוחים ואזורי חלוקה", action: "michaelPick('delivery')" },
    { icon: "🛠️", label: "תקלה טכנית באתר", action: "michaelPick('tech')" },
    { icon: "💬", label: "מעבר לוואטסאפ של החנות", action: "openShopWhatsApp()" },
  ]);
}

function michaelPick(kind) {
  const m = AGENTS.michael;
  agentClearWidgets("michael");
  m.mode = kind;
  if (kind === "track") {
    agentAdd("michael", "מעקב אחר הזמנה", "user");
    agentSay("michael", "בשמחה 📦 הקלד/י את מספר ההזמנה ואבדוק עבורך.\nהמספר מופיע באישור ההזמנה ונראה כך: IRIS-DEMO-123456");
  } else if (kind === "delivery") {
    agentAdd("michael", "שאלות על משלוחים", "user");
    agentSay("michael", `אזורי החלוקה הרגילים: קריית אתא, קריית חיים, קריית ביאליק, קריית מוצקין וקריית ים.\nלחיפה ולנשר מגיעים בהזמנות מעל ₪${LARGE_ORDER_MIN}.\nתכתוב/י לי כתובת או עיר ואבדוק, או השתמש/י בבודק אזור החלוקה בעמוד הבית.`);
  } else {
    agentAdd("michael", "תקלה טכנית באתר", "user");
    agentSay("michael", "תאר/י לי מה קורה — מה ניסית לעשות, מה קיבלת, ובאיזה מכשיר. אני אנסה לפתור מיד.");
  }
  agentChips("michael", [
    { label: "חזרה לתפריט", action: "michaelMenu()" },
    { label: "וואטסאפ", action: "openShopWhatsApp()" },
  ]);
}

function michaelReply(text) {
  const m = AGENTS.michael;

  if (m.mode === "track") {
    const orderNumber = extractOrderNumber(text);
    if (!orderNumber) {
      return "לא הצלחתי לזהות מספר הזמנה בהודעה 🙂\nהוא מורכב מספרות ונראה כך: IRIS-DEMO-123456. אפשר גם להקליד רק את הספרות.";
    }
    m.lastOrder = orderNumber;
    return orderStatusFor(orderNumber).text(orderNumber) + "\n\n(האתר במצב הדגמה — הסטטוס כאן לדוגמה בלבד. למעקב אמיתי אפשר לעבור לוואטסאפ.)";
  }

  const area = typeof checkDeliveryArea === "function" ? checkDeliveryArea(text) : null;
  if (area) {
    return area.tier === "core"
      ? `כן, מגיעים ל${area.area} — ${area.info}.`
      : `ל${area.area} אנחנו מגיעים, אבל ${area.info}. מתחת לסכום הזה אפשר לתאם איסוף עצמי מהחנות ב${SHOP_ADDRESS}.`;
  }

  const t = (text || "").toLowerCase();
  const faq = TECH_FAQ.find((f) => f.keywords.some((k) => t.includes(k)));
  if (faq) return faq.reply;

  return "לא בטוח שהבנתי — תוכל/י לנסח קצת אחרת?\nאני מטפל בתקלות באתר, במשלוחים ובמעקב הזמנות. לשאלות על בחירת זר — אגם בצד השני של המסך היא הכתובת 🌸";
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
    agentSay("michael", michaelReply(text));
    agentChips("michael", [
      { label: "חזרה לתפריט", action: "michaelMenu()" },
      { label: "וואטסאפ", action: "openShopWhatsApp()" },
    ]);
  }, 520 + Math.random() * 520);
}

/* ---------- וואטסאפ ---------- */
function openShopWhatsApp() {
  let text = "היי פרחי איריס! הגעתי מהאתר ואשמח לעזרה 🌸";
  const m = AGENTS.michael;
  if (m.mode === "track" && m.lastOrder) {
    text = `היי פרחי איריס! אשמח לבדוק סטטוס להזמנה ${m.lastOrder} 🌸`;
  } else if (m.mode === "tech") {
    text = "היי פרחי איריס! נתקלתי בתקלה באתר ואשמח לעזרה 🙏";
  }
  window.open(`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
