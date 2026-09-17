/* ============================================================
   פרחי איריס — התנהגות משותפת לכל הדפים
   ============================================================ */

function toggleNav() {
  document.getElementById("navLinks")?.classList.toggle("open");
}

function handleDeliveryCheck(e) {
  e.preventDefault();
  const found = checkDeliveryArea(document.getElementById("dcInput").value);
  const result = document.getElementById("dcResult");
  if (found) {
    result.className = "dc-result ok";
    result.textContent = `מגיעים ל${found.area} · ${found.info}`;
  } else {
    result.className = "dc-result no";
    result.textContent = "האזור לא מופיע ברשימת החלוקה הרגילה — דברו עם מיכל בצ'אט ונבדוק אפשרות מיוחדת.";
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
