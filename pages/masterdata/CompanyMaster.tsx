
import React, { useEffect, useState } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { companyMasterApi } from '../../services/masterDataApi/companyMaster.api';
import { branchApi } from '../../services/masterDataApi/branch.api';
import { businessVerticalApi } from '../../services/masterDataApi/businessVertical.api';
import { CompanyMaster, Country, State, District, City, Area } from '../../types';
import { Save, AlertTriangle } from 'lucide-react';
import { Button, Input, Select, Toggle, Skeleton } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useCompany } from '../../context/CompanyContext';
import { DEFAULTS } from '../../constants';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';
import { validators, validateForm } from '../../utils/validation';
import { sanitizeObject } from '../../utils/sanitization';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const CompanyMasterPage: React.FC = () => {
  const { COMPANY } = API_ENDPOINTS.MASTER_DATA;
  const { COUNTRY, STATE, DISTRICT, CITY, AREA } = API_ENDPOINTS.MASTER_DATA;
  
  const { refreshCompany } = useCompany();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CompanyMaster>({
    comp_id: DEFAULTS.COMP_ID, 
    client_id: DEFAULTS.CLIENT_ID, 
    comp_code: '', comp_name: '', registered_name: '', date_of_creation: '',
    address_1: '', address_2: '', address_3: '', country: '', state: '', district: '', city: '', area: '',
    pin_code: '', phone_no: '', email: '', fax_no: '', gst_no: '', pan_no: '', tan_no: '', 
    status: DEFAULTS.STATUS_ACTIVE
  });

  const { data: companyData, loading, setData: setLocalData } = useFetch<CompanyMaster>(`${COMPANY}/1`);
  const { data: countries } = useFetch<Country[]>(COUNTRY);
  const { data: states } = useFetch<State[]>(STATE);
  const { data: districts } = useFetch<District[]>(DISTRICT);
  const { data: cities } = useFetch<City[]>(CITY);
  const { data: areas } = useFetch<Area[]>(AREA);

  const [locIds, setLocIds] = useState<{country?: number | string, state?: number | string, district?: number | string, city?: number | string}>({});

  useEffect(() => {
    if (companyData) {
      setFormData(companyData);
      
      if (companyData.country && countries) {
        const c = countries.find(x => x.country_name === companyData.country);
        if (c) {
            let newIds: any = { country: c.id };
            if (companyData.state && states) {
                const s = states.find(x => x.state === companyData.state && x.country_id == c.id);
                if (s) {
                    newIds.state = s.id;
                    if (companyData.district && districts) {
                        const d = districts.find(x => x.district_name === companyData.district && x.state_id == s.id);
                        if (d) {
                            newIds.district = d.id;
                            if (companyData.city && cities) {
                                const ct = cities.find(x => x.city === companyData.city && x.district_id == d.id);
                                if (ct) newIds.city = ct.id;
                            }
                        }
                    }
                }
            }
            setLocIds(newIds);
        }
      }
    }
  }, [companyData, countries, states, districts, cities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
  };

  const handleLocChange = (level: 'country' | 'state' | 'district' | 'city' | 'area', id: string) => {
      if (level === 'country') {
          const obj = countries?.find(x => x.id == id);
          setLocIds({ country: id });
          setFormData(prev => ({ ...prev, country: obj?.country_name || '', state: '', district: '', city: '', area: '' }));
      } else if (level === 'state') {
          const obj = states?.find(x => x.id == id);
          setLocIds(prev => ({ ...prev, state: id, district: undefined, city: undefined }));
          setFormData(prev => ({ ...prev, state: obj?.state || '', district: '', city: '', area: '' }));
      } else if (level === 'district') {
          const obj = districts?.find(x => x.id == id);
          setLocIds(prev => ({ ...prev, district: id, city: undefined }));
          setFormData(prev => ({ ...prev, district: obj?.district_name || '', city: '', area: '' }));
      } else if (level === 'city') {
          const obj = cities?.find(x => x.id == id);
          setLocIds(prev => ({ ...prev, city: id }));
          setFormData(prev => ({ ...prev, city: obj?.city || '', area: '' }));
      } else if (level === 'area') {
          const obj = areas?.find(x => x.id == id);
          setFormData(prev => ({ ...prev, area: obj?.area || '' }));
      }
  };

  const handleToggleStatus = (val: boolean) => {
    setFormData(prev => ({ ...prev, status: val ? 1 : 0 }));
    if (!val) toast("Warning: Deactivating Company will cascade to Branches and Verticals.", { icon: '⚠️' });
  };

  const processCascadeDeactivation = async () => {
    if (formData.status !== 0 || !formData.comp_id) return;
    
    try {
        const [bRes, vRes] = await Promise.all([branchApi.getAll(), businessVerticalApi.getAll()]);
        
        const tasks = [];
        if (bRes.data) {
            const connectedBranches = bRes.data.filter(b => b.comp_id === formData.comp_id && b.status === 1);
            tasks.push(...connectedBranches.map(b => branchApi.patch(b.id!, { status: 0 })));
        }
        if (vRes.data) {
            const connectedVerticals = vRes.data.filter(v => v.comp_id === formData.comp_id && v.status === 1);
            tasks.push(...connectedVerticals.map(v => businessVerticalApi.patch(v.id!, { status: 0 })));
        }
        await Promise.all(tasks);
    } catch (e) {
        console.error("Cascade deactivation failed", e);
    }
  };

  const handleSave = async () => {
    // 1. Validation
    const validationErrors = validateForm(formData, {
        comp_name: [validators.required],
        email: [validators.required, validators.email],
        phone_no: [validators.required, validators.phone],
        gst_no: [validators.gst],
        pan_no: [validators.pan],
        pin_code: [validators.pincode]
    });

    if (validationErrors) {
        setErrors(validationErrors);
        toast.error("Please fix the errors in the form.");
        return;
    }

    setSaving(true);
    try {
      // 2. Sanitization
      const sanitizedData = sanitizeObject(formData) as CompanyMaster;

      if (sanitizedData.id) {
        await companyMasterApi.update(sanitizedData.id, sanitizedData);
        setLocalData(sanitizedData);
        await processCascadeDeactivation();
      } else {
        await companyMasterApi.create(sanitizedData);
      }
      toast.success('Company info saved successfully!');
      await refreshCompany();
    } catch (e) { 
      toast.error('Failed to save company info.'); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return (
    <MasterDataLayout title="Company Master">
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
        </div>
    </MasterDataLayout>
  );

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Company Master">
        <div className="space-y-6 pb-10">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-100 dark:border-amber-900/30">
                  <AlertTriangle size={14} />
                  Critical organizational data. Handle with care.
              </div>
              <Button variant="success" onClick={handleSave} isLoading={saving} icon={<Save size={16} />} className="w-full sm:w-auto">Save Changes</Button>
          </div>

          {/* Company Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6 transition-all">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Organization Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <Input label="Company Code" name="comp_code" value={formData.comp_code} onChange={handleChange} disabled placeholder="Auto-generated" className="bg-slate-50 dark:bg-slate-900/50" />
                <Input label="Company Name *" name="comp_name" value={formData.comp_name} onChange={handleChange} error={errors.comp_name} placeholder="Trading Name" />
                
                <Input label="Registered Name" name="registered_name" value={formData.registered_name} onChange={handleChange} placeholder="Legal Entity Name" />
                <Input type="date" label="Date of Creation" name="date_of_creation" value={formData.date_of_creation} onChange={handleChange} />
                
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg col-span-1 md:col-span-2 border border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Operational Status</span>
                        <span className="text-xs text-slate-500">Deactivating affects all linked branches.</span>
                    </div>
                    <Toggle checked={formData.status === 1} onChange={handleToggleStatus} label={formData.status === 1 ? 'Active' : 'Inactive'} />
                </div>
            </div>
          </div>

          {/* Address & Contact */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6 transition-all">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">HQ Address & Primary Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <Input label="Address Line 1" name="address_1" value={formData.address_1} onChange={handleChange} className="lg:col-span-2" />
                <Input label="Address Line 2" name="address_2" value={formData.address_2} onChange={handleChange} />
                
                <Input label="Address Line 3" name="address_3" value={formData.address_3 || ''} onChange={handleChange} />
                <Select label="Country" options={countries?.filter(c => c.status === 1).map(c => ({label: c.country_name, value: c.id!})) || []} value={locIds.country || ''} onChange={(e) => handleLocChange('country', e.target.value)} />
                
                <Select label="State" options={states?.filter(s => s.country_id == locIds.country && s.status === 1).map(s => ({label: s.state, value: s.id!})) || []} value={locIds.state || ''} onChange={(e) => handleLocChange('state', e.target.value)} disabled={!locIds.country} />
                <Select label="District" options={districts?.filter(d => d.state_id == locIds.state && d.status === 1).map(d => ({label: d.district_name, value: d.id!})) || []} value={locIds.district || ''} onChange={(e) => handleLocChange('district', e.target.value)} disabled={!locIds.state} />
                
                <Select label="City" options={cities?.filter(c => c.district_id == locIds.district && c.status === 1).map(c => ({label: c.city, value: c.id!})) || []} value={locIds.city || ''} onChange={(e) => handleLocChange('city', e.target.value)} disabled={!locIds.district} />
                <Select label="Area" options={areas?.filter(a => a.city_id == locIds.city && a.status === 1).map(a => ({label: a.area, value: a.id!})) || []} value={areas?.find(a => a.area === formData.area && a.city_id == locIds.city)?.id || ''} onChange={(e) => handleLocChange('area', e.target.value)} disabled={!locIds.city} />
                
                <Input label="Pin Code" name="pin_code" value={formData.pin_code} onChange={handleChange} error={errors.pin_code} maxLength={6} />
                <Input label="Phone No. *" name="phone_no" value={formData.phone_no} onChange={handleChange} error={errors.phone_no} type="tel" />
                
                <Input label="Email ID *" name="email" value={formData.email} onChange={handleChange} error={errors.email} type="email" />
                <Input label="FAX No." name="fax_no" value={formData.fax_no || ''} onChange={handleChange} />
            </div>
          </div>

          {/* Tax Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6 transition-all">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Compliance & Tax Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <Input label="GSTIN" name="gst_no" value={formData.gst_no} onChange={handleChange} error={errors.gst_no} placeholder="22AAAAA0000A1Z5" className="uppercase font-mono" />
                <Input label="PAN" name="pan_no" value={formData.pan_no} onChange={handleChange} error={errors.pan_no} placeholder="ABCDE1234F" className="uppercase font-mono" />
                <Input label="TAN" name="tan_no" value={formData.tan_no} onChange={handleChange} placeholder="MUMF12345G" className="uppercase font-mono" />
            </div>
          </div>

        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default CompanyMasterPage;
