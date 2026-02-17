// ── DOM references ──
const taskInput = document.getElementById("task-input");
const dueDateInput = document.getElementById("due-date");
const dueTimeInput = document.getElementById("due-time");
const addBtn = document.getElementById("add-btn");
const clearBtn = document.getElementById("clear-btn");
const taskList = document.getElementById("task-list");
const emptyMsg = document.getElementById("empty-msg");

// ── Load tasks from localStorage on page load ──
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
tasks.forEach(renderTask);
updateEmptyMessage();

// ── Event listeners ──
addBtn.addEventListener("click", addTask);
clearBtn.addEventListener("click", clearAllTasks);

taskInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTask();
});

// ── Add a new task ──
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: Date.now(),       // timestamp so we can format it any way we like
    dueDate: dueDateInput.value, // "YYYY-MM-DD" string, or "" if not set
    dueTime: dueTimeInput.value, // "HH:MM" string, or "" if not set
  };

  tasks.push(task);
  saveTasks();
  renderTask(task);
  updateEmptyMessage();

  // Clear all inputs and return focus to the text field
  taskInput.value = "";
  dueDateInput.value = "";
  dueTimeInput.value = "";
  taskInput.focus();
}

// ── Format a JS timestamp (milliseconds) into "Jan 1, 2026 at 10:30 AM" ──
function formatCreatedAt(timestamp) {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return datePart + " at " + timePart;
}

// ── Format a due date string and optional time string into readable text ──
// dateStr is "YYYY-MM-DD", timeStr is "HH:MM" or "".
// We parse manually to avoid UTC-vs-local timezone issues.
function formatDueDateTime(dateStr, timeStr) {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day); // local midnight
  const datePart = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeObj = new Date(year, month - 1, day, hours, minutes);
    const timePart = timeObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return datePart + " at " + timePart;
  }

  return datePart;
}

// ── Return true if the task's due date/time has already passed ──
function isOverdue(dateStr, timeStr) {
  if (!dateStr) return false;

  const [year, month, day] = dateStr.split("-").map(Number);
  let dueDateTime;

  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    dueDateTime = new Date(year, month - 1, day, hours, minutes);
  } else {
    // No specific time: treat end of day as the deadline
    dueDateTime = new Date(year, month - 1, day, 23, 59, 59);
  }

  return dueDateTime < new Date();
}

// ── Return true if the due date is today (regardless of time) ──
function isDueToday(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  const [year, month, day] = dateStr.split("-").map(Number);

  return (
    year === today.getFullYear() &&
    month === today.getMonth() + 1 &&
    day === today.getDate()
  );
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

  // Content wrapper (holds task text + metadata below it)
  const content = document.createElement("div");
  content.classList.add("task-content");

  // Task text
  const span = document.createElement("span");
  span.classList.add("task-text");
  span.textContent = task.text;

  // Metadata block
  const meta = document.createElement("div");
  meta.classList.add("task-meta");

  // Created-at line (only shown if the task has this field — old saved tasks may not)
  if (task.createdAt) {
    const createdSpan = document.createElement("span");
    createdSpan.classList.add("meta-created");
    createdSpan.textContent = "Created: " + formatCreatedAt(task.createdAt);
    meta.appendChild(createdSpan);
  }

  // Due date/time line (only shown if a due date was set)
  const dueText = formatDueDateTime(task.dueDate, task.dueTime);
  if (dueText) {
    const dueSpan = document.createElement("span");
    dueSpan.classList.add("meta-due");

    // Color-code urgency for incomplete tasks only
    if (!task.completed) {
      if (isOverdue(task.dueDate, task.dueTime)) {
        dueSpan.classList.add("overdue");
      } else if (isDueToday(task.dueDate)) {
        dueSpan.classList.add("due-today");
      }
    }

    dueSpan.textContent = "Due: " + dueText;
    meta.appendChild(dueSpan);
  }

  content.appendChild(span);
  content.appendChild(meta);

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.textContent = "✕";
  deleteBtn.title = "Delete task";
  deleteBtn.addEventListener("click", function () {
    deleteTask(task.id, li);
  });

  li.appendChild(checkbox);
  li.appendChild(content);
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

// ── Clear all tasks ──
function clearAllTasks() {
  if (!confirm("Remove all tasks?")) return;
  tasks = [];
  saveTasks();
  taskList.innerHTML = "";
  updateEmptyMessage();
}

// ── Show/hide the empty state message and the clear button ──
function updateEmptyMessage() {
  const hasTasks = tasks.length > 0;
  emptyMsg.style.display = hasTasks ? "none" : "block";
  clearBtn.style.display = hasTasks ? "block" : "none";
}

// ── Persist tasks to localStorage ──
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
