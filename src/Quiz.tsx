import React, { useState, useEffect, ChangeEvent } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Timer, SkipForward } from 'lucide-react';
import { AnswersEnhanced, IntegerQuestion, McqQuestion, Question, QuestionTimers, QuizResult, TimedOutQuestions } from './utils/Types';
import { questions } from './SampleQuestions';



const Quiz: React.FC = () => {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswersEnhanced>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(30);
  const [timedOutQuestions, setTimedOutQuestions] = useState<TimedOutQuestions>({});
  const [skippedQuestions, setSkippedQuestions] = useState<TimedOutQuestions>({});
  const [questionTimers, setQuestionTimers] = useState<QuestionTimers>({});
  const [integerValue, setIntegerValue] = useState<string>('');

  // Initialize timers when quiz starts
  useEffect(() => {
    if (isStarted) {
      const initialTimers: QuestionTimers = {};
      questions.forEach(q => {
        initialTimers[q.id] = 30;
      });
      setQuestionTimers(initialTimers);
    }
  }, [isStarted]);

  useEffect(() => {
    // Reset integer input value when moving to a new question
    setIntegerValue('');

    // Timer logic
    let interval: ReturnType<typeof setInterval>;

    if (isStarted && !showResults && !timedOutQuestions[questions[currentQuestion].id] && !skippedQuestions[questions[currentQuestion].id]) {
      // Set the timer to the saved value for this question
      if (questionTimers[questions[currentQuestion].id] !== undefined) {
        setTimer(questionTimers[questions[currentQuestion].id]);
      }

      interval = setInterval(() => {
        setTimer(prev => {
          const newValue = prev <= 1 ? 0 : prev - 1;

          // Save the current timer value for this question
          setQuestionTimers(prevTimers => ({
            ...prevTimers,
            [questions[currentQuestion].id]: newValue
          }));

          if (newValue <= 0) {
            clearInterval(interval);
            handleTimeout();
            return 30;
          }
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentQuestion, isStarted, showResults]);

  const handleTimeout = () => {
    setTimedOutQuestions(prev => ({
      ...prev,
      [questions[currentQuestion].id]: true
    }));

    // going to the next question 
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  // Function to handle MCQ answers
  const handleMcqAnswer = (questionId: number, answerIndex: number): void => {
    if (!timedOutQuestions[questionId] && !skippedQuestions[questionId]) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answerIndex
      }));
    }
  };

  // Function to handle integer input change
  const handleIntegerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^-?\d+$/.test(value)) {
      setIntegerValue(value);
    }
  };

  // Function to submit integer answer
  const handleIntegerSubmit = (questionId: number) => {
    if (integerValue !== '' && !timedOutQuestions[questionId] && !skippedQuestions[questionId]) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: parseInt(integerValue, 10)
      }));
    }
  };

  // Function to move to the next question
  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  // Function to move to the previous question
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // Function to skip the current question
  const handleSkipQuestion = () => {
    // Mark current question as skipped
    setSkippedQuestions(prev => ({
      ...prev,
      [questions[currentQuestion].id]: true
    }));

    // Save the current timer value
    setQuestionTimers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: timer
    }));

    // Move to next question if not at the end
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // If last question, check if all questions are either answered, timed out, or skipped
      const allQuestionsHandled = questions.every(q =>
        answers[q.id] !== undefined ||
        timedOutQuestions[q.id] ||
        skippedQuestions[q.id]
      );

      if (allQuestionsHandled) {
        handleSubmit();
      }
    }
  };

  const calculateScore = (): number => {
    let newScore = 0;
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === parseInt(questionId)) as Question;

      if (question) {
        if (question.type === 'mcq' && typeof answer === 'number') {
          if (answer === (question as McqQuestion).correct) {
            newScore++;
          }
        } else if (question.type === 'integer' && typeof answer === 'number') {
          if (answer === (question as IntegerQuestion).correct) {
            newScore++;
          }
        }
      }
    });
    return newScore;
  };

  // Submit the quiz after all questions are answered or timed out or skipped
  const handleSubmit = async (): Promise<void> => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);

    try {
      const db = await openDB();
      const tx = db.transaction('quizResults', 'readwrite');
      const store = tx.objectStore('quizResults');
      const quizResult: QuizResult = {
        date: new Date(),
        score: finalScore,
        totalQuestions: questions.length,
        answers
      };
      store.add(quizResult);
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  };

  // Open the IndexedDB database
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('QuizDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('quizResults')) {
          db.createObjectStore('quizResults', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };
    });
  };

  // Count the number of skipped questions
  const skippedCount = Object.keys(skippedQuestions).length;
  // Count answered questions
  const answeredCount = Object.keys(answers).length;
  // Count timed out questions
  const timedOutCount = Object.keys(timedOutQuestions).length;

  // Render integer-type question input
  const renderIntegerQuestion = (question: IntegerQuestion) => {
    const isAnswered = answers[question.id] !== undefined;
    const isDisabled = timedOutQuestions[question.id] || skippedQuestions[question.id];

    return (
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor={`integer-${question.id}`} className="text-sm text-gray-600">
            Enter your answer (integers only):
          </label>
          <div className="flex space-x-2">
            <input
              id={`integer-${question.id}`}
              type="text"
              value={isAnswered ? answers[question.id] : integerValue}
              onChange={handleIntegerChange}
              disabled={isDisabled || isAnswered}
              placeholder="Enter a number..."
              className={`w-full p-3 border rounded-lg ${isDisabled || isAnswered ? 'bg-gray-100' : 'bg-white'}`}
              min={question.min}
              max={question.max}
            />
            <button
              onClick={() => handleIntegerSubmit(question.id)}
              disabled={isDisabled || isAnswered || integerValue === ''}
              className={`px-4 py-2 rounded-lg ${isDisabled || isAnswered || integerValue === ''
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              Submit Answer
            </button>
          </div>
          {question.min !== undefined && question.max !== undefined && (
            <p className="text-sm text-gray-500">
              Valid range: {question.min} to {question.max}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render MCQ question options
  const renderMcqQuestion = (question: McqQuestion) => {
    return (
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleMcqAnswer(question.id, index)}
            disabled={timedOutQuestions[question.id] || skippedQuestions[question.id]}
            className={`w-full p-4 text-left rounded-lg transition-colors ${answers[question.id] === index
              ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
              : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
              } ${(timedOutQuestions[question.id] || skippedQuestions[question.id])
                ? 'opacity-50 cursor-not-allowed'
                : ''
              }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  // Render result for individual question
  const renderQuestionResult = (question: Question) => {
    if (question.type === 'mcq') {
      const mcqQuestion = question as McqQuestion;
      return (
        <div className="mt-2 space-y-2">
          {mcqQuestion.options.map((option, optIndex) => (
            <div key={optIndex} className={`p-2 rounded ${answers[question.id] === undefined
              ? optIndex === mcqQuestion.correct
                ? "bg-green-100 text-green-800"
                : "bg-gray-50"
              : optIndex === mcqQuestion.correct
                ? "bg-green-100 text-green-800"
                : optIndex === answers[question.id]
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-50"
              }`}>
              {option}
            </div>
          ))}
        </div>
      );
    } else {
      // Integer question
      const intQuestion = question as IntegerQuestion;
      const userAnswer = answers[question.id] as number | undefined;
      const isCorrect = userAnswer === intQuestion.correct;

      return (
        <div className="mt-2 space-y-2">
          <div className="flex flex-col p-2">
            <div className="font-medium">Your answer: {userAnswer === undefined ? "Not answered" : userAnswer}</div>
            <div className={`font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              Correct answer: {intQuestion.correct}
            </div>
          </div>
        </div>
      );
    }
  };

  // If quiz hasn't started, show the start screen
  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <h1 className="text-3xl text-blue-700 font-bold">Enhanced React Quiz</h1>
        <p className="text-gray-600 text-xl text-center max-w-md">
          Test your knowledge with this quiz featuring multiple choice and fill-in-the-blank questions. You have 30 seconds per question. Remember if you skip a question, you can't go back to it. Good luck!
        </p>
        <button
          onClick={() => setIsStarted(true)}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // If quiz is over, show the results
  if (showResults) {
    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-lg ${score === questions.length ? "bg-green-50" : "bg-blue-50"}`}>
          <div className="flex items-center gap-2">
            {score === questions.length ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-600" />
            )}
            <p className="text-lg font-medium">
              You scored {score} out of {questions.length}!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 py-2">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="font-medium">Answered: </span>
            <span>{answeredCount}</span>
          </div>
          <div className="bg-yellow-50 px-4 py-2 rounded-lg">
            <span className="font-medium">Skipped: </span>
            <span>{skippedCount}</span>
          </div>
          <div className="bg-red-50 px-4 py-2 rounded-lg">
            <span className="font-medium">Timed Out: </span>
            <span>{timedOutCount}</span>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q) => {
            const question = q as Question;
            const isCorrect = question.type === 'mcq'
              ? answers[question.id] === (question as McqQuestion).correct
              : answers[question.id] === (question as IntegerQuestion).correct;

            return (
              <div key={question.id} className={`p-6 rounded-lg border ${answers[question.id] === undefined
                  ? "border-gray-200 bg-gray-50"
                  : isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium">{question.question}</p>
                    <span className="text-xs text-gray-500">
                      {question.type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank (Integer)'}
                    </span>
                  </div>
                  {timedOutQuestions[question.id] && (
                    <span className="text-red-500 text-sm">Time expired</span>
                  )}
                  {skippedQuestions[question.id] && !answers[question.id] && (
                    <span className="text-orange-500 text-sm">Skipped</span>
                  )}
                </div>
                {renderQuestionResult(question)}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Take Another Quiz
        </button>
      </div>
    );
  }

  // Get current question as the correct type
  const currentQuestionData = questions[currentQuestion] as Question;

  // If quiz is in progress, show the quiz questions
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-500">
              <span className="font-medium">Answered:</span> {answeredCount}
            </span>
            <span className="text-sm text-yellow-600">
              <span className="font-medium">Skipped:</span> {skippedCount}
            </span>
          </div>
          <span className={`flex items-center gap-1 ${timer <= 10 ? 'text-red-500' : 'text-gray-500'}`}>
            <Timer className="h-4 w-4" />
            {timer}s
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-medium">
            {currentQuestionData.question}
            {skippedQuestions[currentQuestionData.id] && (
              <span className="ml-2 text-sm text-orange-500">(Skipped)</span>
            )}
          </h2>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {currentQuestionData.type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}
          </span>
        </div>

        {currentQuestionData.type === 'mcq'
          ? renderMcqQuestion(currentQuestionData as McqQuestion)
          : renderIntegerQuestion(currentQuestionData as IntegerQuestion)
        }
      </div>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
            className={`px-4 py-2 rounded-lg border border-gray-300 ${currentQuestion === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Previous
          </button>

          <button
            onClick={handleSkipQuestion}
            disabled={
              timedOutQuestions[currentQuestionData.id] ||
              skippedQuestions[currentQuestionData.id] ||
              answers[currentQuestionData.id] !== undefined
            }
            className={`px-4 py-2 rounded-lg border flex items-center ${timedOutQuestions[currentQuestionData.id] ||
              skippedQuestions[currentQuestionData.id] ||
              answers[currentQuestionData.id] !== undefined
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
              : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-300'
              }`}
          >
            Skip <SkipForward className="ml-2 h-4 w-4" />
          </button>
        </div>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={questions.some(q =>
              answers[q.id] === undefined &&
              !timedOutQuestions[q.id] &&
              !skippedQuestions[q.id]
            )}
            className={`px-4 py-2 rounded-lg ${questions.some(q =>
              answers[q.id] === undefined &&
              !timedOutQuestions[q.id] &&
              !skippedQuestions[q.id]
            )
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={
              answers[currentQuestionData.id] === undefined &&
              !timedOutQuestions[currentQuestionData.id] &&
              !skippedQuestions[currentQuestionData.id]
            }
            className={`px-4 py-2 rounded-lg flex items-center ${answers[currentQuestionData.id] === undefined &&
              !timedOutQuestions[currentQuestionData.id] &&
              !skippedQuestions[currentQuestionData.id]
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;