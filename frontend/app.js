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
          <p class="event-item__title">${event.title}</p>
          <div class="meta">
            <span class="tag">${formatDate(event.starts_at)}</span>
            <span class="tag">${event.location}</span>
            <span class="tag">${event.ticket_categories_count || 0} кат.</span>
          </div>
        </button>
      `;
    })
    .join("");

  elements.eventsList.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () => selectEvent(Number(button.dataset.eventId)));
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
        <strong>${state.selectedEvent.title}</strong>
      </div>
      <div class="detail">
        <span>Место</span>
        <strong>${state.selectedEvent.location}</strong>
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
    <p class="description">${state.selectedEvent.description || "Описание не заполнено."}</p>
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
          <td>${category.name}</td>
          <td>${formatMoney(category.price)}</td>
          <td>${category.quantity}</td>
          <td>${category.available_quantity}</td>
        </tr>
      `,
    )
    .join("");

  elements.bookingCategorySelect.innerHTML = state.categories
    .filter((category) => Number(category.available_quantity) > 0)
    .map((category) => `<option value="${category.id}">${category.name} - ${formatMoney(category.price)} (${category.available_quantity} доступно)</option>`)
    .join("");

  if (!elements.bookingCategorySelect.innerHTML) {
    elements.bookingCategorySelect.innerHTML = '<option value="">Нет доступных билетов</option>';
  }
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
    renderEventDetails();
    renderCategories();
  }

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

safelyRun(loadEvents);
