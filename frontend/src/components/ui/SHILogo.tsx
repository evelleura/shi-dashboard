interface SHILogoProps {
  /** Tinggi logo dalam px; lebar mengikuti rasio asli. Default 64. */
  size?: number;
  /**
   * Mode kotak: render `logo-square.jpeg` (komposisi 1:1) sebagai bujur sangkar
   * `size x size`. Dipakai untuk slot ikon sempit/persegi -- mis. brand di
   * navbar dashboard. Logo lebar default (`logo.png`) kalau dijejalkan ke slot
   * kecil/bulat bikin tulisan "SHI" hilang; varian kotak tetap menampilkannya.
   * Default false = logo lebar.
   */
  square?: boolean;
  /** Kelas tambahan (mis. margin). */
  className?: string;
}

/**
 * Logo PT Smart Home Inovasi. File statis di `public/` (path absolut -> selalu
 * ke-load di route mana pun): `logo.png` (lebar, default) dan `logo-square.jpeg`
 * (kotak 1:1, via prop `square`). `size` WAJIB dipakai supaya tidak render
 * ukuran asli (raksasa). Dipakai konsisten di navbar semua halaman, hero login,
 * dan landing.
 */
export default function SHILogo({ size = 64, square = false, className = '' }: SHILogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={square ? '/logo-square.jpeg' : '/logo.png'}
      alt="SHI - Smart Home Inovasi"
      height={size}
      width={square ? size : undefined}
      style={{ height: size, width: square ? size : 'auto' }}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
}
