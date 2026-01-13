
import React, { useState, useMemo, useEffect } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { branchApi } from '../../services/masterDataApi/branch.api';
import { Branch, Country, State, District, City, Area } from '../../types';
import { Plus, Search } from 'lucide-react';
import { Button, Input, Select, Modal, DataTable, Toggle } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useMasterCrud } from '../../hooks/useMasterCrud';
import { API_ENDPOINTS } from '../../config/api.config';
import { validators, validateForm } from '../../utils/validation';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const BranchPage: React.FC = () => {
  const { BRANCH } = API_ENDPOINTS.MASTER_DATA;
  const { COUNTRY, STATE, DISTRICT, CITY, AREA } = API_ENDPOINTS.MASTER_DATA;

  const { data: branches, loading: loadingBranches, refetch: refetchBranches, setData: setBranches } = useFetch<Branch[]>(BRANCH);
  const { data: countries } = useFetch<Country[]>(COUNTRY);
  const { data: states } = useFetch<State[]>(STATE);
  const { data: districts } = useFetch<District[]>(DISTRICT);
  const { data: cities } = useFetch<City[]>(CITY);
  const { data: areas } = useFetch<Area[]>(AREA);

  const [searchQuery, setSearchQuery] = useState('');
  const [idSuffix, setIdSuffix] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const crud = useMasterCrud<Branch>({
    api: branchApi,
    refetch: refetchBranches,
    updateLocalData: setBranches,
    validate: (item) => {
        const errs = validateForm(item, {
            branch_name: [validators.required],
            pincode: [validators.pincode],
            phone_no: [validators.phone],
            gst_no: [validators.gst],
            pan_no: [validators.pan]
        });
        if (errs) {
            setErrors(errs);
            return "Please check form fields";
        }
        return null;
    },
    defaults: { status: 1, comp_id: 1001 }
  });

  useEffect(() => {
    if (crud.isModalOpen && !crud.currentItem.id && idSuffix) {
       crud.setCurrentItem(prev => ({ ...prev, branch_id: `FIN01-${idSuffix.toUpperCase()}` }));
    } else if (crud.isModalOpen && crud.currentItem.id) {
       const parts = String(crud.currentItem.branch_id || '').split('-');
       if (parts.length > 1 && parts[1] !== idSuffix) setIdSuffix(parts[1]);
    } else if (!crud.isModalOpen) {
       setIdSuffix('');
       setErrors({});
    }
  }, [idSuffix, crud.isModalOpen, crud.currentItem.id]);

  const current = crud.currentItem;
  const filteredStates = useMemo(() => states?.filter(s => s.country_id == current.country_id && s.status === 1) || [], [states, current.country_id]);
  const filteredDistricts = useMemo(() => districts?.filter(d => d.state_id == current.state_id && d.status === 1) || [], [districts, current.state_id]);
  const filteredCities = useMemo(() => cities?.filter(c => c.district_id == (current as any).district_id && c.status === 1) || [], [cities, (current as any).district_id]);
  
  const filteredData = useMemo(() => {
    if (!branches) return [];
    return branches.filter(b => 
      b.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(b.branch_id).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [branches, searchQuery]);

  const handleSaveWithLocationNames = async () => {
      const countryObj = countries?.find(c => c.id == current.country_id);
      const cityObj = cities?.find(c => c.id == current.city_id);
      const stateObj = states?.find(s => s.id == current.state_id);
      
      crud.setCurrentItem(prev => ({ 
          ...prev, 
          country: countryObj?.country_name,
          city: cityObj?.city, 
          state: stateObj?.state 
      }));
      
      setTimeout(crud.handleSave, 0); 
  };

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Manage Branch">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                className="pl-10 h-11 w-full"
                placeholder="Search Branches by Name or ID..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
            <Button className="h-11 px-6 w-full md:w-auto" onClick={() => crud.handleOpenModal()} icon={<Plus size={18}/>}>Add Branch</Button>
          </div>

          <DataTable 
            data={filteredData}
            columns={[
              { header: 'Branch ID', accessor: 'branch_id', width: 'w-40', className: 'font-mono text-sm font-bold text-blue-600 dark:text-blue-400' },
              { header: 'Branch Name', accessor: 'branch_name', className: 'font-semibold' },
            ]}
            loading={loadingBranches}
            onEdit={crud.handleOpenModal}
            onToggleStatus={crud.handleToggleStatus}
          />
        </div>

        <Modal 
          isOpen={crud.isModalOpen} onClose={crud.handleCloseModal} 
          title={crud.currentItem.id ? 'Edit Branch Office' : 'Create New Branch'}
          size="lg"
          footer={
            <div className="flex gap-3">
                <Button variant="ghost" onClick={crud.handleCloseModal} className="px-6">Cancel</Button>
                <Button variant="success" onClick={handleSaveWithLocationNames} isLoading={crud.saving} className="px-8 font-bold">Save Branch</Button>
            </div>
          }
        >
          <div className="space-y-6">
            
            <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-5 bg-slate-50/30 dark:bg-slate-900/20">
               <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 Basic Identification
               </h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Branch ID Code *</label>
                    <div className="flex gap-1">
                      <span className="px-3 h-10 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-500 flex items-center">FIN01</span>
                      <Input 
                        value={idSuffix} 
                        onChange={e => setIdSuffix(e.target.value)} 
                        placeholder="e.g. CBE" 
                        disabled={!!crud.currentItem.id} 
                        className="uppercase h-10 font-bold" 
                      />
                    </div>
                  </div>
                  <Input 
                    label="Branch Name *" 
                    value={crud.currentItem.branch_name || ''} 
                    onChange={e => crud.setCurrentItem({...crud.currentItem, branch_name: e.target.value})} 
                    error={errors.branch_name}
                    placeholder="e.g. Coimbatore Hub"
                  />
                  
                  <Input label="Established Date" type="date" value={crud.currentItem.date_of_creation || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, date_of_creation: e.target.value})} />
                  <div className="flex items-end pb-1.5">
                     <div className="flex items-center justify-between w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <span className="text-sm font-medium">Status</span>
                        <Toggle checked={crud.currentItem.status === 1} onChange={(v) => crud.setCurrentItem({...crud.currentItem, status: v ? 1 : 0})} label={crud.currentItem.status === 1 ? 'Active' : 'Inactive'} />
                     </div>
                  </div>
               </div>
            </div>

            <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-5 bg-slate-50/30 dark:bg-slate-900/20">
               <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Location & Contact</h4>
               <div className="space-y-4">
                  <Input label="Address Line 1" value={crud.currentItem.address_1 || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, address_1: e.target.value})} placeholder="Main street name" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Address Line 2" value={crud.currentItem.address_2 || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, address_2: e.target.value})} />
                    <Input label="Landmark (Line 3)" value={crud.currentItem.address_3 || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, address_3: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Select 
                          label="Country" 
                          options={countries?.filter(c => c.status === 1).map(c => ({label: c.country_name, value: c.id!})) || []} 
                          value={crud.currentItem.country_id || ''} 
                          onChange={e => crud.setCurrentItem({...crud.currentItem, country_id: e.target.value, state_id: undefined, district_id: undefined, city_id: undefined })}
                     />
                     <Select label="State" options={filteredStates.map(s => ({label: s.state, value: s.id!}))} value={crud.currentItem.state_id || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, state_id: e.target.value, district_id: undefined, city_id: undefined})} disabled={!crud.currentItem.country_id} />
                     <Select label="District" options={filteredDistricts.map(d => ({label: d.district_name, value: d.id!}))} value={(crud.currentItem as any).district_id || ''} onChange={(e) => crud.setCurrentItem({...crud.currentItem, ...{ district_id: e.target.value }, city_id: undefined })} disabled={!crud.currentItem.state_id} />
                     <Select label="City" options={filteredCities.map(c => ({label: c.city, value: c.id!}))} value={crud.currentItem.city_id || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, city_id: e.target.value})} disabled={!(crud.currentItem as any).district_id} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Area Name" value={crud.currentItem.area || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, area: e.target.value})} />
                    <Input label="Pin Code *" value={crud.currentItem.pincode || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, pincode: e.target.value})} maxLength={6} error={errors.pincode} />
                    <Input label="Phone No. *" value={crud.currentItem.phone_no || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, phone_no: e.target.value})} error={errors.phone_no} />
                  </div>
               </div>
            </div>

            <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-5 bg-slate-50/30 dark:bg-slate-900/20">
               <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tax Compliance</h4>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="GSTIN" value={crud.currentItem.gst_no || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, gst_no: e.target.value})} error={errors.gst_no} className="uppercase font-mono" />
                  <Input label="PAN" value={crud.currentItem.pan_no || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, pan_no: e.target.value})} error={errors.pan_no} className="uppercase font-mono" />
                  <Input label="TAN" value={crud.currentItem.tan_no || ''} onChange={e => crud.setCurrentItem({...crud.currentItem, tan_no: e.target.value})} className="uppercase font-mono" />
               </div>
            </div>
          </div>
        </Modal>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default BranchPage;
