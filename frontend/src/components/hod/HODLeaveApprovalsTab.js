import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api, { hodLeaveAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from '@phosphor-icons/react';

const HODLeaveApprovalsTab = () => {
  const [facultyLeaves, setFacultyLeaves] = useState([]);
  const [studentLeaves, setStudentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('faculty'); // 'faculty' or 'student'

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const [facRes, studRes] = await Promise.all([
        api.get('/api/hod/leave/pending').catch(e => ({ data: [] })),
        api.get('/api/hod/leave/student-pending').catch(e => ({ data: [] }))
      ]);
      setFacultyLeaves(facRes.data || []);
      setStudentLeaves(studRes.data || []);
    } catch (err) {
      toast.error('Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleReview = async (leaveId, action, isCancelReview = false) => {
    try {
      if (isCancelReview) {
        await hodLeaveAPI.reviewCancellation(leaveId, { action, remarks: `Processed by HOD` });
        toast.success(`Cancellation ${action}d`);
      } else {
        await api.put(`/api/hod/leave/${leaveId}/review`, { action, remarks: `Processed by HOD` });
        toast.success(`Leave ${action}d`);
      }
      fetchLeaves();
    } catch (err) {
      toast.error(`Failed to ${action} request`);
    }
  };

  const renderQueue = (queue) => {
    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading queue...</div>;
    if (!queue || queue.length === 0) return <div className="p-8 text-center text-gray-500 italic">No pending requests</div>;

    return (
      <div className="space-y-4">
        <AnimatePresence>
          {queue.map(leave => {
            const isCancelReview = leave.status === 'cancellation_requested' || leave.status === 'partially_cancelled';
            const badgeColor = isCancelReview ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200';
            const badgeLabel = isCancelReview ? 'Cancellation Review' : 'Pending Review';

            return (
              <motion.div 
                key={leave.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-5 border shadow-sm ${isCancelReview ? 'border-amber-300 dark:border-amber-700/50' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                       {leave.applicant_name}
                       <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border ${badgeColor}`}>
                         {badgeLabel}
                       </span>
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Type: <span className="uppercase font-medium">{leave.leave_type}</span> | From: {new Date(leave.from_date).toLocaleDateString()} - To: {new Date(leave.to_date).toLocaleDateString()}
                    </p>
                  </div>
                  {leave.document_url && (
                    <a href={leave.document_url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">View Document</a>
                  )}
                </div>
                
                <div className="mb-5">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Reason:</span> {leave.reason}
                  </p>
                  {leave.cancellation_meta && (
                     <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg text-sm">
                       <span className="font-medium text-amber-800 dark:text-amber-500">Partial Cancellation Request:</span> 
                       Cancel from <b>{leave.cancellation_meta.cancel_from}</b> to <b>{leave.cancellation_meta.cancel_to}</b>
                     </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-2">
                  <button 
                    onClick={() => handleReview(leave.id, 'reject', isCancelReview)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <X size={16} /> Reject {isCancelReview ? 'Cancel' : 'Leave'}
                  </button>
                  <button 
                    onClick={() => handleReview(leave.id, 'approve', isCancelReview)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <CheckCircle size={16} /> Approve {isCancelReview ? 'Cancel' : 'Leave'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leave Approvals & Cancellations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review pending leave applications and cancellation requests.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        <button 
          onClick={() => setActiveSubTab('faculty')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'faculty' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Faculty Leaves ({facultyLeaves.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('student')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'student' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Student Leaves ({studentLeaves.length})
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/30 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl min-h-[400px]">
         {activeSubTab === 'faculty' ? renderQueue(facultyLeaves) : renderQueue(studentLeaves)}
      </div>
    </div>
  );
};

export default HODLeaveApprovalsTab;
