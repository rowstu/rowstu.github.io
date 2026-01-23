/**
 * MathFlow - Mental Arithmetic Trainer
 * A comprehensive math practice game with multiple modes
 */

// ============================================
// State Management
// ============================================

const state = {
    // User preferences
    trackProgress: true,
    soundEnabled: true,

    // Current game
    mode: null, // 'practice', 'speed', 'endless', 'daily'
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: 3,
    startTime: null,
    questionStartTime: null,
    answers: [], // { question, userAnswer, correct, time, attempts }

    // Practice settings
    operations: ['add', 'subtract', 'multiply', 'divide'],
    difficulty: 'medium',
    questionCount: 10,
    timerMode: 'off',
    timerDuration: 0,
    timerInterval: null,
    timeRemaining: 0,

    // Current question
    currentQuestion: null,
    attempts: 0,

    // Stats
    stats: {
        totalAnswered: 0,
        totalCorrect: 0,
        bestStreak: 0,
        speedBest: null,
        endlessBest: 0,
        dailyScores: {}
    }
};

// ============================================
// Difficulty Ranges
// ============================================

const difficultyRanges = {
    easy: {
        add: { min: 1, max: 20 },
        subtract: { min: 1, max: 20 },
        multiply: { min: 2, max: 10 },
        divide: { min: 2, max: 10 },
        hint: 'Numbers up to 10 × 10'
    },
    medium: {
        add: { min: 10, max: 100 },
        subtract: { min: 10, max: 100 },
        multiply: { min: 2, max: 12 },
        divide: { min: 2, max: 12 },
        hint: 'Numbers up to 12 × 12'
    },
    hard: {
        add: { min: 50, max: 500 },
        subtract: { min: 50, max: 500 },
        multiply: { min: 10, max: 50 },
        divide: { min: 5, max: 20 },
        hint: 'Numbers up to 50 × 50'
    },
    expert: {
        add: { min: 100, max: 1000 },
        subtract: { min: 100, max: 1000 },
        multiply: { min: 20, max: 100 },
        divide: { min: 10, max: 50 },
        hint: 'Numbers up to 100 × 100'
    }
};

const timerDurations = {
    off: 0,
    relaxed: 30,
    standard: 15,
    speed: 10
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    updateStatsDisplay();
    setupEventListeners();
    setupToggleGroups();
    setupTutorialTabs();
});

function setupEventListeners() {
    // Stats toggle
    document.getElementById('statsToggle').addEventListener('click', toggleStatsTracking);

    // Sound toggle
    document.getElementById('soundToggle').addEventListener('click', toggleSound);

    // Answer input
    const answerInput = document.getElementById('answerInput');
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitAnswer();
        }
    });

    // Global keyboard handler for game navigation
    document.addEventListener('keydown', (e) => {
        // Only handle when game screen is active
        if (!document.getElementById('gameScreen').classList.contains('active')) return;

        const feedbackArea = document.getElementById('feedbackArea');
        const isFeedbackVisible = !feedbackArea.classList.contains('hidden');

        if (e.key === 'Enter' && isFeedbackVisible) {
            e.preventDefault();
            // Check if retry button is visible (wrong answer with retries left)
            const retryBtn = document.getElementById('retryBtn');
            const isRetryVisible = !retryBtn.classList.contains('hidden');

            // If correct answer or no retries left, go to next question
            // User can press 'r' to retry if they want
            nextQuestion();
        }

        // Allow 'r' key to retry
        if (e.key === 'r' && isFeedbackVisible) {
            const retryBtn = document.getElementById('retryBtn');
            if (!retryBtn.classList.contains('hidden')) {
                e.preventDefault();
                retryQuestion();
            }
        }
    });

    // Handle custom question count
    document.querySelector('[data-count="custom"]').addEventListener('click', () => {
        document.getElementById('customCount').classList.remove('hidden');
    });
}

function setupToggleGroups() {
    // Operations toggle (multi-select)
    document.querySelectorAll('.operations-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            updateOperations();
        });
    });

    // Difficulty toggle (single-select)
    document.querySelectorAll('.difficulty-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.difficulty = btn.dataset.diff;
            document.getElementById('difficultyHint').textContent = difficultyRanges[state.difficulty].hint;
        });
    });

    // Question count toggle (single-select)
    document.querySelectorAll('.question-count-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.question-count-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.dataset.count === 'custom') {
                document.getElementById('customCount').classList.remove('hidden');
            } else {
                document.getElementById('customCount').classList.add('hidden');
                state.questionCount = parseInt(btn.dataset.count);
            }
        });
    });

    // Timer toggle (single-select)
    document.querySelectorAll('.timer-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timer-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.timerMode = btn.dataset.timer;
            state.timerDuration = timerDurations[state.timerMode];
        });
    });
}

function setupTutorialTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tutorial-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
        });
    });
}

function updateOperations() {
    state.operations = [];
    document.querySelectorAll('.operations-toggle .toggle-btn.active').forEach(btn => {
        state.operations.push(btn.dataset.op);
    });

    // Ensure at least one operation is selected
    if (state.operations.length === 0) {
        const addBtn = document.querySelector('[data-op="add"]');
        addBtn.classList.add('active');
        state.operations = ['add'];
    }
}

// ============================================
// Screen Navigation
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId + 'Screen').classList.add('active');

    // Reset answer input when showing game screen
    if (screenId === 'game') {
        setTimeout(() => document.getElementById('answerInput').focus(), 100);
    }
}

// ============================================
// Game Modes
// ============================================

function startPractice() {
    showScreen('practiceSetup');
}

function beginPractice() {
    // Get custom count if selected
    const customBtn = document.querySelector('[data-count="custom"]');
    if (customBtn.classList.contains('active')) {
        state.questionCount = parseInt(document.getElementById('customCount').value) || 10;
    }

    state.mode = 'practice';
    initGame();
}

function startSpeedChallenge() {
    state.mode = 'speed';
    state.operations = ['add', 'subtract', 'multiply', 'divide'];
    state.difficulty = 'medium';
    state.questionCount = 20;
    state.timerMode = 'off'; // We track total time, not per-question
    initGame();
}

function startEndless() {
    state.mode = 'endless';
    state.operations = ['add', 'subtract', 'multiply', 'divide'];
    state.difficulty = 'medium';
    state.questionCount = 999; // Effectively infinite
    state.timerMode = 'off';
    state.lives = 3;
    initGame();
}

function startDaily() {
    state.mode = 'daily';
    state.operations = ['add', 'subtract', 'multiply', 'divide'];
    state.difficulty = 'medium';
    state.questionCount = 15;
    state.timerMode = 'standard';
    state.timerDuration = 15;

    // Check if already completed today
    const today = new Date().toISOString().split('T')[0];
    if (state.stats.dailyScores[today]) {
        if (!confirm(`You've already completed today's challenge (Score: ${state.stats.dailyScores[today]}). Play again?`)) {
            return;
        }
    }

    initGame();
}

function initGame() {
    // Reset game state
    state.currentIndex = 0;
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.answers = [];
    state.startTime = Date.now();
    state.lives = 3;

    // Generate questions
    state.questions = generateQuestions();

    // Update UI
    updateGameUI();
    showScreen('game');

    // Show/hide mode-specific elements
    document.getElementById('livesDisplay').classList.toggle('hidden', state.mode !== 'endless');
    document.getElementById('modeBadge').textContent = getModeLabel();

    // Start first question
    showQuestion();
}

function getModeLabel() {
    const labels = {
        practice: 'Practice',
        speed: 'Speed',
        endless: 'Endless',
        daily: 'Daily'
    };
    return labels[state.mode] || 'Practice';
}

// ============================================
// Question Generation
// ============================================

function generateQuestions() {
    const questions = [];
    const seed = state.mode === 'daily' ? getDailySeed() : null;

    for (let i = 0; i < state.questionCount; i++) {
        const op = state.operations[seed ?
            seededRandom(seed + i * 4) * state.operations.length | 0 :
            Math.floor(Math.random() * state.operations.length)];

        questions.push(generateQuestion(op, seed ? seed + i : null));
    }

    return questions;
}

function getDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateQuestion(operation, seed = null) {
    const range = difficultyRanges[state.difficulty][operation];
    let a, b, answer, symbol;

    const rand = (min, max) => {
        if (seed !== null) {
            return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    switch (operation) {
        case 'add':
            a = rand(range.min, range.max);
            b = rand(range.min, range.max);
            answer = a + b;
            symbol = '+';
            break;

        case 'subtract':
            a = rand(range.min, range.max);
            b = rand(range.min, a); // Ensure no negative results
            answer = a - b;
            symbol = '−';
            break;

        case 'multiply':
            a = rand(range.min, range.max);
            b = rand(range.min, range.max);
            answer = a * b;
            symbol = '×';
            break;

        case 'divide':
            // Generate division with clean integer answers
            b = rand(range.min, range.max);
            answer = rand(range.min, range.max);
            a = b * answer;
            symbol = '÷';
            break;
    }

    return {
        a,
        b,
        answer,
        symbol,
        operation,
        text: `${a} ${symbol} ${b}`
    };
}

// ============================================
// Game Flow
// ============================================

function showQuestion() {
    state.currentQuestion = state.questions[state.currentIndex];
    state.attempts = 0;
    state.questionStartTime = Date.now();

    // Update UI
    document.getElementById('questionText').textContent = state.currentQuestion.text;
    document.getElementById('answerInput').value = '';
    document.getElementById('feedbackArea').classList.add('hidden');

    // Update progress
    updateGameUI();

    // Start timer if enabled
    if (state.timerDuration > 0) {
        startTimer();
    }

    // Focus input
    document.getElementById('answerInput').focus();
}

function updateGameUI() {
    const total = state.mode === 'endless' ? '∞' : state.questionCount;
    document.getElementById('progressText').textContent = `${state.currentIndex + 1} / ${total}`;
    document.getElementById('streakDisplay').textContent = `🔥 ${state.streak}`;
    document.getElementById('scoreDisplay').textContent = `Score: ${state.score}`;

    // Update lives display for endless mode
    if (state.mode === 'endless') {
        const livesDisplay = document.getElementById('livesDisplay');
        const hearts = livesDisplay.querySelectorAll('.life');
        hearts.forEach((heart, i) => {
            heart.classList.toggle('lost', i >= state.lives);
        });
    }
}

// ============================================
// Timer
// ============================================

function startTimer() {
    const timerBar = document.getElementById('timerBar');
    const timerFill = document.getElementById('timerFill');

    timerBar.classList.add('active');
    state.timeRemaining = state.timerDuration;

    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        state.timeRemaining -= 0.1;
        const percent = (state.timeRemaining / state.timerDuration) * 100;
        timerFill.style.width = percent + '%';

        // Update timer color based on remaining time
        timerFill.classList.remove('warning', 'danger');
        if (percent < 30) {
            timerFill.classList.add('danger');
        } else if (percent < 50) {
            timerFill.classList.add('warning');
        }

        if (state.timeRemaining <= 0) {
            clearInterval(state.timerInterval);
            handleTimeout();
        }
    }, 100);
}

function stopTimer() {
    clearInterval(state.timerInterval);
    document.getElementById('timerBar').classList.remove('active');
}

function handleTimeout() {
    // Treat timeout as wrong answer
    state.attempts++;
    showFeedback(false, true);
}

// ============================================
// Answer Handling
// ============================================

function submitAnswer() {
    const input = document.getElementById('answerInput');
    const userAnswer = parseInt(input.value);

    if (isNaN(userAnswer)) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        return;
    }

    stopTimer();
    state.attempts++;

    const isCorrect = userAnswer === state.currentQuestion.answer;
    showFeedback(isCorrect, false, userAnswer);
}

function showFeedback(isCorrect, wasTimeout = false, userAnswer = null) {
    const feedbackArea = document.getElementById('feedbackArea');
    const feedbackCard = document.getElementById('feedbackCard');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const feedbackExplanation = document.getElementById('feedbackExplanation');
    const retryBtn = document.getElementById('retryBtn');
    const nextBtn = document.getElementById('nextBtn');

    feedbackArea.classList.remove('hidden');
    feedbackCard.classList.remove('correct', 'incorrect');

    if (isCorrect) {
        feedbackCard.classList.add('correct');
        feedbackIcon.textContent = '✓';
        feedbackMessage.textContent = getCorrectMessage();
        feedbackExplanation.classList.add('hidden');
        retryBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');

        // Update score (bonus for first attempt)
        const basePoints = 10;
        const attemptBonus = state.attempts === 1 ? 5 : 0;
        const streakBonus = Math.min(state.streak, 10);
        state.score += basePoints + attemptBonus + streakBonus;

        // Update streak
        state.streak++;
        state.bestStreak = Math.max(state.bestStreak, state.streak);

        // Record answer
        const timeSpent = (Date.now() - state.questionStartTime) / 1000;
        state.answers.push({
            question: state.currentQuestion.text,
            answer: state.currentQuestion.answer,
            userAnswer,
            correct: true,
            time: timeSpent,
            attempts: state.attempts
        });

        playSound('correct');

    } else {
        feedbackCard.classList.add('incorrect');
        feedbackIcon.textContent = '✗';

        if (wasTimeout) {
            feedbackMessage.textContent = 'Time\'s up!';
        } else {
            feedbackMessage.textContent = getIncorrectMessage();
        }

        // Show explanation
        feedbackExplanation.classList.remove('hidden');
        feedbackExplanation.innerHTML = generateExplanation(userAnswer);

        // Decide whether to allow retry or move on
        const canRetry = state.mode !== 'endless' && state.attempts < 3;

        if (canRetry) {
            retryBtn.classList.remove('hidden');
            nextBtn.textContent = 'Skip →';
        } else {
            retryBtn.classList.add('hidden');
            nextBtn.textContent = 'Next →';
        }
        nextBtn.classList.remove('hidden');

        // Handle endless mode lives
        if (state.mode === 'endless') {
            state.lives--;
            updateGameUI();

            if (state.lives <= 0) {
                retryBtn.classList.add('hidden');
                nextBtn.textContent = 'See Results';
            }
        }

        // Reset streak
        state.streak = 0;

        playSound('incorrect');
    }

    updateGameUI();
}

function getCorrectMessage() {
    const messages = [
        'Correct!',
        'Nice!',
        'Well done!',
        'Perfect!',
        'Excellent!',
        'Great job!',
        'You got it!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function getIncorrectMessage() {
    const messages = [
        'Not quite!',
        'Oops!',
        'Try again!',
        'Almost!',
        'Keep trying!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function generateExplanation(userAnswer) {
    const q = state.currentQuestion;
    let explanation = '';

    if (userAnswer !== null) {
        explanation += `<p>You answered <code>${userAnswer}</code>, but the correct answer is <code>${q.answer}</code>.</p>`;
    } else {
        explanation += `<p>The correct answer is <code>${q.answer}</code>.</p>`;
    }

    // Add operation-specific explanation
    switch (q.operation) {
        case 'add':
            explanation += `<p><strong>Tip:</strong> Try adding left-to-right: `;
            if (q.a >= 10 && q.b >= 10) {
                const aTens = Math.floor(q.a / 10) * 10;
                const aOnes = q.a % 10;
                const bTens = Math.floor(q.b / 10) * 10;
                const bOnes = q.b % 10;
                explanation += `${aTens} + ${bTens} = ${aTens + bTens}, then add ${aOnes} + ${bOnes} = ${aOnes + bOnes}, total = <code>${q.answer}</code>`;
            } else {
                explanation += `${q.a} + ${q.b} = <code>${q.answer}</code>`;
            }
            explanation += `</p>`;
            break;

        case 'subtract':
            explanation += `<p><strong>Tip:</strong> `;
            if (q.b % 10 !== 0) {
                const roundedB = Math.ceil(q.b / 10) * 10;
                const diff = roundedB - q.b;
                explanation += `Round ${q.b} up to ${roundedB}: ${q.a} − ${roundedB} = ${q.a - roundedB}, then add back ${diff} = <code>${q.answer}</code>`;
            } else {
                explanation += `${q.a} − ${q.b} = <code>${q.answer}</code>`;
            }
            explanation += `</p>`;
            break;

        case 'multiply':
            explanation += `<p><strong>Tip:</strong> `;
            if (q.b === 9) {
                explanation += `For ×9: ${q.a} × 10 = ${q.a * 10}, minus ${q.a} = <code>${q.answer}</code>`;
            } else if (q.b === 5) {
                explanation += `For ×5: ${q.a} × 10 = ${q.a * 10}, halved = <code>${q.answer}</code>`;
            } else if (q.b === 11 && q.a < 10) {
                explanation += `For ×11 (single digit): double the digit and put between = ${q.a}${q.a} = <code>${q.answer}</code>`;
            } else {
                explanation += `Break it down: ${q.a} × ${Math.floor(q.b / 10) * 10 || q.b} = ${q.a * (Math.floor(q.b / 10) * 10 || q.b)}`;
                if (q.b >= 10 && q.b % 10 !== 0) {
                    explanation += `, plus ${q.a} × ${q.b % 10} = ${q.a * (q.b % 10)}`;
                }
                explanation += ` = <code>${q.answer}</code>`;
            }
            explanation += `</p>`;
            break;

        case 'divide':
            explanation += `<p><strong>Tip:</strong> `;
            if (q.b === 5) {
                explanation += `For ÷5: double ${q.a} = ${q.a * 2}, then ÷10 = <code>${q.answer}</code>`;
            } else if (q.b % 2 === 0) {
                explanation += `Halve step by step: ${q.a} ÷ 2 = ${q.a / 2}`;
                if (q.b === 4) {
                    explanation += `, ÷ 2 = <code>${q.answer}</code>`;
                } else {
                    explanation += `, then ÷ ${q.b / 2} = <code>${q.answer}</code>`;
                }
            } else {
                explanation += `${q.b} × ${q.answer} = ${q.a}, so ${q.a} ÷ ${q.b} = <code>${q.answer}</code>`;
            }
            explanation += `</p>`;
            break;
    }

    return explanation;
}

function retryQuestion() {
    document.getElementById('feedbackArea').classList.add('hidden');
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').focus();

    // Restart timer if enabled
    if (state.timerDuration > 0) {
        startTimer();
    }
}

function nextQuestion() {
    // Record wrong answer if we're moving on without getting it right
    const feedbackCard = document.getElementById('feedbackCard');
    if (feedbackCard.classList.contains('incorrect')) {
        const timeSpent = (Date.now() - state.questionStartTime) / 1000;
        state.answers.push({
            question: state.currentQuestion.text,
            answer: state.currentQuestion.answer,
            userAnswer: null,
            correct: false,
            time: timeSpent,
            attempts: state.attempts
        });
    }

    state.currentIndex++;

    // Check for game over conditions
    if (state.mode === 'endless' && state.lives <= 0) {
        endGame();
        return;
    }

    if (state.currentIndex >= state.questions.length) {
        endGame();
        return;
    }

    showQuestion();
}

// ============================================
// Game End
// ============================================

function endGame() {
    stopTimer();

    const totalTime = (Date.now() - state.startTime) / 1000;
    const correctCount = state.answers.filter(a => a.correct).length;
    const wrongCount = state.answers.filter(a => !a.correct).length;
    const avgTime = state.answers.length > 0 ?
        (state.answers.reduce((sum, a) => sum + a.time, 0) / state.answers.length).toFixed(1) : 0;

    // Update stats if tracking enabled
    if (state.trackProgress) {
        state.stats.totalAnswered += state.answers.length;
        state.stats.totalCorrect += correctCount;
        state.stats.bestStreak = Math.max(state.stats.bestStreak, state.bestStreak);

        if (state.mode === 'speed') {
            if (!state.stats.speedBest || totalTime < state.stats.speedBest) {
                state.stats.speedBest = totalTime;
            }
        }

        if (state.mode === 'endless') {
            state.stats.endlessBest = Math.max(state.stats.endlessBest, correctCount);
        }

        if (state.mode === 'daily') {
            const today = new Date().toISOString().split('T')[0];
            state.stats.dailyScores[today] = state.score;
        }

        saveStats();
        updateStatsDisplay();
    }

    // Update results screen
    document.getElementById('resultsTitle').textContent = getResultsTitle(correctCount);
    document.getElementById('resultsSubtitle').textContent = getResultsSubtitle(correctCount);
    document.getElementById('finalScore').textContent = state.score;
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('wrongCount').textContent = wrongCount;
    document.getElementById('avgTime').textContent = avgTime + 's';
    document.getElementById('finalStreak').textContent = state.bestStreak;

    // Animate score ring
    const percentage = state.answers.length > 0 ? (correctCount / state.answers.length) : 0;
    const scoreRing = document.getElementById('scoreRing');
    const circumference = 339.292; // 2 * PI * 54
    scoreRing.style.strokeDashoffset = circumference * (1 - percentage);

    // Add gradient to SVG
    const svg = scoreRing.closest('svg');
    if (!svg.querySelector('defs')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ff6b4a"/>
                <stop offset="100%" style="stop-color:#ffa64d"/>
            </linearGradient>
        `;
        svg.insertBefore(defs, svg.firstChild);
    }
    scoreRing.style.stroke = 'url(#scoreGradient)';

    // Build breakdown list
    const breakdownList = document.getElementById('breakdownList');
    breakdownList.innerHTML = state.answers.map((a, i) => `
        <div class="breakdown-item ${a.correct ? 'correct' : 'incorrect'}">
            <span class="question">${i + 1}. ${a.question}</span>
            <span class="answer">${a.userAnswer !== null ? a.userAnswer : '—'}</span>
            ${!a.correct ? `<span class="correct-answer">= ${a.answer}</span>` : ''}
        </div>
    `).join('');

    showScreen('results');
}

function getResultsTitle(correctCount) {
    const total = state.answers.length;
    const percentage = total > 0 ? (correctCount / total) * 100 : 0;

    if (state.mode === 'speed') {
        return 'Speed Challenge Complete!';
    }
    if (state.mode === 'endless') {
        return `Survived ${correctCount} Questions!`;
    }
    if (state.mode === 'daily') {
        return 'Daily Challenge Complete!';
    }

    if (percentage === 100) return 'Perfect Score!';
    if (percentage >= 90) return 'Excellent Work!';
    if (percentage >= 70) return 'Great Job!';
    if (percentage >= 50) return 'Good Effort!';
    return 'Keep Practicing!';
}

function getResultsSubtitle(correctCount) {
    const total = state.answers.length;
    const percentage = total > 0 ? (correctCount / total) * 100 : 0;

    if (state.mode === 'speed') {
        const totalTime = ((Date.now() - state.startTime) / 1000).toFixed(1);
        return `Completed in ${totalTime} seconds`;
    }
    if (state.mode === 'endless') {
        return `Best streak: ${state.bestStreak}`;
    }

    if (percentage === 100) return 'Flawless performance!';
    if (percentage >= 90) return 'Almost perfect!';
    if (percentage >= 70) return 'You\'re getting there!';
    if (percentage >= 50) return 'Room for improvement';
    return 'Practice makes perfect!';
}

function playAgain() {
    if (state.mode === 'practice') {
        beginPractice();
    } else if (state.mode === 'speed') {
        startSpeedChallenge();
    } else if (state.mode === 'endless') {
        startEndless();
    } else if (state.mode === 'daily') {
        startDaily();
    }
}

function confirmQuit() {
    if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
        stopTimer();
        showScreen('menu');
    }
}

// ============================================
// Stats & Persistence
// ============================================

function loadStats() {
    try {
        const saved = localStorage.getItem('mathflow_stats');
        if (saved) {
            state.stats = { ...state.stats, ...JSON.parse(saved) };
        }

        const prefs = localStorage.getItem('mathflow_prefs');
        if (prefs) {
            const p = JSON.parse(prefs);
            state.trackProgress = p.trackProgress ?? true;
            state.soundEnabled = p.soundEnabled ?? true;
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }

    // Update UI based on loaded preferences
    document.getElementById('statsToggle').classList.toggle('active', state.trackProgress);
    document.getElementById('soundToggle').classList.toggle('active', state.soundEnabled);
    document.getElementById('statsPanel').classList.toggle('visible', state.trackProgress);
}

function saveStats() {
    try {
        localStorage.setItem('mathflow_stats', JSON.stringify(state.stats));
        localStorage.setItem('mathflow_prefs', JSON.stringify({
            trackProgress: state.trackProgress,
            soundEnabled: state.soundEnabled
        }));
    } catch (e) {
        console.error('Failed to save stats:', e);
    }
}

function updateStatsDisplay() {
    document.getElementById('totalAnswered').textContent = state.stats.totalAnswered;
    document.getElementById('totalCorrect').textContent = state.stats.totalCorrect;

    const accuracy = state.stats.totalAnswered > 0 ?
        Math.round((state.stats.totalCorrect / state.stats.totalAnswered) * 100) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
    document.getElementById('bestStreak').textContent = state.stats.bestStreak;
}

function toggleStatsTracking() {
    state.trackProgress = !state.trackProgress;
    document.getElementById('statsToggle').classList.toggle('active', state.trackProgress);
    document.getElementById('statsPanel').classList.toggle('visible', state.trackProgress);
    saveStats();
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    document.getElementById('soundToggle').classList.toggle('active', state.soundEnabled);
    saveStats();
}

function resetStats() {
    if (confirm('Are you sure you want to reset all your statistics?')) {
        state.stats = {
            totalAnswered: 0,
            totalCorrect: 0,
            bestStreak: 0,
            speedBest: null,
            endlessBest: 0,
            dailyScores: {}
        };
        saveStats();
        updateStatsDisplay();
    }
}

// ============================================
// Sound Effects (Web Audio API)
// ============================================

let audioContext = null;

function playSound(type) {
    if (!state.soundEnabled) return;

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'correct') {
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialDecayToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'incorrect') {
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialDecayToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    } catch (e) {
        // Audio not supported
    }
}

// Polyfill for exponentialDecayToValueAtTime
if (typeof GainNode !== 'undefined' && GainNode.prototype && !GainNode.prototype.gain?.exponentialDecayToValueAtTime) {
    AudioParam.prototype.exponentialDecayToValueAtTime = function (value, endTime) {
        this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
    };
}

// ============================================
// CSS Animation Helper
// ============================================

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    .shake {
        animation: shake 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);
