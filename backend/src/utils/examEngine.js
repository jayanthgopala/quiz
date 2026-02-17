export function shuffleArray(source) {
  const arr = [...source];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeString(value) {
  return String(value).trim().toLowerCase();
}

function resolveAnswerFromOptions(answer, options = []) {
  if (typeof answer === "number" && Number.isInteger(answer)) {
    return options[answer] ?? answer;
  }

  if (Array.isArray(answer)) {
    return answer.map((item) => resolveAnswerFromOptions(item, options));
  }

  return answer;
}

export function buildSnapshotEntry(question, shouldShuffleOptions) {
  const options = shouldShuffleOptions ? shuffleArray(question.options || []) : [...(question.options || [])];
  const resolvedCorrectAnswer = resolveAnswerFromOptions(question.correctAnswer, options);

  return {
    questionId: question._id,
    type: question.type,
    subject: question.subject,
    difficulty: question.difficulty,
    options,
    marks: question.marks,
    negativeMarks: question.negativeMarks || 0,
    correctAnswer: resolvedCorrectAnswer
  };
}

function normalizeAnswer(answer) {
  if (Array.isArray(answer)) {
    return answer.map((item) => normalizeAnswer(item)).sort();
  }
  if (typeof answer === "string") {
    return normalizeString(answer);
  }
  if (typeof answer === "number" || typeof answer === "boolean") {
    return answer;
  }
  if (answer === null || answer === undefined) {
    return "";
  }
  return normalizeString(JSON.stringify(answer));
}

function areEqualAnswers(actual, expected) {
  const normalizedActual = normalizeAnswer(actual);
  const normalizedExpected = normalizeAnswer(expected);
  return JSON.stringify(normalizedActual) === JSON.stringify(normalizedExpected);
}

function answerForQuestion(answerMap, snapshotQuestion) {
  const rawAnswer = answerMap.get(String(snapshotQuestion.questionId));
  return resolveAnswerFromOptions(rawAnswer, snapshotQuestion.options || []);
}

export function scoreAttempt(questionSnapshot, submittedAnswers) {
  const answerMap = new Map(
    (submittedAnswers || []).map((item) => [String(item.questionId), item.answer])
  );

  let score = 0;
  let attempted = 0;
  let correct = 0;

  for (const snapshotQuestion of questionSnapshot) {
    const answer = answerForQuestion(answerMap, snapshotQuestion);
    const hasAnswer =
      answer !== undefined &&
      answer !== null &&
      !(typeof answer === "string" && answer.trim() === "") &&
      !(Array.isArray(answer) && answer.length === 0);

    if (!hasAnswer) continue;

    attempted += 1;
    if (areEqualAnswers(answer, snapshotQuestion.correctAnswer)) {
      score += snapshotQuestion.marks;
      correct += 1;
    } else {
      score -= snapshotQuestion.negativeMarks || 0;
    }
  }

  return {
    score: Number(score.toFixed(2)),
    attempted,
    correct,
    total: questionSnapshot.length
  };
}
