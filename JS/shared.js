/* shared.js — demo data and small UI helpers shared by tranact.html and categ.html. */
"use strict";

// Demo transactions (deterministic sample data, not real bank records).
window.FinanceDemo = (() => {
  const TRANSACTIONS = [
    { id: "salary-apr", name: "Salary", category: "Monthly", categoryId: "salary", date: "2026-04-30", time: "18:27", amount: 4000, icon: "salary", tone: "light" },
    { id: "groceries-apr", name: "Groceries", category: "Pantry", categoryId: "groceries", date: "2026-04-24", time: "17:00", amount: -100, icon: "groceries", tone: "medium" },
    { id: "rent-apr", name: "Rent", category: "Rent", categoryId: "rent", date: "2026-04-15", time: "8:30", amount: -674.4, icon: "rent", tone: "deep" },
    { id: "transport-apr", name: "Transport", category: "Fuel", categoryId: "transport", date: "2026-04-08", time: "7:30", amount: -4.13, icon: "transport", tone: "medium" },
    { id: "food-mar", name: "Food", category: "Dinner", categoryId: "food", date: "2026-03-31", time: "19:30", amount: -70.4, icon: "food", tone: "light" },
    { id: "salary-mar", name: "Salary", category: "Monthly", categoryId: "salary", date: "2026-03-31", time: "18:39", amount: 4000, icon: "salary", tone: "deep" }
  ];

  const ICONS = {
    salary: { src: "public/icons/Vector.svg", w: 26, h: 23 },
    groceries: { src: "public/icons/Vector-1.svg", w: 17, h: 27 },
    rent: { src: "public/icons/Rent.svg", w: 29, h: 25 },
    transport: { src: "public/icons/categories/Vector.svg", w: 27, h: 28 },
    food: { src: "public/icons/Vector-4.svg", w: 16, h: 28, recolor: true }
  };

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Same notation as the design and the Home page: "$4.000,00", "-$100,00".
  const formatAmount = (value) => {
    const [whole, cents] = Math.abs(value).toFixed(2).split(".");
    return `${value < 0 ? "-" : ""}$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cents}`;
  };

  const monthName = (isoDate) => MONTHS[Number(isoDate.slice(5, 7)) - 1];
  const formatDateLabel = (tx) => `${tx.time} - ${monthName(tx.date)} ${tx.date.slice(8, 10)}`;

  return { TRANSACTIONS, ICONS, formatAmount, monthName, formatDateLabel };
})();

window.FinanceUI = (() => {
  // Status toast above the bottom navigation.
  const createAnnouncer = (toast) => {
    let timer;
    return (message) => {
      toast.textContent = message;
      toast.hidden = false;
      toast.classList.remove("is-visible");
      requestAnimationFrame(() => toast.classList.add("is-visible"));
      clearTimeout(timer);
      timer = setTimeout(() => {
        toast.classList.remove("is-visible");
        setTimeout(() => { toast.hidden = true; }, 220);
      }, 2600);
    };
  };

  // One popover open at a time; Escape and outside clicks close it.
  const initPopovers = (hooks = {}) => {
    let open = null;
    const close = ({ restoreFocus = false } = {}) => {
      if (!open) return;
      const { panel, trigger } = open;
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      hooks[panel.id]?.onClose?.();
      open = null;
      if (restoreFocus) trigger.focus();
    };
    const show = (trigger, panel) => {
      close();
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      open = { panel, trigger };
      hooks[panel.id]?.onOpen?.();
      (panel.querySelector("input:checked, input:not([type=radio])") || panel.querySelector("button"))?.focus();
    };
    document.querySelectorAll("[data-popover-trigger]").forEach((trigger) => {
      const panel = document.getElementById(trigger.dataset.popoverTrigger);
      trigger.addEventListener("click", () => (open?.panel === panel ? close() : show(trigger, panel)));
    });
    document.querySelectorAll(".popover [data-popover-close]").forEach((button) => {
      button.addEventListener("click", () => close({ restoreFocus: true }));
    });
    document.addEventListener("click", (event) => {
      if (open && !open.panel.contains(event.target) && !open.trigger.contains(event.target)) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open) close({ restoreFocus: true });
    });
    return { close };
  };

  // <dialog> with [data-dialog-close] buttons; a click on the backdrop closes it too.
  const initDialog = (dialog) => {
    dialog.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    return dialog;
  };

  // Back: return within the site when we came from it, otherwise follow the href (Home).
  const initBackLink = (link) => {
    link?.addEventListener("click", (event) => {
      let sameOrigin = false;
      try { sameOrigin = new URL(document.referrer).origin === location.origin; } catch { sameOrigin = false; }
      if (sameOrigin && history.length > 1) {
        event.preventDefault(); // history.back() replaces the default navigation
        history.back();
      }
    });
  };

  return { createAnnouncer, initPopovers, initDialog, initBackLink };
})();
