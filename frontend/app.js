const API_BASE = "http://127.0.0.1:8000/api";

const state = {
  events: [],
  selectedEventId: null,
  selectedEvent: null,
  categories: [],
  bookings: [],
};

const elements = {
  apiStatus: document.getElementById("apiStatus"),
  refreshButton: document.getElementById("refreshButton"),
  eventsCount: document.getElementById("eventsCount"),
  eventsList: document.getElementById("eventsList"),
  eventForm: document.getElementById("eventForm"),
  eventStatus: document.getElementById("eventStatus"),
  eventDetails: document.getElementById("eventDetails"),
  categoriesTable: document.getElementById("categoriesTable"),
  categoryForm: document.getElementById("categoryForm"),
  bookingForm: document.getElementById("bookingForm"),
  bookingCategorySelect: document.querySelector("[name='ticket_category_id']"),
  loadBookingsButton: document.getElementById("loadBookingsButton"),
  bookingsList: document.getElementById("bookingsList"),
  reportsForm: document.getElementById("reportsForm"),
  bookingsReportCards: document.getElementById("bookingsReportCards"),
  statusReportTable: document.getElementById("statusReportTable"),
  revenueReportCards: document.getElementById("revenueReportCards"),
  revenueReportTable: document.getElementById("revenueReportTable"),
  occupancyReportTable: document.getElementById("occupancyReportTable"),
  toast: document.getElementById("toast"),
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const statusLabels = {
  draft: "Черновик",
  published: "Опубликовано",
  finished: "Завершено",
  cancelled: "Отменено",
  reserved: "Бронь",
  paid: "Оплачено",
};

function formatDate(value) {
  if (!value) {
    return "Не указано";
  }

  return dateFormatter.format(new Date(value));
}

function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setApiStatus(text, modifier = "idle") {
  elements.apiStatus.textContent = text;
  elements.apiStatus.className = `status status--${modifier}`;
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.className = `toast toast--visible${isError ? " toast--error" : ""}`;

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.className = "toast";
  }, 3200);
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
    const error = new Error(data.message || "Ошибка запроса к API");
    error.details = data.errors || {};
    throw error;
  }

  return data;
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function statusClass(status) {
  if (status === "published" || status === "paid") {
    return "status--ok";
  }

  if (status === "cancelled") {
    return "status--error";
  }

  return "status--warn";
}

function renderEvents() {
  elements.eventsCount.textContent = String(state.events.length);

  if (!state.events.length) {
    elements.eventsList.innerHTML = '<div class="empty-state">Мероприятия не найдены.</div>';
    return;
  }

  elements.eventsList.innerHTML = state.events
    .map((event) => {
      const isActive = event.id === state.selectedEventId;
      return `
        <button class="event-item${isActive ? " event-item--active" : ""}" type="button" data-event-id="${event.id}">
          <p class="event-item__title">${escapeHtml(event.title)}</p>
          <div class="meta">
            <span class="tag">${formatDate(event.starts_at)}</span>
            <span class="tag">${escapeHtml(event.location)}</span>
            <span class="tag">${event.ticket_categories_count || 0} кат.</span>
          </div>
        </button>
      `;
    })
    .join("");

  elements.eventsList.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () =>
      safelyRun(async () => {
        await selectEvent(Number(button.dataset.eventId));
        await loadReports();
      }),
    );
  });
}

function renderEventDetails() {
  if (!state.selectedEvent) {
    elements.eventStatus.textContent = "Нет выбора";
    elements.eventStatus.className = "status status--idle";
    elements.eventDetails.innerHTML = "Выберите мероприятие из списка.";
    return;
  }

  elements.eventStatus.textContent = statusLabels[state.selectedEvent.status] || state.selectedEvent.status;
  elements.eventStatus.className = `status ${statusClass(state.selectedEvent.status)}`;

  const totalTickets = state.categories.reduce((sum, category) => sum + Number(category.quantity || 0), 0);
  const availableTickets = state.categories.reduce((sum, category) => sum + Number(category.available_quantity || 0), 0);

  elements.eventDetails.innerHTML = `
    <div class="details-grid">
      <div class="detail">
        <span>Название</span>
        <strong>${escapeHtml(state.selectedEvent.title)}</strong>
      </div>
      <div class="detail">
        <span>Место</span>
        <strong>${escapeHtml(state.selectedEvent.location)}</strong>
      </div>
      <div class="detail">
        <span>Начало</span>
        <strong>${formatDate(state.selectedEvent.starts_at)}</strong>
      </div>
      <div class="detail">
        <span>Остаток</span>
        <strong>${availableTickets} из ${totalTickets}</strong>
      </div>
    </div>
    <p class="description">${escapeHtml(state.selectedEvent.description || "Описание не заполнено.")}</p>
  `;
}

function renderCategories() {
  if (!state.selectedEvent) {
    elements.categoriesTable.innerHTML = '<tr><td colspan="4">Выберите мероприятие.</td></tr>';
    elements.bookingCategorySelect.innerHTML = '<option value="">Нет категорий</option>';
    return;
  }

  if (!state.categories.length) {
    elements.categoriesTable.innerHTML = '<tr><td colspan="4">Категории билетов не добавлены.</td></tr>';
    elements.bookingCategorySelect.innerHTML = '<option value="">Нет категорий</option>';
    return;
  }

  elements.categoriesTable.innerHTML = state.categories
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
    .join("");

  elements.bookingCategorySelect.innerHTML = state.categories
    .filter((category) => Number(category.available_quantity) > 0)
    .map(
      (category) =>
        `<option value="${category.id}">${escapeHtml(category.name)} - ${formatMoney(category.price)} (${category.available_quantity} доступно)</option>`,
    )
    .join("");

  if (!elements.bookingCategorySelect.innerHTML) {
    elements.bookingCategorySelect.innerHTML = '<option value="">Нет доступных билетов</option>';
  }
}

function renderBookings() {
  if (!state.bookings.length) {
    elements.bookingsList.innerHTML = '<div class="empty-state">Бронирования не найдены.</div>';
    return;
  }

  elements.bookingsList.innerHTML = state.bookings
    .map((booking) => {
      const canChange = booking.status === "reserved";
      const statusText = statusLabels[booking.status] || booking.status;

      return `
        <article class="booking-item">
          <div>
            <p class="booking-item__title">${escapeHtml(booking.customer_name)} - ${escapeHtml(booking.ticket_category.event.title)}</p>
            <div class="meta">
              <span class="tag">${escapeHtml(booking.ticket_category.name)}</span>
              <span class="tag">${booking.quantity} шт.</span>
              <span class="tag">${formatMoney(booking.total_price)}</span>
              <span class="tag">${escapeHtml(booking.customer_email)}</span>
              <span class="status ${statusClass(booking.status)}">${statusText}</span>
            </div>
          </div>
          <div class="booking-actions">
            <button class="button button--success" type="button" data-booking-action="pay" data-booking-id="${booking.id}" ${canChange ? "" : "disabled"}>Оплатить</button>
            <button class="button button--danger" type="button" data-booking-action="cancel" data-booking-id="${booking.id}" ${canChange ? "" : "disabled"}>Отменить</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function reportCard(label, value) {
  return `
    <div class="report-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function queryString(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const value = query.toString();

  return value ? `?${value}` : "";
}

function reportFilters(includeStatus = false) {
  const data = formToObject(elements.reportsForm);
  const filters = {
    date_from: data.date_from,
    date_to: data.date_to,
  };

  if (includeStatus) {
    filters.status = data.status;
  }

  if (data.event_scope === "selected" && state.selectedEventId) {
    filters.event_id = state.selectedEventId;
  }

  return filters;
}

function renderReports(bookingsReport, revenueReport, occupancyReport) {
  elements.bookingsReportCards.innerHTML = [
    reportCard("Всего бронирований", bookingsReport.summary.bookings_count),
    reportCard("Билетов в бронях", bookingsReport.summary.tickets_count),
    reportCard("Сумма броней", formatMoney(bookingsReport.summary.total_amount)),
  ].join("");

  elements.statusReportTable.innerHTML = bookingsReport.by_status.length
    ? bookingsReport.by_status
        .map(
          (row) => `
            <tr>
              <td>${statusLabels[row.status] || row.status}</td>
              <td>${row.bookings_count}</td>
              <td>${row.tickets_count}</td>
              <td>${formatMoney(row.total_amount)}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="4">Нет данных по выбранным фильтрам.</td></tr>';

  elements.revenueReportCards.innerHTML = [
    reportCard("Оплаченных броней", revenueReport.summary.paid_bookings_count),
    reportCard("Выручка", formatMoney(revenueReport.summary.total_revenue)),
  ].join("");

  elements.revenueReportTable.innerHTML = revenueReport.by_events.length
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
    : '<tr><td colspan="4">Оплаченных бронирований нет.</td></tr>';

  elements.occupancyReportTable.innerHTML = occupancyReport.events.length
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
    : '<tr><td colspan="5">Нет мероприятий для отчета.</td></tr>';
}

async function loadEvents() {
  setApiStatus("Загрузка", "warn");

  state.events = await requestJson("/events");

  if (!state.selectedEventId && state.events.length) {
    state.selectedEventId = state.events[0].id;
  }

  renderEvents();

  if (state.selectedEventId) {
    await selectEvent(state.selectedEventId, false);
  } else {
    state.selectedEvent = null;
    state.categories = [];
    state.bookings = [];
    renderEventDetails();
    renderCategories();
    renderBookings();
  }

  await loadReports();
  setApiStatus("API доступен", "ok");
}

async function selectEvent(eventId, shouldRenderList = true) {
  state.selectedEventId = eventId;
  const [event, categories] = await Promise.all([
    requestJson(`/events/${eventId}`),
    requestJson(`/events/${eventId}/ticket-categories`),
  ]);

  state.selectedEvent = event;
  state.categories = categories;

  if (shouldRenderList) {
    renderEvents();
  }

  renderEventDetails();
  renderCategories();
  await loadBookings(true);
}

async function createEvent(event) {
  event.preventDefault();

  const data = formToObject(elements.eventForm);

  await requestJson("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });

  elements.eventForm.reset();
  showToast("Мероприятие создано");
  state.selectedEventId = null;
  await loadEvents();
}

async function createCategory(event) {
  event.preventDefault();

  if (!state.selectedEventId) {
    showToast("Сначала выберите мероприятие", true);
    return;
  }

  const data = formToObject(elements.categoryForm);

  await requestJson(`/events/${state.selectedEventId}/ticket-categories`, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      price: Number(data.price),
      quantity: Number(data.quantity),
    }),
  });

  elements.categoryForm.reset();
  showToast("Категория добавлена");
  await selectEvent(state.selectedEventId);
  await loadReports();
}

async function loadBookings(onlySelectedEvent = false) {
  const query = onlySelectedEvent && state.selectedEventId ? `?event_id=${state.selectedEventId}` : "";
  state.bookings = await requestJson(`/bookings${query}`);
  renderBookings();
}

async function createBooking(event) {
  event.preventDefault();

  if (!elements.bookingCategorySelect.value) {
    showToast("Нет доступной категории билетов", true);
    return;
  }

  const data = formToObject(elements.bookingForm);

  await requestJson("/bookings", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      ticket_category_id: Number(data.ticket_category_id),
      quantity: Number(data.quantity),
    }),
  });

  elements.bookingForm.reset();
  elements.bookingForm.elements.quantity.value = "1";
  showToast("Бронирование создано");

  if (state.selectedEventId) {
    await selectEvent(state.selectedEventId);
  }

  await loadReports();
}

async function updateBookingStatus(bookingId, action) {
  await requestJson(`/bookings/${bookingId}/${action}`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });

  showToast(action === "cancel" ? "Бронирование отменено" : "Бронирование оплачено");

  if (state.selectedEventId) {
    await selectEvent(state.selectedEventId);
  } else {
    await loadBookings(false);
  }

  await loadReports();
}

async function loadReports(event) {
  event?.preventDefault();

  const [bookingsReport, revenueReport, occupancyReport] = await Promise.all([
    requestJson(`/reports/bookings${queryString(reportFilters(true))}`),
    requestJson(`/reports/revenue${queryString(reportFilters(false))}`),
    requestJson(
      `/reports/events-occupancy${queryString({
        event_id: reportFilters(false).event_id,
      })}`,
    ),
  ]);

  renderReports(bookingsReport, revenueReport, occupancyReport);
}

async function safelyRun(action) {
  try {
    await action();
  } catch (error) {
    setApiStatus("Ошибка API", "error");
    const details = Object.values(error.details || {}).flat().join(" ");
    showToast(details || error.message, true);
  }
}

elements.refreshButton.addEventListener("click", () => safelyRun(loadEvents));
elements.eventForm.addEventListener("submit", (event) => safelyRun(() => createEvent(event)));
elements.categoryForm.addEventListener("submit", (event) => safelyRun(() => createCategory(event)));
elements.bookingForm.addEventListener("submit", (event) => safelyRun(() => createBooking(event)));
elements.reportsForm.addEventListener("submit", (event) => safelyRun(() => loadReports(event)));
elements.loadBookingsButton.addEventListener("click", () => safelyRun(() => loadBookings(false)));
elements.bookingsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-booking-action]");

  if (!button) {
    return;
  }

  safelyRun(() => updateBookingStatus(button.dataset.bookingId, button.dataset.bookingAction));
});

safelyRun(loadEvents);
