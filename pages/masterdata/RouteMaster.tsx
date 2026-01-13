
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { Route } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Navigation, MapPin } from 'lucide-react';

const RouteMasterPage: React.FC = () => {
  const { ROUTE } = API_ENDPOINTS.MASTER_DATA;
  
  return (
    <ErrorBoundary>
      <MasterDataLayout title="Route Management">
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <GenericTableCrud<Route>
              title="Operational Routes"
              endpoint={ROUTE}
              columns={[
                { 
                  header: 'Route Name', 
                  accessor: (item) => (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded text-emerald-600">
                        <Navigation size={14} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.route_name}</span>
                    </div>
                  )
                }
              ]}
              fields={[
                { 
                  name: 'route_name', 
                  label: 'Route Description', 
                  type: 'text', 
                  required: true, 
                  placeholder: 'e.g. Coimbatore Northern Loop' 
                }
              ]}
              defaults={{ comp_id: 1001 }}
              searchKeys={['route_name']}
              compact={true}
              emptyMessage="No collection or service routes defined."
            />
          </div>
        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default RouteMasterPage;
