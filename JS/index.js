/* Homepage interactions: counters, period switch, navigation, notifications and transaction details. */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.querySelector(".dashboard");
  const toast = document.querySelector(".interaction-toast");
  let toastTimer;
  const announce = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.remove("toast-show");
    requestAnimationFrame(() => toast.classList.add("toast-show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => { toast.hidden = true; }, 220);
    }, 2400);
  };

  // Animate each displayed monetary/percentage value when the page enters.
  const animateNumber = (element) => {
    if (element.dataset.animated === "true") return;
    element.dataset.animated = "true";
    const original = element.textContent.trim();
    const match = original.match(/^([^\d-]*)(-?\d[\d.,]*)(.*)$/);
    if (!match) return;
    const [, prefix, numberText, suffix] = match;
    const numeric = Number(numberText.replace(/,/g, "").replace(/\.(?=.*\.)/g, "").replace(/,(?=.*[,])/g, ""));
    if (!Number.isFinite(numeric)) return;
    const duration = 850;
    const start = performance.now();
    const decimals = (numberText.split(/[.,]/).pop() || "").length;
    const useGrouping = /,/.test(numberText);
    const decimalMark = numberText.includes(",") && numberText.lastIndexOf(",") > numberText.lastIndexOf(".") ? "," : ".";
    const format = (value) => {
      let fixed = Math.abs(value).toFixed(Math.min(decimals, 2));
      let [whole, fraction] = fixed.split(".");
      if (useGrouping) whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return (value < 0 ? "-" : "") + whole + (fraction ? decimalMark + fraction : "");
    };
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = prefix + format(numeric * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else element.textContent = original;
    };
    element.textContent = prefix + format(0) + suffix;
    requestAnimationFrame(tick);
  };
  document.querySelectorAll(".total-item strong, .budget-percent, .budget-limit, .summary-row strong, .transaction-amount").forEach(animateNumber);

  // Small entrance motion for cards and rows.
  document.querySelectorAll(".total-item, .budget, .savings-card, .period-switch, .transaction").forEach((item, index) => {
    item.classList.add("motion-ready");
    item.style.setProperty("--motion-delay", `${Math.min(index * 65, 520)}ms`);
  });

  // Daily / Weekly / Monthly are real controls: selection updates the view label and context.
  const periodButtons = [...document.querySelectorAll(".period-switch [data-period]")];
  const periodLabels = document.querySelectorAll(".transaction-category");
  const periodDescriptions = {
    Daily: { message: "Daily transaction view selected", labels: ["Today", "Today", "Today"] },
    Weekly: { message: "Weekly transaction view selected", labels: ["Weekly", "Pantry", "Rent"] },
    Monthly: { message: "Monthly transaction view selected", labels: ["Monthly", "Pantry", "Rent"] }
  };
  periodButtons.forEach((button) => button.addEventListener("click", () => {
    const period = button.dataset.period;
    periodButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    periodLabels.forEach((label, index) => { label.textContent = periodDescriptions[period].labels[index] || label.textContent; });
    document.querySelector(".transactions")?.setAttribute("data-period", period.toLowerCase());
    announce(periodDescriptions[period].message);
  }));

  // Notifications button opens and closes an actual in-page notice.
  const notificationButton = document.querySelector(".notification");
  notificationButton?.addEventListener("click", () => {
    const open = notificationButton.getAttribute("aria-expanded") === "true";
    notificationButton.setAttribute("aria-expanded", String(!open));
    notificationButton.classList.toggle("is-pressed", !open);
    announce(open ? "Notifications closed" : "You’re all caught up — no new notifications.");
  });

  // Transaction rows can be selected to reveal a useful summary.
  document.querySelectorAll(".transaction").forEach((row) => {
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `${row.querySelector("h2")?.textContent || "Transaction"} details`);
    const showDetails = () => {
      const name = row.querySelector("h2")?.textContent || "Transaction";
      const date = row.querySelector("p")?.textContent || "Date not available";
      const amount = row.querySelector(".transaction-amount")?.textContent || "Amount not available";
      announce(`${name} · ${date} · ${amount}`);
      row.classList.add("transaction-selected");
      setTimeout(() => row.classList.remove("transaction-selected"), 650);
    };
    row.addEventListener("click", showDetails);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showDetails(); }
    });
  });

  // Navigation: use the actual HTML page paths supplied for the project.
  // Do not preventDefault here: the browser must navigate to the linked pages.
  const navItems = [...document.querySelectorAll(".bottom-nav .nav-item")];
  const currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const pageMap = {
    "index.html": "Home",
    "daily.html": "Analysis",
    "tranact.html": "Transactions",
    "categ.html": "Categories",
    "prof.html": "Profile"
  };
  navItems.forEach((item) => {
    const target = (item.getAttribute("href") || "").split("/").pop().toLowerCase();
    const active = target === currentPage;
    item.classList.toggle("selected", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
    // Keep original SVG intact. Only wrap it for the selected-state styling.
    const icon = item.querySelector("img");
    const wrapper = item.querySelector(".nav-highlight");
    if (active && icon && !wrapper) {
      const highlight = document.createElement("span");
      highlight.className = "nav-highlight";
      icon.parentNode.insertBefore(highlight, icon);
      highlight.appendChild(icon);
    } else if (!active && wrapper) {
      wrapper.parentNode.insertBefore(icon, wrapper);
      wrapper.remove();
    }
  });

  // Make all button-like controls give immediate feedback, respecting reduced motion.
  dashboard?.querySelectorAll("button, .nav-item").forEach((control) => {
    control.addEventListener("pointerdown", () => control.classList.add("is-pressed"));
    ["pointerup", "pointercancel", "pointerleave", "blur"].forEach((type) => control.addEventListener(type, () => {
      if (control !== notificationButton || notificationButton.getAttribute("aria-expanded") !== "true") control.classList.remove("is-pressed");
    }));
  });
});
