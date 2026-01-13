
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { DocumentMaster } from '../../types';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
// Fix: 'ShieldInfo' does not exist in 'lucide-react', using 'Shield' instead
import { FileCheck, Shield } from 'lucide-react';

const DocumentMasterPage: React.FC = () => {
  const { DOCUMENT_MASTER } = API_ENDPOINTS.MASTER_DATA;
  
  return (
    <ErrorBoundary>
      <MasterDataLayout title="Global Document Repository">
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <GenericTableCrud<DocumentMaster>
              title="Official Document Registry"
              endpoint={DOCUMENT_MASTER}
              columns={[
                { 
                  header: 'Document Name', 
                  accessor: (item) => (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600">
                        <FileCheck size={14} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.doc_name}</span>
                    </div>
                  ),
                  className: 'font-bold' 
                }
              ]}
              fields={[
                { 
                  name: 'doc_name', 
                  label: 'Official Title of Document', 
                  type: 'text', 
                  required: true, 
                  placeholder: 'e.g. Income Tax Return (ITR)' 
                }
              ]}
              searchKeys={['doc_name']}
              compact={true}
              emptyMessage="No standard documents configured."
            />
          </div>
        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default DocumentMasterPage;
