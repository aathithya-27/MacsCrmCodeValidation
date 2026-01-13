
import React, { useEffect, useState, useRef } from 'react';
import { policyApi } from '../../../services/masterDataApi/policy.api';
import { InsuranceType, InsuranceSubType, ProcessFlow, PolicyField, PolicyDocument, DocumentMaster } from '../../../types';
import { Plus, GripVertical, GitBranch, CheckSquare, FileText, ChevronDown } from 'lucide-react';
import { Button, Input, Select, Modal, Toggle, DataTable } from '../../../components/ui';
import { useFetch } from '../../../hooks/useFetch';
import { useMasterCrud } from '../../../hooks/useMasterCrud';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../../config/api.config';
import { ErrorBoundary } from '../../../components/ErrorBoundary';

interface Props {
  verticalId: number | string;
}

const InsuranceConfigFragment: React.FC<Props> = ({ verticalId }) => {
  const { INSURANCE_TYPE, INSURANCE_SUB_TYPE, DOCUMENT_MASTER } = API_ENDPOINTS.MASTER_DATA;

  const [activeParent, setActiveParent] = useState<InsuranceType | null>(null);
  const [activeChild, setActiveChild] = useState<InsuranceSubType | null>(null);
  
  const { data: types, refetch: refetchTypes, setData: setTypes } = useFetch<InsuranceType[]>(INSURANCE_TYPE);
  const { data: subTypes, refetch: refetchSubTypes, setData: setSubTypes } = useFetch<InsuranceSubType[]>(INSURANCE_SUB_TYPE);
  const { data: docMasters } = useFetch<DocumentMaster[]>(DOCUMENT_MASTER);
  
  const [processFlows, setProcessFlows] = useState<ProcessFlow[]>([]);
  const [fields, setFields] = useState<PolicyField[]>([]);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);

  const filteredTypes = types?.filter(t => t.business_vertical_id == verticalId) || [];

  const typeCrud = useMasterCrud({ 
    api: { create: policyApi.createType, update: policyApi.updateType, patch: policyApi.patchType }, 
    refetch: refetchTypes, 
    updateLocalData: setTypes, 
    validate: i => !i.insurance_type ? "Name required" : null, 
    defaults: { client_id: 1, comp_id: 1001, business_vertical_id: verticalId } 
  });

  const subTypeCrud = useMasterCrud({ 
    api: { create: policyApi.createSubType, update: policyApi.updateSubType, patch: policyApi.patchSubType }, 
    refetch: () => {
      refetchSubTypes();
      window.dispatchEvent(new CustomEvent('insuranceSubTypesUpdated'));
    }, 
    updateLocalData: setSubTypes, 
    validate: i => !i.insurance_sub_type ? "Name required" : null, 
    defaults: { client_id: 1, comp_id: 1001, status: 1 } 
  });
  
  const fetchConfigsWrapper = () => fetchConfigurationData();

  const processCrud = useMasterCrud({ api: { create: policyApi.createProcess, update: policyApi.updateProcess, patch: policyApi.patchProcess }, refetch: fetchConfigsWrapper, validate: i => !i.process_desc ? "Name required" : null, defaults: { client_id: 1, comp_id: 1001, repeat: false, status: 1 } });
  const fieldCrud = useMasterCrud({ api: { create: policyApi.createField, update: policyApi.updateField, patch: policyApi.patchField }, refetch: fetchConfigsWrapper, validate: i => !i.field_label ? "Label required" : null, defaults: { column_span: 1, field_type: 'Text Input', status: 1 } });

  const [selectedDocId, setSelectedDocId] = useState<string | number>('');
  const [groupSearch, setGroupSearch] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const groupWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeParent) fetchConfigurationData();
  }, [activeParent, activeChild]);

  const fetchConfigurationData = async () => {
    const typeId = activeParent?.id;
    const subTypeId = activeChild?.id;
    if (!typeId) return;

    try {
      if (!activeChild) {
        const pfRes = await policyApi.getProcessFlows();
        if (pfRes.data) setProcessFlows(pfRes.data.filter(pf => pf.insurance_type_id == typeId).sort((a,b) => a.seq_no - b.seq_no));
      }
      const fRes = await policyApi.getFields();
      if (fRes.data) setFields(fRes.data.filter(f => activeChild ? f.insurance_sub_type_id == subTypeId : (f.insurance_type_id == typeId && !f.insurance_sub_type_id)));
      
      const dRes = await policyApi.getDocuments();
      if (dRes.data) setDocuments(dRes.data.filter(d => activeChild ? d.insurance_sub_type_id == subTypeId : (d.insurance_type_id == typeId && !d.insurance_sub_type_id)));
    } catch (error) { console.error(error); }
  };

  const handleAddDocument = async () => {
    if (!selectedDocId) return;
    try {
      await policyApi.createDocument({ insurance_type_id: activeParent!.id!, insurance_sub_type_id: activeChild?.id, doc_master_id: selectedDocId, is_mandatory: true });
      setSelectedDocId('');
      fetchConfigurationData();
      toast.success("Document added");
    } catch (err) {
      toast.error("Failed to add document");
    }
  };

  const handleDeleteDoc = async (id: number | string) => {
    if (confirm("Remove requirement?")) {
      try {
        await policyApi.deleteDocument(id);
        fetchConfigurationData();
        toast.success("Removed");
      } catch (err) {
        toast.error("Failed to remove");
      }
    }
  };

  const uniqueGroups = Array.from(
    new Set<string>(fields.map(f => f.group_name).filter((g): g is string => !!g))
  ).sort();

  const filteredGroups = uniqueGroups.filter(g =>
    g.toLowerCase().includes(groupSearch.toLowerCase())
  );

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[300px]">
            <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-lg">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Insurance Types</h3>
              <Button size="sm" onClick={() => typeCrud.handleOpenModal()} icon={<Plus size={14} />}>Add</Button>
            </div>
            <div className="flex-1 overflow-auto">
              <DataTable 
                data={filteredTypes} 
                columns={[{ header: 'Name', accessor: 'insurance_type', className: 'font-bold' }]}
                onEdit={typeCrud.handleOpenModal} 
                onToggleStatus={typeCrud.handleToggleStatus}
                onRowClick={(item) => { setActiveParent(item); setActiveChild(null); }}
                selectedId={activeParent?.id}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[300px]">
            <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-lg">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Sub-Types</h3>
              <Button 
                size="sm" 
                onClick={() => subTypeCrud.handleOpenModal({ insurance_type_id: activeParent?.id, status: 1 } as any)} 
                disabled={!activeParent} 
                icon={<Plus size={14} />}
              >
                Add
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              {activeParent ? (
                <DataTable 
                  data={subTypes?.filter(st => st.insurance_type_id == activeParent.id) || []} 
                  columns={[{ header: 'Name', accessor: 'insurance_sub_type', className: 'font-bold' }]}
                  onEdit={subTypeCrud.handleOpenModal} 
                  onToggleStatus={subTypeCrud.handleToggleStatus}
                  onRowClick={(item) => setActiveChild(item)}
                  selectedId={activeChild?.id}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">Select a Type above</div>
              )}
            </div>
          </div>
        </div>

        {activeParent && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded-r">
              <h4 className="text-xs uppercase tracking-widest font-bold text-slate-600 dark:text-slate-300">
                Configuring: <span className="text-blue-700 dark:text-blue-400">{activeChild ? `${activeParent.insurance_type} > ${activeChild.insurance_sub_type}` : activeParent.insurance_type}</span>
              </h4>
            </div>

            {!activeChild && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white text-sm">
                    <GitBranch size={16} className="text-blue-600" /> Process Flow
                  </h3>
                  <Button size="sm" onClick={() => processCrud.handleOpenModal({ insurance_type_id: activeParent?.id, seq_no: processFlows.length + 1, status: 1 } as any)} icon={<Plus size={14} />}>Add</Button>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  <DataTable 
                    data={processFlows} 
                    columns={[
                      { header: '', accessor: () => <GripVertical size={16} className="text-slate-300"/>, width: 'w-10' }, 
                      { header: 'Name', accessor: 'process_desc', className: 'font-bold' }
                    ]}
                    onEdit={processCrud.handleOpenModal} 
                    onToggleStatus={processCrud.handleToggleStatus}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[400px] overflow-hidden">
                <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white text-sm">
                    <CheckSquare size={16} className="text-blue-600" /> Fields
                  </h3>
                  <Button size="sm" onClick={() => fieldCrud.handleOpenModal({ insurance_type_id: activeParent?.id, insurance_sub_type_id: activeChild?.id, status: 1 } as any)} icon={<Plus size={14} />}>Add</Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <DataTable 
                    data={fields} 
                    columns={[
                      { header: 'Group', accessor: (item) => item.group_name ? <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.group_name}</span> : '-', width: 'w-24' }, 
                      { header: 'Name', accessor: 'field_label', className: 'font-medium' }
                    ]}
                    onEdit={fieldCrud.handleOpenModal} 
                    onToggleStatus={fieldCrud.handleToggleStatus}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[400px] overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-bold flex items-center gap-2 mb-3 text-slate-800 dark:text-white text-sm">
                    <FileText size={16} className="text-blue-600" /> Required Documents
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select 
                      options={docMasters?.filter(dm => dm.status === 1 && !documents.some(d => d.doc_master_id == dm.id)).map(d => ({ label: d.doc_name, value: d.id! })) || []} 
                      value={selectedDocId} 
                      onChange={(e) => setSelectedDocId(e.target.value)} 
                      placeholder="Pick document..." 
                      className="flex-1"
                    />
                    <Button onClick={handleAddDocument} disabled={!selectedDocId} size="sm" className="shrink-0">Add</Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                      <span className="text-sm font-medium text-slate-800 dark:text-white truncate pr-2">{docMasters?.find(dm => dm.id == doc.doc_master_id)?.doc_name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Toggle checked={doc.is_mandatory} onChange={async () => {
                            try {
                              const updated = { ...doc, is_mandatory: !doc.is_mandatory };
                              await policyApi.updateDocument(doc.id!, updated);
                              fetchConfigurationData();
                            } catch (err) { toast.error("Failed to update"); }
                          }} size="sm"/>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{doc.is_mandatory ? 'Mand' : 'Opt'}</span>
                        </div>
                        <Button variant="danger" size="icon" onClick={() => handleDeleteDoc(doc.id!)} className="h-6 w-6 rounded-full"><Plus size={12} className="rotate-45"/></Button>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && <p className="text-xs text-slate-400 text-center pt-8 italic">No documents required yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal wrappers with standard footers */}
        <Modal isOpen={typeCrud.isModalOpen} onClose={typeCrud.handleCloseModal} title={typeCrud.currentItem.id ? "Edit Type" : "Add Type"} footer={<><Button variant="ghost" onClick={typeCrud.handleCloseModal}>Cancel</Button><Button variant="success" onClick={typeCrud.handleSave} isLoading={typeCrud.saving}>Save</Button></>}>
          <Input label="Name" value={typeCrud.currentItem.insurance_type || ''} onChange={e => typeCrud.setCurrentItem({...typeCrud.currentItem, insurance_type: e.target.value})} autoFocus />
        </Modal>

        <Modal isOpen={subTypeCrud.isModalOpen} onClose={subTypeCrud.handleCloseModal} title="Add Sub-Type" footer={<><Button variant="ghost" onClick={subTypeCrud.handleCloseModal}>Cancel</Button><Button variant="success" onClick={subTypeCrud.handleSave} isLoading={subTypeCrud.saving}>Save</Button></>}>
          <Input label="Name" value={subTypeCrud.currentItem.insurance_sub_type || ''} onChange={e => subTypeCrud.setCurrentItem({...subTypeCrud.currentItem, insurance_sub_type: e.target.value})} autoFocus />
        </Modal>

        <Modal isOpen={processCrud.isModalOpen} onClose={processCrud.handleCloseModal} title={processCrud.currentItem.id ? "Edit Stage" : "Add Stage"} footer={<><Button variant="ghost" onClick={processCrud.handleCloseModal}>Cancel</Button><Button variant="success" onClick={processCrud.handleSave} isLoading={processCrud.saving}>Save</Button></>}>
          <Input label="Stage Name" value={processCrud.currentItem.process_desc || ''} onChange={e => processCrud.setCurrentItem({...processCrud.currentItem, process_desc: e.target.value})} autoFocus />
        </Modal>

        <Modal isOpen={fieldCrud.isModalOpen} onClose={fieldCrud.handleCloseModal} title={fieldCrud.currentItem.id ? "Edit Field" : "Add Field"} size="lg" footer={<><Button variant="ghost" onClick={fieldCrud.handleCloseModal}>Cancel</Button><Button variant="success" onClick={fieldCrud.handleSave} isLoading={fieldCrud.saving}>Save</Button></>}>
          <div className="space-y-4">
            <Input label="Field Label" value={fieldCrud.currentItem.field_label || ''} onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, field_label: e.target.value})} autoFocus />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative" ref={groupWrapperRef}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Group Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800"
                    value={groupSearch} 
                    onChange={e => { setGroupSearch(e.target.value); setIsGroupDropdownOpen(true); }} 
                    onFocus={() => setIsGroupDropdownOpen(true)} 
                    placeholder="Select or type..."
                  />
                  <ChevronDown className="absolute right-3 top-2.5 text-slate-400" size={16} />
                </div>
                {isGroupDropdownOpen && filteredGroups.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 rounded shadow-xl max-h-48 overflow-y-auto">
                    {filteredGroups.map(g => <div key={g} onClick={() => { setGroupSearch(g); fieldCrud.setCurrentItem({...fieldCrud.currentItem, group_name: g}); setIsGroupDropdownOpen(false); }} className="p-2.5 px-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-200">{g}</div>)}
                  </div>
                )}
              </div>
              <Select label="Column Span" options={[{label:'1 Column', value:1}, {label:'2 Columns', value:2}]} value={fieldCrud.currentItem.column_span || 1} onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, column_span: Number(e.target.value)})} />
            </div>
            <Select label="Field Type" options={['Text Input', 'Number Input', 'Date Input', 'Toggle', 'Dropdown'].map(t => ({label: t, value: t}))} value={fieldCrud.currentItem.field_type || 'Text Input'} onChange={e => fieldCrud.setCurrentItem({...fieldCrud.currentItem, field_type: e.target.value})} />
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default InsuranceConfigFragment;
