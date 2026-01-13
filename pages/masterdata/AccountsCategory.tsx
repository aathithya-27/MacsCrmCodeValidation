
import React, { useMemo } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { AccountCategory, AccountSubCategory, AccountHead } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { accountsCategoryApi } from '../../services/masterDataApi/accountsCategory.api';
import { DataTable, Button, Modal, Input, Select, Toggle, Skeleton } from '../../components/ui';
import { useMasterCrud } from '../../hooks/useMasterCrud';
import { Plus, Calculator, BookOpen, Layers, Info } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { sanitizeObject } from '../../utils/sanitization';
import { validateForm, validators } from '../../utils/validation';
import toast from 'react-hot-toast';

const AccountsCategoryPage: React.FC = () => {
  const { ACCOUNT_CATEGORY, ACCOUNT_SUB_CATEGORY, ACCOUNT_HEAD } = API_ENDPOINTS.MASTER_DATA;

  const { data: categories, loading: loadingCats, refetch: refetchCats } = useFetch<AccountCategory[]>(ACCOUNT_CATEGORY);
  const { data: subCategories, loading: loadingSubCats, refetch: refetchSubCats } = useFetch<AccountSubCategory[]>(ACCOUNT_SUB_CATEGORY);
  
  const { data: heads, loading: loadingHeads, refetch: refetchHeads, setData: setHeads } = useFetch<AccountHead[]>(ACCOUNT_HEAD);
  
  const headCrud = useMasterCrud<AccountHead>({
    api: { 
        create: accountsCategoryApi.createHead, 
        update: accountsCategoryApi.updateHead, 
        patch: accountsCategoryApi.patchHead 
    },
    refetch: refetchHeads,
    updateLocalData: setHeads,
    validate: (item) => {
        const errs = validateForm(item, {
            head_name: [validators.required],
            sub_category_id: [validators.required]
        });
        return errs ? "Please fill all required fields" : null;
    },
    defaults: { comp_id: 1001, posting_bank: false, is_cash: false, status: 1 }
  });

  const handleHeadToggleChange = (field: 'posting_bank' | 'is_cash', value: boolean) => {
      headCrud.setCurrentItem(prev => ({
          ...prev,
          [field]: value,
          ...(value ? { [field === 'posting_bank' ? 'is_cash' : 'posting_bank']: false } : {})
      }));
  };

  const handleSaveHead = async () => {
      const sanitized = sanitizeObject(headCrud.currentItem);
      headCrud.setCurrentItem(sanitized);
      await headCrud.handleSave();
  };

  const activeCategories = categories?.filter(c => c.status === 1) || [];
  const activeSubCategories = subCategories?.filter(s => s.status === 1) || [];

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Account Hierarchy Management">
        <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Account Categories */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
              <GenericTableCrud<AccountCategory>
                title="Account Categories"
                endpoint={ACCOUNT_CATEGORY}
                columns={[
                  { 
                    header: 'Category Name', 
                    accessor: (item) => (
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600">
                          <BookOpen size={14} />
                        </div>
                        <span className="font-bold">{item.category_name}</span>
                      </div>
                    )
                  }
                ]}
                fields={[{ name: 'category_name', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g. Income, Expense' }]}
                defaults={{ comp_id: 1001 }}
                searchKeys={['category_name']}
                compact={true}
              />
            </div>

            {/* 2. Account Sub-Categories */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
              <GenericTableCrud<AccountSubCategory>
                title="Account Sub-Categories"
                endpoint={ACCOUNT_SUB_CATEGORY}
                columns={[
                    { 
                      header: 'Sub-Category', 
                      accessor: (item) => (
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded text-purple-600">
                            <Layers size={14} />
                          </div>
                          <span className="font-bold">{item.sub_category_name}</span>
                        </div>
                      )
                    },
                    { header: 'Parent Category', accessor: (row) => categories?.find(c => c.id == row.category_id)?.category_name || '-' }
                ]}
                fields={[
                    { 
                        name: 'category_id', 
                        label: 'Parent Category', 
                        type: 'select', 
                        required: true, 
                        options: activeCategories.map(c => ({ label: c.category_name, value: c.id! }))
                    },
                    { name: 'sub_category_name', label: 'Sub-Category Name', type: 'text', required: true, placeholder: 'e.g. Direct Income' }
                ]}
                defaults={{ comp_id: 1001 }}
                searchKeys={['sub_category_name']}
                compact={true}
              />
            </div>
          </div>

          {/* 3. Account Heads */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col min-h-[500px]">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/40 dark:bg-slate-800/50 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-600 rounded-xl shadow-lg shadow-green-500/20">
                      <Calculator className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white leading-tight">General Ledger Heads</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Define final posting accounts</p>
                    </div>
                  </div>
                  <Button variant="success" className="w-full sm:w-auto font-bold h-11 px-6 shadow-lg shadow-green-500/10" onClick={() => headCrud.handleOpenModal()} icon={<Plus size={20} />}>Add New Head</Button>
              </div>
              
              <div className="flex-1 overflow-auto">
                <DataTable 
                    data={heads || []}
                    loading={loadingHeads}
                    columns={[
                        { header: 'Head Name', accessor: 'head_name', className: 'font-bold' },
                        { header: 'Hierarchy Path', accessor: (h) => {
                          const sub = subCategories?.find(s => s.id == h.sub_category_id);
                          const cat = categories?.find(c => c.id == sub?.category_id);
                          return (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <span>{cat?.category_name || '?'}</span>
                              <span className="text-slate-300">/</span>
                              <span>{sub?.sub_category_name || '?'}</span>
                            </div>
                          );
                        }},
                        { header: 'Posting Bank', align: 'center', accessor: (h) => (
                          <div className={`mx-auto w-2 h-2 rounded-full ${h.posting_bank ? 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30' : 'bg-slate-200'}`} />
                        )},
                        { header: 'Cash Acct', align: 'center', accessor: (h) => (
                          <div className={`mx-auto w-2 h-2 rounded-full ${h.is_cash ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900/30' : 'bg-slate-200'}`} />
                        )},
                    ]}
                    onEdit={headCrud.handleOpenModal}
                    onToggleStatus={headCrud.handleToggleStatus}
                    emptyMessage="No ledger heads configured. Start by adding one."
                />
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-start gap-3">
                 <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                   Ledger Heads marked as 'Posting Bank' or 'Cash' are used as payment source accounts in vouchers and receipt modules. Only one attribute can be active per account.
                 </p>
              </div>
          </div>

        </div>

        <Modal 
           isOpen={headCrud.isModalOpen} 
           onClose={headCrud.handleCloseModal} 
           title={headCrud.currentItem.id ? 'Edit Ledger Head' : 'Add Ledger Head'}
           footer={
               <div className="flex gap-3 w-full sm:w-auto">
                   <Button variant="ghost" onClick={headCrud.handleCloseModal} className="flex-1 sm:flex-none">Cancel</Button>
                   <Button variant="success" onClick={handleSaveHead} isLoading={headCrud.saving} className="flex-1 sm:flex-none font-bold px-8">Save Head</Button>
               </div>
           }
        >
            <div className="space-y-6">
                <Select 
                    label="Assign to Sub-Category *"
                    options={activeSubCategories.map(s => ({ 
                      label: `${categories?.find(c => c.id == s.category_id)?.category_name} > ${s.sub_category_name}`, 
                      value: s.id! 
                    }))}
                    value={headCrud.currentItem.sub_category_id || ''}
                    onChange={e => headCrud.setCurrentItem(prev => ({ ...prev, sub_category_id: e.target.value }))}
                />
                <Input 
                    label="Account Head Name *"
                    placeholder="e.g. Office Rent, HDFC Operating Acct"
                    value={headCrud.currentItem.head_name || ''}
                    onChange={e => headCrud.setCurrentItem(prev => ({ ...prev, head_name: e.target.value }))}
                    autoFocus
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Account</span>
                          <span className="text-[9px] text-slate-500">Enable for bank entry</span>
                        </div>
                        <Toggle checked={!!headCrud.currentItem.posting_bank} onChange={(v) => handleHeadToggleChange('posting_bank', v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cash Account</span>
                          <span className="text-[9px] text-slate-500">Enable for cash entry</span>
                        </div>
                        <Toggle checked={!!headCrud.currentItem.is_cash} onChange={(v) => handleHeadToggleChange('is_cash', v)} />
                    </div>
                </div>
            </div>
        </Modal>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default AccountsCategoryPage;
