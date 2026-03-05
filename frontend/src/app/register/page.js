'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', province: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const provinces = [
        'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung',
        'Kep. Bangka Belitung', 'Kep. Riau', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta',
        'Jawa Timur', 'Banten', 'Bali', 'NTB', 'NTT', 'Kalimantan Barat', 'Kalimantan Tengah',
        'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Sulawesi Tengah',
        'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara',
        'Papua', 'Papua Barat', 'Papua Tengah', 'Papua Pegunungan', 'Papua Selatan', 'Papua Barat Daya',
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password.length < 8) { setError('Password minimal 8 karakter'); return; }
        setLoading(true);
        const res = await register(form);
        if (res.success) {
            router.push('/dashboard');
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    return (
        <div className="auth-page">
            <div className="auth-left" style={{ background: 'linear-gradient(135deg, var(--accent-600), var(--primary-700))' }}>
                <div style={styles.leftContent}>
                    <Link href="/" style={styles.brand}>
                        <span style={{ fontSize: '2rem' }}>🥗</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>NWEPP</span>
                    </Link>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 12 }}>
                        Mulai Perjalanan<br />Karir Gizi Anda
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.7 }}>
                        Daftar untuk mengakses pelatihan, ujian sertifikasi, dan kesempatan penempatan
                        di seluruh Indonesia.
                    </p>
                    <div style={styles.steps}>
                        {['1. Daftar akun gratis', '2. Pilih jalur pelatihan', '3. Ikuti ujian sertifikasi', '4. Dapatkan penempatan kerja'].map((s, i) => (
                            <div key={i} style={styles.stepItem}>
                                <div style={styles.stepDot} />
                                <span>{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="auth-right">
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Daftar</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>Buat akun NWEPP baru</p>

                    {error && <div style={styles.error}>{error}</div>}

                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Nama Lengkap</label>
                        <input id="name" className="form-input" placeholder="Nama lengkap Anda"
                            value={form.full_name} onChange={set('full_name')} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input id="email" type="email" className="form-input" placeholder="nama@email.com"
                            value={form.email} onChange={set('email')} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input id="password" type="password" className="form-input" placeholder="Minimal 8 karakter"
                            value={form.password} onChange={set('password')} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="phone">No. Telepon</label>
                        <input id="phone" type="tel" className="form-input" placeholder="08xxxxxxxxxx"
                            value={form.phone} onChange={set('phone')} />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="province">Provinsi</label>
                        <select id="province" className="form-input" value={form.province} onChange={set('province')}>
                            <option value="">Pilih provinsi...</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
                        style={{ marginTop: 8 }}>
                        {loading ? 'Memproses...' : 'Daftar Sekarang'}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Sudah punya akun? <Link href="/login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Masuk</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

const styles = {
    leftContent: { maxWidth: 400 },
    brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' },
    steps: { marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 },
    stepItem: {
        display: 'flex', alignItems: 'center', gap: 12,
        color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', fontWeight: 500,
    },
    stepDot: {
        width: 10, height: 10, borderRadius: '50%', background: 'white', flexShrink: 0,
    },
    form: { width: '100%', maxWidth: 400 },
    error: {
        background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-md)',
        fontSize: '0.85rem', marginBottom: 16,
    },
};
