
import React, { useState, useMemo } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { TaskStatus, taskStatusApi } from '../../services/masterDataApi/taskStatus.api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useFetch } from '../../hooks/useFetch';
import { DataTable, Button, Modal, Input, Toggle } from '../../components/ui';
import { Plus, Search, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

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
    if (!editingItem?.status_name) {
      toast.error("Status name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...editingItem } as TaskStatus;
      
      if (payload.is_initial && statuses) {
          const othersToFix = statuses.filter(s => s.id !== payload.id && s.is_initial);
          await Promise.all(othersToFix.map(s => 
            taskStatusApi.patch(s.id!, { is_initial: false })
          ));
      }

      if (payload.id) {
        await taskStatusApi.update(payload.id, payload);
        toast.success("Updated successfully");
      } else {
        await taskStatusApi.create(payload);
        toast.success("Created successfully");
      }
      
      handleCloseModal();
      refetch();
    } catch (e) {
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: TaskStatus) => {
    if (confirm(`Delete status "${item.status_name}"?`)) {
        await taskStatusApi.delete(item.id!);
        toast.success("Deleted");
        refetch();
    }
  };

  const handleToggleStatus = async (item: TaskStatus) => {
      const newStatus = item.status === 1 ? 0 : 1;
      setData(prev => prev?.map(s => s.id === item.id ? { ...s, status: newStatus } : s) || []);
      try {
        await taskStatusApi.patch(item.id!, { status: newStatus });
      } catch (e) {
        refetch();
      }
  };

  const handleSetInitial = async (item: TaskStatus) => {
      if (item.is_initial) return; 
      
      setData(prev => prev?.map(s => ({
          ...s,
          is_initial: s.id === item.id,
          is_end: s.id === item.id ? false : s.is_end
      })) || []);

      try {
          await Promise.all([
              taskStatusApi.patch(item.id!, { is_initial: true, is_end: false }),
              ...(statuses || [])
                .filter(s => s.id !== item.id && s.is_initial)
                .map(s => taskStatusApi.patch(s.id!, { is_initial: false }))
          ]);
          toast.success(`"${item.status_name}" set as initial state`);
      } catch (e) {
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
          refetch();
      }
  };

  return (
    <MasterDataLayout title="Manage Task Status">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-[calc(100vh-12rem)]">
        
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  className="w-full md:w-80 h-10 pl-9 border-slate-200 focus:border-blue-500 focus:ring-0" 
                  placeholder="Search Task Statuss..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
           </div>
           <Button 
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 shadow-lg shadow-blue-500/20"
            onClick={() => handleOpenModal()} 
            icon={<Plus size={18} />}
           >
             Add New Task Status
           </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <DataTable 
            data={filteredData}
            loading={loading}
            columns={[
              { 
                header: '', 
                accessor: () => <GripVertical size={16} className="text-slate-300 cursor-grab active:cursor-grabbing"/>, 
                width: 'w-10' 
              },
              { header: 'ID', accessor: 'id', width: 'w-16', className: 'text-slate-400 font-mono text-xs' },
              { header: 'Name', accessor: 'status_name', className: 'font-bold' },
              { 
                header: 'INITIAL STATE', 
                align: 'center',
                accessor: (item) => (
                  <div className="flex justify-center" onClick={(e) => { e.stopPropagation(); handleSetInitial(item); }}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${item.is_initial ? 'border-purple-600' : 'border-slate-300 hover:border-slate-400'}`}>
                       {item.is_initial && <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>}
                    </div>
                  </div>
                )
              },
              { 
                header: 'END STATE', 
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
          />
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem?.id ? 'Edit Task Status' : 'Add Task Status'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="px-6 py-2 border border-slate-200" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="success" className="px-8 py-2 bg-[#10a352] hover:bg-[#0e8a45] font-bold" onClick={handleSave} isLoading={saving}>Save</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <Input 
            label="Task Status Name" 
            placeholder="Enter status name"
            value={editingItem?.status_name || ''} 
            onChange={e => setEditingItem(prev => ({ ...prev, status_name: e.target.value }))}
            autoFocus
          />
          
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4">
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set as Initial State</span>
                    <span className="text-xs text-slate-500">Only one status can be initial.</span>
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
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set as End State</span>
                    <span className="text-xs text-slate-500">Marks task as completed/finished.</span>
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
  );
};

export default TaskStatusPage;
