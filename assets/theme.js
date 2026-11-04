(function () {
  var addUrl = document.documentElement.getAttribute("data-cart-add") || "/cart/add.js";
  var cartUrl = document.documentElement.getAttribute("data-cart") || "/cart.js";

  document.querySelectorAll("[data-menu]").forEach(function (menu) {
    menu.addEventListener("click", function (event) {
      if (event.target === menu) menu.hidden = true;
    });
  });

  document.querySelectorAll("[data-menu-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var menu = document.querySelector("[data-menu]");
      if (menu) menu.hidden = false;
    });
  });
  document.querySelectorAll("[data-menu-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var menu = btn.closest("[data-menu]");
      if (menu) menu.hidden = true;
    });
  });

  function setCount(n) {
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n < 1;
    });
  }

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form.matches || !form.matches("form.js-cart")) return;
    event.preventDefault();
    var btn = form.querySelector("[type='submit']");
    var note = form.querySelector("[data-form-note]") || form.parentElement.querySelector("[data-form-note]");
    if (btn) btn.disabled = true;
    var data = new FormData(form);
    var payload = { id: Number(data.get("id")), quantity: Number(data.get("quantity") || 1) };
    fetch(addUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw new Error(body.description || body.message || "That spot is gone.");
          return body;
        });
      })
      .then(function () {
        return fetch(cartUrl).then(function (r) { return r.json(); });
      })
      .then(function (cart) {
        setCount(cart.item_count);
        if (btn && btn.classList.contains("spot-cell")) {
          btn.classList.remove("is-open");
          btn.classList.add("is-mine");
          var em = btn.querySelector("em");
          if (em) em.textContent = "In your cart";
        } else {
          if (btn) btn.disabled = false;
          if (note) note.textContent = "Added. Checkout from the cart when you are ready.";
        }
      })
      .catch(function (err) {
        if (btn) btn.disabled = false;
        if (note) note.textContent = err.message;
        else form.submit();
      });
  });

  function reduceMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  document.querySelectorAll("[data-wheel]").forEach(function (board) {
    var spin = board.querySelector("[data-spin]");
    var result = board.querySelector("[data-spin-result]");
    if (!spin) return;
    spin.addEventListener("click", function () {
      var cells = Array.prototype.slice.call(board.querySelectorAll(".spot-cell.is-open"));
      if (!cells.length) {
        if (result) result.textContent = "No open spots.";
        return;
      }
      var index = Math.floor(Math.random() * cells.length);
      cells.forEach(function (cell) { cell.classList.remove("is-hot"); });
      function land() {
        cells.forEach(function (cell) { cell.classList.remove("is-hot"); });
        cells[index].classList.add("is-hot");
        var name = cells[index].querySelector("strong");
        if (result && name) result.textContent = name.textContent;
      }
      if (reduceMotion()) {
        land();
        return;
      }
      var hops = cells.length * 2 + index;
      var i = 0;
      var timer = window.setInterval(function () {
        cells.forEach(function (cell) { cell.classList.remove("is-hot"); });
        cells[i % cells.length].classList.add("is-hot");
        if (i >= hops) {
          window.clearInterval(timer);
          land();
        }
        i += 1;
      }, 70);
    });
  });

  if (/(?:^|[?&])desk=1(?:&|$)/.test(window.location.search)) {
    document.querySelectorAll("[data-desk]").forEach(function (el) { el.hidden = false; });
  }

  var hitKey = "riptide-desk-hits";
  document.querySelectorAll("[data-hit-form]").forEach(function (form) {
    var list = form.parentElement.querySelector("[data-hit-list]");
    function paint(items) {
      if (!list) return;
      list.innerHTML = "";
      items.forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text;
        list.appendChild(li);
      });
    }
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(hitKey) || "[]"); } catch (e) { saved = []; }
    paint(saved);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = form.querySelector("input[name='hit']");
      var text = (input.value || "").trim();
      if (!text) return;
      saved.unshift(text);
      saved = saved.slice(0, 12);
      localStorage.setItem(hitKey, JSON.stringify(saved));
      paint(saved);
      input.value = "";
    });
  });

  function paintClocks() {
    document.querySelectorAll("[data-ends]").forEach(function (el) {
      var end = Date.parse(el.getAttribute("data-ends"));
      if (!end) return;
      var ms = end - Date.now();
      if (ms <= 0) {
        el.textContent = "Closed";
        return;
      }
      var s = Math.floor(ms / 1000);
      var d = Math.floor(s / 86400);
      var h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);
      var sec = s % 60;
      el.textContent = (d ? d + "d " : "") + h + "h " + String(m).padStart(2, "0") + "m " + String(sec).padStart(2, "0") + "s";
    });
  }
  paintClocks();
  window.setInterval(paintClocks, 1000);

  function keepLead(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll(".kicker, .display, .lede, .announce, .nav-link, .shop-name, .ticker-item, .rte, .keep-lead, .collection-all").forEach(function (el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var list = [];
      while (walker.nextNode()) list.push(walker.currentNode);
      list.forEach(function (node) {
        var v = node.nodeValue;
        if (!v) return;
        var i = 0;
        var head = v.charAt(0);
        if (head === "^") {
          while (v.charAt(i) === "^") i += 1;
        } else if (head === " ") {
          while (v.charAt(i) === " ") i += 1;
        } else {
          return;
        }
        if (!i) return;
        node.nodeValue = "\u00A0".repeat(i) + v.slice(i);
      });
    });
  }
  keepLead(document);
  document.addEventListener("shopify:section:load", function (event) {
    keepLead(event.target);
  });
})();
