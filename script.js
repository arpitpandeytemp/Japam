// DOM Elements
const counterElement = document.getElementById('counter');
const mantraDisplay = document.getElementById('mantraDisplay');
const japButton = document.getElementById('japButton');
const resetBtn = document.getElementById('resetBtn');
const soundToggle = document.getElementById('soundToggle');
const todayCountElement = document.getElementById('todayCount');
const weekCountElement = document.getElementById('weekCount');
const totalCountElement = document.getElementById('totalCount');
const malaCountElement = document.getElementById('malaCount');
const todayMalaCountElement = document.getElementById('todayMalaCount');
const weekMalaCountElement = document.getElementById('weekMalaCount');
const installBtn = document.getElementById('installBtn');

// App State
let count = parseInt(localStorage.getItem('japCount')) || 0;
let todayCount = parseInt(localStorage.getItem('todayCount')) || 0;
let weekCount = parseInt(localStorage.getItem('weekCount')) || 0;
let totalCount = parseInt(localStorage.getItem('totalCount')) || 0;
let malaCount = parseInt(localStorage.getItem('malaCount')) || 0;
let todayMalaCount = parseInt(localStorage.getItem('todayMalaCount')) || 0;
let weekMalaCount = parseInt(localStorage.getItem('weekMalaCount')) || 0;
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let lastResetDate = localStorage.getItem('lastResetDate') || getTodayDateString();
let lastResetWeek = localStorage.getItem('lastResetWeek') || getCurrentWeek();

// Audio Context for Sound
let audioContext;
let bellSoundBuffer;

// Initialize
initializeAudio();
checkAndResetCounters();
updateDisplay();
updateStats();
updateSoundButton();

// Event Listeners
japButton.addEventListener('click', incrementCount);
resetBtn.addEventListener('click', resetCount);
soundToggle.addEventListener('click', toggleSound);

// PWA Installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'flex';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

// Functions
function updateSoundButton() {
    const icon = soundToggle.querySelector('i');
    if (soundEnabled) {
        icon.className = 'fas fa-volume-up';
        soundToggle.innerHTML = '<i class="fas fa-volume-up"></i> ध्वनि';
    } else {
        icon.className = 'fas fa-volume-mute';
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i> ध्वनि';
    }
}

async function initializeAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a simple bell sound
        const duration = 1;
        const sampleRate = audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        
        const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // Generate bell sound
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            // Bell-like sound with multiple harmonics
            channelData[i] = 
                0.5 * Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-4 * t) + // C5
                0.3 * Math.sin(2 * Math.PI * 783.99 * t) * Math.exp(-4 * t) + // G5
                0.2 * Math.sin(2 * Math.PI * 1046.5 * t) * Math.exp(-4 * t);  // C6
        }
        
        bellSoundBuffer = buffer;
    } catch (e) {
        console.log("Audio initialization failed:", e);
    }
}

function playBellSound() {
    if (!soundEnabled || !audioContext || !bellSoundBuffer) return;
    
    try {
        // Resume audio context if it's suspended (common on mobile)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = bellSoundBuffer;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.5;
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start();
    } catch (e) {
        console.log("Sound playback failed:", e);
    }
}

function incrementCount() {
    // Check if we need to reset daily/weekly counters
    checkAndResetCounters();
    
    count++;
    todayCount++;
    weekCount++;
    totalCount++;
    
    // Update mantra display with animation
    mantraDisplay.textContent = "राधे राधे";
    mantraDisplay.style.opacity = 0;
    setTimeout(() => {
        mantraDisplay.style.opacity = 1;
    }, 100);
    
    // Check for mala completion (108 counts)
    if (count % 108 === 0) {
        malaCount++;
        todayMalaCount++;
        weekMalaCount++;
        showCompletionMessage();
    }
    
    updateDisplay();
    updateStats();
    saveToStorage();
    
    // Add animation
    counterElement.classList.add('pulse');
    setTimeout(() => {
        counterElement.classList.remove('pulse');
    }, 500);
    
    // Play sound
    playBellSound();
}

function resetCount() {
    count = 0;
    updateDisplay();
    saveToStorage();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    localStorage.setItem('soundEnabled', soundEnabled);
}

function updateDisplay() {
    counterElement.textContent = count;
}

function updateStats() {
    todayCountElement.textContent = todayCount;
    weekCountElement.textContent = weekCount;
    totalCountElement.textContent = totalCount;
    malaCountElement.textContent = malaCount;
    todayMalaCountElement.textContent = todayMalaCount;
    weekMalaCountElement.textContent = weekMalaCount;
}

function saveToStorage() {
    localStorage.setItem('japCount', count);
    localStorage.setItem('todayCount', todayCount);
    localStorage.setItem('weekCount', weekCount);
    localStorage.setItem('totalCount', totalCount);
    localStorage.setItem('malaCount', malaCount);
    localStorage.setItem('todayMalaCount', todayMalaCount);
    localStorage.setItem('weekMalaCount', weekMalaCount);
    localStorage.setItem('lastResetDate', lastResetDate);
    localStorage.setItem('lastResetWeek', lastResetWeek);
}

function checkAndResetCounters() {
    const today = getTodayDateString();
    const currentWeek = getCurrentWeek();
    
    // Reset daily count if it's a new day
    if (today !== lastResetDate) {
        todayCount = 0;
        todayMalaCount = 0;
        lastResetDate = today;
        updateStats();
    }
    
    // Reset weekly count if it's a new week
    if (currentWeek !== lastResetWeek) {
        weekCount = 0;
        weekMalaCount = 0;
        lastResetWeek = currentWeek;
        updateStats();
    }
    
    // Save updated values
    saveToStorage();
}

function getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function getCurrentWeek() {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'completion-message';
    message.textContent = 'ॐ - एक माला पूर्ण हुई! राधे राधे';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (document.body.contains(message)) {
            document.body.removeChild(message);
        }
    }, 3000);
}
