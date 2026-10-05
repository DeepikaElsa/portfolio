/* ---------------------------------------------------------
   Portfolio behaviour: theme, nav indicator, scroll spy, reveals
   --------------------------------------------------------- */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- theme ---------- */
  var toggle = document.getElementById("themeToggle");
  var stored = null;
  try { stored = localStorage.getItem("dej-theme"); } catch (e) { /* private mode */ }

  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  // The tab icon follows the page theme too: Himmel in light, Frieren in dark.
  // CSS can't reach the <link>, so it's swapped here.
  var favicon = document.getElementById("favicon");
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (favicon) {
      favicon.href = theme === "dark" ? "assets/favicon-dark.png" : "assets/favicon.png";
    }
  }

  applyTheme(stored || (prefersDark ? "dark" : "light"));

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("dej-theme", next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- nav indicator + scroll spy ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll(".navigation .list"));
  var sections = items
    .map(function (li) { return document.getElementById(li.dataset.target); })
    .filter(Boolean);

  function setActive(index) {
    items.forEach(function (li, i) { li.classList.toggle("active", i === index); });
  }

  items.forEach(function (li, i) {
    li.addEventListener("click", function () { setActive(i); });
  });

  // Which section occupies the middle of the viewport wins.
  var ticking = false;
  function spy() {
    var line = window.scrollY + window.innerHeight * 0.42;
    var current = 0;
    sections.forEach(function (sec, i) {
      if (sec.offsetTop <= line) current = i;
    });
    // pin the last section once the page is scrolled to the bottom
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      current = sections.length - 1;
    }
    setActive(current);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(spy);
    }
  }, { passive: true });
  window.addEventListener("resize", spy);
  spy();

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    reveals.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      io.observe(el);
    });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("in"); });
  }

  /* ---------- skill tags: one scrolling line per card ----------
     The markup holds one copy of each set. Here it's wrapped in a clipping
     container and repeated until the track is at least twice the visible
     width, so translating by exactly one set length loops seamlessly. */
  var SCROLL_SPEED = 34; // px per second

  function buildMarquee(list) {
    var card = list.parentNode;
    if (!card || card.classList.contains("skill-marquee")) return;

    var wrap = document.createElement("div");
    wrap.className = "skill-marquee";
    card.insertBefore(wrap, list);
    wrap.appendChild(list);

    var styles = window.getComputedStyle(list);
    var gap = parseFloat(styles.columnGap || styles.gap) || 0;

    // measure one set before any cloning
    var setWidth = list.scrollWidth;
    if (!setWidth) return;
    var shift = setWidth + gap;

    var originals = Array.prototype.slice.call(list.children);
    var copiesNeeded = Math.max(1, Math.ceil((wrap.clientWidth * 2) / shift));

    for (var c = 0; c < copiesNeeded; c++) {
      for (var i = 0; i < originals.length; i++) {
        var clone = originals[i].cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        list.appendChild(clone);
      }
    }

    list.style.setProperty("--shift", shift + "px");
    list.style.setProperty("--dur", (shift / SCROLL_SPEED).toFixed(2) + "s");
  }

  var skillLists = document.querySelectorAll(".skill-card .tags");
  Array.prototype.forEach.call(skillLists, buildMarquee);

  // widths change with the layout, so rebuild the measurements on resize
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll(".skill-marquee .tags"), function (list) {
        var kept = [];
        Array.prototype.forEach.call(list.children, function (li) {
          if (!li.hasAttribute("aria-hidden")) kept.push(li);
        });
        list.innerHTML = "";
        kept.forEach(function (li) { list.appendChild(li); });
        var wrap = list.parentNode;
        wrap.parentNode.insertBefore(list, wrap);
        wrap.parentNode.removeChild(wrap);
        buildMarquee(list);
      });
    }, 250);
  });

  /* ---------- sparkle on every button ----------
     The stars are injected rather than written into the markup, so every
     button is decorated from one place and a new one picks it up for free. */
  var SPARKLE_TARGETS = ".btn, .paper-link, .theme-toggle";
  var STAR_PATH = "M12 0l2.6 8.6L22 12l-7.4 3.4L12 24l-2.6-8.6L2 12l7.4-3.4z";
  var SVG_NS = "http://www.w3.org/2000/svg";

  Array.prototype.forEach.call(document.querySelectorAll(SPARKLE_TARGETS), function (el) {
    if (el.querySelector(".stars")) return;
    el.classList.add("sparkle");

    var stars = document.createElement("span");
    stars.className = "stars";
    stars.setAttribute("aria-hidden", "true");

    for (var i = 1; i <= 4; i++) {
      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("class", "star star-" + i); // SVG className is read-only
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", STAR_PATH);
      svg.appendChild(path);
      stars.appendChild(svg);
    }
    el.appendChild(stars);
  });

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
