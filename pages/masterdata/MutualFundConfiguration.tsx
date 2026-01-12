
import React, { useEffect, useState, useRef } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { mutualFundApi } from '../../services/masterDataApi/mutualFund.api';
import { MutualFundProcessFlow, MutualFundField } from '../../types';
import { Plus, GripVertical, CheckSquare, GitBranch, ChevronDown, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Modal, DataTable, Toggle } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useMasterCrud } from '../../hooks/useMasterCrud';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';

const MutualFundConfiguration: React.FC = () => {
  const { MUTUAL_FUND_PROCESS, MUTUAL_FUND_FIELD } = API_ENDPOINTS.MASTER_DATA;

  const [processFlows, setProcessFlows] = useState<MutualFundProcessFlow[]>([]);
  const [fields, setFields] = useState<MutualFundField[]>([]);
  
  const { data: rawProcesses, loading: loadingProcesses, refetch: refetchProcesses } = useFetch<MutualFundProcessFlow[]>(MUTUAL_FUND_PROCESS);
  const { data: rawFields, loading: loadingFields, refetch: refetchFields } = useFetch<MutualFundField[]>(MUTUAL_FUND_FIELD);

  useEffect(() => {
    if (rawProcesses) {
      setProcessFlows([...rawProcesses].sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0)));
    }
  }, [rawProcesses]);

  useEffect(() => {
    if (rawFields) {
      setFields(rawFields);
    }
  }, [rawFields]);

  const processCrud = useMasterCrud({
    api: { 
      create: mutualFundApi.createProcess, 
      update: mutualFundApi.updateProcess, 
      patch: mutualFundApi.patchProcess 
    },
    refetch: refetchProcesses,
    defaults: { comp_id: 1001, client_id: 1, status: 1 }
  });

  const fieldCrud = useMasterCrud({
    api: { 
      create: mutualFundApi.createField, 
      update: mutualFundApi.updateField, 
      patch: mutualFundApi.patchField 
    },
    refetch: refetchFields,
    defaults: { comp_id: 1001, column_span: 1, field_type: 'Text Input', status: 1 }
  });

  const [groupSearch, setGroupSearch] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const groupWrapperRef = useRef<HTMLDivElement>(null);

  const uniqueGroups = Array.from(
    new Set<string>(fields.map(f => f.group_name).filter((g): g is string => !!g))
  ).sort();

  const filteredGroups = uniqueGroups.filter(g =>
    g.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const openProcessModal = (item?: MutualFundProcessFlow) => {
    processCrud.handleOpenModal(item || { 
      seq_no: processFlows.length + 1, 
      status: 1 
    } as any);
  };

  const openFieldModal = (item?: MutualFundField) => {
    setGroupSearch(item?.group_name || '');
    fieldCrud.handleOpenModal(item || { 
      status: 1,
      column_span: 1,
      field_type: 'Text Input'
    } as any);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupWrapperRef.current && !groupWrapperRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <MasterDataLayout title="Mutual Fund Configuration">
      <div className="space-y-8 pb-12 animate-in fade-in duration-500">
        
        {/* Header Summary */}
        <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <RefreshCw size={24} className={loadingProcesses || loadingFields ? 'animate-spin' : ''} />
              Mutual Fund Process Designer
            </h2>
            <p className="text-blue-100 text-sm mt-1">Configure sales stages and data collection points for MF transactions.</p>
          </div>
          <div className="flex gap-4">
             <div className="text-center bg-blue-500/30 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="text-xs uppercase font-bold text-blue-200">Stages</div>
                <div className="text-xl font-bold">{processFlows.length}</div>
             </div>
             <div className="text-center bg-blue-500/30 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="text-xs uppercase font-bold text-blue-200">Fields</div>
                <div className="text-xl font-bold">{fields.length}</div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* PROCESS FLOW SECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-[550px]">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                  <GitBranch className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Sales Pipeline Flow</h3>
                  <p className="text-xs text-slate-500">Sequential steps for customer onboarding.</p>
                </div>
              </div>
              <Button size="sm" onClick={() => openProcessModal()} icon={<Plus size={16} />}>
                Add Stage
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <DataTable 
                data={processFlows} 
                loading={loadingProcesses}
                columns={[
                  { 
                    header: '', 
                    accessor: () => <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors"/>, 
                    width: 'w-10' 
                  },
                  { 
                    header: 'Seq', 
                    accessor: 'seq_no', 
                    width: 'w-16',
                    align: 'center',
                    className: 'font-mono text-blue-600 dark:text-blue-400'
                  },
                  { 
                    header: 'Process Stage Name', 
                    accessor: 'process_desc', 
                    className: 'font-bold text-slate-700 dark:text-slate-200' 
                  }
                ]}
                onEdit={openProcessModal}
                onToggleStatus={processCrud.handleToggleStatus}
                emptyMessage="No process stages defined yet."
              />
            </div>
          </div>

          {/* CUSTOM FIELDS SECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-[550px]">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg">
                  <CheckSquare className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Transaction Attributes</h3>
                  <p className="text-xs text-slate-500">Custom data fields for applications.</p>
                </div>
              </div>
              <Button size="sm" onClick={() => openFieldModal()} icon={<Plus size={16} />}>
                Add Field
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              <DataTable 
                data={fields} 
                loading={loadingFields}
                columns={[
                  { 
                    header: 'Field Label', 
                    accessor: 'field_label', 
                    className: 'font-semibold text-slate-700 dark:text-slate-200' 
                  },
                  { 
                    header: 'Group', 
                    accessor: (item) => item.group_name ? (
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight">
                        {item.group_name}
                      </span>
                    ) : '-' 
                  },
                  { 
                    header: 'Type', 
                    accessor: 'field_type', 
                    className: 'text-xs font-mono text-slate-400' 
                  }
                ]}
                onEdit={openFieldModal}
                onToggleStatus={fieldCrud.handleToggleStatus}
                emptyMessage="No custom fields configured."
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Add Stage Modal - Exact Match to Reference */}
      <Modal 
        isOpen={processCrud.isModalOpen} 
        onClose={processCrud.handleCloseModal} 
        title={processCrud.currentItem.id ? "Edit Stage" : "Add Stage"}
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="ghost" 
              className="px-6 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700" 
              onClick={processCrud.handleCloseModal}
            >
              Cancel
            </Button>
            <Button 
              variant="success" 
              className="px-8 py-2 bg-[#10a352] hover:bg-[#0e8a45] text-white font-bold rounded-lg shadow-sm" 
              onClick={processCrud.handleSave} 
              isLoading={processCrud.saving}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Stage Name" 
            placeholder=""
            value={processCrud.currentItem.process_desc || ''} 
            onChange={e => processCrud.setCurrentItem({...processCrud.currentItem, process_desc: e.target.value})} 
            autoFocus 
          />
          {processCrud.currentItem.id && (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Status</span>
                <Toggle 
                  checked={processCrud.currentItem.status === 1} 
                  onChange={(v) => processCrud.setCurrentItem({...processCrud.currentItem, status: v ? 1 : 0})} 
                />
            </div>
          )}
        </div>
      </Modal>

      {/* Add Field Modal - Exact Match to Reference */}
      <Modal 
        isOpen={fieldCrud.isModalOpen} 
        onClose={fieldCrud.handleCloseModal} 
        title={fieldCrud.currentItem.id ? "Edit Field" : "Add Field"}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="ghost" 
              className="px-6 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700" 
              onClick={fieldCrud.handleCloseModal}
            >
              Cancel
            </Button>
            <Button 
              variant="success" 
              className="px-8 py-2 bg-[#10a352] hover:bg-[#0e8a45] text-white font-bold rounded-lg shadow-sm" 
              onClick={fieldCrud.handleSave} 
              isLoading={fieldCrud.saving}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Field Label - Full Width */}
          <Input 
            label="Field Label" 
            placeholder=""
            value={fieldCrud.currentItem.field_label || ''} 
            onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, field_label: e.target.value})} 
            autoFocus
          />

          {/* Group Name and Column Span - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={groupWrapperRef}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Group Name (Optional)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={groupSearch} 
                  onChange={(e) => {
                    setGroupSearch(e.target.value);
                    setIsGroupDropdownOpen(true);
                    fieldCrud.setCurrentItem({...fieldCrud.currentItem, group_name: e.target.value});
                  }} 
                  onFocus={() => setIsGroupDropdownOpen(true)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none" 
                  placeholder="Select or type..." 
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                  <ChevronDown size={16} />
                </div>
              </div>
              
              {isGroupDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95">
                  {filteredGroups.map((group) => (
                    <div 
                      key={group} 
                      onClick={() => {
                        setGroupSearch(group);
                        fieldCrud.setCurrentItem({...fieldCrud.currentItem, group_name: group});
                        setIsGroupDropdownOpen(false);
                      }} 
                      className="px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer text-slate-700 dark:text-slate-200"
                    >
                      {group}
                    </div>
                  ))}
                  {groupSearch && !filteredGroups.includes(groupSearch) && (
                    <div 
                      onClick={() => {
                        fieldCrud.setCurrentItem({...fieldCrud.currentItem, group_name: groupSearch});
                        setIsGroupDropdownOpen(false);
                      }} 
                      className="px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 font-bold cursor-pointer border-t border-slate-100 dark:border-slate-600 bg-blue-50/30 dark:bg-blue-900/10"
                    >
                      Create "{groupSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <Select 
              label="Column Span" 
              options={[
                {label:'1 Column (Default)', value:1}, 
                {label:'2 Columns', value:2}, 
                {label:'3 Columns', value:3}
              ]} 
              value={fieldCrud.currentItem.column_span || 1} 
              onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, column_span: Number(e.target.value)})} 
            />
          </div>

          {/* Field Type - Full Width */}
          <Select 
            label="Field Type" 
            options={[
              { label: 'Text Input', value: 'Text Input' },
              { label: 'Number Input', value: 'Number Input' },
              { label: 'Date Input', value: 'Date Input' },
              { label: 'Toggle (Yes/No)', value: 'Toggle (Yes/No)' },
              { label: 'Dropdown (Select)', value: 'Dropdown (Select)' },
              { label: 'Checkbox Group', value: 'Checkbox Group' },
              { label: 'Table', value: 'Table' }
            ]} 
            value={fieldCrud.currentItem.field_type || 'Text Input'} 
            onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, field_type: e.target.value})} 
          />

          {fieldCrud.currentItem.id && (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
                <Toggle 
                  checked={fieldCrud.currentItem.status === 1} 
                  onChange={(v) => fieldCrud.setCurrentItem({...fieldCrud.currentItem, status: v ? 1 : 0})} 
                />
            </div>
          )}
        </div>
      </Modal>

    </MasterDataLayout>
  );
};

export default MutualFundConfiguration;
