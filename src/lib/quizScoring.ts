/**
 * Unified Quiz Scoring Engine
 * 
 * Used by BOTH Take Quiz (EnhancedQuizViewer) and Challenge (CustomQuizViewer/ChallengePage).
 * Single source of truth for answer evaluation to prevent scoring mismatches.
 */

/**
 * Extract the letter prefix from an option string like "A) Some text" → "A"
 * Returns null if no letter prefix found.
 */
export const extractLetterFromOption = (option: string): string | null => {
  const match = option.match(/^([A-Za-z])\)/);
  return match ? match[1].toUpperCase() : null;
};

/**
 * Normalize an answer for comparison.
 * Handles all formats: full option text "A) ...", letter only "A", or plain text.
 */
export const normalizeAnswer = (answer: string): string => {
  if (!answer) return '';
  const trimmed = answer.trim();
  
  // If it's a single letter (A-Z), return uppercase
  if (/^[A-Za-z]$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  
  // If it starts with a letter prefix like "A) ...", extract the letter
  const letter = extractLetterFromOption(trimmed);
  if (letter) {
    return letter;
  }
  
  // Otherwise return as-is (for short answer questions)
  return trimmed;
};

/**
 * Compare a user's answer against the correct answer.
 * Works for all question types and answer formats.
 * 
 * @param userAnswer - The user's selected answer (could be full option text, letter, or short answer)
 * @param correctAnswer - The correct answer (could be letter like "A" or full text)
 * @param questionType - 'mcq' or 'short'
 * @param options - The question's options array (used for MCQ to resolve ambiguity)
 */
export const evaluateAnswer = (
  userAnswer: string | undefined | null,
  correctAnswer: string,
  questionType: 'mcq' | 'short' = 'mcq',
  options?: string[]
): boolean => {
  if (!userAnswer || !correctAnswer) return false;

  if (questionType === 'short') {
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();
    return (
      normalizedUser === normalizedCorrect ||
      normalizedCorrect.includes(normalizedUser) ||
      normalizedUser.includes(normalizedCorrect)
    );
  }

  // MCQ comparison
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Direct match after normalization (both are letters, or both are text)
  if (normalizedUser === normalizedCorrect) return true;

  // If correct answer is a letter and user answer is full text, find the option index
  if (/^[A-Z]$/.test(normalizedCorrect) && options) {
    const correctIndex = normalizedCorrect.charCodeAt(0) - 65; // A=0, B=1, etc.
    if (correctIndex >= 0 && correctIndex < options.length) {
      const correctOptionText = options[correctIndex];
      // Check if user selected the correct option by full text match
      if (userAnswer.trim() === correctOptionText.trim()) return true;
      // Also check stripped text (without letter prefix)
      const strippedUser = userAnswer.replace(/^[A-Za-z]\)\s*/, '').trim();
      const strippedCorrect = correctOptionText.replace(/^[A-Za-z]\)\s*/, '').trim();
      if (strippedUser === strippedCorrect) return true;
    }
  }

  // If user answer is a letter and correct answer is full text
  if (/^[A-Z]$/.test(normalizedUser) && options) {
    const userIndex = normalizedUser.charCodeAt(0) - 65;
    if (userIndex >= 0 && userIndex < options.length) {
      const correctOptionText = correctAnswer.trim();
      const userOptionText = options[userIndex].trim();
      if (userOptionText === correctOptionText) return true;
    }
  }

  return false;
};

/**
 * Score an entire quiz using the unified scoring engine.
 * Returns the number of correct answers.
 */
export const scoreQuiz = (
  questions: Array<{
    id: string;
    correctAnswer: string;
    type?: 'mcq' | 'short';
    options?: string[];
  }>,
  answers: Record<string, string>
): number => {
  let score = 0;
  for (const q of questions) {
    const userAnswer = answers[q.id];
    if (evaluateAnswer(userAnswer, q.correctAnswer, q.type || 'mcq', q.options)) {
      score++;
    }
  }
  return score;
};
