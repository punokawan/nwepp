'use client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [progress, setProgress] = useState([]);
    const [certs, setCerts] = useState([]);

    useEffect(() => {
        if (!loading && !user) { router.push('/login'); return; }
        if (user) {
            api.getMyProgress().then(r => { if (r?.success) setProgress(r.data || []); });
            api.getMyCertificates().then(r => { if (r?.success) setCerts(r.data || []); });
        }
    }, [user, loading, router]);

    if (loading || !user) return <div style={{ minHeight: '100vh' }} />;

    const stats = [
        { icon: '📚', value: progress.length || 0, label: 'Track Aktif', color: 'var(--primary-500)' },
        { icon: '✅', value: progress.reduce((a, p) => a + (p.completed_count || 0), 0), label: 'Lesson Selesai', color: 'var(--success)' },
        { icon: '🏆', value: certs.length, label: 'Sertifikat', color: 'var(--accent-500)' },
        { icon: '📊', value: progress.length > 0 ? Math.round(progress.reduce((a, p) => a + (p.percentage || 0), 0) / progress.length) + '%' : '0%', label: 'Rata-rata Progress', color: 'var(--info)' },
    ];

    return (
        <>
            <Navbar />
            <main style={styles.main}>
                <div style={styles.welcome}>
                    <div>
                        <h1 style={styles.title}>Selamat Datang, {user.full_name}! 👋</h1>
                        <p style={styles.subtitle}>Lanjutkan perjalanan pelatihan dan sertifikasi Anda</p>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                        {user.role === 'candidate' ? 'Kandidat' : user.role}
                    </span>
                </div>

                <div style={styles.statsGrid}>
                    {stats.map((s, i) => (
                        <div key={i} className="stats-card animate-fadeIn" style={{ animationDelay: `${i * 80}ms` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
                                <div>
                                    <div className="stats-value">{s.value}</div>
                                    <div className="stats-label">{s.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress Section */}
                <section style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Progress Pelatihan</h2>
                        <Link href="/tracks" className="btn btn-secondary btn-sm">Lihat Semua Track</Link>
                    </div>
                    {progress.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {progress.map((p, i) => (
                                <div key={i} className="card" style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Track ID: {p.track_id?.slice(0, 8)}...</span>
                                        <span className="badge badge-primary">{Math.round(p.percentage || 0)}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${p.percentage || 0}%` }} />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
                                        {p.completed_count || 0} / {p.total_lessons || 0} lesson selesai
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <p style={{ fontSize: '2rem', marginBottom: 8 }}>📚</p>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>Belum ada progress</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                                Mulai pelatihan pertama Anda sekarang
                            </p>
                            <Link href="/tracks" className="btn btn-primary">Mulai Belajar</Link>
                        </div>
                    )}
                </section>

                {/* Certificates Section */}
                <section style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Sertifikat Saya</h2>
                        <Link href="/certifications" className="btn btn-secondary btn-sm">Lihat Sertifikasi</Link>
                    </div>
                    {certs.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {certs.map((c, i) => (
                                <div key={i} className="card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.level_name || `Level ${c.level}`}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                No: {c.certificate_no}
                                            </div>
                                        </div>
                                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            {c.status === 'active' ? 'Aktif' : c.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <p style={{ fontSize: '2rem', marginBottom: 8 }}>🏆</p>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>Belum ada sertifikat</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                                Selesaikan pelatihan dan ujian untuk mendapatkan sertifikat
                            </p>
                            <Link href="/certifications" className="btn btn-primary">Lihat Sertifikasi</Link>
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Aksi Cepat</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        {[
                            { href: '/tracks', icon: '📚', label: 'Mulai Pelatihan', desc: 'Pilih jalur pelatihan' },
                            { href: '/certifications', icon: '📝', label: 'Ikuti Ujian', desc: 'Ujian sertifikasi' },
                            { href: '/positions', icon: '💼', label: 'Lihat Lowongan', desc: 'Posisi tersedia' },
                            { href: '/profile', icon: '👤', label: 'Edit Profil', desc: 'Perbarui data diri' },
                        ].map((a, i) => (
                            <Link key={i} href={a.href} className="card" style={{ textAlign: 'center', padding: 20, textDecoration: 'none' }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{a.icon}</div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.label}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{a.desc}</div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}

const styles = {
    main: { maxWidth: 1080, margin: '0 auto', padding: '24px' },
    welcome: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
    },
    title: { fontSize: '1.5rem', fontWeight: 800 },
    subtitle: { color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 2 },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 32,
    },
    section: { marginBottom: 32 },
    sectionHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    sectionTitle: { fontSize: '1.15rem', fontWeight: 700 },
};
