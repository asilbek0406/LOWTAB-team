/* tranact.js — Transactions page: list rendering, income/expense and month/date filters, details dialog. */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const { TRANSACTIONS, ICONS, formatAmount, monthName, formatDateLabel } = window.FinanceDemo;
  const { createAnnouncer, initPopovers, initDialog, initBackLink } = window.FinanceUI;

  const announce = createAnnouncer(document.querySelector(".toast"));
  const groupsEl = document.getElementById("tx-groups");
  const typeButtons = [...document.querySelectorAll(".flow-card[data-type]")];
  const filter = { type: "all", month: "all", date: "" };

  // ---------- Rendering ----------
  const matches = (tx) =>
    (filter.type === "all" || (filter.type === "income" ? tx.amount > 0 : tx.amount < 0)) &&
    (filter.month === "all" || tx.date.startsWith(filter.month)) &&
    (!filter.date || tx.date === filter.date);

  const createRow = (tx) => {
    const icon = ICONS[tx.icon];
    const item = document.createElement("li");
    const row = document.createElement("button");
    row.type = "button";
    row.className = "tx-row";
    row.dataset.id = tx.id;
    row.innerHTML = `
      <span class="tx-icon tx-icon--${tx.tone}"><img alt="" width="${icon.w}" height="${icon.h}"></span>
      <span class="tx-main"><span class="tx-name"></span><span class="tx-date"></span></span>
      <span class="tx-divider" aria-hidden="true"></span>
      <span class="tx-category"></span>
      <span class="tx-divider" aria-hidden="true"></span>
      <span class="tx-amount"></span>`;
    const img = row.querySelector("img");
    img.src = icon.src;
    img.classList.toggle("is-recolored", Boolean(icon.recolor));
    row.querySelector(".tx-name").textContent = tx.name;
    row.querySelector(".tx-date").textContent = formatDateLabel(tx);
    row.querySelector(".tx-category").textContent = tx.category;
    const amount = row.querySelector(".tx-amount");
    amount.textContent = formatAmount(tx.amount);
    amount.classList.toggle("is-negative", tx.amount < 0);
    row.setAttribute("aria-label", `${tx.name}, ${tx.category}, ${formatDateLabel(tx)}, ${formatAmount(tx.amount)}. Show details`);
    item.append(row);
    return item;
  };

  const render = () => {
    const visible = TRANSACTIONS.filter(matches);
    const months = [...new Set(visible.map((tx) => tx.date.slice(0, 7)))];
    if (!visible.length) {
      groupsEl.innerHTML = `<div class="tx-empty"><p>No transactions match this filter.</p><button type="button" class="btn btn-ghost" data-filter-reset>Show all</button></div>`;
      groupsEl.querySelector("[data-filter-reset]").addEventListener("click", resetFilters);
      return;
    }
    groupsEl.replaceChildren(...months.map((month) => {
      const section = document.createElement("section");
      section.className = "tx-group";
      const heading = document.createElement("h2");
      heading.className = "tx-month";
      heading.textContent = monthName(`${month}-01`);
      const list = document.createElement("ul");
      list.className = "tx-list";
      list.append(...visible.filter((tx) => tx.date.startsWith(month)).map(createRow));
      section.append(heading, list);
      return section;
    }));
  };

  const syncTypeButtons = () => {
    typeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.type === filter.type)));
  };

  function resetFilters() {
    Object.assign(filter, { type: "all", month: "all", date: "" });
    syncTypeButtons();
    render();
    announce("Showing all transactions");
  }

  // ---------- Income / Expense cards toggle a type filter ----------
  typeButtons.forEach((button) => button.addEventListener("click", () => {
    const type = button.dataset.type;
    filter.type = filter.type === type ? "all" : type;
    syncTypeButtons();
    render();
    announce(filter.type === "all" ? "Showing all transactions" : `Showing ${filter.type} only`);
  }));

  // ---------- Popovers: notifications + month/date filter ----------
  const form = document.querySelector(".calendar-form");
  const monthRadios = [...form.querySelectorAll("input[name=filter-month]")];
  const dateInput = document.getElementById("filter-date");
  const errorEl = document.getElementById("filter-error");

  const popovers = initPopovers({
    "calendar-panel": {
      onOpen: () => {
        monthRadios.forEach((radio) => { radio.checked = radio.value === filter.month; });
        dateInput.value = filter.date;
        errorEl.textContent = "";
      }
    }
  });

  monthRadios.forEach((radio) => radio.addEventListener("change", () => { dateInput.value = ""; errorEl.textContent = ""; }));

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // filtering happens in the page; there is no server
    const date = dateInput.value;
    if (date && (date < dateInput.min || date > dateInput.max)) {
      errorEl.textContent = "Pick a date between March 1 and April 30, 2026.";
      dateInput.focus();
      return;
    }
    filter.date = date;
    filter.month = date ? date.slice(0, 7) : (monthRadios.find((radio) => radio.checked)?.value || "all");
    popovers.close({ restoreFocus: true });
    render();
    const count = TRANSACTIONS.filter(matches).length;
    announce(`${count} transaction${count === 1 ? "" : "s"} shown`);
  });
  form.querySelector("[data-filter-reset]").addEventListener("click", () => {
    popovers.close({ restoreFocus: true });
    resetFilters();
  });

  // ---------- Row details dialog ----------
  const dialog = initDialog(document.getElementById("tx-dialog"));
  groupsEl.addEventListener("click", (event) => {
    const row = event.target.closest(".tx-row");
    if (!row) return;
    const tx = TRANSACTIONS.find((item) => item.id === row.dataset.id);
    dialog.querySelector("#tx-dialog-title").textContent = tx.name;
    const amount = dialog.querySelector("#tx-amount");
    amount.textContent = formatAmount(tx.amount);
    amount.classList.toggle("is-negative", tx.amount < 0);
    dialog.querySelector("#tx-type").textContent = tx.amount < 0 ? "Expense" : "Income";
    dialog.querySelector("#tx-category").textContent = tx.category;
    dialog.querySelector("#tx-date").textContent = `${monthName(tx.date)} ${Number(tx.date.slice(8, 10))}, ${tx.time}`;
    dialog.showModal();
  });

  initBackLink(document.querySelector(".back-link"));
  render();
});
