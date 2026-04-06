// ─── Stalk Market — Landing Page JS ──────────────���───────────────────────────
// Minimal for now — expand as signup flows are built

document.addEventListener("DOMContentLoaded", function() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener("click", function(e) {
      var target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
});
