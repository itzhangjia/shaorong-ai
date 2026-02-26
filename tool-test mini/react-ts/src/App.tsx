import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (inputValue.trim() === '') return;
    const newTask = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    setInputValue('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const remainingCount = tasks.filter(task => !task.completed).length;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>✨ Todo List ✨</h1>
        <p>Simple, beautiful & animated</p>
      </header>

      <main className="app-main">
        <div className="input-section">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a new task..."
            className="task-input"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask} className="add-btn">+</button>
        </div>

        <ul className="task-list">
          {filteredTasks.length === 0 ? (
            <li className="empty-state">
              {filter === 'all' 
                ? 'No tasks yet. Add one above!' 
                : filter === 'active' 
                  ? 'All tasks completed! 🎉' 
                  : 'No completed tasks.'}
            </li>
          ) : (
            filteredTasks.map((task) => (
              <li 
                key={task.id} 
                className={`task-item ${task.completed ? 'completed' : ''}`}
              >
                <label className="task-checkbox">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="checkmark"></span>
                </label>
                <span className="task-text">{task.text}</span>
                <button 
                  onClick={() => deleteTask(task.id)} 
                  className="delete-btn"
                  aria-label="Delete task"
                >
                  ×
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="filters">
          <button 
            onClick={() => setFilter('all')} 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('active')} 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('completed')} 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          >
            Completed
          </button>
          <button 
            onClick={clearCompleted} 
            className="clear-btn"
            disabled={tasks.filter(t => t.completed).length === 0}
          >
            Clear Completed
          </button>
        </div>
      </main>

      <footer className="app-footer">
        <p>{remainingCount} {remainingCount === 1 ? 'task' : 'tasks'} left</p>
      </footer>
    </div>
  );
}

export default App;
