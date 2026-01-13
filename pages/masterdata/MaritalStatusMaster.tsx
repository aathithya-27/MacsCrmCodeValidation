
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { MaritalStatus } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { HeartHandshake } from 'lucide-react';

const MaritalStatusMasterPage: React.FC = () => {
  const { MARITAL_STATUS } = API_ENDPOINTS.MASTER_DATA;

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Marital Status Directory">
        <div className="animate-in fade-in duration-500 max-w-4xl">
          <GenericTableCrud<MaritalStatus>
            title="Marital Status Options"
            endpoint={MARITAL_STATUS}
            columns={[
              { 
                header: 'Status Name', 
                accessor: (item) => (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                      <HeartHandshake size={16} />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{item.marital_status}</span>
                  </div>
                )
              }
            ]}
            fields={[
              { 
                name: 'marital_status', 
                label: 'Status Description', 
                type: 'text', 
                required: true,
                placeholder: 'e.g. Single, Married, etc.'
              }
            ]}
            defaults={{ comp_id: 1001 }}
            searchKeys={['marital_status']}
            compact={true}
            emptyMessage="No marital status options found."
          />
        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default MaritalStatusMasterPage;
