import type { CustomQuiz } from "@/hooks/useCustomQuizzes";

export interface QuizValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a quiz before sharing as a challenge.
 * Ensures quiz integrity and prevents corrupted data from being shared.
 */
export const validateQuizForChallenge = (quiz: CustomQuiz): QuizValidationResult => {
  const errors: string[] = [];

  // Check if quiz has questions
  if (!quiz.questions || quiz.questions.length === 0) {
    errors.push("Quiz must have at least one question");
    return { isValid: false, errors };
  }

  // Validate each question
  quiz.questions.forEach((question, index) => {
    const qNum = index + 1;

    // Check question text
    if (!question.question || question.question.trim() === "") {
      errors.push(`Question ${qNum}: Missing question text`);
    }

    // Check question ID
    if (!question.id) {
      errors.push(`Question ${qNum}: Missing question ID`);
    }

    // Check options
    if (!question.options || question.options.length === 0) {
      errors.push(`Question ${qNum}: No options provided`);
    } else {
      // Check for empty options
      const emptyOptions = question.options.filter(opt => !opt || opt.trim() === "");
      if (emptyOptions.length > 0) {
        errors.push(`Question ${qNum}: Contains empty options`);
      }

      // Check for duplicate options
      const uniqueOptions = new Set(question.options.map(opt => opt.toLowerCase().trim()));
      if (uniqueOptions.size !== question.options.length) {
        errors.push(`Question ${qNum}: Contains duplicate options`);
      }
    }

    // Check correct answer
    if (!question.correctAnswer || question.correctAnswer.trim() === "") {
      errors.push(`Question ${qNum}: Missing correct answer`);
    } else {
      // Verify correct answer matches one of the options
      const correctLetter = question.correctAnswer.charAt(0).toUpperCase();
      const validLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      if (!validLetters.includes(correctLetter)) {
        errors.push(`Question ${qNum}: Invalid correct answer format`);
      } else if (question.options && question.options.length > 0) {
        const letterIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
        if (letterIndex >= question.options.length) {
          errors.push(`Question ${qNum}: Correct answer doesn't match any option`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Creates a clean, immutable snapshot of the quiz for challenge creation.
 * This ensures all participants get identical quiz data.
 */
export const createQuizSnapshot = (quiz: CustomQuiz): CustomQuiz => {
  // Deep clone to prevent any mutations
  const snapshot: CustomQuiz = {
    quizTitle: quiz.quizTitle || "Untitled Quiz",
    description: quiz.description || "",
    questions: quiz.questions.map((q, index) => ({
      // Ensure each question has a unique, stable ID
      id: q.id || `q_${index}_${Date.now()}`,
      question: q.question.trim(),
      options: q.options.map(opt => opt.trim()),
      correctAnswer: q.correctAnswer.trim(),
      difficulty: q.difficulty || undefined,
      explanation: q.explanation || undefined,
      keywordsEnglish: q.keywordsEnglish ? [...q.keywordsEnglish] : undefined,
      keywordsLocal: q.keywordsLocal ? [...q.keywordsLocal] : undefined,
    })),
  };

  return snapshot;
};
