# Finance Dashboard — homepage

- `index.html` — главная страница
- `css/index.css` — стили и анимации главной
- `js/index.js` — интерактивность главной
- `public/icons/` — оригинальные SVG-иконки
- `icon-gallery.html` — галерея исходных иконок

## Что работает
- Анимация появления блоков и счётчиков денежных значений.
- Daily / Weekly / Monthly: переключение активного периода и обновление меток списка.
- Кнопка уведомлений показывает/скрывает уведомление.
- Строки Salary, Groceries и Rent нажимаются мышью или клавиатурой и показывают детали.
- Нижняя навигация реагирует на нажатие, переключает активный пункт и показывает соответствующий статус. Вкладки других страниц обозначены как заглушки, потому что страницы команды не включены в этот архив.
- Кнопки имеют hover/press/focus feedback и учитывают настройку уменьшения анимации.

## Иконки
`public/icons/Rent.svg` создан на основе SVG-кода Rent, присланного пользователем. `Group 208.svg` используется в верхнем блоке и поворачивается через CSS для обратного направления; `check.svg` используется в блоке бюджета.

Открой `index.html` в браузере. Google Fonts требуют интернет-соединения. Статус-бар телефона не включён в страницу.


## Navigation paths
The bottom navigation links to `index.html` (Home), `daily.html` (Analysis), `tranact.html` (Transactions), `categ.html` (Categories), and `prof.html` (Profile). Keep these filenames in the same directory as `index.html`. The teammate-owned page files are not included in this homepage-only archive; merge this folder with the shared project containing those pages.

## Analysis page (`daily.html`)
- `daily.html`, `css/daily.css`, `js/daily.js` — Analysis / Daily page (Home files are untouched).
- `public/icons/analysis/` — original SVGs for this page (search, calendar, income/expense arrows, rounded frame), kept unchanged under their original names.
- Daily / Weekly / Monthly / Year switch the chart, y-axis, and Income/Expense totals from one demo dataset per period. Totals are always the sum of the bars, and bars and counters animate (or update instantly under `prefers-reduced-motion`).
- Search (filter by day/month or amount), Calendar (pick period + date → highlights that bucket), Notifications (empty state), Travel/Car target details dialog, Back (history back within the site, otherwise `index.html`).
- All figures are deterministic demo data, not real bank records.

## Transactions (`tranact.html`) and Categories (`categ.html`)
- Files: `tranact.html` + `css/tranact.css` + `JS/tranact.js`, `categ.html` + `css/categ.css` + `JS/categ.js`.
- `css/shared.css` and `JS/shared.js` hold what both pages share: header, bottom navigation (same geometry as Home), popovers, dialogs, toast, back link and the demo transaction list.
- Transactions: the list is rendered from the demo data; the Income/Expense cards filter by type; the calendar button filters by month or exact date (Reset/Cancel/Apply); each row opens a details dialog.
- Categories: a tile selects the category and opens its demo transactions; "More" adds a custom category (saved in this browser's localStorage).
- `public/icons/categories/`: original Figma SVGs for Transport (`Vector.svg`), Medicine (`Vector-1.svg`), Gifts (`Vector-2.svg`), Savings (`Vector-3.svg`) and Entertainment (`Vector-4.svg`). They are in their own folder because `public/icons/` already has different files with the same names.
- `prof.html` (Profile) belongs to a teammate.
