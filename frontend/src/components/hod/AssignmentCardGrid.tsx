import React, { useState } from 'react';
import { Plus, X, Check } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const AssignmentCardGrid = ({
  items,
  assignedItems = [],
  facultyList = [],
  onAssign,
  onRemove,
  pickerType = 'single',
  renderPickerItem = (facId) => facId,
  completionFn,
  titleKey = "name",
  subtitleKey = "id",
  itemMatchKey = "student_id" // e.g. 'student_id' for mentors, 'section' for ClassInCharge
}) => {
  const [activePicker, setActivePicker] = useState(null); // items ID
  const [search, setSearch] = useState("");

  const filteredFaculty = facultyList.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.id.toLowerCase().includes(search.toLowerCase()));

  const handleAssign = (item, facId) => {
    onAssign(item, facId);
    if (pickerType === 'single') setActivePicker(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map(item => {
        // Assignments relevant to this specific item
        const itemAssignments = assignedItems.filter(a => {
            if (itemMatchKey === 'section') {
                return a.department === item.department && a.batch === item.batch && a.section === item.section;
            }
            return a[itemMatchKey] === (item.id || item[subtitleKey])
        });
        const { count, target } = completionFn(item, itemAssignments);
        const statusColor = count >= target ? "bg-emerald-500" : "bg-rose-500";

        const itemId = item.id || item[subtitleKey] || (item.batch + item.section);

        return (
          <motion.div
            key={itemId}
            layout
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative"
          >
            {/* Status Strip */}
            <div className={`h-1.5 w-full ${statusColor}`} />
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item[titleKey]}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{item[subtitleKey]}</p>

              <div className="space-y-2 mb-4">
                <AnimatePresence>
                  {itemAssignments.map(assignment => (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      key={assignment.id} 
                      className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600"
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{assignment.faculty_name || renderPickerItem(assignment.faculty_id)}</p>
                      </div>
                      <button onClick={() => onRemove(assignment.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 dark:bg-red-500/10 rounded-md">
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {itemAssignments.length === 0 && (
                   <p className="text-sm text-gray-400 italic">No assigned faculty</p>
                )}
              </div>

              {activePicker === itemId ? (
                <div className="mt-auto border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search faculty..." 
                      className="text-sm w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <button onClick={() => setActivePicker(null)} className="ml-2 text-gray-500"><X size={16} /></button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {filteredFaculty.map(fac => {
                      const isAssigned = itemAssignments.some(a => a.faculty_id === fac.id);
                      return (
                        <button 
                          key={fac.id}
                          disabled={isAssigned}
                          onClick={() => handleAssign(item, fac.id)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-md flex items-center justify-between ${isAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                        >
                          <span className="truncate dark:text-gray-300">{fac.name}</span>
                          {isAssigned && <Check className="text-green-500 flex-shrink-0" size={14} />}
                        </button>
                      );
                    })}
                    {filteredFaculty.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No matches</p>}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => { setActivePicker(itemId); setSearch(""); }}
                  disabled={pickerType === 'single' && count >= target}
                  className={`mt-auto w-full flex items-center justify-center space-x-1 py-2 rounded-lg text-sm font-medium transition-colors border border-dashed
                    ${(pickerType === 'single' && count >= target) 
                      ? 'border-gray-200 text-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                      : 'border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-500/50 dark:text-blue-400 dark:hover:bg-blue-500/10'}`}
                >
                  <Plus size={16} />
                  <span>Assign Faculty</span>
                </button>
              )}
            </div>
            
            {/* Completion Footer */}
            <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 h-10 shrink-0">
               <span>{count} / {target} Assigned</span>
               {count >= target ? <span className="text-green-600 dark:text-green-400 font-medium">Complete</span> : <span className="text-amber-500">Pending</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AssignmentCardGrid;
