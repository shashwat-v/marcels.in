(function () {
  "use strict";

  var isFirstVisit = document.documentElement.classList.contains('first-visit');
  var overlay = document.getElementById('loader-overlay');
  var progressBar = document.getElementById('loader-progress-bar');
  var loaderLogo = document.getElementById('loader-logo');
  var loaderSub = document.querySelector('.loader-sub');
  var loaderTrack = document.querySelector('.loader-progress-track');
  var navLogo = document.querySelector('.nav .wordmark');

  if (!isFirstVisit) {
    if (overlay) overlay.style.display = 'none';
    setTimeout(function() {
      document.dispatchEvent(new Event('loaderComplete'));
    }, 0);
    return;
  }

  // Handle first visit
  var progress = 0;
  var hasWindowLoaded = false;
  
  window.addEventListener('load', function() {
    hasWindowLoaded = true;
  });

  // Simulated progress logic
  var interval = setInterval(function() {
    if (!hasWindowLoaded && progress < 85) {
      progress += Math.random() * 5 + 2;
    } else if (hasWindowLoaded) {
      progress += Math.random() * 10 + 5;
    }
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      finishLoading();
    }
    
    if (window.gsap) {
      gsap.to(progressBar, { width: progress + '%', duration: 0.1 });
    } else {
      progressBar.style.width = progress + '%';
    }
  }, 80);

  function finishLoading() {
    if (!window.gsap) return emergencyExit();

    gsap.to([loaderSub, loaderTrack], {
      opacity: 0,
      duration: 0.4,
      onComplete: animateLogoToNav
    });
  }

  function animateLogoToNav() {
    var sourceRect = loaderLogo.getBoundingClientRect();
    var targetRect = navLogo.getBoundingClientRect();
    
    var scaleX = targetRect.width / sourceRect.width;
    var scaleY = targetRect.height / sourceRect.height;
    
    var sourceCenterX = sourceRect.left + sourceRect.width / 2;
    var sourceCenterY = sourceRect.top + sourceRect.height / 2;
    var targetCenterX = targetRect.left + targetRect.width / 2;
    var targetCenterY = targetRect.top + targetRect.height / 2;
    
    var moveX = targetCenterX - sourceCenterX;
    var moveY = targetCenterY - sourceCenterY;
    
    gsap.to(loaderLogo, {
      x: moveX,
      y: moveY,
      scaleX: scaleX,
      scaleY: scaleY,
      duration: 1.2,
      ease: "power3.inOut",
      onComplete: function() {
        // Animation complete - reveal actual nav logo
        document.documentElement.classList.remove('first-visit');
        
        // Fade out overlay cleanly
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.4,
          onComplete: function() {
            overlay.remove();
            sessionStorage.setItem('marcels_visited', 'true');
            window.loaderHasCompleted = true;
            document.dispatchEvent(new Event('loaderComplete'));
          }
        });
      }
    });
  }

  function emergencyExit() {
    document.documentElement.classList.remove('first-visit');
    if (overlay) overlay.remove();
    sessionStorage.setItem('marcels_visited', 'true');
    window.loaderHasCompleted = true;
    document.dispatchEvent(new Event('loaderComplete'));
  }
})();
