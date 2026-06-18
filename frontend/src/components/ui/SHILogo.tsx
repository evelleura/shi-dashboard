interface SHILogoProps {
  /** Tinggi logo dalam px; lebar mengikuti rasio asli. Default 64. */
  size?: number;
  /** Kelas tambahan (mis. margin). */
  className?: string;
}

/**
 * Logo PT Smart Home Inovasi. File statis di `public/logo.png` (path absolut
 * `/logo.png` -> selalu ke-load di route mana pun). `size` WAJIB dipakai supaya
 * tidak render ukuran asli (raksasa). Dipakai konsisten di navbar semua halaman,
 * hero login, dan landing.
 */
export default function SHILogo({ size = 64, className = '' }: SHILogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="SHI - Smart Home Inovasi"
      height={size}
      style={{ height: size, width: 'auto' }}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
}
