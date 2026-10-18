(function () {
  "use strict";

  // ---------- Theme toggle ----------
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = root.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // ---------- Local time ----------
  document.querySelectorAll(".local-time").forEach(function (el) {
    var out = el.querySelector(".time");
    var tz = el.dataset.timeZone;
    function tick() {
      try {
        out.textContent = new Intl.DateTimeFormat(undefined, {
          hour: "numeric", minute: "2-digit", timeZone: tz
        }).format(new Date());
      } catch (e) { el.hidden = true; }
    }
    tick();
    setInterval(tick, 30000);
  });

  // ---------- Share ----------
  document.querySelectorAll(".share-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var data = { title: btn.dataset.title, url: btn.dataset.url };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(data.url).then(function () {
          var label = btn.querySelector("span");
          label.textContent = "Link copied";
          setTimeout(function () { label.textContent = "Share"; }, 2000);
        });
      }
    });
  });

  // ---------- Gallery lightbox ----------
  document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
    var dialog = gallery.nextElementSibling;
    if (!dialog || !dialog.classList.contains("lightbox") || !dialog.showModal) return;

    var items = Array.prototype.slice.call(gallery.querySelectorAll(".gallery-item"));
    var img = dialog.querySelector(".lb-img");
    var caption = dialog.querySelector(".lb-caption");
    var count = dialog.querySelector(".lb-count");
    var strip = dialog.querySelector(".lb-strip");
    var download = dialog.querySelector(".lb-download");
    var current = 0;
    var lastFocus = null;

    // Thumbnail strip
    var thumbs = items.map(function (item, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Show photo " + (i + 1));
      var t = document.createElement("img");
      t.src = item.querySelector("img").currentSrc || item.querySelector("img").src;
      t.alt = "";
      t.loading = "lazy";
      b.appendChild(t);
      b.addEventListener("click", function () { show(i); });
      strip.appendChild(b);
      return b;
    });

    function preload(i) {
      var it = items[(i + items.length) % items.length];
      if (it && !it._pre) { it._pre = new Image(); it._pre.src = it.getAttribute("href"); }
    }

    function show(i) {
      current = (i + items.length) % items.length;
      var item = items[current];
      var src = item.getAttribute("href");
      img.classList.add("is-loading");
      var loader = new Image();
      loader.onload = loader.onerror = function () {
        if (items[current] !== item) return;
        img.src = src;
        img.width = +item.dataset.w;
        img.height = +item.dataset.h;
        img.alt = item.querySelector("img").alt;
        img.classList.remove("is-loading");
      };
      loader.src = src;
      caption.textContent = item.dataset.caption || "";
      count.textContent = (current + 1) + " / " + items.length;
      if (item.dataset.original) {
        download.hidden = false;
        download.href = item.dataset.original;
      } else {
        download.hidden = true;
      }
      thumbs.forEach(function (t, n) { t.setAttribute("aria-current", n === current ? "true" : "false"); });
      thumbs[current].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      history.replaceState(null, "", "#photo-" + (current + 1));
      preload(current + 1);
      preload(current - 1);
    }

    function open(i) {
      lastFocus = document.activeElement;
      dialog.showModal();
      root.classList.add("lb-open");
      show(i);
    }

    function close() { if (dialog.open) dialog.close(); }

    dialog.addEventListener("close", function () {
      root.classList.remove("lb-open");
      history.replaceState(null, "", location.pathname + location.search);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    });

    items.forEach(function (item, i) {
      item.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let people open in new tab
        e.preventDefault();
        open(i);
      });
    });

    dialog.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    dialog.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    dialog.querySelector(".lb-close").addEventListener("click", close);

    // Click on the dark backdrop (not the photo or controls) closes
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target.classList.contains("lb-stage")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!dialog.open) return;
      if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
      else if (e.key === "Home") { e.preventDefault(); show(0); }
      else if (e.key === "End") { e.preventDefault(); show(items.length - 1); }
    });

    // Swipe left/right to navigate, swipe down to close
    var sx = 0, sy = 0, tracking = false;
    var stage = dialog.querySelector(".lb-stage");
    stage.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener("touchmove", function (e) {
      if (!tracking) return;
      var dx = e.touches[0].clientX - sx;
      img.style.transform = "translateX(" + dx * 0.4 + "px)";
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      img.style.transform = "";
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    });

    // Deep link: /photography/#photo-4 opens straight to that photo
    var m = location.hash.match(/^#photo-(\d+)$/);
    if (m && +m[1] >= 1 && +m[1] <= items.length) open(+m[1] - 1);
  });
})();

// ---------- Recommendations: category tabs ----------
(function () {
  var tabs = document.querySelectorAll(".rec-tab");
  if (!tabs.length) return;
  var cats = document.querySelectorAll(".rec-cat");
  function select(id, push) {
    tabs.forEach(function (t) { t.setAttribute("aria-selected", t.dataset.filter === id ? "true" : "false"); });
    cats.forEach(function (c) { c.hidden = id !== "all" && c.dataset.cat !== id; });
    if (push) history.replaceState(null, "", id === "all" ? location.pathname : "#" + id);
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { select(t.dataset.filter, true); }); });
  var h = location.hash.slice(1);
  if (h && document.querySelector('.rec-cat[data-cat="' + h + '"]')) select(h, false);
})();
