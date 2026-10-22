/* Analysis / Daily page: period switch, animated chart and totals, search, calendar,
   notifications, target details and back navigation. All figures are demo data. */
"use strict";

// ---------- Demo data: one dataset per period; totals are always the sum of its buckets ----------
const DEMO_DATA = {
  daily: {
    label: "Daily",
    range: "Oct 19 – 25, 2026",
    buckets: [
      { label: "Mon", name: "Mon, Oct 19", start: "2026-10-19", end: "2026-10-19", income: 620, expense: 260 },
      { label: "Tue", name: "Tue, Oct 20", start: "2026-10-20", end: "2026-10-20", income: 180, expense: 140 },
      { label: "Wed", name: "Wed, Oct 21", start: "2026-10-21", end: "2026-10-21", income: 900, expense: 155 },
      { label: "Thu", name: "Thu, Oct 22", start: "2026-10-22", end: "2026-10-22", income: 110, expense: 190 },
      { label: "Fri", name: "Fri, Oct 23", start: "2026-10-23", end: "2026-10-23", income: 1350, expense: 285.4 },
      { label: "Sat", name: "Sat, Oct 24", start: "2026-10-24", end: "2026-10-24", income: 380, expense: 22 },
      { label: "Sun", name: "Sun, Oct 25", start: "2026-10-25", end: "2026-10-25", income: 580, expense: 135 }
    ]
  },
  weekly: {
    label: "Weekly",
    range: "Oct 1 – 25, 2026",
    buckets: [
      { label: "Oct 1", name: "Oct 1 – 4", start: "2026-10-01", end: "2026-10-04", income: 3860, expense: 1420.6 },
      { label: "Oct 5", name: "Oct 5 – 11", start: "2026-10-05", end: "2026-10-11", income: 4475, expense: 980.25 },
      { label: "Oct 12", name: "Oct 12 – 18", start: "2026-10-12", end: "2026-10-18", income: 3990, expense: 1315.75 },
      { label: "Oct 19", name: "Oct 19 – 25", start: "2026-10-19", end: "2026-10-25", income: 4120, expense: 1187.4 }
    ]
  },
  monthly: {
    label: "Monthly",
    range: "May – Oct 2026",
    buckets: [
      { label: "May", name: "May 2026", start: "2026-05-01", end: "2026-05-31", income: 15800, expense: 5210.3 },
      { label: "Jun", name: "June 2026", start: "2026-06-01", end: "2026-06-30", income: 16240, expense: 4875.9 },
      { label: "Jul", name: "July 2026", start: "2026-07-01", end: "2026-07-31", income: 15120, expense: 6120.45 },
      { label: "Aug", name: "August 2026", start: "2026-08-01", end: "2026-08-31", income: 17350, expense: 5340.1 },
      { label: "Sep", name: "September 2026", start: "2026-09-01", end: "2026-09-30", income: 16480, expense: 4995.6 },
      { label: "Oct", name: "October 2026", start: "2026-10-01", end: "2026-10-25", income: 16445, expense: 4904 }
    ]
  },
  year: {
    label: "Year",
    range: "2022 – 2026",
    buckets: [
      { label: "2022", name: "2022", start: "2022-01-01", end: "2022-12-31", income: 168400, expense: 61240.5 },
      { label: "2023", name: "2023", start: "2023-01-01", end: "2023-12-31", income: 176950, expense: 64815.2 },
      { label: "2024", name: "2024", start: "2024-01-01", end: "2024-12-31", income: 184300, expense: 59870.75 },
      { label: "2025", name: "2025", start: "2025-01-01", end: "2025-12-31", income: 191750, expense: 63105.4 },
      { label: "2026", name: "2026 (to Oct 25)", start: "2026-01-01", end: "2026-10-25", income: 161410, expense: 51903.35 }
    ]
  }
};

const TARGETS = {
  travel: { name: "Travel", saved: 1500, goal: 5000 },
  car: { name: "Car", saved: 6000, goal: 12000 }
};

const PLOT_HEIGHT = 132; // px between the baseline and the top gridline
const TICK_COUNT = 4;
const COUNTER_DURATION = 500;
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
// Expense totals use the design's notation with dot grouping ("$1.187.40"), as on the Home page.
const formatTotal = { income: (value) => money.format(value), expense: (value) => money.format(value).replace(/,/g, ".") };
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// ---------- Pure helpers ----------
const sumBy = (buckets, key) => buckets.reduce((cents, bucket) => cents + Math.round(bucket[key] * 100), 0) / 100;

const niceStep = (raw) => {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return NICE_STEPS.find((step) => step * magnitude >= raw) * magnitude;
};

const formatTick = (value) => (value >= 1000 ? `${Number((value / 1000).toFixed(1))}k` : String(value));

const describeBucket = (bucket) => `${bucket.name}: income ${money.format(bucket.income)}, expense ${money.format(bucket.expense)}`;

const buildView = (key) => {
  const dataset = DEMO_DATA[key];
  const max = Math.max(...dataset.buckets.flatMap((bucket) => [bucket.income, bucket.expense]));
  const step = niceStep(max / TICK_COUNT);
  return {
    key,
    ...dataset,
    income: sumBy(dataset.buckets, "income"),
    expense: sumBy(dataset.buckets, "expense"),
    scaleMax: step * TICK_COUNT,
    ticks: Array.from({ length: TICK_COUNT }, (_, index) => step * (TICK_COUNT - index))
  };
};

document.addEventListener("DOMContentLoaded", () => {
  const state = { period: "daily", selected: null, query: "", displayed: { income: 0, expense: 0 } };

  const els = {
    switchButtons: [...document.querySelectorAll(".period-switch [data-period]")],
    groups: document.getElementById("chart-groups"),
    ticks: [...document.querySelectorAll(".y-axis li")],
    range: document.getElementById("chart-range"),
    totals: { income: document.getElementById("income-total"), expense: document.getElementById("expense-total") },
    toast: document.querySelector(".toast")
  };

  // ---------- Toast (status messages) ----------
  let toastTimer;
  const announce = (message) => {
    const { toast } = els;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.remove("is-visible");
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => { toast.hidden = true; }, 220);
    }, 2600);
  };

  // ---------- Animated counters (cancel any running animation before starting a new one) ----------
  const counterFrames = {};
  const counterTimers = {};
  const animateTotal = (key, target) => {
    const element = els.totals[key];
    cancelAnimationFrame(counterFrames[key]);
    clearTimeout(counterTimers[key]);
    const from = state.displayed[key];
    const finish = () => {
      cancelAnimationFrame(counterFrames[key]);
      state.displayed[key] = target;
      element.textContent = formatTotal[key](target);
    };
    if (reducedMotion.matches || from === target) { finish(); return; }
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / COUNTER_DURATION);
      if (progress >= 1) { finish(); return; }
      const eased = 1 - (1 - progress) ** 3;
      state.displayed[key] = from + (target - from) * eased;
      element.textContent = formatTotal[key](state.displayed[key]);
      counterFrames[key] = requestAnimationFrame(tick);
    };
    counterFrames[key] = requestAnimationFrame(tick);
    // Background tabs throttle animation frames; make sure the final value always lands.
    counterTimers[key] = setTimeout(finish, COUNTER_DURATION + 80);
  };

  // ---------- Chart ----------
  const barHeight = (value, scaleMax) => (value > 0 ? Math.max(2, (value / scaleMax) * PLOT_HEIGHT) : 0);

  const createGroup = () => {
    const item = document.createElement("li");
    item.className = "chart-group";
    item.innerHTML = `
      <span class="sr-only"></span>
      <span class="bars" aria-hidden="true"><span class="bar bar--income"></span><span class="bar bar--expense"></span></span>
      <span class="chart-label" aria-hidden="true"></span>`;
    return item;
  };

  const matchesQuery = (bucket, query) => {
    if (!query) return false;
    if (bucket.label.toLowerCase().includes(query) || bucket.name.toLowerCase().includes(query)) return true;
    const digits = query.replace(/[^\d.]/g, "");
    if (!digits) return false;
    return [bucket.income, bucket.expense].some((value) => money.format(value).replace(/[$,]/g, "").includes(digits));
  };

  const applyHighlight = () => {
    const buckets = DEMO_DATA[state.period].buckets;
    const focus = state.query
      ? buckets.map((bucket) => matchesQuery(bucket, state.query))
      : buckets.map((_, index) => index === state.selected);
    const anyFocus = (state.query !== "" || state.selected !== null);
    [...els.groups.children].forEach((group, index) => {
      group.classList.toggle("is-dimmed", anyFocus && !focus[index]);
      group.classList.toggle("is-selected", index === state.selected);
    });
  };

  const renderChart = (view) => {
    const { groups } = els;
    const rebuild = groups.children.length !== view.buckets.length;
    if (rebuild) {
      groups.replaceChildren(...view.buckets.map(createGroup));
      groups.style.setProperty("--count", view.buckets.length);
      groups.getBoundingClientRect(); // commit the 0px heights so the new bars grow from the baseline
    }
    groups.setAttribute("aria-label", `Income and expenses, ${view.label.toLowerCase()} view, ${view.range}`);
    view.buckets.forEach((bucket, index) => {
      const group = groups.children[index];
      group.querySelector(".sr-only").textContent = describeBucket(bucket);
      group.querySelector(".chart-label").textContent = bucket.label;
      group.querySelector(".bar--income").style.height = `${barHeight(bucket.income, view.scaleMax)}px`;
      group.querySelector(".bar--expense").style.height = `${barHeight(bucket.expense, view.scaleMax)}px`;
    });
    els.ticks.forEach((tick, index) => { tick.textContent = formatTick(view.ticks[index]); });
    els.range.textContent = `${view.label}, ${view.range} (demo data)`;
    applyHighlight();
  };

  // ---------- Period selector ----------
  const setPeriod = (key, { selected = null } = {}) => {
    state.period = key;
    state.selected = selected;
    els.switchButtons.forEach((button) => {
      const active = button.dataset.period === key;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const view = buildView(key);
    renderChart(view);
    animateTotal("income", view.income);
    animateTotal("expense", view.expense);
    refreshSearchResults();
  };

  els.switchButtons.forEach((button, index) => {
    button.tabIndex = button.classList.contains("active") ? 0 : -1;
    button.addEventListener("click", () => {
      const key = button.dataset.period;
      if (key === state.period) {
        // Re-selecting the active period resets any highlighted bucket.
        if (state.selected !== null) { state.selected = null; applyHighlight(); }
        return;
      }
      setPeriod(key);
      announce(`${DEMO_DATA[key].label} view: ${DEMO_DATA[key].range}`);
    });
    button.addEventListener("keydown", (event) => {
      const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!offset) return;
      event.preventDefault();
      const next = els.switchButtons[(index + offset + els.switchButtons.length) % els.switchButtons.length];
      next.focus();
      next.click();
    });
  });

  // ---------- Popovers (notifications, search, calendar) ----------
  const popoverHooks = {};
  let openPopover = null;

  const closePopover = ({ restoreFocus = false } = {}) => {
    if (!openPopover) return;
    const { panel, trigger } = openPopover;
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    popoverHooks[panel.id]?.onClose?.();
    openPopover = null;
    if (restoreFocus) trigger.focus();
  };

  const showPopover = (trigger, panel) => {
    closePopover();
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    openPopover = { panel, trigger };
    popoverHooks[panel.id]?.onOpen?.();
    (panel.querySelector("input:not([type=radio]), input:checked") || panel.querySelector("button"))?.focus();
  };

  document.querySelectorAll("[data-popover-trigger]").forEach((trigger) => {
    const panel = document.getElementById(trigger.dataset.popoverTrigger);
    trigger.addEventListener("click", () => {
      if (openPopover?.panel === panel) closePopover();
      else showPopover(trigger, panel);
    });
  });
  document.querySelectorAll(".popover [data-popover-close]").forEach((button) => {
    button.addEventListener("click", () => closePopover({ restoreFocus: true }));
  });
  document.addEventListener("click", (event) => {
    if (!openPopover) return;
    if (openPopover.panel.contains(event.target) || openPopover.trigger.contains(event.target)) return;
    closePopover();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (openPopover) closePopover({ restoreFocus: true });
    else if (state.selected !== null) { state.selected = null; applyHighlight(); }
  });

  // Search: filter the current period's buckets by label or amount.
  const searchInput = document.getElementById("chart-search");
  const searchResults = document.getElementById("search-results");

  function refreshSearchResults() {
    if (document.getElementById("search-panel").hidden) return;
    const buckets = DEMO_DATA[state.period].buckets;
    const list = state.query ? buckets.filter((bucket) => matchesQuery(bucket, state.query)) : buckets;
    if (!list.length) {
      searchResults.innerHTML = `<li class="search-empty">No ${DEMO_DATA[state.period].label.toLowerCase()} entries match “${searchInput.value.trim()}”.</li>`;
      return;
    }
    searchResults.replaceChildren(...list.map((bucket) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      button.innerHTML = `<b></b><span class="amounts"><span class="income"></span> · <span class="expense"></span></span>`;
      button.querySelector("b").textContent = bucket.name;
      button.querySelector(".income").textContent = `+${money.format(bucket.income)}`;
      button.querySelector(".expense").textContent = `-${money.format(bucket.expense)}`;
      button.setAttribute("aria-label", `Highlight ${describeBucket(bucket)}`);
      button.addEventListener("click", () => {
        state.selected = buckets.indexOf(bucket);
        closePopover({ restoreFocus: true });
        applyHighlight();
        announce(describeBucket(bucket));
      });
      item.append(button);
      return item;
    }));
  }

  popoverHooks["search-panel"] = {
    onOpen: () => { state.query = ""; searchInput.value = ""; refreshSearchResults(); },
    onClose: () => { state.query = ""; searchInput.value = ""; applyHighlight(); }
  };
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim().toLowerCase();
    applyHighlight();
    refreshSearchResults();
  });

  // Calendar: choose a period and a date, then highlight the bucket containing that date.
  const calendarForm = document.querySelector(".calendar-form");
  const dateInput = document.getElementById("calendar-date");
  const calendarHint = document.getElementById("calendar-hint");
  const calendarError = document.getElementById("calendar-error");
  const periodRadios = [...calendarForm.querySelectorAll("input[name=calendar-period]")];

  const configureDateInput = (key) => {
    const buckets = DEMO_DATA[key].buckets;
    dateInput.min = buckets[0].start;
    dateInput.max = buckets[buckets.length - 1].end;
    if (!dateInput.value || dateInput.value < dateInput.min || dateInput.value > dateInput.max) dateInput.value = dateInput.max;
    calendarHint.textContent = `Demo data covers ${DEMO_DATA[key].range}.`;
    calendarError.textContent = "";
  };

  popoverHooks["calendar-panel"] = {
    onOpen: () => {
      periodRadios.forEach((radio) => { radio.checked = radio.value === state.period; });
      const buckets = DEMO_DATA[state.period].buckets;
      dateInput.value = state.selected !== null ? buckets[state.selected].start : "";
      configureDateInput(state.period);
    },
    onClose: () => { calendarError.textContent = ""; }
  };
  periodRadios.forEach((radio) => radio.addEventListener("change", () => configureDateInput(radio.value)));

  calendarForm.addEventListener("submit", (event) => {
    event.preventDefault(); // handled in-page; there is no server to submit to
    const key = periodRadios.find((radio) => radio.checked)?.value || state.period;
    const date = dateInput.value;
    const buckets = DEMO_DATA[key].buckets;
    const index = buckets.findIndex((bucket) => date >= bucket.start && date <= bucket.end);
    if (!date || index === -1) {
      calendarError.textContent = `Pick a date within ${DEMO_DATA[key].range}.`;
      dateInput.focus();
      return;
    }
    closePopover({ restoreFocus: true });
    if (key === state.period) { state.selected = index; applyHighlight(); }
    else setPeriod(key, { selected: index });
    announce(describeBucket(buckets[index]));
  });

  // ---------- Target details dialog ----------
  const dialog = document.getElementById("target-dialog");
  const progressBar = dialog.querySelector(".dialog-progress");
  dialog.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

  document.querySelectorAll(".target-card").forEach((card) => {
    const target = TARGETS[card.dataset.target];
    const percent = Math.round((target.saved / target.goal) * 100);
    card.setAttribute("aria-label", `${target.name} target, ${percent}% saved. Show details`);
    card.addEventListener("click", () => {
      dialog.querySelector("#target-dialog-title").textContent = `${target.name} target`;
      dialog.querySelector("#target-progress").textContent = `${percent}%`;
      dialog.querySelector("#target-saved").textContent = money.format(target.saved);
      dialog.querySelector("#target-goal").textContent = money.format(target.goal);
      dialog.querySelector("#target-remaining").textContent = money.format(target.goal - target.saved);
      dialog.querySelector("#target-note").textContent = "Demo goal — illustrative figures, not linked to a bank account.";
      progressBar.setAttribute("aria-valuenow", String(percent));
      progressBar.style.setProperty("--value", "0%");
      dialog.showModal();
      requestAnimationFrame(() => requestAnimationFrame(() => progressBar.style.setProperty("--value", `${percent}%`)));
    });
  });

  // ---------- Back link: go back within the app, otherwise follow the href to Home ----------
  document.querySelector(".back-link").addEventListener("click", (event) => {
    let sameOrigin = false;
    try { sameOrigin = new URL(document.referrer).origin === location.origin; } catch { sameOrigin = false; }
    if (sameOrigin && history.length > 1) {
      event.preventDefault(); // history.back() replaces the default navigation
      history.back();
    }
  });

  // ---------- Initial render: bars grow from the baseline and totals count up ----------
  setPeriod("daily");
});
