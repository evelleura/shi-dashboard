'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useClient, useUpdateClient, useDeleteClient, useUploadClientPhoto } from '../hooks/useClients';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import Modal from '../components/ui/Modal';
import MapPreview from '../components/ui/MapPreview';
import EntityActivityTimeline from '../components/ui/EntityActivityTimeline';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Client, CreateClientData } from '../types';
import { resolveGmapsUrl } from '../services/api';

// ── helpers ─────────────────────────────────────────────────────────────────

function avatarColor(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

// ── sub-components ───────────────────────────────────────────────────────────

function parseGmapsLink(link: string): { lat: number | null; lng: number | null } {
  if (!link.trim()) return { lat: null, lng: null };
  const atMatch = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  const placeMatch = link.match(/\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  return { lat: null, lng: null };
}

function isShortened(url: string): boolean {
  return /goo\.gl|maps\.app/i.test(url);
}

function coordsToGmapsLink(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null) return '';
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function useGmapsCoords(gmapsLink: string) {
  const [resolved, setResolved] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [resolving, setResolving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync = parseGmapsLink(gmapsLink);
  const hasSyncCoords = sync.lat !== null;

  useEffect(() => {
    if (!gmapsLink.trim() || hasSyncCoords) {
      setResolved({ lat: null, lng: null });
      return;
    }
    if (!isShortened(gmapsLink)) {
      setResolved({ lat: null, lng: null });
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setResolving(true);
      try {
        const result = await resolveGmapsUrl(gmapsLink.trim());
        setResolved(result.coords ?? { lat: null, lng: null });
      } catch {
        setResolved({ lat: null, lng: null });
      } finally {
        setResolving(false);
      }
    }, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [gmapsLink, hasSyncCoords]);

  const lat = hasSyncCoords ? sync.lat : resolved.lat;
  const lng = hasSyncCoords ? sync.lng : resolved.lng;
  return { lat, lng, resolving };
}

function ClientFormModal({
  open,
  onClose,
  title,
  initialData,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initialData: CreateClientData;
  onSubmit: (data: CreateClientData) => Promise<void>;
  isPending: boolean;
}) {
  const [form, setForm] = useState<CreateClientData>(initialData);
  const [gmapsLink, setGmapsLink] = useState(() => coordsToGmapsLink(initialData.latitude, initialData.longitude));
  const { language } = useLanguage();

  const set = (key: keyof CreateClientData, value: string | number | null) =>
    setForm((p) => ({ ...p, [key]: value }));

  const { lat: coordLat, lng: coordLng, resolving } = useGmapsCoords(gmapsLink);
  const hasValidCoords = coordLat !== null;

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await onSubmit({
      ...form,
      name: form.name.trim(),
      address: form.address?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      latitude: coordLat,
      longitude: coordLng,
    });
  };

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('label.name', language)} *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('client.name_placeholder', language)}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('label.email', language)}
            </label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
              placeholder="klien@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('label.phone', language)}
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+62812xxxx"
                className={inputClass}
              />
              {form.phone?.trim() && (
                <a
                  href={`https://wa.me/${form.phone.trim().replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat via WhatsApp"
                  className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('label.address', language)}
          </label>
          <textarea
            value={form.address ?? ''}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            placeholder={t('client.address_placeholder', language)}
            className={`${inputClass} resize-none`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Link Google Maps
          </label>
          <div className="flex gap-1.5">
            <input
              type="url"
              value={gmapsLink}
              onChange={(e) => setGmapsLink(e.target.value)}
              placeholder="https://maps.google.com/..."
              className={inputClass}
            />
            {gmapsLink.trim() && (
              <a
                href={gmapsLink.trim()}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka di Google Maps"
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </a>
            )}
          </div>
          {gmapsLink.trim() && (
            <p className={`text-xs mt-1 ${resolving ? 'text-gray-400 dark:text-gray-500' : hasValidCoords ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {resolving
                ? '⏳ Memuat koordinat dari link...'
                : hasValidCoords
                  ? `✓ Koordinat terdeteksi: ${coordLat?.toFixed(5)}, ${coordLng?.toFixed(5)}`
                  : '⚠ Koordinat tidak terdeteksi dari link ini'}
            </p>
          )}
          {hasValidCoords && coordLat !== null && coordLng !== null && (
            <div className="mt-2">
              <MapPreview lat={coordLat} lng={coordLng} height="200px" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('label.notes', language)}
          </label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            placeholder={t('client.notes_placeholder', language)}
            className={`${inputClass} resize-none`}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('action.cancel', language)}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {isPending ? t('action.saving', language) : t('action.save', language)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── client project row ───────────────────────────────────────────────────────

interface ClientProject {
  id: number;
  name: string;
  status: string;
  phase: string;
  start_date?: string;
  end_date?: string;
  project_value?: number;
  spi_value?: number | null;
  health_status?: string | null;
}

function healthDot(health: string | null | undefined): string {
  if (health === 'green') return 'bg-green-500';
  if (health === 'amber') return 'bg-amber-500';
  if (health === 'red') return 'bg-red-500';
  return 'bg-gray-400';
}

function statusBadgeClass(status: string): string {
  if (status === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'completed') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (status === 'on-hold') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
}

// ── main page ────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params?.slug) ? params.slug[1] : (params?.id as string | undefined);
  const clientId = rawId ? parseInt(rawId, 10) : 0;

  const { user } = useAuth();
  const { language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const { data: client, isLoading, isError } = useClient(clientId);
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const uploadPhotoMutation = useUploadClientPhoto();

  const [activeTab, setActiveTab] = useState<'projects' | 'history'>('projects');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = async (data: CreateClientData) => {
    await updateMutation.mutateAsync({ id: clientId, data });
    setShowEdit(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(clientId);
    router.push('/clients');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPhotoMutation.mutateAsync({ id: clientId, file });
  };

  // ── loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Gagal memuat data klien.</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 dark:text-blue-400 text-sm hover:underline">
          ← Kembali
        </button>
      </div>
    );
  }

  const clientWithProjects = client as Client & { projects?: ClientProject[] };
  const projects: ClientProject[] = clientWithProjects.projects ?? [];
  const hasCoords = client.latitude != null && client.longitude != null;

  const tabs = [
    { id: 'projects' as const, label: `Proyek (${projects.length})` },
    ...(isAdmin ? [{ id: 'history' as const, label: 'Riwayat' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline shrink-0 mt-1"
          >
            ← Kembali
          </button>

          {/* Avatar / photo */}
          <div className="shrink-0 relative group">
            {client.photo_path ? (
              <img
                src={client.photo_path}
                alt={client.name}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold ${avatarColor(client.name)}`}
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
            )}
            {isManager && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
                className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
              >
                {uploadPhotoMutation.isPending ? '...' : t('client.upload_photo', language)}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {projects.length} {t('project.title', language)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {isManager && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('action.edit', language)}
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowDelete(true)}
                className="border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {t('action.delete', language)}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Info Card ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Informasi Kontak</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Email */}
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('label.email', language)}</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{client.email ?? '--'}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('label.phone', language)}</p>
              {client.phone ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{client.phone}</p>
                  <a
                    href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat via WhatsApp"
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-green-600 dark:fill-green-400 shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">WhatsApp</span>
                  </a>
                </div>
              ) : (
                <p className="text-sm text-gray-800 dark:text-gray-200">--</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 sm:col-span-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('label.address', language)}</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{client.address ?? '--'}</p>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="flex items-start gap-2 sm:col-span-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('label.notes', language)}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 italic">{client.notes}</p>
              </div>
            </div>
          )}

          {/* Coordinates */}
          {hasCoords && (
            <div className="flex items-start gap-2 sm:col-span-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Koordinat</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {Number(client.latitude).toFixed(6)}, {Number(client.longitude).toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block"
                >
                  Buka di Google Maps
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        {hasCoords && (
          <div className="mt-4">
            <MapPreview lat={Number(client.latitude)} lng={Number(client.longitude)} height="200px" />
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 -mb-px" role="tablist" aria-label="Client detail tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Projects ──────────────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div role="tabpanel">
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">
              Belum ada proyek untuk klien ini.
            </p>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Nama Proyek
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Kesehatan
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Fase
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Tanggal
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Nilai
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        SPI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                          idx === projects.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push('/projects/' + p.id)}
                            className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-left"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(p.status)}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${healthDot(p.health_status)}`} />
                            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                              {p.health_status ?? '--'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{p.phase}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {p.start_date
                              ? new Date(p.start_date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
                              : '--'}
                            {' → '}
                            {p.end_date
                              ? new Date(p.end_date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
                              : '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {p.project_value != null ? formatRupiah(p.project_value) : '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`text-xs font-semibold ${
                              p.spi_value == null
                                ? 'text-gray-400'
                                : p.spi_value >= 0.95
                                ? 'text-green-600 dark:text-green-400'
                                : p.spi_value >= 0.85
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {p.spi_value != null ? p.spi_value.toFixed(2) : '--'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: History (admin only) ──────────────────────────────────────── */}
      {activeTab === 'history' && isAdmin && (
        <div role="tabpanel">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Riwayat Perubahan</h2>
            <EntityActivityTimeline entityType="client" entityId={clientId} />
          </div>
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {showEdit && (
        <ClientFormModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          title={`${t('action.edit', language)}: ${client.name}`}
          initialData={{
            name: client.name,
            address: client.address ?? '',
            phone: client.phone ?? '',
            email: client.email ?? '',
            notes: client.notes ?? '',
            latitude: client.latitude ?? null,
            longitude: client.longitude ?? null,
          }}
          onSubmit={handleEdit}
          isPending={updateMutation.isPending}
        />
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title={t('client.delete_title', language)}
        message={t('client.delete_message', language)}
        confirmLabel={t('action.delete', language)}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
