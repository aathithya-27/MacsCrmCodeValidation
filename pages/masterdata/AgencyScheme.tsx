
import React, { useState, useMemo, useEffect } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { Agency, Scheme, InsuranceType, InsuranceSubType, BusinessVertical } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { agencyApi } from '../../services/masterDataApi/agency.api';
import { Button, Input, Select, Modal, DataTable } from '../../components/ui';
import { Plus, Search, Building2, ShieldCheck, PieChart, ChevronLeft } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { sanitizeObject } from '../../utils/sanitization';

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
  
  const { data: verticals, loading: loadingVerticals } = useFetch<BusinessVertical[]>(BUSINESS_VERTICAL);
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
  const [savingAgency, setSavingAgency] = useState(false);
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
    setSavingAgency(true);
    try {
      const sanitizedData = sanitizeObject(data);
      if (editingAgency?.id) {
        await agencyApi.updateAgency(currentAgencyEndpoint, editingAgency.id, sanitizedData);
        toast.success('Updated successfully');
      } else {
        await agencyApi.createAgency(currentAgencyEndpoint, sanitizedData);
        toast.success('Added successfully');
      }
      setIsAgencyModalOpen(false);
      refetchAgencies();
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSavingAgency(false);
    }
  };

  const handleDeleteAgency = async (agency: Agency) => {
    if (confirm(`Delete ${isMF ? 'AMC' : 'Agency'} "${agency.agency_name}"?`)) {
        try {
          await agencyApi.deleteAgency(currentAgencyEndpoint, agency.id!);
          toast.success('Deleted');
          if (selectedAgency?.id === agency.id) setSelectedAgency(null);
          refetchAgencies();
        } catch (err) {
          toast.error('Failed to delete');
        }
    }
  };

  return (
    <MasterDataLayout title="Agency and Scheme">
      <div className="space-y-6 pb-12">
        {/* Business Vertical Selection - Horizontal Scrolling on Mobile */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
           <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Business Vertical</h3>
              <div className="h-px bg-slate-100 dark:bg-slate-700 flex-1"></div>
           </div>
           
           {loadingVerticals ? <LoadingSpinner /> : (
             <div className="flex overflow-x-auto pb-2 gap-4 snap-x custom-scrollbar">
                {verticals?.map(v => {
                  const isIns = v.business_vertical_name.toLowerCase().includes('insurance');
                  const isMfV = v.business_vertical_name.toLowerCase().includes('mutual fund');
                  const active = selectedVerticalId == v.id;
                  return (
                    <button 
                      key={v.id}
                      onClick={() => setSelectedVerticalId(v.id!)}
                      className={`
                        min-w-[200px] sm:min-w-[240px] p-4 rounded-xl border-2 text-left transition-all snap-start
                        ${active 
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-100 dark:ring-blue-900/10' 
                          : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-3">
                         <div className={`p-2 rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                            {isIns ? <ShieldCheck size={20}/> : isMfV ? <PieChart size={20}/> : <Building2 size={20}/>}
                         </div>
                         {active && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>}
                      </div>
                      <div className={`font-bold text-sm sm:text-base truncate ${active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {v.business_vertical_name}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">
                        {isIns ? 'Insurance' : isMfV ? 'Mutual Fund' : 'Standard'}
                      </div>
                    </button>
                  );
                })}
             </div>
           )}
        </div>

        {/* Main Content Area - Split/Stack on Mobile */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Agencies Panel */}
          <div className={`w-full lg:w-1/3 transition-all duration-300 ${selectedAgency && 'hidden lg:block'}`}>
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[600px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
                   <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                        {isMF ? 'AMC List' : 'Agencies'}
                      </h3>
                   </div>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input 
                        placeholder="Search..."
                        className="pl-9 h-10"
                        value={searchAgencyQuery}
                        onChange={e => setSearchAgencyQuery(e.target.value)}
                      />
                   </div>
                   <Button 
                      className="w-full bg-blue-600 font-bold h-10 shadow-lg shadow-blue-500/20"
                      onClick={handleAddAgency}
                      icon={<Plus size={18} />}
                   >
                      Add New
                   </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <DataTable 
                      data={filteredAgencies}
                      loading={loadingAgencies}
                      columns={[
                        { header: 'NAME', accessor: 'agency_name', className: 'font-bold text-sm' }
                      ]}
                      onRowClick={(item) => setSelectedAgency(item)}
                      selectedId={selectedAgency?.id}
                      onEdit={handleEditAgency}
                      onDelete={handleDeleteAgency}
                    />
                </div>
             </div>
          </div>

          {/* Schemes Panel */}
          <div className={`w-full lg:w-2/3 ${!selectedAgency && 'hidden lg:block'}`}>
             {selectedAgency ? (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  {/* Mobile Back Button */}
                  <button 
                    onClick={() => setSelectedAgency(null)}
                    className="lg:hidden flex items-center gap-2 text-blue-600 font-bold mb-4 text-sm"
                  >
                    <ChevronLeft size={18} /> Back to List
                  </button>
                  
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
                </div>
             ) : (
                <div className="h-[600px] bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-8">
                   <Building2 size={48} className="opacity-10 mb-4" />
                   <h4 className="font-bold text-slate-700 dark:text-slate-300">Select an Agency</h4>
                   <p className="text-xs text-center mt-2 leading-relaxed max-w-xs">
                     Choose an item from the list to manage its specific schemes and plans.
                   </p>
                </div>
             )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isAgencyModalOpen} 
        onClose={() => setIsAgencyModalOpen(false)} 
        title={editingAgency ? "Edit Details" : "Add New Entry"}
        footer={
           <div className="flex justify-end gap-3 w-full sm:w-auto">
              <Button variant="ghost" className="px-6 border border-slate-200 flex-1 sm:flex-none" onClick={() => setIsAgencyModalOpen(false)}>Cancel</Button>
              <Button variant="success" className="px-8 font-bold flex-1 sm:flex-none" onClick={agencyForm.handleSubmit(handleSaveAgency)} isLoading={savingAgency}>Save</Button>
           </div>
        }
      >
        <form className="space-y-4">
          <Controller
            name="agency_name"
            control={agencyForm.control}
            rules={{ required: "Name is required" }}
            render={({ field, fieldState }) => (
              <Input label={isMF ? "AMC Name" : "Agency Name"} {...field} error={fieldState.error?.message} autoFocus />
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
  const [savingScheme, setSavingScheme] = useState(false);
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
    reset({ ...scheme });
    setIsModalOpen(true);
  };

  const handleSave = async (data: Scheme) => {
    setSavingScheme(true);
    try {
      const sanitizedData = sanitizeObject(data);
      if (editingScheme?.id) {
        await agencyApi.updateScheme(currentSchemeEndpoint, editingScheme.id, sanitizedData);
        toast.success('Updated');
      } else {
        await agencyApi.createScheme(currentSchemeEndpoint, sanitizedData);
        toast.success('Added');
      }
      setIsModalOpen(false);
      refetchSchemes();
    } catch (e) {
      toast.error('Operation failed');
    } finally {
      setSavingScheme(false);
    }
  };

  const handleDelete = async (scheme: Scheme) => {
    if (confirm(`Delete scheme "${scheme.scheme_name}"?`)) {
      try {
        await agencyApi.deleteScheme(currentSchemeEndpoint, scheme.id!);
        refetchSchemes();
        toast.success('Deleted');
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[600px] overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="text-blue-600 truncate max-w-[200px]">{selectedAgency.agency_name}</span>
              <span className="text-slate-400 font-normal">/ Schemes</span>
            </h3>
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
               Independent List
            </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Find scheme..."
                className="pl-9 h-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <Button variant="success" className="font-bold h-10 px-6 w-full sm:w-auto" onClick={handleCreate} icon={<Plus size={18} />}>
              Add New
           </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto">
          <DataTable 
            data={filteredSchemes}
            columns={[
              { header: 'SCHEME NAME', accessor: 'scheme_name', className: 'font-bold text-sm' },
              ...(isMF ? [{ header: 'CATEGORY', accessor: (s: any) => s.category || '-', className: 'text-xs text-slate-500' }] : []),
              ...(isInsurance ? [
                { 
                  header: 'TYPE', 
                  accessor: (s: any) => types?.find(t => t.id == s.insurance_type_id)?.insurance_type || '-',
                  className: 'text-xs hidden sm:table-cell'
                }
              ] : [])
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={async (item) => {
              try {
                const newStatus = item.status === 1 ? 0 : 1;
                await agencyApi.patchScheme(currentSchemeEndpoint, item.id!, { status: newStatus });
                refetchSchemes();
                toast.success('Status updated');
              } catch (e) {
                toast.error('Failed to update status');
              }
            }}
          />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingScheme ? 'Edit Scheme' : 'New Scheme'}
        footer={
          <div className="flex justify-end gap-3 w-full sm:w-auto">
             <Button variant="ghost" className="px-6 border border-slate-200 flex-1 sm:flex-none" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button variant="success" className="px-8 font-bold flex-1 sm:flex-none" onClick={handleSubmit(handleSave)} isLoading={savingScheme}>Save</Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Controller
            name="scheme_name"
            control={control}
            rules={{ required: "Scheme name is required" }}
            render={({ field, fieldState }) => (
              <Input label="Scheme Name" {...field} error={fieldState.error?.message} autoFocus />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="insurance_type_id"
                control={control}
                rules={{ required: "Type is required" }}
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
