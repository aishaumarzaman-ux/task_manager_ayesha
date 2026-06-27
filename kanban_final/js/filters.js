(function createFiltersModule() {
  const priorityWeight = {
    high: 1,
    medium: 2,
    low: 3
  };

  const filterState = {
    search: "",
    priority: "all",
    sort: "created"
  };

  function getFilterState() {
    return { ...filterState };
  }

  function updateSearchFilter(value) {
    filterState.search = value.trim().toLowerCase();
  }

  function updatePriorityFilter(value) {
    filterState.priority = value;
  }

  function updateSortFilter(value) {
    filterState.sort = value;
  }

  function clearAllFilters() {
    filterState.search = "";
    filterState.priority = "all";
    filterState.sort = "created";
  }

  function getVisibleTasks(tasks) {
    return tasks
      .filter(isActiveTask)
      .filter(matchesSearch)
      .filter(matchesPriority);
  }

  function isActiveTask(task) {
    return !task.archived;
  }

  function matchesSearch(task) {
    if (!filterState.search) {
      return true;
    }

    // Search across every visible text field so title, description, tags, and metadata work together.
    const searchableText = [
      task.title,
      task.description,
      task.priority,
      task.dueDate,
      ...task.tags
    ].join(" ").toLowerCase();

    return searchableText.includes(filterState.search);
  }

  function matchesPriority(task) {
    return filterState.priority === "all" || task.priority === filterState.priority;
  }

  function sortTasks(tasks) {
    return [...tasks].sort(compareTasks);
  }

  function compareTasks(firstTask, secondTask) {
    if (filterState.sort === "dueDate") {
      return new Date(firstTask.dueDate) - new Date(secondTask.dueDate);
    }

    if (filterState.sort === "priority") {
      return priorityWeight[firstTask.priority] - priorityWeight[secondTask.priority];
    }

    // Default sort keeps the newest created task first after filters are cleared.
    return secondTask.createdAt - firstTask.createdAt;
  }

  window.KanbanFilters = {
    clearAllFilters,
    getFilterState,
    getVisibleTasks,
    sortTasks,
    updatePriorityFilter,
    updateSearchFilter,
    updateSortFilter
  };
})();
