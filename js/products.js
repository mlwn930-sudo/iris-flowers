/* ============================================================
   פרחי איריס — קטלוג מוצרים
   התמונות הן צילומי סטוק להדגמה (assets/products/) —
   להחלפה בצילומים אמיתיים של החנות כשיתקבלו מבעלת העסק.

   תמונה נפרדת לכל גודל זר:
   כל מוצר מצפה ל-3 קבצים בתיקיית assets/products/ לפי התבנית
   <id>-s.jpg  (קלאסי) · <id>-m.jpg (מורחב) · <id>-l.jpg (שופע)
   אם קובץ חסר — האתר נופל אוטומטית לתמונה הראשית ולא נשבר.
   ============================================================ */

/* ---------- גדלי זר ---------- */
const SIZES = [
  {
    id: "standard",
    label: "קלאסי",
    en: "Standard",
    suffix: "s",
    mult: 1,
    note: "הזר כפי שאנחנו מרכיבים אותו בחנות — מאוזן, נקי, מתאים לכל שולחן.",
  },
  {
    id: "deluxe",
    label: "מורחב",
    en: "Deluxe",
    suffix: "m",
    mult: 1.25,
    note: "שכבת פרחים וירק נוספת. נוכחות גדולה יותר בחדר, בלי לאבד את העדינות.",
  },
  {
    id: "premium",
    label: "שופע",
    en: "Premium",
    suffix: "l",
    mult: 1.5,
    note: "הגרסה המלאה שלנו — לאירועים, לרגעים הגדולים, ולפעמים שרוצים שזה יעצור את הנשימה.",
  },
];

const DEFAULT_SIZE = "standard";

function findSize(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

function priceFor(product, sizeId) {
  if (product.fixedPrices) return product.fixedPrices[sizeId] ?? product.price;
  return Math.round(product.price * findSize(sizeId).mult);
}

/* ---------- דמי משלוח ----------
   המספרים האלה מופיעים אוטומטית בכל מקום באתר:
   בכרטיס המוצר, בחלון המוצר, בעגלה, בקופה ובעמוד המדיניות.
   שינוי כאן = שינוי בכל האתר. */
const DELIVERY_FEE = 29;
const FREE_DELIVERY_OVER = 250;

function deliveryFeeFor(subtotal) {
  return subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
}

/** "משלוח ₪29 · חינם מעל ₪250" — ניסוח אחיד לכל האתר */
function deliveryFeeText(subtotal) {
  if (typeof subtotal === "number" && subtotal >= FREE_DELIVERY_OVER) return "משלוח חינם";
  return `משלוח ₪${DELIVERY_FEE} · חינם בהזמנה מעל ₪${FREE_DELIVERY_OVER}`;
}

/* ---------- מדיניות החלפת פרחים לפי עונה ----------
   הסיבה מספר 1 לתלונות בחנויות פרחים: הלקוח מזמין זר מהתמונה
   ומקבל זר עם פרח אחר. זה קורה בכל חנות פרחים בעולם, כי פרחים
   הם חקלאות ולא מלאי. ההבדל הוא אם כתבנו את זה מראש. */
const SEASON_POLICY = {
  title: "התאמה עונתית — מה שאנחנו מבטיחים",
  body:
    "פרחים הם חקלאות, לא מלאי במחסן. אם פרח מסוים לא הגיע טרי בבוקר המשלוח, " +
    "אנחנו מחליפים אותו בפרח מקביל באותו גוון, באותו גודל ובאותו ערך או גבוה ממנו — לעולם לא פחות. " +
    "התמונה באתר היא הדגמה של הסגנון, לא חוזה על גבעול מסוים.",
  promise: [
    "אותה פלטת צבעים ואותו גודל זר — תמיד.",
    "ערך הפרח המחליף שווה או גבוה מהמקורי.",
    "בשינוי מהותי (למשל: אין אירוסים היום) — מתקשרים לפני שיוצאים למשלוח.",
    "לא אהבתם את ההחלפה? מודיעים לנו תוך 24 שעות ואנחנו מסדרים את זה.",
  ],
};

/* ---------- אירועים ----------
   ככה אנשים באמת קונים פרחים: לא "ורדים" אלא "משהו לאמא שלי". */
const OCCASIONS = [
  { id: "love", label: "אהבה ורומנטיקה", emo: "❤️" },
  { id: "birthday", label: "יום הולדת", emo: "🎂" },
  { id: "thanks", label: "תודה", emo: "🙏" },
  { id: "congrats", label: "מזל טוב והצלחה", emo: "🎉" },
  { id: "newborn", label: "לידה", emo: "👶" },
  { id: "recovery", label: "החלמה", emo: "💐" },
  { id: "sympathy", label: "ניחומים", emo: "🕊️" },
  { id: "wedding", label: "חתונה ואירוע", emo: "💍" },
  { id: "home", label: "מתנה לבית או למשרד", emo: "🏡" },
];

/* ---------- טווחי תקציב ---------- */
const BUDGETS = [
  { id: "b1", label: "עד ₪150", min: 0, max: 150 },
  { id: "b2", label: "₪150–₪250", min: 150, max: 250 },
  { id: "b3", label: "₪250 ומעלה", min: 250, max: Infinity },
];

function budgetOf(product) {
  const p = product.price;
  const band = BUDGETS.find((b) => p >= b.min && p < b.max);
  return band ? band.id : "b3";
}

/* מוצרים שכבר קיימות עבורם 3 תמונות לפי גודל בתיקיית assets/products/
   בתבנית <id>-s.jpg / <id>-m.jpg / <id>-l.jpg.
   כדי להפעיל מוצר — פשוט הסירו את סימן ההערה מהשורה שלו. */
const SIZED_IMAGE_PRODUCTS = new Set([
  "red-roses-classic",
  // "iris-signature",
  // "iris-white-rose",
  // "pastel-roses",
  // "seasonal-mix",
  // "sunflower-sun",
  // "event-luxury",
  // "thank-you-small",
  // "sympathy-white",
  // "orchid-plant",
]);

/** תמונה לפי גודל — assets/products/<id>-<s|m|l>.jpg, עם נפילה לתמונה הראשית */
function imageFor(product, sizeId) {
  if (!SIZED_IMAGE_PRODUCTS.has(product.id)) return product.img;
  return `assets/products/${product.id}-${findSize(sizeId).suffix}.jpg`;
}

/** רשימת ההרכב לגודל מסוים: [[שם הפריט, כמות], ...] */
function compositionFor(product, sizeId) {
  return (product.composition && product.composition[sizeId]) || [];
}

/** סך הגבעולים בזר לגודל מסוים — מחושב מההרכב, לא נתון קשיח.
    במוצר שבו סכום כל הפריטים חסר משמעות (עציץ למשל) אפשר להגדיר
    totalItem = אינדקס הפריט שקובע את המניין. */
function stemCount(product, sizeId) {
  const items = compositionFor(product, sizeId);
  if (!items.length) return 0;
  if (typeof product.totalItem === "number") return items[product.totalItem][1];
  return items.reduce((sum, item) => sum + item[1], 0);
}

/** "כ-19 גבעולים" / "2 גבעולי פריחה" */
function stemLabel(product, sizeId) {
  const n = stemCount(product, sizeId);
  if (!n) return "";
  return `${n} ${product.unitLabel || "גבעולים"}`;
}

/* ---------- מוצרים ---------- */
const PRODUCTS = [
  {
    id: "iris-signature",
    name: "זר האירוס הסגול",
    tag: "חתימת פרחי איריס",
    category: "signature",
    desc: "הזר שעליו נבנה המותג — אירוסים סגולים טריים, עטופים בעדינות עם ירק טבעי.",
    botanical:
      "אירוס הולנדי בגוון סגול־מלכותי, עם לשון זהובה בלב הפרח. נקטף בשלב הניצן הפתוח־למחצה, כך שהוא ממשיך להיפתח אצלכם בבית במשך יומיים־שלושה — ואז מגיע הרגע היפה ביותר שלו.",
    price: 189,
    oldPrice: null,
    img: "assets/products/iris-signature.jpg",
    badges: ["הכי נמכר", "טרי מהבוקר"],
    composition: {
      standard: [["אירוס סגול", 9], ["אקליפטוס כסוף", 3], ["ירק עונתי", 2]],
      deluxe: [["אירוס סגול", 12], ["אקליפטוס כסוף", 4], ["ירק עונתי", 3], ["ליזיאנטוס לבן", 2]],
      premium: [["אירוס סגול", 16], ["אקליפטוס כסוף", 6], ["ירק עונתי", 4], ["ליזיאנטוס לבן", 4]],
    },
    care: [
      "חתכו 2 ס״מ מהגבעול באלכסון, עם סכין חדה ולא במספריים.",
      "מים קרים עד גובה שליש האגרטל — אירוסים לא אוהבים מים עמוקים.",
      "החליפו מים כל יומיים והרחיקו מאור שמש ישיר ומפירות מבשילים.",
      "ניצנים סגורים ייפתחו תוך 24–48 שעות בטמפרטורת החדר.",
    ],
    vase: "אגרטל צר וגבוה, שיחזיק את הגבעולים זקופים.",
  },
  {
    id: "iris-white-rose",
    name: "אירוסים וורדים לבנים",
    tag: null,
    category: "signature",
    desc: "שילוב עדין של אירוסים סגולים וורדים לבנים — קלאסי ומרגש.",
    botanical:
      "ורדי גן לבנים־שמנת בשילוב אירוסים סגולים ועלי אקליפטוס כסופים. הניגוד בין הלבן הרך לסגול העמוק הוא מה שהופך את הזר הזה למתנה שנזכרים בה — אלגנטי בלי להיות מוגזם.",
    price: 219,
    oldPrice: 249,
    img: "assets/products/iris-white-rose.jpg",
    badges: ["טרי מהבוקר"],
    composition: {
      standard: [["ורד לבן", 7], ["אירוס סגול", 4], ["אקליפטוס כסוף", 3]],
      deluxe: [["ורד לבן", 9], ["אירוס סגול", 5], ["אקליפטוס כסוף", 4], ["גיבסנית", 2]],
      premium: [["ורד לבן", 12], ["אירוס סגול", 7], ["אקליפטוס כסוף", 5], ["גיבסנית", 4]],
    },
    care: [
      "הסירו עלים שנמצאים מתחת לקו המים — הם מזרזים ריקבון.",
      "חתכו את הגבעולים באלכסון והחליפו מים כל 48 שעות.",
      "ורדים לבנים רגישים לחום — שמרו אותם הרחק מתנור, מזגן וחלון דרומי.",
      "אם עלה חיצוני נפגם, הסירו אותו בעדינות — הפרח ייראה רענן שוב.",
    ],
    vase: "אגרטל רחב עם פתח בינוני, שיאפשר לזר להתפרש.",
  },
  {
    id: "red-roses-classic",
    name: "זר ורדים אדומים קלאסי",
    tag: null,
    category: "roses",
    desc: "12 ורדים אדומים טריים, זר מושלם לרגעים רומנטיים.",
    botanical:
      "ורדים אדומים בגוון עמוק וקטיפתי, עם גיבסנית לבנה שמוסיפה קלילות ואוויר. הקלאסיקה שלא מתיישנת — הזר שאומר בדיוק מה שהתכוונתם, בלי להסביר.",
    price: 159,
    oldPrice: null,
    img: "assets/products/red-roses-classic.jpg",
    badges: ["הכי נמכר"],
    composition: {
      standard: [["ורד אדום", 12], ["ענפי גיבסנית", 4], ["עלי רוסקוס", 3]],
      deluxe: [["ורד אדום", 15], ["ענפי גיבסנית", 5], ["עלי רוסקוס", 4]],
      premium: [["ורד אדום", 18], ["ענפי גיבסנית", 7], ["עלי רוסקוס", 5]],
    },
    care: [
      "חתכו את הגבעולים מתחת למים זורמים — זה מונע בועות אוויר.",
      "מים בטמפרטורת החדר, לא קרים מדי.",
      "הסירו את העלה החיצוני המגן אם הוא נראה כהה — מתחתיו הוורד מושלם.",
      "ריסוס עדין של מים על העלים בבוקר מאריך את הפריחה.",
    ],
    vase: "אגרטל גבוה וצר שיתמוך בגבעולים הארוכים.",
  },
  {
    id: "pastel-roses",
    name: "זר ורדים פסטל",
    tag: null,
    category: "roses",
    desc: "ורדים בגווני אפרסק וורוד רך, עדינים ומלאי אור.",
    botanical:
      "ורדי גן בגווני ורוד־אבקה, אפרסק ושמנת, משולבים עם פרחי לוואי לבנים. זר שנראה כאילו צולם באור בוקר — רך, נשי, ומאיר כל חדר שהוא נכנס אליו.",
    price: 169,
    oldPrice: null,
    img: "assets/products/pastel-roses.jpg",
    badges: [],
    composition: {
      standard: [["ורד ורוד־אבקה", 8], ["ורד אפרסק", 4], ["ליזיאנטוס לבן", 3], ["ירק רך", 2]],
      deluxe: [["ורד ורוד־אבקה", 10], ["ורד אפרסק", 5], ["ליזיאנטוס לבן", 4], ["ירק רך", 3]],
      premium: [["ורד ורוד־אבקה", 12], ["ורד אפרסק", 7], ["ליזיאנטוס לבן", 6], ["ירק רך", 4]],
    },
    care: [
      "חדשו את החיתוך כל 2–3 ימים כדי שהגבעול ימשיך לשתות.",
      "מים נקיים בלבד — אגרטל עכור מקצר את חיי הזר בחצי.",
      "גווני פסטל דוהים מהר בשמש — מקום מוצל ישמור עליהם.",
      "בלילה אפשר להעביר את האגרטל למקום קריר, זה מוסיף ימים.",
    ],
    vase: "אגרטל עגול ונמוך, שייתן לזר להתפרש כמו כרית.",
  },
  {
    id: "seasonal-mix",
    name: "זר צבעוני עונתי",
    tag: "פופולרי",
    category: "seasonal",
    desc: "מבחר הפרחים הטריים ביותר של השבוע — כל זר קצת שונה, כולם קסומים.",
    botanical:
      "הרכב שמשתנה כל שבוע לפי מה שהגיע הכי טרי מהשדה: חרציות, ורדי ענף, ציפורן, מרגניות וירק עונתי. אף זר לא זהה לקודמו — וזה בדיוק היופי שבו.",
    price: 139,
    oldPrice: null,
    img: "assets/products/seasonal-mix.jpg",
    badges: ["טרי מהבוקר", "משלוח מהיר"],
    composition: {
      standard: [["חרצית", 5], ["ורד ענף", 4], ["ציפורן", 3], ["מרגנית", 2], ["ירק עונתי", 3]],
      deluxe: [["חרצית", 6], ["ורד ענף", 5], ["ציפורן", 4], ["מרגנית", 3], ["ירק עונתי", 4]],
      premium: [["חרצית", 8], ["ורד ענף", 7], ["ציפורן", 5], ["מרגנית", 4], ["ירק עונתי", 5]],
    },
    care: [
      "בזר מעורב יש פרחים עם קצב שונה — הוציאו פרח שנבל, השאר ימשיכו.",
      "מים עד אמצע האגרטל, החלפה כל יומיים.",
      "אם קיבלתם שקית מזון לפרחים — היא באמת עושה הבדל.",
      "סובבו את האגרטל פעם ביום כדי שהזר ייפתח אחיד.",
    ],
    vase: "אגרטל זכוכית בינוני — הצבעים נראים הכי טוב על רקע שקוף.",
  },
  {
    id: "sunflower-sun",
    name: "זר חמניות שמש",
    tag: null,
    category: "seasonal",
    desc: "חמניות גדולות ושמחות — הזר שמכניס אור לכל חדר.",
    botanical:
      "חמניות בקוטר מלא עם לב חום־שוקולד ועלי כותרת בצהוב עמוק. הפרח היחיד שממש פונה אל האור — ולכן גם הזר שהכי קשה להישאר עצוב לידו.",
    price: 149,
    oldPrice: null,
    img: "assets/products/sunflower-sun.jpg",
    badges: ["טרי מהבוקר"],
    composition: {
      standard: [["חמנייה", 5], ["ציפורן צהובה", 2], ["ירק עונתי", 3]],
      deluxe: [["חמנייה", 7], ["ציפורן צהובה", 3], ["ירק עונתי", 4]],
      premium: [["חמנייה", 9], ["ציפורן צהובה", 4], ["ירק עונתי", 5], ["אקליפטוס", 2]],
    },
    care: [
      "חמניות שותות הרבה — בדקו את מפלס המים כל יום.",
      "אגרטל כבד ויציב, הראשים כבדים והזר עלול להתהפך.",
      "הסירו עלים תחתונים, הם נובלים ראשונים ומעכירים את המים.",
      "אור עקיף חזק דווקא מיטיב איתן, בשונה מרוב הפרחים.",
    ],
    vase: "אגרטל רחב וכבד — קרמיקה או זכוכית עבה.",
  },
  {
    id: "event-luxury",
    name: "זר לאירוע מפואר",
    tag: null,
    category: "events",
    desc: "זר גדול ומרשים לחתונות, ימי הולדת עגולים ואירועים מיוחדים.",
    botanical:
      "ורדי גן בגווני שמנת וורוד עתיק, גיבסנית וירק רך — בהרכב גדול ושופע. הזר שנועד להיות מצולם: מלא, סימטרי, ומחזיק יפה לאורך כל האירוע.",
    price: 349,
    oldPrice: 390,
    img: "assets/products/event-luxury.jpg",
    badges: [],
    composition: {
      standard: [["ורד גן שמנת", 10], ["ורד ורוד עתיק", 6], ["ענפי גיבסנית", 5], ["ירק רך", 4]],
      deluxe: [["ורד גן שמנת", 13], ["ורד ורוד עתיק", 8], ["ענפי גיבסנית", 6], ["ירק רך", 5]],
      premium: [["ורד גן שמנת", 16], ["ורד ורוד עתיק", 10], ["ענפי גיבסנית", 8], ["ירק רך", 6], ["הידראנגאה", 2]],
    },
    care: [
      "לאירוע — קבלו את הזר בבוקר האירוע ושמרו אותו במים עד הרגע האחרון.",
      "אם הזר עטוף לאחיזה, רססו מים על העלים אחת לכמה שעות.",
      "מקום קריר ומוצל לפני האירוע, לעולם לא ברכב חונה בשמש.",
      "אחרי האירוע — חיתוך רענן ומים נקיים יחזירו אותו לחיים.",
    ],
    vase: "אגרטל גדול ורחב, או דלי פרחים לפני האירוע.",
  },
  {
    id: "thank-you-small",
    name: 'זר "תודה" עדין',
    tag: null,
    category: "thanks",
    desc: "זר קטן וקסום שאומר תודה בדיוק כמו שצריך.",
    botanical:
      "הרכב קומפקטי של פרחים בגוון סגול־בורדו עם לב לבן, עטוף בנייר משי וסרט. קטן במידה, גדול בכוונה — בדיוק הגודל שאומר תודה בלי להביך את מי שמקבל.",
    price: 99,
    oldPrice: null,
    img: "assets/products/thank-you-small.jpg",
    badges: ["משלוח מהיר"],
    composition: {
      standard: [["חרצית סגולה", 6], ["חרצית לבנה", 3], ["ירק עדין", 2]],
      deluxe: [["חרצית סגולה", 8], ["חרצית לבנה", 4], ["ירק עדין", 3]],
      premium: [["חרצית סגולה", 10], ["חרצית לבנה", 5], ["ירק עדין", 4], ["ענפי גיבסנית", 2]],
    },
    care: [
      "זר קטן מתייבש מהר יותר — מים כל יום, לא כל יומיים.",
      "אגרטל קטן וצר שיחזיק את ההרכב הקומפקטי.",
      "הסירו את העטיפה לפני שמים במים, היא נועדה למשלוח בלבד.",
      "מקום מוצל ולא ליד מזגן.",
    ],
    vase: "כוס זכוכית או אגרטל קטן — הוא לא צריך יותר מזה.",
  },
  {
    id: "sympathy-white",
    name: "זר ניחומים לבן וסגול",
    tag: null,
    category: "sympathy",
    desc: "זר רגוע ומכבד, לבן וסגול, לרגעים של תמיכה ואהבה.",
    botanical:
      "חרציות לבנות בלב הזר, מוקפות בגוון סגול עמוק ובעטיפה מאופקת. בלי צבעים צועקים ובלי ריח חזק — זר שנועד להיות נוכח בחדר בלי לתפוס את מרכזו.",
    price: 179,
    oldPrice: null,
    img: "assets/products/sympathy-white.jpg",
    badges: [],
    composition: {
      standard: [["חרצית לבנה", 8], ["חרצית סגולה", 4], ["ירק מאופק", 3]],
      deluxe: [["חרצית לבנה", 10], ["חרצית סגולה", 5], ["ירק מאופק", 4]],
      premium: [["חרצית לבנה", 13], ["חרצית סגולה", 7], ["ירק מאופק", 5], ["ליזיאנטוס לבן", 2]],
    },
    care: [
      "חרציות מחזיקות מעמד זמן רב — לרוב 10–14 יום.",
      "מים רדודים ונקיים, החלפה כל יומיים.",
      "הסירו פרחים בודדים שנבלו כדי שהזר יישאר מכובד.",
      "מקום קריר יאריך אותו משמעותית.",
    ],
    vase: "אגרטל פשוט ואטום, בלבן או בזכוכית שקופה.",
  },
  {
    id: "orchid-plant",
    name: "עציץ סחלב סגול",
    tag: null,
    category: "plants",
    desc: "סחלב מרשים בעציץ מעוצב — מתנה שנשארת ופורחת שוב ושוב.",
    botanical:
      "פלנופסיס בגוון מגנטה־סגול, בעציץ קרמי תואם. בניגוד לזר, הסחלב לא נפרד מכם אחרי שבוע — הוא פורח חודשיים־שלושה, נח, ואז פורח שוב. מתנה שממשיכה.",
    price: 129,
    oldPrice: null,
    img: "assets/products/orchid-plant.jpg",
    badges: [],
    unitLabel: "גבעולי פריחה",
    totalItem: 0,
    composition: {
      standard: [["גבעול פריחה", 1], ["פרחים פתוחים", 6], ["ניצנים לפתיחה", 2]],
      deluxe: [["גבעול פריחה", 2], ["פרחים פתוחים", 11], ["ניצנים לפתיחה", 4]],
      premium: [["גבעול פריחה", 3], ["פרחים פתוחים", 17], ["ניצנים לפתיחה", 6]],
    },
    care: [
      "השקיה אחת לשבוע בלבד — סחלב מת מהצפה, לא מיובש.",
      "טבלו את העציץ במים ל-10 דקות ותנו לו להתנקז לגמרי.",
      "אור עקיף חזק, לעולם לא שמש ישירה על העלים.",
      "אחרי שהפריחה נגמרה — גזרו את הגבעול מעל הפרק השני והוא יפרח שוב.",
    ],
    vase: "נשאר בעציץ שלו — רק ודאו שיש ניקוז.",
  },
];

/* ---------- תוספות לקטלוג ---------- */
PRODUCTS.push(
  {
    id: "peony-romance",
    name: "זר פיוניות ורודות",
    tag: "חדש",
    category: "roses",
    desc: "פיוניות מלאות בגוון ורוד־אבקה — הפרח הכי מפנק שיש לנו.",
    botanical:
      "פיוניה בשיא הפריחה, עם עשרות עלי כותרת משיים שנפתחים בהדרגה. היא מגיעה אלינו רק בעונה הקצרה שלה, ולכן כל זר פיוניות הוא קצת אירוע.",
    price: 229,
    oldPrice: null,
    img: "assets/products/peony-romance.jpg",
    badges: ["עונתי"],
    composition: {
      standard: [["פיוניה ורודה", 7], ["ליזיאנטוס לבן", 3], ["ירק רך", 3]],
      deluxe: [["פיוניה ורודה", 9], ["ליזיאנטוס לבן", 4], ["ירק רך", 4]],
      premium: [["פיוניה ורודה", 12], ["ליזיאנטוס לבן", 6], ["ירק רך", 5]],
    },
    care: [
      "פיוניות מגיעות כניצן סגור וייפתחו תוך יום־יומיים — זה נורמלי.",
      "מים קרים ושינוי כל יומיים.",
      "אם ניצן מתקשה להיפתח, טבלו אותו בעדינות במים פושרים לדקה.",
      "הרחיקו מחום — הן נפתחות מהר מדי ונובלות.",
    ],
    vase: "אגרטל רחב עם פתח גדול — הן צריכות מקום להתפרש.",
  },
  {
    id: "tulip-spring",
    name: "זר צבעונים",
    tag: null,
    category: "seasonal",
    desc: "צבעונים רעננים בגווני ורוד — פשוט, נקי ומלא אביב.",
    botanical:
      "צבעוני הולנדי עם גבעול גמיש שממשיך לגדול גם באגרטל. הזר הזה משנה את הצורה שלו כל יום — וזה בדיוק הקסם שלו.",
    price: 129,
    oldPrice: null,
    img: "assets/products/tulip-spring.jpg",
    badges: ["טרי מהבוקר"],
    composition: {
      standard: [["צבעוני", 12], ["ירק עונתי", 3]],
      deluxe: [["צבעוני", 16], ["ירק עונתי", 4]],
      premium: [["צבעוני", 21], ["ירק עונתי", 5]],
    },
    care: [
      "צבעונים ממשיכים לגדול באגרטל — קצרו אותם כל יומיים.",
      "מים רדודים בלבד, כ-5 ס״מ.",
      "הם נוטים אל האור, אז סובבו את האגרטל כדי שיישארו זקופים.",
      "מקום קריר יאריך אותם משמעותית.",
    ],
    vase: "אגרטל צר וגבוה שיחזיק את הגבעולים הרכים.",
  },
  {
    id: "teddy-roses",
    name: "ורדים ודובי",
    tag: "מתנה מושלמת",
    category: "gifts",
    desc: "זר ורדים אדומים עם דובי רך — הקומבינציה שתמיד עובדת.",
    botanical:
      "ורדים אדומים קטיפתיים לצד דובי פרווה איכותי. המתנה הזו עובדת בכל גיל — ליום הולדת, להתאהבות, או פשוט כדי לגרום למישהו לחייך.",
    price: 199,
    oldPrice: 235,
    img: "assets/products/teddy-roses.jpg",
    badges: ["הכי נמכר"],
    unitLabel: "פריטים",
    composition: {
      standard: [["ורד אדום", 9], ["דובי 20 ס״מ", 1], ["ענפי גיבסנית", 3]],
      deluxe: [["ורד אדום", 13], ["דובי 30 ס״מ", 1], ["ענפי גיבסנית", 4]],
      premium: [["ורד אדום", 18], ["דובי 40 ס״מ", 1], ["ענפי גיבסנית", 6], ["שוקולד בלגי", 1]],
    },
    care: [
      "הוציאו את הזר מהאריזה והכניסו למים מיד.",
      "הדובי לא אוהב מים — שמרו אותו בצד.",
      "חיתוך אלכסוני והחלפת מים כל יומיים.",
    ],
    vase: "אגרטל בינוני לוורדים, והדובי לצידו.",
  },
  {
    id: "flower-box",
    name: "קופסת פרחים מעוצבת",
    tag: null,
    category: "gifts",
    desc: "פרחים מסודרים בקופסה יוקרתית — מגיע מוכן, בלי צורך באגרטל.",
    botanical:
      "הרכב עשיר בקופסת קרטון קשיח עם ספוג לח בבסיס. היתרון הגדול: הקופסה שומרת על הפרחים לחים בלי אגרטל, אז אפשר לשלוח גם למשרד או למלון.",
    price: 249,
    oldPrice: null,
    img: "assets/products/flower-box.jpg",
    badges: ["ללא צורך באגרטל"],
    composition: {
      standard: [["הידראנגאה לבנה", 3], ["ורד שמנת", 6], ["פרחי לוואי", 5], ["ירק", 4]],
      deluxe: [["הידראנגאה לבנה", 4], ["ורד שמנת", 9], ["פרחי לוואי", 7], ["ירק", 5]],
      premium: [["הידראנגאה לבנה", 6], ["ורד שמנת", 12], ["פרחי לוואי", 9], ["ירק", 7]],
    },
    care: [
      "אל תוציאו את הפרחים מהקופסה — הם נעוצים בספוג לח.",
      "הוסיפו מעט מים לספוג כל 2–3 ימים.",
      "הרחיקו משמש ישירה ומרדיאטור.",
    ],
    vase: "לא נדרש — הקופסה היא הכלי.",
  },
  {
    id: "car-decor",
    name: "קישוט פרחים לרכב",
    tag: null,
    category: "events",
    desc: "סידור פרחים לרכב חתן־כלה או לרכב אירוע — מותקן על ידינו.",
    botanical:
      "סידור שטוח ויציב על בסיס ספוג, בגוונים לבן־ירוק או לפי בחירתכם. מותקן עם מגנטים וכוסות ואקום שלא פוגעים בצבע הרכב, ומוסר בסוף האירוע.",
    price: 389,
    oldPrice: null,
    img: "assets/products/car-decor.jpg",
    badges: ["כולל התקנה"],
    unitLabel: "פריטים",
    totalItem: 0,
    composition: {
      standard: [["סידור מכסה מנוע", 1], ["ורדים לבנים", 14], ["ירק ואאוקליפטוס", 10]],
      deluxe: [["סידור מכסה מנוע + ידיות", 3], ["ורדים לבנים", 22], ["ירק ואאוקליפטוס", 16]],
      premium: [["סידור מלא לרכב", 5], ["ורדים לבנים", 34], ["ירק ואאוקליפטוס", 24], ["סרטי סאטן", 4]],
    },
    care: [
      "מומלץ לתאם התקנה לפחות 3 ימים מראש.",
      "ההתקנה מתבצעת בבוקר האירוע, כשעה לפני היציאה.",
      "בנסיעה מעל 80 קמ״ש מומלץ להוריד את הסידור הקדמי.",
    ],
    vase: "לא נדרש — מותקן ישירות על הרכב.",
  },
  {
    id: "succulent-pot",
    name: "מארז סוקולנטים",
    tag: null,
    category: "plants",
    desc: "צמחי סוקולנט בעציצי קרמיקה — מתנה ירוקה שכמעט לא צריך לטפל בה.",
    botanical:
      "אכוורייה וסוקולנטים נוספים בעציצי קרמיקה מט. הם אוגרים מים בעלים, ולכן שורדים גם אצל מי ששוכח להשקות. מתנה מצוינת למשרד או לבית חדש.",
    price: 119,
    oldPrice: null,
    img: "assets/products/succulent-pot.jpg",
    badges: ["מתנה שנשארת"],
    unitLabel: "עציצים",
    totalItem: 0,
    composition: {
      standard: [["עציץ סוקולנט", 2], ["זני סוקולנט", 2], ["חצץ דקורטיבי", 1]],
      deluxe: [["עציץ סוקולנט", 3], ["זני סוקולנט", 3], ["חצץ דקורטיבי", 1]],
      premium: [["עציץ סוקולנט", 5], ["זני סוקולנט", 5], ["חצץ דקורטיבי", 1], ["מגש עץ", 1]],
    },
    care: [
      "השקיה אחת ל-10–14 יום, ורק כשהאדמה יבשה לגמרי.",
      "אור עקיף חזק — אדן חלון מזרחי הוא אידיאלי.",
      "אסור להשאיר מים בתחתית — זה הגורם מספר אחת למוות של סוקולנט.",
      "בחורף מפחיתים השקיה לאחת לחודש.",
    ],
    vase: "נשארים בעציצים שלהם.",
  }
);

/* ============================================================
   שיוך כל מוצר לאירועים
   ------------------------------------------------------------
   נשמר בנפרד מהמוצרים כדי שיהיה קל לערוך את זה בלי לגעת
   בפירוט ההרכב. מוצר שלא מופיע כאן — פשוט לא יעלה בסינון.
   ============================================================ */
const PRODUCT_OCCASIONS = {
  "iris-signature": ["love", "birthday", "congrats", "thanks", "home"],
  "iris-white-rose": ["love", "wedding", "congrats", "birthday", "sympathy"],
  "red-roses-classic": ["love", "birthday"],
  "pastel-roses": ["birthday", "newborn", "thanks", "recovery", "love"],
  "seasonal-mix": ["birthday", "thanks", "recovery", "home", "congrats"],
  "sunflower-sun": ["birthday", "recovery", "thanks", "home"],
  "event-luxury": ["wedding", "congrats", "birthday"],
  "thank-you-small": ["thanks", "recovery", "home"],
  "sympathy-white": ["sympathy"],
  // סחלב לבית האבלים הוא בחירה נפוצה ונכונה — הוא נשאר אחרי שהזרים נבלו
  "orchid-plant": ["home", "congrats", "thanks", "sympathy"],
  "peony-romance": ["love", "birthday", "wedding", "newborn"],
  "tulip-spring": ["birthday", "thanks", "recovery", "home"],
  "teddy-roses": ["love", "birthday", "newborn"],
  "flower-box": ["birthday", "congrats", "thanks", "home", "love"],
  "car-decor": ["wedding"],
  "succulent-pot": ["home", "congrats", "thanks"],
};

function occasionsOf(id) {
  return PRODUCT_OCCASIONS[id] || [];
}

/* ============================================================
   ביקורות לכל מוצר בנפרד
   ------------------------------------------------------------
   שם פרטי + עיר + חודש. ביקורת גנרית באתר לא משכנעת אף אחד;
   ביקורת עם שם ועיר מהאזור — כן. להחלפה בביקורות אמיתיות
   כשיצטברו (אפשר פשוט להוסיף שורות למערך).
   ============================================================ */
const PRODUCT_REVIEWS = {
  "iris-signature": [
    { stars: 5, text: "הזמנתי לאמא שלי ליום הולדת. היא שלחה לי תמונה של הזר על השולחן ואמרה שזה הזר הכי יפה שקיבלה בחיים. האירוסים החזיקו שמונה ימים.", by: "נועה ל׳", where: "קריית אתא", when: "לפני שבועיים" },
    { stars: 5, text: "הגיע בדיוק בשעה שביקשתי, עטוף יפה, עם הברכה שכתבתי. השליח אפילו חיכה שיפתחו את הדלת.", by: "רון מ׳", where: "קריית ביאליק", when: "לפני חודש" },
    { stars: 5, text: "לקחתי את המידה המורחבת ושווה כל שקל. הצבע הסגול הזה פשוט לא נראה כמו שום זר אחר.", by: "שירה כ׳", where: "קריית מוצקין", when: "לפני חודשיים" },
  ],
  "red-roses-classic": [
    { stars: 5, text: "12 ורדים, בדיוק כמו בתמונה. הזמנתי ביום האהבה שזה היום הכי עמוס בשנה והגיע בזמן.", by: "אורי ב׳", where: "חיפה", when: "לפני חודש" },
    { stars: 4, text: "הוורדים יפים מאוד והחזיקו שבוע. הגיע 20 דקות אחרי החלון שביקשתי, אבל עדכנו אותי מראש.", by: "מיכל ש׳", where: "נשר", when: "לפני 3 שבועות" },
  ],
  "iris-white-rose": [
    { stars: 5, text: "שילוב מנצח. קיבלתי המון מחמאות מהאורחים באירוע.", by: "דנה פ׳", where: "קריית ים", when: "לפני חודש" },
  ],
  "pastel-roses": [
    { stars: 5, text: "שלחתי לחברה אחרי לידה והיא התרגשה. הצבעים בדיוק כמו בתמונה, רכים ועדינים.", by: "יעל ג׳", where: "קריית חיים", when: "לפני שבוע" },
    { stars: 5, text: "התייעצתי בצ׳אט לגבי הגודל וקיבלתי המלצה מדויקת. שירות אישי ברמה אחרת.", by: "תמר א׳", where: "קריית אתא", when: "לפני חודשיים" },
  ],
  "seasonal-mix": [
    { stars: 5, text: "מזמינה כל חודש לבית. אף פעם לא אותו זר וזה בדיוק מה שאני אוהבת בזה.", by: "אורלי ד׳", where: "קריית ביאליק", when: "לקוחה קבועה" },
    { stars: 4, text: "מחיר מצוין ליופי הזה. חבל שאין תמונה של מה שיוצא בדיוק באותו שבוע.", by: "גיל נ׳", where: "חיפה", when: "לפני 3 שבועות" },
  ],
  "sunflower-sun": [
    { stars: 5, text: "קניתי לאבא שלי אחרי ניתוח. הוא אמר שזה האיר לו את החדר. החמניות ענקיות.", by: "אלון ר׳", where: "קריית מוצקין", when: "לפני חודש" },
  ],
  "event-luxury": [
    { stars: 5, text: "הזמנו לחתונה של אחותי. איריס הגיעה איתנו לתיאום, הביאה דוגמה מראש והכול היה מושלם ביום עצמו.", by: "משפחת ל׳", where: "קריית אתא", when: "לפני חודשיים" },
  ],
  "thank-you-small": [
    { stars: 5, text: "זר קטן שעושה רושם גדול. שלחתי למזכירה במשרד והיא הייתה המומה.", by: "ניר ט׳", where: "נשר", when: "לפני שבועיים" },
  ],
  "sympathy-white": [
    { stars: 5, text: "מכובד, שקט ובדיוק בטון הנכון. מעריך שלא ניסו למכור לי משהו גדול יותר.", by: "יוסי ח׳", where: "קריית ים", when: "לפני חודש" },
  ],
  "orchid-plant": [
    { stars: 5, text: "הסחלב פורח אצלי כבר שלושה חודשים. עצת ההשקיה שקיבלתי איתו עשתה את ההבדל.", by: "רותי ס׳", where: "קריית חיים", when: "לפני 4 חודשים" },
  ],
  "peony-romance": [
    { stars: 5, text: "חיכיתי לעונה של הפיוניות והיה שווה. הן נפתחו בדיוק כמו שהסבירו לי.", by: "הדס ו׳", where: "חיפה", when: "לפני 3 שבועות" },
  ],
  "tulip-spring": [
    { stars: 4, text: "צבעונים יפים ומחיר הוגן. שימו לב שהם ממשיכים לגדול באגרטל, זה מצחיק.", by: "עידן ק׳", where: "קריית ביאליק", when: "לפני חודש" },
  ],
  "teddy-roses": [
    { stars: 5, text: "הזמנתי לבת שלי ליום הולדת 16. הדובי היה איכותי, לא צעצוע זול. היא לא הפסיקה לחייך.", by: "שרון מ׳", where: "קריית אתא", when: "לפני שבועיים" },
  ],
  "flower-box": [
    { stars: 5, text: "שלחתי למשרד של חבר ולא היה צריך אגרטל. פתרון מעולה.", by: "עומר פ׳", where: "חיפה", when: "לפני חודש" },
  ],
  "car-decor": [
    { stars: 5, text: "הגיעו בבוקר החתונה, התקינו תוך רבע שעה ופירקו בסוף בלי שריטה אחת.", by: "אביב וליהי", where: "קריית מוצקין", when: "לפני חודשיים" },
  ],
  "succulent-pot": [
    { stars: 5, text: "מתנה לחנוכת בית. עברו ארבעה חודשים והם עדיין נראים מצוין, ואני לא בדיוק בעלת יד ירוקה.", by: "ליאת ב׳", where: "קריית ים", when: "לפני 4 חודשים" },
  ],
};

function reviewsFor(id) {
  return PRODUCT_REVIEWS[id] || [];
}

function productRating(id) {
  const list = reviewsFor(id);
  if (!list.length) return 0;
  return list.reduce((sum, r) => sum + r.stars, 0) / list.length;
}

/* ============================================================
   תוספות לקופה
   ------------------------------------------------------------
   מעלות את הסל ב-15–20% בממוצע, בלי לוגיסטיקה נוספת.
   ============================================================ */
const ADDONS = [
  { id: "chocolate", emo: "🍫", name: "שוקולד בלגי", note: "מארז פרלינים 120 גרם, נכנס לאותה אריזה", price: 39 },
  { id: "vase", emo: "🏺", name: "אגרטל זכוכית", note: "אגרטל מתאים לזר — מגיע כשהזר כבר בפנים", price: 59 },
  { id: "balloon", emo: "🎈", name: "בלון הליום", note: "בלון פויל עם כיתוב לבחירה, מחזיק 3–5 ימים", price: 25 },
  { id: "card", emo: "💌", name: "כרטיס ברכה מודפס", note: "הברכה שכתבתם, מודפסת על כרטיס מעוצב ולא בכתב יד", price: 12 },
];

function findAddon(id) {
  return ADDONS.find((a) => a.id === id);
}

/* ============================================================
   חיפוש בקטלוג
   ============================================================ */
function searchProducts(query, list) {
  const q = String(query || "").trim().toLowerCase();
  const source = list || PRODUCTS;
  if (!q) return source;

  const words = q.split(/\s+/);
  return source.filter((p) => {
    const haystack = [
      p.name,
      p.desc,
      p.botanical,
      p.tag,
      (p.badges || []).join(" "),
      Object.values(p.composition || {})
        .flat()
        .map((pair) => pair[0])
        .join(" "),
      occasionsOf(p.id)
        .map((o) => (OCCASIONS.find((x) => x.id === o) || {}).label)
        .join(" "),
      (CATEGORIES.find((c) => c.id === p.category) || {}).name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

const SORTERS = {
  featured: null,
  priceUp: (a, b) => a.price - b.price,
  priceDown: (a, b) => b.price - a.price,
  rating: (a, b) => productRating(b.id) - productRating(a.id),
};

/* ---------- קטגוריות ---------- */
const CATEGORIES = [
  { id: "signature", name: "אירוסים · חתימת המותג", featured: true, img: "assets/products/iris-signature.jpg" },
  { id: "roses", name: "ורדים", img: "assets/products/red-roses-classic.jpg" },
  { id: "seasonal", name: "זרים עונתיים", img: "assets/products/seasonal-mix.jpg" },
  { id: "events", name: "אירועים וחתונות", img: "assets/products/event-luxury.jpg" },
  { id: "sympathy", name: "ניחומים", img: "assets/products/sympathy-white.jpg" },
  { id: "plants", name: "עציצים וסחלבים", img: "assets/products/orchid-plant.jpg" },
  { id: "gifts", name: "מתנות ומארזים", img: "assets/products/teddy-roses.jpg" },
];

/* ---------- אזורי חלוקה ----------
   tier: "core"  = חלוקה רגילה לכל הזמנה
         "large" = הזמנות גדולות בלבד (מעל סכום המינימום)
   aliases: כתיבים ושכונות שגם הם צריכים להתאים לאותו אזור. */
const LARGE_ORDER_MIN = 250;

const DELIVERY_ZONES = [
  {
    city: "קריית אתא",
    tier: "core",
    info: "משלוח באותו יום — הזמנה עד 14:00",
    aliases: ["קרית אתא", "כפר אתא", "קרית בנימין", "קריית בנימין", "גבעת טל", "רמת אלון", "אתא"],
  },
  {
    city: "קריית חיים",
    tier: "core",
    info: "משלוח באותו יום — הזמנה עד 13:00",
    aliases: ["קרית חיים", "חיים מערבית", "חיים מזרחית", "שכונת דגניה"],
  },
  {
    city: "קריית ביאליק",
    tier: "core",
    info: "משלוח באותו יום — הזמנה עד 13:00",
    aliases: ["קרית ביאליק", "ביאליק", "צור שלום", "קרית אליעזר ביאליק", "אפק"],
  },
  {
    city: "קריית מוצקין",
    tier: "core",
    info: "משלוח באותו יום — הזמנה עד 13:00",
    aliases: ["קרית מוצקין", "מוצקין", "נווה גנים", "קרית שמואל"],
  },
  {
    city: "קריית ים",
    tier: "core",
    info: "משלוח באותו יום — הזמנה עד 13:00",
    aliases: ["קרית ים", "קרית ים א", "קרית ים ב", "קרית ים ג"],
  },
  {
    city: "חיפה",
    tier: "large",
    info: `משלוח באותו יום — הזמנות מעל ₪${LARGE_ORDER_MIN} בלבד`,
    aliases: ["חיפא", "הדר", "נווה שאנן", "רמת הדר", "כרמל", "הכרמל", "בת גלים", "חליסה", "עיר תחתית", "רמות רמז", "אחוזה"],
  },
  {
    city: "נשר",
    tier: "large",
    info: `משלוח באותו יום — הזמנות מעל ₪${LARGE_ORDER_MIN} בלבד`,
    aliases: ["תל חנן", "גבעת נשר", "בן דור"],
  },
];

/** מנרמל קלט בעברית: מסיר גרשיים, רווחים כפולים, ומאחד כתיב מלא/חסר */
function normalizeArea(text) {
  return String(text || "")
    .replace(/["'`״׳]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^רחוב\s+|^רח\s+|^שדרות\s+|^שד\s+/, "")
    .replace(/קרית/g, "קריית")
    .replace(/\bק\s+/g, "קריית ");
}

function checkDeliveryArea(query) {
  const q = normalizeArea(query);
  if (!q) return null;

  for (const zone of DELIVERY_ZONES) {
    const names = [zone.city, ...zone.aliases].map(normalizeArea);
    const hit = names.some((n) => q.includes(n) || n.includes(q));
    if (hit) return { area: zone.city, info: zone.info, tier: zone.tier, min: LARGE_ORDER_MIN };
  }
  return null;
}

const GREETING_TONES = [
  { id: "romantic", label: "רומנטי" },
  { id: "birthday", label: "יום הולדת" },
  { id: "touching", label: "מרגש" },
  { id: "funny", label: "מצחיק" },
  { id: "congrats", label: "מזל טוב" },
  { id: "thanks", label: "תודה" },
  { id: "recovery", label: "החלמה" },
  { id: "sympathy", label: "ניחומים" },
];

/* ---------- עזרים ---------- */
function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function findProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function badgesHTML(p) {
  const list = [p.tag, ...(p.badges || [])].filter(Boolean);
  if (!list.length) return "";
  return `<div class="badge-stack">${list
    .map((b) => `<span class="badge ${b === "הכי נמכר" ? "bestseller" : ""}${b === "עונתי" ? " seasonal" : ""}">${esc(b)}</span>`)
    .join("")}</div>`;
}

/** כוכבים קטנים לכרטיס — עצמאי, בלי תלות ב-site.js */
function starsMini(filled, total = 5) {
  let out = "";
  for (let i = 1; i <= total; i++) {
    out += `<svg viewBox="0 0 24 24" class="${i <= filled ? "" : "empty"}" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  }
  return out;
}

/** שורת דירוג לכרטיס מוצר — מוצגת רק אם יש ביקורות */
function ratingLineHTML(p) {
  const list = reviewsFor(p.id);
  if (!list.length) return "";
  const avg = productRating(p.id);
  return `<div class="card-rating" aria-label="דירוג ${avg.toFixed(1)} מתוך 5, ${list.length} ביקורות">
      <span class="stars">${starsMini(Math.round(avg))}</span>
      <small>${avg.toFixed(1)} · ${list.length} ביקורות</small>
    </div>`;
}

/** תגית תמונה עם גרסה מוקטנת לנייד */
function productImgHTML(src, alt, sizes) {
  const srcset = typeof imgSrcset === "function" ? imgSrcset(src, sizes) : "";
  return `<img src="${src}"${srcset} alt="${esc(alt)}" loading="lazy" decoding="async" />`;
}

/**
 * כרטיס מוצר.
 * variant === "hero" → כרטיס כפול־רוחב לזר החתימה, כדי שברשת
 * לא ייראו כל הזרים באותה חשיבות בדיוק.
 */
function productCardHTML(p, variant) {
  const isHero = variant === "hero";
  const open = `openProductModal('${p.id}')`;
  return `
    <article class="product-card${isHero ? " hero-card" : ""}" role="button" tabindex="0"
             aria-label="${esc(p.name)} — פתיחת פרטי הזר ובחירת גודל"
             onclick="${open}"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${open}}">
      <div class="product-art">
        ${productImgHTML(p.img, p.name, isHero ? "(max-width:980px) 96vw, 560px" : undefined)}
        ${badgesHTML(p)}
        <div class="quick-view">צפייה מהירה ובחירת גודל</div>
      </div>
      <div class="product-body">
        ${isHero ? '<span class="hero-card-flag">★ זר החתימה של הבוטיק</span>' : ""}
        <h4>${esc(p.name)}</h4>
        <p>${esc(isHero ? p.botanical || p.desc : p.desc)}</p>
        ${ratingLineHTML(p)}
        <div class="product-foot">
          <span class="price"><small>החל מ־</small> ₪${p.price}${p.oldPrice ? `<s>₪${p.oldPrice}</s>` : ""}</span>
          <button class="add-btn" onclick="event.stopPropagation();addToCart('${p.id}')"
                  aria-label="הוספת ${esc(p.name)} לסל">הוסף לסל</button>
        </div>
        ${isHero ? `<div class="hero-card-why">${esc(deliveryFeeText())} · נשזר ביום המשלוח</div>` : ""}
      </div>
    </article>`;
}

function categoryCardHTML(c) {
  return `
    <a href="catalog.html#${c.id}" class="cat-card ${c.featured ? "featured" : ""}">
      <div class="cat-img">${productImgHTML(c.img, c.name, "(max-width:620px) 48vw, 360px")}</div>
      <h4>${esc(c.name)}</h4>
    </a>`;
}

