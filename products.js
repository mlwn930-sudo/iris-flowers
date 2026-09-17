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
  return Math.round(product.price * findSize(sizeId).mult);
}

/* מוצרים שכבר קיימות עבורם 3 תמונות לפי גודל בתיקיית assets/products/
   בתבנית <id>-s.jpg / <id>-m.jpg / <id>-l.jpg.
   כדי להפעיל מוצר — פשוט הסירו את סימן ההערה מהשורה שלו. */
const SIZED_IMAGE_PRODUCTS = new Set([
  // "iris-signature",
  // "iris-white-rose",
  // "red-roses-classic",
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

/* ---------- קטגוריות ---------- */
const CATEGORIES = [
  { id: "signature", name: "אירוסים · חתימת המותג", featured: true, img: "assets/products/iris-signature.jpg" },
  { id: "roses", name: "ורדים", img: "assets/products/red-roses-classic.jpg" },
  { id: "seasonal", name: "זרים עונתיים", img: "assets/products/seasonal-mix.jpg" },
  { id: "events", name: "אירועים וחתונות", img: "assets/products/event-luxury.jpg" },
  { id: "sympathy", name: "ניחומים", img: "assets/products/sympathy-white.jpg" },
  { id: "plants", name: "עציצים וסחלבים", img: "assets/products/orchid-plant.jpg" },
];

/* ---------- אזורי חלוקה ---------- */
const DELIVERY_AREAS = {
  "קריית אתא": "משלוח באותו יום — הזמנה עד 14:00",
  "חיפה": "משלוח באותו יום — הזמנה עד 13:00",
  "קריית ביאליק": "משלוח באותו יום — הזמנה עד 13:00",
  "קריית מוצקין": "משלוח באותו יום — הזמנה עד 13:00",
  "קריית ים": "משלוח למחרת",
  "קריית חיים": "משלוח באותו יום — הזמנה עד 13:00",
  "נשר": "משלוח באותו יום — הזמנה עד 13:00",
  "טירת כרמל": "משלוח למחרת",
  "עכו": "משלוח למחרת",
  "יגור": "משלוח למחרת",
};

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
    .map((b) => `<span class="badge ${b === "הכי נמכר" ? "bestseller" : ""}">${esc(b)}</span>`)
    .join("")}</div>`;
}

function productCardHTML(p) {
  return `
    <article class="product-card" role="button" tabindex="0"
             onclick="openProductModal('${p.id}')"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProductModal('${p.id}')}">
      <div class="product-art">
        <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" />
        ${badgesHTML(p)}
        <div class="quick-view">צפייה מהירה ובחירת גודל</div>
      </div>
      <div class="product-body">
        <h4>${esc(p.name)}</h4>
        <p>${esc(p.desc)}</p>
        <div class="product-foot">
          <span class="price"><small>החל מ־</small> ₪${p.price}${p.oldPrice ? `<s>₪${p.oldPrice}</s>` : ""}</span>
          <button class="add-btn" onclick="event.stopPropagation();addToCart('${p.id}')">הוסף לסל</button>
        </div>
      </div>
    </article>`;
}

function categoryCardHTML(c) {
  return `
    <a href="catalog.html#${c.id}" class="cat-card ${c.featured ? "featured" : ""}">
      <div class="cat-img"><img src="${c.img}" alt="${esc(c.name)}" loading="lazy" /></div>
      <h4>${esc(c.name)}</h4>
    </a>`;
}

function checkDeliveryArea(query) {
  const q = (query || "").trim();
  if (!q) return null;
  const match = Object.keys(DELIVERY_AREAS).find((area) => area.includes(q) || q.includes(area));
  return match ? { area: match, info: DELIVERY_AREAS[match] } : null;
}
