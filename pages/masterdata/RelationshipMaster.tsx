
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { Relationship } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Heart, Users } from 'lucide-react';

const RelationshipMaster: React.FC = () => {
  const { RELATIONSHIP } = API_ENDPOINTS.MASTER_DATA;
  
  return (
    <ErrorBoundary>
      <MasterDataLayout title="Relationship Master">
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <GenericTableCrud<Relationship>
              title="Family Relationship Types"
              endpoint={RELATIONSHIP}
              columns={[
                { 
                  header: 'Relationship Name', 
                  accessor: (item) => (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-pink-50 dark:bg-pink-900/30 rounded text-pink-600">
                        <Heart size={14} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.relationship_name}</span>
                    </div>
                  )
                }
              ]}
              fields={[
                { 
                  name: 'relationship_name', 
                  label: 'Relationship Title', 
                  type: 'text', 
                  required: true, 
                  placeholder: 'e.g. Spouse, Dependent' 
                }
              ]}
              defaults={{ comp_id: 1001 }}
              searchKeys={['relationship_name']}
              compact={true}
              emptyMessage="No relationship types defined."
            />
          </div>
        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default RelationshipMaster;
