'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import Link from 'next/link';

const trackMeta = {
    'ahli-gizi': { emoji: '🔬', color: '#00b4a3' },
    'non-ahli-gizi': { emoji: '🍳', color: '#ff9800' },
    'manajemen': { emoji: '📋', color: '#3b82f6' },
};

export default function TracksPage() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getTracks().then(r => {
            if (r?.success) setTracks(r.data || []);
            setLoading(false);
        });
    }, []);

    return (
        <>
            <Navbar />
            <main style={styles.main}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Jalur Pelatihan</h1>
                    <p style={styles.subtitle}>Pilih jalur pelatihan yang sesuai dengan karir Anda</p>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />)}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                        {tracks.map(track => {
                            const meta = trackMeta[track.slug] || { emoji: '📖', color: '#6366f1' };
                            return (
                                <div key={track.id} className="card animate-fadeIn" style={{ borderTop: `4px solid ${meta.color}` }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{meta.emoji}</div>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{track.name}</h2>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                                        {track.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                        {track.level && <span className="badge badge-primary">{track.level}</span>}
                                        {track.estimated_hours && <span className="badge badge-neutral">{track.estimated_hours} jam</span>}
                                        <span className="badge badge-accent">{track.course_count} kursus</span>
                                    </div>
                                    <Link href={`/tracks/${track.id}`} className="btn btn-primary btn-full">
                                        Mulai Belajar →
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}

const styles = {
    main: { maxWidth: 1080, margin: '0 auto', padding: '24px' },
    header: { marginBottom: 32 },
    title: { fontSize: '1.5rem', fontWeight: 800 },
    subtitle: { color: 'var(--text-secondary)', marginTop: 4 },
};
