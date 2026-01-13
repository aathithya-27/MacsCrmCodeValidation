
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Button, Input, Modal, DataTable } from '../ui';
import { Pagination } from '../ui/Pagination';
import { SmartForm, FormField } from './SmartForm';
import { useFetch } from '../../hooks/useFetch';
import { createGenericApi } from '../../services/genericApi';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { sanitizeObject } from '../../utils/sanitization';
import { ErrorBoundary } from '../ErrorBoundary';

interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface GenericTableCrudProps<T> {
  title: string;
  endpoint: string;
  columns: ColumnDef<T>[];
  fields: FormField[];
  defaults?: Partial<T>;
  searchKeys?: (keyof T)[];
  transformRawData?: (data: T[]) => T[];
  onStatusChange?: (item: T) => void;
  disableAdd?: boolean;
  onSaveTransform?: (data: any) => any;
  onRowClick?: (item: T) => void;
  selectedId?: number | string;
  emptyMessage?: string;
  enablePagination?: boolean;
  compact?: boolean;
}

export function GenericTableCrud<T extends { id?: number | string; status?: number }>({
  title,
  endpoint,
  columns,
  fields,
  defaults = {},
  searchKeys = [],
  transformRawData,
  onStatusChange,
  disableAdd = false,
  onSaveTransform,
  onRowClick,
  selectedId,
  emptyMessage,
  enablePagination = true,
  compact = false
}: GenericTableCrudProps<T>) {
  const { data: rawData, loading, isRefetching, error, refetch, setData } = useFetch<T[]>(endpoint, { 
    cacheKey: endpoint 
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<T> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [saving, setSaving] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const api = useMemo(() => createGenericApi<T>(endpoint), [endpoint]);

  const filteredData = useMemo(() => {
    let d = rawData || [];
    if (transformRawData) d = transformRawData(d);
    
    if (!debouncedSearch || searchKeys.length === 0) return d;
    
    const lowerQuery = debouncedSearch.toLowerCase();
    return d.filter(item => 
      searchKeys.some(key => {
        const val = (item as any)[key];
        return String(val || '').toLowerCase().includes(lowerQuery);
      })
    );
  }, [rawData, transformRawData, debouncedSearch, searchKeys]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const paginatedData = useMemo(() => {
    if (!enablePagination) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage, enablePagination]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleCreate = () => {
    setEditingItem({ status: 1, ...defaults } as Partial<T>);
    setIsModalOpen(true);
  };

  const handleEdit = (item: T) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    setSaving(true);
    try {
      let payload = sanitizeObject({ ...formData });
      if (onSaveTransform) {
        payload = onSaveTransform(payload);
      }

      if (editingItem?.id) {
        await api.update(editingItem.id, { ...editingItem, ...payload } as T);
        toast.success('Updated successfully');
      } else {
        await api.create({ ...defaults, ...payload } as T);
        toast.success('Created successfully');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: T) => {
    if (onStatusChange) {
      onStatusChange(item);
      return;
    }
    
    const oldStatus = item.status;
    const newStatus = oldStatus === 1 ? 0 : 1;
    setData(prev => prev?.map(i => i.id === item.id ? { ...i, status: newStatus } : i) || []);
    
    try {
      await api.patch(item.id!, { status: newStatus } as any);
      toast.success(newStatus === 1 ? 'Activated' : 'Deactivated');
    } catch (err) {
      toast.error('Failed to update status');
      setData(prev => prev?.map(i => i.id === item.id ? { ...i, status: oldStatus } : i) || []);
      refetch();
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-6 rounded-lg text-center">
        <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
        <h4 className="font-bold text-red-700 dark:text-red-400">Failed to load {title}</h4>
        <p className="text-sm text-red-600 dark:text-red-500 mb-4">{error}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()} icon={<RefreshCw size={14} />}>Retry</Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col h-full min-h-[400px]">
        <div className={`p-4 border-b border-gray-200 dark:border-slate-700 flex ${compact ? 'flex-col items-start gap-3' : 'flex-col md:flex-row justify-between items-center gap-4'}`}>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {title}
            </h3>
            {isRefetching && <RefreshCw size={14} className="animate-spin text-blue-500" />}
          </div>
          <div className={`flex flex-col sm:flex-row gap-3 w-full ${compact ? '' : 'md:w-auto'}`}>
            {searchKeys.length > 0 && (
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  className="pl-9 h-10 w-full" 
                  placeholder="Search..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
            )}
            {!disableAdd && (
              <Button size="md" onClick={handleCreate} icon={<Plus size={18} />} className="w-full sm:w-auto">Add</Button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <DataTable 
            data={paginatedData}
            columns={columns}
            loading={loading}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onRowClick={onRowClick}
            selectedId={selectedId}
            emptyMessage={emptyMessage}
          />
        </div>

        {enablePagination && filteredData.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredData.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingItem?.id ? `Edit ${title}` : `Add ${title}`}
          size="md"
        >
          <SmartForm 
            fields={fields}
            defaultValues={editingItem}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            isLoading={saving}
          />
        </Modal>
      </div>
    </ErrorBoundary>
  );
}
