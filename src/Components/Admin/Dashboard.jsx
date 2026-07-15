import React, { useState, useEffect } from 'react';
import { LogOutIcon } from '../Icons';
import AlertDialog from '../AlertDialog';
import API_BASE from '../../api';
import Sidebar from './Sidebar';
import OverviewTab from './OverviewTab';
import StudentsTab from './StudentsTab';
import BatchesTab from './BatchesTab';
import StaffUsersTab from './AddUSer';
import QuestionsTab from './AddQuestions';
import ReportsTab from './ReportsTab';

const Dashboard = ({ token, user, logout }) => {
  const isAdmin = user.role === 'Admin';
  
  // Tab states: 'questions' is default for Staff, 'overview' for Admin
  const [activeTab, setActiveTab] = useState(isAdmin ? 'overview' : 'questions');
  
  // Dashboard lists
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    testSubmissions: 0,
    averageScore: 0,
    highScore: 0,
    setCounts: { A: 0, B: 0, C: 0, D: 0 }
  });
  
  // Global Configurations
  const [systemConfig, setSystemConfig] = useState({
    testActive: true,
    shuffleQuestions: true,
    shuffleOptions: true
  });

  // Selected student answers scorecard popup modal
  const [selectedStudentAnswers, setSelectedStudentAnswers] = useState(null);

  // Batch states
  const [batches, setBatches] = useState([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedBatchForView, setSelectedBatchForView] = useState('');

  // Staff creation form state (Admin only)
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff'
  });
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  // Questions specific states
  const [questionForm, setQuestionForm] = useState({
    _id: '',
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    setName: 'A'
  });
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [loading, setLoading] = useState(false);

  // Excel upload state
  const [excelUploadSet, setExcelUploadSet] = useState('A');
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelResult, setExcelResult] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');

  // Question list filter & selection
  const [questionFilter, setQuestionFilter] = useState('All');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Batch-level exam configuration
  const [batchExamConfig, setBatchExamConfig] = useState({
    totalQuestionsToServe: 30,
    shuffleQuestions: true,
    shuffleOptions: true
  });

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    if (selectedBatchForView && batches.length > 0) {
      const bObj = batches.find(b => b.name === selectedBatchForView);
      if (bObj) {
        setBatchExamConfig({
          totalQuestionsToServe: bObj.totalQuestionsToServe !== undefined ? bObj.totalQuestionsToServe : 30,
          shuffleQuestions: bObj.shuffleQuestions !== undefined ? bObj.shuffleQuestions : true,
          shuffleOptions: bObj.shuffleOptions !== undefined ? bObj.shuffleOptions : true
        });
      }
    }
  }, [selectedBatchForView, batches]);

  useEffect(() => {
    fetchSystemConfig();
    fetchQuestions();

    if (isAdmin) {
      fetchStats();
      fetchStudents();
      fetchUsers();
      fetchBatches();
    }
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/config`);
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
        if (data.length > 0) {
          if (!selectedBatch) setSelectedBatch(data[0].name);
          if (!selectedBatchForView) setSelectedBatchForView(data[0].name);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      showAlert('Batch name cannot be empty', 'Error', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/batches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newBatchName.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setBatches([...batches, data]);
        setSelectedBatch(data.name);
        setNewBatchName('');
        showAlert(`Batch "${data.name}" created successfully!`, 'Success', 'success');
      } else {
        const data = await res.json();
        showAlert(data.message || 'Error creating batch', 'Error', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignBatch = async () => {
    if (selectedStudentIds.length === 0) {
      showAlert('Please select at least one student first using the checkboxes.', 'No Student Selected', 'warning');
      return;
    }
    if (!selectedBatch) {
      showAlert('Please select a batch first (or create one).', 'No Batch Selected', 'warning');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/students/assign-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds: selectedStudentIds, batchName: selectedBatch })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message, 'Success', 'success');
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        showAlert(data.message || 'Error assigning batch', 'Error', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromBatch = async (stu) => {
    showConfirm(
      `Remove "${stu.name}" from batch "${stu.batch}"? They will become unassigned.`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/students/${stu._id}/remove-batch`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (res.ok) {
            showAlert(data.message, 'Removed', 'success');
            fetchStudents();
          } else {
            showAlert(data.message || 'Error removing student from batch', 'Error', 'error');
          }
        } catch (err) {
          console.error(err);
        }
      },
      'Remove from Batch'
    );
  };

  const handleDeleteBatch = async (batchName) => {
    showConfirm(
      `Delete batch "${batchName}"? All students in this batch will be unassigned. This cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/batches/${encodeURIComponent(batchName)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            showAlert(data.message, 'Batch Deleted', 'success');
            if (selectedBatchForView === batchName) setSelectedBatchForView(batches[0]?.name || '');
            fetchBatches();
            fetchStudents();
          } else {
            showAlert(data.message || 'Error deleting batch', 'Error', 'error');
          }
        } catch (err) {
          console.error(err);
        }
      },
      'Delete Batch'
    );
  };

  const handleStartSelectedTests = async () => {
    if (selectedStudentIds.length === 0) {
      showAlert('Please select at least one student first using the checkboxes.', 'No Student Selected', 'warning');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/students/start-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds: selectedStudentIds })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message, 'Success', 'success');
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        showAlert(data.message || 'Error activating exams', 'Error', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopSelectedTests = async () => {
    if (selectedStudentIds.length === 0) {
      showAlert('Please select at least one student first using the checkboxes.', 'No Student Selected', 'warning');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/students/stop-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds: selectedStudentIds })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message, 'Success', 'success');
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        showAlert(data.message || 'Error deactivating exams', 'Error', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfigToggle = async (key, val) => {
    try {
      const updatedConfig = { ...systemConfig, [key]: val };
      const res = await fetch(`${API_BASE}/api/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedConfig)
      });
      const data = await res.json();
      if (res.ok) {
        setSystemConfig(data.config);
      } else {
        showAlert(data.message || 'Failed to update configuration', 'Error', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetStudent = async (studentId) => {
    showConfirm("Are you sure you want to reset this student's test? They will be allowed to retake it.", async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/reset`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchStudents();
          fetchStats();
        } else {
          const data = await res.json();
          showAlert(data.message || 'Failed to reset test', 'Error', 'error');
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteAllStudents = async () => {
    showConfirm("Are you absolutely sure you want to DELETE ALL STUDENTS? This will also reset the student ID counter.", async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/students/clear-all`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          showAlert(data.message, 'Success', 'success');
          fetchStudents();
          fetchStats();
        } else {
          showAlert(data.message || 'Failed to delete all students', 'Error', 'error');
        }
      } catch (err) {
        console.error(err);
      }
    }, "DANGER: Delete All Data");
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionForm.questionText.trim()) return showAlert('Question Text is required', 'Validation Error', 'warning');
    if (questionForm.options.some(opt => !opt.trim())) return showAlert('All 4 options must be filled', 'Validation Error', 'warning');

    setLoading(true);
    try {
      const url = isEditingQuestion 
        ? `${API_BASE}/api/questions/${questionForm._id}` 
        : `${API_BASE}/api/questions`;
      
      const method = isEditingQuestion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionForm)
      });

      const data = await res.json();
      if (res.ok) {
        setShowQuestionModal(false);
        fetchQuestions();
        if (isAdmin) fetchStats();
      } else {
        showAlert(data.message || 'Error saving question', 'Error', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (q) => {
    setQuestionForm({
      _id: q._id,
      questionText: q.questionText,
      options: [...q.options],
      correctOptionIndex: q.correctOptionIndex,
      setName: q.setName
    });
    setIsEditingQuestion(true);
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = async (qId) => {
    showConfirm('Delete this question permanently?', async () => {
      try {
        const res = await fetch(`${API_BASE}/api/questions/${qId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchQuestions();
          if (isAdmin) fetchStats();
        } else {
          const data = await res.json();
          showAlert(data.message || 'Error deleting question', 'Error', 'error');
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleStartBatchExam = async () => {
    if (!selectedBatchForView) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/batches/${encodeURIComponent(selectedBatchForView)}/start-exam`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchExamConfig)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message, 'Exam Started', 'success');
        fetchBatches();
        fetchStudents();
      } else {
        showAlert(data.message || 'Error starting exam', 'Error', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to start exam due to network error.', 'Error', 'error');
    }
  };

  const handleStopBatchExam = async () => {
    if (!selectedBatchForView) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/batches/${encodeURIComponent(selectedBatchForView)}/stop-exam`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message, 'Exam Stopped', 'warning');
        fetchBatches();
        fetchStudents();
      } else {
        showAlert(data.message || 'Error stopping exam', 'Error', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to stop exam due to network error.', 'Error', 'error');
    }
  };

  const handleDeleteStudents = async (studentIds, callback) => {
    showConfirm(`Are you sure you want to delete ${studentIds.length} student(s)? This action cannot be undone.`, async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/students`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ studentIds })
        });
        
        const contentType = res.headers.get("content-type");
        let data = {};
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          data = { message: 'Server returned a non-JSON response (possibly still deploying).' };
        }
        
        if (res.ok) {
          showAlert(data.message, 'Success', 'success');
          fetchStudents();
          fetchStats(); // Update stats in Overview
          if (callback) callback();
        } else {
          showAlert(data.message || 'Failed to delete students', 'Error', 'error');
        }
      } catch (err) {
        console.error(err);
        showAlert('Server error, please try again.', 'Error', 'error');
      }
    });
  };

  const handleBulkDeleteQuestions = async () => {
    if (selectedQuestionIds.length === 0) return;
    showConfirm(`Delete ${selectedQuestionIds.length} selected question(s) permanently?`, async () => {
      try {
        await Promise.all(
          selectedQuestionIds.map(id =>
            fetch(`${API_BASE}/api/questions/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
          )
        );
        setSelectedQuestionIds([]);
        fetchQuestions();
        if (isAdmin) fetchStats();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelFileName(file.name);
    setExcelResult(null);
    setExcelUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('setName', excelUploadSet);

    try {
      const res = await fetch(`${API_BASE}/api/questions/upload-excel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setExcelResult({
          type: 'success',
          message: data.message,
          imported: data.imported,
          skipped: data.skipped,
          skippedRows: data.skippedRows
        });
        fetchQuestions();
        if (isAdmin) fetchStats();
      } else {
        setExcelResult({
          type: 'error',
          message: data.message || 'Error uploading Excel sheet'
        });
      }
    } catch (err) {
      console.error(err);
      setExcelResult({ type: 'error', message: 'Network or server error. Please try again.' });
    } finally {
      setExcelUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.password.trim()) {
      setStaffError('Please fill in all fields (name, email, password)');
      return;
    }

    if (staffForm.password.length < 6) {
      setStaffError('Password must be at least 6 characters');
      return;
    }

    try {
      const payload = { ...staffForm };

      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setStaffSuccess('User created successfully');
        setStaffForm({ name: '', email: '', password: '', role: 'Staff' });
        fetchUsers();
      } else {
        setStaffError(data.message || 'Failed to create user');
      }
    } catch (err) {
      setStaffError('Server error, please try again.');
    }
  };

  const handleDeleteUser = async (uId) => {
    showConfirm('Delete this user account?', async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${uId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchUsers();
        } else {
          const data = await res.json();
          showAlert(data.message || 'Error deleting user', 'Error', 'error');
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-800 lg:h-screen lg:overflow-hidden">
      
      {/* SIDEBAR COMPONENT (Collapsible in mobile, fixed in desktop) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={isAdmin} 
        logout={logout}
        user={user}
      />

      {/* MAIN VIEW AREA */}
      <main className="flex-1 p-6 lg:p-10 w-full overflow-y-auto max-w-7xl mx-auto">
        {/* RENDER ACTIVE TAB COMPONENT */}
        {isAdmin && activeTab === 'overview' && (
          <OverviewTab
            token={token}
            students={students}
            stats={stats}
            systemConfig={systemConfig}
            formatDateTime={formatDateTime}
            showAlert={showAlert}
            handleConfigToggle={handleConfigToggle}
            setSelectedStudentAnswers={setSelectedStudentAnswers}
            handleDeleteStudents={handleDeleteStudents}
          />
        )}

        {isAdmin && activeTab === 'students' && (
          <StudentsTab
            token={token}
            students={students}
            batches={batches}
            fetchStudents={fetchStudents}
            fetchBatches={fetchBatches}
            showAlert={showAlert}
            showConfirm={showConfirm}
            handleCreateBatch={handleCreateBatch}
            handleAssignBatch={handleAssignBatch}
            handleResetStudent={handleResetStudent}
            handleStartSelectedTests={handleStartSelectedTests}
            handleStopSelectedTests={handleStopSelectedTests}
            setSelectedStudentAnswers={setSelectedStudentAnswers}
            newBatchName={newBatchName}
            setNewBatchName={setNewBatchName}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            selectedStudentIds={selectedStudentIds}
            setSelectedStudentIds={setSelectedStudentIds}
            handleDeleteStudents={handleDeleteStudents}
            handleDeleteAllStudents={handleDeleteAllStudents}
          />
        )}

        {isAdmin && activeTab === 'users' && (
          <StaffUsersTab
            token={token}
            users={users}
            fetchUsers={fetchUsers}
            showAlert={showAlert}
            showConfirm={showConfirm}
            handleCreateStaff={handleCreateStaff}
            handleDeleteUser={handleDeleteUser}
            staffForm={staffForm}
            setStaffForm={setStaffForm}
            staffError={staffError}
            setStaffError={setStaffError}
            staffSuccess={staffSuccess}
            setStaffSuccess={setStaffSuccess}
          />
        )}

        {isAdmin && activeTab === 'batches' && (
          <BatchesTab
            token={token}
            students={students}
            batches={batches}
            fetchStudents={fetchStudents}
            fetchBatches={fetchBatches}
            showAlert={showAlert}
            showConfirm={showConfirm}
            formatDateTime={formatDateTime}
            handleRemoveFromBatch={handleRemoveFromBatch}
            handleDeleteBatch={handleDeleteBatch}
            handleStartBatchExam={handleStartBatchExam}
            handleStopBatchExam={handleStopBatchExam}
            selectedBatchForView={selectedBatchForView}
            setSelectedBatchForView={setSelectedBatchForView}
            batchExamConfig={batchExamConfig}
            setBatchExamConfig={setBatchExamConfig}
          />
        )}

        {activeTab === 'questions' && (
          <QuestionsTab
            token={token}
            isAdmin={isAdmin}
            questions={questions}
            fetchQuestions={fetchQuestions}
            fetchStats={fetchStats}
            showAlert={showAlert}
            showConfirm={showConfirm}
            systemConfig={systemConfig}
            handleConfigToggle={handleConfigToggle}
            handleQuestionSubmit={handleQuestionSubmit}
            handleEditQuestion={handleEditQuestion}
            handleDeleteQuestion={handleDeleteQuestion}
            handleBulkDeleteQuestions={handleBulkDeleteQuestions}
            handleExcelUpload={handleExcelUpload}
            questionForm={questionForm}
            setQuestionForm={setQuestionForm}
            showQuestionModal={showQuestionModal}
            setShowQuestionModal={setShowQuestionModal}
            isEditingQuestion={isEditingQuestion}
            setIsEditingQuestion={setIsEditingQuestion}
            excelUploadSet={excelUploadSet}
            setExcelUploadSet={setExcelUploadSet}
            excelUploading={excelUploading}
            excelResult={excelResult}
            setExcelResult={setExcelResult}
            excelFileName={excelFileName}
            setExcelFileName={setExcelFileName}
            questionFilter={questionFilter}
            setQuestionFilter={setQuestionFilter}
            selectedQuestionIds={selectedQuestionIds}
            setSelectedQuestionIds={setSelectedQuestionIds}
          />
        )}

        {isAdmin && activeTab === 'reports' && (
          <ReportsTab students={students} />
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: UPLOAD / EDIT QUESTION FORM */}
      {/* ======================================================== */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn text-slate-800">
          <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">
              {isEditingQuestion ? 'Modify Question' : 'Upload MCQ Question'}
            </h3>

            <form onSubmit={handleQuestionSubmit} className="space-y-5 text-sm text-slate-700">
              
              <div>
                <label className="block text-xs uppercase font-bold text-slate-550 mb-1.5">Question Text</label>
                <textarea
                  rows="3"
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 placeholder-slate-400 font-medium"
                  placeholder="Enter the question text details..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-550 mb-1.5">Target Question Set</label>
                  <select
                    value={questionForm.setName}
                    onChange={(e) => setQuestionForm({ ...questionForm, setName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 cursor-pointer font-semibold"
                  >
                    <option value="A">Set A</option>
                    <option value="B">Set B</option>
                    <option value="C">Set C</option>
                    <option value="D">Set D</option>
                  </select>
                </div>
              </div>

              {/* Options inputs with Correct Option marking */}
              <div className="space-y-3">
                <label className="block text-xs uppercase font-bold text-slate-500">
                  Multiple Choices & Correct Option Marker
                </label>
                <span className="text-[10px] text-slate-400 block -mt-2">
                  Fill in choices and select the radio button next to the correct choice.
                </span>

                {questionForm.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="radio"
                      name="correctOptionIndex"
                      checked={questionForm.correctOptionIndex === idx}
                      onChange={() => setQuestionForm({ ...questionForm, correctOptionIndex: idx })}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 bg-white border-slate-350 cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[idx] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOptions });
                      }}
                      className="flex-1 bg-transparent border-0 text-slate-900 placeholder-slate-400 focus:outline-none p-0 text-sm font-medium"
                      placeholder={`Option ${String.fromCharCode(65 + idx)} details`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer text-center"
                >
                  {loading ? 'Saving...' : 'Save Question'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW STUDENT ANSWERS REPORT POPUP (ADMIN ONLY) */}
      {/* ======================================================== */}
      {isAdmin && selectedStudentAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn text-left text-slate-800">
          <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            
            <div className="pb-4 border-b border-slate-100 mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedStudentAnswers.name}'s Scorecard</h3>
                <span className="text-xs text-slate-500 font-medium">ID: {selectedStudentAnswers.studentId} | USN: {selectedStudentAnswers.usn} | Set: {selectedStudentAnswers.assignedSet}</span>
              </div>
              <button
                onClick={() => setSelectedStudentAnswers(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer text-lg"
              >
                &times; Close
              </button>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl mb-6 flex justify-between items-center text-sm font-medium">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-wider">Total Score Obtained</span>
                <span className="text-emerald-600 font-bold text-lg font-mono">
                  {selectedStudentAnswers.score} / {selectedStudentAnswers.answers.length} Correct
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-wider">Submission Date</span>
                <span className="text-slate-700 font-mono text-xs font-semibold">
                  {new Date(selectedStudentAnswers.testSubmittedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Answers breakdown */}
            <div className="space-y-4 text-xs md:text-sm">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">Questions Graded</h4>
              {selectedStudentAnswers.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    ans.isCorrect ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900' : 'bg-red-50/40 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-semibold text-slate-900 text-sm leading-relaxed">{idx + 1}. {ans.questionText}</p>
                    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold flex-shrink-0 ${
                      ans.isCorrect 
                        ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
                        : 'bg-red-100 border-red-200 text-red-700'
                    }`}>
                      {ans.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 font-medium text-xs">
                    <div>
                      <span className="font-bold text-slate-500">Student selected:</span>{' '}
                      <span className={ans.isCorrect ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                        {ans.selectedOptionText || '(Skipped / Not Answered)'}
                      </span>
                    </div>
                    {!ans.isCorrect && (
                      <div className="text-emerald-700 font-bold">
                        <span className="font-bold text-slate-500">Correct Choice:</span> {ans.correctOptionText}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <button
                onClick={() => setSelectedStudentAnswers(null)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer text-center text-sm"
              >
                Close Scorecard
              </button>
            </div>

          </div>
        </div>
      )}

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

