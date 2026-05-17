(function () {
  "use strict";

  var cup = document.getElementById("cup-anchor");
  if (!cup) return;

  // The cup (320 px wide) travels horizontally as the user scrolls.
  //
  // Hero   → cup in RIGHT column
  // Story  → cup in CENTER (middle spacer column)
  // Visit  → cup in LEFT column
  //
  // Segments (scroll progress 0–1):
  //   0.00 – 0.22  RIGHT  stable
  //   0.22 – 0.36  RIGHT → CENTER  transition
  //   0.36 – 0.62  CENTER stable
  //   0.62 – 0.78  CENTER → LEFT   transition
  //   0.78 – 1.00  LEFT   stable

  var CUP_W = 500;

  function RIGHT() {
    var w = window.innerWidth;
    return (w * 0.75) - (CUP_W / 2);
  }
  function CENTER() {
    var w = window.innerWidth;
    return (w / 2) - (CUP_W / 2);
  }
  function LEFT() {
    var w = window.innerWidth;
    return (w * 0.25) - (CUP_W / 2);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  var targetX = RIGHT();
  var currentX = RIGHT();
  var targetY = 0;
  var currentY = 0;
  var raf = null;

  function compute() {
    var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    var p = clamp(window.scrollY / max, 0, 1);

    if (p < 0.22) {
      targetX = RIGHT();
      targetY = 0;
    } else if (p < 0.36) {
      targetX = lerp(RIGHT(), CENTER(), easeInOutQuad((p - 0.22) / 0.14));
      targetY = 0;
    } else if (p < 0.62) {
      targetX = CENTER();
      targetY = 0;
    } else if (p < 0.78) {
      targetX = lerp(CENTER(), LEFT(), easeInOutQuad((p - 0.62) / 0.16));
      targetY = 0;
    } else {
      targetX = LEFT();
      var t = (p - 0.78) / 0.22;
      var ease = easeInOutQuad(t);
      var label = document.querySelector('.visit-stage .stage-label');
      if (label) {
        var rect = label.getBoundingClientRect();
        var desiredYOffset = rect.bottom - (window.innerHeight / 2) - 320;
        targetY = desiredYOffset * ease;
      } else {
        targetY = 0;
      }
    }
  }

  function tick() {
    currentX = lerp(currentX, targetX, 0.15);
    currentY = lerp(currentY, targetY, 0.15);
    cup.style.transform = "translate3d(" + currentX.toFixed(2) + "px, calc(-50% + " + currentY.toFixed(2) + "px), 0)";
    if (Math.abs(currentX - targetX) > 0.2 || Math.abs(currentY - targetY) > 0.2) {
      raf = requestAnimationFrame(tick);
    } else {
      currentX = targetX;
      currentY = targetY;
      cup.style.transform = "translate3d(" + currentX.toFixed(2) + "px, calc(-50% + " + currentY.toFixed(2) + "px), 0)";
      raf = null;
    }
  }

  function onScroll() {
    compute();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function onResize() {
    compute();
    currentX = targetX;
    currentY = targetY;
    cup.style.transform = "translate3d(" + currentX.toFixed(2) + "px, calc(-50% + " + currentY.toFixed(2) + "px), 0)";
  }

  // Initialise
  compute();
  currentX = targetX;
  currentY = targetY;
  cup.style.transform = "translate3d(" + currentX.toFixed(2) + "px, calc(-50% + " + currentY.toFixed(2) + "px), 0)";

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
})();

// Theme Toggle
document.addEventListener("DOMContentLoaded", function () {
  var themeToggle = document.getElementById("theme-toggle");
  var body = document.body;

  if (themeToggle) {
    // Check local storage
    var currentTheme = localStorage.getItem("theme");
    if (currentTheme === "dark") {
      body.classList.add("dark-theme");
    }

    themeToggle.addEventListener("click", function () {
      body.classList.toggle("dark-theme");
      var theme = body.classList.contains("dark-theme") ? "dark" : "light";
      localStorage.setItem("theme", theme);
    });
  }
});
