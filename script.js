// ── DOM references ──
const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const emptyMsg = document.getElementById("empty-msg");

// ── Load tasks from localStorage on page load ──
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
tasks.forEach(renderTask);
updateEmptyMessage();

// ── Event listeners ──
addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTask();
});

// ── Add a new task ──
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const task = { id: Date.now(), text: text, completed: false };
  tasks.push(task);
  saveTasks();
  renderTask(task);
  updateEmptyMessage();

  taskInput.value = "";
  taskInput.focus();
}

// ── Create and append a task <li> element ──
function renderTask(task) {
  const li = document.createElement("li");
  li.classList.add("task-item");
  li.dataset.id = task.id;
  if (task.completed) li.classList.add("completed");

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", function () {
    toggleTask(task.id, li);
  });

  // Task text
  const span = document.createElement("span");
  span.classList.add("task-text");
  span.textContent = task.text;

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.textContent = "✕";
  deleteBtn.title = "Delete task";
  deleteBtn.addEventListener("click", function () {
    deleteTask(task.id, li);
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);
}

// ── Toggle completed state ──
function toggleTask(id, li) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  li.classList.toggle("completed", task.completed);
  saveTasks();
}

// ── Delete a task ──
function deleteTask(id, li) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  li.remove();
  updateEmptyMessage();
}

// ── Show/hide the empty state message ──
function updateEmptyMessage() {
  emptyMsg.style.display = tasks.length === 0 ? "block" : "none";
}

// ── Persist tasks to localStorage ──
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
