
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { mutualFundApi } from '../../../services/masterDataApi/mutualFund.api';
import { MutualFundProcessFlow, MutualFundField } from '../../../types';
import { Plus, GripVertical, CheckSquare, GitBranch } from 'lucide-react';
import { Button, Input, Select, Modal, DataTable } from '../../../components/ui';
import { useFetch } from '../../../hooks/useFetch';
import { useMasterCrud } from '../../../hooks/useMasterCrud';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../../config/api.config';
import { ErrorBoundary } from '../../../components/ErrorBoundary';

const MutualFundConfigFragment: React.FC = () => {
  const { MUTUAL_FUND_PROCESS, MUTUAL_FUND_FIELD } = API_ENDPOINTS.MASTER_DATA;

  const { data: rawProcesses, loading: loadingProcesses, refetch: refetchProcesses } = useFetch<MutualFundProcessFlow[]>(MUTUAL_FUND_PROCESS);
  const { data: rawFields, loading: loadingFields, refetch: refetchFields } = useFetch<MutualFundField[]>(MUTUAL_FUND_FIELD);

  const processFlows = useMemo(() => (rawProcesses || []).sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0)), [rawProcesses]);
  const fields = useMemo(() => rawFields || [], [rawFields]);

  const processCrud = useMasterCrud({
    api: { create: mutualFundApi.createProcess, update: mutualFundApi.updateProcess, patch: mutualFundApi.patchProcess },
    refetch: refetchProcesses,
    defaults: { comp_id: 1001, client_id: 1, status: 1 }
  });

  const fieldCrud = useMasterCrud({
    api: { create: mutualFundApi.createField, update: mutualFundApi.updateField, patch: mutualFundApi.patchField },
    refetch: refetchFields,
    defaults: { comp_id: 1001, column_span: 1, field_type: 'Text Input', status: 1 }
  });

  const [groupSearch, setGroupSearch] = useState('');
  const groupWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-[450px]">
            <div className="px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckSquare className="text-blue-600" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Data Attributes</h3>
              </div>
              <Button size="sm" onClick={() => fieldCrud.handleOpenModal()} icon={<Plus size={14} />}>Add Field</Button>
            </div>
            <div className="flex-1 overflow-auto">
              <DataTable 
                data={fields} 
                loading={loadingFields}
                columns={[
                  { header: 'Group', accessor: (item) => <span className="text-slate-400 font-bold text-[10px] uppercase">{item.group_name || 'Main'}</span>, width: 'w-24' },
                  { header: 'Label', accessor: 'field_label', className: 'font-bold text-sm' }
                ]}
                onEdit={fieldCrud.handleOpenModal}
                onToggleStatus={fieldCrud.handleToggleStatus}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-[450px]">
            <div className="px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GitBranch className="text-blue-600" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Process Flow</h3>
              </div>
              <Button size="sm" onClick={() => processCrud.handleOpenModal({ seq_no: processFlows.length + 1, status: 1 } as any)} icon={<Plus size={14} />}>Add Stage</Button>
            </div>
            <div className="flex-1 overflow-auto">
              <DataTable 
                data={processFlows} 
                loading={loadingProcesses}
                columns={[
                  { header: '', accessor: () => <GripVertical size={16} className="text-slate-300"/>, width: 'w-10' },
                  { header: 'Stage Name', accessor: 'process_desc', className: 'font-bold text-sm' }
                ]}
                onEdit={processCrud.handleOpenModal}
                onToggleStatus={processCrud.handleToggleStatus}
              />
            </div>
          </div>
        </div>

        <Modal isOpen={processCrud.isModalOpen} onClose={processCrud.handleCloseModal} title="Configure Stage" footer={<><Button variant="ghost" onClick={processCrud.handleCloseModal}>Cancel</Button><Button variant="success" onClick={processCrud.handleSave} isLoading={processCrud.saving}>Save</Button></>}>
          <Input label="Stage Description" value={processCrud.currentItem.process_desc || ''} onChange={e => processCrud.setCurrentItem({...processCrud.currentItem, process_desc: e.target.value})} autoFocus placeholder="e.g. KYC Verification" />
        </Modal>

        <Modal isOpen={fieldCrud.isModalOpen} onClose={fieldCrud.handleCloseModal} title="Configure Field" size="md" footer={<><Button variant="ghost" onClick={fieldCrud.handleCloseModal}>Cancel</Button><Button variant="success" onClick={fieldCrud.handleSave} isLoading={fieldCrud.saving}>Save</Button></>}>
          <div className="space-y-4">
            <Input label="Label Name" value={fieldCrud.currentItem.field_label || ''} onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, field_label: e.target.value})} autoFocus />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Group Name" value={fieldCrud.currentItem.group_name || ''} onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, group_name: e.target.value})} placeholder="e.g. Personal Details" />
              <Select label="Col Span" options={[{label:'1 Col', value:1}, {label:'2 Col', value:2}]} value={fieldCrud.currentItem.column_span || 1} onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, column_span: Number(e.target.value)})} />
            </div>
            <Select label="Type" options={['Text Input', 'Number Input', 'Date Input', 'Dropdown'].map(t => ({label: t, value: t}))} value={fieldCrud.currentItem.field_type || 'Text Input'} onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, field_type: e.target.value})} />
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default MutualFundConfigFragment;
