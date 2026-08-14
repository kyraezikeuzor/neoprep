"use client";

import { useEffect, useRef, useState } from "react";
import MathText from "./MathText";
import GraphRenderer, { type GraphSpec } from "./graphs/GraphRenderer";
import { getRandomQuestion, submitAttempt, type Question } from "@/app/actions";
import { submitAssignmentProgress } from "@/app/bootcamp-actions";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";
import { MATH_DOMAINS } from "@/lib/subjects";
import { splitLeadingEquations } from "@/lib/mathText";
import { useRouter } from "next/navigation";
import DesmosCalculatorPanel, { CalculatorButton } from "./DesmosCalculator";
import HighlightsNotesPanel, {
  type Highlight,
} from "./HighlightsNotes";
import ReportIssueModal from "./ReportIssueModal";
import { usePracticeSession } from "@/components/PracticeSessionProvider";
import SessionQuestionNavigator from "@/components/SessionQuestionNavigator";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function isCorrectAnswer(selected: string, correct: string) {
  const a = normalize(selected);
  const b = normalize(correct);
  if (a === b) return true;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  return false;
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCorrectDisplay(question: Question) {
  const key = question.correct_answer?.trim() ?? "";
  if (question.choices && key in question.choices) {
    return { letter: key, text: question.choices[key] };
  }
  const upper = key.toUpperCase();
  if (question.choices && upper in question.choices) {
    return { letter: upper, text: question.choices[upper] };
  }
  return { letter: null as string | null, text: key };
}

/** Split SAT rationales so each new sentence starts on its own line. */
function splitRationaleByChoices(text: string): string[] {
  let cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  // Bank text often jams sentences: "well.Choice B" → "well. Choice B"
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, "$1 $2");

  // Split after sentence-ending punctuation when a new sentence follows.
  // Skip common abbreviations (Mr./Mrs./Ms./Dr./etc.).
  const parts = cleaned
    .split(
      /(?<=(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|approx))[.!?])(?=\s+[A-Z])/
    )
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length > 1) return parts;

  const byChoice = cleaned
    .split(/(?=\bChoice\s+[A-D]\b)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byChoice.length > 1) return byChoice;

  return [cleaned];
}

/** Split passage/stimulus from the question prompt when the stem packs both. */
function splitStimulusFromStem(stem: string): {
  stimulus: string | null;
  question: string;
  dualTexts: { label1: string; body1: string; label2: string; body2: string } | null;
} {
  const text = stem.trim();
  if (!text) return { stimulus: null, question: text, dualTexts: null };

  const QUESTION_START =
    /(?:Based on the texts|Which choice|Which of the following|What is the main|The author of Text|As used in|According to|Both authors|Based on Text)/i;

  // Dual-text items (Text 1 / Text 2) — match College Board layout
  if (/Text\s*1\b/i.test(text) && /Text\s*2\b/i.test(text)) {
    const text2Match = text.match(/\bText\s*2\b/i);
    const text2Index = text2Match?.index ?? -1;

    // Question may follow with or without a newline (bank often jams it inline)
    let qStart = -1;
    const afterText2 = text2Index >= 0 ? text.slice(text2Index) : text;
    const qInTail = afterText2.search(QUESTION_START);
    if (qInTail >= 0) {
      qStart = (text2Index >= 0 ? text2Index : 0) + qInTail;
    } else {
      const qAnywhere = text.search(QUESTION_START);
      if (qAnywhere > 0) qStart = qAnywhere;
    }

    if (text2Index > 0 && qStart > text2Index) {
      const raw1 = text.slice(0, text2Index).trim();
      const raw2 = text.slice(text2Index, qStart).trim();
      const question = text.slice(qStart).trim();

      const parseHalf = (raw: string, n: 1 | 2) => {
        const m = raw.match(new RegExp(`^Text\\s*${n}\\b[:.\\s]*`, "i"));
        const label = `Text ${n}`;
        const body = (m ? raw.slice(m[0].length) : raw).trim();
        return { label, body };
      };

      const t1 = parseHalf(raw1, 1);
      const t2 = parseHalf(raw2, 2);

      return {
        stimulus: `${t1.label}\n${t1.body}\n\n${t2.label}\n${t2.body}`,
        question,
        dualTexts: {
          label1: t1.label,
          body1: t1.body,
          label2: t2.label,
          body2: t2.body,
        },
      };
    }
  }

  // Passage + question separated by a blank line; last block is the prompt
  const blocks = text.split(/\n\n+/);
  if (blocks.length >= 2) {
    const last = blocks[blocks.length - 1].trim();
    const prior = blocks.slice(0, -1).join("\n\n").trim();
    if (
      prior.length > 100 &&
      /^(Which|What|Based on|According to|The primary|As used|How |Why |The author)/i.test(
        last
      )
    ) {
      return { stimulus: prior, question: last, dualTexts: null };
    }
  }

  // Single-line / jammed stem: passage then question prompt
  const jammedQ = text.search(
    /(?<=[.!?…"'”])\s+(?=(?:Based on|Which choice|Which of the following|According to|As used))/i
  );
  if (jammedQ > 80) {
    return {
      stimulus: text.slice(0, jammedQ).trim(),
      question: text.slice(jammedQ).trim(),
      dualTexts: null,
    };
  }

  return { stimulus: null, question: text, dualTexts: null };
}

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "Random" },
  { value: 1, label: "Easy" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hard" },
];

const PANEL_W = "26rem";

export default function QuestionCard({
  initialQuestion,
  embedded = false,
  initialSubject = "all",
  initialTier = "all",
  /** When set (e.g. 5 from Question Bank), practice ends after this many questions. */
  sessionLength,
  /** Fixed question list (assignment practice). Overrides random bank fetching. */
  questionQueue,
  assignmentId,
  sessionExitHref = "/question-bank",
  sessionExitLabel = "Back to Question Bank",
  hideFilters = false,
  initialSessionResults,
  initialHistoryIndex = 0,
}: {
  initialQuestion: Question | null;
  /** Tighter top padding when nested (e.g. Question Search card) */
  embedded?: boolean;
  initialSubject?: SubjectFilter;
  initialTier?: TierFilter;
  sessionLength?: number;
  questionQueue?: Question[];
  assignmentId?: string;
  sessionExitHref?: string;
  sessionExitLabel?: string;
  hideFilters?: boolean;
  /** Pre-hydrate session answers (e.g. assignment_progress on re-entry). */
  initialSessionResults?: Record<string, { correct: boolean; selectedAnswer: string }>;
  /** Start index into questionQueue / history (e.g. first unanswered). */
  initialHistoryIndex?: number;
}) {
  const router = useRouter();
  const { setPracticeActive } = usePracticeSession();
  const isAssignmentMode = Boolean(assignmentId) && Boolean(questionQueue?.length);
  const [history, setHistory] = useState<Question[]>(() => {
    if (questionQueue && questionQueue.length > 0) return [...questionQueue];
    return initialQuestion ? [initialQuestion] : [];
  });
  const startIndex = (() => {
    const len = questionQueue?.length ?? (initialQuestion ? 1 : 0);
    if (len <= 0) return 0;
    return Math.min(Math.max(0, initialHistoryIndex), len - 1);
  })();
  const [historyIndex, setHistoryIndex] = useState(startIndex);
  const question = history[historyIndex] ?? null;

  const [sessionResults, setSessionResults] = useState<
    Record<string, { correct: boolean; selectedAnswer: string }>
  >(() => initialSessionResults ?? {});

  const initialRestored = (() => {
    const q = questionQueue?.[startIndex] ?? initialQuestion ?? null;
    if (!q || !initialSessionResults) return null;
    return initialSessionResults[q.question_id] ?? null;
  })();

  const [selected, setSelected] = useState<string>(
    () => initialRestored?.selectedAnswer ?? ""
  );
  const [submitted, setSubmitted] = useState(() => Boolean(initialRestored));
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    () => (initialRestored ? initialRestored.correct : null)
  );
  const [showExplanation, setShowExplanation] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loadingNext, setLoadingNext] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeHidden, setTimeHidden] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierFilter>(initialTier);
  const [selectedSubject, setSelectedSubject] = useState<SubjectFilter>(initialSubject);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewingFromResults, setReviewingFromResults] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(() => new Set());
  const [eliminated, setEliminated] = useState<Set<string>>(() => new Set());
  const [topicOpen, setTopicOpen] = useState(false);
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const [selectPulse, setSelectPulse] = useState<{ letter: string; n: number } | null>(null);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const topicRef = useRef<HTMLDivElement>(null);
  const difficultyRef = useRef<HTMLDivElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qbPrefetchDone = useRef(false);

  /** Local browsing-session position (1-based). Not a DB set/session id. */
  const sessionQuestionNumber = historyIndex + 1;
  const effectiveSessionLength =
    isAssignmentMode && questionQueue
      ? questionQueue.length
      : typeof sessionLength === "number" && sessionLength > 0
        ? sessionLength
        : 0;
  const isFixedSession = effectiveSessionLength > 0;
  const isLastSessionQuestion =
    isFixedSession && sessionQuestionNumber >= effectiveSessionLength;
  const sessionCorrectCount = Object.values(sessionResults).filter((r) => r.correct).length;
  const missedSessionQuestions = history.filter(
    (q) => sessionResults[q.question_id]?.correct === false
  );
  const isMarkedForReview = question
    ? markedForReview.has(question.question_id)
    : false;

  const canGoPrevious = historyIndex > 0;
  const isMathQuestion =
    !!question?.domain &&
    (MATH_DOMAINS as readonly string[]).includes(question.domain);

  useEffect(() => {
    setPracticeActive(true);
    return () => setPracticeActive(false);
  }, [setPracticeActive]);

  // Prefetch remaining Question Bank session questions so the navigator can jump freely.
  useEffect(() => {
    if (isAssignmentMode || !isFixedSession || qbPrefetchDone.current) return;
    qbPrefetchDone.current = true;
    let cancelled = false;

    (async () => {
      const collected: Question[] = [];
      const seen = new Set<string>();
      if (initialQuestion) {
        collected.push(initialQuestion);
        seen.add(initialQuestion.question_id);
      }
      while (collected.length < effectiveSessionLength && !cancelled) {
        const next = await getRandomQuestion({
          excludeId: collected[collected.length - 1]?.question_id,
          tier: selectedTier,
          subject: selectedSubject,
        });
        if (!next || seen.has(next.question_id)) break;
        seen.add(next.question_id);
        collected.push(next);
      }
      if (!cancelled && collected.length > 0) {
        setHistory((prev) => {
          if (prev.length >= effectiveSessionLength) return prev;
          const merged = [...prev];
          for (const q of collected) {
            if (!merged.some((p) => p.question_id === q.question_id)) {
              merged.push(q);
            }
            if (merged.length >= effectiveSessionLength) break;
          }
          return merged;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePassageMouseUp() {
    if (!highlightsOpen) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const text = sel.toString().trim();
    if (!text) return;
    const range = sel.getRangeAt(0);
    if (!passageRef.current || !passageRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const id = crypto.randomUUID();
    const mark = document.createElement("mark");
    mark.className = "bg-yellow-200/70 rounded-sm px-0.5";
    mark.dataset.highlightId = id;
    try {
      range.surroundContents(mark);
    } catch {
      // Selection spans multiple elements — skip the visual wrap, still record the note.
    }
    sel.removeAllRanges();
    setHighlights((h) => [...h, { id, text, note: "" }]);
  }

  function updateHighlightNote(id: string, note: string) {
    setHighlights((h) => h.map((x) => (x.id === id ? { ...x, note } : x)));
  }

  function removeHighlight(id: string) {
    setHighlights((h) => h.filter((x) => x.id !== id));
    const el = passageRef.current?.querySelector<HTMLElement>(`[data-highlight-id="${id}"]`);
    if (el?.parentNode) {
      const parent = el.parentNode;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize();
    }
  }

  function toggleMarkForReview() {
    if (!question) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(question.question_id)) next.delete(question.question_id);
      else next.add(question.question_id);
      return next;
    });
  }

  function toggleEliminate(letter: string) {
    setEliminated((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) next.delete(letter);
      else next.add(letter);
      return next;
    });
  }

  function openHighlightsPanel() {
    setHighlightsOpen((o) => {
      const next = !o;
      if (next) {
        setShowExplanation(false);
        setCalculatorOpen(false);
      }
      return next;
    });
  }

  function resetAttemptState() {
    setSelected("");
    setSubmitted(false);
    setIsCorrect(null);
    setShowExplanation(false);
    setSelectPulse(null);
  }

  function restoreOrResetForQuestion(q: Question) {
    const result = sessionResults[q.question_id];
    if (result) {
      setSelected(result.selectedAnswer);
      setIsCorrect(result.correct);
      setSubmitted(true);
      setShowExplanation(false);
      setSelectPulse(null);
    } else {
      resetAttemptState();
    }
  }

  function jumpToSessionQuestion(index: number) {
    if (index < 0 || index >= history.length) return;
    const q = history[index];
    if (!q) return;
    setHistoryIndex(index);
    setReviewingFromResults(false);
    setSessionComplete(false);
    restoreOrResetForQuestion(q);
    setNavigatorOpen(false);
    setCalculatorOpen(false);
    setHighlightsOpen(false);
  }

  function applyQuestion(next: Question | null, mode: "replace" | "append") {
    if (!next) {
      if (mode === "replace") {
        setHistory([]);
        setHistoryIndex(0);
      }
      resetAttemptState();
      return;
    }
    if (mode === "replace") {
      setHistory([next]);
      setHistoryIndex(0);
    } else {
      setHistory((h) => {
        const at = Math.min(historyIndex, h.length - 1);
        return [...h.slice(0, at + 1), next];
      });
      setHistoryIndex((i) => i + 1);
    }
    resetAttemptState();
  }

  useEffect(() => {
    setElapsed(0);
    setIsPaused(false);
    setTimeHidden(false);
    setEliminated(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.question_id]);

  useEffect(() => {
    if (!isMathQuestion) setCalculatorOpen(false);
  }, [isMathQuestion]);

  useEffect(() => {
    if (!topicOpen && !difficultyOpen) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (topicOpen && topicRef.current && !topicRef.current.contains(target)) {
        setTopicOpen(false);
      }
      if (
        difficultyOpen &&
        difficultyRef.current &&
        !difficultyRef.current.contains(target)
      ) {
        setDifficultyOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTopicOpen(false);
        setDifficultyOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [topicOpen, difficultyOpen]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!submitted && !isPaused) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [question?.question_id, submitted, isPaused]);

  async function loadFilteredQuestion(excludeId?: string) {
    setLoadingNext(true);
    if (isAssignmentMode && questionQueue) {
      const nextIndex = history.length;
      const next = questionQueue[nextIndex] ?? null;
      applyQuestion(next, "append");
      setLoadingNext(false);
      return;
    }
    const next = await getRandomQuestion({
      excludeId,
      tier: selectedTier,
      subject: selectedSubject,
    });
    applyQuestion(next, "append");
    setLoadingNext(false);
  }

  async function handleSubmit() {
    if (!question || !selected) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const correct = isCorrectAnswer(selected, question.correct_answer);
    setIsCorrect(correct);
    setSubmitted(true);
    if (isFixedSession) {
      setSessionResults((prev) => ({
        ...prev,
        [question.question_id]: { correct, selectedAnswer: selected },
      }));
    }

    try {
      await submitAttempt({
        questionId: question.question_id,
        selectedAnswer: selected,
        isCorrect: correct,
        timeSpentSec: elapsed,
      });
      if (isAssignmentMode && assignmentId != null) {
        await submitAssignmentProgress({
          assignmentId,
          questionId: question.question_id,
          isCorrect: correct,
          selectedAnswer: selected,
        });
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  function handlePrevious() {
    if (!canGoPrevious) return;
    const nextIndex = historyIndex - 1;
    const q = history[nextIndex];
    setHistoryIndex(nextIndex);
    if (q) restoreOrResetForQuestion(q);
    else resetAttemptState();
  }

  async function handleNext() {
    // Re-walk forward through history if we previously went back
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const q = history[nextIndex];
      setHistoryIndex(nextIndex);
      if (q) restoreOrResetForQuestion(q);
      else resetAttemptState();
      return;
    }

    if (isFixedSession && history.length >= effectiveSessionLength) {
      if (!submitted) return;
      setSessionComplete(true);
      return;
    }

    await loadFilteredQuestion(question?.question_id);
  }

  async function startAnotherSession() {
    if (isAssignmentMode) {
      router.push(sessionExitHref);
      router.refresh();
      return;
    }
    setLoadingNext(true);
    setSessionComplete(false);
    setReviewingFromResults(false);
    setSessionResults({});
    setMarkedForReview(new Set());
    setHighlights([]);
    setCalculatorOpen(false);
    setHighlightsOpen(false);
    qbPrefetchDone.current = false;
    const first = await getRandomQuestion({
      tier: selectedTier,
      subject: selectedSubject,
    });
    const collected: Question[] = [];
    const seen = new Set<string>();
    if (first) {
      collected.push(first);
      seen.add(first.question_id);
    }
    while (collected.length < effectiveSessionLength) {
      const next = await getRandomQuestion({
        excludeId: collected[collected.length - 1]?.question_id,
        tier: selectedTier,
        subject: selectedSubject,
      });
      if (!next || seen.has(next.question_id)) break;
      seen.add(next.question_id);
      collected.push(next);
    }
    qbPrefetchDone.current = true;
    if (collected.length) {
      setHistory(collected);
      setHistoryIndex(0);
    } else {
      setHistory([]);
      setHistoryIndex(0);
    }
    resetAttemptState();
    setLoadingNext(false);
  }

  function returnToBankLanding() {
    router.push(sessionExitHref);
    router.refresh();
  }

  function reviewMissedQuestion(questionId: string) {
    const idx = history.findIndex((q) => q.question_id === questionId);
    if (idx < 0) return;
    const result = sessionResults[questionId];
    setSessionComplete(false);
    setReviewingFromResults(true);
    setHistoryIndex(idx);
    setSelected(result?.selectedAnswer ?? "");
    setIsCorrect(result ? result.correct : false);
    setSubmitted(true);
    setShowExplanation(true);
    setCalculatorOpen(false);
    setHighlightsOpen(false);
  }

  function backToSessionResults() {
    setReviewingFromResults(false);
    setSessionComplete(true);
    setShowExplanation(false);
    setCalculatorOpen(false);
    setHighlightsOpen(false);
    resetAttemptState();
  }

  async function handleTierSelect(tier: TierFilter) {
    setDifficultyOpen(false);
    if (tier === selectedTier) return;
    setSelectedTier(tier);
    setLoadingNext(true);
    const next = await getRandomQuestion({
      excludeId: question?.question_id,
      tier,
      subject: selectedSubject,
    });
    applyQuestion(next, "replace");
    setLoadingNext(false);
  }

  async function handleSubjectChange(subject: SubjectFilter) {
    setTopicOpen(false);
    if (subject === selectedSubject) return;
    setSelectedSubject(subject);
    setLoadingNext(true);
    const next = await getRandomQuestion({
      excludeId: question?.question_id,
      tier: selectedTier,
      subject,
    });
    applyQuestion(next, "replace");
    setLoadingNext(false);
  }

  if (!question && !sessionComplete) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16 text-center">
        <p className="text-sm text-arc-muted">No questions available right now.</p>
      </div>
    );
  }

  if (sessionComplete && isFixedSession) {
    const total = effectiveSessionLength;
    const correct = sessionCorrectCount;
    return (
      <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto px-10 py-12 sm:px-14 lg:px-16">
        <div className="w-full max-w-md">
          <div className="text-center">
            <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
              Session complete
            </p>
            <h2 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[#3F3F46]">
              {correct} of {total} correct
            </h2>
          </div>

          {missedSessionQuestions.length > 0 && (
            <div className="mt-6">
              <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
                Missed
              </p>
              <ul className="mt-2 divide-y divide-[#E5E7EB] rounded-2xl border-2 border-[#E5E7EB] bg-white">
                {missedSessionQuestions.map((q) => {
                  const tag = [q.domain, q.skill].filter(Boolean).join(" · ") || "Question";
                  return (
                    <li key={q.question_id}>
                      <button
                        type="button"
                        onClick={() => reviewMissedQuestion(q.question_id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#FAFAFA]"
                      >
                        <span className="min-w-0 truncate font-sans text-sm font-medium text-arc-ink">
                          {tag}
                        </span>
                        <span className="shrink-0 font-sans text-xs font-medium text-[#007AFF]">
                          Review
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            {!isAssignmentMode && (
              <button
                type="button"
                onClick={startAnotherSession}
                disabled={loadingNext}
                className="rounded-full bg-[#007AFF] px-6 py-3 font-sans text-base font-semibold text-white transition hover:bg-[#0066DD] disabled:opacity-60"
              >
                {loadingNext ? "Loading..." : "Practice 5 More"}
              </button>
            )}
            <button
              type="button"
              onClick={returnToBankLanding}
              className="rounded-full border-2 border-[#E5E7EB] bg-white px-6 py-3 font-sans text-base font-semibold text-arc-ink transition hover:bg-[#F7F7F7]"
            >
              {sessionExitLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16 text-center">
        <p className="text-sm text-arc-muted">No questions available right now.</p>
      </div>
    );
  }

  const isGridIn = !question.choices || Object.keys(question.choices).length === 0;
  const panelOpen = submitted && showExplanation;
  const sidePanelOpen = panelOpen || calculatorOpen || highlightsOpen;
  const correctDisplay = formatCorrectDisplay(question);

  const { equations: leadingEquations, prose: equationProse } =
    splitLeadingEquations(question.stem);
  const {
    stimulus: readingStimulus,
    question: readingQuestion,
    dualTexts,
  } = splitStimulusFromStem(
    leadingEquations.length > 0 ? equationProse : question.stem
  );
  const hasStemImage = Boolean(question.image_urls?.stem);
  const hasGraph = Boolean(question.graph_spec);
  const leftStimulusText =
    leadingEquations.length > 0
      ? leadingEquations.join("\n")
      : readingStimulus;
  const rightStemText =
    leadingEquations.length > 0
      ? readingStimulus
        ? readingQuestion
        : equationProse
      : readingStimulus
        ? readingQuestion
        : question.stem;
  const hasLeftPanel =
    hasGraph ||
    leadingEquations.length > 0 ||
    hasStemImage ||
    Boolean(readingStimulus);

  const TOPIC_OPTIONS: { value: SubjectFilter; label: string }[] = [
    { value: "all", label: "Random" },
    { value: "math", label: "Math" },
    { value: "reading_writing", label: "Reading & Writing" },
  ];

  const selectedTierLabel =
    TIER_OPTIONS.find((o) => o.value === selectedTier)?.label ?? "Random";
  const selectedTopicLabel =
    TOPIC_OPTIONS.find((o) => o.value === selectedSubject)?.label ?? "Random";

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Header stays full-width — side panels never compress it */}
      <div className={`shrink-0 px-6 sm:px-8 ${embedded ? "pt-3" : "pt-2"}`}>
          {/* Topic · Difficulty · timer · calculator — single compact row */}
          <div className="w-full border-b border-arc-line pb-1.5">
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex min-w-0 flex-wrap items-center justify-start gap-2">
                <button
                  type="button"
                  onClick={returnToBankLanding}
                  className="rounded-lg bg-arc-ink px-3.5 py-1.5 font-sans text-sm font-semibold text-white transition hover:bg-[#2D2D2D]"
                >
                  Exit
                </button>
                {!hideFilters && (
                  <>
                <div className="relative shrink-0" ref={topicRef}>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={topicOpen}
                    onClick={() => {
                      setTopicOpen((o) => !o);
                      setDifficultyOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F7F7F7] px-3 py-1.5 font-sans text-sm font-normal text-arc-ink transition hover:bg-[#EFEFEF]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-[#6B6B6B]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 19.5A2.5 2.5 0 016.5 17H20"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
                      />
                      <path strokeLinecap="round" d="M9 7h6M9 11h4" />
                    </svg>
                    <span>{selectedTopicLabel}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-3.5 w-3.5 text-arc-ink transition ${topicOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {topicOpen && (
                    <div
                      role="listbox"
                      aria-label="Topic"
                      className="absolute left-0 top-full z-40 mt-2 w-64 rounded-2xl border border-arc-line bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                    >
                      <p className="mb-2 px-2 pt-1 text-sm font-semibold text-arc-ink">Topic</p>
                      <div className="space-y-0.5">
                        {TOPIC_OPTIONS.map((opt) => {
                          const selected = selectedSubject === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => handleSubjectChange(opt.value)}
                              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-arc-ink transition hover:bg-[#F3F4F6]"
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                  selected
                                    ? "border-arc-ink bg-arc-ink"
                                    : "border-[#D1D5DB] bg-white"
                                }`}
                                aria-hidden
                              >
                                {selected && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </span>
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative shrink-0" ref={difficultyRef}>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={difficultyOpen}
                    onClick={() => {
                      setDifficultyOpen((o) => !o);
                      setTopicOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F7F7F7] px-3 py-1.5 font-sans text-sm font-normal text-arc-ink transition hover:bg-[#EFEFEF]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-[#6B6B6B]"
                      fill="currentColor"
                      aria-hidden
                    >
                      <rect x="4" y="14" width="3.5" height="6" rx="0.5" />
                      <rect x="10.25" y="9" width="3.5" height="11" rx="0.5" />
                      <rect x="16.5" y="4" width="3.5" height="16" rx="0.5" />
                    </svg>
                    <span>{selectedTierLabel}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-3.5 w-3.5 text-arc-ink transition ${
                        difficultyOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {difficultyOpen && (
                    <div
                      role="listbox"
                      aria-label="Difficulty"
                      className="absolute left-0 top-full z-40 mt-2 w-56 rounded-2xl border border-arc-line bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                    >
                      <p className="mb-2 px-2 pt-1 text-sm font-semibold text-arc-ink">
                        Difficulty
                      </p>
                      <div className="space-y-0.5">
                        {TIER_OPTIONS.map((opt) => {
                          const selected = selectedTier === opt.value;
                          return (
                            <button
                              key={String(opt.value)}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => handleTierSelect(opt.value)}
                              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-arc-ink transition hover:bg-[#F3F4F6]"
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                  selected
                                    ? "border-arc-ink bg-arc-ink"
                                    : "border-[#D1D5DB] bg-white"
                                }`}
                                aria-hidden
                              >
                                {selected && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </span>
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 justify-self-center">
                {timeHidden ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-arc-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-label="Timer hidden"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                  </svg>
                ) : (
                  <p className="text-lg font-semibold tabular-nums leading-none text-arc-ink">
                    {formatTime(elapsed)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => !submitted && setIsPaused((p) => !p)}
                  disabled={submitted}
                  aria-label={isPaused ? "Resume timer" : "Pause timer"}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-arc-line text-arc-muted transition hover:bg-[#F3F4F6] hover:text-arc-ink disabled:opacity-40"
                >
                  {isPaused ? (
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current" aria-hidden>
                      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setTimeHidden((h) => !h)}
                  className="rounded-full border border-arc-line px-2 py-0.5 text-[11px] text-arc-muted transition hover:bg-[#F3F4F6] hover:text-arc-ink"
                >
                  {timeHidden ? "Show" : "Hide"}
                </button>
              </div>

              <div className="flex min-w-0 items-center justify-end gap-2">
                {isMathQuestion && (
                  <CalculatorButton
                    open={calculatorOpen}
                    onClick={() => {
                      setCalculatorOpen((o) => {
                        const next = !o;
                        if (next) {
                          setShowExplanation(false);
                          setHighlightsOpen(false);
                        }
                        return next;
                      });
                    }}
                  />
                )}
              </div>
            </div>
          </div>
      </div>

      {/* Question body + side panels (header above stays full width) */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Mobile scrim — only over question area */}
        <button
          type="button"
          aria-label="Close side panel"
          onClick={() => {
            setShowExplanation(false);
            setCalculatorOpen(false);
            setHighlightsOpen(false);
          }}
          className={`absolute inset-0 z-30 bg-arc-ink/20 transition-opacity duration-500 md:hidden ${
            sidePanelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Two-panel SAT layout */}
          <div
            ref={passageRef}
            onMouseUp={handlePassageMouseUp}
            className="relative flex min-h-0 flex-1 overflow-hidden"
          >
            {hasLeftPanel && (
              <div className="min-h-0 w-1/2 overflow-y-auto overscroll-contain px-8 py-7 sm:px-10 sm:py-8">
                <div className="question-prose mx-auto max-w-xl">
                  {hasGraph && (
                    <div className="mb-5">
                      <GraphRenderer spec={question.graph_spec as GraphSpec | null} />
                    </div>
                  )}
                  {leadingEquations.length > 0 && (
                    <MathText text={leftStimulusText!} className="math-text mb-4" />
                  )}
                  {leadingEquations.length === 0 && dualTexts && (
                    <div className="space-y-6">
                      <div>
                        <p className="mb-2 font-semibold">{dualTexts.label1}</p>
                        <MathText text={dualTexts.body1} className="math-text" />
                      </div>
                      <div>
                        <p className="mb-2 font-semibold">{dualTexts.label2}</p>
                        <MathText text={dualTexts.body2} className="math-text" />
                      </div>
                    </div>
                  )}
                  {leadingEquations.length === 0 && !dualTexts && readingStimulus && (
                    <MathText text={readingStimulus} className="math-text" />
                  )}
                  {hasStemImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={question.image_urls!.stem}
                      alt="Question figure"
                      className="mt-4 max-w-full rounded-md border border-arc-line"
                    />
                  )}
                </div>
              </div>
            )}

            {hasLeftPanel && (
              <div
                className="relative z-10 flex w-0 shrink-0 items-center justify-center"
                aria-hidden
              >
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-arc-line" />
                <div className="relative grid grid-cols-2 gap-0.5 rounded-sm bg-white px-1 py-1.5 text-[#9CA3AF]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="block h-0.5 w-0.5 rounded-full bg-current" />
                  ))}
                </div>
              </div>
            )}

            <div
              className={`flex min-h-0 min-w-0 flex-col overflow-hidden ${
                hasLeftPanel ? "w-1/2" : "w-full"
              }`}
            >
              {/* Question header — pill bar with black end caps */}
              <div className="shrink-0 px-4 pt-3 sm:px-6">
                <div className="flex h-9 w-full items-stretch overflow-hidden rounded-lg bg-[#F7F7F7]">
                  <span
                    className="flex aspect-square h-full shrink-0 items-center justify-center bg-arc-ink font-sans text-sm font-semibold tabular-nums text-white"
                    aria-label={`Question ${sessionQuestionNumber}`}
                  >
                    {sessionQuestionNumber}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3">
                    <button
                      type="button"
                      onClick={toggleMarkForReview}
                      aria-pressed={isMarkedForReview}
                      className={`inline-flex items-center gap-1.5 font-sans text-sm transition ${
                        isMarkedForReview
                          ? "font-medium text-arc-ink"
                          : "text-[#5A5A5A] hover:text-arc-ink"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill={isMarkedForReview ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                      Mark for Review
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={openHighlightsPanel}
                        aria-label="Notes"
                        className="rounded-md p-1 text-[#6B6B6B] transition hover:text-arc-ink"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 4h7l3 3v13a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1z"
                          />
                          <path strokeLinecap="round" d="M15 4v3h3M9 11h6M9 15h6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportOpen(true)}
                        aria-label="Report a problem"
                        className="inline-flex items-center gap-1.5 rounded-md py-1 font-sans text-sm text-[#6B6B6B] transition hover:text-arc-ink"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 4v16M5 5h9l-1 3.5L14 12H5"
                          />
                        </svg>
                        Report
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openHighlightsPanel}
                    aria-pressed={highlightsOpen}
                    aria-label={highlightsOpen ? "Close highlight" : "Open highlight"}
                    className={`relative flex aspect-square h-full shrink-0 items-center justify-center text-white transition ${
                      highlightsOpen ? "bg-[#007AFF]" : "bg-arc-ink hover:bg-[#2D2D2D]"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="7.5" />
                      <path strokeLinecap="round" d="M7 12h10" />
                    </svg>
                    {highlights.length > 0 && (
                      <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-[#007AFF] px-0.5 text-[9px] font-semibold leading-none text-white ring-2 ring-[#F7F7F7]">
                        {highlights.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4 pt-5 sm:px-8 sm:pt-6">
                <div className={`mx-auto min-w-0 w-full ${hasLeftPanel ? "max-w-xl" : "max-w-2xl"}`}>
                  <div className="question-prose mb-6">
                    <MathText text={rightStemText} className="math-text" />
                    {!hasLeftPanel && hasStemImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={question.image_urls!.stem}
                        alt="Question figure"
                        className="mt-4 max-w-full rounded-md border border-arc-line"
                      />
                    )}
                    {!hasLeftPanel && hasGraph && (
                      <div className="mt-4">
                        <GraphRenderer spec={question.graph_spec as GraphSpec | null} />
                      </div>
                    )}
                  </div>

                  {isGridIn ? (
                    <input
                      type="text"
                      value={selected}
                      disabled={submitted}
                      onChange={(e) => setSelected(e.target.value)}
                      placeholder="Enter your answer"
                      className={`question-prose choice-text w-full rounded-md border px-4 py-3 outline-none transition ${
                        submitted
                          ? isCorrect
                            ? "border-[#2E7D32] bg-[#F1FAF3] text-[#2E7D32]"
                            : "border-arc-incorrect bg-arc-incorrectBg text-arc-incorrect"
                          : "border-arc-line focus:border-[#007AFF]"
                      }`}
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {Object.entries(question.choices!).map(([letter, text]) => {
                        const isSelected = selected === letter;
                        const isEliminated = eliminated.has(letter);
                        const isTheCorrectAnswer =
                          normalize(letter) === normalize(question.correct_answer);
                        const isWrongPick =
                          submitted && isSelected && !isTheCorrectAnswer;

                        let stateClasses =
                          "border border-arc-muted/40 bg-white hover:border-arc-muted/70";
                        let bubbleClasses =
                          "border-arc-muted/50 bg-transparent text-arc-ink";

                        if (submitted) {
                          if (isTheCorrectAnswer) {
                            stateClasses = "border-2 border-[#2E7D32] bg-[#F1FAF3]";
                            bubbleClasses = "border-[#2E7D32] bg-[#2E7D32] text-white";
                          } else if (isWrongPick) {
                            stateClasses = "border-2 border-[#E85A54] bg-[#FCE8E6]";
                            bubbleClasses = "border-[#E85A54] bg-[#E85A54] text-white";
                          } else {
                            stateClasses =
                              "border border-arc-muted/30 bg-white opacity-55";
                            bubbleClasses =
                              "border-arc-muted/40 bg-transparent text-arc-ink/50";
                          }
                        } else if (isSelected) {
                          stateClasses =
                            "border-[3px] border-[#007AFF] bg-[#F0F7FF] shadow-[0_0_0_1px_rgba(0,122,255,0.12)]";
                          bubbleClasses = "border-[#007AFF] bg-[#007AFF] text-white";
                        } else if (isEliminated) {
                          stateClasses = "border border-arc-muted/30 bg-white opacity-60";
                          bubbleClasses =
                            "border-arc-muted/40 bg-transparent text-arc-ink/50";
                        }

                        const isPulsing = selectPulse?.letter === letter;

                        return (
                          <div key={letter} className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={submitted}
                              onClick={() => {
                                setSelected(letter);
                                setSelectPulse(null);
                                window.setTimeout(() => {
                                  setSelectPulse({ letter, n: Date.now() });
                                }, 0);
                              }}
                              onAnimationEnd={(e) => {
                                if (e.target === e.currentTarget) setSelectPulse(null);
                              }}
                              className={`question-prose choice-text flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-150 ${stateClasses}${
                                isPulsing ? " choice-select-pulse" : ""
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-sans text-sm font-semibold ${bubbleClasses}`}
                                aria-hidden={isWrongPick}
                              >
                                {isWrongPick ? (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                  >
                                    <path d="M6 6l12 12M18 6L6 18" />
                                  </svg>
                                ) : (
                                  letter
                                )}
                              </span>
                              <MathText
                                text={text}
                                className={`math-text min-w-0 flex-1 ${
                                  isEliminated && !submitted ? "line-through opacity-70" : ""
                                }`}
                              />
                              {question.image_urls?.[`choice_${letter}`] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={question.image_urls[`choice_${letter}`]}
                                  alt={`Choice ${letter}`}
                                  className="max-h-10"
                                />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={submitted}
                              onClick={() => toggleEliminate(letter)}
                              aria-label={
                                isEliminated
                                  ? `Restore choice ${letter}`
                                  : `Eliminate choice ${letter}`
                              }
                              aria-pressed={isEliminated}
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-sans text-sm font-medium transition disabled:opacity-40 ${
                                isEliminated
                                  ? "border-arc-ink bg-arc-ink text-white"
                                  : "border-arc-line bg-white text-arc-muted hover:border-arc-muted hover:text-arc-ink"
                              }`}
                            >
                              <span className="relative leading-none">
                                {letter}
                                <span
                                  className="absolute left-1/2 top-1/2 h-px w-[1.1em] -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] bg-current"
                                  aria-hidden
                                />
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Bottom action bar — pinned in layout, never off-screen */}
        <div className="z-20 shrink-0 border-t border-arc-line bg-white px-6 py-3 sm:px-8">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="min-w-0 justify-self-start">
              {isFixedSession ? (
                <button
                  type="button"
                  onClick={() => setNavigatorOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-arc-ink px-4 py-2 font-sans text-sm font-semibold tabular-nums text-white transition hover:bg-[#2D2D2D]"
                  aria-haspopup="dialog"
                  aria-expanded={navigatorOpen}
                >
                  {sessionQuestionNumber} of {effectiveSessionLength}
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-3.5 w-3.5 transition ${navigatorOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.5 7.5L10 12l4.5-4.5"
                    />
                  </svg>
                </button>
              ) : (
                <>
                  <p className="truncate text-xs font-normal leading-snug text-arc-muted sm:text-sm">
                    {question.domain || "Domain"}
                  </p>
                  {question.skill && (
                    <p className="mt-0.5 truncate text-xs font-normal leading-snug text-arc-muted sm:text-sm">
                      {question.skill}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 justify-self-center">
              {submitted && (
                <button
                  type="button"
                  onClick={() => {
                    setShowExplanation((s) => {
                      const next = !s;
                      if (next) {
                        setCalculatorOpen(false);
                        setHighlightsOpen(false);
                      }
                      return next;
                    });
                  }}
                  aria-expanded={panelOpen}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 font-sans text-sm font-medium transition ${
                    panelOpen
                      ? "bg-[#E5E5E5] text-[#4B4B4B]"
                      : "bg-[#F2F2F2] text-[#666666] hover:bg-[#EBEBEB]"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 8.2l1.4 1.4 3-3.2"
                    />
                    <circle cx="6.2" cy="14.2" r="1.35" fill="currentColor" stroke="none" />
                    <path strokeLinecap="round" d="M11 8.5h8.5M11 14.2h8.5" />
                  </svg>
                  Explanation
                </button>
              )}

              <div className="flex items-center justify-center gap-3">
                {reviewingFromResults ? (
                  <button
                    type="button"
                    onClick={backToSessionResults}
                    className="rounded-lg bg-[#007AFF] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#0066DD]"
                  >
                    Back to results
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={!canGoPrevious || loadingNext}
                      className="rounded-lg border border-arc-line bg-white px-6 py-3 text-base font-semibold text-arc-ink transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Back
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={submitted || !selected}
                      className="rounded-lg bg-[#007AFF] px-10 py-3 text-base font-semibold text-white transition hover:bg-[#0066DD] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Answer
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={
                        loadingNext ||
                        (isLastSessionQuestion &&
                          historyIndex >= history.length - 1 &&
                          !submitted)
                      }
                      className="rounded-lg border border-arc-line bg-white px-6 py-3 text-base font-semibold text-arc-ink transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loadingNext
                        ? "Loading..."
                        : isLastSessionQuestion && historyIndex >= history.length - 1
                          ? "Finish"
                          : "Next"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="min-w-0 justify-self-end text-right">
              {isFixedSession ? (
                <>
                  <p className="truncate text-xs font-normal leading-snug text-arc-muted sm:text-sm">
                    {question.domain || "Domain"}
                  </p>
                  {question.skill && (
                    <p className="mt-0.5 truncate text-xs font-normal leading-snug text-arc-muted sm:text-sm">
                      {question.skill}
                    </p>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Side explanation panel — only beside question body */}
      <aside
        aria-hidden={!panelOpen}
        className={`explanation-panel z-40 flex shrink-0 flex-col overflow-hidden bg-white ${
          panelOpen ? "explanation-panel--open" : ""
        }`}
        style={{ ["--panel-w" as string]: PANEL_W }}
      >
        <div className="explanation-panel__inner flex h-full min-h-0 flex-col border-l border-arc-line">
          <div className="flex items-center justify-between border-b border-arc-line px-5">
            <div className="flex gap-5" role="tablist" aria-label="Side panel">
              <button
                type="button"
                role="tab"
                aria-selected
                className="border-b-2 border-arc-ink py-3.5 text-sm font-semibold text-arc-ink"
              >
                Explanation
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              aria-label="Close explanation"
              className="rounded-md p-1.5 text-arc-muted transition hover:bg-[#F3F4F6] hover:text-arc-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 font-sans">
            <div className="mb-5 rounded-2xl border border-arc-line bg-white p-4">
              <p className="mb-3 text-sm font-medium text-arc-muted">Correct Answer</p>
              <div className="flex w-full items-center gap-3 rounded-xl bg-[#F1FAF3] px-3 py-2.5">
                {correctDisplay.letter && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-sm font-semibold text-white">
                    {correctDisplay.letter}
                  </span>
                )}
                <MathText
                  text={correctDisplay.text}
                  className="min-w-0 font-sans text-base font-medium text-arc-ink"
                />
              </div>
            </div>

            {question.rationale ? (
              <>
                <p className="mb-3 text-sm font-semibold text-arc-ink">Step-by-step explanation</p>
                <div className="space-y-4">
                  {splitRationaleByChoices(question.rationale).map((line, i) => (
                    <MathText
                      key={`${i}-${line.slice(0, 24)}`}
                      block
                      text={line}
                      className="font-sans text-base font-normal leading-relaxed text-arc-ink"
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-arc-muted">No explanation available for this question.</p>
            )}
          </div>
        </div>
      </aside>

      <DesmosCalculatorPanel
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
      />

      <HighlightsNotesPanel
        open={highlightsOpen}
        onClose={() => setHighlightsOpen(false)}
        highlights={highlights}
        onUpdateNote={updateHighlightNote}
        onRemove={removeHighlight}
      />

      <ReportIssueModal
        open={reportOpen}
        questionId={question.question_id}
        onClose={() => setReportOpen(false)}
      />

      {isFixedSession ? (
        <SessionQuestionNavigator
          open={navigatorOpen}
          onClose={() => setNavigatorOpen(false)}
          onJump={jumpToSessionQuestion}
          questions={history.map((q) => ({
            question_id: q.question_id,
            tier: q.tier,
          }))}
          total={effectiveSessionLength}
          currentIndex={historyIndex}
          results={sessionResults}
          markedForReview={markedForReview}
        />
      ) : null}
      </div>
    </div>
  );
}
