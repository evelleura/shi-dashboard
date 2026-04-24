import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

function SHILogo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="60" cy="60" r="56" stroke="url(#logo-gradient)" strokeWidth="3" fill="none" opacity="0.3" />
      {/* Inner hexagon shape */}
      <path
        d="M60 12L102 36V84L60 108L18 84V36L60 12Z"
        fill="url(#logo-gradient)"
        opacity="0.1"
      />
      <path
        d="M60 12L102 36V84L60 108L18 84V36L60 12Z"
        stroke="url(#logo-gradient)"
        strokeWidth="2"
        fill="none"
      />
      {/* House/home icon inside */}
      <path
        d="M60 35L82 52V78C82 79.1 81.1 80 80 80H68V66C68 64.9 67.1 64 66 64H54C52.9 64 52 64.9 52 66V80H40C38.9 80 38 79.1 38 78V52L60 35Z"
        fill="url(#logo-gradient)"
      />
      {/* Signal waves (IoT/smart) */}
      <path d="M72 42C76 45 78 50 78 55" stroke="url(#logo-gradient)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M76 38C82 42 85 49 85 57" stroke="url(#logo-gradient)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FloatingParticle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <div
      className="absolute rounded-full bg-blue-400/20 dark:bg-blue-400/10 animate-pulse"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${3 + delay}s`,
      }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(form.email, form.password);
      if (user.role === "manager" || user.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/my-dashboard");
      }
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 flex-col items-center justify-center p-12 text-white">
        {/* Background particles */}
        <FloatingParticle delay={0} x={10} y={20} size={80} />
        <FloatingParticle delay={1.5} x={75} y={10} size={120} />
        <FloatingParticle delay={0.8} x={60} y={70} size={60} />
        <FloatingParticle delay={2} x={20} y={80} size={100} />
        <FloatingParticle delay={0.5} x={85} y={50} size={40} />
        <FloatingParticle delay={1} x={40} y={40} size={90} />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-white/20 rounded-full scale-150" />
              <SHILogo size={100} />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-3 tracking-tight">
            Smart Home<br />
            <span className="text-blue-200 dark:text-blue-300">Inovasi</span>
          </h1>

          <div className="w-12 h-1 bg-blue-300/60 rounded-full mx-auto mb-6" />

          <p className="text-blue-100/80 dark:text-blue-200/60 text-sm leading-relaxed mb-8">
            Project Management Dashboard dengan monitoring proyek real-time,
            Schedule Performance Index (SPI), dan Early Warning System untuk
            pengelolaan proyek smart home yang efisien.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Real-time SPI', 'Kanban Board', '8 Chart Types', 'EWS Alert'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="absolute bottom-6 text-center">
          <p className="text-blue-200/40 text-xs">
            PT Smart Home Inovasi Yogyakarta
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 sm:p-8 relative">
        {/* Subtle corner decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 dark:from-blue-950/30 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-50 dark:from-indigo-950/20 to-transparent rounded-tr-full" />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <SHILogo size={72} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-3">SHI Dashboard</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">PT Smart Home Inovasi</p>
          </div>

          {/* Welcome text (desktop) */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Welcome back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Sign in to your dashboard account
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                focused === 'email'
                  ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder="name@shi.co.id"
                  className="w-full bg-transparent rounded-xl pl-10 pr-3 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                focused === 'password'
                  ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-transparent rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full relative overflow-hidden font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 ${
                loading
                  ? 'bg-blue-400 dark:bg-blue-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
              } text-white`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className="text-center text-xs text-gray-400 dark:text-gray-600">
              Tugas Akhir &middot; Dian Putri Iswandi &middot; 5220311118
            </p>
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-1">
              Universitas Teknologi Yogyakarta &middot; 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
