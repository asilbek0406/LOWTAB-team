(function () {
  'use strict';

  // Back button
  document.getElementById('backBtn').addEventListener('click', function () {
    if (history.length > 1) history.back();
  });

  // Notifications
  document.getElementById('bellBtn').addEventListener('click', function () {
    // window.location.href = 'notifications.html';
    console.log('open notifications');
  });

  // Menu items
  var routes = {
    edit: 'edit-profile.html',
    security: 'security.html',
    settings: 'settings.html',
    help: 'help.html'
  };

  document.querySelectorAll('.item').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var action = el.dataset.action;
      if (action === 'logout') {
        if (confirm('Вы уверены, что хотите выйти?')) {
          // TODO: очистить токен / сессию
          // localStorage.removeItem('token');
          // window.location.href = 'login.html';
          console.log('logout');
        }
        return;
      }
      console.log('go to', routes[action]);
      // window.location.href = routes[action];
    });
  });

  // Bottom tab bar
  var pages = {
    home: 'index.html',
    analytics: 'analytics.html',
    transfer: 'transfer.html',
    cards: 'cards.html',
    profile: 'profile.html'
  };

  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      console.log('go to', pages[tab.dataset.tab]);
      // window.location.href = pages[tab.dataset.tab];
    });
  });
})();
