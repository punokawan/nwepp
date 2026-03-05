'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

const trackMeta = {
    'ahli-gizi': { emoji: '🔬', gradient: 'linear-gradient(135deg, #00b4a3 0%, #009e90 100%)' },
    'non-ahli-gizi': { emoji: '🍳', gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' },
    'manajemen': { emoji: '📋', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
};

const typeIcons = { video: '🎬', text: '📝', interactive: '🎮', quiz: '✍️' };

export default function TrackDetailPage() {
    const { id } = useParams();
    const [track, setTrack] = useState(null);
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [courseDetails, setCourseDetails] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.getTrack(id).then(r => {
            if (r?.success) {
                setTrack(r.data);
                // auto-expand first course
                if (r.data?.courses?.length) {
                    const firstId = r.data.courses[0].id;
                    setExpandedCourse(firstId);
                    loadCourseDetail(firstId);
                }
            }
            setLoading(false);
        });
    }, [id]);

    const loadCourseDetail = async (courseId) => {
        if (courseDetails[courseId]) return;
        const res = await api.getCourse(courseId);
        if (res?.success) {
            setCourseDetails(prev => ({ ...prev, [courseId]: res.data }));
        }
    };

    const toggleCourse = (courseId) => {
        if (expandedCourse === courseId) {
            setExpandedCourse(null);
        } else {
            setExpandedCourse(courseId);
            loadCourseDetail(courseId);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main style={S.main}>
                    <div className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 24 }} />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }} />
                    ))}
                </main>
            </>
        );
    }

    if (!track) {
        return (
            <>
                <Navbar />
                <main style={{ ...S.main, textAlign: 'center', paddingTop: 80 }}>
                    <p style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</p>
                    <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Track Tidak Ditemukan</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Jalur pelatihan yang Anda cari tidak tersedia.</p>
                    <Link href="/tracks" className="btn btn-primary">← Kembali ke Daftar Track</Link>
                </main>
            </>
        );
    }

    const meta = trackMeta[track.slug] || { emoji: '📖', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' };
    const courses = track.courses || [];

    return (
        <>
            <Navbar />
            <main style={S.main}>
                {/* ── Back Link ── */}
                <Link href="/tracks" style={S.backLink}>
                    ← Semua Jalur Pelatihan
                </Link>

                {/* ── Hero Header ── */}
                <div style={{ ...S.hero, background: meta.gradient }} className="animate-fadeIn">
                    <div style={S.heroContent}>
                        <span style={{ fontSize: '3rem' }}>{meta.emoji}</span>
                        <div>
                            <h1 style={S.heroTitle}>{track.name}</h1>
                            <p style={S.heroDesc}>{track.description}</p>
                            <div style={S.heroBadges}>
                                {track.level && (
                                    <span style={S.heroBadge}>🎯 {track.level}</span>
                                )}
                                {track.estimated_hours && (
                                    <span style={S.heroBadge}>⏱ {track.estimated_hours} jam estimasi</span>
                                )}
                                <span style={S.heroBadge}>📚 {courses.length} kursus</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Course Cards ── */}
                <div style={S.sectionHeader}>
                    <h2 style={S.sectionTitle}>Daftar Kursus</h2>
                    <p style={S.sectionSub}>
                        {courses.length > 0
                            ? 'Klik kursus untuk melihat materi yang tersedia'
                            : 'Belum ada kursus yang tersedia di jalur ini'}
                    </p>
                </div>

                {courses.length === 0 ? (
                    <div style={S.emptyCard} className="card">
                        <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</p>
                        <p style={{ fontWeight: 600, marginBottom: 4 }}>Belum Ada Kursus</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Kursus untuk jalur ini sedang dalam pengembangan. Silakan cek kembali nanti.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {courses.map((course, idx) => {
                            const isExpanded = expandedCourse === course.id;
                            const detail = courseDetails[course.id];
                            const lessons = detail?.lessons || [];

                            return (
                                <div key={course.id} className="card animate-fadeIn" style={{ overflow: 'hidden' }}>
                                    {/* Course Header — clickable accordion */}
                                    <button
                                        onClick={() => toggleCourse(course.id)}
                                        style={S.courseHeader}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--neutral-50)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={S.courseNum}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <h3 style={S.courseTitle}>{course.title}</h3>
                                            {course.description && (
                                                <p style={S.courseDesc}>{course.description}</p>
                                            )}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                                <span style={S.lessonCountBadge}>
                                                    📄 {course.lesson_count || lessons.length || 0} lesson
                                                </span>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '1.2rem',
                                            transition: 'transform 0.2s',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            color: 'var(--text-secondary)',
                                        }}>
                                            ▾
                                        </span>
                                    </button>

                                    {/* Expanded Lesson List */}
                                    {isExpanded && (
                                        <div style={S.lessonList}>
                                            {!detail ? (
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 8 }} />
                                                    <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
                                                </div>
                                            ) : lessons.length === 0 ? (
                                                <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                    📭 Belum ada lesson di kursus ini
                                                </div>
                                            ) : (
                                                lessons.map((lesson, lIdx) => (
                                                    <Link
                                                        key={lesson.id}
                                                        href={`/lessons/${lesson.id}`}
                                                        style={S.lessonItem}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.background = 'var(--primary-50)';
                                                            e.currentTarget.style.borderLeftColor = 'var(--primary-500)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.background = 'var(--neutral-50)';
                                                            e.currentTarget.style.borderLeftColor = 'transparent';
                                                        }}
                                                    >
                                                        <span style={S.lessonIdx}>{lIdx + 1}</span>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={S.lessonTitle}>{lesson.title}</p>
                                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                                                                <span style={S.lessonType}>
                                                                    {typeIcons[lesson.content_type] || '📄'} {lesson.content_type || 'Materi'}
                                                                </span>
                                                                {lesson.duration_min && (
                                                                    <span style={S.lessonDuration}>⏱ {lesson.duration_min} menit</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span style={{ color: 'var(--primary-500)', fontWeight: 600, fontSize: '0.85rem' }}>
                                                            Mulai →
                                                        </span>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}

// ── Styles ──────────────────────────────────────────────────────
const S = {
    main: {
        maxWidth: 860,
        margin: '0 auto',
        padding: '24px',
    },
    backLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: '0.88rem',
        fontWeight: 600,
        color: 'var(--primary-600)',
        textDecoration: 'none',
        marginBottom: 16,
    },
    hero: {
        borderRadius: 16,
        padding: '32px 36px',
        marginBottom: 32,
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    },
    heroContent: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
    },
    heroTitle: {
        fontSize: '1.6rem',
        fontWeight: 800,
        marginBottom: 6,
    },
    heroDesc: {
        fontSize: '0.95rem',
        opacity: 0.9,
        lineHeight: 1.6,
        marginBottom: 12,
    },
    heroBadges: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
    },
    heroBadge: {
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: '0.78rem',
        fontWeight: 600,
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(4px)',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: '1.15rem',
        fontWeight: 800,
        color: 'var(--neutral-900)',
    },
    sectionSub: {
        fontSize: '0.88rem',
        color: 'var(--text-secondary)',
        marginTop: 2,
    },
    emptyCard: {
        textAlign: 'center',
        padding: '48px 24px',
    },
    courseHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '18px 20px',
        width: '100%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s',
        borderRadius: 12,
    },
    courseNum: {
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'var(--primary-50)',
        color: 'var(--primary-600)',
        fontWeight: 800,
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    courseTitle: {
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--neutral-900)',
    },
    courseDesc: {
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        marginTop: 2,
        lineHeight: 1.5,
    },
    lessonCountBadge: {
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 6,
        background: 'var(--neutral-100)',
        color: 'var(--text-secondary)',
    },
    lessonList: {
        borderTop: '1px solid var(--border-light)',
    },
    lessonItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px 14px 24px',
        textDecoration: 'none',
        color: 'inherit',
        borderLeft: '3px solid transparent',
        background: 'var(--neutral-50)',
        transition: 'all 0.15s',
        borderBottom: '1px solid var(--border-light)',
    },
    lessonIdx: {
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: 'var(--neutral-200)',
        color: 'var(--neutral-700)',
        fontWeight: 700,
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    lessonTitle: {
        fontSize: '0.9rem',
        fontWeight: 600,
        color: 'var(--neutral-900)',
    },
    lessonType: {
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
        fontWeight: 500,
    },
    lessonDuration: {
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
    },
};
