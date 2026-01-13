
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { BankMaster, AccountType } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Building2, CreditCard, Landmark } from 'lucide-react';

const BankMasterPage: React.FC = () => {
  const { BANK, ACCOUNT_TYPE } = API_ENDPOINTS.MASTER_DATA;

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Banking Configuration">
        <div className="flex flex-col xl:grid xl:grid-cols-2 gap-8 pb-12 animate-in fade-in duration-500">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Landmark size={18} className="text-blue-600" />
              <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight text-sm">Financial Institutions</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[450px]">
              <GenericTableCrud<BankMaster>
                title="Bank Directory"
                endpoint={BANK}
                columns={[
                  { 
                    header: 'Bank Entity', 
                    accessor: (item) => (
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600">
                          <Building2 size={14} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.bank_name}</span>
                      </div>
                    )
                  }
                ]}
                fields={[
                  { 
                    name: 'bank_name', 
                    label: 'Institution Name', 
                    type: 'text', 
                    required: true, 
                    placeholder: 'e.g. State Bank of India' 
                  }
                ]}
                defaults={{ comp_id: 1001 }}
                searchKeys={['bank_name']}
                compact={true}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <CreditCard size={18} className="text-blue-600" />
              <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight text-sm">Deposit Product Types</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[450px]">
              <GenericTableCrud<AccountType>
                title="Account Classifications"
                endpoint={ACCOUNT_TYPE}
                columns={[
                  { 
                    header: 'Account Class', 
                    accessor: (item) => (
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded text-purple-600">
                          <CreditCard size={14} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.account_type_name}</span>
                      </div>
                    )
                  }
                ]}
                fields={[
                  { 
                    name: 'account_type_name', 
                    label: 'Account Category', 
                    type: 'text', 
                    required: true, 
                    placeholder: 'e.g. Savings, Current, FD' 
                  }
                ]}
                defaults={{ comp_id: 1001 }}
                searchKeys={['account_type_name']}
                compact={true}
              />
            </div>
          </div>

        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default BankMasterPage;
