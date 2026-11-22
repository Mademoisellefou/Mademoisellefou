let questions = [];
let current = 0;
let score = 0;
let answered = false;
let endTime = 0;
let timerId = null;

const titleEl    = document.getElementById("title");
const progressEl = document.getElementById("progress");
const timerEl    = document.getElementById("timer");
const gameEl     = document.getElementById("game");
const questionEl = document.getElementById("question");
const optionsEl  = document.getElementById("options");
const nextBtn    = document.getElementById("nextBtn");
const resultEl   = document.getElementById("result");
const resultText = document.getElementById("resultText");
const restartBtn = document.getElementById("restartBtn");

// Fisher-Yates shuffle (returns a new array)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 1. Load the JSON
async function loadQuiz() {
  try {
    const res = await fetch("questions.json");
    if (!res.ok) throw new Error("Request failed: " + res.status);
    const data = await res.json();

    titleEl.textContent = data.title;

    // Shuffle the questions ONCE, then walk through them in order.
    // That is what guarantees no question repeats.
    questions = shuffle(data.questions).map(q => ({
      question: q.question,
      // Mark which option is correct BEFORE shuffling the options
      options: shuffle(q.options.map((text, i) => ({
        text,
        correct: i === q.answer
      })))
    }));

    startTimer(data.totalSeconds);
    showQuestion();
  } catch (err) {
    titleEl.textContent = "Could not load the questions.";
    console.error(err);
  }
}

// 2. Global countdown
function startTimer(totalSeconds) {
  // Using an end timestamp (instead of subtracting 1 each tick)
  // keeps the time accurate even if the browser tab is in the background.
  endTime = Date.now() + totalSeconds * 1000;
  updateTimer();
  timerId = setInterval(updateTimer, 250);
}

function updateTimer() {
  const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  timerEl.textContent = `⏱ ${m}:${s}`;
  timerEl.classList.toggle("low", left <= 60);

  if (left <= 0) finishQuiz(true);
}

// 3. Show the current question
function showQuestion() {
  answered = false;
  nextBtn.hidden = true;

  const q = questions[current];
  progressEl.textContent = `Question ${current + 1} / ${questions.length}`;
  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt.text;
    btn.addEventListener("click", () => selectAnswer(btn, opt));
    optionsEl.appendChild(btn);
  });
}

// 4. Handle an answer
function selectAnswer(btn, opt) {
  if (answered) return;
  answered = true;

  if (opt.correct) {
    score++;
    btn.classList.add("correct");
  } else {
    btn.classList.add("wrong");
  }

  // Lock all buttons and highlight the correct one
  const q = questions[current];
  [...optionsEl.children].forEach((b, i) => {
    b.disabled = true;
    if (q.options[i].correct) b.classList.add("correct");
  });

  nextBtn.textContent = current === questions.length - 1 ? "Finish" : "Next";
  nextBtn.hidden = false;
}

nextBtn.addEventListener("click", () => {
  current++;
  if (current >= questions.length) finishQuiz(false);
  else showQuestion();
});

// 5. Final screen
function finishQuiz(timeUp) {
  clearInterval(timerId);
  gameEl.hidden = true;
  progressEl.textContent = "";
  resultEl.hidden = false;

  const prefix = timeUp ? "⏰ Time is up! " : "Quiz finished! ";
  resultText.textContent =
    `${prefix}Your score: ${score} / ${questions.length}`;
}

restartBtn.addEventListener("click", () => location.reload());

loadQuiz();
