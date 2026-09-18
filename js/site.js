/* ============================================================
   פרחי איריס — התנהגות משותפת לכל הדפים
   ============================================================ */

function toggleNav() {
  const links = document.getElementById("navLinks");
  if (!links) return;
  const open = links.classList.toggle("open");
  // בלי זה קורא מסך מכריז "סגור" גם כשהתפריט פתוח
  document.querySelector(".nav-toggle")?.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) links.querySelector("a")?.focus();
}

function handleDeliveryCheck(e) {
  e.preventDefault();
  const found = checkDeliveryArea(document.getElementById("dcInput").value);
  const result = document.getElementById("dcResult");
  if (found && found.tier === "core") {
    result.className = "dc-result ok";
    result.textContent = `מגיעים ל${found.area} · ${found.info}`;
  } else if (found) {
    result.className = "dc-result ok";
    result.textContent = `מגיעים ל${found.area} · ${found.info}. מתחת לסכום הזה — דברו עם אגם ונמצא פתרון.`;
  } else {
    result.className = "dc-result no";
    result.textContent = "האזור לא מופיע ברשימת החלוקה הרגילה — דברו עם אגם בצ'אט ונבדוק אפשרות מיוחדת.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });

  updateCartBadge();
});

/* ============================================================
   דירוגים — ממוצע והביקורות הם תוכן הדגמה.
   הדירוג שהמשתמש נותן נשמר בדפדפן שלו בלבד (אין שרת).
   ============================================================ */
const REVIEWS = [
  { stars: 5, text: "הזמנתי זר ליום הולדת של אמא שלי והיא התקשרה מתרגשת. הגיע בדיוק בזמן, טרי ומסודר.", by: "נועה ל׳", where: "קריית אתא" },
  { stars: 5, text: "שירות אישי ברמה אחרת. התייעצתי בצ׳אט, קיבלתי המלצה מדויקת, והזר היה בדיוק מה שדמיינתי.", by: "אורי ב׳", where: "קריית ביאליק" },
  { stars: 4, text: "זר יפהפה ומחיר הוגן. הגיע קצת אחרי השעה שביקשתי, אבל השליח עדכן מראש ואפילו התנצל.", by: "מיכל ש׳", where: "קריית מוצקין" },
];

function starsSVG(filled, total) {
  let out = "";
  for (let i = 1; i <= total; i++) {
    out += `<svg viewBox="0 0 24 24" class="${i <= filled ? "" : "empty"}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  }
  return out;
}

const RATING_KEY = "iris_my_rating";

function renderRatings() {
  const starsEl = document.getElementById("ratingStars");
  if (!starsEl) return;
  starsEl.innerHTML = starsSVG(5, 5);

  document.getElementById("reviewList").innerHTML = REVIEWS.map(
    (r) => `
    <div class="review">
      <div class="stars">${starsSVG(r.stars, 5)}</div>
      <p>"${esc(r.text)}"</p>
      <div class="by">${esc(r.by)}<small>${esc(r.where)}</small></div>
    </div>`
  ).join("");

  const rateEl = document.getElementById("rateStars");
  rateEl.innerHTML = [1, 2, 3, 4, 5]
    .map((n) => `<button type="button" data-n="${n}" onclick="setMyRating(${n})" aria-label="${n} כוכבים">${starsSVG(1, 1)}</button>`)
    .join("");

  const saved = Number(localStorage.getItem(RATING_KEY) || 0);
  if (saved) paintMyRating(saved, true);
}

function paintMyRating(n, silent) {
  document.querySelectorAll("#rateStars button").forEach((b) => {
    b.classList.toggle("lit", Number(b.dataset.n) <= n);
  });
  if (!silent) document.getElementById("rateThanks").classList.add("show");
}

function setMyRating(n) {
  try {
    localStorage.setItem(RATING_KEY, String(n));
  } catch {}
  paintMyRating(n, false);
}

document.addEventListener("DOMContentLoaded", renderRatings);
