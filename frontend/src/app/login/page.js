'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(form.email, form.password);
        if (res.success) {
            router.push('/dashboard');
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-left" style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))' }}>
                <div style={styles.leftContent}>
                    <Link href="/" style={styles.brand}>
                        <span style={{ fontSize: '2rem' }}>🥗</span>
                        <span style={styles.brandText}>NWEPP</span>
                    </Link>
                    <h2 style={styles.leftTitle}>Platform Nasional<br />Tenaga Kerja Gizi</h2>
                    <p style={styles.leftSub}>
                        Bergabunglah dengan jaringan nasional tenaga kerja gizi
                        untuk mendukung program Makan Bergizi Gratis.
                    </p>
                    <div style={styles.features}>
                        {['📚 3 Jalur Pelatihan', '🏆 5 Level Sertifikasi', '💼 Penempatan Otomatis', '📊 Ranking Nasional'].map((f, i) => (
                            <div key={i} style={styles.featureItem}>{f}</div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="auth-right">
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h1 style={styles.title}>Masuk</h1>
                    <p style={styles.subtitle}>Masuk ke akun NWEPP Anda</p>

                    {error && <div style={styles.error}>{error}</div>}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input id="email" type="email" className="form-input" placeholder="nama@email.com"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input id="password" type="password" className="form-input" placeholder="Minimal 8 karakter"
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
                        style={{ marginTop: 8 }}>
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>

                    <p style={styles.bottomText}>
                        Belum punya akun? <Link href="/register" style={styles.link}>Daftar sekarang</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

const styles = {
    leftContent: { maxWidth: 420, position: 'relative', zIndex: 1 },
    brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' },
    brandText: { fontSize: '1.3rem', fontWeight: 800, color: 'white' },
    leftTitle: { fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 12 },
    leftSub: { color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 32 },
    features: { display: 'flex', flexDirection: 'column', gap: 12 },
    featureItem: {
        background: 'rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 'var(--radius-md)',
        color: 'white', fontSize: '0.9rem', fontWeight: 500,
    },
    form: { width: '100%', maxWidth: 400 },
    title: { fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 },
    subtitle: { color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.95rem' },
    error: {
        background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-md)',
        fontSize: '0.85rem', marginBottom: 16,
    },
    bottomText: { textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--text-secondary)' },
    link: { color: 'var(--primary-600)', fontWeight: 600 },
};
