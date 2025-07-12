
        // Cookie utilities
        const CookieManager = {
            set: function(name, value, days = 365) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                const expires = "expires=" + date.toUTCString();
                document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
            },
            
            get: function(name) {
                const nameEQ = name + "=";
                const ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) {
                        return decodeURIComponent(c.substring(nameEQ.length, c.length));
                    }
                }
                return null;
            },
            
            delete: function(name) {
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            }
        };

        // Todo application class
        class TodoApp {
            constructor() {
                this.todos = [];
                this.currentFilter = 'all';
                this.init();
            }

            init() {
                this.loadTodos();
                this.bindEvents();
                this.setMinDate();
                this.render();
            }

            loadTodos() {
                const savedTodos = CookieManager.get('todoList');
                if (savedTodos) {
                    try {
                        this.todos = JSON.parse(savedTodos);
                    } catch (error) {
                        console.error('Error parsing todos from cookie:', error);
                        this.todos = [];
                    }
                }
            }

            saveTodos() {
                CookieManager.set('todoList', JSON.stringify(this.todos));
            }

            bindEvents() {
                // Add todo form
                document.getElementById('addTodoForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTodo();
                });

                // Filter buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setFilter(e.target.dataset.filter);
                    });
                });

                // Delete all button
                document.getElementById('deleteAllBtn').addEventListener('click', () => {
                    this.deleteAllTodos();
                });
            }

            setMinDate() {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('dueDateInput').setAttribute('min', today);
            }

            addTodo() {
                const taskInput = document.getElementById('taskInput');
                const dueDateInput = document.getElementById('dueDateInput');
                const statusSelect = document.getElementById('statusSelect');

                const task = taskInput.value.trim();
                const dueDate = dueDateInput.value;
                const status = statusSelect.value;

                if (!task || !dueDate || !status) {
                    alert('Please fill in all fields');
                    return;
                }

                const newTodo = {
                    id: Date.now() + Math.random(),
                    task: task,
                    dueDate: dueDate,
                    status: status,
                    completed: status === 'completed',
                    createdAt: new Date().toISOString()
                };

                this.todos.push(newTodo);
                this.saveTodos();
                this.render();

                // Clear form
                taskInput.value = '';
                dueDateInput.value = '';
                statusSelect.value = 'Not Started';
            }

            deleteTodo(id) {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.saveTodos();
                this.render();
            }

            changeStatus(id, newStatus) {
                const todo = this.todos.find(todo => todo.id === id);
                if (todo) {
                    todo.status = newStatus;
                    todo.completed = newStatus === 'completed';
                    this.saveTodos();
                    this.render();
                }
            }

            setFilter(filter) {
                this.currentFilter = filter;
                
                // Update filter buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.filter === filter) {
                        btn.classList.add('active');
                    }
                });

                this.render();
            }

            deleteAllTodos() {
                if (this.todos.length === 0) return;
                
                if (confirm('Are you sure you want to delete all todos?')) {
                    this.todos = [];
                    this.saveTodos();
                    this.render();
                }
            }

            getFilteredTodos() {
                return this.todos.filter(todo => {
                    switch (this.currentFilter) {
                        case 'active':
                            return todo.status !== 'completed';
                        case 'completed':
                            return todo.status === 'completed';
                        default:
                            return true;
                    }
                });
            }

            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                });
            }

            render() {
                const container = document.getElementById('todoContainer');
                const filteredTodos = this.getFilteredTodos();
                
                // Update delete all button state
                const deleteAllBtn = document.getElementById('deleteAllBtn');
                deleteAllBtn.disabled = this.todos.length === 0;

                if (filteredTodos.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <h3>No tasks found</h3>
                            <p>
                                ${this.currentFilter === 'all' 
                                    ? 'Add a new task to get started!'
                                    : `No ${this.currentFilter} tasks found.`
                                }
                            </p>
                        </div>
                    `;
                    return;
                }

                const tableHTML = `
                    <table class="todo-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredTodos.map(todo => `
                                <tr>
                                    <td class="task-cell ${todo.status === 'completed' ? 'completed' : ''}">
                                        ${todo.task}
                                    </td>
                                    <td class="due-date-cell">
                                        ${this.formatDate(todo.dueDate)}
                                    </td>
                                    <td class="status-cell">
                                        <select class="status-dropdown" data-id="${todo.id}">
                                            <option value="not-started" ${todo.status === 'not-started' ? 'selected' : ''}>not started</option>
                                            <option value="in-progress" ${todo.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                            <option value="completed" ${todo.status === 'completed' ? 'selected' : ''}>Completed</option>
                                        </select>
                                    </td>
                                    <td class="actions-cell">
                                        <button class="delete-btn" data-id="${todo.id}" title="Delete todo">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;

                container.innerHTML = tableHTML;

                // Bind events for dynamically created elements
                this.bindDynamicEvents();
            }

            bindDynamicEvents() {
                // Status dropdown changes
                document.querySelectorAll('.status-dropdown').forEach(select => {
                    select.addEventListener('change', (e) => {
                        const id = parseFloat(e.target.dataset.id);
                        this.changeStatus(id, e.target.value);
                    });
                });

                // Delete buttons
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = parseFloat(e.target.closest('.delete-btn').dataset.id);
                        this.deleteTodo(id);
                    });
                });
            }
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new TodoApp();
        });