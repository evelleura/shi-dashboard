interface SHILogoProps {
  /** Tinggi logo dalam px; lebar mengikuti rasio asli. Default 64. */
  size?: number;
  /**
   * Mode kotak: render `logo-white.jpeg` (tile 1:1 -- ikon SHI putih di atas
   * gradien biru-ungu, ber-margin putih) sebagai bujur sangkar `size x size`.
   * Untuk slot ikon persegi -- mis. brand navbar dashboard. Logo lebar default
   * (`logo.png`) kalau dijejalkan ke slot kecil bikin tulisan "SHI" hilang;
   * varian tile tetap terbaca. CATATAN: tile punya margin putih, jadi taruh di
   * atas alas putih (kotak `bg-white`) supaya margin menyatu, bukan langsung di
   * atas bg gelap/warna (nanti muncul kotak putih). Default false = logo lebar.
   */
  square?: boolean;
  /** Kelas tambahan (mis. margin). */
  className?: string;
}

/**
 * Logo PT Smart Home Inovasi. File statis di `public/` (path absolut -> selalu
 * ke-load di route mana pun): `logo.png` (wordmark biru lebar di atas transparan
 * -> pakai di alas terang, default) dan `logo-white.jpeg` (tile kotak, via prop
 * `square` -> untuk slot ikon persegi beralas putih). `size` WAJIB dipakai
 * supaya tidak render ukuran asli (raksasa).
 */
export default function SHILogo({ size = 64, square = false, className = '' }: SHILogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={square ? '/logo-white.jpeg' : '/logo.png'}
      alt="SHI - Smart Home Inovasi"
      height={size}
      width={square ? size : undefined}
      style={{ height: size, width: square ? size : 'auto' }}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
}
