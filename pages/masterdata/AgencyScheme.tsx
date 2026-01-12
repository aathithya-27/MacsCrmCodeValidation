
import React, { useState, useMemo, useEffect } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { Agency, Scheme, InsuranceType, InsuranceSubType, BusinessVertical } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { agencyApi } from '../../services/masterDataApi/agency.api';
import { Button, Input, Select, Modal, DataTable } from '../../components/ui';
import { Plus, Search, Building2, ShieldCheck, PieChart } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';

const AgencySchemePage: React.FC = () => {
  const { 
    AGENCY, SCHEME, 
    AMC, MF_SCHEME,
    INSURANCE_TYPE, INSURANCE_SUB_TYPE, 
    BUSINESS_VERTICAL 
  } = API_ENDPOINTS.MASTER_DATA;

  const [selectedVerticalId, setSelectedVerticalId] = useState<number | string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [searchAgencyQuery, setSearchAgencyQuery] = useState('');
  
  const { data: verticals } = useFetch<BusinessVertical[]>(BUSINESS_VERTICAL);
  const { data: types } = useFetch<InsuranceType[]>(INSURANCE_TYPE);
  const { data: subTypes } = useFetch<InsuranceSubType[]>(INSURANCE_SUB_TYPE);

  const selectedVertical = useMemo(() => 
    verticals?.find(v => v.id == selectedVerticalId), 
    [verticals, selectedVerticalId]
  );

  const isInsurance = selectedVertical?.business_vertical_name.toLowerCase().includes('insurance');
  const isMF = selectedVertical?.business_vertical_name.toLowerCase().includes('mutual fund');

  const currentAgencyEndpoint = isMF ? AMC : AGENCY;
  const currentSchemeEndpoint = isMF ? MF_SCHEME : SCHEME;

  const { data: rawAgencies, loading: loadingAgencies, refetch: refetchAgencies } = useFetch<Agency[]>(currentAgencyEndpoint);
  const { data: rawSchemes, refetch: refetchSchemes } = useFetch<Scheme[]>(currentSchemeEndpoint);

  useEffect(() => {
    if (verticals && verticals.length > 0 && !selectedVerticalId) {
      setSelectedVerticalId(verticals[0].id!);
    }
  }, [verticals, selectedVerticalId]);

  useEffect(() => {
    setSelectedAgency(null);
    setSearchAgencyQuery('');
  }, [selectedVerticalId]);

  const filteredAgencies = useMemo(() => {
    return rawAgencies?.filter(a => 
      a.agency_name.toLowerCase().includes(searchAgencyQuery.toLowerCase())
    ) || [];
  }, [rawAgencies, searchAgencyQuery]);

  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const agencyForm = useForm<Agency>();

  const handleAddAgency = () => {
    setEditingAgency(null);
    agencyForm.reset({ agency_name: '', comp_id: 1001, status: 1 });
    setIsAgencyModalOpen(true);
  };

  const handleEditAgency = (agency: Agency) => {
    setEditingAgency(agency);
    agencyForm.reset(agency);
    setIsAgencyModalOpen(true);
  };

  const handleSaveAgency = async (data: Agency) => {
    try {
      if (editingAgency?.id) {
        await agencyApi.updateAgency(currentAgencyEndpoint, editingAgency.id, data);
        toast.success('Updated successfully');
      } else {
        await agencyApi.createAgency(currentAgencyEndpoint, data);
        toast.success('Added successfully');
      }
      setIsAgencyModalOpen(false);
      refetchAgencies();
    } catch (e) {
      toast.error('Failed to save');
    }
  };

  const handleDeleteAgency = async (agency: Agency) => {
    if (confirm(`Delete ${isMF ? 'AMC' : 'Agency'} "${agency.agency_name}"?`)) {
        await agencyApi.deleteAgency(currentAgencyEndpoint, agency.id!);
        toast.success('Deleted');
        if (selectedAgency?.id === agency.id) setSelectedAgency(null);
        refetchAgencies();
    }
  };

  return (
    <MasterDataLayout title="Agency and Scheme">
      <div className="space-y-6">
        
        {}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Business Verticals</h3>
              <div className="h-px bg-slate-100 dark:bg-slate-700 flex-1"></div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {verticals?.map(v => {
                const isIns = v.business_vertical_name.toLowerCase().includes('insurance');
                const isMfV = v.business_vertical_name.toLowerCase().includes('mutual fund');
                return (
                  <button 
                    key={v.id}
                    onClick={() => setSelectedVerticalId(v.id!)}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group
                      ${selectedVerticalId == v.id 
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/5' 
                        : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className={`p-2 rounded-lg ${selectedVerticalId == v.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                          {isIns ? <ShieldCheck size={20}/> : isMfV ? <PieChart size={20}/> : <Building2 size={20}/>}
                       </div>
                       {selectedVerticalId == v.id && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>}
                    </div>
                    <div className={`font-bold text-base ${selectedVerticalId == v.id ? 'text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                      {v.business_vertical_name}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">
                      {isIns ? 'Agencies & Schemes' : isMfV ? 'AMCs & MF Schemes' : 'Generic List'}
                    </div>
                  </button>
                );
              })}
           </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
          
          {}
          <div className="lg:col-span-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[650px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
                   <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 dark:text-white">
                        {isMF ? 'AMC (Mutual Fund)' : 'Insurance Agencies'}
                      </h3>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono">
                         ID Sequence: Separate
                      </span>
                   </div>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input 
                        placeholder={isMF ? "Search AMCs..." : "Search Agencies..."}
                        className="pl-9 h-10 bg-slate-50/50 dark:bg-slate-900/50"
                        value={searchAgencyQuery}
                        onChange={e => setSearchAgencyQuery(e.target.value)}
                      />
                   </div>
                   <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 shadow-lg shadow-blue-500/20"
                      onClick={handleAddAgency}
                      icon={<Plus size={18} />}
                   >
                      Add New {isMF ? 'AMC' : 'Agency'}
                   </Button>
                </div>

                <div className="flex-1 overflow-auto">
                    <DataTable 
                      data={filteredAgencies}
                      loading={loadingAgencies}
                      columns={[
                        { header: 'ID', accessor: 'id', width: 'w-12', className: 'text-slate-400 font-mono text-xs' },
                        { header: 'NAME', accessor: 'agency_name', className: 'font-bold' }
                      ]}
                      onRowClick={(item) => setSelectedAgency(item)}
                      selectedId={selectedAgency?.id}
                      onEdit={handleEditAgency}
                      onDelete={handleDeleteAgency}
                      onToggleStatus={async (item) => {
                          const newStatus = item.status === 1 ? 0 : 1;
                          await agencyApi.patchAgency(currentAgencyEndpoint, item.id!, { status: newStatus });
                          refetchAgencies();
                          toast.success(newStatus === 1 ? 'Activated' : 'Deactivated');
                      }}
                    />
                </div>
             </div>
          </div>

          {}
          <div className="lg:col-span-8">
             {selectedAgency ? (
                <SchemeManager 
                  selectedAgency={selectedAgency}
                  isMF={isMF}
                  isInsurance={isInsurance}
                  types={types}
                  subTypes={subTypes}
                  schemes={rawSchemes?.filter(s => s.agency_id == selectedAgency.id) || []}
                  refetchSchemes={refetchSchemes}
                  currentSchemeEndpoint={currentSchemeEndpoint}
                />
             ) : (
                <div className="h-[650px] bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-8">
                   <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-full mb-4 ring-8 ring-slate-50/50 dark:ring-slate-700/50">
                      <Building2 size={48} className="opacity-20" />
                   </div>
                   <h4 className="font-bold text-slate-700 dark:text-slate-300">Select an {isMF ? 'AMC' : 'Agency'}</h4>
                   <p className="text-sm max-w-[250px] text-center mt-2 leading-relaxed">
                     Select an {isMF ? 'AMC' : 'Agency'} from the left to view and manage its dedicated scheme list.
                   </p>
                </div>
             )}
          </div>
        </div>
      </div>

      {}
      <Modal 
        isOpen={isAgencyModalOpen} 
        onClose={() => setIsAgencyModalOpen(false)} 
        title={editingAgency ? (isMF ? 'Edit AMC' : 'Edit Agency') : (isMF ? 'Add AMC' : 'Add Agency')}
        footer={
           <div className="flex justify-end gap-3">
              <Button variant="ghost" className="px-6 border border-slate-200" onClick={() => setIsAgencyModalOpen(false)}>Cancel</Button>
              <Button variant="success" className="px-8 font-bold bg-[#10a352] shadow-lg shadow-green-500/20" onClick={agencyForm.handleSubmit(handleSaveAgency)}>Save</Button>
           </div>
        }
      >
        <form className="space-y-4">
          <Controller
            name="agency_name"
            control={agencyForm.control}
            rules={{ required: true }}
            render={({ field }) => (
              <Input label={isMF ? "AMC Name" : "Agency Name"} {...field} autoFocus />
            )}
          />
        </form>
      </Modal>
    </MasterDataLayout>
  );
};

const SchemeManager: React.FC<{
  selectedAgency: Agency;
  isMF?: boolean;
  isInsurance?: boolean;
  types: InsuranceType[] | null;
  subTypes: InsuranceSubType[] | null;
  schemes: Scheme[];
  refetchSchemes: () => void;
  currentSchemeEndpoint: string;
}> = ({ selectedAgency, isMF, isInsurance, types, subTypes, schemes, refetchSchemes, currentSchemeEndpoint }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { control, handleSubmit, reset, watch } = useForm<Scheme>();
  const watchedTypeId = watch('insurance_type_id');

  const filteredSchemes = useMemo(() => {
    return schemes.filter(s => s.scheme_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [schemes, searchQuery]);

  const filteredSubTypes = useMemo(() => 
    subTypes?.filter(st => st.insurance_type_id == watchedTypeId) || [],
    [subTypes, watchedTypeId]
  );

  const handleCreate = () => {
    setEditingScheme(null);
    reset({ 
      scheme_name: '', 
      agency_id: selectedAgency.id!, 
      comp_id: 1001, 
      status: 1,
      category: isMF ? 'Equity' : undefined
    });
    setIsModalOpen(true);
  };

  const handleEdit = (scheme: Scheme) => {
    setEditingScheme(scheme);
    reset(scheme);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Scheme) => {
    try {
      if (editingScheme?.id) {
        await agencyApi.updateScheme(currentSchemeEndpoint, editingScheme.id, data);
        toast.success('Updated');
      } else {
        await agencyApi.createScheme(currentSchemeEndpoint, data);
        toast.success('Added');
      }
      setIsModalOpen(false);
      refetchSchemes();
    } catch (e) {
      toast.error('Error');
    }
  };

  const handleDelete = async (scheme: Scheme) => {
    if (confirm(`Delete scheme "${scheme.scheme_name}"?`)) {
      await agencyApi.deleteScheme(currentSchemeEndpoint, scheme.id!);
      refetchSchemes();
      toast.success('Deleted');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[650px] overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50 space-y-3">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">
              {isMF ? 'Mutual Fund Schemes' : 'Insurance Schemes'} for <span className="text-blue-600">{selectedAgency.agency_name}</span>
            </h3>
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
               Independent ID Sequence
            </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Search Schemes..."
                className="pl-9 h-10 bg-white dark:bg-slate-900"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <Button variant="success" className="font-bold bg-[#10a352] h-10 px-6 shadow-lg shadow-green-500/20" onClick={handleCreate} icon={<Plus size={18} />}>
              Add New Scheme
           </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
          <DataTable 
            data={filteredSchemes}
            columns={[
              { header: 'ID', accessor: 'id', width: 'w-12', className: 'text-slate-400 font-mono text-xs' },
              { header: 'SCHEME NAME', accessor: 'scheme_name', className: 'font-bold' },
              ...(isMF ? [{ header: 'CATEGORY', accessor: (s: any) => s.category || '-' }] : []),
              ...(isInsurance ? [
                { 
                  header: 'TYPE', 
                  accessor: (s: any) => types?.find(t => t.id == s.insurance_type_id)?.insurance_type || '-' 
                },
                { 
                  header: 'SUB-TYPE', 
                  accessor: (s: any) => subTypes?.find(st => st.id == s.insurance_sub_type_id)?.insurance_sub_type || '-' 
                }
              ] : [])
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={async (item) => {
               const newStatus = item.status === 1 ? 0 : 1;
               await agencyApi.patchScheme(currentSchemeEndpoint, item.id!, { status: newStatus });
               refetchSchemes();
            }}
          />
      </div>

      {}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingScheme ? 'Edit Scheme' : 'New Scheme'}
        footer={
          <div className="flex justify-end gap-3">
             <Button variant="ghost" className="px-6 border border-slate-200" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button variant="success" className="px-8 font-bold bg-[#10a352] shadow-lg shadow-green-500/20" onClick={handleSubmit(handleSave)}>{editingScheme ? 'Update' : 'Save Scheme'}</Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Controller
            name="scheme_name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Input label="Scheme Name" {...field} autoFocus />
            )}
          />

          {isMF && (
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select 
                    label="Category" 
                    options={[
                        { label: 'Equity', value: 'Equity' },
                        { label: 'Debt', value: 'Debt' },
                        { label: 'Hybrid', value: 'Hybrid' },
                        { label: 'Solution Oriented', value: 'Solution Oriented' },
                        { label: 'Other', value: 'Other' }
                    ]} 
                    {...field} 
                />
              )}
            />
          )}

          {isInsurance && (
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="insurance_type_id"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select 
                    label="Insurance Type" 
                    options={types?.filter(t => t.status === 1).map(t => ({ label: t.insurance_type, value: t.id! })) || []} 
                    {...field} 
                  />
                )}
              />
              <Controller
                name="insurance_sub_type_id"
                control={control}
                render={({ field }) => (
                  <Select 
                    label="Sub-Type" 
                    options={filteredSubTypes.map(st => ({ label: st.insurance_sub_type, value: st.id! }))} 
                    {...field}
                    disabled={!watchedTypeId}
                  />
                )}
              />
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default AgencySchemePage;
