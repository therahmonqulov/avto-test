const SHEET_ID = '1PDYXWqQlHFQjsDTUdSPS5qYy55OSOh3iWQ5yFVM4P0k'; // googel sheets id URL dagi 
const SHEET_NAME = 'Sheet1';

let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval;
let timeLeft = 60 * 60; // 60 daqiqa (sekundlarda)

// Google Sheets dan ma'lumotlarni olish
async function fetchQuestions() {
    try {
        const response = await fetch(
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`
        );
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;

        questions = rows.slice(1).map(row => {
            const cells = row.c;
            return {
                text: cells[1]?.v || '', // B - savol matni
                options: [
                    cells[2]?.v || '', // C - A varianti
                    cells[3]?.v || '', // D - B varianti
                    cells[4]?.v || '', // E - C varianti
                    cells[5]?.v || '' // F - D varianti
                ],
                correct: cells[6]?.v || '', // G - to'g'ri javob (A,B,C,D)
                imageName: cells[7]?.v || '', // H - rasm nomi (agar ishlatilsa)
                imageUrl: cells[8]?.v || '',
            };
        });

        questions.forEach(q => {
            if (q.imageUrl && !q.imageUrl.includes('http')) {
                q.imageUrl = '';
            }
        });

        userAnswers = new Array(questions.length).fill(null);

        generateQuestionButtons();
        startTimer();
        renderQuestion();
    } catch (error) {
        console.error('Ma\'lumotlarni olishda xato:', error);
    }
}

// Savol raqamlari tugmalarini yaratish
function generateQuestionButtons() {
    const qBox = document.querySelector('.q_button_box');
    qBox.innerHTML = '';

    questions.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.textContent = i + 1;
        btn.dataset.index = i;

        btn.addEventListener('click', () => {
            currentQuestionIndex = i;
            renderQuestion();
            updateActiveQuestionButton();
        });

        qBox.appendChild(btn);
    });

    updateActiveQuestionButton();
}

// Active border yangilash funksiyasi
function updateActiveQuestionButton() {
    const buttons = document.querySelectorAll('.q_button_box button');
    buttons.forEach(b => b.style.border = '');
    const activeBtn = buttons[currentQuestionIndex];
    if (activeBtn) activeBtn.style.border = '1px solid #737272ff';
}

// Taymer
function startTimer() {
    const timeSpan = document.querySelector('.header_time span:nth-child(2)');

    timerInterval = setInterval(() => {
        timeLeft--;
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        timeSpan.textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishTest();
        }
    }, 1000);
}

// Joriy savolni ko'rsatish
function renderQuestion() {
    const q = questions[currentQuestionIndex];

    document.querySelector('.question-text').innerHTML = q.text || 'Savol matni mavjud emas';

    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = q.imageUrl
        ? `<img src="${q.imageUrl}" alt="Savol rasmi">`
        : '';

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    const labels = ['A', 'B', 'C', 'D'];

    q.options.forEach((text, idx) => {
        if (!text.trim()) return;

        const div = document.createElement('div');
        div.className = 'option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.id = labels[idx];
        input.value = labels[idx];
        input.checked = userAnswers[currentQuestionIndex] === labels[idx];

        if (userAnswers[currentQuestionIndex] !== null) {
            input.disabled = true;
        }

        const span = document.createElement('span');
        span.textContent = `${labels[idx]}. ${text}`;

        const label = document.createElement('label');
        label.htmlFor = labels[idx];
        label.appendChild(span);

        div.append(input, label);
        optionsDiv.appendChild(div);

        if (userAnswers[currentQuestionIndex] === null) {
            div.addEventListener('click', () => {
                input.checked = true;
                input.dispatchEvent(new Event('change'));
            });
        }
    });

    document.querySelectorAll('.option').forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        if (!radio) return;

        const value = radio.value;
        const isSelected = radio.checked;
        const isCorrect = value === q.correct;

        opt.style.backgroundColor = '';
        opt.style.borderLeft = '';

        if (isSelected) {
            if (isCorrect) {
                opt.style.backgroundColor = '#00ff3cb1';
                opt.style.borderLeft = '5px solid #28a745';
            } else {
                opt.style.backgroundColor = '#fd2739e2';
                opt.style.borderLeft = '5px solid #c50014ff';
            }
        } else if (userAnswers[currentQuestionIndex] && isCorrect) {
            opt.style.backgroundColor = '#00ff3cbc';
            opt.style.borderLeft = '5px solid #28a745';
        }
    });

    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.addEventListener('change', e => {
            if (userAnswers[currentQuestionIndex] === null) {
                userAnswers[currentQuestionIndex] = e.target.value;
                updateQuestionButtonStatus(currentQuestionIndex);
                renderQuestion();
            }
        });
    });

    const prevBtn = document.querySelector('.footer_button button:first-child');
    const nextBtn = document.querySelector('.footer_button button:last-child');

    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? 'Yakunlash' : 'Keyingi';

    updateQuestionButtonStatus(currentQuestionIndex);
    updateActiveQuestionButton();
}

// Tanlangan savol tugmasini belgilash
function updateQuestionButtonStatus(index) {
    const buttons = document.querySelectorAll('.q_button_box button');
    const btn = buttons[index];

    if (userAnswers[index] === null) {
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.color = '';
    } else {
        const q = questions[index];
        const isCorrect = userAnswers[index] === q.correct;

        if (isCorrect) {
            btn.style.backgroundColor = '#28a745';
            btn.style.borderColor = '#28a745';
            btn.style.color = '#fff';
        } else {
            btn.style.backgroundColor = '#dc3545';
            btn.style.borderColor = '#dc3545';
            btn.style.color = '#fff';
        }
    }
}

// Oldingi / Keyingi
document.querySelector('.footer_button button:first-child').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
        updateActiveQuestionButton();
    }
});

document.querySelector('.footer_button button:last-child').addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
        updateActiveQuestionButton();
    } else {
        checkUnansweredAndFinish();
    }
});

// Headerdagi "Yakunlash"
document.querySelector('.header_button button:last-child').addEventListener('click', checkUnansweredAndFinish);

// Fullscreen
document.querySelector('.header_button button:first-child').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
        document.exitFullscreen();
    }
});

// Javobsiz savollarni tekshirish va yakunlash
function checkUnansweredAndFinish() {
    const unanswered = userAnswers.filter(answer => answer === null).length;
    if (unanswered > 0) {
        showWarningModal();
    } else {
        finishTest();
    }
}

// Ogohlantirish modalini ko'rsatish
function showWarningModal() {
    const modal = document.getElementById('warning-modal');
    modal.style.display = 'flex';

    document.getElementById('cancel-finish').addEventListener('click', () => {
        modal.style.display = 'none';
    }, { once: true });

    document.getElementById('confirm-finish').addEventListener('click', () => {
        modal.style.display = 'none';
        finishTest();
    }, { once: true });
}

// Testni yakunlash
function finishTest() {
    clearInterval(timerInterval);

    let correctCount = 0;
    questions.forEach((q, i) => {
        if (userAnswers[i] === q.correct) correctCount++;
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const progress = (percentage / 100) * 360;

    document.querySelector('.result').innerHTML = `
    <h2>Test Yakunlandi</h2>
    <div class="progress-circle" style="--progress: ${progress}deg;">
        <div class="progress-value">${percentage}%</div>
    </div>
    <p><strong class="correct">To'g'ri javoblar: ${correctCount}</strong></p>
    <p><strong class="total">Umumiy savollar: ${questions.length}</strong></p>
    <button class="restat-button">Qaytatdan</button>
  `;

    document.querySelector('.question').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
    document.querySelector('.q_button').style.display = 'none';
    document.querySelector('.result-box').style.display = 'flex';

    document.querySelector('.restat-button').addEventListener('click', restartTest);
}

// Testni qaytadan boshlash
function restartTest() {
    clearInterval(timerInterval);
    timeLeft = 60 * 60;

    userAnswers = new Array(questions.length).fill(null);
    currentQuestionIndex = 0;

    document.querySelector('.question').style.display = '';
    document.querySelector('.footer').style.display = '';
    document.querySelector('.q_button').style.display = '';
    document.querySelector('.result-box').style.display = 'none';

    document.querySelectorAll('.q_button_box button').forEach(btn => {
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.color = '';
    });

    startTimer();
    renderQuestion();
}

// Dasturni ishga tushirish
window.addEventListener('load', fetchQuestions);
