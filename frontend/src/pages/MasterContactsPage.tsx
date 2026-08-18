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
  Plus,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { MasterContact, MasterContactCreate } from '../types/masterContact';
import {
  Button,
  Input,
  Select,
  Card,
  Badge,
  Modal,
  PageHeader,
  EmptyState,
  Skeleton,
} from '../components/ui';

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

  const handleSyncMobileContacts = async () => {
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      alert('Native mobile address book API is available on supported mobile browsers. Use Excel or manual add fallback.');
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
        setStatusNotice('Contact updated successfully!');
      } else {
        await apiFetch('/master-contacts', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setStatusNotice('New contact added to your address book!');
      }
      setTimeout(() => setStatusNotice(null), 3000);
      setIsAddModalOpen(false);
      setEditingContact(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        group_name: 'General',
        relationship: 'Guest',
        notes: '',
      });
      fetchContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to save contact');
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from your saved contacts?`)) return;
    try {
      await apiFetch(`/master-contacts/${id}`, { method: 'DELETE' });
      fetchContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact');
    }
  };

  const openEditModal = (c: MasterContact) => {
    setEditingContact(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      group_name: c.group_name || 'General',
      relationship: c.relationship || 'Guest',
      notes: c.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Unique groups
  const groups = ['ALL', ...Array.from(new Set(contacts.map((c) => c.group_name || 'General')))];

  // Filtered contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesGroup = selectedGroup === 'ALL' || (c.group_name || 'General') === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      {statusNotice && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-xs shadow-xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Guest Contacts Directory"
        subtitle="Manage your saved family, friends, and VIP guests across all celebrations"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleSyncMobileContacts}
              isLoading={syncingMobile}
              variant="secondary"
              size="md"
              leftIcon={<Smartphone className="w-4 h-4 text-wine" />}
            >
              Sync Phone Contacts
            </Button>
            <Button
              onClick={() => {
                setEditingContact(null);
                setFormData({
                  name: '',
                  phone: '',
                  email: '',
                  group_name: 'General',
                  relationship: 'Guest',
                  notes: '',
                });
                setIsAddModalOpen(true);
              }}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4 text-gold" />}
            >
              Add Contact
            </Button>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <Card variant="default" className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-canvas border border-charcoal-200 text-charcoal-900 text-xs focus:outline-none focus:border-wine"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            {groups.map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGroup === grp
                    ? 'bg-wine text-white shadow-xs'
                    : 'bg-canvas text-charcoal-600 hover:bg-surface-subtle border border-charcoal-200/60'
                }`}
              >
                {grp === 'ALL' ? `All (${contacts.length})` : grp}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Contact Cards Grid / Table */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} variant="card" height={140} />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-wine" />}
          title={search ? 'No matching contacts found' : 'Your contact book is empty'}
          description={
            search
              ? 'Try changing your search query or group filter.'
              : 'Add guests to your master contact book to easily reuse them in future celebrations.'
          }
          actionLabel={search ? undefined : 'Add First Contact'}
          onAction={search ? undefined : () => setIsAddModalOpen(true)}
          actionIcon={<Plus className="w-4 h-4 text-gold" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((c) => (
            <Card
              key={c.id}
              variant="default"
              hoverable
              className="p-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-base font-bold text-charcoal-900 line-clamp-1">
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="neutral" size="sm">
                        {c.group_name || 'General'}
                      </Badge>
                      {c.relationship && (
                        <span className="text-[11px] text-charcoal-500">• {c.relationship}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg text-charcoal-400 hover:text-wine hover:bg-canvas transition-colors"
                      title="Edit contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(c.id, c.name)}
                      className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-charcoal-600 pt-1">
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingContact(null);
        }}
        title={editingContact ? 'Edit Contact' : 'Add New Contact'}
        description="Saved contacts can be selected in 1 click across any celebration"
      >
        <form onSubmit={handleSaveContact} className="space-y-3.5">
          <Input
            label="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ananya Sharma"
          />

          <Input
            label="Phone / WhatsApp"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ananya@example.com"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Group / Circle"
              value={formData.group_name || ''}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              placeholder="e.g. Family, College"
            />
            <Input
              label="Relationship"
              value={formData.relationship || ''}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              placeholder="e.g. Cousin, Colleague"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              {editingContact ? 'Update Contact' : 'Save Contact'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
