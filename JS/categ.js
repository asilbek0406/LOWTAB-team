/* categ.js — Categories page: select a category, show its demo transactions, add custom categories. */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const { TRANSACTIONS, formatAmount, formatDateLabel } = window.FinanceDemo;
  const { createAnnouncer, initPopovers, initDialog, initBackLink } = window.FinanceUI;
  const STORAGE_KEY = "finance-dashboard:custom-categories";

  const announce = createAnnouncer(document.querySelector(".toast"));
  const grid = document.getElementById("category-grid");
  const moreItem = grid.querySelector(".more-item");
  const detailDialog = initDialog(document.getElementById("category-dialog"));
  const addDialog = initDialog(document.getElementById("add-dialog"));

  // ---------- Selection + details ----------
  const select = (button) => {
    grid.querySelectorAll(".category[data-category]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  };

  const showDetails = (button) => {
    const name = button.querySelector(".category-label").textContent;
    const items = TRANSACTIONS.filter((tx) => tx.categoryId === button.dataset.category && tx.amount < 0);
    const total = items.reduce((cents, tx) => cents + Math.round(tx.amount * 100), 0) / 100;
    detailDialog.querySelector("#category-dialog-title").textContent = name;
    detailDialog.querySelector("#category-total").textContent = formatAmount(total);
    detailDialog.querySelector("#category-count").textContent = String(items.length);
    const list = detailDialog.querySelector("#category-tx");
    if (!items.length) {
      list.innerHTML = `<li class="empty">No demo transactions in this category yet.</li>`;
    } else {
      list.replaceChildren(...items.map((tx) => {
        const li = document.createElement("li");
        li.innerHTML = `<span><span class="tx-title"></span><small></small></span><span class="is-negative"></span>`;
        li.querySelector(".tx-title").textContent = `${tx.name} · ${tx.category}`;
        li.querySelector("small").textContent = formatDateLabel(tx);
        li.querySelector(".is-negative").textContent = formatAmount(tx.amount);
        return li;
      }));
    }
    detailDialog.showModal();
  };

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".category");
    if (!button) return;
    if (button.hasAttribute("data-add-category")) {
      openAddDialog();
      return;
    }
    select(button);
    showDetails(button);
  });

  // ---------- Custom categories (kept in this browser only) ----------
  const readCustom = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  };
  const saveCustom = (names) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(names)); } catch { /* storage unavailable: keep for this visit only */ }
  };

  const addTile = (name) => {
    const item = document.createElement("li");
    item.innerHTML = `<button class="category" type="button" aria-pressed="false"><span class="category-tile"><span class="custom-initial" aria-hidden="true"></span></span><span class="category-label"></span></button>`;
    const button = item.querySelector("button");
    button.dataset.category = `custom:${name.toLowerCase()}`;
    item.querySelector(".custom-initial").textContent = name.charAt(0).toUpperCase();
    item.querySelector(".category-label").textContent = name;
    grid.insertBefore(item, moreItem);
    return button;
  };

  const addForm = addDialog.querySelector(".add-form");
  const nameInput = document.getElementById("new-category");
  const addError = document.getElementById("add-error");

  function openAddDialog() {
    addForm.reset();
    addError.textContent = "";
    addDialog.showModal();
    nameInput.focus();
  }

  addForm.addEventListener("submit", (event) => {
    event.preventDefault(); // validate before closing the dialog
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const exists = [...grid.querySelectorAll(".category-label")].some((label) => label.textContent.toLowerCase() === name.toLowerCase());
    addError.textContent = !name ? "Enter a category name." : exists ? "This category already exists." : "";
    if (addError.textContent) { nameInput.focus(); return; }
    const button = addTile(name);
    saveCustom([...readCustom(), name]);
    addDialog.close();
    select(button);
    button.focus();
    announce(`Category “${name}” added`);
  });

  readCustom().forEach(addTile);
  initPopovers();
  initBackLink(document.querySelector(".back-link"));
});
