document.addEventListener("DOMContentLoaded", () => {
  const setupDiv = document.getElementById("setup");
  const quizDiv = document.getElementById("quiz");
  const questionText = document.getElementById("questionText");
  const answerInput = document.getElementById("answerInput");
  const feedback = document.getElementById("feedback");
  const scoreBoard = document.getElementById("scoreBoard");
  const operationSelect = document.getElementById("operation");
  const startQuizButton = document.getElementById("startQuiz");
  const submitAnswerButton = document.getElementById("submitAnswer");
  const customRangeDiv = document.getElementById("customRangeDiv");
  const customRangeInput = document.getElementById("customRange");
  const playAgainButton = document.getElementById("playAgain");
  const scoreDisplay = document.getElementById("scoreDisplay");

  let currentQuestion = {};
  let questionNumber = 0;
  let score = 0;
  const totalQuestions = 10;
  let firstAttempt = true;
  let maxNumber = 12;
  let selectedOperation = "+"; // Default operation

  const generateQuestion = (operator) => {
    let num1 = Math.floor(Math.random() * maxNumber) + 1;
    let num2 = Math.floor(Math.random() * maxNumber) + 1;

    if (operator === "-") {
      // Ensure no negative results for subtraction
      if (num1 < num2) {
        [num1, num2] = [num2, num1];
      }
    }

    if (operator === "/") {
      // Ensure valid division problems
      while (num1 % num2 !== 0) {
        num1 = Math.floor(Math.random() * maxNumber) + 1;
        num2 = Math.floor(Math.random() * maxNumber) + 1;
      }
    }

    return { num1, operator, num2 };
  };

  const displayQuestion = () => {
    const { num1, operator, num2 } = currentQuestion;
    questionText.textContent = `Question ${questionNumber + 1}: What is ${num1} ${operator} ${num2}?`;
    answerInput.value = "";
    feedback.textContent = "";
    firstAttempt = true;
    updateScoreDisplay();
  };

  const updateScoreDisplay = () => {
    scoreDisplay.textContent = `Score: ${score} | Question: ${questionNumber + 1} of ${totalQuestions}`;
  };

  const checkAnswer = () => {
    const userAnswer = parseInt(answerInput.value);
    const { num1, operator, num2 } = currentQuestion;
    let correctAnswer;

    if (!answerInput.value.trim()) {
      feedback.textContent = "Please enter a valid answer.";
      feedback.style.color = "red";
      return false;
    }

    switch (operator) {
      case "+":
        correctAnswer = num1 + num2;
        break;
      case "-":
        correctAnswer = num1 - num2;
        break;
      case "*":
        correctAnswer = num1 * num2;
        break;
      case "/":
        correctAnswer = Math.floor(num1 / num2);
        break;
    }

    if (userAnswer === correctAnswer) {
      feedback.textContent = "Correct!";
      feedback.style.color = "green";
      if (firstAttempt) {
        score++;
        firstAttempt = false;
      }
      return true;
    } else {
      feedback.textContent = "Wrong! Try again.";
      feedback.style.color = "red";
      answerInput.value = "";
      firstAttempt = false;
      return false;
    }
  };

  startQuizButton.addEventListener("click", () => {
    // Get the selected operation from the dropdown
    selectedOperation = operationSelect.value;

    if (selectedOperation === "+" || selectedOperation === "-") {
      maxNumber = parseInt(customRangeInput.value) || 12;
    } else {
      maxNumber = 12;
    }

    customRangeDiv.style.display = "none";
    setupDiv.style.display = "none";
    quizDiv.style.display = "block";

    questionNumber = 0;
    score = 0;

    // Use the selected operation when generating the first question
    currentQuestion = generateQuestion(selectedOperation);
    displayQuestion();
  });

  const handleAnswerSubmission = () => {
    if (checkAnswer()) {
      questionNumber++;
      if (questionNumber < totalQuestions) {
        // Continue using the selected operation
        currentQuestion = generateQuestion(selectedOperation);
        displayQuestion();
      } else {
        quizDiv.style.display = "none";
        scoreBoard.style.display = "block";
        playAgainButton.style.display = "block";
        scoreBoard.textContent = `Quiz finished! Your final score is ${score} out of ${totalQuestions}.`;
      }
    }
    answerInput.focus();
  };

  submitAnswerButton.addEventListener("click", handleAnswerSubmission);

  answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleAnswerSubmission();
    }
  });

  playAgainButton.addEventListener("click", () => {
    playAgainButton.style.display = "none";
    scoreBoard.style.display = "none";
    setupDiv.style.display = "block";
  });

  operationSelect.addEventListener("change", () => {
    if (operationSelect.value === "+" || operationSelect.value === "-") {
      customRangeDiv.style.display = "block";
    } else {
      customRangeDiv.style.display = "none";
    }
  });
});
