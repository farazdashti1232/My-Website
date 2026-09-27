/* ==========================================================================
   Palazzo — concept microsite behaviour
   Vanilla ES6+ · no dependencies · reduced-motion respected via CSS + JS
   ========================================================================== */
(function () {
  "use strict";

  var prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. Kinetic typography — split hero text into animated units
     ------------------------------------------------------------------ */
  function splitLetters(el) {
    var text = el.textContent;
    el.textContent = "";
    Array.prototype.forEach.call(text, function (ch, i) {
      var span = document.createElement("span");
      span.className = "kin-char";
      span.textContent = ch;
      span.style.setProperty("--i", i);
      el.appendChild(span);
    });
  }

  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "kin-word";
      span.textContent = word;
      span.style.setProperty("--i", i);
      el.appendChild(span);
      el.appendChild(document.createTextNode(" "));
    });
  }

  if (!prefersReducedMotion) {
    document.querySelectorAll("[data-kinetic-letters]").forEach(splitLetters);
    document.querySelectorAll("[data-kinetic-words]").forEach(splitWords);
  }

  /* ------------------------------------------------------------------
     2. Fixed nav — translucent until the page scrolls
     ------------------------------------------------------------------ */
  var nav = document.getElementById("siteNav");

  /* ------------------------------------------------------------------
     3. Scroll progress bar (shared rAF loop with nav state)
     ------------------------------------------------------------------ */
  var progressBar = document.getElementById("progressBar");
  var ticking = false;

  function onScrollFrame() {
    var y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 24);

    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(y / max, 1) : 0;
    progressBar.style.transform = "scaleX(" + ratio + ")";
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );
  onScrollFrame();

  /* ------------------------------------------------------------------
     4. IntersectionObserver scroll reveals
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------
     5. Sticky section counter — highlights the section in view
     ------------------------------------------------------------------ */
  var counterCurrent = document.getElementById("counterCurrent");
  var counterSections = document.querySelectorAll("[data-counter]");
  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            counterCurrent.textContent =
              entry.target.getAttribute("data-counter");
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    counterSections.forEach(function (el) {
      sectionObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     6. Menu tabs — WAI-ARIA tablist with roving tabindex
     ------------------------------------------------------------------ */
  var tabs = Array.prototype.slice.call(
    document.querySelectorAll('[role="tab"]')
  );

  function activateTab(tab, setFocus) {
    tabs.forEach(function (other) {
      var selected = other === tab;
      other.setAttribute("aria-selected", String(selected));
      other.setAttribute("tabindex", selected ? "0" : "-1");
      var panel = document.getElementById(other.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = !selected;
        panel.classList.toggle("is-active", selected);
      }
    });
    if (setFocus !== false) tab.focus();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activateTab(tab);
    });

    tab.addEventListener("keydown", function (event) {
      var nextIndex = null;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (index + 1) % tabs.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (index - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      activateTab(tabs[nextIndex]);
    });
  });

  /* ------------------------------------------------------------------
     7. Reservation form — real client-side validation, demo submit
     ------------------------------------------------------------------ */
  var form = document.getElementById("reserveForm");
  var confirmation = document.getElementById("confirmation");
  var confName = document.getElementById("confName");
  var confSummary = document.getElementById("confSummary");
  var resetButton = document.getElementById("resetForm");

  var dateInput = document.getElementById("f-date");
  var minDate = (function () {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  })();
  dateInput.setAttribute("min", minDate);

  var validators = {
    "f-name": function (value) {
      if (!value.trim()) return "Please tell us your name.";
      if (value.trim().length < 2) return "That name looks a little short.";
      return "";
    },
    "f-date": function (value) {
      if (!value) return "Choose a date for dinner.";
      if (value < minDate) return "We do not travel to the past — pick today or later.";
      return "";
    },
    "f-time": function (value) {
      return value ? "" : "Pick a service time.";
    },
    "f-party": function (value) {
      return value ? "" : "How many will join the table?";
    },
    "f-notes": function () {
      return ""; /* optional field */
    }
  };

  function setFieldError(field, message) {
    var errorEl = document.getElementById(
      field.getAttribute("aria-describedby")
    );
    var invalid = Boolean(message);
    field.setAttribute("aria-invalid", String(invalid));
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = !invalid;
    }
  }

  function validateField(field) {
    var message = validators[field.id](field.value);
    setFieldError(field, message);
    return !message;
  }

  var fields = Object.keys(validators).map(function (id) {
    return document.getElementById(id);
  });

  fields.forEach(function (field) {
    var eventName = field.matches("select, input[type=date]")
      ? "change"
      : "input";
    field.addEventListener(eventName, function () {
      /* only re-check live once a field has shown an error */
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
    field.addEventListener("blur", function () {
      if (field.value !== "") validateField(field);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var firstInvalid = null;
    fields.forEach(function (field) {
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var name = document.getElementById("f-name").value.trim();
    var date = new Date(dateInput.value + "T12:00:00");
    var prettyDate = date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
    var time = document.getElementById("f-time").value;
    var party = document.getElementById("f-party").value;

    confName.textContent = name.split(/\s+/)[0];
    confSummary.textContent =
      "A table for " + party + (party === "1" ? " guest" : " guests") +
      " on " + prettyDate + " at " + time + ".";

    form.hidden = true;
    confirmation.hidden = false;
    confirmation.focus();
  });

  resetButton.addEventListener("click", function () {
    form.reset();
    fields.forEach(function (field) {
      setFieldError(field, "");
    });
    confirmation.hidden = true;
    form.hidden = false;
    document.getElementById("f-name").focus();
  });
})();
