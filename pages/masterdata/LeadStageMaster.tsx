
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { LeadStage } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { TrendingUp, Info } from 'lucide-react';

const LeadStageMaster: React.FC = () => {
  const { LEAD_STAGE } = API_ENDPOINTS.MASTER_DATA;
  
  return (
    <ErrorBoundary>
      <MasterDataLayout title="Lead Pipeline Stages">
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <GenericTableCrud<LeadStage>
              title="Sales Funnel Stages"
              endpoint={LEAD_STAGE}
              columns={[
                { 
                  header: 'Stage Name', 
                  accessor: (item) => (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600">
                        <TrendingUp size={14} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.lead_name}</span>
                    </div>
                  )
                }
              ]}
              fields={[
                { name: 'lead_name', label: 'Stage Label', type: 'text', required: true, placeholder: 'e.g. Qualification' }
              ]}
              defaults={{ comp_id: 1001 }}
              searchKeys={['lead_name']}
              compact={true}
              emptyMessage="No pipeline stages defined. Your sales funnel is currently empty."
            />
          </div>
        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default LeadStageMaster;
