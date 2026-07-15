import React, { useState, useEffect, useRef } from 'react';
import { UserIcon, GraduationCapIcon, ClockIcon, BookOpenIcon, CheckCircleIcon, AlertCircleIcon, LogOutIcon } from '../Icons';
import AlertDialog from '../AlertDialog';
import API_BASE from '../../api';
import jsPDF from 'jspdf';

// Detects if a string contains code-like content
const looksLikeCode = (text) => {
  const codePatterns = [
    /\bdef \w+\s*\(/,           // Python function: def foo(
    /\bprint\s*\(/,              // Python print(
    /\bfor\s+\w+\s+in\s+/,       // Python for x in
    /\bwhile\s*\(/,              // while loop
    /\bif\s+.+:/,                // Python if ...:
    /\bclass\s+\w+/,             // class definition
    /=>\s*{/,                    // JS arrow function
    /function\s*\w*\s*\(/,       // JS function
    /console\.log\s*\(/,         // console.log
    /\blet\s+\w+|\bconst\s+\w+|\bvar\s+\w+/, // JS variable declarations
    /\w+\.append\s*\(/,          // list.append(
    /\w+\.push\s*\(/,            // array.push(
    /[{}];?\s*$/m,               // lines ending with {} or {};
    /^\s{2,}\S/m,                // indented code lines
    /:\s*\n/m,                   // Python block starters
  ];
  return codePatterns.some(pattern => pattern.test(text));
};

// Auto-formats single-line code into properly indented multi-line code
const formatCode = (code) => {
  // If the code already has newlines, preserve them as-is
  if (code.includes('\n')) return code;

  let result = '';
  let indent = 0;
  const INDENT = '  '; // 2 spaces per level
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (ch === '{') {
      result += ' {\n';
      indent++;
      result += INDENT.repeat(indent);
      // skip whitespace after {
      while (i + 1 < code.length && code[i + 1] === ' ') i++;
    } else if (ch === '}') {
      indent = Math.max(0, indent - 1);
      result = result.trimEnd();
      result += '\n' + INDENT.repeat(indent) + '}';
      // peek: if next non-space is not ; or ) or , then add newline
      let peek = i + 1;
      while (peek < code.length && code[peek] === ' ') peek++;
      if (peek < code.length && code[peek] !== ';' && code[peek] !== ')' && code[peek] !== ',') {
        result += '\n' + INDENT.repeat(indent);
      }
    } else if (ch === ';') {
      result += ';\n' + INDENT.repeat(indent);
      // skip trailing space after ;
      while (i + 1 < code.length && code[i + 1] === ' ') i++;
    } else if (ch === ':' && /\s/.test(code[i + 1] || ' ')) {
      // Python block opener (if/for/def/while ending with colon)
      result += ':\n';
      indent++;
      result += INDENT.repeat(indent);
      while (i + 1 < code.length && code[i + 1] === ' ') i++;
    } else {
      result += ch;
    }
    i++;
  }

  return result.trim();
};

// Splits question text into plain text part and code part
const parseQuestion = (text) => {
  const lines = text.split('\n');
  let splitIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.match(/^(def |print|for |while |if |class |let |const |var |function |console\.log|#include|import |public )/) ||
      line.match(/^[a-zA-Z_]\w*\s*=\s*[^=]/) ||
      line.match(/[{}();]$/) ||
      line.match(/^\s{2,}\S/)
    ) {
      splitIndex = i;
      break;
    }
  }

  if (splitIndex === -1 || splitIndex === 0) {
    return { prose: '', code: looksLikeCode(text) ? text : null, fullText: text };
  }

  return {
    prose: lines.slice(0, splitIndex).join('\n').trim(),
    code: lines.slice(splitIndex).join('\n').trim(),
    fullText: text
  };
};

// Component that smartly renders a question with optional code block
const QuestionRenderer = ({ text }) => {
  const { prose, code, fullText } = parseQuestion(text);

  if (!code) {
    return <span>{fullText}</span>;
  }

  const formattedCode = formatCode(code);

  return (
    <span>
      {prose && <span className="block mb-3">{prose}</span>}
      <code
        className="block w-full text-left font-mono text-sm bg-slate-900 text-green-300 rounded-xl px-5 py-4 mt-1 leading-relaxed whitespace-pre overflow-x-auto border border-slate-700 shadow-inner"
      >
        {formattedCode}
      </code>
    </span>
  );
};

const Dashboard = ({ token, student, logout }) => {
  const [profile, setProfile] = useState(student);
  const [testActive, setTestActive] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(profile.testSubmitted);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: selectedOptionText }
  const [scoreReport, setScoreReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Timer state (15 minutes = 900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);
  const timerRef = useRef(null);

  // Security & Integrity states
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // Sync ref with selectedAnswers to avoid stale closures in listeners
  const selectedAnswersRef = useRef(selectedAnswers);
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  // Custom Alert Dialog state
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info' | 'success' | 'warning' | 'error' | 'confirm'
    onConfirm: null
  });

  const showAlert = (message, title = 'Alert', type = 'info') => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: null
    });
  };

  const showConfirm = (message, onConfirm, title = 'Confirm Action') => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  // Security listeners for Copy, Cut, and ContextMenu
  useEffect(() => {
    if (examStarted && !examSubmitted) {
      const preventDefaultAction = (e) => e.preventDefault();

      document.addEventListener('copy', preventDefaultAction);
      document.addEventListener('cut', preventDefaultAction);
      document.addEventListener('contextmenu', preventDefaultAction);

      // Disable screenshot key events (PrintScreen, Win+Shift+S)
      const handleKeyDown = (e) => {
        if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && e.key === 'S')) {
          e.preventDefault();
          showAlert('Screenshots/Print Screen are strictly disabled during this assessment.', 'Security Alert', 'warning');
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('copy', preventDefaultAction);
        document.removeEventListener('cut', preventDefaultAction);
        document.removeEventListener('contextmenu', preventDefaultAction);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [examStarted, examSubmitted]);

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted && !examSubmitted) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            showAlert('Integrity Violation: You have switched tabs 3 times. Your exam is being submitted automatically.', 'Violation Auto-Submit', 'error');
            submitExam(selectedAnswersRef.current);
            return next;
          } else {
            showAlert(`SECURITY WARNING: Switching tabs or windows is strictly prohibited. You have done this ${next} of 3 times. On the 3rd attempt, your exam will auto-submit.`, 'Integrity Warning', 'warning');
            return next;
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examStarted, examSubmitted]);

  // Window blur and Fullscreen exit detection
  useEffect(() => {
    const handleBlur = () => {
      if (examStarted && !examSubmitted) {
        setIsWindowBlurred(true);
      }
    };
    const handleFocus = () => {
      // Don't auto-remove blur on focus, force them to click the Resume button so we can trigger fullscreen
    };

    const handleFullscreenChange = () => {
      if (examStarted && !examSubmitted && !document.fullscreenElement) {
        setIsWindowBlurred(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [examStarted, examSubmitted]);

  // Fetch student profile and system config on mount
  useEffect(() => {
    fetchProfile();
    fetchSystemConfig();
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (examStarted && !examSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [examStarted, examSubmitted]);

  const generateStudentPDF = () => {
    if (!profile) return;
    const doc = new jsPDF();
    
    // Load image
    const img = new Image();
    img.src = '/image.png';
    img.onload = () => {
      // Header Logo
      doc.addImage(img, 'PNG', 14, 15, 40, 15);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("Student Performance Report", 14, 38);
      
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 43, 196, 43);
    
      // Student Details
      doc.setFontSize(12);
      doc.text(`Name: ${profile.name}`, 14, 53);
      doc.text(`Student ID: ${profile.studentId}`, 14, 60);
      doc.text(`USN: ${profile.usn}`, 14, 67);
      doc.text(`College: ${profile.collegeName}`, 14, 74);
      doc.text(`Email: ${profile.email}`, 100, 53);
      doc.text(`Phone: ${profile.phone}`, 100, 60);
      doc.text(`Batch: ${profile.batch || 'Unassigned'}   |   Set: ${profile.assignedSet}`, 100, 67);
      
      // Score & Status
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text("Examination Results", 14, 88);
      
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Status: Completed`, 14, 98);
      
      if (scoreReport) {
        doc.text(`Final Score: ${scoreReport.score}`, 14, 105);
        doc.text(`Test Started: ${new Date(profile.testStartedAt).toLocaleString()}`, 14, 112);
        doc.text(`Test Submitted: ${new Date(profile.testSubmittedAt || Date.now()).toLocaleString()}`, 14, 119);
        
        // Calculate duration
        const durationMs = new Date(profile.testSubmittedAt || Date.now()) - new Date(profile.testStartedAt);
        const durationMins = Math.floor(durationMs / 60000);
        const durationSecs = Math.floor((durationMs % 60000) / 1000);
        doc.text(`Time Taken: ${durationMins}m ${durationSecs}s`, 14, 126);
      }
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report generated on: ${new Date().toLocaleString()}`, 14, 280);
      
      doc.save(`${profile.studentId}_Report.pdf`);
    };
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/students/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setExamSubmitted(data.testSubmitted);
        if (data.testSubmitted) {
          // If already submitted, format score report from saved answers
          setScoreReport({
            score: data.score,
            totalQuestions: data.answers.length,
            percentage: data.answers.length > 0 ? Math.round((data.score / data.answers.length) * 100) : 0,
            answers: data.answers
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/config`);
      if (res.ok) {
        const data = await res.json();
        setTestActive(data.testActive);
        if (data.testDuration) {
          setTimeLeft(data.testDuration * 60);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartExam = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/students/start-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Could not start the exam');
      }

      setQuestions(data.questions);
      setExamStarted(true);
      
      // Request Fullscreen for anti-cheat
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
          await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
          await document.documentElement.msRequestFullscreen();
        }
      } catch (e) {
        console.log('Fullscreen failed:', e);
      }
      
      // Initialize selectedAnswers
      const initialAnswers = {};
      data.questions.forEach(q => {
        initialAnswers[q._id] = '';
      });
      setSelectedAnswers(initialAnswers);
    } catch (err) {
      setError(err.message || 'Error starting exam');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionText) => {
    const qId = questions[currentIndex]._id;
    setSelectedAnswers({
      ...selectedAnswers,
      [qId]: optionText
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const submitExam = async (finalAnswers = selectedAnswersRef.current) => {
    setLoading(true);
    clearInterval(timerRef.current);
    try {
      const answersPayload = Object.keys(finalAnswers).map(qId => ({
        questionId: qId,
        selectedOptionText: finalAnswers[qId]
      }));

      const res = await fetch(`${API_BASE}/api/students/submit-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: answersPayload })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setScoreReport(data);
      setExamSubmitted(true);
      fetchProfile(); // reload profile details
    } catch (err) {
      if (err.message === 'You have already submitted this test') {
        setExamSubmitted(true);
        fetchProfile();
      } else {
        setError(err.message || 'Failed to submit test. Contact admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const autoSubmit = () => {
    showAlert('Time limit reached! Your exam is being submitted automatically.', 'Time Expired', 'warning');
    submitExam();
  };

  const progressPercentage = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
      {/* SIDEBAR (Desktop Only) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col justify-between hidden lg:flex shrink-0 h-full">
        <div className="p-6 flex justify-center mt-4 border-b border-slate-50 pb-8">
          <img src="/image.png" alt="GWC Logo" className="h-16 object-contain" />
        </div>
        
        <div className="p-6 flex-1 flex flex-col justify-end">
          <button
            onClick={() => showConfirm('Are you sure you want to sign out?', logout, 'Confirm Sign Out')}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-colors cursor-pointer text-sm font-semibold"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 overflow-y-auto relative w-full h-full">
        
        {/* MOBILE HEADER NAVBAR */}
        <div className="lg:hidden flex justify-between items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center">
            <img src="/image.png" alt="GWC Logo" className="h-10 object-contain" />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => showConfirm('Are you sure you want to sign out?', logout, 'Confirm Sign Out')}
              className="flex items-center space-x-1.5 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
            >
              <LogOutIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="py-8 lg:py-12 px-4 md:px-8 max-w-6xl mx-auto w-full relative">
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-left">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* STUDENT INFO SIDEBAR */}
        {!examStarted && (
          <div className="glass rounded-2xl border border-slate-200/80 p-6 h-fit bg-white shadow-md">
            <div className="text-center pb-6 border-b border-slate-100 mb-6 flex flex-col items-center">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 mb-3 shadow-sm glow-effect">
                <UserIcon className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{profile.name}</h3>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 mt-1 inline-block">
                Student Set {profile.assignedSet}
              </span>
            </div>

            <div className="space-y-4 text-sm text-left">
              <div>
                <span className="text-slate-400 text-xs uppercase block font-bold tracking-wider">Identity ID (PK)</span>
                <span className="text-indigo-600 font-mono font-bold">{profile.studentId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase block font-bold tracking-wider">USN Number</span>
                <span className="text-slate-700 font-mono font-medium">{profile.usn}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase block font-bold tracking-wider">College Name</span>
                <span className="text-slate-700 font-medium">{profile.collegeName}</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE (Instructions / Live Exam / Results) */}
        <div className={examStarted ? 'lg:col-span-3' : 'lg:col-span-2'}>
          
          {/* STATE 1: EXAM NOT STARTED */}
          {!examStarted && !examSubmitted && (
            <div className="glass rounded-2xl border border-slate-200/80 p-8 shadow-lg text-left bg-white">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <BookOpenIcon className="w-7 h-7 text-indigo-600" />
                <span>Drive Examination Instructions</span>
              </h2>
              
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed mb-8">
                <p>Welcome to the College Drive Aptitude Assessment. Please read the following instructions carefully before starting the exam:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>The exam consists of multiple-choice questions belonging to your assigned set (<span className="text-indigo-600 font-bold">Set {profile.assignedSet}</span>).</li>
                  <li>Questions and choices will be shuffled to ensure examination integrity.</li>
                  <li>You have a total of <span className="text-indigo-600 font-bold">{Math.floor(timeLeft / 60)} minutes ({timeLeft} seconds)</span> to complete and submit the test.</li>
                  <li>Do not close or refresh this browser tab during the exam, as your progress may be lost.</li>
                  <li>The exam will automatically submit when the timer expires.</li>
                  <li>Your score and detailed scorecard will be displayed immediately upon submission.</li>
                </ul>
              </div>

              {!profile.testAllowed ? (
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm flex items-center space-x-3 mb-6 font-semibold">
                  <AlertCircleIcon className="w-5 h-5 flex-shrink-0 text-blue-600" />
                  <span>Your test is not yet scheduled or activated by the administrator for your batch. Please wait for activation.</span>
                </div>
              ) : !testActive ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-center space-x-3 mb-6 font-semibold">
                  <AlertCircleIcon className="w-5 h-5 flex-shrink-0 text-amber-600" />
                  <span>The test is currently closed by the administrator. Please check back later.</span>
                </div>
              ) : (
                <button
                  onClick={handleStartExam}
                  disabled={loading}
                  className="w-full sm:w-auto py-3.5 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all cursor-pointer text-sm"
                >
                  {loading ? 'Initializing Exam...' : 'Start Assessment Now'}
                </button>
              )}
            </div>
          )}

          {/* STATE 2: LIVE EXAM IN PROGRESS */}
          {examStarted && !examSubmitted && questions.length > 0 && (
            <div className="relative">
              {isWindowBlurred && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 text-center text-white">
                  <div className="p-4 bg-red-600 rounded-full mb-4 shadow-lg animate-pulse">
                    <AlertCircleIcon className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-red-400">Security Warning: Focus Lost</h3>
                  <p className="text-base max-w-md mb-8 text-slate-300">
                    You have clicked away from the exam window or exited full-screen mode. 
                    The exam content is hidden to prevent unauthorized activity.
                  </p>
                  <button
                    onClick={async () => { 
                      try {
                        if (document.documentElement.requestFullscreen) {
                          await document.documentElement.requestFullscreen();
                        } else if (document.documentElement.webkitRequestFullscreen) {
                          await document.documentElement.webkitRequestFullscreen();
                        } else if (document.documentElement.msRequestFullscreen) {
                          await document.documentElement.msRequestFullscreen();
                        }
                      } catch (e) { console.log(e); }
                      setIsWindowBlurred(false); 
                    }}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 cursor-pointer transition-all active:scale-95"
                  >
                    Return to Full-Screen and Resume Test
                  </button>
                </div>
              )}

              <div className="glass rounded-2xl border border-slate-200/80 p-8 shadow-xl text-left relative bg-white select-none overflow-hidden">

              {/* Exam Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center pb-5 border-b border-slate-100 mb-6 gap-4">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Exam Set: {profile.assignedSet}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">Question {currentIndex + 1} of {questions.length}</h3>
                </div>
                {/* Countdown Timer */}
                <div className="flex items-center space-x-2 py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-600 font-bold">
                  <ClockIcon className="w-5 h-5" />
                  <span className={timeLeft < 60 ? 'text-red-600 animate-pulse' : ''}>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-8 overflow-hidden border border-slate-200/50">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <h4 className="text-lg md:text-xl font-semibold text-slate-900 leading-relaxed">
                  <QuestionRenderer text={questions[currentIndex].questionText} />
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-4 mb-8">
                {questions[currentIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswers[questions[currentIndex]._id] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full text-left py-4 px-5 rounded-xl border transition-all duration-200 cursor-pointer text-sm flex items-center ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold shadow-sm'
                          : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center border mr-4 text-xs font-bold ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-350 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Exam Actions */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors disabled:opacity-30 disabled:pointer-events-none text-xs cursor-pointer"
                >
                  &larr; Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors text-xs cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      showConfirm('Are you sure you want to submit the exam?', () => {
                        submitExam();
                      });
                    }}
                    disabled={loading}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 transition-all text-xs cursor-pointer"
                  >
                    {loading ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                )}
              </div>
            </div>
          </div>
          )}

          {/* STATE 3: EXAM SUBMITTED (SCORE REPORT & REVIEW) */}
          {examSubmitted && scoreReport && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Score summary banner */}
              <div className="glass rounded-2xl border border-slate-200 p-8 shadow-lg text-center relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl"></div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">Assessment Results</h2>
                <p className="text-slate-550 text-sm">Your answers have been graded and recorded by the drive controller.</p>

                {/* Score Circle */}
                <div className="my-8 relative inline-flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-4 border-slate-100 flex flex-col items-center justify-center bg-slate-50 shadow-inner">
                    <span className="text-4xl font-extrabold text-slate-900">{scoreReport.percentage}%</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 mt-0.5">Score</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 max-w-sm mx-auto bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm font-medium">
                  <div className="text-center border-r border-slate-200">
                    <span className="block text-xs text-slate-500 font-bold mb-1">Correct</span>
                    <span className="text-emerald-600 font-mono font-bold text-lg">{scoreReport.score}</span>
                  </div>
                  <div className="text-center border-r border-slate-200">
                    <span className="block text-xs text-slate-500 font-bold mb-1">Wrong</span>
                    <span className="text-red-600 font-mono font-bold text-lg">{scoreReport.totalQuestions - scoreReport.score}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-slate-500 font-bold mb-1">Total</span>
                    <span className="text-slate-900 font-mono font-bold text-lg">{scoreReport.totalQuestions}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-sm mx-auto">
                  <button
                    onClick={generateStudentPDF}
                    className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer text-sm"
                  >
                    Download PDF Report
                  </button>
                  <button
                    onClick={logout}
                    className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    Logout Now
                  </button>
                </div>
              </div>

              {/* Detailed Question Review */}
              <div className="glass rounded-2xl border border-slate-200 p-8 shadow-lg text-left bg-white">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Question Review</h3>
                
                <div className="space-y-6">
                  {scoreReport.answers.map((ans, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-xl border text-sm ${
                        ans.isCorrect 
                          ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900' 
                          : 'bg-red-50/40 border-red-200 text-red-900'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 gap-4">
                        <h4 className="font-semibold text-slate-900 leading-relaxed text-base">
                          {idx + 1}. {ans.questionText}
                        </h4>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 border ${
                          ans.isCorrect
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {ans.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      {/* Display options for this review */}
                      <div className="mt-3 space-y-2">
                        {ans.selectedOptionText ? (
                          <>
                            <div className={`p-3 rounded-lg border flex items-center ${
                              ans.isCorrect 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium' 
                                : 'bg-red-50 border-red-300 text-red-950 font-medium'
                            }`}>
                              <span className="font-bold mr-2 text-slate-600">Your Answer:</span> {ans.selectedOptionText}
                            </div>
                            {!ans.isCorrect && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium flex items-center">
                                <span className="font-bold mr-2 text-slate-600">Correct Answer:</span> {ans.correctOptionText}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-950 font-medium">
                            <span className="font-bold">Not Answered.</span> Correct Answer: {ans.correctOptionText}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
      </div>
      </main>
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onConfirm={alertDialog.onConfirm}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </div>
  );
};

export default Dashboard;
