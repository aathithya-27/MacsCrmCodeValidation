
import React, { useEffect, useState, useMemo } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { leadSourceApi } from '../../services/masterDataApi/leadSource.api';
import { LeadSource } from '../../types';
import { Plus, Edit2, ChevronRight, ChevronDown, CornerDownRight, Users, Trash2 } from 'lucide-react';
import { Button, Input, Modal, Toggle } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useMasterCrud } from '../../hooks/useMasterCrud';
import { transformToTree } from '../../utils/dataUtils';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { sanitizeObject } from '../../utils/sanitization';

const LeadReferralPage: React.FC = () => {
  const { LEAD_SOURCE } = API_ENDPOINTS.MASTER_DATA;
  const { data: sourceData, loading, refetch, setData } = useFetch<LeadSource[]>(LEAD_SOURCE);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<number | string>>(new Set());

  const crud = useMasterCrud<LeadSource>({
    api: leadSourceApi,
    refetch,
    updateLocalData: setData,
    validate: (item) => !item.ref_desc?.trim() ? "Description required" : null,
    initialState: { client_id: 1, individual: false }
  });

  const treeData = useMemo(() => {
    if (!sourceData) return [];
    return transformToTree(sourceData);
  }, [sourceData]);

  useEffect(() => {
    if (sourceData && expandedNodes.size === 0) {
      setExpandedNodes(new Set(sourceData.filter(d => d.parent_id === 0).map(d => d.id!)));
    }
  }, [sourceData]);

  const toggleExpand = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedNodes(newSet);
  };

  const handleAddChild = (parentId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    crud.handleOpenModal({ parent_id: parentId } as unknown as LeadSource);
  };

  const handleToggleStatus = async (item: LeadSource, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = item.status === 1 ? 0 : 1;
    
    const getDescendantsIds = (pid: number | string, allItems: LeadSource[]): (number | string)[] => {
      const children = allItems.filter(d => d.parent_id == pid);
      let ids = children.map(c => c.id!);
      children.forEach(c => {
        ids = [...ids, ...getDescendantsIds(c.id!, allItems)];
      });
      return ids;
    };

    const descendantsIds = sourceData ? getDescendantsIds(item.id!, sourceData) : [];
    const idsToUpdate = [item.id!, ...descendantsIds];

    setData(prev => prev?.map(d => idsToUpdate.includes(d.id!) ? { ...d, status: newStatus } : d) || []);

    try {
        await Promise.all(idsToUpdate.map(id => leadSourceApi.patch(id, { status: newStatus })));
        toast.success(newStatus === 1 ? 'Activated branch' : 'Deactivated branch');
    } catch (e) {
        refetch();
        toast.error("Failed to update status");
    }
  };

  const TreeItem: React.FC<{ node: LeadSource; level: number }> = ({ node, level }) => {
     if (searchQuery && !node.ref_desc.toLowerCase().includes(searchQuery.toLowerCase())) {
        const hasVisibleChild = node.children?.some((c: any) => c.ref_desc.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!hasVisibleChild) return null;
     }
     
     const hasChildren = node.children && node.children.length > 0;
     const isExpanded = expandedNodes.has(node.id!);
     
     return (
        <div className="animate-in fade-in slide-in-from-left-2">
            <div 
              className={`
                group flex flex-col sm:flex-row sm:items-center justify-between px-3 py-3 border-b border-slate-100 dark:border-slate-700/50 transition-all
                ${node.status === 1 ? 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10' : 'bg-slate-50/30 opacity-75'}
              `} 
              style={{ paddingLeft: `${Math.min(level * 16 + 12, 100)}px` }}
            >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="flex items-center shrink-0">
                      {hasChildren ? (
                        <button 
                          onClick={(e) => toggleExpand(node.id!, e)} 
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      ) : (
                        <div className="w-6 h-6" />
                      )}
                      {level > 0 && <CornerDownRight size={14} className="text-slate-300 mr-1 shrink-0" />}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-bold truncate ${node.status === 1 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>
                        {node.ref_desc}
                      </span>
                      
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2 sm:mt-0 shrink-0">
                     <Toggle checked={node.status === 1} onChange={(val) => handleToggleStatus(node, { stopPropagation: () => {} } as any)} size="sm" />
                     <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={(e) => handleAddChild(node.id!, e)} title="Add Sub-item"><Plus size={14} /></Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600" onClick={(e) => { e.stopPropagation(); crud.handleOpenModal(node); }} title="Edit"><Edit2 size={12} /></Button>
                     </div>
                </div>
            </div>
            {hasChildren && isExpanded && (
              <div className="bg-slate-50/20 dark:bg-slate-900/5">
                {node.children!.map((child: any) => <TreeItem key={child.id} node={child} level={level + 1} />)}
              </div>
            )}
        </div>
     );
  };

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Lead & Referral Master">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] overflow-hidden">
           <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/40 dark:bg-slate-800/50">
              <div className="relative flex-1">
                 <Input className="w-full pl-10 h-11 border-slate-200" placeholder="Filter sources by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                 <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              </div>
              <Button className="font-bold h-11 px-6 shadow-lg shadow-blue-500/10" onClick={() => crud.handleOpenModal({ parent_id: 0 } as unknown as LeadSource)} icon={<Plus size={18} />}>New Root Source</Button>
           </div>
           
           <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-slate-800 p-2 md:p-4">
               {loading ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Plus className="animate-spin mb-2" />
                    <span className="text-sm font-medium">Reconstructing tree hierarchy...</span>
                 </div>
               ) : treeData.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
                    <Users size={48} className="opacity-10 mb-4" />
                    <p className="text-sm font-bold text-slate-400">No referral sources defined.</p>
                 </div>
               ) : (
                 <div className="divide-y-0">
                    {treeData.map((node: any) => <TreeItem key={node.id} node={node} level={0} />)}
                 </div>
               )}
           </div>
        </div>
        
        <Modal 
          isOpen={crud.isModalOpen} 
          onClose={crud.handleCloseModal} 
          title={crud.currentItem.id ? 'Modify Lead Source' : 'Define New Source'} 
          footer={
            <div className="flex justify-end gap-3 w-full sm:w-auto">
              <Button variant="ghost" className="flex-1 sm:flex-none" onClick={crud.handleCloseModal}>Cancel</Button>
              <Button variant="success" className="flex-1 sm:flex-none font-bold" onClick={crud.handleSave} isLoading={crud.saving}>Save Changes</Button>
            </div>
          }
        >
            <div className="space-y-6">
                <Input 
                  label="Display Description" 
                  placeholder="e.g. Social Media Ad"
                  value={crud.currentItem.ref_desc || ''} 
                  onChange={e => crud.setCurrentItem({...crud.currentItem, ref_desc: e.target.value})} 
                  autoFocus 
                />
                
                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Force Individual Selection?</span>
                    <span className="text-[10px] text-slate-500 max-w-[200px]">Prompt the user to pick a specific person when this source is selected.</span>
                  </div>
                  <Toggle checked={!!crud.currentItem.individual} onChange={(v) => crud.setCurrentItem({...crud.currentItem, individual: v})} />
                </div>
            </div>
        </Modal>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default LeadReferralPage;
