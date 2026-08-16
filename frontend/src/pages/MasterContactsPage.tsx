import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { MasterContact, MasterContactCreate } from '../types/masterContact';

export const MasterContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<MasterContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<MasterContact | null>(null);
  const [syncingMobile, setSyncingMobile] = useState(false);

  // Form fields
  const [formData, setFormData] = useState<MasterContactCreate>({
    name: '',
    phone: '',
    email: '',
    group_name: 'General',
    relationship: 'Guest',
    notes: '',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
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

  // Mobile contacts picker fallback
  const handleSyncMobileContacts = async () => {
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      alert('Native mobile address book API is available on supported mobile browsers. Use VCF file import fallback in event guest page.');
      return;
    }
    setSyncingMobile(true);
    try {
      const props = ['name', 'tel', 'email'];
      const selectedContacts: any = await (navigator as any).contacts.select(props, { multiple: true });
      if (selectedContacts && selectedContacts.length > 0) {
        const payload = selectedContacts.map((c: any) => ({
          name: (c.name && c.name[0]) || 'Mobile Contact',
          phone: (c.tel && c.tel[0]) || null,
          email: (c.email && c.email[0]) || null,
          group_name: 'Mobile Sync',
          relationship: 'Guest',
        }));

        await apiFetch('/master-contacts/bulk', {
          method: 'POST',
          body: JSON.stringify({ contacts: payload }),
        });
        setStatusNotice(`✨ Successfully imported ${payload.length} contacts!`);
        setTimeout(() => setStatusNotice(null), 3500);
        fetchContacts();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to sync mobile contacts');
    } finally {
      setSyncingMobile(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingContact) {
        await apiFetch(`/master-contacts/${editingContact.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setStatusNotice(`Contact '${formData.name}' updated!`);
      } else {
        await apiFetch('/master-contacts', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setStatusNotice(`Contact '${formData.name}' saved!`);
      }

      setTimeout(() => setStatusNotice(null), 3500);
      setIsAddModalOpen(false);
      setEditingContact(null);
      setFormData({ name: '', phone: '', email: '', group_name: 'General', relationship: 'Guest', notes: '' });
      fetchContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to save contact');
    }
  };

  const handleDeleteContact = async (contact: MasterContact) => {
    if (!window.confirm(`Are you sure you want to remove '${contact.name}'?\n\nNote: Historical records for completed events will remain intact.`)) {
      return;
    }
    try {
      await apiFetch(`/master-contacts/${contact.id}`, { method: 'DELETE' });
      setStatusNotice(`Contact '${contact.name}' removed.`);
      setTimeout(() => setStatusNotice(null), 3500);
      fetchContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact');
    }
  };

  const groups = ['ALL', ...Array.from(new Set(contacts.map((c) => c.group_name || 'General')))];

  const filteredContacts = contacts.filter((c) => {
    const matchesGroup = selectedGroup === 'ALL' || (c.group_name || 'General') === selectedGroup;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.relationship && c.relationship.toLowerCase().includes(q)) ||
      (c.group_name && c.group_name.toLowerCase().includes(q));
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#302829]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-xs font-mono font-bold uppercase border border-[#D8B5B0] mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9AA78]" /> Saved Celebration Contacts
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold gold-gradient-text">
            My Saved Contacts
          </h1>
          <p className="text-xs text-[#8C7E80] mt-1 max-w-xl">
            Your personal guest directory. Save once, invite to any celebration with 1 tap.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSyncMobileContacts}
            disabled={syncingMobile}
            className="px-4 py-2.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-black border border-[#D8B5B0] text-xs font-extrabold transition-all flex items-center gap-2"
          >
            <Smartphone className={`w-4 h-4 text-black ${syncingMobile ? 'animate-spin' : ''}`} />
            {syncingMobile ? 'Importing...' : 'Import Phone Contacts'}
          </button>

          <button
            onClick={() => {
              setEditingContact(null);
              setFormData({ name: '', phone: '', email: '', group_name: 'General', relationship: 'Guest', notes: '' });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Saved Contact
          </button>
        </div>
      </div>

      {/* STATS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-[#9E6F6D] font-bold block">Total Saved Contacts</span>
          <div className="text-2xl font-serif font-bold text-[#302829]">{contacts.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">Phone Contacts</span>
          <div className="text-2xl font-serif font-bold text-emerald-800">
            {contacts.filter((c) => c.source === 'MOBILE_SYNC').length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-[#704E4D] font-bold block">Contact Groups</span>
          <div className="text-2xl font-serif font-bold text-[#302829]">{groups.length - 1}</div>
        </div>
      </div>

      {/* Status Notification */}
      {statusNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          {statusNotice}
        </div>
      )}

      {/* SEARCH & GROUP FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-[#9E6F6D] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search saved contacts by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFDFC] border border-[#E9D3D0] text-[#302829] text-xs placeholder:text-[#8C7E80] focus:outline-none focus:border-[#9E6F6D] transition-all shadow-sm"
          />
        </div>

        {/* Group Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-[#8C7E80] shrink-0" />
          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGroup === grp
                  ? 'bg-[#9E6F6D] text-white font-bold shadow-md'
                  : 'bg-[#F2E5E2] text-[#302829] border border-[#D8B5B0]/40 hover:bg-[#E9D3D0]'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* CONTACTS TABLE / LIST */}
      <div className="rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-[#8C7E80] text-sm">Loading Saved Contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Users className="w-12 h-12 text-[#D8B5B0] mx-auto" />
            <h3 className="text-base font-bold text-[#302829]">No Saved Contacts Found</h3>
            <p className="text-xs text-[#8C7E80] max-w-sm mx-auto">
              Tap "Import Phone Contacts" to bring in your mobile contacts, or click "Add Saved Contact" to build your directory.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F3] border-b border-[#E9D3D0] text-[11px] font-mono text-[#9E6F6D] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Contact Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Group</th>
                  <th className="py-3.5 px-4">Relationship</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9D3D0]/60 text-xs">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-[#FAF7F3] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#302829]">
                      {contact.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#51484A] font-mono">
                      {contact.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#8C7E80]">
                      {contact.email || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#F2E5E2] text-[#9E6F6D] border border-[#D8B5B0] font-semibold">
                        {contact.group_name || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#51484A]">
                      {contact.relationship || 'Guest'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono text-[#8C7E80] uppercase">
                        {contact.source === 'MOBILE_SYNC' ? '📱 Phone Sync' : '✏️ Manual'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingContact(contact);
                          setFormData({
                            name: contact.name,
                            phone: contact.phone || '',
                            email: contact.email || '',
                            group_name: contact.group_name || 'General',
                            relationship: contact.relationship || 'Guest',
                            notes: contact.notes || '',
                          });
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#F2E5E2] text-[#9E6F6D] transition-colors"
                        title="Edit Contact"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteContact(contact)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT CONTACT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-md w-full p-6 text-[#302829] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9D3D0]">
              <h3 className="text-base font-bold font-serif gold-gradient-text">
                {editingContact ? 'Edit Saved Contact' : 'Add Saved Contact'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-[#8C7E80] hover:text-[#302829]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#9E6F6D] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9E6F6D] mb-1">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9E6F6D] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@gmail.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#9E6F6D] mb-1">Group / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Family, VIP, College Friends"
                    value={formData.group_name || ''}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#9E6F6D] mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Uncle, Friend, Colleague"
                    value={formData.relationship || ''}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9D3D0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F2E5E2] text-[#302829] font-bold text-xs hover:bg-[#E9D3D0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9E6F6D] text-white font-bold text-xs shadow-md hover:bg-[#875B59]"
                >
                  {editingContact ? 'Save Changes' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
