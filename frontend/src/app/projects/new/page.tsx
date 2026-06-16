// Halaman Tambah Proyek (Gambar 4.18). Hanya manajer.
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { query } from '@/lib/db';
import { FormProyekBaru } from './form-client';

export default async function HalamanTambahProyek() {
  return (
    <Shell judul="Tambah Proyek Baru">
      {async (u) => {
        if (u.role !== 'manager') redirect('/dashboard');
        const klien = (await query<{ id_klien: number; nama_klien: string }>(
          'SELECT id_klien, nama_klien FROM tb_klien ORDER BY nama_klien',
        )).rows;
        return <FormProyekBaru klien={klien} />;
      }}
    </Shell>
  );
}
