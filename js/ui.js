(function createUiModule() {
  let formTags = [];
  let pendingDeleteId = null;
  let pendingConfirmAction = null;

  function initializeUi() {
    applySavedTheme();
    setMinimumDueDate();
    bindUiEvents();
  }

  function bindUiEvents() {
    document.getElementById("globalAddTask").addEventListener("click", () => openTaskModal("todo"));
    document.getElementById("closeTaskModal").addEventListener("click", closeTaskModal);
    document.getElementById("cancelTask").addEventListener("click", closeTaskModal);
    document.getElementById("taskForm").addEventListener("submit", handleTaskFormSubmit);
    document.getElementById("tagInput").addEventListener("keydown", handleTagInput);
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
    document.getElementById("searchInput").addEventListener("input", handleSearchInput);
    document.getElementById("priorityFilter").addEventListener("change", handlePriorityFilter);
    document.getElementById("sortSelect").addEventListener("change", handleSortFilter);
    document.getElementById("clearFilters").addEventListener("click", resetFilters);
    document.getElementById("board").addEventListener("click", handleBoardClick);
    document.getElementById("board").addEventListener("dragstart", handleDragStart);
    document.getElementById("board").addEventListener("dragover", handleDragOver);
    document.getElementById("board").addEventListener("drop", handleDrop);
    document.getElementById("board").addEventListener("dragend", handleDragEnd);
    document.getElementById("cancelConfirm").addEventListener("click", closeConfirmModal);
    document.getElementById("confirmDelete").addEventListener("click", confirmTaskAction);
    document.getElementById("archiveButton").addEventListener("click", openArchive);
    document.getElementById("closeArchive").addEventListener("click", closeArchive);
    document.getElementById("archiveList").addEventListener("click", handleArchiveClick);
    document.getElementById("exportButton").addEventListener("click", exportTasksToJson);
    document.querySelectorAll("[data-add-column]").forEach(bindColumnAddButton);
    document.querySelectorAll(".tab-button").forEach(bindTabButton);
    document.addEventListener("keydown", handleKeyboardShortcuts);
  }

  function bindColumnAddButton(button) {
    button.addEventListener("click", () => openTaskModal(button.dataset.addColumn));
  }

  function bindTabButton(button) {
    button.addEventListener("click", () => activateMobileTab(button.dataset.tab));
  }

  function openTaskModal(column, taskId) {
    clearValidationMessages();
    resetForm();
    setMinimumDueDate();

    if (taskId) {
      fillFormForEditing(taskId);
    } else {
      document.getElementById("modalTitle").textContent = "Create Task";
      document.getElementById("submitTask").textContent = "Create Task";
      document.getElementById("taskColumn").value = column;
    }

    document.getElementById("taskModal").classList.remove("hidden");
    document.getElementById("taskTitle").focus();
  }

  function fillFormForEditing(taskId) {
    const task = window.KanbanTasks.findTaskById(taskId);
    if (!task) {
      return;
    }

    document.getElementById("modalTitle").textContent = "Edit Task";
    document.getElementById("submitTask").textContent = "Save Changes";
    document.getElementById("taskId").value = task.id;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value = task.description;
    document.getElementById("taskPriority").value = task.priority;
    document.getElementById("taskDueDate").value = task.dueDate;
    document.getElementById("taskColumn").value = task.column;
    formTags = [...task.tags];
    renderFormTags();
  }

  function closeTaskModal() {
    document.getElementById("taskModal").classList.add("hidden");
    resetForm();
  }

  function resetForm() {
    document.getElementById("taskForm").reset();
    document.getElementById("taskId").value = "";
    formTags = [];
    renderFormTags();
  }

  function handleTaskFormSubmit(event) {
    event.preventDefault();
    commitPendingTagInput();
    const taskData = readTaskFormData();

    if (!validateTaskForm(taskData)) {
      return;
    }

    const taskId = document.getElementById("taskId").value;

    if (taskId) {
      window.KanbanTasks.updateTask(taskId, taskData);
    } else {
      window.KanbanTasks.createTask(taskData);
    }

    closeTaskModal();
    window.KanbanBoard.renderBoard();
  }

  function readTaskFormData() {
    return {
      title: document.getElementById("taskTitle").value.trim(),
      description: document.getElementById("taskDescription").value.trim(),
      priority: document.getElementById("taskPriority").value,
      dueDate: document.getElementById("taskDueDate").value,
      column: document.getElementById("taskColumn").value,
      tags: [...formTags]
    };
  }

  function validateTaskForm(taskData) {
    clearValidationMessages();
    let isValid = true;

    if (taskData.title.length < 3) {
      setError("titleError", "Title is required and must be at least 3 characters.");
      isValid = false;
    }

    if (!["high", "medium", "low"].includes(taskData.priority)) {
      setError("priorityError", "Choose High, Medium, or Low.");
      isValid = false;
    }

    if (!taskData.dueDate) {
      setError("dueDateError", "Due date is required.");
      isValid = false;
    } else if (taskData.dueDate < window.KanbanBoard.getTodayIsoDate()) {
      setError("dueDateError", "Due date cannot be in the past.");
      isValid = false;
    }

    return isValid;
  }

  function setError(elementId, message) {
    document.getElementById(elementId).textContent = message;
  }

  function clearValidationMessages() {
    ["titleError", "priorityError", "dueDateError"].forEach((elementId) => setError(elementId, ""));
  }

  function handleTagInput(event) {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    addTag(event.target.value);
    event.target.value = "";
  }

  function commitPendingTagInput() {
    const tagInput = document.getElementById("tagInput");
    addTag(tagInput.value);
    tagInput.value = "";
  }

  function addTag(rawTag) {
    rawTag.split(",").map((tag) => tag.trim()).filter(Boolean).forEach(addSingleTag);
    renderFormTags();
  }

  function addSingleTag(tag) {
    const normalizedTags = formTags.map((existingTag) => existingTag.toLowerCase());

    if (!tag || normalizedTags.includes(tag.toLowerCase())) {
      return;
    }

    formTags = [...formTags, tag];
  }

  function removeTag(tag) {
    formTags = formTags.filter((existingTag) => existingTag !== tag);
    renderFormTags();
  }

  function renderFormTags() {
    const tagContainer = document.getElementById("formTags");
    const tagElements = formTags.map(createEditableTag);
    tagContainer.replaceChildren(...tagElements);
  }

  function createEditableTag(tag) {
    const tagElement = document.createElement("span");
    tagElement.className = "tag-pill form-tag";
    tagElement.textContent = tag;

    const removeButton = document.createElement("button");
    removeButton.className = "tag-remove";
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Remove ${tag}`);
    removeButton.addEventListener("click", () => removeTag(tag));

    tagElement.appendChild(removeButton);
    return tagElement;
  }

  function handleSearchInput(event) {
    window.KanbanFilters.updateSearchFilter(event.target.value);
    window.KanbanBoard.renderBoard();
  }

  function handlePriorityFilter(event) {
    window.KanbanFilters.updatePriorityFilter(event.target.value);
    window.KanbanBoard.renderBoard();
  }

  function handleSortFilter(event) {
    window.KanbanFilters.updateSortFilter(event.target.value);
    window.KanbanBoard.renderBoard();
  }

  function resetFilters() {
    window.KanbanFilters.clearAllFilters();
    document.getElementById("searchInput").value = "";
    document.getElementById("priorityFilter").value = "all";
    document.getElementById("sortSelect").value = "created";
    window.KanbanBoard.renderBoard();
  }

  function handleBoardClick(event) {
    const actionButton = event.target.closest("[data-action]");
    const addButton = event.target.closest("[data-add-column]");

    if (addButton) {
      openTaskModal(addButton.dataset.addColumn);
      return;
    }

    if (!actionButton) {
      return;
    }

    const card = actionButton.closest(".task-card");
    const taskId = Number(card.dataset.taskId);
    const action = actionButton.dataset.action;
    handleTaskAction(action, taskId);
  }

  function handleTaskAction(action, taskId) {
    if (action === "edit") {
      openTaskModal("todo", taskId);
      return;
    }

    if (action === "archive") {
      openConfirmModal(taskId, "archive");
      return;
    }

    if (action === "delete") {
      openConfirmModal(taskId, "delete");
      return;
    }

    if (action === "move-left") {
      window.KanbanTasks.moveTask(taskId, -1);
    }

    if (action === "move-right") {
      window.KanbanTasks.moveTask(taskId, 1);
    }

    window.KanbanBoard.renderBoard();
  }

  function openConfirmModal(taskId, action) {
    pendingDeleteId = taskId;
    pendingConfirmAction = action;
    updateConfirmModalText(action);
    document.getElementById("confirmModal").classList.remove("hidden");
  }

  function closeConfirmModal() {
    pendingDeleteId = null;
    pendingConfirmAction = null;
    document.getElementById("confirmModal").classList.add("hidden");
  }

  function updateConfirmModalText(action) {
    const isArchive = action === "archive";
    document.getElementById("confirmTitle").textContent = isArchive ? "Archive task?" : "Delete task?";
    document.getElementById("confirmMessage").textContent = isArchive
      ? "This task will move out of the board and appear in Archive."
      : "This task will be permanently deleted and cannot be restored.";
    document.getElementById("confirmDelete").textContent = isArchive ? "Archive" : "Delete";
  }

  function confirmTaskAction() {
    if (pendingDeleteId && pendingConfirmAction === "archive") {
      window.KanbanTasks.archiveTask(pendingDeleteId);
    }

    if (pendingDeleteId && pendingConfirmAction === "delete") {
      window.KanbanTasks.deleteTask(pendingDeleteId);
    }

    window.KanbanBoard.renderBoard();
    closeConfirmModal();
  }

  function applySavedTheme() {
    const theme = window.KanbanStorage.readThemeFromStorage();
    document.documentElement.dataset.theme = theme;
    updateThemeToggleText(theme);
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.KanbanStorage.saveThemeToStorage(nextTheme);
    updateThemeToggleText(nextTheme);
  }

  function updateThemeToggleText(theme) {
    document.getElementById("themeToggleText").textContent = theme === "dark" ? "Light" : "Dark";
    document.getElementById("themeIcon").className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  function setMinimumDueDate() {
    document.getElementById("taskDueDate").min = window.KanbanBoard.getTodayIsoDate();
  }

  function activateMobileTab(column) {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === column);
    });
    document.querySelectorAll(".kanban-column").forEach((columnElement) => {
      columnElement.classList.toggle("active", columnElement.dataset.column === column);
    });
  }

  function handleDragStart(event) {
    const card = event.target.closest(".task-card");
    if (!card) {
      return;
    }

    card.classList.add("dragging");
    event.dataTransfer.setData("text/plain", card.dataset.taskId);
  }

  function handleDragOver(event) {
    if (event.target.closest("[data-drop-column]")) {
      event.preventDefault();
    }
  }

  function handleDrop(event) {
    const dropZone = event.target.closest("[data-drop-column]");
    if (!dropZone) {
      return;
    }

    event.preventDefault();
    const taskId = Number(event.dataTransfer.getData("text/plain"));
    const targetCard = event.target.closest(".task-card");

    window.KanbanTasks.updateTaskColumn(taskId, dropZone.dataset.dropColumn);

    // If the card is dropped over another card, keep that visible ordering in localStorage.
    if (targetCard) {
      window.KanbanTasks.reorderTask(taskId, Number(targetCard.dataset.taskId));
    }

    window.KanbanBoard.renderBoard();
  }

  function handleDragEnd() {
    document.querySelectorAll(".task-card.dragging").forEach((card) => card.classList.remove("dragging"));
  }

  function openArchive() {
    renderArchive();
    document.getElementById("archivePanel").classList.remove("hidden");
  }

  function closeArchive() {
    document.getElementById("archivePanel").classList.add("hidden");
  }

  function renderArchive() {
    const archiveList = document.getElementById("archiveList");
    const archivedTasks = window.KanbanTasks.getArchivedTasks();
    const archiveItems = archivedTasks.map(createArchiveItem);

    archiveList.replaceChildren(...archiveItems);

    if (archivedTasks.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = "No archived tasks yet.";
      archiveList.appendChild(emptyState);
    }
  }

  function createArchiveItem(task) {
    const item = document.createElement("article");
    item.className = "archive-item";

    const title = document.createElement("h3");
    title.textContent = task.title;

    const meta = document.createElement("p");
    meta.textContent = `${task.priority} · ${task.column} · ${window.KanbanBoard.formatReadableDate(task.dueDate)}`;

    const restoreButton = document.createElement("button");
    restoreButton.className = "secondary-button";
    restoreButton.type = "button";
    restoreButton.dataset.restoreId = task.id;
    restoreButton.textContent = "Restore";

    item.append(title, meta, restoreButton);
    return item;
  }

  function handleArchiveClick(event) {
    const restoreButton = event.target.closest("[data-restore-id]");
    if (!restoreButton) {
      return;
    }

    window.KanbanTasks.restoreTask(Number(restoreButton.dataset.restoreId));
    window.KanbanBoard.renderBoard();
  }

  function exportTasksToJson() {
    const data = JSON.stringify(window.KanbanTasks.getTasks(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "kanban-tasks.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleKeyboardShortcuts(event) {
    if (event.target.matches("input, textarea, select")) {
      handleEscapeInInput(event);
      return;
    }

    if (event.key.toLowerCase() === "n") {
      openTaskModal("todo");
    }

    if (event.key === "/") {
      event.preventDefault();
      document.getElementById("searchInput").focus();
    }

    if (event.key === "Escape") {
      closeTaskModal();
      closeConfirmModal();
      closeArchive();
    }
  }

  function handleEscapeInInput(event) {
    if (event.key === "Escape") {
      closeTaskModal();
      closeConfirmModal();
      closeArchive();
    }
  }

  window.KanbanUI = {
    initializeUi,
    renderArchive
  };
})();
