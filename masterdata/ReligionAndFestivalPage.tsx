import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import type { Religion, Festival, FestivalDate, Company } from '../types';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { Plus, Edit2, Calendar as CalendarIcon } from 'lucide-react';
import Select from '../components/ui/Select';
import SearchBar from '../components/ui/SearchBar';

const ReligionAndFestivalPage: React.FC = () => {
    const { addToast } = useToast();
    const [companyData, setCompanyData] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [religions, setReligions] = useState<Religion[]>([]);
    const [festivals, setFestivals] = useState<Festival[]>([]);
    const [festivalDates, setFestivalDates] = useState<FestivalDate[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [monthFilter, setMonthFilter] = useState<string>('all');

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'religion' | 'festival' | 'date' | null;
        item: Partial<Religion | Festival | FestivalDate> | null;
    }>({ isOpen: false, type: null, item: null });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await api.fetchCurrentUser();
            const companies = await api.fetchCompanies();
            const currentCompany = companies.find(c => c.COMP_ID === user.comp_id) || null;
            setCompanyData(currentCompany);

            if (currentCompany) {
                const [rels, fests, dates] = await Promise.all([
                    api.fetchReligions(),
                    api.fetchFestivals(),
                    api.fetchFestivalDates(),
                ]);
                const filterByComp = (item: any) => item.COMP_ID === currentCompany.COMP_ID;
                setReligions(rels.filter(filterByComp));
                setFestivals(fests.filter(filterByComp));
                setFestivalDates(dates.filter(filterByComp));
            }
        } catch (error) {
            console.error(error);
            addToast("Failed to load page data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadData(); }, [loadData]);

    // Filtering and Memoization
    const religionMap = useMemo(() => new Map(religions.map(r => [r.ID, r.RELIGION])), [religions]);
    const festivalMap = useMemo(() => new Map(festivals.map(f => [f.ID, f.FEST_DESC])), [festivals]);

    const dateCountMap = useMemo(() => festivalDates.reduce((acc, curr) => {
        acc.set(curr.FEST_ID, (acc.get(curr.FEST_ID) || 0) + 1);
        return acc;
    }, new Map<number, number>()), [festivalDates]);

    const filteredReligions = useMemo(() => searchQuery ? religions.filter(r => r.RELIGION.toLowerCase().includes(searchQuery.toLowerCase())) : religions, [religions, searchQuery]);
    const filteredFestivals = useMemo(() => searchQuery ? festivals.filter(f => f.FEST_DESC.toLowerCase().includes(searchQuery.toLowerCase())) : festivals, [festivals, searchQuery]);
    const filteredDates = useMemo(() => festivalDates.filter(d => {
        const festivalName = festivalMap.get(d.FEST_ID) || '';
        return searchQuery ? festivalName.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    }), [festivalDates, searchQuery, festivalMap]);
    
    // Modal Handling
    const openModal = (type: 'religion' | 'festival' | 'date', item: any | null) => {
        setModalState({ isOpen: true, type, item: item ? { ...item } : { STATUS: 1 } });
    };
    const closeModal = () => setModalState({ isOpen: false, type: null, item: null });

    // Save and Update Logic
    const handleSave = async () => {
        if (!modalState.type || !modalState.item || !companyData) return;
        const { type, item } = modalState;
        const now = new Date().toISOString();
        const commonFields = { COMP_ID: companyData.COMP_ID, MODIFIED_ON: now, MODIFIED_BY: 1 };
        
        try {
            if (type === 'religion') {
                const typedItem = item as Partial<Religion>;
                if (!typedItem.RELIGION?.trim()) { addToast("Religion Name is required.", "error"); return; }
                const payload = item.ID ? { ...typedItem, ...commonFields } : { ...typedItem, ...commonFields, ID: Date.now(), SEQ_NO: religions.length, CREATED_ON: now, CREATED_BY: 1 };
                const updated = item.ID ? religions.map(i => i.ID === payload.ID ? payload as Religion : i) : [...religions, payload as Religion];
                await api.onUpdateReligions(updated);
            } else if (type === 'festival') {
                const typedItem = item as Partial<Festival>;
                if (!typedItem.FEST_DESC?.trim()) { addToast("Festival Name is required.", "error"); return; }
                const payload = item.ID ? { ...typedItem, ...commonFields } : { ...typedItem, ...commonFields, ID: Date.now(), CREATED_ON: now, CREATED_BY: 1 };
                const updated = item.ID ? festivals.map(i => i.ID === payload.ID ? payload as Festival : i) : [...festivals, payload as Festival];
                await api.onUpdateFestivals(updated);
            } else if (type === 'date') {
                const typedItem = item as Partial<FestivalDate>;
                if (!typedItem.FEST_ID || !typedItem.FESTVEL_DATE) { addToast("Festival and Date are required.", "error"); return; }
                const payload = item.ID ? { ...typedItem, ...commonFields } : { ...typedItem, ...commonFields, ID: Date.now(), CREATED_ON: now, CREATED_BY: 1 };
                const updated = item.ID ? festivalDates.map(i => i.ID === payload.ID ? payload as FestivalDate : i) : [...festivalDates, payload as FestivalDate];
                await api.onUpdateFestivalDates(updated);
            }
            addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully.`);
            closeModal();
            loadData();
        } catch (e) {
            console.error(e);
            addToast("Failed to save.", "error");
        }
    };
    
    // Toggle Status
    const handleToggle = async (type: 'religion' | 'festival' | 'date', id: number) => {
        try {
            if (type === 'religion') {
                const updated = religions.map(i => i.ID === id ? { ...i, STATUS: i.STATUS === 1 ? 0 : 1 } : i);
                await api.onUpdateReligions(updated);
            } else if (type === 'festival') {
                const updated = festivals.map(i => i.ID === id ? { ...i, STATUS: i.STATUS === 1 ? 0 : 1 } : i);
                await api.onUpdateFestivals(updated);
            } else if (type === 'date') {
                const updated = festivalDates.map(i => i.ID === id ? { ...i, STATUS: i.STATUS === 1 ? 0 : 1 } : i);
                await api.onUpdateFestivalDates(updated);
            }
            addToast("Status updated.");
            loadData();
        } catch(e) {
            addToast("Failed to update status.", "error");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading...</div>;

    const renderTable = (
        title: string, type: 'religion' | 'festival' | 'date', data: any[], columns: { header: string, accessor: (item: any) => React.ReactNode }[]
    ) => (
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
                { type !== 'date' && <Button onClick={() => openModal(type, null)}><Plus size={16} /> Add New {type.charAt(0).toUpperCase() + type.slice(1)}</Button>}
                { type === 'date' && (
                    <div className="flex items-center gap-2">
                         <Select label="" value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}>
                            {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() + i - 2}>{new Date().getFullYear() + i - 2}</option>)}
                        </Select>
                        <Select label="" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                            <option value="all">All Months</option>
                            {[...Array(12)].map((_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                        </Select>
                    </div>
                )}
            </div>
            <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                <table className="min-w-full">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold w-12">ID</th>
                            {columns.map(c => <th key={c.header} className="px-4 py-2 text-left text-xs font-bold">{c.header}</th>)}
                            <th className="px-4 py-2 text-left text-xs font-bold">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {data.map((item, index) => (
                            <tr key={item.ID} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-4 py-2 text-sm">{index + 1}</td>
                                {columns.map(c => <td key={c.header} className="px-4 py-2 text-sm font-medium">{c.accessor(item)}</td>)}
                                <td className="px-4 py-2"><ToggleSwitch enabled={item.STATUS === 1} onChange={() => handleToggle(type, item.ID)} /></td>
                                <td className="px-4 py-2"><Button size="small" variant="light" className="!p-1.5" onClick={() => openModal(type, item)}><Edit2 size={14}/></Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Religion & Festival Management</h2>
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search religions and festivals..." className="max-w-md"/>
            {renderTable('religion', 'religion', filteredReligions, [{ header: 'Name', accessor: item => item.RELIGION }])}
            {renderTable('festival', 'festival', filteredFestivals, [
                { header: 'Name', accessor: item => item.FEST_DESC },
                { header: 'Religion', accessor: item => religionMap.get(item.RELIGION_ID) || <span className="italic text-slate-500">General</span> }
            ])}
            {renderTable('date', 'date', filteredDates.filter(d => {
                const date = new Date(d.FESTVEL_DATE);
                return date.getFullYear() === yearFilter && (monthFilter === 'all' || date.getMonth() === Number(monthFilter));
            }), [
                { header: 'Festival', accessor: item => <span>{festivalMap.get(item.FEST_ID)} <span className="text-xs text-slate-400">({dateCountMap.get(item.FEST_ID)} Dates)</span></span> },
                { header: 'Date', accessor: item => <div className="flex items-center gap-2">{new Date(item.FESTVEL_DATE).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} <button onClick={() => openModal('date', {FEST_ID: item.FEST_ID})}><CalendarIcon size={14} className="text-slate-400 hover:text-blue-500"/></button></div> }
            ])}

            <Modal isOpen={modalState.isOpen} onClose={closeModal} contentClassName="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">{modalState.item?.ID ? 'Edit' : 'Add'} {modalState.type?.charAt(0).toUpperCase() + modalState.type?.slice(1)}</h2>
                        <div className="space-y-4">
                            {modalState.type === 'religion' && <Input label="Religion Name" value={(modalState.item as Religion)?.RELIGION || ''} onChange={e => setModalState(s => ({...s, item: {...s.item, RELIGION: e.target.value}}))} autoFocus required />}
                            {modalState.type === 'festival' && <>
                                <Input label="Festival Name" value={(modalState.item as Festival)?.FEST_DESC || ''} onChange={e => setModalState(s => ({...s, item: {...s.item, FEST_DESC: e.target.value}}))} autoFocus required />
                                <Select label="Religion" value={(modalState.item as Festival)?.RELIGION_ID || ''} onChange={e => setModalState(s => ({...s, item: {...s.item, RELIGION_ID: e.target.value ? Number(e.target.value) : null}}))}>
                                    <option value="">-- General --</option>
                                    {religions.filter(r => r.STATUS === 1).map(r => <option key={r.ID} value={r.ID}>{r.RELIGION}</option>)}
                                </Select>
                            </>}
                            {modalState.type === 'date' && <>
                                <Select label="Festival" value={(modalState.item as FestivalDate)?.FEST_ID || ''} onChange={e => setModalState(s => ({...s, item: {...s.item, FEST_ID: Number(e.target.value)}}))} disabled={!!modalState.item?.ID} required>
                                    <option value="">-- Select Festival --</option>
                                    {festivals.filter(f => f.STATUS === 1).map(f => <option key={f.ID} value={f.ID}>{f.FEST_DESC}</option>)}
                                </Select>
                                <Input label="Date" type="date" value={(modalState.item as FestivalDate)?.FESTVEL_DATE || ''} onChange={e => setModalState(s => ({...s, item: {...s.item, FESTVEL_DATE: e.target.value}}))} required />
                            </>}
                        </div>
                    </div>
                    <footer className="flex justify-end gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
                        <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" variant="success">Save</Button>
                    </footer>
                </form>
            </Modal>
        </div>
    );
};

export default ReligionAndFestivalPage;