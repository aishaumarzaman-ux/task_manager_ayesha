(function createStorageModule() {
  const TASKS_KEY = "kanban-tasks";
  const THEME_KEY = "kanban-theme";

  function readTasksFromStorage() {
    const storedTasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
    return storedTasks.map(normalizeStoredTask);
  }

  function normalizeStoredTask(task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      column: task.column,
      dueDate: task.dueDate,
      tags: normalizeStoredTags(task.tags),
      createdAt: task.createdAt || task.id,
      archived: Boolean(task.archived)
    };
  }

  function normalizeStoredTags(tags) {
    if (Array.isArray(tags)) {
      return tags.filter(Boolean);
    }

    if (typeof tags === "string") {
      return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    }

    return [];
  }

  function saveTasksToStorage(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function readThemeFromStorage() {
    return localStorage.getItem(THEME_KEY) || "light";
  }

  function saveThemeToStorage(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  function applyInitialThemeFromStorage() {
    // Runs before CSS loads so the saved theme is applied without a flash.
    document.documentElement.dataset.theme = readThemeFromStorage();
  }

  window.KanbanStorage = {
    readTasksFromStorage,
    saveTasksToStorage,
    readThemeFromStorage,
    saveThemeToStorage
  };

  applyInitialThemeFromStorage();
})();
