/* ============================================================
   Focus Flow — vanilla ES6 pomodoro timer + task list
   No frameworks, no build step, no globals leaking.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Constants ---------------- */

  var STORE_KEY = "focusflow.v1";

  var MODES = {
    focus: { label: "Focus", seconds: 25 * 60, phase: "Time to focus" },
    short: { label: "Short break", seconds: 5 * 60, phase: "Take a short break" },
    long: { label: "Long break", seconds: 15 * 60, phase: "Take a long break" }
  };

  var MODE_ORDER = ["focus", "short", "long"];
  var FOCUS_SESSIONS_BEFORE_LONG = 4;
  var RING_RADIUS = 124;
  var RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  var BASE_TITLE = "Focus Flow — Pomodoro timer & task list";

  /* ---------------- Tiny helpers ---------------- */

  function $(id) {
    return document.getElementById(id);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatClock(totalSeconds) {
    var s = Math.max(0, Math.ceil(totalSeconds));
    return pad2(Math.floor(s / 60)) + ":" + pad2(s % 60);
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------------- Store (localStorage) ---------------- */

  var Store = {
    state: null,

    defaults: function () {
      return {
        version: 1,
        tasks: [],
        currentTaskId: null,
        settings: { muted: false },
        stats: {
          days: {}, // "YYYY-MM-DD": { sessions, focusSeconds }
          totalSessions: 0,
          focusCycles: 0 // completed focus sessions, drives long-break suggestion
        }
      };
    },

    load: function () {
      var fallback = this.defaults();
      try {
        var raw = localStorage.getItem(STORE_KEY);
        if (!raw) return fallback;
        var parsed = JSON.parse(raw);
        // Shallow migration: fill in any missing top-level keys.
        return Object.assign(fallback, parsed, {
          settings: Object.assign(fallback.settings, parsed.settings),
          stats: Object.assign(fallback.stats, parsed.stats, {
            days: parsed.stats && parsed.stats.days ? parsed.stats.days : {}
          })
        });
      } catch (err) {
        console.warn("Focus Flow: could not read saved data, starting fresh.", err);
        return fallback;
      }
    },

    save: function () {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.warn("Focus Flow: could not persist to localStorage.", err);
      }
    },

    day: function () {
      var key = todayKey();
      var days = this.state.stats.days;
      if (!days[key]) days[key] = { sessions: 0, focusSeconds: 0 };
      return days[key];
    }
  };

  /* ---------------- Sound (WebAudio, created on first gesture) ---------------- */

  var Sound = {
    ctx: null,

    ensureContext: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          try {
            this.ctx = new AC();
          } catch (err) {
            this.ctx = null;
          }
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    },

    tone: function (freq, startOffset, duration) {
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      var t0 = this.ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.05);
    },

    chime: function (isFocusEnd) {
      if (Store.state.settings.muted) return;
      this.ensureContext();
      if (!this.ctx) return;
      if (isFocusEnd) {
        this.tone(660, 0, 0.35);
        this.tone(880, 0.18, 0.45);
      } else {
        this.tone(880, 0, 0.3);
        this.tone(660, 0.16, 0.4);
      }
    }
  };

  /* ---------------- Toasts + screen-reader announcements ---------------- */

  var Notify = {
    region: $("toast-region"),
    srStatus: $("sr-status"),

    toast: function (html, speak) {
      var el = document.createElement("div");
      el.className = "toast";
      el.innerHTML = html;
      this.region.appendChild(el);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.add("is-visible");
        });
      });
      setTimeout(function () {
        el.classList.remove("is-visible");
        setTimeout(function () {
          el.remove();
        }, 300);
      }, 4200);
      if (speak !== undefined) {
        this.srStatus.textContent = speak;
      }
    },

    announce: function (message) {
      this.srStatus.textContent = message;
    }
  };

  /* ---------------- Timer ---------------- */

  var Timer = {
    mode: "focus",
    running: false,
    remainingMs: MODES.focus.seconds * 1000,
    endAt: 0, // absolute timestamp; every tick derives remaining from it (drift-free)

    els: {
      display: $("time-display"),
      phase: $("phase-label"),
      ring: $("ring-progress"),
      start: $("btn-start"),
      reset: $("btn-reset"),
      tabs: Array.prototype.slice.call(document.querySelectorAll(".mode-tab")),
      workingOn: $("working-on")
    },

    init: function () {
      var self = this;
      this.els.ring.style.strokeDasharray = String(RING_CIRCUMFERENCE);
      this.els.start.addEventListener("click", function () {
        Sound.ensureContext(); // unlock audio on user gesture
        self.toggle();
      });
      this.els.reset.addEventListener("click", function () {
        self.reset();
      });
      this.els.tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          self.setMode(tab.dataset.mode);
        });
      });
      setInterval(function () { self.tick(); }, 250); // single heartbeat; running flag does the work
      this.render();
    },

    totalMs: function () {
      return MODES[this.mode].seconds * 1000;
    },

    setMode: function (mode, options) {
      if (!MODES[mode] || (mode === this.mode && !options)) return;
      this.mode = mode;
      this.running = false;
      this.remainingMs = this.totalMs();
      this.render();
      if (!options || !options.silent) {
        Notify.announce(MODES[mode].label + " mode selected.");
      }
    },

    toggle: function () {
      if (this.running) {
        this.pause();
      } else {
        this.start();
      }
    },

    start: function () {
      if (this.running || this.remainingMs <= 0) return;
      this.endAt = Date.now() + this.remainingMs;
      this.running = true;
      this.render();
      Notify.announce(MODES[this.mode].label + " timer started.");
    },

    pause: function () {
      if (!this.running) return;
      this.remainingMs = Math.max(0, this.endAt - Date.now());
      this.running = false;
      this.render();
      Notify.announce("Timer paused with " + formatClock(this.remainingMs / 1000) + " remaining.");
    },

    reset: function () {
      this.running = false;
      this.remainingMs = this.totalMs();
      this.render();
      Notify.announce("Timer reset.");
    },

    tick: function () {
      if (!this.running) return; // heartbeat is inert while paused; no render churn
      this.remainingMs = this.endAt - Date.now();
      if (this.remainingMs <= 0) {
        this.remainingMs = 0;
        this.onComplete();
      }
      this.render();
    },

    onComplete: function () {
      this.running = false;
      var wasFocus = this.mode === "focus";
      var stats = Store.state.stats;

      if (wasFocus) {
        var day = Store.day();
        day.sessions += 1;
        day.focusSeconds += MODES.focus.seconds;
        stats.totalSessions += 1;
        stats.focusCycles += 1;

        var task = Tasks.getCurrent();
        if (task) {
          task.completedPomodoros += 1;
        }
        Tasks.render();
        Stats.render();
      }

      Store.save();
      Sound.chime(wasFocus);

      var nextMode;
      if (wasFocus) {
        nextMode =
          stats.focusCycles % FOCUS_SESSIONS_BEFORE_LONG === 0 ? "long" : "short";
        Notify.toast(
          "<strong>Focus session complete.</strong> Time for a " +
            MODES[nextMode].label.toLowerCase() + ".",
          "Focus session complete. " + MODES[nextMode].phase + "."
        );
      } else {
        nextMode = "focus";
        Notify.toast(
          "<strong>Break over.</strong> Ready when you are.",
          "Break finished. Ready to focus."
        );
      }

      this.setMode(nextMode, { silent: true });
    },

    render: function () {
      var secs = this.remainingMs / 1000;
      var clock = formatClock(secs);
      var conf = MODES[this.mode];

      this.els.display.textContent = clock;
      this.els.phase.textContent = conf.phase;

      var fraction = this.totalMs() > 0 ? this.remainingMs / this.totalMs() : 0;
      fraction = Math.min(1, Math.max(0, fraction));
      this.els.ring.style.strokeDashoffset = String(
        RING_CIRCUMFERENCE * (1 - fraction)
      );

      var label = this.running
        ? "Pause"
        : this.remainingMs > 0 && this.remainingMs < this.totalMs()
          ? "Resume"
          : "Start";
      this.els.start.textContent = label;
      this.els.start.setAttribute(
        "aria-label",
        label === "Pause" ? "Pause timer" : "Start timer"
      );

      // Mode tab state
      var self = this;
      this.els.tabs.forEach(function (tab) {
        var active = tab.dataset.mode === self.mode;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-pressed", String(active));
      });

      // Mode class on body (ring colour for breaks)
      MODE_ORDER.forEach(function (m) {
        document.body.classList.toggle("mode-" + m, m === self.mode);
      });

      // "Working on" chip
      var task = Tasks.getCurrent();
      if (task) {
        this.els.workingOn.hidden = false;
        this.els.workingOn.innerHTML =
          "Now working on <strong>" + escapeHtml(task.title) + "</strong> · " +
          task.completedPomodoros + "/" + task.estimate + " pomodoros";
      } else {
        this.els.workingOn.hidden = true;
      }

      // Document title with remaining time
      document.title =
        (this.running || this.remainingMs < this.totalMs()
          ? clock + " · " + conf.label + " — "
          : "") + BASE_TITLE;
    }
  };

  /* ---------------- Tasks ---------------- */

  var Tasks = {
    listEl: $("task-list"),
    emptyEl: $("task-empty"),
    formEl: $("task-form"),
    inputEl: $("task-input"),
    estimateEl: $("task-estimate"),
    editingId: null,

    init: function () {
      var self = this;
      this.formEl.addEventListener("submit", function (e) {
        e.preventDefault();
        var title = self.inputEl.value.trim();
        if (!title) return;
        var estimate = parseInt(self.estimateEl.value, 10);
        if (!estimate || estimate < 1) estimate = 1;
        Store.state.tasks.push({
          id: uid(),
          title: title,
          estimate: Math.min(12, estimate),
          completedPomodoros: 0,
          done: false,
          createdAt: Date.now()
        });
        self.inputEl.value = "";
        self.estimateEl.value = "1";
        Store.save();
        self.render();
        Timer.render();
        self.inputEl.focus();
      });

      // Event delegation for all task actions
      this.listEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var item = btn.closest(".task-item");
        var id = item && item.dataset.id;
        if (!id) return;
        var action = btn.dataset.action;
        if (action === "delete") self.remove(id);
        else if (action === "edit") self.beginEdit(id);
        else if (action === "current") self.toggleCurrent(id);
        else if (action === "save-edit") self.commitEdit(id);
        else if (action === "cancel-edit") {
          self.editingId = null;
          self.render();
        }
      });

      this.listEl.addEventListener("change", function (e) {
        var item = e.target.closest(".task-item");
        if (item && e.target.classList.contains("task-check")) {
          self.setDone(item.dataset.id, e.target.checked);
        }
      });

      this.listEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && e.target.closest(".task-edit-form")) {
          e.preventDefault();
          var item = e.target.closest(".task-item");
          self.commitEdit(item.dataset.id);
        } else if (e.key === "Escape" && e.target.closest(".task-edit-form")) {
          self.editingId = null;
          self.render();
        }
      });
    },

    get: function (id) {
      return Store.state.tasks.find(function (t) {
        return t.id === id;
      });
    },

    getCurrent: function () {
      var id = Store.state.currentTaskId;
      return id ? this.get(id) : null;
    },

    remove: function (id) {
      Store.state.tasks = Store.state.tasks.filter(function (t) {
        return t.id !== id;
      });
      if (Store.state.currentTaskId === id) Store.state.currentTaskId = null;
      Store.save();
      this.render();
      Timer.render();
      Notify.announce("Task deleted.");
    },

    setDone: function (id, done) {
      var task = this.get(id);
      if (!task) return;
      task.done = done;
      if (done && Store.state.currentTaskId === id) {
        Store.state.currentTaskId = null;
      }
      Store.save();
      this.render();
      Timer.render();
      Notify.announce(done ? "Task marked done." : "Task reopened.");
    },

    toggleCurrent: function (id) {
      var task = this.get(id);
      if (!task || task.done) return;
      Store.state.currentTaskId =
        Store.state.currentTaskId === id ? null : id;
      Store.save();
      this.render();
      Timer.render();
      Notify.announce(
        Store.state.currentTaskId === id
          ? "Now working on " + task.title
          : "Current task cleared."
      );
    },

    beginEdit: function (id) {
      this.editingId = id;
      this.render();
      var input = this.listEl.querySelector('[data-id="' + id + '"] .edit-title');
      if (input) {
        input.focus();
        input.select();
      }
    },

    commitEdit: function (id) {
      var row = this.listEl.querySelector('[data-id="' + id + '"]');
      var task = this.get(id);
      if (!row || !task) return;
      var title = row.querySelector(".edit-title").value.trim();
      var estimate = parseInt(row.querySelector(".edit-estimate").value, 10);
      if (title) task.title = title.slice(0, 120);
      if (estimate >= 1) task.estimate = Math.min(12, estimate);
      this.editingId = null;
      Store.save();
      this.render();
      Timer.render();
    },

    pomGlyphs: function (task) {
      var out = "";
      for (var i = 0; i < task.estimate; i++) {
        out += i < task.completedPomodoros ? "●" : "○";
      }
      return out;
    },

    render: function () {
      var tasks = Store.state.tasks;
      var self = this;

      this.emptyEl.hidden = tasks.length > 0;
      this.listEl.innerHTML = tasks
        .map(function (t) {
          var isCurrent = Store.state.currentTaskId === t.id;
          var cls =
            "task-item" +
            (isCurrent ? " is-current" : "") +
            (t.done ? " is-done" : "");
          var check =
            '<input type="checkbox" class="task-check" aria-label="' +
            (t.done ? "Mark not done: " : "Mark done: ") + escapeHtml(t.title) +
            '" ' + (t.done ? "checked" : "") + " />";

          var body;
          if (self.editingId === t.id) {
            body =
              '<span class="task-edit-form">' +
              '<input type="text" class="edit-title" maxlength="120" value="' +
              escapeHtml(t.title) + '" aria-label="Task name" />' +
              '<input type="number" class="edit-estimate" min="1" max="12" value="' +
              t.estimate + '" aria-label="Estimated pomodoros" /></span>';
          } else {
            body =
              '<div class="task-body"><p class="task-title">' +
              escapeHtml(t.title) +
              '</p><p class="task-meta"><span class="pom" aria-hidden="true">' +
              self.pomGlyphs(t) + "</span> " + t.completedPomodoros + "/" + t.estimate +
              " pomodoros" + (isCurrent ? " · current" : "") + "</p></div>";
          }

          var actions;
          if (self.editingId === t.id) {
            actions =
              '<button type="button" class="task-btn" data-action="save-edit">Save</button>' +
              '<button type="button" class="task-btn" data-action="cancel-edit">Cancel</button>';
          } else {
            actions =
              (t.done
                ? ""
                : '<button type="button" class="task-btn" data-action="current" aria-pressed="' +
                  isCurrent +
                  '">' +
                  (isCurrent ? "Unset" : "Focus") +
                  "</button>") +
              '<button type="button" class="task-btn" data-action="edit">Edit</button>' +
              '<button type="button" class="task-btn danger" data-action="delete" aria-label="Delete task ' +
              escapeHtml(t.title) +
              '">Delete</button>';
          }

          return (
            '<li class="' + cls + '" data-id="' + t.id + '">' +
            check + body + '<div class="task-actions">' + actions + "</div></li>"
          );
        })
        .join("");
    }
  };

  /* ---------------- Stats strip ---------------- */

  var Stats = {
    els: {
      sessions: $("stat-sessions"),
      minutes: $("stat-minutes"),
      total: $("stat-total")
    },

    render: function () {
      var day = Store.day();
      this.els.sessions.textContent = String(day.sessions);
      this.els.minutes.textContent = String(Math.round(day.focusSeconds / 60));
      this.els.total.textContent = String(Store.state.stats.totalSessions);
    }
  };

  /* ---------------- Mute toggle ---------------- */

  var Settings = {
    btn: $("mute-toggle"),

    init: function () {
      var self = this;
      this.apply();
      this.btn.addEventListener("click", function () {
        Store.state.settings.muted = !Store.state.settings.muted;
        Store.save();
        self.apply();
        Notify.announce(
          Store.state.settings.muted ? "Sound muted." : "Sound unmuted."
        );
      });
    },

    apply: function () {
      var muted = Store.state.settings.muted;
      this.btn.setAttribute("aria-pressed", String(muted));
      this.btn.setAttribute(
        "aria-label",
        muted
          ? "Sound is muted. Click to unmute the completion chime."
          : "Sound is on. Click to mute the completion chime."
      );
      this.btn.title = muted ? "Unmute completion sound" : "Mute completion sound";
      this.btn.querySelector(".icon-sound-on").hidden = muted;
      this.btn.querySelector(".icon-sound-off").hidden = !muted;
    }
  };

  /* ---------------- Keyboard shortcuts ---------------- */

  var Keys = {
    init: function () {
      document.addEventListener("keydown", function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var target = e.target;
        var tag = target.tagName;

        // Never hijack typing or native button activation.
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }

        if (e.code === "Space") {
          if (tag === "BUTTON" || tag === "A" || tag === "SUMMARY") return; // native activation
          e.preventDefault();
          Sound.ensureContext();
          Timer.toggle();
        } else if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          Timer.reset();
        } else if (e.key === "1") {
          Timer.setMode("focus");
        } else if (e.key === "2") {
          Timer.setMode("short");
        } else if (e.key === "3") {
          Timer.setMode("long");
        }
      });
    }
  };

  /* ---------------- Boot ---------------- */

  function init() {
    Store.state = Store.load();
    // Drop a current-task pointer that references a deleted task.
    if (Store.state.currentTaskId && !Tasks.get(Store.state.currentTaskId)) {
      Store.state.currentTaskId = null;
    }
    Tasks.init();
    Tasks.render();
    Stats.render();
    Settings.init();
    Timer.init();
    Keys.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
