
import React, { useState, useMemo } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { geographyApi } from '../../services/masterDataApi/geography.api';
import { Country, State, District, City, Area } from '../../types';
import { Plus, Search, Globe, MapPin, Navigation, Landmark, Building, RefreshCw, ChevronRight } from 'lucide-react';
import { Button, Input, Select, Modal, DataTable } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useMasterCrud } from '../../hooks/useMasterCrud';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { sanitizeObject } from '../../utils/sanitization';

const GeographyPage: React.FC = () => {
  const { COUNTRY, STATE, DISTRICT, CITY, AREA } = API_ENDPOINTS.MASTER_DATA;

  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: countries, loading: loadingC, refetch: refetchC, setData: setC } = useFetch<Country[]>(COUNTRY);
  const { data: states, loading: loadingS, refetch: refetchS, setData: setS } = useFetch<State[]>(STATE);
  const { data: districts, loading: loadingD, refetch: refetchD, setData: setD } = useFetch<District[]>(DISTRICT);
  const { data: cities, loading: loadingCt, refetch: refetchCt, setData: setCt } = useFetch<City[]>(CITY);
  const { data: areas, loading: loadingA, refetch: refetchA, setData: setA } = useFetch<Area[]>(AREA);

  const nameValidate = (field: string) => (i: any) => !i[field]?.trim() ? "Name is required" : null;

  const cCrud = useMasterCrud({ api: { create: geographyApi.createCountry, update: geographyApi.updateCountry, patch: geographyApi.patchCountry }, refetch: refetchC, updateLocalData: setC, validate: nameValidate('country_name') });
  const sCrud = useMasterCrud({ api: { create: geographyApi.createState, update: geographyApi.updateState, patch: geographyApi.patchState }, refetch: refetchS, updateLocalData: setS, validate: nameValidate('state') });
  const dCrud = useMasterCrud({ api: { create: geographyApi.createDistrict, update: geographyApi.updateDistrict, patch: geographyApi.patchDistrict }, refetch: refetchD, updateLocalData: setD, validate: nameValidate('district_name') });
  const ctCrud = useMasterCrud({ api: { create: geographyApi.createCity, update: geographyApi.updateCity, patch: geographyApi.patchCity }, refetch: refetchCt, updateLocalData: setCt, validate: nameValidate('city') });
  const aCrud = useMasterCrud({ api: { create: geographyApi.createArea, update: geographyApi.updateArea, patch: geographyApi.patchArea }, refetch: refetchA, updateLocalData: setA, validate: nameValidate('area') });

  const filter = (name?: string) => !searchQuery || (name || '').toLowerCase().includes(searchQuery.toLowerCase());

  const handleGeoToggle = async (type: 'country' | 'state' | 'district' | 'city', item: any) => {
    const newStatus = item.status === 1 ? 0 : 1;
    const promises: Promise<any>[] = [];
    const updateLocalStates: Function[] = [];

    const patchApi = (t: string, id: any) => {
        switch(t) {
            case 'country': return geographyApi.patchCountry(id, { status: newStatus });
            case 'state': return geographyApi.patchState(id, { status: newStatus });
            case 'district': return geographyApi.patchDistrict(id, { status: newStatus });
            case 'city': return geographyApi.patchCity(id, { status: newStatus });
            case 'area': return geographyApi.patchArea(id, { status: newStatus });
            default: return Promise.resolve();
        }
    };

    promises.push(patchApi(type, item.id));

    if (type === 'country') {
        const relatedStates = states?.filter(s => s.country_id == item.id && s.status !== newStatus) || [];
        relatedStates.forEach(s => {
            promises.push(patchApi('state', s.id));
            const relatedDistricts = districts?.filter(d => d.state_id == s.id && d.status !== newStatus) || [];
            relatedDistricts.forEach(d => {
                promises.push(patchApi('district', d.id));
                const relatedCities = cities?.filter(c => c.district_id == d.id && c.status !== newStatus) || [];
                relatedCities.forEach(c => {
                    promises.push(patchApi('city', c.id));
                    const relatedAreas = areas?.filter(a => a.city_id == c.id && a.status !== newStatus) || [];
                    relatedAreas.forEach(a => promises.push(patchApi('area', a.id)));
                });
            });
        });
    } else if (type === 'state') {
        const relatedDistricts = districts?.filter(d => d.state_id == item.id && d.status !== newStatus) || [];
        relatedDistricts.forEach(d => {
            promises.push(patchApi('district', d.id));
            const relatedCities = cities?.filter(c => c.district_id == d.id && c.status !== newStatus) || [];
            relatedCities.forEach(c => {
                promises.push(patchApi('city', c.id));
                const relatedAreas = areas?.filter(a => a.city_id == c.id && a.status !== newStatus) || [];
                relatedAreas.forEach(a => promises.push(patchApi('area', a.id)));
            });
        });
    } else if (type === 'district') {
        const relatedCities = cities?.filter(c => c.district_id == item.id && c.status !== newStatus) || [];
        relatedCities.forEach(c => {
            promises.push(patchApi('city', c.id));
            const relatedAreas = areas?.filter(a => a.city_id == c.id && a.status !== newStatus) || [];
            relatedAreas.forEach(a => promises.push(patchApi('area', a.id)));
        });
    } else if (type === 'city') {
        const relatedAreas = areas?.filter(a => a.city_id == item.id && a.status !== newStatus) || [];
        relatedAreas.forEach(a => promises.push(patchApi('area', a.id)));
    }

    try {
        const loadingToast = toast.loading(`Updating hierarchy...`);
        await Promise.all(promises);
        
        if (type === 'country') { refetchC(); refetchS(); refetchD(); refetchCt(); refetchA(); }
        else if (type === 'state') { refetchS(); refetchD(); refetchCt(); refetchA(); }
        else if (type === 'district') { refetchD(); refetchCt(); refetchA(); }
        else if (type === 'city') { refetchCt(); refetchA(); }
        
        toast.dismiss(loadingToast);
        toast.success(`Cascade ${newStatus === 1 ? 'activation' : 'deactivation'} successful`);
    } catch (err) {
        toast.error("Failed to update status across hierarchy");
    }
  };

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Global Geography Setup">
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
          
          {}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center gap-4">
             <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  className="pl-10 h-11 w-full border-transparent bg-slate-50 dark:bg-slate-900/50" 
                  placeholder="Instant filter across all regions..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
                Hierarchy Control
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GeoSection 
              title="Countries" 
              icon={<Globe size={18} />}
              data={countries?.filter(x => filter(x.country_name))} 
              nameKey="country_name" 
              crud={cCrud} 
              loading={loadingC}
              onToggle={(item: any) => handleGeoToggle('country', item)} 
            />
            <GeoSection 
              title="States / Provinces" 
              icon={<MapPin size={18} />}
              data={states?.filter(x => filter(x.state))} 
              nameKey="state" 
              crud={sCrud} 
              loading={loadingS}
              onToggle={(item: any) => handleGeoToggle('state', item)} 
            />
            <GeoSection 
              title="Districts" 
              icon={<Navigation size={18} />}
              data={districts?.filter(x => filter(x.district_name))} 
              nameKey="district_name" 
              crud={dCrud} 
              loading={loadingD}
              onToggle={(item: any) => handleGeoToggle('district', item)} 
            />
            <GeoSection 
              title="Cities / Towns" 
              icon={<Landmark size={18} />}
              data={cities?.filter(x => filter(x.city))} 
              nameKey="city" 
              crud={ctCrud} 
              loading={loadingCt}
              onToggle={(item: any) => handleGeoToggle('city', item)} 
            />
            <GeoSection 
              title="Areas / Localities" 
              icon={<Building size={18} />}
              data={areas?.filter(x => filter(x.area))} 
              nameKey="area" 
              crud={aCrud} 
              loading={loadingA}
            />
          </div>
        </div>
      </MasterDataLayout>

      {}
      <Modal isOpen={cCrud.isModalOpen} onClose={cCrud.handleCloseModal} title="Configure Country" footer={<GeoFooter crud={cCrud} />}>
         <Input label="Country Name" value={cCrud.currentItem.country_name || ''} onChange={e => cCrud.setCurrentItem({...cCrud.currentItem, country_name: e.target.value})} autoFocus />
      </Modal>

      <Modal isOpen={sCrud.isModalOpen} onClose={sCrud.handleCloseModal} title="Configure State" footer={<GeoFooter crud={sCrud} />}>
         <div className="space-y-4">
             <Select 
                label="Parent Country" 
                options={countries?.filter(c => c.status === 1).map(c => ({label: c.country_name, value: c.id!})) || []} 
                value={sCrud.currentItem.country_id || ''} 
                onChange={e => sCrud.setCurrentItem({...sCrud.currentItem, country_id: e.target.value})} 
             />
             <Input label="State Name" value={sCrud.currentItem.state || ''} onChange={e => sCrud.setCurrentItem({...sCrud.currentItem, state: e.target.value})} />
         </div>
      </Modal>

      <Modal isOpen={dCrud.isModalOpen} onClose={dCrud.handleCloseModal} title="Configure District" footer={<GeoFooter crud={dCrud} />}>
         <div className="space-y-4">
             <Select 
                label="Parent State" 
                options={states?.filter(s => s.status === 1).map(s => ({label: s.state, value: s.id!})) || []} 
                value={dCrud.currentItem.state_id || ''} 
                onChange={e => { const s=states?.find(x=>x.id==e.target.value); dCrud.setCurrentItem({...dCrud.currentItem, state_id: e.target.value, country_id: s?.country_id}); }} 
             />
             <Input label="District Name" value={dCrud.currentItem.district_name || ''} onChange={e => dCrud.setCurrentItem({...dCrud.currentItem, district_name: e.target.value})} />
         </div>
      </Modal>

      <Modal isOpen={ctCrud.isModalOpen} onClose={ctCrud.handleCloseModal} title="Configure City" footer={<GeoFooter crud={ctCrud} />}>
         <div className="space-y-4">
             <Select 
                label="Parent District" 
                options={districts?.filter(d => d.status === 1).map(d => ({label: d.district_name, value: d.id!})) || []} 
                value={ctCrud.currentItem.district_id || ''} 
                onChange={e => { const d=districts?.find(x=>x.id==e.target.value); ctCrud.setCurrentItem({...ctCrud.currentItem, district_id: e.target.value, state_id: d?.state_id, country_id: d?.country_id}); }} 
             />
             <Input label="City Name" value={ctCrud.currentItem.city || ''} onChange={e => ctCrud.setCurrentItem({...ctCrud.currentItem, city: e.target.value})} />
         </div>
      </Modal>

      <Modal isOpen={aCrud.isModalOpen} onClose={aCrud.handleCloseModal} title="Configure Locality" footer={<GeoFooter crud={aCrud} />}>
         <div className="space-y-4">
             <Select 
                label="Parent City" 
                options={cities?.filter(c => c.status === 1).map(c => ({label: c.city, value: c.id!})) || []} 
                value={aCrud.currentItem.city_id || ''} 
                onChange={e => { const c=cities?.find(x=>x.id==e.target.value); aCrud.setCurrentItem({...aCrud.currentItem, city_id: e.target.value, district_id: c?.district_id, state_id: c?.state_id, country_id: c?.country_id}); }} 
             />
             <Input label="Area / Sector Name" value={aCrud.currentItem.area || ''} onChange={e => aCrud.setCurrentItem({...aCrud.currentItem, area: e.target.value})} />
         </div>
      </Modal>
    </ErrorBoundary>
  );
};

const GeoSection = ({ title, icon, data, nameKey, crud, onToggle, loading }: any) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[400px] transition-all hover:shadow-md">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white dark:bg-slate-800 rounded shadow-sm text-blue-600">
                    {icon}
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h3>
            </div>
            <Button size="sm" onClick={() => crud.handleOpenModal()} icon={<Plus size={14}/>}>New</Button>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
            <DataTable 
                data={data || []} 
                loading={loading}
                columns={[{ header: 'Name', accessor: nameKey, className: 'font-bold text-sm' }]} 
                onEdit={crud.handleOpenModal} 
                onToggleStatus={onToggle || crud.handleToggleStatus} 
            />
        </div>
    </div>
);

const GeoFooter = ({ crud }: any) => (
  <div className="flex gap-3 w-full sm:w-auto">
      <Button variant="ghost" onClick={crud.handleCloseModal} className="flex-1 sm:flex-none">Cancel</Button>
      <Button variant="success" onClick={() => {
          const sanitized = sanitizeObject(crud.currentItem);
          crud.setCurrentItem(sanitized);
          crud.handleSave();
      }} isLoading={crud.saving} className="flex-1 sm:flex-none font-bold px-8">Save Record</Button>
  </div>
);

export default GeographyPage;
