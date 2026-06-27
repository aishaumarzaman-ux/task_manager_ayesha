(function createTasksModule() {
  const columns = ["todo", "inprogress", "done"];
  let tasks = [];

  function initializeTasks() {
    tasks = window.KanbanStorage.readTasksFromStorage();
  }

  function getTasks() {
    return tasks.map(copyTask);
  }

  function copyTask(task) {
    return {
      ...task,
      tags: [...task.tags]
    };
  }

  function findTaskById(taskId) {
    return tasks.find((task) => task.id === Number(taskId));
  }

  function createTask(taskData) {
    const now = Date.now();
    const task = {
      id: now,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      column: taskData.column,
      dueDate: taskData.dueDate,
      tags: taskData.tags,
      createdAt: now,
      archived: false
    };

    tasks = [task, ...tasks];
    persistTasks();
    return copyTask(task);
  }

  function updateTask(taskId, taskData) {
    tasks = tasks.map((task) => {
      if (task.id !== Number(taskId)) {
        return task;
      }

      return {
        ...task,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        column: taskData.column,
        dueDate: taskData.dueDate,
        tags: taskData.tags
      };
    });

    persistTasks();
  }

  function archiveTask(taskId) {
    tasks = tasks.map((task) => task.id === Number(taskId) ? { ...task, archived: true } : task);
    persistTasks();
  }

  function deleteTask(taskId) {
    tasks = tasks.filter((task) => task.id !== Number(taskId));
    persistTasks();
  }

  function restoreTask(taskId) {
    tasks = tasks.map((task) => task.id === Number(taskId) ? { ...task, archived: false } : task);
    persistTasks();
  }

  function moveTask(taskId, direction) {
    const task = findTaskById(taskId);
    if (!task) {
      return;
    }

    const currentIndex = columns.findIndex((column) => column === task.column);
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= columns.length) {
      return;
    }

    updateTaskColumn(taskId, columns[nextIndex]);
  }

  function updateTaskColumn(taskId, column) {
    tasks = tasks.map((task) => task.id === Number(taskId) ? { ...task, column } : task);
    persistTasks();
  }

  function reorderTask(taskId, targetTaskId) {
    const movingTask = tasks.find((task) => task.id === Number(taskId));
    const targetTask = tasks.find((task) => task.id === Number(targetTaskId));

    if (!movingTask || !targetTask || movingTask.id === targetTask.id) {
      return;
    }

    const withoutMovingTask = tasks.filter((task) => task.id !== movingTask.id);
    const targetIndex = withoutMovingTask.findIndex((task) => task.id === targetTask.id);
    withoutMovingTask.splice(targetIndex, 0, movingTask);
    tasks = withoutMovingTask;
    persistTasks();
  }

  function getArchivedTasks() {
    return tasks.filter((task) => task.archived).map(copyTask);
  }

  function persistTasks() {
    window.KanbanStorage.saveTasksToStorage(tasks);
  }

  window.KanbanTasks = {
    archiveTask,
    columns,
    createTask,
    deleteTask,
    findTaskById,
    getArchivedTasks,
    getTasks,
    initializeTasks,
    moveTask,
    reorderTask,
    restoreTask,
    updateTask,
    updateTaskColumn
  };
})();
