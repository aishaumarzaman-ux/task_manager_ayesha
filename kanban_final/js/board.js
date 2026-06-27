(function createBoardModule() {
  const columnLabels = {
    todo: "To Do",
    inprogress: "In Progress",
    done: "Done"
  };

  function renderBoard() {
    const tasks = window.KanbanTasks.getTasks();
    const visibleTasks = window.KanbanFilters.getVisibleTasks(tasks);

    window.KanbanTasks.columns.forEach((column) => renderColumn(column, visibleTasks));
    window.KanbanStats.updateStatistics(tasks);
    window.KanbanUI.renderArchive();
  }

  function renderColumn(column, visibleTasks) {
    const list = document.getElementById(`${column}List`);
    const columnTasks = window.KanbanFilters.sortTasks(visibleTasks.filter((task) => task.column === column));
    const cards = columnTasks.map(createTaskCard);

    list.replaceChildren(...cards);

    if (cards.length === 0) {
      list.appendChild(createEmptyState(column));
    }

    document.getElementById(`${column}Count`).textContent = columnTasks.length;
  }

  function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = getTaskCardClass(task);
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.priority = task.priority;

    const topLine = document.createElement("div");
    topLine.className = "task-topline";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const topBadges = document.createElement("div");
    topBadges.className = "task-meta";
    topBadges.appendChild(createPriorityBadge(task.priority));

    if (task.column === "done") {
      topBadges.appendChild(createCheckmark());
    }

    if (isTaskOverdue(task)) {
      topBadges.appendChild(createBadge("Overdue", "overdue-badge"));
    }

    topLine.append(title, topBadges);

    const dueDate = document.createElement("p");
    dueDate.className = "task-description";
    dueDate.textContent = `Due ${formatReadableDate(task.dueDate)} ${getDueDateCountdown(task)}`;

    const tagList = document.createElement("div");
    tagList.className = "task-tags";
    task.tags.map(createTagPill).forEach((tag) => tagList.appendChild(tag));

    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = getDescriptionPreview(task.description);

    const actions = createTaskActions(task);
    card.append(topLine, dueDate, tagList, description, actions);
    return card;
  }

  function getTaskCardClass(task) {
    const classNames = ["task-card"];
    if (task.column === "done") {
      classNames.push("done");
    }
    if (isTaskOverdue(task)) {
      classNames.push("overdue");
    }
    return classNames.join(" ");
  }

  function createPriorityBadge(priority) {
    return createBadge(capitalize(priority), `priority-${priority}`);
  }

  function createBadge(text, className) {
    const badge = document.createElement("span");
    badge.className = `badge ${className}`;
    badge.textContent = text;
    return badge;
  }

  function createCheckmark() {
    const checkmark = document.createElement("span");
    checkmark.className = "checkmark";
    checkmark.title = "Completed";
    const icon = document.createElement("i");
    icon.className = "fa-solid fa-circle-check";
    icon.setAttribute("aria-hidden", "true");
    checkmark.appendChild(icon);
    return checkmark;
  }

  function createTagPill(tag) {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.textContent = tag;
    return pill;
  }

  function createTaskActions(task) {
    const actions = document.createElement("div");
    actions.className = "task-actions";

    if (task.column !== "todo") {
      actions.appendChild(createActionButton("Move left", "move-left"));
    }

    if (task.column !== "done") {
      actions.appendChild(createActionButton("Move right", "move-right"));
    }

    actions.appendChild(createActionButton("Edit task", "edit"));
    actions.appendChild(createActionButton("Archive task", "archive"));
    actions.appendChild(createActionButton("Delete task", "delete"));
    return actions;
  }

  const actionIcons = {
    "move-left": "fa-solid fa-arrow-left",
    "move-right": "fa-solid fa-arrow-right",
    "edit": "fa-solid fa-pen-to-square",
    "archive": "fa-solid fa-box-archive",
    "delete": "fa-solid fa-trash"
  };

  function createActionButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    button.setAttribute("aria-label", label);
    button.title = label;
    const icon = document.createElement("i");
    icon.className = actionIcons[action];
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);
    return button;
  }

  function createEmptyState(column) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = `No visible tasks in ${columnLabels[column]}.`;
    return emptyState;
  }

  function getDescriptionPreview(description) {
    if (!description) {
      return "No description provided.";
    }

    return description.length > 60 ? `${description.slice(0, 60)}...` : description;
  }

  function formatReadableDate(isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function isTaskOverdue(task) {
    if (task.column === "done") {
      return false;
    }

    // Compare ISO date strings directly because YYYY-MM-DD sorts chronologically.
    const today = getTodayIsoDate();
    return task.dueDate < today;
  }

  function getTodayIsoDate() {
    return new Date().toISOString().split("T")[0];
  }

  function getDueDateCountdown(task) {
    if (task.column === "done" || isTaskOverdue(task)) {
      return "";
    }

    const today = new Date(`${getTodayIsoDate()}T00:00:00`);
    const due = new Date(`${task.dueDate}T00:00:00`);
    const days = Math.ceil((due - today) / 86400000);

    if (days === 0) {
      return "· due today";
    }

    return `· due in ${days} day${days === 1 ? "" : "s"}`;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  window.KanbanBoard = {
    formatReadableDate,
    getTodayIsoDate,
    isTaskOverdue,
    renderBoard
  };
})();
