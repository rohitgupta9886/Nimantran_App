import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Check, X, Search, Filter, CheckSquare, Square, UserPlus, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { apiFetch } from '../services/api';
import { MasterContact } from '../types/masterContact';

interface SelectFromMasterListModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onGuestsAdded?: () => void;
  onSuccess?: (addedCount: number) => void;
}

export const SelectFromMasterListModal: React.FC<SelectFromMasterListModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onGuestsAdded,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<MasterContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMasterContacts();
    }
  }, [isOpen]);

  const fetchMasterContacts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<MasterContact[]>('/master-contacts');
      setContacts(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch master contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedIds.size === 0) {
      setErrorNotice('Please select at least one guest from your Master List');
      return;
    }
    setSubmitting(true);
    setErrorNotice(null);
    try {
      const res = await apiFetch<any>(`/events/${eventId}/import-master-contacts`, {
        method: 'POST',
        body: JSON.stringify({ contact_ids: Array.from(selectedIds) }),
      });
      const importedCount = res.data?.imported_count || selectedIds.size;
      if (onGuestsAdded) onGuestsAdded();
      if (onSuccess) onSuccess(importedCount);
      onClose();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to import selected guests');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const groups = ['ALL', ...Array.from(new Set(contacts.map((c) => c.group_name || 'General')))];

  const filteredContacts = contacts.filter((c) => {
    const matchesGroup = selectedGroup === 'ALL' || (c.group_name || 'General') === selectedGroup;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.relationship && c.relationship.toLowerCase().includes(q));
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-2xl w-full p-6 text-[#302829] space-y-5 shadow-2xl relative">
        
        {/* Navigation & Header */}
        <div className="space-y-3 pb-3 border-b border-[#E9D3D0]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#302829] border border-[#D8B5B0] text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[#9E6F6D]" /> Back
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate('/dashboard');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-xs shadow-md transition-transform flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4 text-white" /> Go To Dashboard
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-[#8C7E80] hover:text-[#302829] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="p-2.5 rounded-2xl bg-[#F2E5E2] text-[#9E6F6D] border border-[#D8B5B0]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif gold-gradient-text">Choose Saved Guests</h3>
              <p className="text-xs text-[#8C7E80]">
                Select from your saved contacts directory • {contacts.length} available
              </p>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {errorNotice}
          </div>
        )}

        {/* Search & Group Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9E6F6D] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by contact name, phone, or relationship..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] text-xs placeholder:text-[#8C7E80] focus:border-[#9E6F6D] outline-none"
            />
          </div>

          {/* Group Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[#8C7E80] font-mono text-[10px] uppercase font-bold shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#9E6F6D]" /> Filter:
            </span>
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
                  selectedGroup === group
                    ? 'bg-[#9E6F6D] text-white shadow-md'
                    : 'bg-[#F2E5E2] text-[#302829] hover:bg-[#E9D3D0] border border-[#D8B5B0]/40'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Selection Toolbar */}
        <div className="flex items-center justify-between bg-[#FAF7F3] p-3 rounded-2xl border border-[#E9D3D0] text-xs">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-[#9E6F6D] font-bold hover:text-[#875B59] transition-colors"
          >
            {selectedIds.size === filteredContacts.length && filteredContacts.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-[#9E6F6D]" />
            ) : (
              <Square className="w-4 h-4 text-[#8C7E80]" />
            )}
            Select All ({filteredContacts.length})
          </button>
          <span className="text-[#8C7E80]">
            Selected: <strong className="text-[#9E6F6D]">{selectedIds.size}</strong> guests
          </span>
        </div>

        {/* Contacts List */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-[#8C7E80] text-xs">Loading Master Contact List...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-[#8C7E80] text-xs">
              No contacts found in Master List. Add contacts in <strong>My Saved Contacts</strong> tab first!
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedIds.has(contact.id);
              return (
                <div
                  key={contact.id}
                  onClick={() => toggleSelect(contact.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#F2E5E2] border-[#9E6F6D] text-[#302829] shadow-sm font-bold'
                      : 'bg-[#FFFDFC] border-[#E9D3D0] hover:bg-[#FAF7F3] text-[#51484A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#9E6F6D] border-[#9E6F6D] text-white' : 'border-[#D8B5B0] bg-[#FFFDFC]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2 text-[#302829]">
                        {contact.name}
                        {contact.group_name && (
                          <span className="px-2 py-0.5 rounded-md bg-[#F2E5E2] text-[#9E6F6D] border border-[#D8B5B0] text-[9px] font-mono font-bold">
                            {contact.group_name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8C7E80] flex items-center gap-2 mt-0.5">
                        <span>{contact.phone || 'No Phone'}</span>
                        {contact.relationship && <span>• {contact.relationship}</span>}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#8C7E80]">ID #{contact.id.slice(0, 6)}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9D3D0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#302829] font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImportSelected}
            disabled={submitting || selectedIds.size === 0}
            className="px-5 py-2.5 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add {selectedIds.size} Selected Guests
          </button>
        </div>

      </div>
    </div>
  );
};
