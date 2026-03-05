'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const typeLabel = { video: '🎬 Video', text: '📝 Teks', interactive: '🎮 Interaktif', quiz: '✍️ Quiz' };

export default function LessonDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progressStatus, setProgressStatus] = useState(null);
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        if (!id) return;
        api.getLesson(id).then(r => {
            if (r?.success) {
                setLesson(r.data);
                // fetch parent course for sidebar nav
                if (r.data?.course_id) {
                    api.getCourse(r.data.course_id).then(cr => {
                        if (cr?.success) setCourse(cr.data);
                    });
                }
            }
            setLoading(false);
        });
    }, [id]);

    const markComplete = async () => {
        setMarking(true);
        try {
            const res = await api.recordProgress({ lesson_id: id, status: 'completed' });
            if (res?.success) setProgressStatus('completed');
        } finally {
            setMarking(false);
        }
    };

    // ── Loading State ──
    if (loading) {
        return (
            <>
                <Navbar />
                <main style={S.main}>
                    <div style={S.layout}>
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ height: 28, width: 200, borderRadius: 8, marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 40, width: '70%', borderRadius: 8, marginBottom: 24 }} />
                            <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
                        </div>
                    </div>
                </main>
            </>
        );
    }

    // ── Not Found ──
    if (!lesson) {
        return (
            <>
                <Navbar />
                <main style={{ ...S.main, textAlign: 'center', paddingTop: 80 }}>
                    <p style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</p>
                    <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Lesson Tidak Ditemukan</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Materi yang Anda cari tidak tersedia.</p>
                    <Link href="/tracks" className="btn btn-primary">← Kembali ke Daftar Track</Link>
                </main>
            </>
        );
    }

    const otherLessons = course?.lessons?.filter(l => l.id !== id) || [];

    return (
        <>
            <Navbar />
            <main style={S.main}>
                {/* Breadcrumb */}
                <nav style={S.breadcrumb}>
                    <Link href="/tracks" style={S.breadLink}>Tracks</Link>
                    <span style={S.breadSep}>/</span>
                    {course && (
                        <>
                            <Link href={`/tracks/${course.track_id}`} style={S.breadLink}>{course.title}</Link>
                            <span style={S.breadSep}>/</span>
                        </>
                    )}
                    <span style={S.breadCurrent}>{lesson.title}</span>
                </nav>

                <div style={S.layout}>
                    {/* ── Main Content ── */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Header */}
                        <div style={S.header} className="animate-fadeIn">
                            <div style={S.typeBadge}>
                                {typeLabel[lesson.content_type] || '📄 Materi'}
                            </div>
                            <h1 style={S.title}>{lesson.title}</h1>
                            {lesson.duration_min && (
                                <p style={S.meta}>⏱ Estimasi: {lesson.duration_min} menit</p>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="card animate-fadeIn" style={S.contentCard}>
                            {lesson.content_type === 'video' && lesson.content_url ? (
                                <div style={S.videoWrapper}>
                                    {lesson.content_url.includes('youtube') || lesson.content_url.includes('youtu.be') ? (
                                        <iframe
                                            src={lesson.content_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                            style={S.videoIframe}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            title={lesson.title}
                                        />
                                    ) : (
                                        <video controls style={S.videoNative} src={lesson.content_url}>
                                            Browser Anda tidak mendukung video.
                                        </video>
                                    )}
                                </div>
                            ) : null}

                            {lesson.content_body ? (
                                <div
                                    style={S.contentBody}
                                    dangerouslySetInnerHTML={{ __html: lesson.content_body }}
                                />
                            ) : (
                                !lesson.content_url && (
                                    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
                                        <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>📝</p>
                                        <p>Konten untuk lesson ini belum tersedia.</p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Mark Complete Button */}
                        {user && (
                            <div style={S.actionBar}>
                                {progressStatus === 'completed' ? (
                                    <div style={S.completedBanner}>
                                        ✅ Lesson ini sudah selesai ditandai!
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                                        onClick={markComplete}
                                        disabled={marking}
                                    >
                                        {marking ? '⏳ Memproses...' : '✅ Tandai Selesai'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar: Other Lessons in Course ── */}
                    {course && otherLessons.length > 0 && (
                        <aside style={S.sidebar}>
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={S.sidebarHeader}>
                                    <p style={S.sidebarTitle}>📚 Dalam Kursus Ini</p>
                                    <p style={S.sidebarSub}>{course.title}</p>
                                </div>
                                <div>
                                    {course.lessons.map((l, idx) => {
                                        const isCurrent = l.id === id;
                                        return (
                                            <Link
                                                key={l.id}
                                                href={`/lessons/${l.id}`}
                                                style={{
                                                    ...S.sidebarItem,
                                                    background: isCurrent ? 'var(--primary-50)' : 'transparent',
                                                    borderLeft: isCurrent ? '3px solid var(--primary-500)' : '3px solid transparent',
                                                    fontWeight: isCurrent ? 700 : 500,
                                                }}
                                            >
                                                <span style={{
                                                    ...S.sidebarIdx,
                                                    background: isCurrent ? 'var(--primary-500)' : 'var(--neutral-200)',
                                                    color: isCurrent ? '#fff' : 'var(--neutral-700)',
                                                }}>
                                                    {idx + 1}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.82rem',
                                                    color: isCurrent ? 'var(--primary-700)' : 'var(--neutral-900)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {l.title}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </main>
        </>
    );
}

// ── Styles ──────────────────────────────────────────────────────
const S = {
    main: {
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px',
    },
    breadcrumb: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
        fontSize: '0.82rem',
        flexWrap: 'wrap',
    },
    breadLink: {
        color: 'var(--primary-600)',
        textDecoration: 'none',
        fontWeight: 600,
    },
    breadSep: {
        color: 'var(--text-secondary)',
    },
    breadCurrent: {
        color: 'var(--text-secondary)',
        fontWeight: 500,
    },
    layout: {
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
    },
    header: {
        marginBottom: 20,
    },
    typeBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: '0.78rem',
        fontWeight: 700,
        background: 'var(--primary-50)',
        color: 'var(--primary-600)',
        marginBottom: 8,
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 800,
        color: 'var(--neutral-900)',
        lineHeight: 1.3,
    },
    meta: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        marginTop: 6,
    },
    contentCard: {
        padding: 0,
        overflow: 'hidden',
    },
    videoWrapper: {
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden',
        background: '#000',
    },
    videoIframe: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
    },
    videoNative: {
        width: '100%',
        maxHeight: 500,
        background: '#000',
    },
    contentBody: {
        padding: '28px 32px',
        fontSize: '0.95rem',
        lineHeight: 1.85,
        color: 'var(--neutral-900)',
    },
    actionBar: {
        marginTop: 20,
        display: 'flex',
        justifyContent: 'center',
    },
    completedBanner: {
        padding: '14px 24px',
        borderRadius: 12,
        background: '#dcfce7',
        color: '#166534',
        fontWeight: 700,
        fontSize: '0.95rem',
        textAlign: 'center',
        width: '100%',
    },
    sidebar: {
        width: 260,
        flexShrink: 0,
        position: 'sticky',
        top: 80,
    },
    sidebarHeader: {
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--neutral-50)',
    },
    sidebarTitle: {
        fontWeight: 700,
        fontSize: '0.82rem',
        color: 'var(--neutral-900)',
    },
    sidebarSub: {
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
        marginTop: 2,
    },
    sidebarItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background 0.15s',
        borderBottom: '1px solid var(--border-light)',
    },
    sidebarIdx: {
        width: 22,
        height: 22,
        borderRadius: '50%',
        fontWeight: 700,
        fontSize: '0.68rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
};
