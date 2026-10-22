/* prof.js — Profile page: menu dialogs (edit name, security info, settings, help, logout). */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const { createAnnouncer, initPopovers, initDialog, initBackLink } = window.FinanceUI;
  const KEYS = {
    name: "finance-dashboard:profile-name",
    notifications: "finance-dashboard:notifications",
    categories: "finance-dashboard:custom-categories"
  };
  const DEFAULT_NAME = "John Smith";

  // localStorage can be unavailable (private mode, blocked storage): fall back to defaults.
  const store = {
    get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* keep for this visit only */ } },
    remove: (key) => { try { localStorage.removeItem(key); } catch { /* nothing stored */ } }
  };

  const announce = createAnnouncer(document.querySelector(".toast"));
  const nameEl = document.getElementById("profile-name");
  const notificationText = document.getElementById("notification-text");

  const renderName = () => { nameEl.textContent = store.get(KEYS.name) || DEFAULT_NAME; };
  const renderNotifications = () => {
    notificationText.innerHTML = store.get(KEYS.notifications) === "on"
      ? "<strong>Reminder</strong> Check this week’s spending on the Analysis tab."
      : "<strong>You’re all caught up.</strong> There are no new notifications for this demo account.";
  };

  // Each menu button opens its dialog.
  const dialogs = Object.fromEntries([...document.querySelectorAll("dialog.modal")].map((dialog) => [dialog.id, initDialog(dialog)]));
  const hooks = {
    "edit-dialog": () => {
      document.getElementById("edit-name").value = nameEl.textContent;
      document.getElementById("edit-error").textContent = "";
    },
    "settings-dialog": () => {
      document.getElementById("setting-notifications").checked = store.get(KEYS.notifications) === "on";
    }
  };
  document.querySelectorAll(".menu-item[data-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.dialog;
      hooks[id]?.();
      dialogs[id].showModal();
    });
  });

  // Edit Profile: change the display name.
  document.querySelector(".edit-form").addEventListener("submit", (event) => {
    event.preventDefault(); // validate before closing
    const input = document.getElementById("edit-name");
    const name = input.value.trim().replace(/\s+/g, " ");
    if (!name) {
      document.getElementById("edit-error").textContent = "Enter a name.";
      input.focus();
      return;
    }
    store.set(KEYS.name, name);
    renderName();
    dialogs["edit-dialog"].close();
    announce("Profile name updated");
  });

  // Setting: demo notifications on/off (changes what the bell shows).
  document.querySelector(".settings-form").addEventListener("submit", (event) => {
    event.preventDefault(); // saved locally, nothing to submit
    const on = document.getElementById("setting-notifications").checked;
    store.set(KEYS.notifications, on ? "on" : "off");
    renderNotifications();
    dialogs["settings-dialog"].close();
    announce(on ? "Notifications turned on" : "Notifications turned off");
  });

  // Logout: clear this browser's demo data and go Home.
  document.getElementById("logout-confirm").addEventListener("click", () => {
    Object.values(KEYS).forEach(store.remove);
    location.href = "index.html";
  });

  initPopovers();
  initBackLink(document.querySelector(".back-link"));
  renderName();
  renderNotifications();
});
