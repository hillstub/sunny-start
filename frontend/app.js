// State
const STATE = {
    chores: [],
    startTime: null,
    timerInterval: null,
    history: [],
    currentJoke: null,
    chart: null
};

// DOM Elements
const screens = {
    setup: document.getElementById('setup-screen'),
    quest: document.getElementById('quest-screen'),
    victory: document.getElementById('victory-screen')
};

const setupList = document.getElementById('setup-chore-list');
const questList = document.getElementById('quest-list');
const newChoreInput = document.getElementById('new-chore-input');
const questTimer = document.getElementById('quest-timer');

// Mock Rewards (Direct GIF links)
const REWARDS = [
    'https://i.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.webp', // Minions
    'https://i.giphy.com/media/3oz8xAFtqoOUUrqPkE/giphy.webp', // Success
    'https://i.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.webp', // Dancing
    'https://i.giphy.com/media/dkGhBWE3SyzXW/giphy.webp', // Snoopy
    'https://i.giphy.com/media/ely3apHakzB6g/giphy.webp' // Puppy
];

// Initialization
async function init() {
    await loadChores();
    await loadHistory();
    showSetup();

    // Event Listeners
    document.getElementById('add-chore-btn').addEventListener('click', addChore);
    document.getElementById('start-quest-btn').addEventListener('click', startQuest);
    document.getElementById('abort-btn').addEventListener('click', showSetup);
    document.getElementById('restart-btn').addEventListener('click', showSetup);

    newChoreInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addChore();
    });
}

// API Helpers
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        if (!response.ok) throw new Error('API Error');
        return await response.json();
    } catch (err) {
        console.error('Fetch Error:', err);
        return null;
    }
}

// Logic: Setup
async function loadChores() {
    const data = await apiFetch('/chores');
    if (data) {
        STATE.chores = data;
    }
}

async function loadHistory() {
    const data = await apiFetch('/history');
    if (data) {
        STATE.history = data;
    }
}

async function loadJoke() {
    const data = await apiFetch('/joke');
    if (data) {
        STATE.currentJoke = data.joke;
    }
}


async function addChore() {
    const text = newChoreInput.value.trim();
    if (!text) return;

    const newChore = await apiFetch('/chores', {
        method: 'POST',
        body: JSON.stringify({ text })
    });

    if (newChore) {
        STATE.chores.push(newChore);
        newChoreInput.value = '';
        renderSetup();
    }
}

async function removeChore(id) {
    const result = await apiFetch(`/chores/${id}`, { method: 'DELETE' });
    if (result) {
        STATE.chores = STATE.chores.filter(c => c.id !== id);
        renderSetup();
    }
}

function renderSetup() {
    setupList.innerHTML = '';
    STATE.chores.forEach(chore => {
        const li = document.createElement('li');
        li.className = 'setup-item';
        li.innerHTML = `
            <span>${chore.text}</span>
            <button class="delete-btn">×</button>
        `;
        setupList.appendChild(li);
        li.querySelector('.delete-btn').onclick = () => removeChore(chore.id);
    });

    // Render History
    const historyList = document.getElementById('history-list');
    if (historyList) {
        historyList.innerHTML = '';
        if (STATE.history.length === 0) {
            historyList.innerHTML = '<li class="history-item">No adventures yet!</li>';
        } else {
            STATE.history.forEach(entry => {
                const date = new Date(entry.date).toLocaleDateString();
                const m = Math.floor(entry.time / 60);
                const s = entry.time % 60;
                const li = document.createElement('li');
                li.className = 'history-item';
                li.innerHTML = `<span>${date}</span> <strong>${m}m ${s}s</strong>`;
                historyList.appendChild(li);
            });
        }
    }

    renderHistoryChart();
}

function renderHistoryChart() {
    const ctx = document.getElementById('history-chart');
    if (!ctx || STATE.history.length === 0) return;

    // Sort history by date ascending for the graph
    const chartData = [...STATE.history].sort((a, b) => a.date - b.date).slice(-7); // Last 7 days

    const labels = chartData.map(entry => new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const data = chartData.map(entry => entry.time);

    if (STATE.chart) {
        STATE.chart.destroy();
    }

    STATE.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Time (seconds)',
                data: data,
                borderColor: '#4361EE',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#F72585',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            const m = Math.floor(value / 60);
                            const s = value % 60;
                            return m > 0 ? `${m}m` : `${s}s`;
                        }
                    }
                }
            }
        }
    });
}


// Logic: Screen Navigation
function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

async function showSetup() {
    stopTimer();
    STATE.chores.forEach(c => c.completed = false);
    switchScreen('setup');
    await loadHistory(); // Fresh history
    renderSetup();
}

// Logic: Active Quest
async function startQuest() {
    if (STATE.chores.length === 0) {
        alert("Add some chores first!");
        return;
    }

    STATE.startTime = Date.now();
    STATE.chores.forEach(c => c.completed = false);

    startTimer();
    renderQuest();
    switchScreen('quest');

    // Display joke during mission
    await loadJoke();
    const jokeContainer = document.getElementById('joke-container');
    const jokeText = document.getElementById('mission-joke');
    if (STATE.currentJoke && jokeContainer && jokeText) {
        jokeText.innerText = STATE.currentJoke;
        jokeContainer.classList.remove('hidden');
    }
}

function renderQuest() {
    questList.innerHTML = '';
    STATE.chores.forEach(chore => {
        const div = document.createElement('div');
        div.className = `quest-item ${chore.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="checkbox">${chore.completed ? '✓' : ''}</div>
            <span class="quest-text">${chore.text}</span>
        `;
        div.onclick = () => toggleChore(chore.id);
        questList.appendChild(div);
    });
}

function toggleChore(id) {
    const chore = STATE.chores.find(c => c.id === id);
    if (!chore) return;

    chore.completed = !chore.completed;
    renderQuest();

    if (STATE.chores.every(c => c.completed)) {
        finishQuest();
    }
}

// Logic: Timer
function startTimer() {
    stopTimer();
    STATE.timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
}

function stopTimer() {
    if (STATE.timerInterval) clearInterval(STATE.timerInterval);
}

function updateTimerDisplay() {
    const delta = Math.floor((Date.now() - STATE.startTime) / 1000);
    const m = Math.floor(delta / 60).toString().padStart(2, '0');
    const s = (delta % 60).toString().padStart(2, '0');
    questTimer.innerText = `${m}:${s}`;
}

// Logic: Victory
async function finishQuest() {
    stopTimer();

    const delta = Math.floor((Date.now() - STATE.startTime) / 1000);
    const m = Math.floor(delta / 60);
    const s = delta % 60;
    const timeStr = `${m}m ${s}s`;

    const gifUrl = REWARDS[Math.floor(Math.random() * REWARDS.length)];
    document.getElementById('reward-gif').src = gifUrl;
    document.getElementById('final-time').innerText = timeStr;

    // Show joke on victory if not already shown
    const victoryJoke = document.getElementById('victory-joke');
    if (victoryJoke) {
        victoryJoke.innerText = STATE.currentJoke || "Great job today! You are awesome! ☀️";
    }

    // Save history to backend
    await apiFetch('/history', {
        method: 'POST',
        body: JSON.stringify({ date: Date.now(), time: delta })
    });

    startConfetti();

    setTimeout(() => {
        switchScreen('victory');
    }, 500);
}

// Visuals: Confetti
function startConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#4361EE', '#F72585', '#4CC9F0', '#FFD166', '#06D6A0'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            velY: Math.random() * 3 + 2,
            velX: (Math.random() - 0.5) * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = 0;
        particles.forEach(p => {
            p.y += p.velY;
            p.x += p.velX;
            if (p.y < canvas.height) active++;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        if (active > 0) requestAnimationFrame(animate);
        else document.body.removeChild(canvas);
    }
    animate();
}

// Boot
init();
