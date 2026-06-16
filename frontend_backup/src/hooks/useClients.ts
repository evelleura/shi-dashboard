import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, getClient, createClient, updateClient, deleteClient, uploadClientPhoto } from '../services/api';
import { useToast } from './useToast';
import type { CreateClientData } from '../types';

export const CLIENT_KEYS = {
  all: ['clients'] as const,
  detail: (id: number) => ['clients', id] as const,
};

export function useClients() {
  return useQuery({
    queryKey: CLIENT_KEYS.all,
    queryFn: getClients,
    staleTime: 1000 * 60 * 5,
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(id),
    queryFn: () => getClient(id),
    staleTime: 1000 * 60 * 2,
    enabled: id > 0,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: CreateClientData) => createClient(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      toast('Klien baru berhasil ditambahkan');
    },
    onError: () => {
      toast('Gagal menambahkan klien', 'error');
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateClientData> }) => updateClient(id, data),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: CLIENT_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      toast('Data klien berhasil diperbarui');
    },
    onError: () => {
      toast('Gagal memperbarui data klien', 'error');
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      toast('Klien berhasil dihapus');
    },
    onError: () => {
      toast('Gagal menghapus klien', 'error');
    },
  });
}

export function useUploadClientPhoto() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadClientPhoto(id, file),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: CLIENT_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      toast('Foto klien berhasil diunggah');
    },
    onError: () => {
      toast('Gagal mengunggah foto', 'error');
    },
  });
}
