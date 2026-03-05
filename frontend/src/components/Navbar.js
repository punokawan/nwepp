'use client';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/tracks', label: 'Pelatihan', icon: '📚' },
    { href: '/certifications', label: 'Sertifikasi', icon: '🏆' },
    { href: '/positions', label: 'Lowongan', icon: '💼' },
    { href: '/profile', label: 'Profil', icon: '👤' },
];

const adminLinks = [
    { href: '/rankings', label: 'Ranking', icon: '📈' },
];

const instructorLinks = [
    { href: '/instructor/content', label: 'Studio (Instruktur)', icon: '🎬' },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isInstructorOrAdmin = isAdmin || user?.role === 'instructor';

    if (!user) return null;

    return (
        <nav style={styles.nav}>
            <div style={styles.inner}>
                <Link href="/dashboard" style={styles.brand}>
                    <span style={styles.logo}>🥗</span>
                    <span style={styles.brandText}>NWEPP</span>
                </Link>

                <div style={styles.links}>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                ...styles.link,
                                ...(pathname === link.href || pathname.startsWith(link.href + '/') ? styles.linkActive : {}),
                            }}
                        >
                            <span>{link.icon}</span>
                            <span className="hide-mobile">{link.label}</span>
                        </Link>
                    ))}
                    {isAdmin && adminLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                ...styles.link,
                                ...(pathname === link.href ? styles.linkActive : {}),
                            }}
                        >
                            <span>{link.icon}</span>
                            <span className="hide-mobile">{link.label}</span>
                        </Link>
                    ))}
                    {isInstructorOrAdmin && instructorLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                ...styles.link,
                                ...(pathname.startsWith(link.href) ? styles.linkActive : {}),
                            }}
                        >
                            <span>{link.icon}</span>
                            <span className="hide-mobile">{link.label}</span>
                        </Link>
                    ))}
                </div>

                <div style={styles.right}>
                    <span style={styles.userName}>{user.full_name}</span>
                    <button onClick={logout} style={styles.logoutBtn}>Keluar</button>
                </div>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        height: 'var(--navbar-height)',
    },
    inner: {
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        gap: 24,
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        flexShrink: 0,
    },
    logo: { fontSize: '1.5rem' },
    brandText: {
        fontSize: '1.1rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    links: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        overflow: 'auto',
    },
    link: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
        whiteSpace: 'nowrap',
    },
    linkActive: {
        background: 'var(--primary-50)',
        color: 'var(--primary-700)',
        fontWeight: 600,
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
    },
    userName: {
        fontSize: '0.85rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
    },
    logoutBtn: {
        padding: '6px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        background: 'transparent',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        cursor: 'pointer',
    },
};
