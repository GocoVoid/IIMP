// UPDATED WHOLE

import React, { useState, useEffect } from 'react';
import { StatusBadge, PriorityBadge } from '../shared/TicketBadge';
import EmptyState from '../shared/EmptyState';
import TicketDetailModal from '../shared/TicketDetailModal';
import { useAuthContext } from '../../context/AuthContext';
import { CATEGORY_NAMES as CATEGORIES, PRIORITIES, STATUSES } from '../../data/mockData';
import { useTickets } from '../../hooks/useTickets';
import { LoadingState } from '../shared/PageState';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const SLACountdown = ({ slaDueAt, isSlaBreached, status }) => {
  if (status === 'Resolved' || status === 'Closed')
    return <span className="text-xs text-gray-400">—</span>;
  if (!slaDueAt)
    return <span className="text-xs text-gray-400">Pending</span>;

  const diff = new Date(slaDueAt) - Date.now();
  if (isSlaBreached || diff <= 0)
    return (
      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
        Breached
      </span>
    );

  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const color = hrs < 2 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50';

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
    </span>
  );
};

const MyTicketsList = ({ onCreateClick }) => {
  const { user } = useAuthContext();

  const {
    tickets,
    filters,
    loading,
    updateFilter,
    clearFilters,
    fetchAllByUser,
    updateStatus,
    assignTicket,
    addComment,
    recategorize,
  } = useTickets(user?.id, 'EMPLOYEE');

  const [selected, setSelected] = useState(null);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  useEffect(() => { fetchAllByUser(); }, []);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">

        {/* ── Toolbar ── */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-3"
          style={{ borderBottom: '1px solid #f0f0f5' }}>
          <h2 className="text-sm font-bold text-gray-900 mr-auto tracking-tight">My Tickets</h2>

          {/* Search */}
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search tickets…"
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 w-48
                focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            />
          </div>

          {/* Status / Priority / Category filters */}
          {[
            { key: 'status',   placeholder: 'All Status',   options: STATUSES   },
            { key: 'priority', placeholder: 'All Priority', options: PRIORITIES },
            { key: 'category', placeholder: 'All Category', options: CATEGORIES },
          ].map(({ key, placeholder, options }) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(e) => updateFilter(key, e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700
                focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            >
              <option value="">{placeholder}</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-dashed
                border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <LoadingState/>

        /* ── Empty ── */
        ) : tickets.length === 0 ? (
          <EmptyState
            title="No tickets found"
            description={
              hasActiveFilters
                ? 'No tickets match your filters. Try adjusting them.'
                : 'You have not raised any tickets yet.'
            }
            action={!hasActiveFilters && (
              <button
                onClick={onCreateClick}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#3c3c8c' }}
              >
                Create your first ticket
              </button>
            )}
          />

        /* ── Table ── */
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">

              {/* Header */}
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f5' }}>
                  {[
                    { label: 'ID',        cls: 'w-44  pl-6' },
                    { label: 'Title',     cls: ''           },
                    { label: 'Category',  cls: 'w-40'       },
                    {label: 'Department', cls:'w-40'        },
                    { label: 'Priority',  cls: 'w-28'       },
                    { label: 'Status',    cls: 'w-28'       },
                    { label: 'SLA',       cls: 'w-28'       },
                    { label: 'Created',   cls: 'w-32'       },
                    { label: 'View ',    cls: 'w-24'       },
                  ].map(({ label, cls }) => (
                    <th key={label} className={`px-4 py-3.5 text-left ${cls}`}>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows */}
              <tbody>
                {tickets.map((t, i) => (
                  <tr
                    key={t.id}
                    className="group transition-colors hover:bg-indigo-50/40"
                    style={{
                      borderBottom: i < tickets.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}
                  >
                    {/* ID */}
                    <td className="pl-6 pr-4 py-4">
                      <span
                        className="font-mono text-xs font-bold tracking-tight"
                        style={{ color: '#3c3c8c' }}
                      >
                        {t.id}
                      </span>
                    </td>

                    {/* Title + description preview */}
                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate leading-relaxed">
                          {t.description}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4">
                      {t.category ? (
                        <span className="inline-flex items-center text-xs font-medium
                          text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {t.category}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    
                    {/* Department */}
                    <td className="px-4 py-4">
                      {t.department ? (
                        <span className="inline-flex items-center text-xs font-medium
                          text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {t.department}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-4">
                      <PriorityBadge priority={t.priority} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={t.status} />
                    </td>

                    {/* SLA */}
                    <td className="px-4 py-4">
                      <SLACountdown
                        slaDueAt={t.slaDueAt}
                        isSlaBreached={t.isSlaBreached}
                        status={t.status}
                      />
                    </td>

                    {/* Created */}
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-gray-400">
                        {formatDate(t.createdAt)}
                      </span>
                    </td>

                    {/* ✅ View button — only this opens the modal */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelected(t)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white
                          transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                        style={{ background: 'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div
              className="px-6 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid #f0f0f5', background: '#fafafa' }}
            >
              <span className="text-xs text-gray-400">
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                {hasActiveFilters ? ' matched' : ' total'}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium"
                  style={{ color: '#14a0c8' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <TicketDetailModal
        ticket={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        role={user?.role}
        user={user}
        onUpdateStatus={updateStatus}
        onAssign={assignTicket}
        onAddComment={addComment}
        onRecategorize={recategorize}
      />
    </>
  );
};

export default MyTicketsList;