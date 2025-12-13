const quizDiv = document.getElementById("quiz");
const scoreText = document.getElementById("score");
const timerText = document.getElementById("timer");
const counterText = document.getElementById("questionCounter");
const endDiv = document.getElementById("end");
const finalScoreText = document.getElementById("finalScore");
const filterInput = document.getElementById("filterInput");

let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let score = 0;
let timer;
let timeLeft = 30;

// Décodage HTML
function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// Shuffle array
function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// Fallback questions locales si API bloque
const sampleQuestions = [
    {
        question: "Quelle est la capitale de la France?",
        correct_answer: "Paris",
        incorrect_answers: ["Lyon", "Marseille", "Bordeaux"]
    },
    {
        question: "En quelle année l'homme a-t-il marché sur la Lune?",
        correct_answer: "1969",
        incorrect_answers: ["1965", "1972", "1975"]
    },
    {
        question: "Quelle est la couleur du cheval blanc d'Henri IV?",
        correct_answer: "Blanc",
        incorrect_answers: ["Noir", "Gris", "Marron"]
    }
];

// Load questions from API or fallback
async function loadQuestions() {
    try {
        const res = await fetch("https://opentdb.com/api.php?amount=10&category=18&type=multiple");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (!data.results) throw new Error("Pas de questions disponibles");

        // Random niveau et shuffle questions
        questions = shuffle(data.results.map(q => ({
            ...q,
            niveau: Math.floor(Math.random() * 3) + 1
        })));
    } catch (error) {
        console.warn("API inaccessible, utilisation des questions locales.", error);
        questions = shuffle(sampleQuestions.map(q => ({
            ...q,
            niveau: Math.floor(Math.random() * 3) + 1
        })));
    }
    filteredQuestions = [...questions];
    showQuestion();
}

// Afficher question
function showQuestion() {
    if (currentIndex >= filteredQuestions.length) {
        endQuiz();
        return;
    }

    clearInterval(timer);
    timeLeft = 30;
    startTimer();

    const q = filteredQuestions[currentIndex];
    counterText.textContent = `Question ${currentIndex + 1}/${filteredQuestions.length}`;

    const answers = shuffle([q.correct_answer, ...q.incorrect_answers]);

    quizDiv.innerHTML = `
        <div class="question-block" data-niveau="${q.niveau}">
            <h2>${decodeHTML(q.question)}</h2>
            <button class="niveau-btn">🦉 Niveau ${q.niveau}</button>
            <ul>
                ${answers.map(a => `<li data-correct="${a === q.correct_answer}">${decodeHTML(a)}</li>`).join("")}
            </ul>
            <p class="answer-msg" style="display:none;">
                Bonne réponse: ${decodeHTML(q.correct_answer)}
            </p>
        </div>
    `;

    // Clic sur options → automatic scoring
    quizDiv.querySelectorAll("li").forEach(li => {
        li.addEventListener("click", () => checkAnswer(li));
    });

    // Clic sur niveau 🦉 → afficher la réponse seulement
    const niveauBtn = quizDiv.querySelector(".niveau-btn");
    const answerMsg = quizDiv.querySelector(".answer-msg");
    niveauBtn.addEventListener("click", () => {
        answerMsg.style.display = "block";
    });
}

// Vérifier réponse
function checkAnswer(selected) {
    clearInterval(timer);

    quizDiv.querySelectorAll("li").forEach(li => {
        if (li.dataset.correct === "true") {
            li.classList.add("correct");
        } else if (li === selected) {
            li.classList.add("wrong");
        }
        li.style.pointerEvents = "none";
    });

    if (selected.dataset.correct === "true") {
        score++;
        scoreText.textContent = `Score: ${score}`;
    }

    setTimeout(() => {
        currentIndex++;
        showQuestion();
    }, 1500);
}

// Timer
function startTimer() {
    timerText.textContent = `Temps: ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        timerText.textContent = `Temps: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            currentIndex++;
            showQuestion();
        }
    }, 1000);
}

// Fin du quiz
function endQuiz() {
    quizDiv.classList.add("hidden");
    endDiv.classList.remove("hidden");
    finalScoreText.textContent = `Votre score final: ${score}/${filteredQuestions.length}`;
}

// Filter input → par niveau
filterInput.addEventListener("input", () => {
    const keyword = filterInput.value.trim();
    if (!keyword) {
        filteredQuestions = [...questions];
    } else {
        filteredQuestions = questions.filter(q => q.niveau.toString() === keyword);
    }
    currentIndex = 0;
    if (filteredQuestions.length === 0) {
        quizDiv.innerHTML = "<p>Aucune question ne correspond au niveau.</p>";
    } else {
        showQuestion();
    }
});

// Start
loadQuestions();
