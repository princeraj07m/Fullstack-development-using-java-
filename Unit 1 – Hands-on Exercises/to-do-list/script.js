const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const addBtn = document.querySelector('#add-btn');
const taskList = document.querySelector('#task-list');
const errorDiv = document.querySelector('#error');
const filters = document.querySelectorAll('.filter');
const totalCount = document.querySelector('#total-count');

let tasks = [];
let activeFilter = 'all';

function loadTasks(){
    try{
        const raw = localStorage.getItem('todo_tasks');
        tasks = raw ? JSON.parse(raw) : [];
    }catch(e){ tasks = [] }
}

function saveTasks(){
    localStorage.setItem('todo_tasks', JSON.stringify(tasks));
}

function createTaskElement(task){
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleComplete(task.id, checkbox.checked));

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = 'Delete';
    del.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(del);

    return li;
}

function render(){
    taskList.innerHTML = '';

    const toShow = tasks.filter(t => {
        if(activeFilter === 'all') return true;
        if(activeFilter === 'completed') return t.completed === true;
        if(activeFilter === 'pending') return t.completed === false;
    });

    toShow.forEach(task => {
        const el = createTaskElement(task);
        taskList.appendChild(el);
    });

    totalCount.textContent = tasks.length;
}

function showError(msg){
    errorDiv.textContent = msg;
    setTimeout(() => { errorDiv.textContent = ''; }, 2200);
}

function addTask(e){
    e.preventDefault();
    const title = taskInput.value.trim();
    if(!title){ showError('Please enter a task.'); return; }

    const task = { id: Date.now().toString(), title, completed: false };
    tasks.push(task);
    saveTasks();
    render();
    taskInput.value = '';
    taskInput.focus();
}

function toggleComplete(id, completed){
    const t = tasks.find(x => x.id === id);
    if(!t) return;
    t.completed = completed;
    saveTasks();
    const li = taskList.querySelector(`li[data-id="${id}"]`);
    if(li){
        if(t.completed) li.classList.add('completed'); else li.classList.remove('completed');
    }
    renderCountsOnly();
}

function deleteTask(id){
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
}

function renderCountsOnly(){
    totalCount.textContent = tasks.length;
}

document.querySelector('.filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if(!btn) return;
    document.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
});

taskForm.addEventListener('submit', addTask);

loadTasks();
render();
