
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Country, State, District, City, Area, Member } from '../types';
import * as api from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import SearchableSelect from '../components/ui/SearchableSelect';
import SearchBar from '../components/ui/SearchBar';
import { Plus, Edit2, AlertTriangle } from 'lucide-react';

type GeoItem = Country | State | District | City | Area;
type GeoTypeString = 'Country' | 'State' | 'District' | 'City' | 'Area';

const GeographyManagementPage: React.FC = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalState, setModalState] = useState<{ isOpen: boolean; type: GeoTypeString | null; item: Partial<GeoItem> | null }>({ isOpen: false, type: null, item: null });
    const { addToast } = useToast();
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToToggle, setItemToToggle] = useState<GeoItem | null>(null);
    const [dependentMembers, setDependentMembers] = useState<Member[]>([]);

    const [modalCountry, setModalCountry] = useState<string | null>(null);
    const [modalStateVal, setModalStateVal] = useState<string | null>(null);
    const [modalDistrict, setModalDistrict] = useState<string | null>(null);
    const [modalCity, setModalCity] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [countriesData, statesData, districtsData, citiesData, areasData, membersData] = await Promise.all([
                api.fetchCountries(), api.fetchStates(), api.fetchDistricts(), api.fetchCities(), api.fetchAreas(), api.fetchAllMembers()
            ]);
            setCountries(countriesData);
            setStates(statesData);
            setDistricts(districtsData);
            setCities(citiesData);
            setAreas(areasData);
            setAllMembers(membersData);
        } catch (error) {
            addToast("Failed to load geographies.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleOpenModal = (type: GeoTypeString, item: GeoItem | null) => {
        setModalState({ isOpen: true, type, item: item ? { ...item } : { STATUS: 1 } });
    };

    const handleCloseModal = () => setModalState({ isOpen: false, type: null, item: null });

    const handleSave = async () => {
        const { type, item } = modalState;
        if (!type || !item) return;

        const nameFields: Record<GeoTypeString, string> = {
            Country: 'COUNTRY_NAME', State: 'STATE', District: 'DISTRICT', City: 'CITY', Area: 'AREA',
        };
        const nameField = nameFields[type];
        const name = (item as any)[nameField];

        if (!name || !name.trim()) {
            addToast("Name is required.", "error");
            return;
        }


        try {
            if (item.ID) {
                const message = `${type} updated successfully.`;
                if (type === 'Country') await api.onUpdateCountries(countries.map(c => c.ID === item.ID ? item as Country : c));
                else if (type === 'State') await api.onUpdateStates(states.map(s => s.ID === item.ID ? item as State : s));
                else if (type === 'District') await api.onUpdateDistricts(districts.map(d => d.ID === item.ID ? item as District : d));
                else if (type === 'City') await api.onUpdateCities(cities.map(c => c.ID === item.ID ? item as City : c));
                else if (type === 'Area') await api.onUpdateAreas(areas.map(a => a.ID === item.ID ? item as Area : a));
                addToast(message, 'success');

            } else { 
                const newItem = {
                    ...item,
                    ID: Date.now(),
                    [nameField]: name.trim(),
                    CREATED_ON: new Date().toISOString(), MODIFIED_ON: new Date().toISOString(), CREATED_BY: 1, MODIFIED_BY: 1
                };

                const message = `${type} added successfully.`;
                if (type === 'Country') await api.onUpdateCountries([...countries, newItem as Country]);
                else if (type === 'State') await api.onUpdateStates([...states, { ...newItem, COUNTRY_ID: Number(modalCountry) } as State]);
                else if (type === 'District') await api.onUpdateDistricts([...districts, { ...newItem, STATE_ID: Number(modalStateVal), COUNTRY_ID: Number(modalCountry) } as District]);
                else if (type === 'City') await api.onUpdateCities([...cities, { ...newItem, DISTRICT_ID: Number(modalDistrict), STATE_ID: Number(modalStateVal), COUNTRY_ID: Number(modalCountry) } as City]);
                else if (type === 'Area') await api.onUpdateAreas([...areas, { ...newItem, CITY_ID: Number(modalCity), DISTRICT_ID: Number(modalDistrict), STATE_ID: Number(modalStateVal), COUNTRY_ID: Number(modalCountry) } as Area]);
                addToast(message, 'success');
            }
            await loadData();
            handleCloseModal();
        } catch (error) {
            addToast("Failed to save.", "error");
        }
    };
    
    const performToggle = async (itemToToggle: GeoItem) => {
        const newStatus = itemToToggle.STATUS === 1 ? 0 : 1;
        const updatedItem = { ...itemToToggle, STATUS: newStatus };

        let itemType: GeoTypeString = 'Country';
        if ('COUNTRY_NAME' in itemToToggle) itemType = 'Country';
        else if ('STATE' in itemToToggle) itemType = 'State';
        else if ('DISTRICT' in itemToToggle) itemType = 'District';
        else if ('CITY' in itemToToggle) itemType = 'City';
        else if ('AREA' in itemToToggle) itemType = 'Area';

        const message = `${itemType} status updated.`;
        
        if ('COUNTRY_NAME' in itemToToggle) await api.onUpdateCountries(countries.map(c => c.ID === itemToToggle.ID ? updatedItem as Country : c));
        else if ('STATE' in itemToToggle) await api.onUpdateStates(states.map(s => s.ID === itemToToggle.ID ? updatedItem as State : s));
        else if ('DISTRICT' in itemToToggle) await api.onUpdateDistricts(districts.map(d => d.ID === itemToToggle.ID ? updatedItem as District : d));
        else if ('CITY' in itemToToggle) await api.onUpdateCities(cities.map(c => c.ID === itemToToggle.ID ? updatedItem as City : c));
        else if ('AREA' in itemToToggle) await api.onUpdateAreas(areas.map(a => a.ID === itemToToggle.ID ? updatedItem as Area : a));
        
        addToast(message, 'success');
        await loadData();
        setIsWarningModalOpen(false);
    };

    const handleToggleStatus = (item: GeoItem) => {
        performToggle(item);
    };

    const countryOptions = useMemo(() => countries.filter(c => c.STATUS === 1).map(c => ({ value: String(c.ID), label: c.COUNTRY_NAME })), [countries]);
    const stateOptions = useMemo(() => modalCountry ? states.filter(s => s.COUNTRY_ID === Number(modalCountry) && s.STATUS === 1).map(s => ({ value: String(s.ID), label: s.STATE })) : [], [states, modalCountry]);
    const districtOptions = useMemo(() => modalStateVal ? districts.filter(d => d.STATE_ID === Number(modalStateVal) && d.STATUS === 1).map(d => ({ value: String(d.ID), label: d.DISTRICT })) : [], [districts, modalStateVal]);
    const cityOptions = useMemo(() => modalDistrict ? cities.filter(c => c.DISTRICT_ID === Number(modalDistrict) && c.STATUS === 1).map(c => ({ value: String(c.ID), label: c.CITY })) : [], [cities, modalDistrict]);

    const filteredData = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return { Country: countries, State: states, District: districts, City: cities, Area: areas };
        return {
            Country: countries.filter(i => i.COUNTRY_NAME.toLowerCase().includes(q)),
            State: states.filter(i => i.STATE.toLowerCase().includes(q)),
            District: districts.filter(i => i.DISTRICT.toLowerCase().includes(q)),
            City: cities.filter(i => i.CITY.toLowerCase().includes(q)),
            Area: areas.filter(i => i.AREA.toLowerCase().includes(q)),
        };
    }, [searchQuery, countries, states, districts, cities, areas]);


    if (isLoading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading geographies...</div>;
    
    const nameFieldForModal = modalState.type ? {
        Country: 'COUNTRY_NAME', State: 'STATE', District: 'DISTRICT', City: 'CITY', Area: 'AREA'
    }[modalState.type] : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Geography Management</h2>
                <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search across all geographies..." className="max-w-md"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Country Card */}
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Manage Country</h3>
                        <Button onClick={() => handleOpenModal('Country', null)} variant="primary"><Plus size={16} /> Add Country</Button>
                    </div>
                    <div className="overflow-auto h-60">
                        <table className="min-w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredData.Country.map((item, index) => (
                                    <tr key={item.ID} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.COUNTRY_NAME}</td>
                                        <td className="px-4 py-2"><ToggleSwitch enabled={item.STATUS === 1} onChange={() => handleToggleStatus(item)} /></td>
                                        <td className="px-4 py-2"><Button size="small" variant="light" onClick={() => handleOpenModal('Country', item)}><Edit2 size={14} /></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* State Card */}
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Manage State</h3>
                        <Button onClick={() => handleOpenModal('State', null)} variant="primary"><Plus size={16} /> Add State</Button>
                    </div>
                    <div className="overflow-auto h-60">
                         <table className="min-w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredData.State.map((item, index) => (
                                    <tr key={item.ID} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.STATE}</td>
                                        <td className="px-4 py-2"><ToggleSwitch enabled={item.STATUS === 1} onChange={() => handleToggleStatus(item)} /></td>
                                        <td className="px-4 py-2"><Button size="small" variant="light" onClick={() => handleOpenModal('State', item)}><Edit2 size={14} /></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* District Card */}
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Manage District</h3>
                        <Button onClick={() => handleOpenModal('District', null)} variant="primary"><Plus size={16} /> Add District</Button>
                    </div>
                    <div className="overflow-auto h-60">
                        <table className="min-w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredData.District.map((item, index) => (
                                    <tr key={item.ID} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.DISTRICT}</td>
                                        <td className="px-4 py-2"><ToggleSwitch enabled={item.STATUS === 1} onChange={() => handleToggleStatus(item)} /></td>
                                        <td className="px-4 py-2"><Button size="small" variant="light" onClick={() => handleOpenModal('District', item)}><Edit2 size={14} /></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* City Card */}
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Manage City</h3>
                        <Button onClick={() => handleOpenModal('City', null)} variant="primary"><Plus size={16} /> Add City</Button>
                    </div>
                    <div className="overflow-auto h-60">
                        <table className="min-w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredData.City.map((item, index) => (
                                    <tr key={item.ID} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.CITY}</td>
                                        <td className="px-4 py-2"><ToggleSwitch enabled={item.STATUS === 1} onChange={() => handleToggleStatus(item)} /></td>
                                        <td className="px-4 py-2"><Button size="small" variant="light" onClick={() => handleOpenModal('City', item)}><Edit2 size={14} /></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Area Card */}
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Manage Area</h3>
                        <Button onClick={() => handleOpenModal('Area', null)} variant="primary"><Plus size={16} /> Add Area</Button>
                    </div>
                    <div className="overflow-auto h-60">
                         <table className="min-w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredData.Area.map((item, index) => (
                                    <tr key={item.ID} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.AREA}</td>
                                        <td className="px-4 py-2"><ToggleSwitch enabled={item.STATUS === 1} onChange={() => handleToggleStatus(item)} /></td>
                                        <td className="px-4 py-2"><Button size="small" variant="light" onClick={() => handleOpenModal('Area', item)}><Edit2 size={14} /></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal
                key={modalState.type}
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                contentClassName="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md"
                initialFocusRef={nameInputRef}
            >
                <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">{modalState.item?.ID ? 'Edit' : 'Add'} {modalState.type}</h2>
                        <div className="space-y-4">
                           {modalState.type === 'State' && <SearchableSelect label="Country" options={countryOptions} value={modalCountry} onChange={setModalCountry} />}
                           {modalState.type === 'District' && <>
                                <SearchableSelect label="Country" options={countryOptions} value={modalCountry} onChange={val => {setModalCountry(val); setModalStateVal(null);}} />
                                <SearchableSelect label="State" options={stateOptions} value={modalStateVal} onChange={setModalStateVal} disabled={!modalCountry} />
                           </>}
                           {modalState.type === 'City' && <>
                                <SearchableSelect label="Country" options={countryOptions} value={modalCountry} onChange={val => {setModalCountry(val); setModalStateVal(null); setModalDistrict(null);}} />
                                <SearchableSelect label="State" options={stateOptions} value={modalStateVal} onChange={val => {setModalStateVal(val); setModalDistrict(null);}} disabled={!modalCountry} />
                                <SearchableSelect label="District" options={districtOptions} value={modalDistrict} onChange={setModalDistrict} disabled={!modalStateVal} />
                           </>}
                           {modalState.type === 'Area' && <>
                                <SearchableSelect label="Country" options={countryOptions} value={modalCountry} onChange={val => {setModalCountry(val); setModalStateVal(null); setModalDistrict(null); setModalCity(null);}} />
                                <SearchableSelect label="State" options={stateOptions} value={modalStateVal} onChange={val => {setModalStateVal(val); setModalDistrict(null); setModalCity(null);}} disabled={!modalCountry} />
                                <SearchableSelect label="District" options={districtOptions} value={modalDistrict} onChange={val => {setModalDistrict(val); setModalCity(null);}} disabled={!modalStateVal} />
                                <SearchableSelect label="City" options={cityOptions} value={modalCity} onChange={setModalCity} disabled={!modalDistrict} />
                           </>}
                            <Input
                                ref={nameInputRef}
                                label="Name"
                                value={nameFieldForModal && modalState.item ? (modalState.item as any)[nameFieldForModal] || '' : ''}
                                onChange={e => {
                                    if (nameFieldForModal) {
                                        setModalState(s => ({...s, item: {...s.item, [nameFieldForModal]: e.target.value}}))
                                    }
                                }}
                                required
                            />
                        </div>
                    </div>
                    <footer className="flex justify-end gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </footer>
                </form>
            </Modal>
        </div>
    );
};

export default GeographyManagementPage;
