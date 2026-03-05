'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

const levelColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const levelIcons = ['🌱', '🍳', '👨‍🍳', '📊', '🏛️'];

export default function CertificationsPage() {
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getCertifications().then(r => {
            if (r?.success) setLevels(r.data || []);
            setLoading(false);
        });
    }, []);

    return (
        <>
            <Navbar />
            <main style={styles.main}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Sertifikasi Nasional</h1>
                    <p style={styles.subtitle}>5 level sertifikasi untuk standarisasi kompetensi tenaga kerja gizi</p>
                </div>

                {/* Journey */}
                <div style={styles.journey}>
                    {[1, 2, 3, 4, 5].map(l => (
                        <div key={l} style={styles.journeyStep}>
                            <div style={{ ...styles.journeyDot, background: levelColors[l - 1] }}>{l}</div>
                            {l < 5 && <div style={styles.journeyLine} />}
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {levels.map((lvl, i) => (
                            <div key={lvl.id} className="card animate-fadeIn"
                                style={{ borderLeft: `4px solid ${levelColors[i] || '#6366f1'}`, padding: '24px 28px', animationDelay: `${i * 100}ms` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                        <span style={{ fontSize: '2rem' }}>{levelIcons[i] || '📋'}</span>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span className="badge" style={{ background: `${levelColors[i]}20`, color: levelColors[i] }}>
                                                    Level {lvl.level}
                                                </span>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{lvl.name}</h3>
                                            </div>
                                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 500 }}>
                                                {lvl.description}
                                            </p>
                                            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                                                <div style={styles.infoItem}>
                                                    <span style={styles.infoLabel}>Passing Score</span>
                                                    <span style={styles.infoValue}>{lvl.passing_score}%</span>
                                                </div>
                                                <div style={styles.infoItem}>
                                                    <span style={styles.infoLabel}>Masa Berlaku</span>
                                                    <span style={styles.infoValue}>{lvl.validity_months} bulan</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-sm">Ikuti Ujian</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Scoring Formula */}
                <section style={{ marginTop: 40 }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>Formula Skor Kandidat</h2>
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                            {[
                                { label: 'Ujian Teori', weight: '40%', color: 'var(--primary-500)', icon: '📝' },
                                { label: 'Penilaian Praktik', weight: '30%', color: 'var(--accent-500)', icon: '🔧' },
                                { label: 'Pengalaman', weight: '20%', color: 'var(--info)', icon: '💼' },
                                { label: 'Soft Skills', weight: '10%', color: '#8b5cf6', icon: '🤝' },
                            ].map((s, i) => (
                                <div key={i} style={{ textAlign: 'center', padding: 16 }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{s.icon}</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.weight}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

const styles = {
    main: { maxWidth: 900, margin: '0 auto', padding: '24px' },
    header: { marginBottom: 24 },
    title: { fontSize: '1.5rem', fontWeight: 800 },
    subtitle: { color: 'var(--text-secondary)', marginTop: 4 },
    journey: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, flexWrap: 'wrap', gap: 0,
    },
    journeyStep: { display: 'flex', alignItems: 'center' },
    journeyDot: {
        width: 36, height: 36, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'white',
        fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
    },
    journeyLine: {
        width: 60, height: 3, background: 'var(--neutral-200)', margin: '0 4px',
    },
    infoItem: { display: 'flex', flexDirection: 'column', gap: 2 },
    infoLabel: { fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    infoValue: { fontSize: '0.9rem', fontWeight: 600 },
};
