
import React, { useState } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { FinancialYear, NumberingRule } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { financialYearApi } from '../../services/masterDataApi/financialYear.api';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Calendar, Hash, ShieldCheck } from 'lucide-react';

const FinancialYearPage: React.FC = () => {
  const { FINANCIAL_YEAR, NUMBERING_RULE } = API_ENDPOINTS.MASTER_DATA;

  const [selectedFY, setSelectedFY] = useState<FinancialYear | null>(null);
  const { data: rules, refetch: refetchRules } = useFetch<NumberingRule[]>(NUMBERING_RULE);

  const handleToggleFY = async (item: FinancialYear) => {
      const newStatus = item.status === 1 ? 0 : 1;
      try {
          await financialYearApi.patchFY(item.id!, { status: newStatus });
          if (rules) {
              const children = rules.filter(r => r.fin_year_id == item.id && r.status !== newStatus);
              await Promise.all(children.map(c => financialYearApi.patchRule(c.id!, { status: newStatus })));
              if(children.length > 0) refetchRules();
          }
          toast.success(newStatus === 1 ? 'Activated' : 'Deactivated');
      } catch {
          toast.error("Failed to update status");
      }
  };

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Financial Year Management">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 pb-12">
          
          {/* Financial Years Selection */}
          <div className="lg:col-span-5 order-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <GenericTableCrud<FinancialYear>
                title="Financial Years"
                endpoint={FINANCIAL_YEAR}
                columns={[
                    { 
                      header: 'FY Period', 
                      accessor: (item) => (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-blue-500" />
                          <span className="font-bold text-slate-700 dark:text-slate-200">{item.fin_year}</span>
                        </div>
                      )
                    },
                    { header: 'From', accessor: 'from_date', className: 'text-xs hidden sm:table-cell' },
                    { header: 'To', accessor: 'to_date', className: 'text-xs hidden sm:table-cell' }
                ]}
                fields={[
                    { name: 'fin_year', label: 'FY Name (e.g. 2024-25)', type: 'text', required: true, placeholder: 'YYYY-YY' },
                    { name: 'from_date', label: 'Start Date', type: 'date', required: true },
                    { name: 'to_date', label: 'End Date', type: 'date', required: true }
                ]}
                defaults={{ comp_id: 1001 }}
                onRowClick={(item) => setSelectedFY(item)}
                selectedId={selectedFY?.id}
                onStatusChange={handleToggleFY}
                searchKeys={['fin_year']}
                compact={true}
              />
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
               <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
               <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                 Select a year to configure its specific numbering patterns for vouchers and receipts. 
                 Status changes will cascade to all associated numbering rules.
               </p>
            </div>
          </div>

          {/* Numbering Rules Detail */}
          <div className="lg:col-span-7 order-2 flex flex-col gap-6">
             {!selectedFY ? (
                 <div className="h-full min-h-[300px] bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-in fade-in duration-500">
                     <Hash size={48} className="opacity-10 mb-4" />
                     <h4 className="font-bold text-slate-700 dark:text-slate-300">No Selection</h4>
                     <p className="text-xs max-w-xs mt-2">Pick a financial year from the list to manage its automated numbering rules.</p>
                 </div>
             ) : (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div key={`voucher-${selectedFY.id}`} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <GenericTableCrud<NumberingRule>
                          title={`Voucher Rules (${selectedFY.fin_year})`}
                          endpoint={NUMBERING_RULE}
                          columns={[
                              { header: 'Prefix', accessor: 'prefix', className: 'font-mono text-xs font-bold' },
                              { header: 'Suffix', accessor: 'suffix', className: 'text-xs text-slate-400 hidden sm:table-cell' },
                              { header: 'Starts At', accessor: 'start_no', align: 'center', className: 'font-bold text-blue-600' }
                          ]}
                          fields={[
                              { name: 'prefix', label: 'Prefix', type: 'text', required: true, placeholder: 'VCH/24-25/' },
                              { name: 'suffix', label: 'Suffix', type: 'text', placeholder: 'Optional' },
                              { name: 'start_no', label: 'Sequential Start Number', type: 'number', required: true }
                          ]}
                          defaults={{ comp_id: 1001, fin_year_id: selectedFY.id, type: 'VOUCHER', suffix: 'N/A' }}
                          transformRawData={(data) => data.filter(r => r.fin_year_id == selectedFY.id && r.type === 'VOUCHER')}
                          compact={true}
                          enablePagination={false}
                        />
                    </div>
                    
                    <div key={`receipt-${selectedFY.id}`} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <GenericTableCrud<NumberingRule>
                          title={`Receipt Rules (${selectedFY.fin_year})`}
                          endpoint={NUMBERING_RULE}
                          columns={[
                              { header: 'Prefix', accessor: 'prefix', className: 'font-mono text-xs font-bold' },
                              { header: 'Suffix', accessor: 'suffix', className: 'text-xs text-slate-400 hidden sm:table-cell' },
                              { header: 'Starts At', accessor: 'start_no', align: 'center', className: 'font-bold text-green-600' }
                          ]}
                          fields={[
                              { name: 'prefix', label: 'Prefix', type: 'text', required: true, placeholder: 'RECPT/24-25/' },
                              { name: 'suffix', label: 'Suffix', type: 'text', placeholder: 'Optional' },
                              { name: 'start_no', label: 'Sequential Start Number', type: 'number', required: true }
                          ]}
                          defaults={{ comp_id: 1001, fin_year_id: selectedFY.id, type: 'RECEIPT', suffix: 'N/A' }}
                          transformRawData={(data) => data.filter(r => r.fin_year_id == selectedFY.id && r.type === 'RECEIPT')}
                          compact={true}
                          enablePagination={false}
                        />
                    </div>
                 </div>
             )}
          </div>
        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default FinancialYearPage;
