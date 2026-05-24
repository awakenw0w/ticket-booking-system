const API_BASE = localStorage.getItem("ticketApiBase") || "http://127.0.0.1:8000/api";

const state = {
  events: [],
  selectedEventId: null,
  selectedEvent: null,
  categories: [],
  adminBookings: [],
  cabinetBookings: [],
};

const el = {
  apiStatus: document.getElementById("apiStatus"),
  refreshButton: document.getElementById("refreshButton"),
  navButtons: document.querySelectorAll("[data-page]"),
  pages: document.querySelectorAll(".page"),
  eventsList: document.getElementById("eventsList"),
  eventDetails: document.getElementById("eventDetails"),
  categoriesTable: document.getElementById("categoriesTable"),
  bookingForm: document.getElementById("bookingForm"),
  bookingMessage: document.getElementById("bookingMessage"),
  cabinetForm: document.getElementById("cabinetForm"),
  cabinetMessage: document.getElementById("cabinetMessage"),
  cabinetBookings: document.getElementById("cabinetBookings"),
  eventForm: document.getElementById("eventForm"),
  eventMessage: document.getElementById("eventMessage"),
  categoryForm: document.getElementById("categoryForm"),
  categoryMessage: document.getElementById("categoryMessage"),
  categoryEventSelect: document.getElementById("categoryEventSelect"),
  loadBookingsButton: document.getElementById("loadBookingsButton"),
  adminBookings: document.getElementById("adminBookings"),
  adminAnalytics: document.getElementById("adminAnalytics"),
  reportsForm: document.getElementById("reportsForm"),
  reportsMessage: document.getElementById("reportsMessage"),
  reportsEventSelect: document.getElementById("reportsEventSelect"),
  reportCards: document.getElementById("reportCards"),
  statusReportTable: document.getElementById("statusReportTable"),
  revenueReportTable: document.getElementById("revenueReportTable"),
  occupancyReportTable: document.getElementById("occupancyReportTable"),
  toast: document.getElementById("toast"),
};

const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusText = {
  draft: "Черновик",
  published: "Опубликовано",
  finished: "Завершено",
  cancelled: "Отменено",
  reserved: "Бронь",
  paid: "Оплачено",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : "Не указано";
}

function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setApiStatus(text, type = "") {
  el.apiStatus.textContent = text;
  el.apiStatus.className = `status ${type ? `status--${type}` : ""}`;
}

function showToast(message, isError = false) {
  el.toast.textContent = message;
  el.toast.className = `toast toast--visible${isError ? " toast--error" : ""}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    el.toast.className = "toast";
  }, 3600);
}

function showMessage(target, messages, type = "error") {
  const list = Array.isArray(messages) ? messages : [messages];
  target.innerHTML = list.map(escapeHtml).join("<br>");
  target.className = `message message--visible message--${type}`;
}

function clearMessage(target) {
  target.textContent = "";
  target.className = "message";
}

function serverErrorMessages(error) {
  const details = Object.values(error.details || {}).flat();
  return details.length ? details : [error.message || "Ошибка запроса к серверу."];
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Сервер вернул ошибку.");
    error.details = data.errors || {};
    throw error;
  }

  return data;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isDateText(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isTimeText(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function positiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function positiveNumber(value) {
  return Number(value) >= 0 && value !== "";
}

function validateEvent(data) {
  const errors = [];

  if (!data.title.trim()) errors.push("Введите название мероприятия.");
  if (!data.location.trim()) errors.push("Введите место проведения.");
  if (!isDateText(data.event_date.trim())) errors.push("Введите дату в формате ГГГГ-ММ-ДД, например 2026-06-07.");
  if (!isTimeText(data.event_time.trim())) errors.push("Введите время в формате ЧЧ:ММ, например 19:00.");

  return errors;
}

function validateCategory(data) {
  const errors = [];

  if (!data.event_id) errors.push("Выберите мероприятие.");
  if (!data.name.trim()) errors.push("Введите название категории.");
  if (!positiveNumber(data.price)) errors.push("Цена должна быть числом от 0.");
  if (!positiveInteger(data.quantity)) errors.push("Количество билетов должно быть целым числом больше 0.");

  return errors;
}

function validateBooking(data) {
  const errors = [];

  if (!data.ticket_category_id) errors.push("Выберите категорию билетов.");
  if (!positiveInteger(data.quantity)) errors.push("Количество билетов должно быть целым числом больше 0.");
  if (!data.customer_name.trim()) errors.push("Введите имя клиента.");
  if (!isEmail(data.customer_email.trim())) errors.push("Введите корректную почту клиента.");
  if (!data.customer_phone.trim()) errors.push("Введите телефон клиента.");

  return errors;
}

function validateReports(data) {
  const errors = [];

  if (data.date_from && !isDateText(data.date_from.trim())) {
    errors.push("Дата начала должна быть в формате ГГГГ-ММ-ДД.");
  }

  if (data.date_to && !isDateText(data.date_to.trim())) {
    errors.push("Дата окончания должна быть в формате ГГГГ-ММ-ДД.");
  }

  if (data.date_from && data.date_to && isDateText(data.date_from) && isDateText(data.date_to) && data.date_from > data.date_to) {
    errors.push("Дата начала не должна быть позже даты окончания.");
  }

  return errors;
}

function statusClass(status) {
  if (status === "published" || status === "paid") return "status--ok";
  if (status === "cancelled") return "status--error";
  return "status--warn";
}

function card(label, value) {
  return `<div class="card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function emptyRow(columns, text) {
  return `<tr><td colspan="${columns}">${escapeHtml(text)}</td></tr>`;
}

function showPage(name) {
  const pageName = name || "events";

  el.pages.forEach((page) => {
    page.classList.toggle("page--active", page.id === `page-${pageName}`);
  });

  el.navButtons.forEach((button) => {
    button.classList.toggle("nav__button--active", button.dataset.page === pageName);
  });

  if (location.hash !== `#${pageName}`) {
    history.replaceState(null, "", `#${pageName}`);
  }
}

function renderEventSelects() {
  const options = state.events
    .map((event) => `<option value="${event.id}">${escapeHtml(event.title)}</option>`)
    .join("");

  el.categoryEventSelect.innerHTML = options || '<option value="">Нет мероприятий</option>';
  el.reportsEventSelect.innerHTML = `<option value="">Все мероприятия</option>${options}`;

  if (state.selectedEventId) {
    el.categoryEventSelect.value = String(state.selectedEventId);
  }
}

function renderEvents() {
  if (!state.events.length) {
    el.eventsList.innerHTML = '<div class="empty">Мероприятия пока не созданы.</div>';
    return;
  }

  el.eventsList.innerHTML = state.events
    .map((event) => {
      const active = event.id === state.selectedEventId ? " event-card--active" : "";
      return `
        <button class="event-card${active}" type="button" data-event-id="${event.id}">
          <strong>${escapeHtml(event.title)}</strong>
          <div class="meta">
            <span class="tag">${formatDate(event.starts_at)}</span>
            <span class="tag">${escapeHtml(event.location)}</span>
            <span class="tag">${event.ticket_categories_count || 0} кат.</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderSelectedEvent() {
  if (!state.selectedEvent) {
    el.eventDetails.innerHTML = "Выберите мероприятие из списка.";
    el.categoriesTable.innerHTML = emptyRow(4, "Нет выбранного мероприятия.");
    el.bookingForm.elements.ticket_category_id.innerHTML = '<option value="">Нет категорий</option>';
    return;
  }

  el.eventDetails.innerHTML = `
    <strong>${escapeHtml(state.selectedEvent.title)}</strong>
    <div class="meta">
      <span class="tag">${formatDate(state.selectedEvent.starts_at)}</span>
      <span class="tag">${escapeHtml(state.selectedEvent.location)}</span>
      <span class="status ${statusClass(state.selectedEvent.status)}">${statusText[state.selectedEvent.status] || state.selectedEvent.status}</span>
    </div>
    <p>${escapeHtml(state.selectedEvent.description || "Описание не заполнено.")}</p>
  `;

  el.categoriesTable.innerHTML = state.categories.length
    ? state.categories
        .map(
          (category) => `
            <tr>
              <td>${escapeHtml(category.name)}</td>
              <td>${formatMoney(category.price)}</td>
              <td>${category.quantity}</td>
              <td>${category.available_quantity}</td>
            </tr>
          `,
        )
        .join("")
    : emptyRow(4, "Категории билетов пока не добавлены.");

  const categoryOptions = state.categories
    .filter((category) => Number(category.available_quantity) > 0)
    .map(
      (category) =>
        `<option value="${category.id}">${escapeHtml(category.name)} - ${formatMoney(category.price)} (${category.available_quantity} доступно)</option>`,
    )
    .join("");

  el.bookingForm.elements.ticket_category_id.innerHTML = categoryOptions || '<option value="">Нет доступных билетов</option>';
}

function bookingMarkup(booking, showActions = true) {
  const canChange = booking.status === "reserved";
  const actionButtons = showActions
    ? `
      <div class="booking-actions">
        <button class="button button--success" type="button" data-booking-action="pay" data-booking-id="${booking.id}" ${canChange ? "" : "disabled"}>Оплатить</button>
        <button class="button button--danger" type="button" data-booking-action="cancel" data-booking-id="${booking.id}" ${canChange ? "" : "disabled"}>Отменить</button>
      </div>
    `
    : "";

  return `
    <article class="booking-card">
      <div>
        <strong>${escapeHtml(booking.customer_name)} - ${escapeHtml(booking.ticket_category.event.title)}</strong>
        <div class="meta">
          <span class="tag">${escapeHtml(booking.ticket_category.name)}</span>
          <span class="tag">${booking.quantity} шт.</span>
          <span class="tag">${formatMoney(booking.total_price)}</span>
          <span class="tag">${escapeHtml(booking.customer_email)}</span>
          <span class="status ${statusClass(booking.status)}">${statusText[booking.status] || booking.status}</span>
        </div>
      </div>
      ${actionButtons}
    </article>
  `;
}

function renderAdminBookings() {
  el.adminBookings.innerHTML = state.adminBookings.length
    ? state.adminBookings.map((booking) => bookingMarkup(booking, true)).join("")
    : '<div class="empty">Бронирования пока не найдены.</div>';
}

function renderCabinetBookings() {
  el.cabinetBookings.innerHTML = state.cabinetBookings.length
    ? state.cabinetBookings.map((booking) => bookingMarkup(booking, true)).join("")
    : '<div class="empty">Для этой почты бронирования не найдены.</div>';
}

function renderReports(bookingsReport, revenueReport, occupancyReport) {
  el.reportCards.innerHTML = [
    card("Всего бронирований", bookingsReport.summary.bookings_count),
    card("Билетов в бронях", bookingsReport.summary.tickets_count),
    card("Сумма броней", formatMoney(bookingsReport.summary.total_amount)),
    card("Оплачено броней", revenueReport.summary.paid_bookings_count),
    card("Выручка", formatMoney(revenueReport.summary.total_revenue)),
    card("Мероприятий в отчете", occupancyReport.events.length),
  ].join("");

  el.adminAnalytics.innerHTML = [
    card("Бронирований", bookingsReport.summary.bookings_count),
    card("Билетов", bookingsReport.summary.tickets_count),
    card("Выручка", formatMoney(revenueReport.summary.total_revenue)),
  ].join("");

  el.statusReportTable.innerHTML = bookingsReport.by_status.length
    ? bookingsReport.by_status
        .map(
          (row) => `
            <tr>
              <td>${statusText[row.status] || row.status}</td>
              <td>${row.bookings_count}</td>
              <td>${row.tickets_count}</td>
              <td>${formatMoney(row.total_amount)}</td>
            </tr>
          `,
        )
        .join("")
    : emptyRow(4, "Нет данных по выбранным фильтрам.");

  el.revenueReportTable.innerHTML = revenueReport.by_events.length
    ? revenueReport.by_events
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.event_title)}</td>
              <td>${row.paid_bookings_count}</td>
              <td>${row.paid_tickets_count}</td>
              <td>${formatMoney(row.revenue)}</td>
            </tr>
          `,
        )
        .join("")
    : emptyRow(4, "Оплаченных бронирований нет.");

  el.occupancyReportTable.innerHTML = occupancyReport.events.length
    ? occupancyReport.events
        .map(
          (event) => `
            <tr>
              <td>${escapeHtml(event.event_title)}</td>
              <td>${event.total_tickets}</td>
              <td>${event.active_tickets}</td>
              <td>${event.available_tickets}</td>
              <td>${event.occupancy_percent}%</td>
            </tr>
          `,
        )
        .join("")
    : emptyRow(5, "Нет мероприятий для отчета.");
}

function reportFilters() {
  const data = formData(el.reportsForm);
  const filters = {};

  if (data.date_from) filters.date_from = data.date_from.trim();
  if (data.date_to) filters.date_to = data.date_to.trim();
  if (data.status) filters.status = data.status;
  if (data.event_id) filters.event_id = data.event_id;

  return filters;
}

function queryString(filters) {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "") query.set(key, value);
  });

  return query.toString() ? `?${query.toString()}` : "";
}

async function loadEvents() {
  state.events = await requestJson("/events");

  if (!state.selectedEventId && state.events.length) {
    state.selectedEventId = state.events[0].id;
  }

  renderEventSelects();
  renderEvents();

  if (state.selectedEventId) {
    await selectEvent(state.selectedEventId);
  }
}

async function selectEvent(eventId) {
  state.selectedEventId = Number(eventId);
  const [event, categories] = await Promise.all([
    requestJson(`/events/${state.selectedEventId}`),
    requestJson(`/events/${state.selectedEventId}/ticket-categories`),
  ]);

  state.selectedEvent = event;
  state.categories = categories;
  renderEventSelects();
  renderEvents();
  renderSelectedEvent();
}

async function loadAdminBookings() {
  state.adminBookings = await requestJson("/bookings");
  renderAdminBookings();
}

async function loadCabinetBookings(email) {
  state.cabinetBookings = await requestJson(`/bookings?customer_email=${encodeURIComponent(email)}`);
  renderCabinetBookings();
}

async function loadReports(event) {
  event?.preventDefault();
  clearMessage(el.reportsMessage);

  const filterData = formData(el.reportsForm);
  const errors = validateReports(filterData);

  if (errors.length) {
    showMessage(el.reportsMessage, errors);
    return;
  }

  const filters = reportFilters();
  const [bookingsReport, revenueReport, occupancyReport] = await Promise.all([
    requestJson(`/reports/bookings${queryString(filters)}`),
    requestJson(`/reports/revenue${queryString({ date_from: filters.date_from || "", date_to: filters.date_to || "", event_id: filters.event_id || "" })}`),
    requestJson(`/reports/events-occupancy${queryString({ event_id: filters.event_id || "" })}`),
  ]);

  renderReports(bookingsReport, revenueReport, occupancyReport);
}

async function createEvent(event) {
  event.preventDefault();
  clearMessage(el.eventMessage);

  const data = formData(el.eventForm);
  const errors = validateEvent(data);

  if (errors.length) {
    showMessage(el.eventMessage, errors);
    return;
  }

  const eventData = {
    title: data.title.trim(),
    location: data.location.trim(),
    starts_at: `${data.event_date.trim()} ${data.event_time.trim()}`,
    status: data.status,
    description: data.description.trim(),
  };

  const created = await requestJson("/events", {
    method: "POST",
    body: JSON.stringify(eventData),
  });

  el.eventForm.reset();
  state.selectedEventId = created.id;
  await loadEvents();
  await loadReports();
  showMessage(el.eventMessage, "Мероприятие создано.", "ok");
  showToast("Мероприятие создано.");
}

async function createCategory(event) {
  event.preventDefault();
  clearMessage(el.categoryMessage);

  const data = formData(el.categoryForm);
  const errors = validateCategory(data);

  if (errors.length) {
    showMessage(el.categoryMessage, errors);
    return;
  }

  await requestJson(`/events/${Number(data.event_id)}/ticket-categories`, {
    method: "POST",
    body: JSON.stringify({
      name: data.name.trim(),
      price: Number(data.price),
      quantity: Number(data.quantity),
    }),
  });

  el.categoryForm.reset();
  el.categoryEventSelect.value = String(state.selectedEventId || "");
  await selectEvent(state.selectedEventId || data.event_id);
  await loadReports();
  showMessage(el.categoryMessage, "Категория добавлена.", "ok");
  showToast("Категория билетов добавлена.");
}

async function createBooking(event) {
  event.preventDefault();
  clearMessage(el.bookingMessage);

  const data = formData(el.bookingForm);
  const errors = validateBooking(data);

  if (errors.length) {
    showMessage(el.bookingMessage, errors);
    return;
  }

  await requestJson("/bookings", {
    method: "POST",
    body: JSON.stringify({
      ticket_category_id: Number(data.ticket_category_id),
      quantity: Number(data.quantity),
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email.trim(),
      customer_phone: data.customer_phone.trim(),
    }),
  });

  el.bookingForm.reset();
  el.bookingForm.elements.quantity.value = "1";
  await selectEvent(state.selectedEventId);
  await loadAdminBookings();
  await loadReports();
  showMessage(el.bookingMessage, "Бронирование создано. Его можно найти в личном кабинете по почте.", "ok");
  showToast("Бронирование создано.");
}

async function submitCabinet(event) {
  event.preventDefault();
  clearMessage(el.cabinetMessage);

  const data = formData(el.cabinetForm);
  const email = data.customer_email.trim();

  if (!isEmail(email)) {
    showMessage(el.cabinetMessage, "Введите корректную почту клиента.");
    return;
  }

  await loadCabinetBookings(email);
  showMessage(el.cabinetMessage, "Бронирования загружены.", "ok");
}

async function updateBookingStatus(bookingId, action) {
  await requestJson(`/bookings/${bookingId}/${action}`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });

  if (state.selectedEventId) {
    await selectEvent(state.selectedEventId);
  }

  await loadAdminBookings();

  const cabinetEmail = el.cabinetForm.elements.customer_email.value.trim();
  if (isEmail(cabinetEmail)) {
    await loadCabinetBookings(cabinetEmail);
  }

  await loadReports();
  showToast(action === "cancel" ? "Бронирование отменено." : "Бронирование оплачено.");
}

async function refreshAll() {
  setApiStatus("Загрузка", "warn");
  await loadEvents();
  await loadAdminBookings();
  await loadReports();
  setApiStatus("API доступен", "ok");
}

async function run(action, messageTarget) {
  try {
    await action();
  } catch (error) {
    setApiStatus("Ошибка API", "error");
    const messages = serverErrorMessages(error);

    if (messageTarget) {
      showMessage(messageTarget, messages);
    }

    showToast(messages.join(" "), true);
  }
}

function bindEvents() {
  el.navButtons.forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  window.addEventListener("hashchange", () => showPage(location.hash.slice(1)));

  el.refreshButton.addEventListener("click", () => run(refreshAll));
  el.eventsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-event-id]");
    if (button) run(() => selectEvent(button.dataset.eventId));
  });

  el.bookingForm.addEventListener("submit", (event) => run(() => createBooking(event), el.bookingMessage));
  el.cabinetForm.addEventListener("submit", (event) => run(() => submitCabinet(event), el.cabinetMessage));
  el.eventForm.addEventListener("submit", (event) => run(() => createEvent(event), el.eventMessage));
  el.categoryForm.addEventListener("submit", (event) => run(() => createCategory(event), el.categoryMessage));
  el.reportsForm.addEventListener("submit", (event) => run(() => loadReports(event), el.reportsMessage));
  el.loadBookingsButton.addEventListener("click", () => run(loadAdminBookings));

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-booking-action]");
    if (!button) return;
    run(() => updateBookingStatus(button.dataset.bookingId, button.dataset.bookingAction));
  });
}

bindEvents();
showPage(location.hash.slice(1));
run(refreshAll);
