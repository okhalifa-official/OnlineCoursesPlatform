import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import StudentShell from "../components/StudentShell";
import {
  getCourseEnrollment,
  getEnrolledCourse,
  getUserToken,
  submitExamAttempt,
} from "../api/userApi";

// ── localStorage helpers ────────────────────────────────────────────────────
function progressKey(courseId)     { return `course-progress:${courseId}`; }
function attemptsCacheKey(courseId) { return `exam-attempts-cache:${courseId}`; }
function lastResultKey(courseId)   { return `exam-last:${courseId}`; }

function loadProgress(courseId) {
  try { return JSON.parse(localStorage.getItem(progressKey(courseId))) || {}; }
  catch { return {}; }
}
function readCachedAttempts(courseId) {
  const raw = Number(localStorage.getItem(attemptsCacheKey(courseId)));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}
function writeCachedAttempts(courseId, used) {
  try { localStorage.setItem(attemptsCacheKey(courseId), String(used)); } catch {}
}
// We persist the last finished attempt so the answers-review screen survives
// the student leaving the page (the server doesn't store individual answers).
function saveLastResult(courseId, payload) {
  try { localStorage.setItem(lastResultKey(courseId), JSON.stringify(payload)); } catch {}
}
function readLastResult(courseId) {
  try { return JSON.parse(localStorage.getItem(lastResultKey(courseId))); }
  catch { return null; }
}

/**
 * /learn/:id/exam — Single-question-per-page exam taker with:
 *   • Prev / Next navigation (Prev hidden if exam.allowPrevious is off)
 *   • Question tracker grid (current / answered / flagged / unanswered)
 *   • Flag-this-question toggle
 *   • Pre-submit "Review answers" summary page (lists every Q + flagged ones,
 *     lets the student jump back if previous-navigation is allowed)
 *   • Anti-cheat (tab-switch detection, configurable max)
 *   • Locked-down content: text selection, copy/paste, right-click blocked
 *   • Optional answers review after submission (immediately / after delay /
 *     never) — when granted the student sees their answer + the correct one.
 */
export default function ExamView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Stable URL the student can refresh on without losing access. When set, we
  // skip the intro and jump straight into the answers-review screen using the
  // payload saved to localStorage on submit.
  const isReviewRoute = location.pathname.endsWith("/exam/review");

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Phase: "intro" → "active" → "review-summary" → "finished" (+ optional "review-answers")
  const [phase, setPhase] = useState("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState("");
  const [result, setResult] = useState(null);

  // Refs for the always-on anti-cheat listeners.
  const phaseRef = useRef(phase);
  const violationsRef = useRef(0);
  const answersRef = useRef(answers);
  const examRef = useRef(null);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    if (!getUserToken()) { navigate("/login"); return; }
    Promise.all([
      getEnrolledCourse(id),
      getCourseEnrollment(id).catch(() => null),
    ])
      .then(([courseData, enrollmentData]) => {
        setCourse(courseData);
        setEnrollment(enrollmentData);
        if (enrollmentData) writeCachedAttempts(id, enrollmentData.examAttemptsUsed || 0);

        // Refresh-resilient review: when the URL is /exam/review, hydrate
        // the saved attempt from localStorage and skip the intro/active flow.
        if (isReviewRoute) {
          const saved = readLastResult(id);
          if (saved) {
            setResult(saved);
            phaseRef.current = "review-answers";
            setPhase("review-answers");
          }
        }
      })
      .catch((err) => {
        if (err.message === "Not enrolled") navigate(`/courses/${id}`, { replace: true });
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id, navigate, isReviewRoute]);

  const exam = course?.exam;
  const questions = exam?.questions || [];

  // ── Course-completion + attempt checks ────────────────────────────────────
  const { lectureCount, completedCount, courseComplete, attemptsLeft, maxAttempts, totalMarks } =
    useMemo(() => {
      if (!course) return {
        lectureCount: 0, completedCount: 0, courseComplete: false,
        attemptsLeft: 0, maxAttempts: 1, totalMarks: 0,
      };
      const modules = Array.isArray(course.modules) ? course.modules : [];
      const lectureCount = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);
      const progress = loadProgress(id);
      const completedCount = Object.values(progress).filter(Boolean).length;
      const maxAttempts = Math.max(1, Number(course.exam?.attempts) || 1);
      const attemptsUsed = Number.isFinite(enrollment?.examAttemptsUsed)
        ? enrollment.examAttemptsUsed
        : readCachedAttempts(id);
      const totalMarks = (course.exam?.questions || []).reduce(
        (s, q) => s + (Number(q.marks) || 0), 0
      );
      return {
        lectureCount, completedCount,
        courseComplete: lectureCount > 0 && completedCount >= lectureCount,
        attemptsLeft: Math.max(0, maxAttempts - attemptsUsed),
        maxAttempts, totalMarks,
      };
    }, [course, enrollment, id]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "active") return;
    if (secondsLeft <= 0) { submit("timeout"); return; }
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  // ── Anti-cheat (mounted once; reads via refs) ─────────────────────────────
  useEffect(() => { examRef.current = exam || null; }, [exam]);
  useEffect(() => {
    function violation(source) {
      const examNow = examRef.current;
      if (phaseRef.current !== "active" && phaseRef.current !== "review-summary") return;
      if (!examNow?.antiCheat) return;
      const next = violationsRef.current + 1;
      violationsRef.current = next;
      setViolations(next);
      const limit = Math.max(0, Number(examNow.maxTabSwitches) || 0);
      // eslint-disable-next-line no-console
      console.warn(`[exam] Anti-cheat violation #${next} (${source}). Limit ${limit}.`);
      if (next > limit) submit("disqualified");
      else {
        const left = limit - next + 1;
        setWarning(`Anti-cheat: leaving the exam tab counts as a violation. ${left} chance${left === 1 ? "" : "s"} left.`);
      }
    }
    function onBlur() { violation("blur"); }
    function onVis() { if (document.visibilityState === "hidden") violation("visibilitychange"); }
    function onPageHide() { violation("pagehide"); }
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Anti-copy: block copy/cut/contextmenu/select-all/etc while taking ────
  useEffect(() => {
    function isLockedPhase() {
      const p = phaseRef.current;
      return p === "active" || p === "review-summary";
    }
    function onCopy(e)    { if (isLockedPhase()) e.preventDefault(); }
    function onContext(e) { if (isLockedPhase()) e.preventDefault(); }
    function onKey(e) {
      if (!isLockedPhase()) return;
      const k = e.key?.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (k === "c" || k === "x" || k === "a" || k === "p" || k === "s" || k === "u")) {
        e.preventDefault();
      }
      if (k === "f12") e.preventDefault();
      if (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c")) e.preventDefault();
    }
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  function startExam() {
    setAnswers({});
    setFlags({});
    setCurrentIndex(0);
    setViolations(0);
    violationsRef.current = 0;
    setSecondsLeft((Number(exam.durationMinutes) || 30) * 60);
    setPhase("active");
  }
  function selectAnswer(qIndex, optIndex) {
    setAnswers((a) => ({ ...a, [qIndex]: optIndex }));
  }
  function toggleFlag(qIndex) {
    setFlags((f) => ({ ...f, [qIndex]: !f[qIndex] }));
  }
  function goTo(idx) {
    if (idx < 0 || idx >= questions.length) return;
    if (!exam.allowPrevious && idx < currentIndex) return;
    setCurrentIndex(idx);
  }

  async function submit(reason = "submitted") {
    if (phaseRef.current !== "active" && phaseRef.current !== "review-summary") return;
    phaseRef.current = "finished";

    const liveAnswers = answersRef.current || {};
    let earnedMarks = 0;
    let totalMarksLocal = 0;
    questions.forEach((q, i) => {
      const m = Number(q.marks) || 0;
      totalMarksLocal += m;
      if (liveAnswers[i] === q.correctAnswer) earnedMarks += m;
    });
    const rawScore = totalMarksLocal === 0
      ? 0
      : Math.round((earnedMarks / totalMarksLocal) * 100);
    const score = reason === "disqualified" ? 0 : rawScore;
    const passed = reason !== "disqualified" && score >= (exam.passingScore || 0);

    const payload = {
      reason, score, passed,
      earnedMarks: reason === "disqualified" ? 0 : earnedMarks,
      totalMarks: totalMarksLocal,
      answers: liveAnswers,
      submittedAt: new Date().toISOString(),
    };

    saveLastResult(id, payload);
    setResult(payload);
    setPhase("finished");

    try {
      const updated = await submitExamAttempt(id, score, reason);
      setEnrollment(updated);
      writeCachedAttempts(id, updated.examAttemptsUsed || 0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[exam] failed to record attempt:", err.message);
    }
  }

  // ── Loading / error / no-exam guards ─────────────────────────────────────
  if (loading) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12 text-gray-400">Loading exam…</div>
      </StudentShell>
    );
  }
  if (error || !course) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12">
          <Banner kind="error">{error || "Course not found."}</Banner>
        </div>
      </StudentShell>
    );
  }
  if (!exam?.enabled || questions.length === 0) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12">
          <Banner kind="warn">This course doesn't have an active exam yet.</Banner>
          <Link to={`/learn/${id}`} className="inline-block mt-4 text-sm font-semibold text-brandRed">
            ← Back to course
          </Link>
        </div>
      </StudentShell>
    );
  }

  // ── Review-route fallback when there's no saved result on this device ───
  if (isReviewRoute && !result) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12 w-full">
          <Banner kind="warn">
            We couldn't find a saved exam attempt on this device. Reviews are
            stored locally per browser — open the course on the same browser
            where you took the exam.
          </Banner>
          <Link
            to={`/learn/${id}`}
            className="inline-block mt-4 text-sm font-semibold text-brandRed"
          >
            ← Back to course
          </Link>
        </div>
      </StudentShell>
    );
  }

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12 w-full">
          <Link to={`/learn/${id}`} className="inline-flex items-center gap-1 text-sm text-brandRed font-semibold mb-4">
            ← Back to course
          </Link>
          <h1 className="font-heading font-black text-charcoal text-3xl mb-2">
            {course.courseName} — Final Exam
          </h1>
          <p className="text-gray-500 text-sm mb-8">Read the rules carefully before you start.</p>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 mb-6">
            <ul className="text-sm text-charcoal space-y-3">
              <RuleRow ok text={`${questions.length} question${questions.length === 1 ? "" : "s"} · ${exam.durationMinutes} minutes · pass mark ${exam.passingScore}%${totalMarks ? ` · ${totalMarks} total marks` : ""}`} />
              <RuleRow ok={courseComplete}
                text={courseComplete
                  ? "Course completed."
                  : `Course must be 100% complete — ${completedCount}/${lectureCount} lectures done.`} />
              <RuleRow ok={attemptsLeft > 0}
                text={attemptsLeft > 0
                  ? `${attemptsLeft} of ${maxAttempts} attempt${maxAttempts === 1 ? "" : "s"} remaining.`
                  : "No attempts left."} />
              <RuleRow ok text={exam.allowPrevious ? "You can move back to previous questions." : "Forward only — once you advance, you can't go back."} />
              <RuleRow ok text={
                exam.reviewMode === "never" ? "Answers won't be shown after submission."
                : exam.reviewMode === "immediately" ? "Answers will be shown right after submission."
                : exam.reviewOpensAt
                ? `Answers will unlock on ${new Date(exam.reviewOpensAt).toLocaleString()}.`
                : "Answers review will unlock at a scheduled date (not set yet)."
              } />
              {exam.antiCheat && (
                <RuleRow warn text={`Anti-cheat is on. Switching tabs / windows more than ${exam.maxTabSwitches} time${exam.maxTabSwitches === 1 ? "" : "s"} will auto-submit your exam.`} />
              )}
              <RuleRow warn text="Copying questions or answers is disabled while you take the exam." />
            </ul>
          </div>

          {(!courseComplete || attemptsLeft === 0) && (
            <Banner kind="warn">
              {!courseComplete
                ? "Finish every lecture to unlock the exam."
                : "You've used all your attempts. Contact support if you need another."}
            </Banner>
          )}

          <button
            type="button"
            disabled={!courseComplete || attemptsLeft === 0}
            onClick={startExam}
            className={`mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition ${
              !courseComplete || attemptsLeft === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-brandRed text-white hover:bg-red-700 shadow-lg shadow-brandRed/20"
            }`}
          >
            Start exam
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </StudentShell>
    );
  }

  // ── Result + (optional) answers review ───────────────────────────────────
  if (phase === "finished" || phase === "review-answers") {
    return (
      <ResultScreen
        result={result || readLastResult(id)}
        exam={exam}
        questions={questions}
        attemptsLeft={attemptsLeft - 1 < 0 ? 0 : (Math.max(1, Number(exam.attempts) || 1) - (enrollment?.examAttemptsUsed || 0))}
        courseId={id}
        onRetake={() => {
          setResult(null);
          setPhase("intro");
        }}
        showAnswers={phase === "review-answers"}
        onShowAnswers={() => setPhase("review-answers")}
      />
    );
  }

  // ── Pre-submit summary ───────────────────────────────────────────────────
  if (phase === "review-summary") {
    return (
      <ExamShell
        title={`${course.courseName} — Exam`}
        timer={formatTimer(secondsLeft)}
        timerLow={secondsLeft < 30}
        antiCheat={exam.antiCheat}
        violations={violations}
        maxTabSwitches={exam.maxTabSwitches}
        warning={warning}
        onDismissWarning={() => setWarning("")}
      >
        <h2 className="font-heading font-black text-2xl text-charcoal mb-2">
          Review your answers before submitting
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {exam.allowPrevious
            ? "Click any question to jump back and change your answer."
            : "You can no longer change answers — review then submit."}
        </p>

        <SummaryGrid
          questions={questions}
          answers={answers}
          flags={flags}
          allowJumpBack={exam.allowPrevious}
          onJump={(i) => { setCurrentIndex(i); setPhase("active"); }}
        />

        <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setPhase("active")}
            className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-charcoal hover:bg-softGrey transition"
          >
            ← Back to questions
          </button>
          <button
            type="button"
            onClick={() => submit("submitted")}
            className="px-8 py-3.5 rounded-xl bg-brandRed text-white font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-brandRed/20"
          >
            Submit exam
          </button>
        </div>
      </ExamShell>
    );
  }

  // ── Active question screen ────────────────────────────────────────────────
  const q = questions[currentIndex];
  const answered = answers[currentIndex] != null;
  const flagged = !!flags[currentIndex];

  return (
    <ExamShell
      title={`${course.courseName} — Exam`}
      timer={formatTimer(secondsLeft)}
      timerLow={secondsLeft < 30}
      antiCheat={exam.antiCheat}
      violations={violations}
      maxTabSwitches={exam.maxTabSwitches}
      warning={warning}
      onDismissWarning={() => setWarning("")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Left: question */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brandRed">
                Question {currentIndex + 1} of {questions.length}
              </p>
              {exam.showQuestionMarks && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {q.marks ?? 1} mark{(q.marks ?? 1) === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => toggleFlag(currentIndex)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                flagged
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={flagged ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5v16M5 5l9 5-9 5" />
              </svg>
              {flagged ? "Flagged" : "Flag for review"}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 select-none">
            {q.image && (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 bg-softGrey flex items-center justify-center">
                <img
                  src={q.image}
                  alt="Question reference"
                  className="max-h-80 w-auto object-contain"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
              </div>
            )}
            <p className="text-base font-semibold text-charcoal mb-5 leading-relaxed">
              {q.question || "(no question text)"}
            </p>
            <div className="space-y-2">
              {(q.options || []).map((opt, oi) => {
                const selected = answers[currentIndex] === oi;
                return (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                      selected
                        ? "border-brandRed bg-brandRed/5"
                        : "border-gray-200 hover:border-brandRed/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentIndex}`}
                      checked={selected}
                      onChange={() => selectAnswer(currentIndex, oi)}
                      className="w-4 h-4 accent-brandRed"
                    />
                    <span className="text-xs font-bold text-gray-400 w-5">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    <span className="text-sm text-charcoal flex-1">
                      {opt || <em className="text-gray-300">empty option</em>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
            {exam.allowPrevious && currentIndex > 0 ? (
              <button
                type="button"
                onClick={() => goTo(currentIndex - 1)}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-charcoal hover:bg-softGrey transition"
              >
                ← Previous
              </button>
            ) : exam.allowPrevious ? (
              // First question, nothing to go back to — render an empty
              // placeholder so the Next button stays right-aligned.
              <span />
            ) : (
              <span className="text-[11px] text-gray-400 italic">
                You can't go back to previous questions in this exam.
              </span>
            )}

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                className="px-6 py-2.5 rounded-xl bg-brandRed text-white font-bold text-sm hover:bg-red-700 transition"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPhase("review-summary")}
                className="px-6 py-2.5 rounded-xl bg-brandRed text-white font-bold text-sm hover:bg-red-700 transition"
              >
                Review answers →
              </button>
            )}
          </div>
        </div>

        {/* Right: tracker */}
        <aside className="lg:sticky lg:top-4 self-start space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Question tracker
            </p>
            <TrackerGrid
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              flags={flags}
              allowJumpBack={exam.allowPrevious}
              onJump={(i) => goTo(i)}
            />
            <Legend />
          </div>
        </aside>
      </div>
    </ExamShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ExamShell({
  title, timer, timerLow,
  antiCheat, violations, maxTabSwitches,
  warning, onDismissWarning,
  children,
}) {
  return (
    <StudentShell activeLink="My Courses">
      <div
        className="px-8 py-8 w-full"
        // CSS-level copy-prevention while taking — paired with global handlers above.
        style={{ userSelect: "none", WebkitUserSelect: "none", msUserSelect: "none" }}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
      >
        <div className="sticky top-0 -mt-8 -mx-8 mb-6 px-8 py-4 bg-softGrey/95 backdrop-blur border-b border-gray-200 flex items-center justify-between gap-4 z-10">
          <p className="font-heading font-bold text-charcoal text-base truncate">{title}</p>
          <div className="flex items-center gap-3">
            {antiCheat && (
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${
                violations === 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brandRed"
              }`}>
                Violations {violations} / {maxTabSwitches}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
              timerLow ? "bg-red-50 text-brandRed" : "bg-white text-charcoal"
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timer}
            </span>
          </div>
        </div>

        {warning && (
          <div className="mb-5 px-5 py-3 rounded-xl border border-red-200 bg-red-50 text-brandRed text-sm flex items-start gap-3">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75l-7-12a2 2 0 00-3.68 0l-7 12A2 2 0 005 19z" />
            </svg>
            <p className="flex-1">{warning}</p>
            <button type="button" onClick={onDismissWarning} className="text-xs font-bold underline opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {children}
      </div>
    </StudentShell>
  );
}

function TrackerGrid({ questions, currentIndex, answers, flags, allowJumpBack, onJump }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 mb-3">
      {questions.map((_, i) => {
        const isCurrent = i === currentIndex;
        const isAnswered = answers[i] != null;
        const isFlagged = !!flags[i];
        const canJump = allowJumpBack || i >= currentIndex;

        let cls = "border-gray-200 bg-white text-gray-400";
        if (isCurrent) cls = "border-brandRed bg-brandRed text-white";
        else if (isAnswered) cls = "border-emerald-300 bg-emerald-50 text-emerald-700";

        return (
          <button
            key={i}
            type="button"
            onClick={() => canJump && onJump(i)}
            disabled={!canJump}
            className={`relative h-9 rounded-md border text-xs font-bold transition ${cls} ${
              !canJump ? "opacity-40 cursor-not-allowed" : "hover:border-brandRed"
            }`}
          >
            {i + 1}
            {isFlagged && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function Legend() {
  const items = [
    { dot: "bg-brandRed", label: "Current" },
    { dot: "bg-emerald-300", label: "Answered" },
    { dot: "bg-white border border-gray-300", label: "Unanswered" },
    { dot: "bg-amber-400", label: "Flagged" },
  ];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-sm ${it.dot}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function SummaryGrid({ questions, answers, flags, allowJumpBack, onJump }) {
  const totalAnswered = questions.filter((_, i) => answers[i] != null).length;
  const totalFlagged = questions.filter((_, i) => flags[i]).length;
  const totalUnanswered = questions.length - totalAnswered;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500 mb-5">
        <span><strong className="text-charcoal">{questions.length}</strong> total</span>
        <span><strong className="text-emerald-700">{totalAnswered}</strong> answered</span>
        <span><strong className="text-brandRed">{totalUnanswered}</strong> unanswered</span>
        <span><strong className="text-amber-600">{totalFlagged}</strong> flagged</span>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-5">
        {questions.map((_, i) => {
          const isAnswered = answers[i] != null;
          const isFlagged = !!flags[i];
          let cls = "border-gray-200 bg-white text-gray-400";
          if (isAnswered) cls = "border-emerald-300 bg-emerald-50 text-emerald-700";
          if (isFlagged) cls = "border-amber-400 bg-amber-50 text-amber-700";
          return (
            <button
              key={i}
              type="button"
              onClick={() => allowJumpBack && onJump(i)}
              disabled={!allowJumpBack}
              className={`relative h-10 rounded-lg border text-sm font-bold transition ${cls} ${
                !allowJumpBack ? "cursor-not-allowed" : "hover:border-brandRed"
              }`}
            >
              {i + 1}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
              )}
            </button>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

function ResultScreen({
  result, exam, questions, attemptsLeft, courseId,
  onRetake, showAnswers, onShowAnswers,
}) {
  const heading =
    result?.reason === "disqualified" ? "Disqualified — too many tab switches"
    : result?.reason === "timeout" ? "Time's up"
    : result?.passed ? "You passed 🎉"
    : "Not passed yet";

  // Decide whether the answers-review button is visible and unlocked.
  // Modes:
  //   never        — review hidden permanently
  //   immediately  — review available right away
  //   after_date   — review unlocks at the absolute calendar moment set by admin
  const reviewMode = exam.reviewMode || "immediately";

  let reviewState = "hidden"; // hidden | locked | open
  let unlockAt = null;
  if (reviewMode === "immediately") reviewState = "open";
  else if (reviewMode === "after_date") {
    if (!exam.reviewOpensAt) {
      reviewState = "hidden"; // not configured
    } else {
      unlockAt = new Date(exam.reviewOpensAt);
      reviewState = Date.now() >= unlockAt.getTime() ? "open" : "locked";
    }
  }
  // Anti-cheat run: forfeit the review entirely.
  if (result?.reason === "disqualified") reviewState = "hidden";

  // The SCORE itself is also held back until the review window opens — it
  // makes no sense to publish a percentage while the answers stay locked.
  // Disqualifications still show 0 immediately so the student understands why.
  const scoreLocked =
    reviewMode === "after_date" &&
    !!exam.reviewOpensAt &&
    Date.now() < new Date(exam.reviewOpensAt).getTime() &&
    result?.reason !== "disqualified";

  return (
    <StudentShell activeLink="My Courses">
      <div className="px-8 py-12 w-full">
        {!showAnswers && scoreLocked && (
          <div className="rounded-2xl shadow-card border bg-white border-gray-200 p-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Submission received
            </p>
            <h1 className="font-heading font-black text-2xl text-charcoal mb-3">
              Your answers were saved
            </h1>
            <div className="inline-flex items-center gap-2 bg-softGrey rounded-full px-4 py-2 mb-4">
              <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-bold text-charcoal">Results locked</span>
            </div>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Your score and the answers review will be available on{" "}
              <span className="font-bold text-charcoal">
                {unlockAt?.toLocaleString()}
              </span>
              .
            </p>
            <Link
              to={`/learn/${courseId}`}
              className="inline-block px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-charcoal hover:bg-softGrey transition"
            >
              Back to course
            </Link>
          </div>
        )}

        {!showAnswers && !scoreLocked && (
          <div className={`rounded-2xl shadow-card border p-8 text-center ${
            result?.passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Exam result
            </p>
            <h1 className="font-heading font-black text-2xl text-charcoal mb-3">{heading}</h1>
            <p className="text-5xl font-heading font-black mb-2 text-charcoal">{result?.score ?? 0}%</p>
            <p className="text-sm text-gray-500 mb-6">
              {result?.earnedMarks ?? 0} of {result?.totalMarks ?? 0} marks · pass mark {exam.passingScore}%
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                to={`/learn/${courseId}`}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-charcoal hover:bg-softGrey transition"
              >
                Back to course
              </Link>
              {!result?.passed && attemptsLeft > 0 && (
                <button
                  type="button"
                  onClick={onRetake}
                  className="px-5 py-2.5 rounded-xl bg-brandRed text-white text-sm font-bold hover:bg-red-700 transition"
                >
                  Try again ({attemptsLeft} left)
                </button>
              )}
              {reviewState === "open" && (
                <button
                  type="button"
                  onClick={onShowAnswers}
                  className="px-5 py-2.5 rounded-xl bg-charcoal text-white text-sm font-bold hover:bg-black transition"
                >
                  Review answers
                </button>
              )}
            </div>
          </div>
        )}

        {showAnswers && (
          <AnswersReview
            result={result}
            questions={questions}
            exam={exam}
            onBack={() => onRetake && null}
            backHref={`/learn/${courseId}`}
          />
        )}
      </div>
    </StudentShell>
  );
}

function AnswersReview({ result, questions, exam, backHref }) {
  const answers = result?.answers || {};
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading font-black text-2xl text-charcoal">Answers review</h2>
          <p className="text-xs text-gray-400 mt-1">
            Score {result?.score}% · {result?.earnedMarks ?? 0}/{result?.totalMarks ?? 0} marks
          </p>
        </div>
        <Link
          to={backHref}
          className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-charcoal hover:bg-softGrey transition"
        >
          Back to course
        </Link>
      </div>

      {questions.map((q, i) => {
        const picked = answers[i];
        const correct = q.correctAnswer;
        const isCorrect = picked === correct;
        return (
          <div
            key={i}
            className={`bg-white rounded-2xl shadow-card border p-5 ${
              isCorrect ? "border-emerald-200" : "border-red-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brandRed">
                Question {i + 1}{exam.showQuestionMarks ? ` · ${q.marks ?? 1} mark${(q.marks ?? 1) === 1 ? "" : "s"}` : ""}
              </p>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brandRed"
              }`}>
                {isCorrect ? "Correct" : picked == null ? "Not answered" : "Incorrect"}
              </span>
            </div>
            <p className="text-sm font-semibold text-charcoal mb-3">{q.question}</p>
            <div className="space-y-2">
              {(q.options || []).map((opt, oi) => {
                const isPicked = picked === oi;
                const isAnswer = correct === oi;
                let cls = "border-gray-200 bg-white";
                if (isAnswer) cls = "border-emerald-400 bg-emerald-50";
                else if (isPicked && !isAnswer) cls = "border-red-300 bg-red-50";
                return (
                  <div key={oi} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${cls}`}>
                    <span className="text-xs font-bold text-gray-400 w-5">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    <span className="text-sm text-charcoal flex-1">
                      {opt || <em className="text-gray-300">empty option</em>}
                    </span>
                    {isAnswer && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                        Correct
                      </span>
                    )}
                    {isPicked && !isAnswer && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brandRed">
                        Your pick
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RuleRow({ text, ok, warn }) {
  const tint = ok ? "text-emerald-700" : warn ? "text-amber-700" : "text-brandRed";
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-0.5 ${tint}`}>
        {ok ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : warn ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75l-7-12a2 2 0 00-3.68 0l-7 12A2 2 0 005 19z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </span>
      <span>{text}</span>
    </li>
  );
}

function Banner({ kind = "warn", children }) {
  const cls = kind === "warn"
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-red-50 border-red-200 text-brandRed";
  return <div className={`rounded-xl border px-5 py-4 text-sm ${cls}`}>{children}</div>;
}

function formatTimer(secs) {
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}
