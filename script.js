// script.js

// --- DOM Elements ---
const weekSelector = document.getElementById('week-selector');
const quizArea = document.getElementById('quiz-area');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextButton = document.getElementById('next-button');
const feedbackDiv = document.getElementById('feedback');
const scoreSpan = document.getElementById('score');
const totalQuestionsSpan = document.getElementById('total-questions');
const resultsArea = document.getElementById('results-area');
const finalScoreSpan = document.getElementById('final-score');
const finalTotalSpan = document.getElementById('final-total');
const restartWeekButton = document.getElementById('restart-week-button');
const selectAnotherWeekLink = document.getElementById('select-another-week');

// --- State Variables ---
let currentWeekQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null; // To store the button element clicked by the user

// --- Functions ---

// --- Helper: Shuffle Array (Fisher-Yates) ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Populate the week selector dropdown
function populateWeekSelector() {
    const uniqueWeeks = getUniqueWeeks();
    uniqueWeeks.forEach(weekNum => {
        if (!isNaN(weekNum)) { // Only add numeric weeks
            const option = document.createElement('option');
            option.value = weekNum;
            option.textContent = `Week ${weekNum}`;
            weekSelector.appendChild(option);
        }
    });

    // Add Marathon option
    const marathonOption = document.createElement('option');
    marathonOption.value = "marathon";
    marathonOption.textContent = "Marathon (All Weeks)";
    weekSelector.appendChild(marathonOption);

    // Add Other option
    const otherOption = document.createElement('option');
    otherOption.value = "other";
    otherOption.textContent = "Other (General Questions)";
    weekSelector.appendChild(otherOption);
}

// Load questions for the selected week or marathon
function loadWeekQuestions(weekNum) {
    if (weekNum === "marathon") {
        // Exclude 'other' questions from marathon
        currentWeekQuestions = shuffleArray(
            allQuestions.filter(q => q.week !== 'other')
        );
    } else if (weekNum === "other") {
        currentWeekQuestions = shuffleArray(
            allQuestions.filter(q => q.week === 'other')
        );
    } else {
        currentWeekQuestions = shuffleArray(
            allQuestions.filter(q => q.week === parseInt(weekNum))
        );
    }
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswer = null;
    updateScoreDisplay();
    totalQuestionsSpan.textContent = currentWeekQuestions.length;

    if (currentWeekQuestions.length > 0) {
        quizArea.classList.remove('hidden'); // Show quiz area
        resultsArea.classList.add('hidden'); // Hide results area
        loadQuestion();
    } else {
        quizArea.classList.add('hidden'); // Hide quiz if no questions
        resultsArea.classList.add('hidden');
        feedbackDiv.textContent = "No questions found for this week.";
        feedbackDiv.className = 'feedback'; // Reset feedback style
    }
}

// Display the current question and options
function loadQuestion() {
    // Reset from previous question
    feedbackDiv.textContent = '';
    feedbackDiv.className = 'feedback'; // Reset feedback style
    nextButton.classList.add('hidden'); // Hide next button initially
    optionsContainer.innerHTML = ''; // Clear previous options
    selectedAnswer = null; // Reset selected answer

    if (currentQuestionIndex < currentWeekQuestions.length) {
        const questionData = currentWeekQuestions[currentQuestionIndex];
        questionText.textContent = `${currentQuestionIndex + 1}. ${questionData.question}`; // Add question number

        // --- Shuffle options before displaying ---
        const shuffledOptions = shuffleArray([...questionData.options]);

        // Create buttons for each option
        shuffledOptions.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.addEventListener('click', handleOptionClick);
            optionsContainer.appendChild(button);
        });
    } else {
        // End of the quiz for the week
        showResults();
    }
}

// Handle clicking an option button
function handleOptionClick(event) {
    // If an answer was already selected and checked, do nothing
    if (feedbackDiv.textContent !== '') {
        return;
    }

     // Remove 'selected' class from any previously selected button
    const currentlySelected = optionsContainer.querySelector('.selected');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected');
    }

    // Mark the new button as selected
    selectedAnswer = event.target; // Store the clicked button element
    selectedAnswer.classList.add('selected');


    // --- Automatically check the answer upon selection ---
    checkAnswer();
}

// Check the selected answer
function checkAnswer() {
     if (!selectedAnswer) return; // Do nothing if no answer selected

    const questionData = currentWeekQuestions[currentQuestionIndex];
    const correctOptionText = questionData.correctAnswer;
    const selectedOptionText = selectedAnswer.textContent;

    // Disable all option buttons after checking
    const optionButtons = optionsContainer.querySelectorAll('button');
    optionButtons.forEach(btn => btn.disabled = true);

    if (selectedOptionText === correctOptionText) {
        score++;
        feedbackDiv.textContent = "Correct!";
        feedbackDiv.className = 'feedback correct'; // Add 'correct' class
        selectedAnswer.classList.add('correct'); // Style the selected button as correct
    } else {
        feedbackDiv.textContent = `Incorrect. The correct answer was: ${correctOptionText}`;
        feedbackDiv.className = 'feedback incorrect'; // Add 'incorrect' class
        selectedAnswer.classList.add('incorrect'); // Style the selected button as incorrect

        // Also highlight the correct answer button
        optionButtons.forEach(btn => {
            if (btn.textContent === correctOptionText) {
                btn.classList.add('correct');
            }
        });
    }

    updateScoreDisplay();
    nextButton.classList.remove('hidden'); // Show the Next Question button
}


// Update the score display
function updateScoreDisplay() {
    scoreSpan.textContent = score;
}

// Show final results for the week
function showResults() {
    quizArea.classList.add('hidden');
    resultsArea.classList.remove('hidden');
    finalScoreSpan.textContent = score;
    finalTotalSpan.textContent = currentWeekQuestions.length;

    const congratsDiv = document.getElementById('perfect-score-congrats');
    if (score === currentWeekQuestions.length && currentWeekQuestions.length > 0) {
        congratsDiv.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <img src="cat-kiss.gif" alt="Cat Congratulations" style="width:220px;height:220px;border-radius:16px;box-shadow:0 4px 24px #0008;">
                <h3 style="color:#fff;margin-top:16px;text-align:center;">Congratulations, you got it all right!!!</h3>
            </div>
        `;
        congratsDiv.classList.remove('hidden');
    } else {
        congratsDiv.innerHTML = '';
        congratsDiv.classList.add('hidden');
    }
}

// Handle going to the next question
function handleNextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

// --- Event Listeners ---

// When the page loads
document.addEventListener('DOMContentLoaded', () => {
    populateWeekSelector();
    quizArea.classList.add('hidden'); // Ensure quiz is hidden initially
    resultsArea.classList.add('hidden'); // Ensure results are hidden initially
});

// When a week is selected from the dropdown
weekSelector.addEventListener('change', (event) => {
    const selectedWeek = event.target.value;
    if (selectedWeek) {
        loadWeekQuestions(selectedWeek);
    } else {
        // If "-- Select a Week --" is chosen
        quizArea.classList.add('hidden');
        resultsArea.classList.add('hidden');
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback';
    }
});

// When the Next Question button is clicked
nextButton.addEventListener('click', handleNextQuestion);

// When the Restart Week button is clicked
restartWeekButton.addEventListener('click', () => {
    loadWeekQuestions(weekSelector.value); // Reload current week
});

// When "Select Another Week" is clicked
selectAnotherWeekLink.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    resultsArea.classList.add('hidden');
    quizArea.classList.add('hidden');
    weekSelector.value = ""; // Reset dropdown
    feedbackDiv.textContent = '';
    feedbackDiv.className = 'feedback';
});

// Add this after DOMContentLoaded or at the end of your script.js

// Gradient follows cursor on option hover
optionsContainer.addEventListener('mousemove', function(e) {
    if (e.target.tagName === 'BUTTON') {
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.target.style.setProperty('--mouse-x', `${x}%`);
        e.target.style.setProperty('--mouse-y', `${y}%`);
    }
});

// Optional: Reset on mouseleave for smoothness
optionsContainer.addEventListener('mouseleave', function(e) {
    if (e.target.tagName === 'BUTTON') {
        e.target.style.setProperty('--mouse-x', `50%`);
        e.target.style.setProperty('--mouse-y', `50%`);
    }
});