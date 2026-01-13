
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { Gender } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { UserCheck } from 'lucide-react';

const GenderMasterPage: React.FC = () => {
  const { GENDER } = API_ENDPOINTS.MASTER_DATA;
  
  return (
    <ErrorBoundary>
      <MasterDataLayout title="Gender Management">
        <div className="animate-in fade-in duration-500 max-w-4xl space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <GenericTableCrud<Gender>
              title="Identity Options"
              endpoint={GENDER}
              columns={[
                { 
                  header: 'Label', 
                  accessor: (item) => (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600">
                        <UserCheck size={14} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.gender_name}</span>
                    </div>
                  )
                }
              ]}
              fields={[
                { name: 'gender_name', label: 'Gender Name', type: 'text', required: true, placeholder: 'e.g. Non-binary' }
              ]}
              defaults={{ comp_id: 1001 }}
              searchKeys={['gender_name']}
              compact={true}
              emptyMessage="No gender identity records found."
            />
          </div>
        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default GenderMasterPage;
