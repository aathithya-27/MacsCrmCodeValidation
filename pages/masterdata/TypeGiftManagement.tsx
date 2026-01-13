
import React from 'react';
import MasterDataLayout from './MasterDataLayout';
import { GenericTableCrud } from '../../components/generic/GenericTableCrud';
import { Gift, SumAssuredTier, PremiumTier, CustomerType } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { API_ENDPOINTS } from '../../config/api.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Gift as GiftIcon, Shield, DollarSign, Award } from 'lucide-react';

const TypeGiftManagementPage: React.FC = () => {
  const { GIFT, CUSTOMER_TYPE, SUM_ASSURED_TIER, PREMIUM_TIER } = API_ENDPOINTS.MASTER_DATA;

  const { data: gifts } = useFetch<Gift[]>(GIFT);
  const { data: customerTypes } = useFetch<CustomerType[]>(CUSTOMER_TYPE);

  const giftOptions = [
      { label: '-- No Gift Assigned --', value: '' },
      ...(gifts?.filter(g => g.status === 1).map(g => ({ label: g.gift_name, value: g.gift_name })) || [])
  ];

  const typeOptions = customerTypes?.filter(t => t.status === 1).map(t => ({ label: t.cust_type, value: t.cust_type })) || [];

  return (
    <ErrorBoundary>
      <MasterDataLayout title="Tier & Rewards Management">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full pb-12 animate-in fade-in duration-500">
          
          {/* 1. Gifts */}
          <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
              <GenericTableCrud<Gift>
                  title="Promotional Gifts"
                  endpoint={GIFT}
                  columns={[
                    { 
                      header: 'Gift Description', 
                      accessor: (item) => (
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-pink-50 dark:bg-pink-900/30 rounded text-pink-600">
                            <GiftIcon size={14} />
                          </div>
                          <span className="font-bold">{item.gift_name}</span>
                        </div>
                      )
                    }
                  ]}
                  fields={[{ name: 'gift_name', label: 'Item Name', type: 'text', required: true, placeholder: 'e.g. Parker Pen' }]}
                  searchKeys={['gift_name']}
                  compact={true}
              />
          </div>

          {/* 2. Sum Assured Tiers */}
          <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
              <GenericTableCrud<SumAssuredTier>
                  title="SA Based Tiering"
                  endpoint={SUM_ASSURED_TIER}
                  columns={[
                      { 
                        header: 'Tier', 
                        accessor: (item) => (
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-blue-500" />
                            <span className="font-bold">{item.tier_name}</span>
                          </div>
                        )
                      },
                      { header: 'Min SA', accessor: (r) => <span className="font-mono text-xs font-bold text-slate-500">₹{Number(r.minimum_sum_assured).toLocaleString()}</span> }
                  ]}
                  fields={[
                      { name: 'tier_name', label: 'Mapped Customer Tier', type: 'select', required: true, options: typeOptions },
                      { name: 'minimum_sum_assured', label: 'Minimum Sum Assured Threshold', type: 'number', required: true },
                      { name: 'assigned_gift', label: 'Reward Gift', type: 'select', options: giftOptions }
                  ]}
                  defaults={{ comp_id: 1001, assigned_gift: '', minimum_sum_assured: 0 }}
                  compact={true}
              />
          </div>

          {/* 3. Premium Tiers */}
          <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
              <GenericTableCrud<PremiumTier>
                  title="Premium Based Tiering"
                  endpoint={PREMIUM_TIER}
                  columns={[
                      { 
                        header: 'Tier', 
                        accessor: (item) => (
                          <div className="flex items-center gap-2">
                            <Award size={14} className="text-emerald-500" />
                            <span className="font-bold">{item.tier_name}</span>
                          </div>
                        )
                      },
                      { header: 'Min Prem', accessor: (r) => <span className="font-mono text-xs font-bold text-slate-500">₹{Number(r.minimum_premium).toLocaleString()}</span> }
                  ]}
                  fields={[
                      { name: 'tier_name', label: 'Mapped Customer Tier', type: 'select', required: true, options: typeOptions },
                      { name: 'minimum_premium', label: 'Minimum Premium Threshold', type: 'number', required: true },
                      { name: 'assigned_gift', label: 'Reward Gift', type: 'select', options: giftOptions }
                  ]}
                  defaults={{ comp_id: 1001, assigned_gift: '', minimum_premium: 0 }}
                  compact={true}
              />
          </div>

        </div>
      </MasterDataLayout>
    </ErrorBoundary>
  );
};

export default TypeGiftManagementPage;
