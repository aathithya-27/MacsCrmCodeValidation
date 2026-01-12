
import React, { useState, useMemo } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { BusinessVertical, InsuranceType, InsuranceSubType } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { API_ENDPOINTS } from '../../config/api.config';
import { ChevronRight, ChevronDown, GripVertical, Settings } from 'lucide-react';
import InsuranceConfigFragment from './fragments/InsuranceConfigFragment';
import MutualFundConfigFragment from './fragments/MutualFundConfigFragment';

const BusinessVerticalPage: React.FC = () => {
  const { BUSINESS_VERTICAL } = API_ENDPOINTS.MASTER_DATA;
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  const { data: verticals, loading } = useFetch<BusinessVertical[]>(BUSINESS_VERTICAL);

  const toggleExpand = (id: number | string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <MasterDataLayout title="Manage Business Verticals">
      <div className="space-y-8 pb-12">
        {/* Top Table: Manage Business Verticals */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <GenericTableCrud<BusinessVertical>
            title="Business Vertical Master"
            endpoint={BUSINESS_VERTICAL}
            columns={[
              { 
                header: '', 
                accessor: () => <GripVertical size={16} className="text-slate-300"/>, 
                width: 'w-10' 
              },
              { 
                header: 'ID', 
                accessor: 'id', 
                width: 'w-20',
                className: 'font-mono text-slate-400'
              },
              { 
                header: 'Name', 
                accessor: 'business_vertical_name', 
                className: 'font-bold text-slate-800 dark:text-white' 
              }
            ]}
            fields={[
              { name: 'business_vertical_name', label: 'Vertical Name', type: 'text', required: true, placeholder: 'e.g. Insurance' }
            ]}
            defaults={{ comp_id: 1001, client_id: 1 }}
            searchKeys={['business_vertical_name']}
            onRowClick={(item) => toggleExpand(item.id!)}
            selectedId={expandedId || undefined}
            compact={true}
          />
        </div>

        {/* Configuration Accordion Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Settings size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Business Vertical Configuration</h2>
          </div>

          {!verticals || verticals.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-400">Add a business vertical to begin configuration.</p>
            </div>
          ) : (
            verticals.map((vertical) => {
              const isExpanded = expandedId === vertical.id;
              const isInsurance = vertical.business_vertical_name.toLowerCase().includes('insurance');
              const isMutualFund = vertical.business_vertical_name.toLowerCase().includes('mutual fund');

              return (
                <div 
                  key={vertical.id} 
                  className={`
                    bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300
                    ${isExpanded 
                      ? 'border-blue-500 shadow-md ring-1 ring-blue-100 dark:ring-blue-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'}
                  `}
                >
                  {/* Accordion Header */}
                  <button 
                    onClick={() => toggleExpand(vertical.id!)}
                    className="w-full px-6 py-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        transition-transform duration-200
                        ${isExpanded ? 'rotate-90 text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}
                      `}>
                        <ChevronRight size={20} />
                      </div>
                      <span className={`text-lg font-bold ${isExpanded ? 'text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                        {vertical.business_vertical_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded">
                        {isInsurance ? 'Insurance' : isMutualFund ? 'Mutual Fund' : 'Standard'}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${vertical.status === 1 ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
                      {isInsurance ? (
                        <InsuranceConfigFragment verticalId={vertical.id!} />
                      ) : isMutualFund ? (
                        <MutualFundConfigFragment />
                      ) : (
                        <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                          This vertical uses standard configuration settings.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </MasterDataLayout>
  );
};

export default BusinessVerticalPage;
