import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword, getTechnicians, getTechnicianDetail, deactivateUser, activateUser } from '../services/api';

export const USER_KEYS = {
  all: ['users'] as const,
  technicians: ['technicians'] as const,
  technicianDetail: (id: number) => ['technicians', id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: USER_KEYS.all,
    queryFn: getUsers,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) => createUser(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; email?: string; role?: string } }) => updateUser(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => resetUserPassword(id, password),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activateUser(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTechnicianList(): ReturnType<typeof useQuery<any[]>> {
  return useQuery({
    queryKey: USER_KEYS.technicians,
    queryFn: getTechnicians,
    staleTime: 1000 * 60 * 2,
  });
}

export function useTechnicianDetail(id: number | null) {
  return useQuery({
    queryKey: USER_KEYS.technicianDetail(id!),
    queryFn: () => getTechnicianDetail(id!),
    enabled: id !== null,
    staleTime: 1000 * 60 * 2,
  });
}
