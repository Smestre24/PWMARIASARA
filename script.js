/* script.js - Lista de Tarefas Interativa (implementado) */
/*Alunas: Maria Isabeli Antunes Medeiros e Sara Silva Mestre */
/*Turma: 3 ano B */

/* variaveis globais */
let tasks = [];
let currentFilter = 'todas';
let searchTerm = '';
let editingTaskId = null;

/* inicialização */
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    if (!tasks || tasks.length === 0) addExampleTasks();
    renderTasks();
});

/* Event listeners */
function setupEventListeners() {
    const addBtn = document.getElementById('addTaskBtn');
    const taskInput = document.getElementById('taskInput');
    const filterSelect = document.getElementById('filterSelect');
    const searchInput = document.getElementById('searchInput');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const closeBtn = document.querySelector('.close');
    const modal = document.getElementById('editModal');

    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });

    filterSelect.addEventListener('change', function(e) {
        currentFilter = e.target.value;
        renderTasks();
    });

    searchInput.addEventListener('input', function(e) {
        searchTerm = e.target.value.toLowerCase();
        renderTasks();
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);
    clearAllBtn.addEventListener('click', clearAll);

    saveEditBtn.addEventListener('click', saveEdit);
    cancelEditBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    // fechar modal clicando fora do conteúdo
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    // ESC para fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('editModal');
            if (modal.style.display === 'flex') closeModal();
        }
    });
}

/* CRUD & ações  */
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const text = taskInput.value.trim();

    if (text === '') { showNotification('Por favor, digite uma tarefa!', 'error'); return; }
    if (text.length > 100) { showNotification('A tarefa deve ter no máximo 100 caracteres!', 'error'); return; }

    const task = {
        id: Date.now(),
        text,
        completed: false,
        priority: prioritySelect.value,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();

    taskInput.value = '';
    prioritySelect.value = 'media';
    taskInput.focus();

    showNotification('Tarefa adicionada com sucesso!', 'success');
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasks();
    renderTasks();
    showNotification(task.completed ? 'Tarefa concluída!' : 'Tarefa marcada como pendente!', 'success');
}

function deleteTask(id) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    // animação
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    tasks.splice(idx, 1);
    saveTasks();
    renderTasks();
    showNotification('Tarefa excluída!', 'success');
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    document.getElementById('editTaskInput').value = task.text;
    document.getElementById('editPrioritySelect').value = task.priority;
    const modal = document.getElementById('editModal');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('editTaskInput').focus();
}

function saveEdit() {
    const newText = document.getElementById('editTaskInput').value.trim();
    const newPriority = document.getElementById('editPrioritySelect').value;

    if (newText === '') { showNotification('Por favor, digite um texto para a tarefa!', 'error'); return; }
    if (newText.length > 100) { showNotification('A tarefa deve ter no máximo 100 caracteres!', 'error'); return; }

    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;
    task.text = newText;
    task.priority = newPriority;
    saveTasks();
    renderTasks();
    closeModal();
    showNotification('Tarefa editada com sucesso!', 'success');
}

function closeModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    editingTaskId = null;
}

/* limpar as que estão concluídas */
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) { showNotification('Não há tarefas concluídas para remover!', 'info'); return; }
    if (!confirm(`Excluir ${completedCount} tarefa(s) concluída(s)?`)) return;
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    showNotification(`${completedCount} tarefa(s) removida(s)!`, 'success');
}

/* limpar todas */
function clearAll() {
    if (tasks.length === 0) { showNotification('Não há tarefas para remover!', 'info'); return; }
    if (!confirm(`Excluir todas as ${tasks.length} tarefa(s)?`)) return;
    tasks = [];
    saveTasks();
    renderTasks();
    showNotification('Todas as tarefas foram removidas!', 'success');
}

/*  renderização  */
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');

    const filteredTasks = getFilteredTasks();

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        taskList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        taskList.style.display = 'block';

        filteredTasks.forEach(task => {
            const li = createTaskElement(task);
            taskList.appendChild(li);
        });
    }

    updateStats();
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.taskId = task.id;

    // left area
    const left = document.createElement('div'); left.className = 'task-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const textSpan = document.createElement('div');
    textSpan.className = 'task-text';
    textSpan.innerHTML = escapeHtml(task.text);

    left.appendChild(checkbox);
    left.appendChild(textSpan);

    // meta
    const meta = document.createElement('div'); meta.className = 'task-meta';
    const pri = document.createElement('span'); pri.className = 'task-priority ' + `priority-${task.priority}`;
    pri.textContent = task.priority;
    const createdDate = new Date(task.createdAt).toLocaleDateString('pt-BR');
    const dateSpan = document.createElement('span'); dateSpan.className = 'task-date';
    dateSpan.innerHTML = `Criada: ${createdDate}` + (task.completedAt ? `<br>Concluída: ${new Date(task.completedAt).toLocaleDateString('pt-BR')}` : '');

    meta.appendChild(pri);
    meta.appendChild(dateSpan);

    // actions
    const actions = document.createElement('div'); actions.className = 'task-actions';
    const editBtn = document.createElement('button'); editBtn.className = 'edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar';
    editBtn.title = 'Editar tarefa';
    editBtn.disabled = !!task.completed;
    editBtn.addEventListener('click', () => editTask(task.id));

    const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Excluir';
    deleteBtn.title = 'Excluir tarefa';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    // montar o li
    li.appendChild(left);
    li.appendChild(meta);
    li.appendChild(actions);

    return li;
}

/* filtros e busca */
function getFilteredTasks() {
    let filtered = [...tasks];

    switch (currentFilter) {
        case 'pendentes':
            filtered = filtered.filter(t => !t.completed);
            break;
        case 'concluidas':
            filtered = filtered.filter(t => t.completed);
            break;
        case 'alta':
        case 'media':
        case 'baixa':
            filtered = filtered.filter(t => t.priority === currentFilter);
            break;
        default:
            // 'todas' 
            break;
    }

    if (searchTerm) {
        filtered = filtered.filter(t => t.text.toLowerCase().includes(searchTerm));
    }

    return filtered;
}

/* estatísticas */
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('totalTasks').textContent = `Total: ${total}`;
    document.getElementById('completedTasks').textContent = `Concluídas: ${completed}`;
    document.getElementById('pendingTasks').textContent = `Pendentes: ${pending}`;
}

/*  persistência  */
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Erro ao salvar tarefas:', error);
        showNotification('Erro ao salvar tarefas!', 'error');
    }
}

function loadTasks() {
    try {
        const saved = localStorage.getItem('tasks');
        tasks = saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        tasks = [];
    }
}

/*  utilitários  */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // estilo inline 
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-weight:700;
        z-index:1100;
        max-width:320px;
        box-shadow: 0 8px 30px rgba(10,20,40,0.12);
    `;

    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 3000);
}

/* exemplo de tarefas */
function addExampleTasks() {
    const now = Date.now();
    const exampleTasks = [
        { id: now - 3000, text: 'Estudar JavaScript avançado', completed: false, priority: 'alta', createdAt: new Date(now - 86400000).toISOString(), completedAt: null },
        { id: now - 2000, text: 'Fazer exercícios de CSS', completed: true, priority: 'media', createdAt: new Date(now - 172800000).toISOString(), completedAt: new Date().toISOString() },
        { id: now - 1000, text: 'Revisar conceitos de HTML', completed: false, priority: 'baixa', createdAt: new Date(now - 259200000).toISOString(), completedAt: null }
    ];
    tasks = exampleTasks;
    saveTasks();
}


