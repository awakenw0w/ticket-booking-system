const BACKEND_URL = "http://127.0.0.1:8000/";

const openBackendLink = document.getElementById("openBackend");
const checkBackendButton = document.getElementById("checkBackend");
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const buildTime = document.getElementById("buildTime");

const badgeStateClasses = ["badge--loading", "badge--success", "badge--error"];

function setStatus({ badgeText, message, stateClass = "" }) {
  if (!statusBadge || !statusText) {
    return;
  }

  statusBadge.textContent = badgeText;
  statusText.textContent = message;
  statusBadge.classList.remove(...badgeStateClasses);

  if (stateClass) {
    statusBadge.classList.add(stateClass);
  }
}

function openBackendPage() {
  window.open(BACKEND_URL, "_blank", "noopener,noreferrer");
}

if (openBackendLink) {
  openBackendLink.setAttribute("href", BACKEND_URL);
  openBackendLink.addEventListener("click", (event) => {
    event.preventDefault();
    openBackendPage();
  });
}

if (checkBackendButton) {
  checkBackendButton.addEventListener("click", async () => {
    setStatus({
      badgeText: "Проверяем",
      message: "Проверяем доступность backend...",
      stateClass: "badge--loading",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      await fetch(BACKEND_URL, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });

      setStatus({
        badgeText: "Доступен",
        message: `Backend отвечает. Нажмите «Открыть backend», чтобы перейти на ${BACKEND_URL}`,
        stateClass: "badge--success",
      });
    } catch (_error) {
      setStatus({
        badgeText: "Недоступен",
        message:
          "Backend не запущен на 127.0.0.1:8000. Запустите в папке backend: php artisan serve --host=127.0.0.1 --port=8000",
        stateClass: "badge--error",
      });
    } finally {
      clearTimeout(timeoutId);
    }
  });
}

if (buildTime) {
  buildTime.textContent = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}
