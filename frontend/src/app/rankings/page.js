'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function RankingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [province, setProvince] = useState('');

    useEffect(() => {
        if (!authLoading && !user) { router.push('/login'); return; }
        if (user) loadRankings();
    }, [user, authLoading, router]);

    const loadRankings = (prov) => {
        setLoading(true);
        const params = { page: 1 };
        if (prov) params.province = prov;
        api.getRanking(params).then(r => {
            if (r?.success) setRankings(r.data || []);
            setLoading(false);
        });
    };

    const handleFilter = () => { loadRankings(province); };

    if (authLoading || !user) return <div style={{ minHeight: '100vh' }} />;

    const topColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    return (
        <>
            <Navbar />
            <main style={styles.main}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Ranking Nasional</h1>
                    <p style={styles.subtitle}>Peringkat tenaga kerja gizi berdasarkan skor kompetensi</p>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    <input className="form-input" placeholder="Filter provinsi..." value={province}
                        onChange={e => setProvince(e.target.value)} style={{ maxWidth: 250 }} />
                    <button className="btn btn-primary btn-sm" onClick={handleFilter}>Filter</button>
                    {province && <button className="btn btn-ghost btn-sm" onClick={() => { setProvince(''); loadRankings(''); }}>Reset</button>}
                </div>

                {loading ? (
                    <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
                ) : rankings.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Nama</th>
                                    <th>Provinsi</th>
                                    <th>Total Skor</th>
                                    <th>Ujian</th>
                                    <th>Praktik</th>
                                    <th>Sertifikasi</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankings.map((r, i) => (
                                    <tr key={r.user_id} className="animate-fadeIn" style={{ animationDelay: `${i * 30}ms` }}>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 28, height: 28, borderRadius: '50%', fontSize: '0.8rem', fontWeight: 700,
                                                background: i < 3 ? topColors[i] : 'var(--neutral-100)',
                                                color: i < 3 ? 'white' : 'var(--text-primary)',
                                            }}>
                                                {r.rank}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{r.full_name}</td>
                                        <td>{r.province || '—'}</td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                                                {(r.total_score || 0).toFixed(1)}
                                            </span>
                                        </td>
                                        <td>{(r.exam_score || 0).toFixed(1)}</td>
                                        <td>{(r.practical_score || 0).toFixed(1)}</td>
                                        <td>{r.cert_name ? <span className="badge badge-primary">{r.cert_name}</span> : '—'}</td>
                                        <td>
                                            <span className={`badge ${r.availability === 'available' ? 'badge-success' : 'badge-neutral'}`}>
                                                {r.availability === 'available' ? 'Tersedia' : r.availability === 'employed' ? 'Bekerja' : 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📈</p>
                        <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>Belum ada data ranking</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Ranking akan tersedia setelah kandidat menyelesaikan ujian sertifikasi.
                        </p>
                    </div>
                )}
            </main>
        </>
    );
}

const styles = {
    main: { maxWidth: 1100, margin: '0 auto', padding: '24px' },
    header: { marginBottom: 24 },
    title: { fontSize: '1.5rem', fontWeight: 800 },
    subtitle: { color: 'var(--text-secondary)', marginTop: 4 },
};
