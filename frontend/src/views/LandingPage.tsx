import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ---------- SVG Icon Components ----------

function IconCheck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-6 h-6"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-6 h-6"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}

function IconHotel() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-6 h-6"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-5 h-5 shrink-0 mt-0.5"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-5 h-5 shrink-0"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconTwitter() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="w-5 h-5"
    >
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="w-5 h-5"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-5 h-5"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

// ---------- Section: Hero ----------

function HeroSection() {
  const router = useRouter();

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)' }}
      aria-label="Hero section"
    >
      {/* Decorative blurred orbs simulating smart-device ambience */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {/* Top-left sphere */}
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: 320,
            height: 320,
            top: '-80px',
            left: '-80px',
            background: 'radial-gradient(circle, #6366f1, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Bottom-right sphere */}
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: 400,
            height: 400,
            bottom: '-120px',
            right: '-120px',
            background: 'radial-gradient(circle, #ec4899, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Centre glow */}
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: 600,
            height: 600,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #818cf8, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Floating device icons (decorative) */}
        <FloatingDevices />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        {/* Logo mark */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          role="img"
          aria-label="SHI Logo"
        >
          <span className="text-white font-black text-2xl tracking-tight select-none">SHI</span>
        </div>

        <p className="text-gray-400 text-sm tracking-widest uppercase mb-6 font-medium">
          Created by @dianputriiswandi
        </p>

        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight mb-6"
          style={{ letterSpacing: '-0.02em' }}
        >
          HOME TECHNOLOGY
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #ec4899)' }}
          >
            EXPERTS
          </span>
        </h1>

        <p className="text-gray-300 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10">
          Integrated control system of nearly every aspect of your home or business
        </p>

        <button
          onClick={() => router.push('/login')}
          className="px-10 py-3.5 rounded-full font-semibold text-white text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-black hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(90deg, #6366f1, #ec4899)' }}
        >
          Sign In
        </button>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 flex flex-col items-center gap-1 opacity-50" aria-hidden="true">
        <span className="text-gray-400 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gray-400 to-transparent" />
      </div>
    </section>
  );
}

/** Pure decorative floating device silhouettes */
function FloatingDevices() {
  return (
    <>
      {/* Smart speaker top-right */}
      <svg
        aria-hidden="true"
        className="absolute opacity-10 top-16 right-16 w-24 h-24 text-indigo-300"
        style={{ animation: 'floatY 6s ease-in-out infinite' }}
        viewBox="0 0 80 80"
        fill="currentColor"
      >
        <ellipse cx="40" cy="60" rx="28" ry="10" opacity="0.4" />
        <rect x="14" y="20" width="52" height="42" rx="26" />
        <circle cx="40" cy="14" r="8" />
      </svg>
      {/* Smoke detector bottom-left */}
      <svg
        aria-hidden="true"
        className="absolute opacity-10 bottom-32 left-20 w-20 h-20 text-pink-300"
        style={{ animation: 'floatY 8s ease-in-out infinite 2s' }}
        viewBox="0 0 80 80"
        fill="currentColor"
      >
        <circle cx="40" cy="40" r="32" />
        <circle cx="40" cy="40" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="40" cy="40" r="5" />
      </svg>
      {/* Hub orb top-left */}
      <svg
        aria-hidden="true"
        className="absolute opacity-10 top-40 left-12 w-16 h-16 text-purple-300"
        style={{ animation: 'floatY 7s ease-in-out infinite 1s' }}
        viewBox="0 0 64 64"
        fill="currentColor"
      >
        <circle cx="32" cy="32" r="28" />
        <circle cx="32" cy="32" r="10" fill="none" stroke="white" strokeWidth="2" />
      </svg>
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
      `}</style>
    </>
  );
}

// ---------- Section: IoT Info ----------

function IoTSection() {
  return (
    <section
      className="py-24 px-4"
      style={{ background: '#111111' }}
      aria-label="What is IoT section"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: device illustration */}
        <div className="flex justify-center lg:justify-end" aria-hidden="true">
          <div className="relative w-72 h-80">
            {/* Phone mockup */}
            <div
              className="absolute left-0 top-8 w-36 h-64 rounded-3xl flex flex-col items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(160deg, #1e1e2e, #2a2a3e)' }}
            >
              <div className="w-16 h-1.5 bg-gray-600 rounded-full mb-4" />
              <div className="w-20 h-20 rounded-full mb-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}>
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="text-gray-400 text-xs">Smart Home</span>
              <div className="mt-4 space-y-1.5 w-full px-4">
                {[40, 60, 35].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-gray-700" style={{ width: `${w}%`, margin: '0 auto' }} />
                ))}
              </div>
            </div>
            {/* Camera mockup */}
            <div
              className="absolute right-0 top-0 w-32 h-32 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(160deg, #1e2e1e, #2a3e2a)' }}
            >
              <svg className="w-14 h-14 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            {/* Hub circle */}
            <div
              className="absolute right-4 bottom-8 w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #1a1a2e, #2e1a3e)' }}
            >
              <svg className="w-12 h-12 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: text */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight">
            WHAT IS IOT?
            <br />
            <span className="text-gray-400">WHAT ARE THE ADVANTAGES?</span>
          </h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Internet of Things (IoT) adalah ekosistem perangkat fisik yang terhubung melalui internet,
            memungkinkan pengumpulan dan pertukaran data secara otomatis. Teknologi ini menghadirkan
            kontrol penuh atas rumah, kantor, dan properti Anda — kapan saja, di mana saja.
          </p>
          <p className="text-gray-300 leading-relaxed mb-10">
            Dengan IoT, efisiensi energi meningkat drastis, keamanan properti lebih terjamin, dan
            kenyamanan penghuni mencapai level baru. PT Smart Home Inovasi hadir sebagai mitra
            terpercaya dalam perjalanan transformasi digital rumah dan bisnis Anda.
          </p>
          {/* Quote */}
          <blockquote
            className="border-l-4 pl-5 py-1"
            style={{ borderColor: '#6366f1' }}
          >
            <p className="text-gray-200 italic text-lg leading-relaxed mb-3">
              "We continue to teach IoT with successful events."
            </p>
            <footer className="text-gray-500 text-sm font-medium not-italic">
              — Ando Iswandi
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

// ---------- Section: Services ----------

interface ServiceCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

function ServicesSection() {
  const services: ServiceCard[] = [
    {
      icon: <IconCheck />,
      title: 'Smart Home Solution',
      description:
        'Jasa instalasi smart home lengkap meliputi sistem pencahayaan otomatis, kontrol AC, keamanan pintu, pengawasan CCTV, dan integrasi seluruh perangkat dalam satu platform yang mudah dikendalikan.',
      accent: '#6366f1',
    },
    {
      icon: <IconBuilding />,
      title: 'Smart Office Solution',
      description:
        'Jasa instalasi Smart Office meliputi Home City, pemasangan wifi, CCTV, dan fiber optic untuk mendukung efisiensi kerja modern yang terkoneksi dan produktif.',
      accent: '#ec4899',
    },
    {
      icon: <IconHotel />,
      title: 'Smart Hotel Solution',
      description:
        'Jasa instalasi Smart Hotel untuk apartemen, ruang publik, dan properti berpengalaman yang memadukan kenyamanan dengan teknologi terkini untuk pengalaman tamu tak terlupakan.',
      accent: '#8b5cf6',
    },
  ];

  return (
    <section
      className="py-24 px-4 relative overflow-hidden"
      style={{ background: '#f5f5f5' }}
      aria-label="Smart Home Services"
    >
      {/* Decorative blob shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full opacity-30"
          style={{
            width: 500,
            height: 500,
            top: '-150px',
            right: '-150px',
            background: 'radial-gradient(circle, #e0e0ff, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: 400,
            height: 400,
            bottom: '-100px',
            left: '-100px',
            background: 'radial-gradient(circle, #fce7f3, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Smart Home Services
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Solusi terintegrasi untuk hunian dan bisnis modern Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <article
              key={service.title}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-white"
                style={{ background: service.accent }}
                aria-hidden="true"
              >
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm flex-1">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Section: Project Gallery ----------

function GallerySection() {
  const projects = [
    {
      title: 'Smart Lock Door',
      subtitle: 'Sistem kunci pintu otomatis dengan kontrol jarak jauh',
      color: 'from-indigo-600 to-purple-700',
      icon: (
        <svg className="w-16 h-16 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: 'Hydroponic Farm',
      subtitle: 'Sistem pertanian hidroponik terotomasi dengan sensor IoT',
      color: 'from-green-600 to-emerald-700',
      icon: (
        <svg className="w-16 h-16 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22V12M12 12C12 7 7 4 3 6c4 0 6 2 9 6zM12 12c0-5 5-8 9-6-4 0-6 2-9 6z" />
        </svg>
      ),
    },
    {
      title: 'Smart Control Panel',
      subtitle: 'Panel kontrol terpusat untuk manajemen seluruh perangkat',
      color: 'from-pink-600 to-rose-700',
      icon: (
        <svg className="w-16 h-16 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <circle cx="8" cy="10" r="2" />
          <circle cx="12" cy="10" r="2" />
          <circle cx="16" cy="10" r="2" />
        </svg>
      ),
    },
    {
      title: 'Security Camera',
      subtitle: 'Jaringan kamera keamanan 24/7 dengan AI detection',
      color: 'from-blue-600 to-cyan-700',
      icon: (
        <svg className="w-16 h-16 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    },
    {
      title: 'Smart Lighting',
      subtitle: 'Sistem pencahayaan otomatis hemat energi berbasis sensor',
      color: 'from-amber-500 to-orange-600',
      icon: (
        <svg className="w-16 h-16 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="12" y1="1" x2="12" y2="3" />
          <path d="M9 18h6M10 21h4M7 4a8 8 0 1 0 10 0" />
        </svg>
      ),
    },
    {
      title: 'Smart Gateway Hub',
      subtitle: 'Hub sentral penghubung seluruh ekosistem IoT rumah Anda',
      color: 'from-violet-600 to-purple-800',
      icon: (
        <svg className="w-16 h-16 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-24 px-4 bg-white" aria-label="Project Gallery">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Our Project Gallery
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Portofolio instalasi smart home dan IoT yang telah kami selesaikan dengan standar kualitas
            tertinggi di berbagai wilayah Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <article
              key={project.title}
              className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${project.color} aspect-[4/3] flex flex-col items-center justify-center p-6 group cursor-default`}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                {project.icon}
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-white font-bold text-lg">{project.title}</h3>
                <p className="text-white/70 text-sm mt-1 leading-snug">{project.subtitle}</p>
              </div>
              {/* Decorative corner glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.5), transparent 60%)',
                }}
                aria-hidden="true"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Section: Testimonials ----------

interface Testimonial {
  name: string;
  role: string;
  company: string;
  text: string;
  initials: string;
  color: string;
}

function TestimonialsSection() {
  const [active, setActive] = useState(0);

  const testimonials: Testimonial[] = [
    {
      name: 'Garreth Smith',
      role: 'System Analyst',
      company: 'Tech Innovate Corp',
      text:
        'PT Smart Home Inovasi mengubah cara kami mengelola fasilitas kantor. Sistem IoT mereka sangat intuitif dan tim teknisi yang responsif memastikan instalasi berjalan lancar tanpa gangguan operasional.',
      initials: 'GS',
      color: '#6366f1',
    },
    {
      name: 'Garreth Smith',
      role: 'CEO Founder',
      company: 'Commercial Building Co.',
      text:
        'Investasi terbaik yang pernah kami lakukan untuk gedung komersial kami. Penghematan energi mencapai 35% sejak implementasi smart building solution dari SHI. Layanan purna jual mereka pun luar biasa.',
      initials: 'GS',
      color: '#ec4899',
    },
    {
      name: 'Garreth Smith',
      role: 'CEO Founder',
      company: 'Interior Design Studio',
      text:
        'Sebagai desainer interior, saya sangat menghargai bagaimana SHI mengintegrasikan teknologi tanpa mengorbankan estetika. Klien kami sangat puas dengan hasil akhirnya — fungsional sekaligus elegan.',
      initials: 'GS',
      color: '#8b5cf6',
    },
  ];

  return (
    <section
      className="py-24 px-4"
      style={{ background: '#0d0d0d' }}
      aria-label="Testimonials"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">What Our Clients Say</h2>
          <p className="text-gray-500 text-lg">Kepercayaan klien adalah prioritas utama kami</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {testimonials.map((t, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`text-left rounded-2xl p-7 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                active === i
                  ? 'ring-2 ring-offset-2 ring-offset-black scale-[1.02]'
                  : 'opacity-70 hover:opacity-90'
              }`}
              style={{ background: '#1a1a1a' }}
              aria-pressed={active === i}
              aria-label={`Testimonial from ${t.name}, ${t.role}`}
            >
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: t.color }}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                  <p className="text-gray-600 text-xs">{t.company}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">"{t.text}"</p>
            </button>
          ))}
        </div>

        {/* Dot pagination */}
        <div className="flex justify-center gap-2" role="group" aria-label="Testimonial navigation">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              style={{
                width: active === i ? 24 : 8,
                height: 8,
                background: active === i ? '#6366f1' : '#3a3a3a',
              }}
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={active === i ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Section: Contact ----------

function ContactSection() {
  return (
    <section
      className="py-24 px-4"
      style={{ background: '#111111' }}
      aria-label="Contact Us"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-12">Contact Us</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
          {/* Address */}
          <div className="flex gap-3 items-start">
            <span className="text-indigo-400 mt-0.5">
              <IconMapPin />
            </span>
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-widest">Address</p>
              <address className="text-gray-300 text-sm leading-relaxed not-italic">
                Gedung Pixelkamp Lt2, Depok Square, Ruko J,<br />
                Ring Road Utara No.10 Block C, Caturtunggal,<br />
                Kec. Depok, Kabupaten Sleman,<br />
                Daerah Istimewa Yogyakarta 55283
              </address>
            </div>
          </div>

          {/* Contact link */}
          <div className="flex gap-3 items-start">
            <span className="text-pink-400">
              <IconMail />
            </span>
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-widest">Get in Touch</p>
              <a
                href="mailto:info@smarthomeinovasi.id"
                className="text-indigo-400 hover:text-indigo-300 text-sm underline underline-offset-4 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
                aria-label="Send us an email"
              >
                Have a question? Contact us now
              </a>
              <p className="text-gray-500 text-xs mt-1">info@smarthomeinovasi.id</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------

function Footer() {
  return (
    <footer
      className="py-8 px-4 border-t"
      style={{ background: '#0d0d0d', borderColor: '#1f1f1f' }}
      role="contentinfo"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-sm">
          Copyright &copy; 2026 | Built with{' '}
          <span aria-label="love" role="img">
            ❤
          </span>{' '}
          by Dian's Laravel
        </p>

        {/* Social icons */}
        <nav aria-label="Social media links">
          <ul className="flex gap-4 list-none m-0 p-0">
            <li>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
                aria-label="Follow us on Twitter"
              >
                <IconTwitter />
              </a>
            </li>
            <li>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
                aria-label="Follow us on Facebook"
              >
                <IconFacebook />
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
                aria-label="Follow us on Instagram"
              >
                <IconInstagram />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

// ---------- Page Composition ----------

export default function LandingPage() {
  return (
    <div className="font-sans antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>
      <main id="main-content">
        <HeroSection />
        <IoTSection />
        <ServicesSection />
        <GallerySection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
