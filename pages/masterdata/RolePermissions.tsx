
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { rolePermissionApi } from '../../services/masterDataApi/rolePermission.api';
import { Role, RolePermission } from '../../types';
import { Save, Shield, AlertCircle, RefreshCw, CheckCircle2, ChevronRight, LayoutGrid } from 'lucide-react';
import { Button, Select, Skeleton } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const MODULES = [
  'Company Master', 'Branch', 'Business Vertical', 'Policy Configuration', 
  'Agency and Scheme', 'Geography', 'Designation', 'Role', 
  'Role Permissions', 'Document Master', 'Financial Year', 'Bank Master',
  'Lead Stage', 'Lead Referral', 'Relationship', 'Customer Segment', 
  'Task Status', 'Route Master', 'Accounts Category'
];

const ACCESS_LEVELS = ['None', 'View', 'Edit', 'Full'] as const;
type AccessLevel = typeof ACCESS_LEVELS[number];

const RolePermissionsPage: React.FC = () => {
  const { ROLE } = API_ENDPOINTS.MASTER_DATA;
  const { data: roles, loading: loadingRoles, error: rolesError, refetch: refetchRoles } = useFetch<Role[]>(ROLE);
  
  const [selectedRoleId, setSelectedRoleId] = useState<number | string | ''>('');
  const [localPermissions, setLocalPermissions] = useState<Record<string, AccessLevel>>({});
  const [permissionIds, setPermissionIds] = useState<Record<string, number | string>>({});
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRole = useMemo(() => roles?.find(r => r.id == selectedRoleId), [roles, selectedRoleId]);

  const loadPermissions = useCallback(async (roleId: number | string) => {
    setLoadingPerms(true);
    try {
      const res = await rolePermissionApi.getByRoleId(roleId);
      const newLocalPerms: Record<string, AccessLevel> = {};
      const newIds: Record<string, number | string> = {};
      
      MODULES.forEach(m => { newLocalPerms[m] = 'None'; });
      
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(p => {
           if (MODULES.includes(p.module_name)) {
              newLocalPerms[p.module_name] = p.access_level as AccessLevel;
              if (p.id) newIds[p.module_name] = p.id;
           }
        });
      }
      setLocalPermissions(newLocalPerms);
      setPermissionIds(newIds);
    } catch (e) { 
      toast.error("Failed to retrieve permission matrix");
    } finally { 
      setLoadingPerms(false); 
    }
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      loadPermissions(selectedRoleId);
    } else {
      setLocalPermissions({});
      setPermissionIds({});
    }
  }, [selectedRoleId, loadPermissions]);

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const operations = MODULES.map(async (moduleName) => {
        const currentLevel = localPermissions[moduleName];
        const existingId = permissionIds[moduleName];
        
        if (existingId) {
          return rolePermissionApi.update(existingId, { 
            id: existingId, 
            role_id: selectedRoleId, 
            module_name: moduleName, 
            access_level: currentLevel 
          });
        } else if (currentLevel !== 'None') {
          return rolePermissionApi.create({ 
            role_id: selectedRoleId, 
            module_name: moduleName, 
            access_level: currentLevel 
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(operations);
      
      await loadPermissions(selectedRoleId);
      toast.success(`Access Matrix for "${selectedRole?.role_desc}" updated successfully`);
    } catch (e) { 
      toast.error('Sync failed. Please check your network connection.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const setPerm = (module: string, level: AccessLevel) => {
      setLocalPermissions(prev => ({ ...prev, [module]: level }));
  };

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Role-Based Access Control">
         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full min-h-[500px] overflow-hidden transition-all">
            
            {}
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-50/30 dark:bg-slate-800/50">
               <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                      <Shield className="text-white" size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">Access Control Matrix</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure granular permissions for each platform module</p>
                    </div>
                  </div>
               </div>
               
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div className="w-full sm:w-72">
                      <Select 
                        placeholder="Pick a Role to manage..." 
                        options={roles?.filter(r => r.status === 1).map(r => ({label: r.role_desc, value: r.id!})) || []} 
                        value={selectedRoleId} 
                        onChange={e => setSelectedRoleId(e.target.value)} 
                        disabled={loadingRoles || saving} 
                        className="h-12 border-slate-200 dark:border-slate-600"
                      />
                  </div>
                  <Button 
                    variant="success" 
                    onClick={handleSave} 
                    disabled={!selectedRoleId || saving} 
                    isLoading={saving} 
                    icon={<Save size={18} />}
                    className="w-full sm:w-auto h-12 px-8 font-bold shadow-lg shadow-green-500/20"
                  >
                    Save Changes
                  </Button>
               </div>
            </div>

            {}
            <div className="flex-1 overflow-auto bg-slate-50/20 dark:bg-slate-900/5 p-4 md:p-6 custom-scrollbar">
               {rolesError ? (
                 <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-full border border-red-100 dark:border-red-900/20">
                       <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <p className="text-red-600 font-bold max-w-xs">Role catalog failed to load. The server might be offline.</p>
                    <Button variant="outline" onClick={refetchRoles} className="h-9">Retry Connection</Button>
                 </div>
               ) : !selectedRoleId ? (
                 <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 animate-in fade-in zoom-in duration-700">
                    <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm mb-6 border border-slate-100 dark:border-slate-700 group">
                      <LayoutGrid size={64} className="opacity-10 group-hover:opacity-20 transition-opacity" />
                    </div>
                    <h4 className="text-slate-800 dark:text-slate-200 font-bold text-lg">Select a Profile</h4>
                    <p className="text-sm text-center mt-2 leading-relaxed px-10 max-w-sm font-medium">
                      To view or modify access levels, please choose a specific User Role from the dropdown above.
                    </p>
                 </div>
               ) : loadingPerms ? (
                 <div className="space-y-4 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                       <RefreshCw className="animate-spin text-blue-600" size={16} />
                       <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Building Matrix...</span>
                    </div>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                         <Skeleton className="h-5 w-full sm:w-1/3" />
                         <div className="flex-1 grid grid-cols-4 gap-2">
                            {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-8 rounded-lg" />)}
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-2 duration-500">
                    
                    {}
                    <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                                  <th className="px-8 py-5 w-1/3">Module Name</th>
                                  {ACCESS_LEVELS.map(level => (
                                    <th key={level} className="px-6 py-5 text-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <span>{level}</span>
                                        <div className={`h-1 w-6 rounded-full ${
                                          level === 'None' ? 'bg-slate-300' : 
                                          level === 'View' ? 'bg-blue-400' :
                                          level === 'Edit' ? 'bg-purple-500' : 'bg-green-500'
                                        }`}></div>
                                      </div>
                                    </th>
                                  ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {MODULES.map((module) => (
                                <tr key={module} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                    <td className="px-8 py-4.5">
                                       <div className="flex items-center gap-3">
                                          <div className="w-1.5 h-6 bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-600 rounded-full transition-all"></div>
                                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{module}</span>
                                       </div>
                                    </td>
                                    {ACCESS_LEVELS.map((level) => {
                                        const isSelected = localPermissions[module] === level;
                                        return (
                                          <td key={level} className="px-6 py-4.5 text-center">
                                              <button 
                                                onClick={() => setPerm(module, level)}
                                                className={`
                                                  w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all
                                                  ${isSelected 
                                                    ? 'border-blue-600 bg-blue-600 ring-4 ring-blue-50 dark:ring-blue-900/20' 
                                                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'}
                                                `}
                                              >
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                              </button>
                                          </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {}
                    <div className="lg:hidden space-y-4">
                        {MODULES.map((module) => (
                          <div key={module} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                             <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700 pb-3">
                                <div className="flex items-center gap-2">
                                  <ChevronRight size={16} className="text-blue-600" />
                                  <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{module}</span>
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-sm ${
                                  localPermissions[module] === 'Full' ? 'bg-green-600 text-white' :
                                  localPermissions[module] === 'Edit' ? 'bg-purple-600 text-white' :
                                  localPermissions[module] === 'View' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                                }`}>
                                  {localPermissions[module]}
                                </span>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-2">
                                {ACCESS_LEVELS.map(level => {
                                  const isActive = localPermissions[module] === level;
                                  return (
                                    <button
                                      key={level}
                                      onClick={() => setPerm(module, level)}
                                      className={`
                                        flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all relative
                                        ${isActive 
                                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-100 dark:ring-blue-900/20' 
                                          : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 text-slate-500 hover:border-slate-200 dark:hover:border-slate-600'}
                                      `}
                                    >
                                      {isActive && <CheckCircle2 size={14} className="absolute top-1.5 right-1.5" />}
                                      <span className="text-[11px] font-black uppercase tracking-tighter">{level}</span>
                                    </button>
                                  );
                                })}
                             </div>
                          </div>
                        ))}
                    </div>
                 </div>
               )}
            </div>
            
            {}
            {selectedRoleId && !loadingPerms && (
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                       Now Editing Access: <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-200">{selectedRole?.role_desc}</span>
                    </span>
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-tighter">Commit changes to sync system-wide permissions</p>
              </div>
            )}
         </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default RolePermissionsPage;
