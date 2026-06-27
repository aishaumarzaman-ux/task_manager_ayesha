(function createStatsModule() {
  function updateStatistics(tasks) {
    const activeTasks = tasks.filter((task) => !task.archived);
    const totalTasks = activeTasks.length;
    const inProgressTasks = activeTasks.filter((task) => task.column === "inprogress").length;
    const completedTasks = activeTasks.filter((task) => task.column === "done").length;
    const overdueTasks = activeTasks.filter(window.KanbanBoard.isTaskOverdue).length;
    const completionPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    setText("totalTasks", totalTasks);
    setText("inProgressTasks", inProgressTasks);
    setText("completedTasks", completedTasks);
    setText("overdueTasks", overdueTasks);
    setText("completionPercent", `${completionPercent}%`);

    document.getElementById("completionBar").style.width = `${completionPercent}%`;
    document.getElementById("overdueTasks").closest(".stat-card").classList.toggle("overdue-active", overdueTasks > 0);
  }

  function setText(elementId, value) {
    document.getElementById(elementId).textContent = value;
  }

  window.KanbanStats = {
    updateStatistics
  };
})();
