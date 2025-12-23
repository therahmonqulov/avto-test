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

        // Rasm URL ni tozalash/tuzatish (agar kerak bo'lsa)
        questions.forEach(q => {
            if (q.imageUrl && !q.imageUrl.includes('http')) {
                q.imageUrl = ''; // noto'g'ri URL bo'lsa bo'shatamiz
            }
        });

        userAnswers = new Array(questions.length).fill(null);

        generateQuestionButtons();
        startTimer();
        renderQuestion();
    } catch (error) {
        console.error('Ma\'lumotlarni olishda xato:', error);
        alert('Savollarni yuklashda xato yuz berdi. Sheets ID va ulanishni tekshiring.');
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
        });

        qBox.appendChild(btn);
    });
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

    // Savol matni
    document.querySelector('.question-text').innerHTML = q.text || 'Savol matni mavjud emas';

    // Rasm
    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = q.imageUrl
        ? `<img src="${q.imageUrl}" alt="Savol rasmi" style="max-width: 100%; margin: 15px 0; border-radius: 8px;">`
        : '';

    // Variantlar
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    const labels = ['A', 'B', 'C', 'D'];

    // Variantlar-tanlash
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

        const span = document.createElement('span');
        span.textContent = `${labels[idx]}. ${text}`;

        const label = document.createElement('label');
        label.htmlFor = labels[idx];
        label.appendChild(span);

        div.append(input, label);
        optionsDiv.appendChild(div);

        // butun option diviga bosilganda ham tanlash
        div.addEventListener('click', () => {
            input.checked = true;
            // event dispatching kerak bo‘lishi mumkin ba'zi brauzerlarda
            input.dispatchEvent(new Event('change'));
            userAnswers[currentQuestionIndex] = input.value;
            updateQuestionButtonStatus(currentQuestionIndex);
        });
    });

    // Radio eventlari
    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.addEventListener('change', e => {
            userAnswers[currentQuestionIndex] = e.target.value;
            updateQuestionButtonStatus(currentQuestionIndex);
        });
    });

    // Footer tugmalari holati
    const prevBtn = document.querySelector('.footer_button button:first-child');
    const nextBtn = document.querySelector('.footer_button button:last-child');

    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? 'Yakunlash' : 'Keyingi';

    updateQuestionButtonStatus(currentQuestionIndex);
}

// Tanlangan savol tugmasini belgilash
function updateQuestionButtonStatus(index) {
    const buttons = document.querySelectorAll('.q_button_box button');
    const btn = buttons[index];

    if (userAnswers[index]) {
        btn.style.color = "#fff"
        btn.style.backgroundColor = '#142c45ff';
        btn.style.borderColor = '#28a745';
    } else {
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
    }
}

// Oldingi / Keyingi
document.querySelector('.footer_button button:first-child').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
});

document.querySelector('.footer_button button:last-child').addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        finishTest();
    }
});

// Headerdagi "Yakunlash"
document.querySelector('.header_button button:last-child').addEventListener('click', finishTest);

// Fullscreen
document.querySelector('.header_button button:first-child').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
        document.exitFullscreen();
    }
});

// Testni yakunlash
function finishTest() {
    clearInterval(timerInterval);

    let correctCount = 0;
    questions.forEach((q, i) => {
        if (userAnswers[i] === q.correct) correctCount++;
    });

    const percentage = Math.round((correctCount / questions.length) * 100);

    document.querySelector('.result').innerHTML = `
    <h2>Test yakunlandi</h2>
    <p><strong>To'g'ri javoblar:</strong> ${correctCount} / ${questions.length}</p>
    <p><strong>Natija:</strong> ${percentage}%</p>
  `;

    document.querySelector('.question').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
    document.querySelector('.q_button').style.display = 'none';
    document.querySelector('.result').style.display = 'block';
}

// Dasturni ishga tushirish
window.addEventListener('load', fetchQuestions);