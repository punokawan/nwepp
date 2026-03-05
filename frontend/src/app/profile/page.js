'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [score, setScore] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) { router.push('/login'); return; }
        if (user) {
            api.getMyProfile().then(r => {
                if (r?.success) { setProfile(r.data); setForm(r.data); }
            });
            api.getMyScore().then(r => { if (r?.success) setScore(r.data); });
        }
    }, [user, authLoading, router]);

    const handleSave = async () => {
        setSaving(true);
        const res = await api.updateMyProfile({
            education: form.education || '',
            specialization: form.specialization || '',
            years_experience: parseInt(form.years_experience) || 0,
            skills: form.skills || [],
            willing_relocate: form.willing_relocate || false,
            availability: form.availability || 'available',
        });
        if (res?.success) { setProfile(res.data); setEditing(false); }
        setSaving(false);
    };

    if (authLoading || !user) return <div style={{ minHeight: '100vh' }} />;

    return (
        <>
            <Navbar />
            <main style={styles.main}>
                {/* User Header */}
                <div className="card" style={{ padding: 28, marginBottom: 24, background: 'linear-gradient(135deg, var(--primary-50), var(--bg-primary))' }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={styles.avatar}>{user.full_name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user.full_name}</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                <span className="badge badge-primary">{user.role === 'candidate' ? 'Kandidat' : user.role}</span>
                                {user.province && <span className="badge badge-neutral">📍 {user.province}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Score Card */}
                    <div className="card" style={{ padding: 24 }}>
                        <h2 style={styles.sectionTitle}>Skor Kompetensi</h2>
                        {score ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                                <div style={styles.scoreMain}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                                        {(score.total_score || 0).toFixed(1)}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Score</div>
                                </div>
                                {[
                                    { label: 'Ujian Teori (40%)', value: score.exam_score, color: 'var(--primary-500)' },
                                    { label: 'Praktik (30%)', value: score.practical_score, color: 'var(--accent-500)' },
                                    { label: 'Pengalaman (20%)', value: score.experience_score, color: 'var(--info)' },
                                    { label: 'Soft Skills (10%)', value: score.soft_skill_score, color: '#8b5cf6' },
                                ].map((s, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                                            <span style={{ fontWeight: 600 }}>{(s.value || 0).toFixed(1)}</span>
                                        </div>
                                        <div className="progress-bar" style={{ height: 6 }}>
                                            <div className="progress-fill" style={{ width: `${s.value || 0}%`, background: s.color }} />
                                        </div>
                                    </div>
                                ))}
                                {score.rank_national && (
                                    <div style={styles.rankBadge}>
                                        🏅 Ranking Nasional: #{score.rank_national}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: 16 }}>
                                Skor akan tersedia setelah menyelesaikan ujian sertifikasi.
                            </p>
                        )}
                    </div>

                    {/* Talent Profile */}
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={styles.sectionTitle}>Profil Talent</h2>
                            {!editing ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
                            ) : (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm(profile); }}>Batal</button>
                                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                        {saving ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Pendidikan</label>
                                    <input className="form-input" value={form.education || ''} onChange={e => setForm({ ...form, education: e.target.value })} placeholder="Contoh: S1 Gizi" />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Spesialisasi</label>
                                    <input className="form-input" value={form.specialization || ''} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="Contoh: Perencanaan Menu" />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Pengalaman (tahun)</label>
                                    <input className="form-input" type="number" min="0" value={form.years_experience || 0} onChange={e => setForm({ ...form, years_experience: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Ketersediaan</label>
                                    <select className="form-input" value={form.availability || 'available'} onChange={e => setForm({ ...form, availability: e.target.value })}>
                                        <option value="available">Tersedia</option>
                                        <option value="employed">Sudah Bekerja</option>
                                        <option value="unavailable">Tidak Tersedia</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" checked={form.willing_relocate || false} onChange={e => setForm({ ...form, willing_relocate: e.target.checked })} />
                                        Bersedia relokasi
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[
                                    { label: 'Pendidikan', value: profile?.education },
                                    { label: 'Spesialisasi', value: profile?.specialization },
                                    { label: 'Pengalaman', value: profile?.years_experience ? `${profile.years_experience} tahun` : null },
                                    { label: 'Ketersediaan', value: profile?.availability === 'available' ? 'Tersedia' : profile?.availability === 'employed' ? 'Sudah Bekerja' : 'Tidak Tersedia' },
                                    { label: 'Bersedia Relokasi', value: profile?.willing_relocate ? 'Ya' : 'Tidak' },
                                ].map((item, i) => (
                                    <div key={i} style={{ borderBottom: '1px solid var(--neutral-100)', paddingBottom: 10 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                                        <div style={{ fontWeight: 500, fontSize: '0.95rem', marginTop: 2 }}>{item.value || '—'}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}

const styles = {
    main: { maxWidth: 1000, margin: '0 auto', padding: '24px' },
    avatar: {
        width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', fontWeight: 800, color: 'white',
        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
    },
    sectionTitle: { fontSize: '1.05rem', fontWeight: 700, margin: 0 },
    scoreMain: { textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid var(--neutral-100)' },
    rankBadge: {
        textAlign: 'center', padding: '8px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--accent-50)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-700)',
    },
};
