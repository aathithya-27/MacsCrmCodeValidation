
import React, { useState } from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { Religion, Festival, FestivalDate } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Map, CalendarDays, Zap, ChevronRight } from 'lucide-react';

const ReligionsPage: React.FC = () => {
  const { RELIGION, FESTIVAL, FESTIVAL_DATE } = API_ENDPOINTS.MASTER_DATA;

  const [selectedReligion, setSelectedReligion] = useState<Religion | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  const { data: religions } = useFetch<Religion[]>(RELIGION);
  const activeReligions = religions?.filter(r => r.status === 1) || [];

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Religions & Festivals">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 pb-12 h-full">
          
          {/* Column 1: Religions */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <GenericTableCrud<Religion>
                title="Religions"
                endpoint={RELIGION}
                columns={[
                  { 
                    header: 'Name', 
                    accessor: (item) => (
                      <div className="flex items-center justify-between group">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.religion_name}</span>
                        {selectedReligion?.id === item.id && <ChevronRight size={16} className="text-blue-600 animate-in slide-in-from-left-2" />}
                      </div>
                    )
                  }
                ]}
                fields={[{ name: 'religion_name', label: 'Religion Name', type: 'text', required: true, placeholder: 'e.g. Hinduism' }]}
                defaults={{ comp_id: 1001 }}
                searchKeys={['religion_name']}
                onRowClick={(item) => { setSelectedReligion(item); setSelectedFestival(null); }}
                selectedId={selectedReligion?.id}
                compact={true}
              />
            </div>
          </div>

          {/* Column 2: Festivals */}
          <div className="lg:col-span-4 flex flex-col gap-4">
              {selectedReligion ? (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300" key={selectedReligion.id}>
                      <GenericTableCrud<Festival>
                          title={`Festivals (${selectedReligion.religion_name})`}
                          endpoint={FESTIVAL}
                          columns={[
                            { 
                              header: 'Name', 
                              accessor: (item) => (
                                <div className="flex items-center justify-between">
                                  <span className="font-bold">{item.festival_name}</span>
                                  {selectedFestival?.id === item.id && <Zap size={14} className="text-amber-500 fill-amber-500" />}
                                </div>
                              )
                            }
                          ]}
                          fields={[
                              { name: 'festival_name', label: 'Festival Name', type: 'text', required: true },
                              { 
                                  name: 'religion_id', label: 'Assign Religion', type: 'select', required: true,
                                  options: activeReligions.map(r => ({ label: r.religion_name, value: r.id! })) 
                              }
                          ]}
                          defaults={{ comp_id: 1001, religion_id: selectedReligion.id }}
                          transformRawData={(data) => data.filter(f => f.religion_id == selectedReligion.id)}
                          searchKeys={['festival_name']}
                          onRowClick={(item) => setSelectedFestival(item)}
                          selectedId={selectedFestival?.id}
                          emptyMessage="No festivals configured for this religion."
                          compact={true}
                      />
                  </div>
              ) : (
                  <div className="h-64 lg:h-full bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <Map size={40} className="opacity-10 mb-4" />
                      <p className="text-xs font-medium">Select a Religion to manage associated Festivals</p>
                  </div>
              )}
          </div>

          {/* Column 3: Event Dates */}
          <div className="lg:col-span-4 flex flex-col gap-4">
              {selectedFestival ? (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-500" key={selectedFestival.id}>
                      <GenericTableCrud<FestivalDate>
                          title={`Dates (${selectedFestival.festival_name})`}
                          endpoint={FESTIVAL_DATE}
                          columns={[
                              { header: 'Event Date', accessor: 'event_date', className: 'font-mono text-xs font-bold' },
                              { header: 'Year', accessor: 'year', align: 'center', className: 'text-[10px] bg-slate-100 dark:bg-slate-700 px-1 rounded font-bold' }
                          ]}
                          fields={[
                              { name: 'event_date', label: 'Celebration Date', type: 'date', required: true },
                              { name: 'year', label: 'Occurrence Year', type: 'text', required: true, placeholder: 'YYYY' }
                          ]}
                          defaults={{ festival_id: selectedFestival.id }}
                          transformRawData={(data) => data.filter(d => d.festival_id == selectedFestival.id)}
                          emptyMessage="No specific dates listed."
                          compact={true}
                          onSaveTransform={(data) => ({
                              ...data,
                              year: data.event_date ? data.event_date.split('-')[0] : data.year
                          })}
                      />
                  </div>
              ) : (
                  <div className="h-64 lg:h-full bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <CalendarDays size={40} className="opacity-10 mb-4" />
                      <p className="text-xs font-medium">Select a Festival to configure specific event dates</p>
                  </div>
              )}
          </div>

        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default ReligionsPage;
