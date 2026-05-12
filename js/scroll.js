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

  var target  = RIGHT();
  var current = RIGHT();
  var raf     = null;

  function compute() {
    var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    var p   = clamp(window.scrollY / max, 0, 1);

    if (p < 0.22) {
      target = RIGHT();
    } else if (p < 0.36) {
      target = lerp(RIGHT(), CENTER(), easeInOutQuad((p - 0.22) / 0.14));
    } else if (p < 0.62) {
      target = CENTER();
    } else if (p < 0.78) {
      target = lerp(CENTER(), LEFT(), easeInOutQuad((p - 0.62) / 0.16));
    } else {
      target = LEFT();
    }
  }

  function tick() {
    current = lerp(current, target, 0.15);
    cup.style.transform = "translate3d(" + current.toFixed(2) + "px, -50%, 0)";
    if (Math.abs(current - target) > 0.2) {
      raf = requestAnimationFrame(tick);
    } else {
      current = target;
      cup.style.transform = "translate3d(" + current.toFixed(2) + "px, -50%, 0)";
      raf = null;
    }
  }

  function onScroll() {
    compute();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function onResize() {
    compute();
    current = target;
    cup.style.transform = "translate3d(" + current.toFixed(2) + "px, -50%, 0)";
  }

  // Initialise
  compute();
  current = target;
  cup.style.transform = "translate3d(" + current.toFixed(2) + "px, -50%, 0)";

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
})();
