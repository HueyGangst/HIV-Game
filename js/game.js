// --- DADOS ---
let levelsOriginal = [
    { cat: "PREVENÇÃO", word: "PREP", desc: "Profilaxia Pré-Exposição: comprimido diário que impede o HIV de se instalar." },
    { cat: "PROTEÇÃO", word: "CAMISINHA", desc: "Barreira física simples e eficiente contra HIV, sífilis e outras ISTs." },
    { cat: "EXAME", word: "TESTE RAPIDO", desc: "Gratuito no SUS. Com uma gota de sangue, o resultado sai em 30 min." },
    { cat: "CONCEITO", word: "INDETECTAVEL", desc: "Quem trata e tem vírus indetectável NÃO transmite o HIV sexualmente (I=I)." },
    { cat: "MITO", word: "PICADA DE INSETO", desc: "MITO! O HIV é um vírus humano. Mosquitos não transmitem a doença." },
    { cat: "EMERGÊNCIA", word: "PEP", desc: "Profilaxia Pós-Exposição: remédio de urgência tomado até 72h após risco." }
];

let levels = []; 
const symbolsList = ['🦠', '💊', '🩸', '🛡️', '🧬', '🩺', '🔬', '❤️', '⚕️', '🧪', '🩹', '🎗️', '🏥', '🚑', '🧴', '🖊️', '⚖️', '☂️', '🔗', '📌'];

// --- VARIÁVEIS ---
let playerName = "Jogador";
let currentLvl = 0;
let timeLeft = 90;
let maxTime = 90;
let timerInt;
let symbolMap = {}; 
let userMap = {};
let selectedSym = null;
let isGameStarting = false; // Trava para evitar duplo clique

// Estatísticas
let score = 0;
let gameStartTime = 0;
let finalTimeString = "00:00";

// --- CONFETE ---
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let particles = [];

function fireConfetti() {
    for(let i=0; i<100; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 5,
            color: `hsl(${Math.random()*360}, 100%, 50%)`,
            life: 100
        });
    }
    animateConfetti();
}

function animateConfetti() {
    if(particles.length === 0) { ctx.clearRect(0,0,canvas.width,canvas.height); return; }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravidade
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 5, 5);
        if(p.life <= 0) particles.splice(index, 1);
    });
    requestAnimationFrame(animateConfetti);
}

// --- FUNÇÃO DE EMBARALHAR (Fisher-Yates) ---
// Mais robusta que o random sort, evita erros de lógica
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- INÍCIO ---
function validateAndStart() {
    if (isGameStarting) return; // Evita duplo clique

    const input = document.getElementById('input-nickname');
    const name = input.value.trim();
    
    if (name === "") {
        input.classList.add('error');
        input.placeholder = "DIGITE UM NOME!";
        setTimeout(() => input.classList.remove('error'), 1000);
        input.focus();
        return;
    }

    // Trava o botão
    isGameStarting = true;
    
    playerName = name;
    document.getElementById('display-name').innerText = playerName;
    document.querySelectorAll('.player-name-span').forEach(s => s.innerText = playerName);
    
    // Embaralha fases
    levels = shuffleArray([...levelsOriginal]);

    startGame();
}

function startGame() {
    document.getElementById('screen-start').style.display = 'none';
    currentLvl = 0;
    timeLeft = 90; 
    maxTime = 90;
    
    score = 0;
    gameStartTime = Date.now();

    startLevel();
    startTimer();
    
    // Libera a trava depois que o jogo começou
    setTimeout(() => { isGameStarting = false; }, 500);
}

function startTimer() {
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) gameOver();
    }, 1000);
}

function updateTimerUI() {
    const bar = document.getElementById('timer-bar');
    const txt = document.getElementById('timer-text');
    const pct = Math.max(0, (timeLeft / maxTime) * 100);
    bar.style.width = pct + "%";
    txt.innerText = timeLeft;
    bar.style.backgroundColor = pct < 30 ? "#d90429" : "#e94560";
}

function startLevel() {
    if (currentLvl >= levels.length) {
        gameWin();
        return;
    }

    const data = levels[currentLvl];
    document.getElementById('category-badge').innerText = data.cat;
    
    // Limpa estados antigos
    userMap = {};
    selectedSym = null;
    symbolMap = {};
    
    createCipher(data.word);
    
    renderReference();
    renderPuzzle();
    renderKeyboard();
}

function createCipher(word) {
    symbolMap = {};
    const unique = [...new Set(word.replace(/ /g, ''))];
    
    // Embaralha uma cópia limpa da lista de símbolos
    const shuffledSyms = shuffleArray([...symbolsList]);
    
    unique.forEach((char, i) => {
        symbolMap[char] = shuffledSyms[i];
    });
}

// --- RENDER ---
function renderReference() {
    const container = document.getElementById('ref-grid');
    container.innerHTML = '';
    const chars = Object.keys(symbolMap).sort();
    chars.forEach(char => {
        const item = document.createElement('div');
        item.className = 'ref-item';
        item.innerHTML = `<div class="ref-symbol">${symbolMap[char]}</div><div class="ref-letter">${char}</div>`;
        container.appendChild(item);
    });
}

function renderPuzzle() {
    const board = document.getElementById('puzzle-board');
    board.innerHTML = '';
    const word = levels[currentLvl].word;
    const parts = word.split(' ');

    parts.forEach(part => {
        const row = document.createElement('div');
        row.className = 'word-row';
        for (let char of part) {
            const sym = symbolMap[char];
            const tile = document.createElement('div');
            tile.className = 'tile';
            if (selectedSym === sym) tile.classList.add('selected');
            tile.onclick = () => selectSym(sym);
            tile.innerHTML = `<div class="tile-symbol">${sym}</div><div class="tile-input">${userMap[sym] || ""}</div>`;
            row.appendChild(tile);
        }
        board.appendChild(row);
    });
}

function renderKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = '';
    const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZÇ".split('');
    keys.forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.innerText = k;
        // Previne comportamento padrão de touch para evitar zoom/scroll
        btn.ontouchstart = (e) => { e.preventDefault(); inputKey(k); };
        btn.onclick = () => inputKey(k);
        kb.appendChild(btn);
    });
    const back = document.createElement('button');
    back.className = 'key action';
    back.innerText = '⌫';
    back.ontouchstart = (e) => { e.preventDefault(); inputKey(''); };
    back.onclick = () => inputKey('');
    kb.appendChild(back);
}

// --- INPUT ---
function selectSym(sym) {
    selectedSym = sym;
    renderPuzzle();
}

function inputKey(char) {
    if (!selectedSym) return;
    userMap[selectedSym] = char;
    renderPuzzle();
    checkWin();
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (document.getElementById('screen-start').style.display !== 'none') return;
    if (!selectedSym) return;
    const k = e.key.toUpperCase();
    if ("ABCDEFGHIJKLMNOPQRSTUVWXYZÇ".includes(k) && k.length === 1) inputKey(k);
    if (e.key === 'Backspace') inputKey('');
});

// Listener para o Enter no Input (com proteção contra clique duplo)
document.getElementById('input-nickname').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') validateAndStart();
});

// --- LÓGICA E PONTUAÇÃO ---
function checkWin() {
    const target = levels[currentLvl].word.replace(/ /g, '');
    let isCorrect = true;
    
    for (let char of target) {
        // Verifica se o input do usuário para aquele símbolo bate com a letra esperada
        if (userMap[symbolMap[char]] !== char) isCorrect = false;
    }

    if (isCorrect) {
        score += 100 + (timeLeft * 10);
        fireConfetti(); 
        clearInterval(timerInt);
        setTimeout(showFeedback, 500);
    }
}

function showFeedback() {
    const data = levels[currentLvl];
    document.getElementById('fb-word').innerText = data.word;
    document.getElementById('fb-desc').innerText = data.desc;
    document.getElementById('screen-feedback').style.display = 'flex';
}

function nextLevel() {
    document.getElementById('screen-feedback').style.display = 'none';
    timeLeft = Math.min(timeLeft + 20, maxTime);
    currentLvl++;
    startLevel();
    startTimer();
}

function gameOver() {
    clearInterval(timerInt);
    const data = levels[currentLvl];
    document.getElementById('go-word').innerText = data.word;
    document.getElementById('go-desc').innerText = data.desc;
    document.getElementById('screen-gameover').style.display = 'flex';
}

function gameWin() {
    clearInterval(timerInt);
    
    let endTime = Date.now();
    let totalSeconds = Math.floor((endTime - gameStartTime) / 1000);
    
    let m = Math.floor(totalSeconds / 60);
    let s = totalSeconds % 60;
    finalTimeString = `${m}:${s < 10 ? '0' : ''}${s}`;

    document.getElementById('final-score').innerText = score;
    document.getElementById('final-time').innerText = finalTimeString;

    fireConfetti(); 
    setTimeout(fireConfetti, 500); 
    document.getElementById('screen-win').style.display = 'flex';
}

function shareResult() {
    const text = `🎗️ *DESAFIO DEZEMBRO VERMELHO*\n\nEu, Agente *${playerName}*, completei a missão de prevenção!\n\n🏆 *Pontuação Final:* ${score}\n⏱️ *Tempo Total:* ${finalTimeString}\n\nVocê consegue me superar? Jogue agora e aprenda sobre prevenção! #DezembroVermelho`;
    const url = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${url}`, '_blank');
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});