'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return <div style={{ minHeight: '100vh' }} />;

  return (
    <div style={styles.page}>
      {/* Hero */}
      <section style={styles.hero}>
        <nav style={styles.topNav}>
          <div style={styles.brand}>
            <span style={{ fontSize: '1.6rem' }}>🥗</span>
            <span style={styles.brandText}>NWEPP</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/login" className="btn btn-ghost">Masuk</Link>
            <Link href="/register" className="btn btn-primary">Daftar Sekarang</Link>
          </div>
        </nav>

        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>🇮🇩 Platform Nasional Tenaga Kerja Gizi</div>
          <h1 style={styles.heroTitle}>
            Edukasi, Sertifikasi &<br />
            <span style={styles.heroHighlight}>Penempatan Tenaga Gizi</span>
          </h1>
          <p style={styles.heroSub}>
            Platform terpadu untuk melatih, mensertifikasi, dan menempatkan tenaga kerja
            dalam mendukung program <strong>Makan Bergizi Gratis (MBG)</strong> secara nasional.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Mulai Pelatihan →
            </Link>
            <Link href="/certifications" className="btn btn-secondary btn-lg">
              Lihat Sertifikasi
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { value: '30.000+', label: 'Dapur Produksi' },
            { value: '400.000+', label: 'Tenaga Operasional' },
            { value: '30.000+', label: 'Ahli Gizi' },
            { value: '5 Level', label: 'Sertifikasi' },
          ].map((s, i) => (
            <div key={i} style={styles.statItem}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={styles.features}>
        <h2 style={styles.sectionTitle}>Fitur Platform</h2>
        <div style={styles.featureGrid}>
          {[
            { icon: '📚', title: 'Learning Management', desc: '3 jalur pelatihan: Ahli Gizi, Non-Ahli Gizi, dan Manajemen dengan materi lengkap dan terstruktur.' },
            { icon: '🏆', title: 'Sertifikasi Nasional', desc: '5 level sertifikasi dari Nutrition Awareness hingga Regional Director dengan ujian teori & praktik.' },
            { icon: '📊', title: 'Talent Database', desc: 'Database nasional tenaga kerja gizi dengan sistem scoring dan ranking berbasis kompetensi.' },
            { icon: '💼', title: 'Penempatan Kerja', desc: 'Sistem matching otomatis untuk menempatkan kandidat terbaik pada posisi yang sesuai di dapur MBG.' },
            { icon: '🔐', title: 'Verifikasi Sertifikat', desc: 'Sistem verifikasi publik untuk memastikan keaslian sertifikat tenaga kerja.' },
            { icon: '📈', title: 'Monitoring & Analitik', desc: 'Dashboard analitik untuk memantau kinerja pelatihan dan penempatan secara real-time.' },
          ].map((f, i) => (
            <div key={i} className="card" style={styles.featureCard}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks */}
      <section style={styles.tracks}>
        <h2 style={styles.sectionTitle}>Jalur Pelatihan</h2>
        <div style={styles.trackGrid}>
          {[
            { emoji: '🔬', title: 'Track Ahli Gizi', level: 'Advanced', hours: '120 jam', items: ['Perencanaan Menu', 'Perhitungan Nutrisi', 'Audit Gizi', 'Monitoring Status Gizi'], color: '#00b4a3' },
            { emoji: '🍳', title: 'Track Non-Ahli Gizi', level: 'Beginner', hours: '80 jam', items: ['Dasar Gizi', 'Food Safety', 'Operasional Dapur', 'Distribusi Makanan'], color: '#ff9800' },
            { emoji: '📋', title: 'Track Manajemen', level: 'Intermediate', hours: '100 jam', items: ['Manajemen Dapur Besar', 'Supply Chain Pangan', 'Monitoring Program', 'Manajemen Tim'], color: '#3b82f6' },
          ].map((t, i) => (
            <div key={i} className="card" style={{ ...styles.trackCard, borderTop: `4px solid ${t.color}` }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{t.emoji}</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>{t.title}</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className="badge badge-primary">{t.level}</span>
                <span className="badge badge-neutral">{t.hours}</span>
              </div>
              <ul style={styles.trackList}>
                {t.items.map((item, j) => (
                  <li key={j} style={styles.trackItem}>✓ {item}</li>
                ))}
              </ul>
              <Link href="/register" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>
                Mulai Belajar
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Siap Bergabung dengan Tim MBG?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 500, margin: '0 auto 24px', fontSize: '1.05rem' }}>
          Daftar sekarang dan mulai perjalanan karir Anda di bidang gizi nasional.
        </p>
        <Link href="/register" className="btn btn-accent btn-lg">
          Daftar Gratis →
        </Link>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🥗</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>NWEPP</span>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          © 2026 Nutrition Workforce Education & Placement Platform
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh' },
  hero: {
    background: 'linear-gradient(135deg, #f0fffe 0%, #e8f5e9 50%, #fff8e1 100%)',
    padding: '0 5% 60px', /* percentage based padding for responsiveness */
    position: 'relative',
    overflow: 'hidden',
  },
  topNav: {
    maxWidth: 1200, margin: '0 auto', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', padding: '16px 0',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8 },
  brandText: {
    fontSize: '1.2rem', fontWeight: 800,
    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroContent: {
    maxWidth: 1200, margin: '0 auto', paddingTop: 'max(4vh, 24px)', /* dynamic padding */
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  heroBadge: {
    background: 'rgba(0,180,163,0.1)', padding: '8px 20px',
    borderRadius: 999, fontSize: '0.85rem', fontWeight: 600,
    color: 'var(--primary-700)', marginBottom: 24,
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 8vw, 3.5rem)', /* fluid typography */
    fontWeight: 800,
    lineHeight: 1.15, marginBottom: 20, color: 'var(--neutral-900)',
  },
  heroHighlight: {
    background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: 'clamp(1rem, 3vw, 1.15rem)', color: 'var(--text-secondary)',
    maxWidth: 580, marginBottom: 32, lineHeight: 1.7,
  },
  statsRow: {
    maxWidth: 900, margin: '48px auto 0', display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16,
  },
  statItem: {
    background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
    padding: '20px 16px', borderRadius: 'var(--radius-lg)', textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.5)',
  },
  statValue: {
    fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700)',
  },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 },
  features: { maxWidth: 1200, margin: '0 auto', padding: '80px 24px' },
  sectionTitle: {
    textAlign: 'center', fontSize: '1.8rem', fontWeight: 800,
    marginBottom: 40, color: 'var(--neutral-900)',
  },
  featureGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20,
  },
  featureCard: { padding: '28px' },
  featureIcon: { fontSize: '2rem', marginBottom: 12 },
  featureTitle: { fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 },
  featureDesc: { fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 },
  tracks: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px',
  },
  trackGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24,
  },
  trackCard: { padding: '28px' },
  trackList: { listStyle: 'none', padding: 0 },
  trackItem: {
    padding: '6px 0', fontSize: '0.9rem', color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--neutral-100)',
  },
  cta: {
    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
    padding: '64px 24px', textAlign: 'center',
  },
  footer: {
    maxWidth: 1200, margin: '0 auto', padding: '24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 12,
  },
};
