import React, { useState } from 'react';

const StudentsTab = ({
  token,
  students,
  batches,
  fetchStudents,
  fetchBatches,
  showAlert,
  showConfirm,
  handleCreateBatch,
  handleAssignBatch,
  handleResetStudent,
  handleStartSelectedTests,
  handleStopSelectedTests,
  setSelectedStudentAnswers,
  newBatchName,
  setNewBatchName,
  selectedBatch,
  setSelectedBatch,
  selectedStudentIds,
  setSelectedStudentIds,
  handleDeleteStudents,
  handleDeleteAllStudents
}) => {
  const [idRange, setIdRange] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(stu => 
    stu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stu.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRange = () => {
    if (!idRange.includes('-')) {
      showAlert('Please enter a valid range format (e.g. 1-10)', 'Invalid Format', 'error');
      return;
    }
    const [start, end] = idRange.split('-').map(str => parseInt(str.trim(), 10));
    if (isNaN(start) || isNaN(end) || start > end) {
      showAlert('Please enter valid numbers for the range (e.g. 1-10)', 'Invalid Range', 'error');
      return;
    }

    const idsToSelect = students.filter(stu => {
      const match = stu.studentId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        return num >= start && num <= end;
      }
      return false;
    }).map(stu => stu._id);

    const newSelection = new Set([...selectedStudentIds, ...idsToSelect]);
    setSelectedStudentIds(Array.from(newSelection));
    setIdRange('');
  };
  return (
    <div className="space-y-6">
      {/* BATCH CONTROL BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Create Batch Card */}
        <div className="glass rounded-2xl border border-slate-200 p-6 bg-white shadow-md text-left">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Create Student Batch</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 placeholder-slate-400 text-sm font-medium"
              placeholder="e.g. Batch-2026-A"
            />
            <button
              onClick={handleCreateBatch}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-sm"
            >
              Create Batch
            </button>
          </div>
        </div>

        {/* Batch Assignments Card */}
        <div className="glass rounded-2xl border border-slate-200 p-6 bg-white shadow-md text-left">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Assign Batch for Selected ({selectedStudentIds.length})</h3>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Select Batch Dropdown */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 text-sm font-medium cursor-pointer"
              >
                <option value="">-- Choose Batch --</option>
                {batches.map(b => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
              </select>
              <button
                onClick={handleAssignBatch}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all border border-slate-800"
              >
                Assign Batch
              </button>
              <button
                onClick={handleDeleteAllStudents}
                className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all border border-red-600"
              >
                Delete All Students
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* STUDENTS TABLE */}
      <div className="glass rounded-2xl border border-slate-200 p-6 shadow-xl animate-fadeIn bg-white text-left">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">Registered Student Submissions</h2>
          
          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0 overflow-x-auto pb-1 lg:pb-0">
            {/* Name/ID Search */}
            <input
              type="text"
              placeholder="Search by Name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 w-32 xl:w-40 min-w-[120px]"
            />

            {/* Bulk ID Range */}
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden xl:inline ml-1">Bulk Select:</span>
            <input
              type="text"
              placeholder="ID Range (e.g. 1-5)"
              value={idRange}
              onChange={(e) => setIdRange(e.target.value)}
              className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 w-24 min-w-[90px]"
            />
            <button
              onClick={handleSelectRange}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              Select
            </button>
            <button
              onClick={() => {
                setSelectedStudentIds([]);
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              Clear All
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {selectedStudentIds.length > 0 && (
              <>
                <button
                  onClick={handleStartSelectedTests}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Activate Selected
                </button>
                <button
                  onClick={handleStopSelectedTests}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Deactivate Selected
                </button>
                <button
                  onClick={() => handleDeleteStudents(selectedStudentIds)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Delete Selected
                </button>
              </>
            )}
            <span className="text-xs font-semibold text-slate-500">
              Selected {selectedStudentIds.length} of {filteredStudents.length}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-xs font-bold">
                <th className="py-3 px-2 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentIds(filteredStudents.map(s => s._id));
                      } else {
                        setSelectedStudentIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 text-left">Student ID</th>
                <th className="py-3 px-4 text-left">Name / USN</th>
                <th className="py-3 px-4 text-left">Batch</th>
                <th className="py-3 px-4 text-left">Set</th>
                <th className="py-3 px-4 text-left">Exam Access</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Score</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map(stu => {
                  const isSelected = selectedStudentIds.includes(stu._id);
                  return (
                    <tr key={stu._id} className={`hover:bg-slate-50/50 ${isSelected ? 'bg-indigo-50/20' : ''}`}>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds([...selectedStudentIds, stu._id]);
                            } else {
                              setSelectedStudentIds(selectedStudentIds.filter(id => id !== stu._id));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">{stu.studentId}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-semibold">{stu.name}</div>
                        <div className="text-xs text-slate-400 font-mono font-medium">{stu.usn}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          {stu.batch || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 rounded font-bold text-slate-700">{stu.assignedSet}</span></td>
                      <td className="py-3 px-4">
                        {stu.testAllowed ? (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded text-xs font-bold">Active / Allowed</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-400 rounded text-xs font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {stu.testSubmitted ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full text-xs font-bold">Submitted</span>
                        ) : stu.testStarted ? (
                          <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-full text-xs font-bold">In Progress</span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-full text-xs font-medium">Registered</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {stu.testSubmitted ? (
                          <button
                            onClick={() => setSelectedStudentAnswers(stu)}
                            className="text-emerald-600 hover:underline font-bold text-left cursor-pointer"
                          >
                            {stu.score} (Review)
                          </button>
                        ) : '--'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleResetStudent(stu._id)}
                          className="py-1 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reset Test
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentsTab;
