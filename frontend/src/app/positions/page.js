'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

const categoryIcons = {
    regional_manager: '🏛️', nutrition_supervisor: '📊', kitchen_manager: '👨‍🍳',
    cook: '🍳', food_packer: '📦', distribution_staff: '🚚',
};

export default function PositionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) { router.push('/login'); return; }
        if (user) {
            api.getPositions().then(r => {
                if (r?.success) setPositions(r.data || []);
                setLoading(false);
            });
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) return <div style={{ minHeight: '100vh' }} />;

    return (
        <>
            <Navbar />
            <main style={styles.main}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Lowongan Posisi</h1>
                        <p style={styles.subtitle}>Posisi tersedia di dapur MBG seluruh Indonesia</p>
                    </div>
                </div>

                {/* Filter Badges */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary" style={{ cursor: 'pointer', padding: '6px 14px' }}>Semua</span>
                    <span className="badge badge-neutral" style={{ cursor: 'pointer', padding: '6px 14px' }}>Struktural</span>
                    <span className="badge badge-neutral" style={{ cursor: 'pointer', padding: '6px 14px' }}>Operasional</span>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
                    </div>
                ) : positions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {positions.map((pos, i) => (
                            <div key={pos.id} className="card animate-fadeIn" style={{ padding: '20px 24px', animationDelay: `${i * 60}ms` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.8rem' }}>{categoryIcons[pos.role_category] || '💼'}</span>
                                        <div>
                                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>{pos.title}</h3>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                📍 {pos.kitchen_name} {pos.kitchen_city ? `— ${pos.kitchen_city}` : ''}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                                <span className={`badge ${pos.position_type === 'structural' ? 'badge-primary' : 'badge-accent'}`}>
                                                    {pos.position_type === 'structural' ? 'Struktural' : 'Operasional'}
                                                </span>
                                                <span className="badge badge-neutral">
                                                    {pos.filled}/{pos.slots} terisi
                                                </span>
                                                {pos.min_score && <span className="badge badge-warning">Min. skor: {pos.min_score}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-sm">Lihat Detail</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>💼</p>
                        <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>Belum ada lowongan tersedia</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Pastikan Anda telah menyelesaikan pelatihan dan sertifikasi untuk meningkatkan peluang penempatan.
                        </p>
                    </div>
                )}
            </main>
        </>
    );
}

const styles = {
    main: { maxWidth: 900, margin: '0 auto', padding: '24px' },
    header: { marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 },
    title: { fontSize: '1.5rem', fontWeight: 800 },
    subtitle: { color: 'var(--text-secondary)', marginTop: 4 },
};
