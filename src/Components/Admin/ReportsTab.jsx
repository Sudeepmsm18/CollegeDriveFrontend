import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportsTab = ({ students }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);

  // Filter students based on search query and minimum score
  const filteredStudents = students.filter(stu => {
    const matchesSearch = 
      stu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      stu.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesScore = minScore === '' || (stu.testSubmitted && stu.score >= Number(minScore));
    
    if (minScore !== '' && !stu.testSubmitted) return false;

    return matchesSearch && matchesScore;
  });

  const generatePDF = (student) => {
    const doc = new jsPDF();
    
    // Load image
    const img = new Image();
    img.src = '/image.png';
    img.onload = () => {
      // Header Logo
      // img, type, x, y, width, height
      doc.addImage(img, 'PNG', 14, 15, 40, 15);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("Student Performance Report", 14, 38);
      
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 43, 196, 43);
    
      // Student Details
      doc.setFontSize(12);
      doc.text(`Name: ${student.name}`, 14, 53);
      doc.text(`Student ID: ${student.studentId}`, 14, 60);
      doc.text(`USN: ${student.usn}`, 14, 67);
      doc.text(`College: ${student.collegeName}`, 14, 74);
      doc.text(`Email: ${student.email}`, 100, 53);
      doc.text(`Phone: ${student.phone}`, 100, 60);
      doc.text(`Batch: ${student.batch || 'Unassigned'}   |   Set: ${student.assignedSet}`, 100, 67);
      
      // Score & Status
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text("Examination Results", 14, 88);
      
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      const status = student.testSubmitted ? "Completed" : (student.testStarted ? "In Progress" : "Registered");
      doc.text(`Status: ${status}`, 14, 98);
      
      if (student.testSubmitted) {
        doc.text(`Final Score: ${student.score}`, 14, 105);
        doc.text(`Test Started: ${new Date(student.testStartedAt).toLocaleString()}`, 14, 112);
        doc.text(`Test Submitted: ${new Date(student.testSubmittedAt).toLocaleString()}`, 14, 119);
        
        // Calculate duration
        const durationMs = new Date(student.testSubmittedAt) - new Date(student.testStartedAt);
        const durationMins = Math.floor(durationMs / 60000);
        const durationSecs = Math.floor((durationMs % 60000) / 1000);
        doc.text(`Time Taken: ${durationMins}m ${durationSecs}s`, 14, 126);
      }
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report generated on: ${new Date().toLocaleString()}`, 14, 280);
      
      doc.save(`${student.studentId}_Report.pdf`);
    };
  };

  const exportToExcel = () => {
    // If user selected specific students, export only those. Otherwise export all currently filtered.
    const exportList = selectedStudentIds.length > 0 
      ? students.filter(s => selectedStudentIds.includes(s._id))
      : filteredStudents;

    if (exportList.length === 0) return;
    
    const data = exportList.map(stu => ({
      'Student ID': stu.studentId,
      'Name': stu.name,
      'USN': stu.usn,
      'Email': stu.email,
      'Phone': stu.phone,
      'College': stu.collegeName,
      'Batch': stu.batch || 'Unassigned',
      'Set': stu.assignedSet,
      'Status': stu.testSubmitted ? "Completed" : (stu.testStarted ? "In Progress" : "Registered"),
      'Score': stu.testSubmitted ? stu.score : 'N/A',
      'Started At': stu.testStartedAt ? new Date(stu.testStartedAt).toLocaleString() : 'N/A',
      'Submitted At': stu.testSubmittedAt ? new Date(stu.testSubmittedAt).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    XLSX.writeFile(workbook, "Student_Reports.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="glass rounded-2xl border border-slate-200 p-6 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search Name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 w-48 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Min Score (e.g. 15)"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 w-40 text-sm"
          />
          {(searchQuery || minScore) && (
            <button
              onClick={() => { setSearchQuery(''); setMinScore(''); }}
              className="text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
            >
              ✕ Clear
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (selectedStudentIds.length === filteredStudents.length) {
                setSelectedStudentIds([]);
              } else {
                setSelectedStudentIds(filteredStudents.map(s => s._id));
              }
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-colors cursor-pointer text-sm flex items-center gap-2"
          >
            {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect All' : 'Select All Filtered'}
          </button>
          
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer text-sm flex items-center gap-2"
          >
            {selectedStudentIds.length > 0 
              ? `Export Selected (${selectedStudentIds.length})` 
              : `Export All Filtered (${filteredStudents.length})`}
          </button>
        </div>
      </div>

      {/* STUDENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white/50 rounded-2xl border border-slate-200 border-dashed">
            No students found matching your filters.
          </div>
        ) : (
          filteredStudents.map(stu => (
            <div 
              key={stu._id} 
              onClick={() => setSelectedStudentForModal(stu)}
              className={`group relative border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer ${
                selectedStudentIds.includes(stu._id) ? 'bg-indigo-50/50 border-indigo-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="max-w-[70%] flex gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(stu._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedStudentIds(prev => 
                        prev.includes(stu._id) ? prev.filter(id => id !== stu._id) : [...prev, stu._id]
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 truncate" title={stu.name}>{stu.name}</h3>
                    <p className="text-xs font-mono text-indigo-600 font-semibold">{stu.studentId}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${stu.testSubmitted ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : (stu.testStarted ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200')}`}>
                  {stu.testSubmitted ? 'Submitted' : (stu.testStarted ? 'In Progress' : 'Registered')}
                </div>
              </div>
              
              <div className="space-y-1.5 mb-8 text-xs text-slate-600">
                <p><span className="font-semibold text-slate-400 w-16 inline-block">USN:</span> {stu.usn}</p>
                <p className="truncate" title={stu.collegeName}><span className="font-semibold text-slate-400 w-16 inline-block">College:</span> {stu.collegeName}</p>
                <p className="truncate" title={stu.email}><span className="font-semibold text-slate-400 w-16 inline-block">Email:</span> {stu.email}</p>
                {stu.testSubmitted && (
                  <p><span className="font-semibold text-slate-400 w-16 inline-block">Score:</span> <span className="font-bold text-slate-900">{stu.score}</span></p>
                )}
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 pt-10 bg-gradient-to-t from-white via-white to-transparent flex justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    generatePDF(stu);
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all duration-300 cursor-pointer border border-indigo-200 shadow-sm"
                >
                  Download PDF Report
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* STUDENT DETAILS MODAL */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 rounded-t-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {selectedStudentForModal.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedStudentForModal.name}</h2>
                  <p className="text-sm font-mono text-indigo-600 font-semibold">{selectedStudentForModal.studentId}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentForModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Profile Details */}
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">Student Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-slate-500 font-medium mb-1">Email</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForModal.email}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-slate-500 font-medium mb-1">Phone</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForModal.phone}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-slate-500 font-medium mb-1">USN</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForModal.usn}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-slate-500 font-medium mb-1">College</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForModal.collegeName}</span>
                  </div>
                </div>
              </div>

              {/* Exam Details */}
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">Examination Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="block text-indigo-500 font-medium mb-1">Batch & Set</span>
                    <span className="font-semibold text-indigo-950">Batch {selectedStudentForModal.batch || 'Unassigned'} • Set {selectedStudentForModal.assignedSet}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${selectedStudentForModal.testSubmitted ? 'bg-emerald-50 border-emerald-100' : (selectedStudentForModal.testStarted ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100')}`}>
                    <span className={`block font-medium mb-1 ${selectedStudentForModal.testSubmitted ? 'text-emerald-600' : (selectedStudentForModal.testStarted ? 'text-amber-600' : 'text-slate-500')}`}>Status</span>
                    <span className={`font-bold ${selectedStudentForModal.testSubmitted ? 'text-emerald-900' : (selectedStudentForModal.testStarted ? 'text-amber-900' : 'text-slate-900')}`}>
                      {selectedStudentForModal.testSubmitted ? 'Completed' : (selectedStudentForModal.testStarted ? 'In Progress' : 'Registered')}
                    </span>
                  </div>
                </div>
                
                {selectedStudentForModal.testSubmitted && (
                  <div className="mt-4 p-5 bg-white border border-slate-200 shadow-sm rounded-xl grid grid-cols-2 gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-medium text-xs uppercase mb-1">Final Score</span>
                      <span className="font-bold text-3xl text-indigo-600">{selectedStudentForModal.score}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-medium text-xs uppercase mb-1">Time Taken</span>
                      <span className="font-bold text-xl text-slate-700">
                        {Math.floor((new Date(selectedStudentForModal.testSubmittedAt) - new Date(selectedStudentForModal.testStartedAt)) / 60000)}m {' '}
                        {Math.floor(((new Date(selectedStudentForModal.testSubmittedAt) - new Date(selectedStudentForModal.testStartedAt)) % 60000) / 1000)}s
                      </span>
                    </div>
                    <div className="col-span-2 pt-3 border-t border-slate-100 mt-2 text-xs text-slate-500 flex justify-between">
                      <span>Started: {new Date(selectedStudentForModal.testStartedAt).toLocaleString()}</span>
                      <span>Submitted: {new Date(selectedStudentForModal.testSubmittedAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => generatePDF(selectedStudentForModal)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
