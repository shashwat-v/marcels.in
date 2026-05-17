(function () {
  "use strict";

  var canvas = document.getElementById("cup-canvas");
  if (!canvas || !window.THREE) return;

  var W = 500, H = 500;

  /* ── Renderer ─────────────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  /* ── Scene ────────────────────────────────────────── */
  var scene = new THREE.Scene();

  /* ── Camera ───────────────────────────────────────── */
  var camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.set(0, 0.3, 3.8);

  /* ── Lighting — warm café palette ────────────────── */

  scene.add(new THREE.AmbientLight(0xfff3e0, 0.65));

  var key = new THREE.DirectionalLight(0xffe8d6, 1.8);
  key.position.set(3, 5, 2);
  scene.add(key);

  var fill = new THREE.DirectionalLight(0xd6e0ff, 0.55);
  fill.position.set(-3, 2, 1);
  scene.add(fill);

  var rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(0, 3, -3);
  scene.add(rim);

  var under = new THREE.PointLight(0xffd6a0, 0.3, 8);
  under.position.set(0, -2, 1);
  scene.add(under);

  /* ── Interaction ──────────────────────────────────── */
  var isDragging = false;
  var previousMousePosition = { x: 0, y: 0 };
  var targetRotationX = 0;
  var targetRotationY = 0;
  var autoRotation = 0;
  var autoTiltZ = 0;

  canvas.addEventListener('pointerdown', function (e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', function (e) {
    if (isDragging) {
      var deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      targetRotationY += deltaMove.x * 0.008;
      targetRotationX += deltaMove.y * 0.008;

      targetRotationX = Math.max(-Math.PI / 6, Math.min(Math.PI / 4, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  canvas.addEventListener('pointerup', function (e) {
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });

  /* ── Load model ───────────────────────────────────── */
  var loader = new THREE.GLTFLoader();
  var cup = null;
  var baseY = 0;

  loader.load(
    "./assets/marcels_cup.glb",
    function (gltf) {
      var model = gltf.scene;

      model.traverse(function (child) {
        if (child.isMesh) {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 0;
          }
        }
      });

      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = 2.0 / maxDim; // scaled up to 2.0 as requested

      model.scale.setScalar(scale);
      model.position.x = -center.x * scale;
      model.position.y = -center.y * scale + 0.1; // slight lift
      model.position.z = -center.z * scale;

      cup = new THREE.Group();
      cup.add(model);

      baseY = cup.position.y;
      scene.add(cup);

      var fadeStart = performance.now();
      var fadeDur = 1200;

      (function fadeTick() {
        var p = Math.min((performance.now() - fadeStart) / fadeDur, 1);
        var ease = 1 - Math.pow(1 - p, 3);
        model.traverse(function (child) {
          if (child.isMesh && child.material) child.material.opacity = ease;
        });
        if (p < 1) requestAnimationFrame(fadeTick);
        else {
          model.traverse(function (child) {
            if (child.isMesh && child.material) child.material.transparent = false;
          });
        }
      })();
    },
    undefined,
    function (err) { console.warn("marcels_cup.glb load error:", err); }
  );

  /* ── Render loop ──────────────────────────────────── */
  var clock = 0;
  function animate() {
    requestAnimationFrame(animate);

    if (cup) {
      if (!isDragging) {
        // Compute rotation based on scroll progress
        var maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1;
        var p = Math.max(0, Math.min(1, window.scrollY / maxScroll));

        var INITIAL_OFFSET = Math.PI / 2 - 0.55;
        var targetAutoRotation = INITIAL_OFFSET;
        var targetAutoTiltZ = 0;
        if (p < 0.22) {
          targetAutoRotation += 0;
        } else if (p < 0.36) {
          var t = (p - 0.22) / 0.14;
          var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          targetAutoRotation += ease * Math.PI * 2;
          targetAutoTiltZ = Math.sin(t * Math.PI) * 0.3;
        } else if (p < 0.62) {
          targetAutoRotation += Math.PI * 2;
        } else if (p < 0.78) {
          var t = (p - 0.62) / 0.16;
          var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          targetAutoRotation += Math.PI * 2 + ease * Math.PI * 2;
          targetAutoTiltZ = Math.sin(t * Math.PI) * 0.3;
        } else {
          targetAutoRotation += Math.PI * 4;
        }

        // smoothly transition autoRotation if we want, or just set it
        // since 'p' is smooth during user scroll, we can just lerp it slightly for extra smoothness
        autoRotation += (targetAutoRotation - autoRotation) * 0.15;
        autoTiltZ += (targetAutoTiltZ - autoTiltZ) * 0.15;

        // Decay manual rotation so it always returns to front-facing when not interacted with
        targetRotationY *= 0.95;
        targetRotationX *= 0.95;
      }

      var rY = autoRotation + targetRotationY;
      var rX = targetRotationX;

      var floatTiltX = Math.sin(clock * 1.1) * 0.02;
      var floatTiltZ = Math.cos(clock * 1.3) * 0.02;

      cup.rotation.y += (rY - cup.rotation.y) * 0.1;
      cup.rotation.x += ((rX + floatTiltX) - cup.rotation.x) * 0.1;
      cup.rotation.z = floatTiltZ + autoTiltZ;

      clock += 0.016;

      var floatY = Math.sin(clock * 1.5) * 0.04;
      cup.position.y += ((baseY + floatY) - cup.position.y) * 0.1;
    }

    renderer.render(scene, camera);
  }
  animate();
})();
