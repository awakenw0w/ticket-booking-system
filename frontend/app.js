const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const checkButton = document.getElementById("checkBackend");
const buildTime = document.getElementById("buildTime");

const BACKEND_URL = "http://127.0.0.1:8000";

function setStatus(type, badge, text) {
  statusBadge.classList.remove("badge--loading", "badge--success", "badge--error");

  if (type) {
    statusBadge.classList.add(`badge--${type}`);
  }

  statusBadge.textContent = badge;
  statusText.textContent = text;
}

function checkBackend() {
  setStatus("loading", "Проверка...", "Пробуем достучаться до backend...");

  const probe = new Image();
  const timer = setTimeout(() => {
    probe.src = "";
    setStatus(
      "error",
      "Недоступен",
      "Не удалось подключиться к backend. Проверьте, что Laravel запущен."
    );
  }, 3500);

  probe.onload = () => {
    clearTimeout(timer);
    setStatus("success", "Доступен", `Backend отвечает по адресу ${BACKEND_URL}`);
  };

  probe.onerror = () => {
    clearTimeout(timer);
    setStatus(
      "error",
      "Недоступен",
      "Сервер не ответил. Запустите backend командой php artisan serve."
    );
  };

  probe.src = `${BACKEND_URL}/favicon.ico?ts=${Date.now()}`;
}

buildTime.textContent = new Date().toLocaleString("ru-RU");
checkButton.addEventListener("click", checkBackend);
