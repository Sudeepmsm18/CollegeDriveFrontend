import React from 'react';

const BatchesTab = ({
  token,
  students,
  batches,
  fetchStudents,
  fetchBatches,
  showAlert,
  showConfirm,
  formatDateTime,
  handleRemoveFromBatch,
  handleDeleteBatch,
  handleStartBatchExam,
  handleStopBatchExam,
  selectedBatchForView,
  setSelectedBatchForView,
  batchExamConfig,
  setBatchExamConfig
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn text-left">
      
      {/* Left Master Panel: Batches List */}
      <div className="lg:col-span-1 glass rounded-2xl border border-slate-200 p-6 shadow-lg bg-white h-fit">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Available Batches</h3>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 border border-slate-200">
            {batches.length} Total
          </span>
        </div>
        
        {batches.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            No batches created yet. Go to the "Students" tab to create one.
          </div>
        ) : (
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {batches.map(b => {
              const studentCount = students.filter(s => s.batch === b.name).length;
              const isSelected = selectedBatchForView === b.name;
              return (
                <div
                  key={b._id}
                  className={`w-full p-3.5 rounded-xl border text-left flex justify-between items-center transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => setSelectedBatchForView(b.name)}
                    className="flex-1 text-left flex justify-between items-center gap-2 cursor-pointer"
                  >
                    <span className={`truncate font-semibold text-sm ${ isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{b.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {studentCount} Students
                    </span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteBatch(b.name); }}
                    className="ml-2 px-2 py-1 text-[11px] font-bold text-red-400 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-all cursor-pointer shrink-0"
                    title="Delete Batch"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Detail Panel: Students in the selected batch */}
      <div className="lg:col-span-2 glass rounded-2xl border border-slate-200 p-6 shadow-lg bg-white">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Students assigned to <span className="text-indigo-600">"{selectedBatchForView || 'None'}"</span>
          </h3>
          <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-600">
            {students.filter(s => s.batch === selectedBatchForView).length} Students
          </span>
        </div>

        {/* Batch Exam Control Board */}
        {selectedBatchForView && (() => {
          const currentBatchObj = batches.find(b => b.name === selectedBatchForView);
          const isExamActive = currentBatchObj ? currentBatchObj.testActive : false;

          return (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isExamActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    Batch Exam Status: {isExamActive ? <span className="text-emerald-600 font-bold">Active / Running</span> : <span className="text-slate-500">Not Started</span>}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Start or stop the exam for all students in this batch.</p>
                </div>

                <button
                  onClick={isExamActive ? handleStopBatchExam : handleStartBatchExam}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isExamActive
                      ? 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-700'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
                  }`}
                >
                  {isExamActive ? '⏹ Stop Exam' : '▶ Start Exam'}
                </button>
              </div>
            </div>
          );
        })()}

        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-xs">
                <th className="py-2.5 px-3">Student ID</th>
                <th className="py-2.5 px-3">Name / USN</th>
                <th className="py-2.5 px-3">Set</th>
                <th className="py-2.5 px-3">Exam Access</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.filter(s => s.batch === selectedBatchForView).length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No students assigned to this batch. Go to the "Students" tab to assign students to this batch.
                  </td>
                </tr>
              ) : (
                students.filter(s => s.batch === selectedBatchForView).map(stu => (
                  <tr key={stu._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">{stu.studentId}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-900 font-semibold">{stu.name}</div>
                      <div className="text-xs text-slate-400 font-mono font-medium">{stu.usn}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded font-bold text-slate-700">
                        Set {stu.assignedSet}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {stu.testAllowed ? (
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded text-xs font-bold">Active / Allowed</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-400 rounded text-xs font-medium">Inactive</span>
                      )}
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
                      {stu.testSubmitted ? `${stu.score}` : '--'}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleRemoveFromBatch(stu)}
                        className="px-2.5 py-1 text-[11px] font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default BatchesTab;
