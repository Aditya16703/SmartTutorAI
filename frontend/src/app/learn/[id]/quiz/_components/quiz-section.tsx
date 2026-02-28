"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Clock,
  Target,
  RotateCcw,
} from "lucide-react";

interface Question {
  hint: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  question: string;
  explanation: string;
  correctAnswer: string;
}

interface QuizData {
  title: string;
  questions: Question[];
}

interface QuizSectionProps {
  quizData: QuizData;
}

export default function QuizSection({ quizData }: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<string[]>(
    new Array(quizData.questions.length).fill("")
  );
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;
  const progress =
    ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  const handleAnswerSelect = (option: string) => {
    if (!showFeedback) {
      setSelectedAnswer(option);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setIsQuizComplete(true);
      setEndTime(Date.now());
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowHint(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1]);
      setShowFeedback(false);
      setShowHint(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData.questions[index].correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: quizData.questions.length,
      score: correct * 2,
      maxScore: quizData.questions.length * 2,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    };
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers(new Array(quizData.questions.length).fill(""));
    setIsQuizComplete(false);
    setEndTime(null);
    setShowHint(false);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // ======================== RESULTS SCREEN ========================
  if (isQuizComplete) {
    const results = calculateScore();
    const timeTaken = endTime ? endTime - startTime : 0;

    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 border-green-200 dark:border-green-800/50">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Quiz Complete! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-green-200 dark:border-green-800/50 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.score}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Points</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-green-200 dark:border-green-800/50 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {results.percentage}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-green-200 dark:border-green-800/50 text-center shadow-sm">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {results.correct}/{results.total}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Correct</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-green-200 dark:border-green-800/50 text-center shadow-sm">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatTime(timeTaken)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
              </div>
            </div>

            {/* Performance Feedback */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-green-200 dark:border-green-800/50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Performance Feedback
              </h3>
              {results.percentage >= 80 ? (
                <div className="text-green-700 dark:text-green-400">
                  <p className="font-medium">Excellent work! 🌟</p>
                  <p>
                    You have a strong understanding of {quizData.title || "this topic"}.
                  </p>
                </div>
              ) : results.percentage >= 60 ? (
                <div className="text-blue-700 dark:text-blue-400">
                  <p className="font-medium">Good job! 👍</p>
                  <p>
                    You have a good grasp of the concepts. Review the
                    explanations for improvement.
                  </p>
                </div>
              ) : (
                <div className="text-orange-700 dark:text-orange-400">
                  <p className="font-medium">Keep learning! 📚</p>
                  <p>
                    Consider reviewing the material and taking the quiz again to
                    improve your understanding.
                  </p>
                </div>
              )}
            </div>

            {/* Question Review */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-green-200 dark:border-green-800/50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Question Review
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {quizData.questions.map((question, index) => {
                  const userAnswer = answers[index];
                  const isCorrect = userAnswer === question.correctAnswer;

                  return (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50"
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Q{index + 1}: {question.question}
                          </p>
                          <div className="text-sm space-y-1">
                            <p
                              className={`${
                                isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              Your answer:{" "}
                              {userAnswer ? (
                                question.options[
                                  userAnswer as keyof typeof question.options
                                ]
                              ) : (
                                <span className="italic text-gray-400">Skipped</span>
                              )}
                            </p>
                            {!isCorrect && (
                              <p className="text-green-600 dark:text-green-400">
                                Correct answer:{" "}
                                {
                                  question.options[
                                    question.correctAnswer as keyof typeof question.options
                                  ]
                                }
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                            isCorrect
                              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                          }`}
                        >
                          {isCorrect ? "+2" : "0"} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={restartQuiz}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 py-3 text-base"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ======================== QUIZ SCREEN ========================
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border-blue-200 dark:border-blue-900/50 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/5">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {quizData.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>
                  {currentQuestionIndex + 1}/{quizData.questions.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(Date.now() - startTime)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              {currentQuestion.question}
            </h2>

            {/* Hint */}
            <div className="mb-6">
              <Button
                onClick={() => setShowHint(!showHint)}
                variant="outline"
                size="sm"
                className="mb-3 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                💡 {showHint ? "Hide Hint" : "Show Hint"}
              </Button>

              {showHint && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 animate-in fade-in duration-200">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">Hint:</span>{" "}
                    {currentQuestion.hint}
                  </p>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid gap-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = selectedAnswer === key;
                const isCorrect = key === currentQuestion.correctAnswer;
                const isWrong = showFeedback && isSelected && !isCorrect;
                const showCorrect = showFeedback && isCorrect;

                let optionClasses = "";
                let badgeClasses = "";

                if (showCorrect) {
                  optionClasses = "border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-500/70";
                  badgeClasses = "bg-green-500 text-white";
                } else if (isWrong) {
                  optionClasses = "border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-500/70";
                  badgeClasses = "bg-red-500 text-white";
                } else if (isSelected) {
                  optionClasses = "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500/70 shadow-md shadow-blue-500/10";
                  badgeClasses = "bg-blue-500 text-white";
                } else {
                  optionClasses = "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:shadow-md hover:shadow-blue-500/5";
                  badgeClasses = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleAnswerSelect(key)}
                    disabled={showFeedback}
                    className={`p-4 text-left rounded-xl border-2 transition-all duration-200 ${optionClasses}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors duration-200 ${badgeClasses}`}
                      >
                        {key}
                      </span>
                      <span className="flex-1 text-gray-800 dark:text-gray-100 font-medium text-[15px]">
                        {value}
                      </span>
                      {showFeedback && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      {showFeedback && isWrong && (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          {showFeedback && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                Explanation
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{currentQuestion.explanation}</p>

              {selectedAnswer === currentQuestion.correctAnswer ? (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg">
                  <p className="text-green-700 dark:text-green-400 font-medium">
                    ✅ Correct! You earned 2 points.
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 font-medium">
                    ❌ Incorrect. The correct answer is option{" "}
                    {currentQuestion.correctAnswer}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-2">
            <Button
              onClick={handlePreviousQuestion}
              variant="outline"
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            {!showFeedback ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 shadow-lg shadow-blue-500/25 disabled:shadow-none disabled:opacity-50"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center gap-2 px-8 shadow-lg shadow-blue-500/25"
              >
                {isLastQuestion ? "View Results" : "Next Question"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
