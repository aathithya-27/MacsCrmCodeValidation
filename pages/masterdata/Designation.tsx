
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { Designation } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ShieldAlert, Award } from 'lucide-react';

const DesignationPage: React.FC = () => {
  const { DESIGNATION } = API_ENDPOINTS.MASTER_DATA;
  
  return (
    <ErrorBoundary>
      <MasterDataLayout title="Designation Master">
        <div className="animate-in fade-in duration-500 space-y-6">
          <GenericTableCrud<Designation>
            title="Organizational Designations"
            endpoint={DESIGNATION}
            columns={[
              { 
                header: 'Designation Name', 
                accessor: (item) => (
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                      <Award size={14} />
                    </div>
                    <span className="font-bold">{item.designation_name}</span>
                  </div>
                )
              },
              { 
                header: 'Rank', 
                accessor: 'designation_rank', 
                align: 'center',
                width: 'w-24',
                className: 'font-mono font-bold text-slate-500'
              }
            ]}
            fields={[
              { 
                name: 'designation_name', 
                label: 'Designation Title', 
                type: 'text', 
                required: true,
                placeholder: 'e.g. Senior Regional Manager'
              },
              { 
                name: 'designation_rank', 
                label: 'Hierarchy Priority (Rank)', 
                type: 'number', 
                placeholder: '1 = Highest'
              }
            ]}
            defaults={{ comp_id: 1001, status: 1 }}
            searchKeys={['designation_name']}
            transformRawData={(data) => [...data].sort((a,b) => (Number(a.designation_rank)||999) - (Number(b.designation_rank)||999))}
            emptyMessage="No designations configured yet."
          />
        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default DesignationPage;
