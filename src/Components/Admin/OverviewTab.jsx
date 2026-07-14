import React, { useState, useEffect } from 'react';

const OverviewTab = ({
  token,
  students,
  stats,
  systemConfig,
  formatDateTime,
  showAlert,
  handleConfigToggle,
  setSelectedStudentAnswers
}) => {
  const [overviewFilter, setOverviewFilter] = useState(null); // null | 'registered' | 'submitted' | 'average' | 'high'
  const [scoreRange, setScoreRange] = useState({ min: '', max: '', applied: false });
  const [localQuestions, setLocalQuestions] = useState(systemConfig.totalQuestionsToServe || 30);
  const [localDuration, setLocalDuration] = useState(systemConfig.testDuration || 15);

  useEffect(() => {
    if (systemConfig.totalQuestionsToServe !== undefined) {
      setLocalQuestions(systemConfig.totalQuestionsToServe);
    }
    if (systemConfig.testDuration !== undefined) {
      setLocalDuration(systemConfig.testDuration);
    }
  }, [systemConfig.totalQuestionsToServe, systemConfig.testDuration]);

  const handleSaveQuestions = () => {
    const val = Number(localQuestions);
    if (isNaN(val) || val < 1 || val > 100) {
      showAlert('Questions per student must be a number between 1 and 100.', 'Invalid Value', 'warning');
      setLocalQuestions(systemConfig.totalQuestionsToServe || 30);
      return;
    }
    handleConfigToggle('totalQuestionsToServe', val);
  };

  const handleSaveDuration = () => {
    const val = Number(localDuration);
    if (isNaN(val) || val < 1 || val > 300) {
      showAlert('Test duration must be between 1 and 300 minutes.', 'Invalid Value', 'warning');
      setLocalDuration(systemConfig.testDuration || 15);
      return;
    }
    handleConfigToggle('testDuration', val);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* STATS HIGHLIGHT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setOverviewFilter(overviewFilter === 'registered' ? null : 'registered')}
          className={`glass rounded-xl border p-6 shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${
            overviewFilter === 'registered' 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' 
              : 'border-slate-200/80 hover:border-indigo-400'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Registered Students</span>
            {overviewFilter === 'registered' && <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">Filtered</span>}
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.totalStudents}</h3>
        </div>
        
        <div 
          onClick={() => setOverviewFilter(overviewFilter === 'submitted' ? null : 'submitted')}
          className={`glass rounded-xl border p-6 shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${
            overviewFilter === 'submitted' 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' 
              : 'border-slate-200/80 hover:border-indigo-400'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Submitted Tests</span>
            {overviewFilter === 'submitted' && <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">Filtered</span>}
          </div>
          <h3 className="text-3xl font-extrabold text-indigo-600 mt-2 font-mono">{stats.testSubmissions}</h3>
        </div>

        <div 
          onClick={() => setOverviewFilter(overviewFilter === 'average' ? null : 'average')}
          className={`glass rounded-xl border p-6 shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${
            overviewFilter === 'average' 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' 
              : 'border-slate-200/80 hover:border-indigo-400'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Average Score</span>
            {overviewFilter === 'average' && <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">Filtered</span>}
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-600 mt-2 font-mono">{stats.averageScore}</h3>
        </div>

        <div 
          onClick={() => setOverviewFilter(overviewFilter === 'high' ? null : 'high')}
          className={`glass rounded-xl border p-6 shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${
            overviewFilter === 'high' 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' 
              : 'border-slate-200/80 hover:border-indigo-400'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">High Score</span>
            {overviewFilter === 'high' && <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">Filtered</span>}
          </div>
          <h3 className="text-3xl font-extrabold text-purple-600 mt-2 font-mono">{stats.highScore}</h3>
        </div>
      </div>

      {/* FILTERED STUDENTS TABLE SECTION */}
      {overviewFilter && (() => {
        let filteredList = [];
        let filterTitle = "";
        let badgeColor = "";

        if (overviewFilter === 'registered') {
          filteredList = students;
          filterTitle = "All Registered Students";
          badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
        } else if (overviewFilter === 'submitted') {
          filteredList = students.filter(s => s.testSubmitted);
          filterTitle = "Students with Submitted Tests";
          badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
        } else if (overviewFilter === 'average') {
          filteredList = students.filter(s => s.testSubmitted && s.score >= stats.averageScore);
          filterTitle = `Students scoring above/equal to Average (${stats.averageScore})`;
          badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (overviewFilter === 'high') {
          filteredList = students.filter(s => s.testSubmitted && s.score === stats.highScore);
          filterTitle = `Students with High Score (${stats.highScore})`;
          badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
        }

        // Apply min score filter on top if active
        if (scoreRange.applied && scoreRange.min !== '') {
          filteredList = filteredList.filter(s =>
            s.testSubmitted && s.score >= Number(scoreRange.min)
          );
        }

        return (
          <div className="glass rounded-2xl border border-slate-200 p-6 shadow-lg bg-white animate-fadeIn text-left">
            <div className="flex flex-wrap justify-between items-center mb-6 pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Overview Filter: <span className="text-indigo-600">{filterTitle}</span>
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${badgeColor}`}>
                  {filteredList.length} Found
                </span>
              </div>
              {/* Inline Min Score Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Min Score:</span>
                <input
                  type="number"
                  min="0"
                  value={scoreRange.min}
                  onChange={e => setScoreRange(r => ({ ...r, min: e.target.value, applied: false }))}
                  placeholder="e.g. 15"
                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  onClick={() => {
                    if (scoreRange.min === '') return;
                    setScoreRange(r => ({ ...r, applied: true }));
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all shadow-sm"
                >
                  Apply
                </button>
                {scoreRange.applied && (
                  <button
                    onClick={() => setScoreRange({ min: '', max: '', applied: false })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    ✕ Reset
                  </button>
                )}
                <button
                  onClick={() => { setOverviewFilter(null); setScoreRange({ min: '', max: '', applied: false }); }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 cursor-pointer ml-2"
                >
                  ✕ Clear Filter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto text-xs sm:text-sm">
              <table className="w-full text-left text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-xs">
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Name / USN</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Batch / Set</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Test Timings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No students match this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map(stu => (
                      <tr key={stu._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600">{stu.studentId}</td>
                        <td className="py-3 px-3">
                          <div className="text-slate-900 font-semibold">{stu.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{stu.usn}</div>
                        </td>
                        <td className="py-3 px-3 text-xs">
                          <div className="font-semibold text-slate-700">{stu.email}</div>
                          <div className="text-slate-400 font-mono mt-0.5">{stu.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-700 text-xs">{stu.batch || 'Unassigned'}</div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-bold text-slate-600">Set {stu.assignedSet}</span>
                        </td>
                        <td className="py-3 px-3">
                          {stu.testSubmitted ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full text-xs font-bold">Submitted</span>
                          ) : stu.testStarted ? (
                            <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-full text-xs font-bold">In Progress</span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-full text-xs font-medium">Registered</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {stu.testSubmitted ? (
                            <button
                              onClick={() => setSelectedStudentAnswers(stu)}
                              className="text-emerald-600 hover:underline font-bold text-left cursor-pointer"
                            >
                              {stu.score} (Review)
                            </button>
                          ) : '--'}
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-slate-500">
                          <div>Start: {formatDateTime(stu.testStartedAt)}</div>
                          <div className="mt-1">End: {formatDateTime(stu.testSubmittedAt)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Round-robin distribution of Sets */}
        <div className="glass rounded-xl border border-slate-200/80 p-6 shadow-md md:col-span-1 bg-white">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Student Set Distribution</h3>
          <div className="space-y-4">
            {['A', 'B', 'C', 'D'].map(set => (
              <div key={set} className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-600">Set {set}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-slate-100 rounded-full h-2 border border-slate-200/50">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${stats.totalStudents > 0 ? (stats.setCounts[set] / stats.totalStudents) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-slate-700 font-bold">{stats.setCounts[set]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Config & Controls */}
        <div className="glass rounded-xl border border-slate-200/80 p-6 shadow-md md:col-span-2 bg-white">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Global Exam Configurations</h3>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Active Test Status</h4>
                <p className="text-xs text-slate-500 mt-0.5">Toggle to open or temporarily lock the test portal for students.</p>
              </div>
              <button
                onClick={() => handleConfigToggle('testActive', !systemConfig.testActive)}
                className={`py-2 px-4 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  systemConfig.testActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {systemConfig.testActive ? 'ACTIVE (Open)' : 'PAUSED (Locked)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                <div>
                  <h5 className="text-xs font-bold text-slate-700">Shuffle Questions</h5>
                  <span className="text-[10px] text-slate-400 font-medium">Randomize question order</span>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.shuffleQuestions}
                  onChange={(e) => handleConfigToggle('shuffleQuestions', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                <div>
                  <h5 className="text-xs font-bold text-slate-700">Shuffle Options</h5>
                  <span className="text-[10px] text-slate-400 font-medium">Randomize MCQ choices</span>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.shuffleOptions}
                  onChange={(e) => handleConfigToggle('shuffleOptions', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200 col-span-1">
                <div>
                  <h5 className="text-xs font-bold text-slate-700">Questions per Student</h5>
                  <span className="text-[10px] text-slate-400 font-medium">Dynamic count of test questions served from set</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={localQuestions}
                    onChange={(e) => setLocalQuestions(e.target.value)}
                    onBlur={handleSaveQuestions}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveQuestions();
                        e.target.blur();
                      }
                    }}
                    className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200 col-span-1">
                <div>
                  <h5 className="text-xs font-bold text-slate-700">Test Duration</h5>
                  <span className="text-[10px] text-slate-400 font-medium">Time limit in minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={localDuration}
                    onChange={(e) => setLocalDuration(e.target.value)}
                    onBlur={handleSaveDuration}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveDuration();
                        e.target.blur();
                      }
                    }}
                    className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-bold text-center"
                  />
                  <span className="text-xs font-bold text-slate-500">Mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
