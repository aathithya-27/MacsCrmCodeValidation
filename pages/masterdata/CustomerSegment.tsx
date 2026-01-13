
import React, { useState, useMemo } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { TaskStatus, taskStatusApi } from '../../services/masterDataApi/taskStatus.api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useFetch } from '../../hooks/useFetch';
import { DataTable, Button, Modal, Input, Toggle } from '../../components/ui';
import { Plus, Search, GripVertical, CheckCircle2, Flag, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { sanitizeObject } from '../../utils/sanitization';
import { validateForm, validators } from '../../utils/validation';

const TaskStatusPage: React.FC = () => {
  const { TASK_STATUS } = API_ENDPOINTS.MASTER_DATA;
  const { data: statuses, loading, refetch, setData } = useFetch<TaskStatus[]>(TASK_STATUS);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<TaskStatus> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredData = useMemo(() => {
    if (!statuses) return [];
    return statuses.filter(s => s.status_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [statuses, searchQuery]);

  const handleOpenModal = (item?: TaskStatus) => {
    setEditingItem(item || { 
      status_name: '', 
      is_initial: false, 
      is_end: false, 
      status: 1, 
      comp_id: 1001 
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    const errs = validateForm(editingItem || {}, {
      status_name: [validators.required]
    });

    if (errs) {
      toast.error(errs.status_name || "Form validation failed");
      return;
    }

    setSaving(true);
    try {
      const sanitized = sanitizeObject(editingItem) as TaskStatus;
      
      if (sanitized.is_initial && statuses) {
          const previousInitial = statuses.find(s => s.is_initial && s.id !== sanitized.id);
          if (previousInitial) {
              await taskStatusApi.patch(previousInitial.id!, { is_initial: false });
          }
      }

      if (sanitized.id) {
        await taskStatusApi.update(sanitized.id, sanitized);
        toast.success("Task status updated");
      } else {
        await taskStatusApi.create(sanitized);
        toast.success("New task status created");
      }
      
      handleCloseModal();
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Operation failed. Server might be unreachable.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: TaskStatus) => {
    if (confirm(`Are you sure you want to delete status "${item.status_name}"?`)) {
        try {
          await taskStatusApi.delete(item.id!);
          toast.success("Status deleted");
          refetch();
        } catch (e) {
          toast.error("Failed to delete record");
        }
    }
  };

  const handleToggleStatus = async (item: TaskStatus) => {
      const newStatus = item.status === 1 ? 0 : 1;
      setData(prev => prev?.map(s => s.id === item.id ? { ...s, status: newStatus } : s) || []);
      try {
        await taskStatusApi.patch(item.id!, { status: newStatus });
      } catch (e) {
        toast.error("Update failed. Reverting...");
        refetch();
      }
  };

  const handleSetInitial = async (item: TaskStatus) => {
      if (item.is_initial) return; 
      
      setData(prev => prev?.map(s => {
          if (s.id === item.id) return { ...s, is_initial: true, is_end: false };
          return { ...s, is_initial: false };
      }) || []);

      try {
          const promises = [
              taskStatusApi.patch(item.id!, { is_initial: true, is_end: false })
          ];
          
          if (statuses) {
              const prevInitial = statuses.find(s => s.is_initial && s.id !== item.id);
              if (prevInitial) {
                  promises.push(taskStatusApi.patch(prevInitial.id!, { is_initial: false }));
              }
          }
          
          await Promise.all(promises);
          toast.success(`"${item.status_name}" set as system entry status`);
      } catch (e) {
          toast.error("Hierarchical update failed");
          refetch();
      }
  };

  const handleSetEnd = async (item: TaskStatus) => {
      const newVal = !item.is_end;
      
      setData(prev => prev?.map(s => s.id === item.id ? {
          ...s,
          is_end: newVal,
          is_initial: newVal ? false : s.is_initial
      } : s) || []);

      try {
          await taskStatusApi.patch(item.id!, { 
              is_end: newVal,
              ...(newVal ? { is_initial: false } : {})
          });
      } catch (e) {
          toast.error("Status synchronization failed");
          refetch();
      }
  };

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Task Pipeline Configuration">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] overflow-hidden transition-all">
          
          <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/40 dark:bg-slate-800/50">
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-600" />
                Workflow Lifecycle
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Manage task transition states</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    className="pl-9 h-11 w-full border-slate-200 dark:border-slate-600" 
                    placeholder="Search lifecycle stages..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                  />
               </div>
               <Button onClick={() => handleOpenModal()} icon={<Plus size={20} />} className="w-full sm:w-auto font-bold h-11 px-6 shadow-lg shadow-blue-500/10">Define Status</Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <DataTable 
              data={filteredData}
              loading={loading}
              columns={[
                { 
                  header: '', 
                  accessor: () => <GripVertical size={16} className="text-slate-300 cursor-grab"/>, 
                  width: 'w-10' 
                },
                { header: 'ID', accessor: 'id', width: 'w-16', className: 'text-slate-400 font-mono text-[10px] font-bold' },
                { header: 'Status Label', accessor: 'status_name', className: 'font-bold text-slate-700 dark:text-slate-200' },
                { 
                  header: 'ENTRY POINT', 
                  align: 'center',
                  accessor: (item) => (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSetInitial(item); }}
                      className={`group relative p-1.5 rounded-lg transition-all ${item.is_initial ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'text-slate-300 hover:text-purple-400'}`}
                    >
                      <Flag size={16} fill={item.is_initial ? "currentColor" : "none"} />
                      {item.is_initial && <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-800"></span>}
                    </button>
                  )
                },
                { 
                  header: 'FINAL STATE', 
                  align: 'center',
                  accessor: (item) => (
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <Toggle checked={!!item.is_end} onChange={() => handleSetEnd(item)} size="sm" />
                    </div>
                  )
                }
              ]}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              emptyMessage="No task lifecycle stages defined yet."
            />
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-start gap-3">
             <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
               Tasks start at the 'Entry Point' and are archived when they reach a 'Final State'. You can only have one designated Entry Point.
             </p>
          </div>
        </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          title={editingItem?.id ? 'Modify Pipeline Stage' : 'Define New Lifecycle Stage'}
          footer={
            <div className="flex justify-end gap-3 w-full sm:w-auto">
              <Button variant="ghost" className="flex-1 sm:flex-none" onClick={handleCloseModal}>Cancel</Button>
              <Button variant="success" className="flex-1 sm:flex-none font-bold" onClick={handleSave} isLoading={saving}>Save Stage</Button>
            </div>
          }
        >
          <div className="space-y-6">
            <Input 
              label="Status Display Label *" 
              placeholder="e.g. In Review, Awaiting Feedback"
              value={editingItem?.status_name || ''} 
              onChange={e => setEditingItem(prev => ({ ...prev, status_name: e.target.value }))}
              autoFocus
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Set as Entry Point</span>
                      <span className="text-[9px] text-slate-500">Auto-assigned to new tasks</span>
                  </div>
                  <Toggle 
                    checked={!!editingItem?.is_initial} 
                    onChange={(v) => setEditingItem(prev => ({ 
                      ...prev, 
                      is_initial: v,
                      ...(v ? { is_end: false } : {})
                    }))} 
                  />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Set as Final State</span>
                      <span className="text-[9px] text-slate-500">Indicates task completion</span>
                  </div>
                  <Toggle 
                    checked={!!editingItem?.is_end} 
                    onChange={(v) => setEditingItem(prev => ({ 
                      ...prev, 
                      is_end: v,
                      ...(v ? { is_initial: false } : {})
                    }))} 
                  />
              </div>
            </div>
          </div>
        </Modal>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default TaskStatusPage;
