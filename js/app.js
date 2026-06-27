function initializeApp() {
  window.KanbanTasks.initializeTasks();
  window.KanbanUI.initializeUi();
  window.KanbanBoard.renderBoard();
}

document.addEventListener("DOMContentLoaded", initializeApp);
