/* Faraz Malang Jan — portfolio behavior. No globals leak. */
(function () {
  "use strict";

  // EDIT-ME: your real address before publishing (also update the mailto link in index.html)
  var FORM_TO = "hello@example.com";

  /* ---------- theme toggle ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");

  function syncToggle() {
    var dark = root.dataset.theme === "dark";
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  syncToggle();

  toggle.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("fmj-theme", root.dataset.theme);
    syncToggle();
  });

  /* ---------- header scroll state ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var nav = document.querySelector(".site-nav");

  function setNav(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  }
  navToggle.addEventListener("click", function () {
    setNav(navToggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setNav(false);
  });

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- contact form -> mailto ---------- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("cf-status");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function markError(input, errId, show) {
    input.classList.toggle("invalid", show);
    input.setAttribute("aria-invalid", String(show));
    document.getElementById(errId).hidden = !show;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements["name"];
    var email = form.elements["email"];
    var topic = form.elements["topic"];
    var message = form.elements["message"];

    var bad = false;
    if (!name.value.trim()) { markError(name, "cf-name-err", true); bad = true; } else { markError(name, "cf-name-err", false); }
    if (!emailRe.test(email.value.trim())) { markError(email, "cf-email-err", true); bad = true; } else { markError(email, "cf-email-err", false); }
    if (!message.value.trim()) { markError(message, "cf-message-err", true); bad = true; } else { markError(message, "cf-message-err", false); }
    if (bad) {
      status.textContent = "";
      form.querySelector(".invalid").focus();
      return;
    }

    var body = message.value.trim() +
      "\n\n—\nFrom: " + name.value.trim() +
      "\nReply to: " + email.value.trim() +
      "\nTopic: " + topic.value;
    var href = "mailto:" + encodeURIComponent(FORM_TO) +
      "?subject=" + encodeURIComponent("Portfolio enquiry (" + topic.value + "): " + name.value.trim()) +
      "&body=" + encodeURIComponent(body);

    status.textContent = "Opening your email app… if nothing happens, write to me directly.";
    window.location.href = href;
    form.reset();
  });

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
