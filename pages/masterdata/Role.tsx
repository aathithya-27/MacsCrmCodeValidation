
import React, { useState, useMemo } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { roleApi } from '../../services/masterDataApi/role.api';
import { Role } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { useMasterCrud } from '../../hooks/useMasterCrud';
import { DataTable, Button, Input, Modal, Toggle } from '../../components/ui';
import { SmartForm } from '../../components/generic/SmartForm';
import { Plus, Search, Users, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { sanitizeObject } from '../../utils/sanitization';

const RolePage: React.FC = () => {
  const { ROLE } = API_ENDPOINTS.MASTER_DATA;

  const { data: roles, loading, refetch, setData } = useFetch<Role[]>(ROLE);
  const [searchQuery, setSearchQuery] = useState('');

  const crud = useMasterCrud<Role>({
    api: roleApi,
    refetch,
    updateLocalData: setData,
    defaults: { comp_id: 1001, is_advisor_role: 0, status: 1 },
    validate: (item) => !item.role_desc?.trim() ? "Role Description is required" : null
  });

  const filteredData = useMemo(() => {
    if (!roles) return [];
    if (!searchQuery) return roles;
    return roles.filter(r => r.role_desc.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [roles, searchQuery]);

  const handleToggleAdvisor = async (item: Role) => {
    const newVal = item.is_advisor_role === 1 ? 0 : 1;
    
    setData(prev => prev?.map(r => r.id === item.id ? { ...r, is_advisor_role: newVal } : r) || []);
    
    try {
      await roleApi.patch(item.id!, { is_advisor_role: newVal });
      toast.success(`${item.role_desc}: Advisor status ${newVal ? 'granted' : 'revoked'}`);
    } catch (e) {
      toast.error("Failed to sync role change");
      refetch();
    }
  };

  const handleFormSubmit = async (data: any) => {
    const sanitized = sanitizeObject(data);
    const payload = {
        ...sanitized,
        is_advisor_role: sanitized.is_advisor_role ? 1 : 0
    };
    
    try {
        if (crud.currentItem.id) {
            await roleApi.update(crud.currentItem.id, { ...crud.currentItem, ...payload });
            toast.success("Role security profile updated");
        } else {
            await roleApi.create({ ...crud.defaults, ...payload });
            toast.success("New system role created");
        }
        crud.handleCloseModal();
        refetch();
    } catch (e: any) {
        toast.error(e.message || "Operation failed");
    }
  };

  return (
    <ErrorBoundary>
      <MasterDataLayout title="System Access Roles">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] overflow-hidden transition-all">
          
          {}
          <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/40 dark:bg-slate-800/50">
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                Role Directory
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5">Define platform-wide user profiles</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    className="pl-9 h-11 w-full border-slate-200 dark:border-slate-600" 
                    placeholder="Search roles..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                  />
               </div>
               <Button onClick={() => crud.handleOpenModal()} icon={<Plus size={20} />} className="w-full sm:w-auto font-bold h-11 px-6 shadow-lg shadow-blue-500/10">Add Role</Button>
            </div>
          </div>

          {}
          <div className="flex-1 overflow-auto">
            <DataTable 
              data={filteredData}
              columns={[
                { 
                  header: 'ROLE DESCRIPTION', 
                  accessor: (item) => (
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {item.role_desc.charAt(0)}
                       </div>
                       <span className="font-bold text-slate-700 dark:text-slate-200">{item.role_desc}</span>
                    </div>
                  )
                },
                { 
                  header: 'ADVISOR ACCESS', 
                  accessor: (item) => (
                    <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                           <Toggle 
                              checked={item.is_advisor_role === 1} 
                              onChange={() => handleToggleAdvisor(item)}
                              size="sm"
                           />
                           {item.is_advisor_role === 1 && <ShieldCheck size={16} className="text-green-500" />}
                        </div>
                    </div>
                  ),
                  align: 'center',
                  width: 'w-40'
                }
              ]}
              loading={loading}
              onEdit={crud.handleOpenModal}
              onToggleStatus={crud.handleToggleStatus}
              emptyMessage="No roles found. Start by adding a system role."
            />
          </div>
        </div>

        {}
        <Modal 
          isOpen={crud.isModalOpen} 
          onClose={crud.handleCloseModal} 
          title={crud.currentItem.id ? 'Modify Role Security' : 'Define New System Role'}
        >
          <SmartForm
            fields={[
               { name: 'role_desc', label: 'Role Name', type: 'text', required: true, placeholder: 'e.g. Portfolio Advisor' },
               { name: 'is_advisor_role', label: 'Grant Financial Advisor Privileges?', type: 'toggle' }
            ]}
            defaultValues={{
                ...crud.currentItem,
                is_advisor_role: crud.currentItem.is_advisor_role === 1
            }}
            onSubmit={handleFormSubmit}
            onCancel={crud.handleCloseModal}
            isLoading={crud.saving}
          />
        </Modal>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default RolePage;
