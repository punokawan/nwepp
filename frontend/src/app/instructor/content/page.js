'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import WysiwygEditor from '@/components/WysiwygEditor';

// ── Shared tokens (mirrors globals.css) ─────────────────────────
const C = {
    primary500: '#00b4a3',
    primary600: '#009e90',
    primary700: '#00867a',
    primary50: '#e6f7f5',
    primary100: '#b3e8e3',
    primary200: '#80d9d0',
    primary300: '#4dcabd',
    neutral50: '#fafafa',
    neutral100: '#f5f5f5',
    neutral200: '#e5e5e5',
    neutral600: '#525252',
    neutral900: '#171717',
    accent500: '#ff9800',
    success: '#22c55e',
    error: '#ef4444',
    successBg: '#dcfce7',
    errorBg: '#fee2e2',
    successText: '#15803d',
    errorText: '#b91c1c',
    white: '#ffffff',
    borderLight: '#e5e5e5',
    textSec: '#525252',
    shadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    shadowLg: '0 10px 15px -3px rgba(0,0,0,0.08)',
};

// ── Page ─────────────────────────────────────────────────────────
export default function InstructorContentPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('courses');
    const [tracks, setTracks] = useState([]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        else if (user && !['instructor', 'admin', 'super_admin'].includes(user.role)) router.push('/dashboard');
    }, [user, loading, router]);

    useEffect(() => {
        api.getTracks().then(res => { if (res?.success) setTracks(res.data ?? []); });
    }, []);

    if (loading || !user) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${C.primary200}`, borderTopColor: C.primary600, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    const tabs = ['courses', 'manage', 'media', 'exams'];
    const tabLabels = { courses: '📘 Buat Konten', manage: '📋 Kelola Konten', media: '🎬 Media Upload', exams: '📝 Exam Builder' };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `linear-gradient(135deg, ${C.primary500}, ${C.primary700})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, boxShadow: `0 4px 14px rgba(0,180,163,0.35)`
                    }}>🎓</div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: C.neutral900, lineHeight: 1.2 }}>
                            Instructor Studio
                        </h1>
                        <p style={{ fontSize: '0.9rem', color: C.textSec, marginTop: 2 }}>
                            Signed in as <strong>{user.full_name}</strong> · {user.role}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{
                display: 'flex', gap: 4,
                background: C.neutral100, borderRadius: 14,
                padding: 4, marginBottom: 32, width: 'fit-content',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
            }}>
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        background: activeTab === tab
                            ? `linear-gradient(135deg, ${C.primary500}, ${C.primary700})`
                            : 'transparent',
                        color: activeTab === tab ? C.white : C.textSec,
                        boxShadow: activeTab === tab ? `0 2px 8px rgba(0,180,163,0.4)` : 'none',
                        transform: activeTab === tab ? 'translateY(-1px)' : 'none',
                    }}>
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'courses' && <CourseManager tracks={tracks} />}
            {activeTab === 'manage' && <ContentManager tracks={tracks} />}
            {activeTab === 'media' && <MediaUploader />}
            {activeTab === 'exams' && <ExamPlaceholder />}
        </div>
    );
}

// ── Course Manager ───────────────────────────────────────────────
function CourseManager({ tracks }) {
    const [formType, setFormType] = useState('lesson');
    const [alert, setAlert] = useState(null);
    const [formCourse, setFormCourse] = useState({ title: '', slug: '', description: '', track_id: '' });
    const [formLesson, setFormLesson] = useState({ title: '', content_type: 'video', content_url: '', content_body: '', course_id: '' });
    const [selectedTrackForLesson, setSelectedTrackForLesson] = useState('');
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 4000);
    };

    // When track is selected for the Lesson form, load courses for that track
    const handleTrackForLesson = async (trackId) => {
        setSelectedTrackForLesson(trackId);
        setFormLesson(prev => ({ ...prev, course_id: '' }));
        setCourses([]);
        if (!trackId) return;
        setLoadingCourses(true);
        try {
            const res = await api.getTrack(trackId);
            if (res?.success) {
                setCourses(res.data?.courses ?? []);
            }
        } finally {
            setLoadingCourses(false);
        }
    };

    const submit = async (e, isLesson) => {
        e.preventDefault();
        try {
            const res = isLesson ? await api.createLesson(formLesson) : await api.createCourse(formCourse);
            if (res?.success) {
                if (isLesson) {
                    showAlert('success', 'Lesson berhasil dibuat!');
                    setFormLesson({ title: '', content_type: 'video', content_url: '', content_body: '', course_id: '' });
                } else {
                    // Course created — if we came from the guided flow (track pre-filled via CTA),
                    // switch back to Lesson form and auto-select the new course.
                    const newCourse = res.data;
                    const fromGuidedFlow = !!formCourse.track_id;
                    showAlert('success', 'Course berhasil dibuat! Sekarang tambahkan lesson pertama Anda.');
                    setFormCourse({ title: '', slug: '', description: '', track_id: '' });
                    if (fromGuidedFlow && newCourse?.id) {
                        // Refresh courses list for the track, then pre-select new course in Lesson form
                        setSelectedTrackForLesson(newCourse.track_id ?? formCourse.track_id);
                        setCourses(prev => [...prev, newCourse]);
                        setFormLesson(prev => ({ ...prev, course_id: newCourse.id }));
                        setFormType('lesson');
                    }
                }
            } else {
                showAlert('error', res?.error || 'Gagal menyimpan data.');
            }
        } catch { showAlert('error', 'Terjadi kesalahan jaringan.'); }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
            {/* Sidebar */}
            <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textSec, marginBottom: 12 }}>
                    Buat Konten
                </p>
                {[
                    { id: 'lesson', icon: '📄', label: 'Lesson', desc: 'Materi belajar' },
                    { id: 'course', icon: '📘', label: 'Course', desc: 'Kumpulan lesson' },
                ].map(item => (
                    <button key={item.id} onClick={() => setFormType(item.id)} style={{
                        width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                        border: formType === item.id ? 'none' : `1px solid ${C.borderLight}`,
                        marginBottom: 8, cursor: 'pointer', transition: 'all 0.2s',
                        background: formType === item.id
                            ? `linear-gradient(135deg, ${C.primary500}, ${C.primary700})`
                            : C.white,
                        color: formType === item.id ? C.white : C.neutral900,
                        boxShadow: formType === item.id ? `0 4px 12px rgba(0,180,163,0.3)` : C.shadow,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.label}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{item.desc}</div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Form */}
            <div className="card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: C.neutral900, marginBottom: 24 }}>
                    {formType === 'course' ? '📘 Buat Course Module' : '📄 Buat Lesson Content'}
                </h2>

                {alert && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                        background: alert.type === 'error' ? C.errorBg : C.successBg,
                        color: alert.type === 'error' ? C.errorText : C.successText,
                        fontWeight: 600, fontSize: '0.875rem',
                        border: `1px solid ${alert.type === 'error' ? '#fca5a5' : '#86efac'}`
                    }}>
                        {alert.type === 'error' ? '⚠️ ' : '✅ '}{alert.msg}
                    </div>
                )}

                {formType === 'course' ? (
                    <form onSubmit={e => submit(e, false)}>
                        <FormField label="Training Track *">
                            <select className="form-input" style={{ width: '100%' }}
                                value={formCourse.track_id}
                                onChange={e => setFormCourse({ ...formCourse, track_id: e.target.value })} required>
                                <option value="">Pilih track...</option>
                                {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </FormField>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <FormField label="Judul Course *">
                                <input type="text" className="form-input" style={{ width: '100%' }}
                                    placeholder="Food Safety Basics" value={formCourse.title}
                                    onChange={e => {
                                        const title = e.target.value;
                                        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                        setFormCourse(prev => ({ ...prev, title, slug }));
                                    }} required />
                            </FormField>
                            <FormField label="URL Slug *">
                                <input type="text" className="form-input" style={{ width: '100%' }}
                                    placeholder="food-safety-basics" value={formCourse.slug}
                                    onChange={e => setFormCourse({ ...formCourse, slug: e.target.value })} required />
                            </FormField>
                        </div>
                        <FormField label="Deskripsi">
                            <textarea className="form-input" rows={3} style={{ width: '100%', resize: 'vertical' }}
                                value={formCourse.description}
                                onChange={e => setFormCourse({ ...formCourse, description: e.target.value })} />
                        </FormField>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                            Simpan Course →
                        </button>
                    </form>
                ) : (
                    <form onSubmit={e => submit(e, true)}>
                        <FormField label="Training Track">
                            <select className="form-input" style={{ width: '100%' }}
                                value={selectedTrackForLesson}
                                onChange={e => handleTrackForLesson(e.target.value)}
                                required>
                                <option value="">Pilih training track...</option>
                                {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Course *">
                            {selectedTrackForLesson && !loadingCourses && courses.length === 0 ? (
                                /* ── Empty State CTA ─────────────────────────────── */
                                <div style={{
                                    border: `1.5px dashed ${C.primary300 ?? '#4dcabd'}`,
                                    borderRadius: 12,
                                    padding: '20px 24px',
                                    background: C.primary50,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 16,
                                }}>
                                    <div>
                                        <p style={{ fontWeight: 700, color: C.neutral900, marginBottom: 4, fontSize: '0.9rem' }}>
                                            📭 Track ini belum punya course
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: C.textSec, lineHeight: 1.5 }}>
                                            Buat course terlebih dahulu, lalu kembali ke sini untuk menambahkan lesson.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ flexShrink: 0, fontSize: '0.85rem', padding: '9px 18px' }}
                                        onClick={() => {
                                            // Switch to Course form with track pre-filled
                                            setFormCourse(prev => ({ ...prev, track_id: selectedTrackForLesson }));
                                            setFormType('course');
                                        }}
                                    >
                                        + Buat Course Dulu
                                    </button>
                                </div>
                            ) : (
                                <select className="form-input" style={{ width: '100%' }}
                                    value={formLesson.course_id}
                                    onChange={e => setFormLesson({ ...formLesson, course_id: e.target.value })}
                                    disabled={!selectedTrackForLesson || loadingCourses}
                                    required>
                                    <option value="">
                                        {loadingCourses ? 'Memuat courses...' : selectedTrackForLesson ? 'Pilih course...' : 'Pilih track dulu...'}
                                    </option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            )}
                        </FormField>
                        <FormField label="Judul Lesson *">
                            <input type="text" className="form-input" style={{ width: '100%' }}
                                placeholder="Pencegahan kontaminasi silang" value={formLesson.title}
                                onChange={e => setFormLesson({ ...formLesson, title: e.target.value })} required />
                        </FormField>
                        <FormField label="Tipe Konten">
                            <select className="form-input" style={{ width: '100%' }}
                                value={formLesson.content_type}
                                onChange={e => setFormLesson({ ...formLesson, content_type: e.target.value })}>
                                <option value="video">🎬 Video</option>
                                <option value="text">📝 Teks / PDF</option>
                                <option value="interactive">🎮 Interaktif</option>
                            </select>
                        </FormField>

                        {formLesson.content_type === 'video' ? (
                            <FormField label="CDN URL Video" hint="Upload file di tab Media, lalu paste URL di sini.">
                                <input type="url" className="form-input" style={{ width: '100%' }}
                                    placeholder="https://cdn.nwepp.id/media/video/..." value={formLesson.content_url}
                                    onChange={e => setFormLesson({ ...formLesson, content_url: e.target.value })} />
                            </FormField>
                        ) : (
                            <FormField label="Isi Konten (Rich Text)">
                                <WysiwygEditor
                                    value={formLesson.content_body}
                                    onChange={val => setFormLesson({ ...formLesson, content_body: val })}
                                    placeholder="Tulis konten pembelajaran di sini. Gunakan toolbar untuk format teks, heading, list, dan sisipkan gambar/link."
                                />
                            </FormField>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                            Simpan Lesson →
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

// ── Content Manager (Kelola Konten) ─────────────────────────────
function ContentManager({ tracks }) {
    const [trackData, setTrackData] = useState({});
    const [expandedTrack, setExpandedTrack] = useState(null);
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [loadingTrack, setLoadingTrack] = useState(null);
    const [editItem, setEditItem] = useState(null); // { type:'course'|'lesson', data: {...} }
    const [alert, setAlert] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({});

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 4000);
    };

    const loadTrack = async (trackId) => {
        if (trackData[trackId]) return;
        setLoadingTrack(trackId);
        const res = await api.getTrack(trackId);
        if (res?.success) {
            setTrackData(prev => ({ ...prev, [trackId]: res.data }));
        }
        setLoadingTrack(null);
    };

    const toggleTrack = (trackId) => {
        if (expandedTrack === trackId) {
            setExpandedTrack(null);
        } else {
            setExpandedTrack(trackId);
            loadTrack(trackId);
        }
    };

    const loadCourseDetail = async (courseId) => {
        const res = await api.getCourse(courseId);
        if (res?.success) return res.data;
        return null;
    };

    const toggleCourse = async (courseId) => {
        if (expandedCourse === courseId) {
            setExpandedCourse(null);
        } else {
            setExpandedCourse(courseId);
        }
    };

    const startEdit = (type, data) => {
        setEditItem({ type, data });
        setEditForm(type === 'course'
            ? { title: data.title, slug: data.slug, description: data.description || '' }
            : { title: data.title, content_type: data.content_type || 'text', content_url: data.content_url || '', content_body: data.content_body || '' }
        );
    };

    const cancelEdit = () => {
        setEditItem(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        setSaving(true);
        try {
            let res;
            if (editItem.type === 'course') {
                res = await api.updateCourse(editItem.data.id, editForm);
            } else {
                res = await api.updateLesson(editItem.data.id, editForm);
            }
            if (res?.success) {
                showAlert('success', `${editItem.type === 'course' ? 'Course' : 'Lesson'} berhasil diperbarui!`);
                // Refresh the track data
                const trackId = editItem.type === 'course' ? editItem.data.track_id : null;
                if (trackId) {
                    setTrackData(prev => { const copy = { ...prev }; delete copy[trackId]; return copy; });
                    loadTrack(trackId);
                }
                cancelEdit();
            } else {
                showAlert('error', res?.error || 'Gagal menyimpan perubahan.');
            }
        } catch { showAlert('error', 'Terjadi kesalahan jaringan.'); }
        setSaving(false);
    };

    return (
        <div>
            {alert && (
                <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                    background: alert.type === 'error' ? C.errorBg : C.successBg,
                    color: alert.type === 'error' ? C.errorText : C.successText,
                    fontWeight: 600, fontSize: '0.875rem',
                    border: `1px solid ${alert.type === 'error' ? '#fca5a5' : '#86efac'}`
                }}>
                    {alert.type === 'error' ? '⚠️ ' : '✅ '}{alert.msg}
                </div>
            )}

            {/* ── Edit Modal ────────────────────────────────── */}
            {editItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)',
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: 640, padding: 28, maxHeight: '85vh', overflow: 'auto' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: C.neutral900 }}>
                            ✏️ Edit {editItem.type === 'course' ? 'Course' : 'Lesson'}
                        </h3>

                        <FormField label="Judul *">
                            <input type="text" className="form-input" style={{ width: '100%' }}
                                value={editForm.title || ''}
                                onChange={e => {
                                    const title = e.target.value;
                                    if (editItem.type === 'course') {
                                        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                        setEditForm(prev => ({ ...prev, title, slug }));
                                    } else {
                                        setEditForm(prev => ({ ...prev, title }));
                                    }
                                }} />
                        </FormField>

                        {editItem.type === 'course' && (
                            <>
                                <FormField label="URL Slug">
                                    <input type="text" className="form-input" style={{ width: '100%' }}
                                        value={editForm.slug || ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, slug: e.target.value }))} />
                                </FormField>
                                <FormField label="Deskripsi">
                                    <textarea className="form-input" rows={3} style={{ width: '100%', resize: 'vertical' }}
                                        value={editForm.description || ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} />
                                </FormField>
                            </>
                        )}

                        {editItem.type === 'lesson' && (
                            <>
                                <FormField label="Tipe Konten">
                                    <select className="form-input" style={{ width: '100%' }}
                                        value={editForm.content_type || 'text'}
                                        onChange={e => setEditForm(prev => ({ ...prev, content_type: e.target.value }))}>
                                        <option value="video">🎬 Video</option>
                                        <option value="text">📝 Teks / PDF</option>
                                        <option value="interactive">🎮 Interaktif</option>
                                    </select>
                                </FormField>
                                {editForm.content_type === 'video' ? (
                                    <FormField label="URL Video">
                                        <input type="url" className="form-input" style={{ width: '100%' }}
                                            value={editForm.content_url || ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, content_url: e.target.value }))} />
                                    </FormField>
                                ) : (
                                    <FormField label="Isi Konten (Rich Text)">
                                        <WysiwygEditor
                                            value={editForm.content_body || ''}
                                            onChange={val => setEditForm(prev => ({ ...prev, content_body: val }))}
                                            placeholder="Edit konten lesson..."
                                        />
                                    </FormField>
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn" onClick={cancelEdit}
                                style={{ padding: '10px 20px', background: C.neutral100, border: `1px solid ${C.borderLight}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: C.textSec }}>
                                Batal
                            </button>
                            <button type="button" className="btn btn-primary" onClick={saveEdit}
                                disabled={saving}
                                style={{ padding: '10px 24px' }}>
                                {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Track List ────────────────────────────────── */}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: C.neutral900, marginBottom: 16 }}>
                📋 Kelola Konten yang Sudah Dibuat
            </h2>

            {tracks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <p style={{ fontSize: '2rem', marginBottom: 8 }}>📭</p>
                    <p style={{ color: C.textSec }}>Belum ada track yang tersedia.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tracks.map(track => {
                        const isExpanded = expandedTrack === track.id;
                        const data = trackData[track.id];
                        const courses = data?.courses || [];

                        return (
                            <div key={track.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                                {/* Track Header */}
                                <button onClick={() => toggleTrack(track.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                                    width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                                    textAlign: 'left', transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = C.neutral50}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: `linear-gradient(135deg, ${C.primary500}, ${C.primary700})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.1rem', flexShrink: 0, color: '#fff',
                                    }}>📚</div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: C.neutral900 }}>{track.name}</p>
                                        <p style={{ fontSize: '0.78rem', color: C.textSec }}>{track.course_count} course</p>
                                    </div>
                                    <span style={{
                                        fontSize: '1.1rem', transition: 'transform 0.2s',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: C.textSec,
                                    }}>▾</span>
                                </button>

                                {/* Expanded: courses */}
                                {isExpanded && (
                                    <div style={{ borderTop: `1px solid ${C.borderLight}` }}>
                                        {loadingTrack === track.id ? (
                                            <div style={{ padding: 20 }}>
                                                <div className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 8 }} />
                                                <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
                                            </div>
                                        ) : courses.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', color: C.textSec, fontSize: '0.85rem' }}>
                                                📭 Belum ada course di track ini
                                            </div>
                                        ) : (
                                            courses.map(course => {
                                                const isCourseExpanded = expandedCourse === course.id;
                                                const detail = trackData[`course_${course.id}`];
                                                const lessons = detail?.lessons || [];

                                                return (
                                                    <div key={course.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                                                        {/* Course Row */}
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 12,
                                                            padding: '12px 20px 12px 36px',
                                                            background: isCourseExpanded ? C.primary50 : 'transparent',
                                                        }}>
                                                            <button onClick={() => {
                                                                toggleCourse(course.id);
                                                                if (!detail) {
                                                                    loadCourseDetail(course.id).then(d => {
                                                                        if (d) setTrackData(prev => ({ ...prev, [`course_${course.id}`]: d }));
                                                                    });
                                                                }
                                                            }} style={{
                                                                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                                                                border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                                                            }}>
                                                                <span style={{
                                                                    fontSize: '0.85rem', color: C.textSec, transition: 'transform 0.2s',
                                                                    transform: isCourseExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                                                }}>▶</span>
                                                                <div>
                                                                    <p style={{ fontWeight: 600, fontSize: '0.88rem', color: C.neutral900 }}>📘 {course.title}</p>
                                                                    <p style={{ fontSize: '0.72rem', color: C.textSec }}>{course.lesson_count || 0} lesson · /{course.slug}</p>
                                                                </div>
                                                            </button>
                                                            <button onClick={() => startEdit('course', course)}
                                                                className="btn" style={{
                                                                    padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600,
                                                                    background: C.neutral100, border: `1px solid ${C.borderLight}`,
                                                                    borderRadius: 8, cursor: 'pointer', color: C.primary600,
                                                                }}>
                                                                ✏️ Edit
                                                            </button>
                                                        </div>

                                                        {/* Lessons under course */}
                                                        {isCourseExpanded && (
                                                            <div style={{ background: C.neutral50 }}>
                                                                {!detail ? (
                                                                    <div style={{ padding: '12px 52px' }}>
                                                                        <div className="skeleton" style={{ height: 32, borderRadius: 6, marginBottom: 6 }} />
                                                                        <div className="skeleton" style={{ height: 32, borderRadius: 6 }} />
                                                                    </div>
                                                                ) : lessons.length === 0 ? (
                                                                    <div style={{ padding: '14px 52px', fontSize: '0.8rem', color: C.textSec }}>
                                                                        Belum ada lesson di course ini
                                                                    </div>
                                                                ) : (
                                                                    lessons.map(lesson => (
                                                                        <div key={lesson.id} style={{
                                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                                            padding: '10px 20px 10px 60px',
                                                                            borderTop: `1px solid ${C.borderLight}`,
                                                                        }}>
                                                                            <span style={{ fontSize: '0.82rem' }}>
                                                                                {lesson.content_type === 'video' ? '🎬' : lesson.content_type === 'interactive' ? '🎮' : '📝'}
                                                                            </span>
                                                                            <p style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, color: C.neutral900 }}>
                                                                                {lesson.title}
                                                                            </p>
                                                                            <button onClick={() => {
                                                                                // Load full lesson data for editing (needs content_body)
                                                                                api.getLesson(lesson.id).then(r => {
                                                                                    if (r?.success) startEdit('lesson', r.data);
                                                                                });
                                                                            }}
                                                                                className="btn" style={{
                                                                                    padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600,
                                                                                    background: 'transparent', border: `1px solid ${C.borderLight}`,
                                                                                    borderRadius: 6, cursor: 'pointer', color: C.primary600,
                                                                                }}>
                                                                                ✏️ Edit
                                                                            </button>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Reusable FormField ───────────────────────────────────────────
function FormField({ label, hint, children }) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {children}
            {hint && <span style={{ fontSize: '0.78rem', color: C.textSec, marginTop: 2 }}>💡 {hint}</span>}
        </div>
    );
}

// ── Media Uploader ───────────────────────────────────────────────
function MediaUploader() {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Simulate progress while uploading
    useEffect(() => {
        let timer;
        if (uploading) {
            setProgress(0);
            let p = 0;
            timer = setInterval(() => {
                p += Math.random() * 15;
                if (p >= 90) p = 90;
                setProgress(Math.round(p));
            }, 300);
        }
        return () => clearInterval(timer);
    }, [uploading]);

    const handleUpload = async e => {
        e.preventDefault();
        if (!file) return;
        setUploading(true); setError(''); setResult(null);
        try {
            const res = await api.uploadMedia(file);
            setProgress(100);
            if (res?.success) { setResult(res.data); }
            else { setError(res?.error || 'Upload gagal'); }
        } catch { setError('Terjadi kesalahan jaringan atau file terlalu besar.'); }
        finally { setUploading(false); }
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(result.cdn_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDrop = e => {
        e.preventDefault(); setDragging(false);
        if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
    };

    const fileTypeIcon = f => {
        if (!f) return '📁';
        if (f.type.startsWith('video')) return '🎬';
        if (f.type.startsWith('image')) return '🖼️';
        return '📄';
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
            {/* Upload Area */}
            <div className="card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: C.neutral900, marginBottom: 6 }}>
                    🎬 Upload Media Asset
                </h2>
                <p style={{ color: C.textSec, fontSize: '0.875rem', marginBottom: 24 }}>
                    Upload video, gambar, atau PDF ke object storage (S3/MinIO).
                </p>

                <form onSubmit={handleUpload}>
                    {/* Drop Zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('media-file-input').click()}
                        style={{
                            border: `2px dashed ${dragging || file ? C.primary500 : C.borderLight}`,
                            borderRadius: 16, padding: '40px 24px', textAlign: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            background: dragging ? C.primary50 : file ? '#f0fdfb' : C.neutral50,
                            position: 'relative',
                        }}>
                        <input id="media-file-input" type="file" onChange={e => setFile(e.target.files[0])}
                            accept="video/mp4,video/webm,image/jpeg,image/png,application/pdf"
                            style={{ display: 'none' }} />

                        <div style={{ fontSize: 48, marginBottom: 12 }}>{fileTypeIcon(file)}</div>

                        {file ? (
                            <>
                                <p style={{ fontWeight: 700, fontSize: '1rem', color: C.neutral900 }}>{file.name}</p>
                                <p style={{ fontSize: '0.875rem', color: C.primary600, fontWeight: 600, marginTop: 4 }}>
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                                    style={{ marginTop: 12, background: 'none', border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer', color: C.textSec }}>
                                    Ganti file
                                </button>
                            </>
                        ) : (
                            <>
                                <p style={{ fontWeight: 700, fontSize: '1rem', color: C.neutral900 }}>
                                    Klik atau drag &amp; drop file di sini
                                </p>
                                <p style={{ fontSize: '0.8rem', color: C.textSec, marginTop: 6 }}>
                                    MP4 · WebM · JPG · PNG · PDF (maks. 2GB)
                                </p>
                            </>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {uploading && (
                        <div style={{ marginTop: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.textSec, marginBottom: 6 }}>
                                <span>Mengupload...</span><span>{progress}%</span>
                            </div>
                            <div style={{ height: 8, background: C.neutral200, borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${C.primary400 ?? C.primary500}, ${C.primary600})`, borderRadius: 99, transition: 'width 0.3s ease' }} />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ marginTop: 16, padding: '12px 16px', background: C.errorBg, color: C.errorText, borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', border: `1px solid #fca5a5` }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-full" disabled={!file || uploading}
                        style={{ marginTop: 20, width: '100%', padding: '13px 0', fontSize: '0.95rem' }}>
                        {uploading ? 'Mengupload...' : '⬆ Upload ke Storage'}
                    </button>
                </form>
            </div>

            {/* Result / Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {result ? (
                    <div className="card" style={{ padding: 24, border: `1.5px solid #86efac`, background: C.successBg }}>
                        <h3 style={{ fontWeight: 800, color: C.successText, marginBottom: 16, fontSize: '1rem' }}>✅ Upload Berhasil!</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                            <InfoRow label="Nama" value={result.file_name} />
                            <InfoRow label="Tipe" value={result.file_type} />
                            <InfoRow label="Ukuran" value={result.file_size ? `${(result.file_size / 1024 / 1024).toFixed(2)} MB` : '—'} />
                        </div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: C.successText, marginTop: 16, marginBottom: 6 }}>CDN URL (paste ke form Lesson):</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input readOnly value={result.cdn_url ?? ''} className="form-input"
                                style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'monospace', background: C.white, padding: '8px 10px' }} />
                            <button type="button" onClick={copyUrl} className="btn btn-secondary btn-sm" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                                {copied ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontWeight: 700, color: C.neutral900, marginBottom: 12, fontSize: '0.95rem' }}>📋 Cara pakai</h3>
                    {[
                        ['1', 'Upload file', 'Pilih video/gambar/PDF, lalu klik tombol upload.'],
                        ['2', 'Copy CDN URL', 'Salin URL yang muncul di panel hasil upload.'],
                        ['3', 'Paste ke Lesson', 'Buka tab Courses, pilih tipe Video, paste URL.'],
                    ].map(([num, title, desc]) => (
                        <div key={num} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                            <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${C.primary500},${C.primary700})`, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>{num}</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: C.neutral900 }}>{title}</div>
                                <div style={{ fontSize: '0.8rem', color: C.textSec, marginTop: 2 }}>{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: C.textSec, minWidth: 60 }}>{label}:</span>
            <span style={{ fontWeight: 600, color: C.neutral900, wordBreak: 'break-all' }}>{value}</span>
        </div>
    );
}

// ── Exam Placeholder ─────────────────────────────────────────────
function ExamPlaceholder() {
    return (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏗️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.neutral900, marginBottom: 8 }}>Exam Builder</h2>
            <p style={{ color: C.textSec, maxWidth: 400, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Fitur pembuat soal ujian akan tersedia di <strong>Phase 2</strong>. Anda akan bisa membuat bank soal, set timer, dan kelola bank soal pilihan ganda & esai.
            </p>
            <div style={{
                marginTop: 24, display: 'inline-block', padding: '8px 20px', borderRadius: 99,
                background: C.primary50, color: C.primary700, fontWeight: 700, fontSize: '0.8rem'
            }}>
                Segera Hadir • Phase 2
            </div>
        </div>
    );
}
