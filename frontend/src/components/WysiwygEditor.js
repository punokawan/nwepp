'use client';
import { useRef, useEffect, useCallback, useState } from 'react';

const C = {
    primary500: '#00b4a3',
    primary600: '#009e90',
    primary50: '#e6f7f5',
    primary100: '#b3e8e3',
    neutral50: '#fafafa',
    neutral100: '#f5f5f5',
    neutral200: '#e5e5e5',
    neutral700: '#404040',
    neutral900: '#171717',
    textSec: '#525252',
    borderLight: '#e5e5e5',
    white: '#ffffff',
};

const TOOLBAR = [
    { cmd: 'bold', icon: 'B', title: 'Bold', style: { fontWeight: 800 } },
    { cmd: 'italic', icon: 'I', title: 'Italic', style: { fontStyle: 'italic' } },
    { cmd: 'underline', icon: 'U', title: 'Underline', style: { textDecoration: 'underline' } },
    { type: 'sep' },
    { cmd: 'formatBlock', arg: 'h2', icon: 'H2', title: 'Heading 2' },
    { cmd: 'formatBlock', arg: 'h3', icon: 'H3', title: 'Heading 3' },
    { cmd: 'formatBlock', arg: 'p', icon: '¶', title: 'Paragraph' },
    { type: 'sep' },
    { cmd: 'insertUnorderedList', icon: '• —', title: 'Bullet list' },
    { cmd: 'insertOrderedList', icon: '1.', title: 'Numbered list' },
    { type: 'sep' },
    { cmd: 'createLink', icon: '🔗', title: 'Insert link', prompt: 'URL:' },
    { cmd: 'insertImage', icon: '🖼', title: 'Insert image URL', prompt: 'Image URL:' },
    { type: 'sep' },
    { cmd: 'removeFormat', icon: '✕', title: 'Clear formatting' },
];

export default function WysiwygEditor({ value, onChange, placeholder = 'Tulis konten lesson di sini...' }) {
    const editorRef = useRef(null);
    const pendingHtml = useRef(null); // used to restore content after HTML→Preview toggle
    const [activeCommands, setActiveCommands] = useState({});
    const [showHtml, setShowHtml] = useState(false);
    const [htmlValue, setHtmlValue] = useState('');

    // Init content once on first mount
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, []); // eslint-disable-line

    // After switching BACK to WYSIWYG (showHtml → false), restore HTML into the editor.
    // We do this in an effect because the contenteditable div doesn't exist in the DOM
    // until AFTER React re-renders with showHtml=false.
    useEffect(() => {
        if (!showHtml && pendingHtml.current !== null && editorRef.current) {
            editorRef.current.innerHTML = pendingHtml.current;
            onChange?.(pendingHtml.current);
            pendingHtml.current = null;
        }
    }, [showHtml]); // eslint-disable-line

    const updateActiveStates = useCallback(() => {
        try {
            const states = {};
            ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'].forEach(cmd => {
                states[cmd] = document.queryCommandState(cmd);
            });
            setActiveCommands(states);
        } catch { }
    }, []);

    const handleInput = useCallback(() => {
        onChange?.(editorRef.current?.innerHTML ?? '');
        updateActiveStates();
    }, [onChange, updateActiveStates]);

    const execCmd = useCallback((cmd, arg) => {
        editorRef.current?.focus();
        if (arg !== undefined) {
            document.execCommand(cmd, false, arg);
        } else {
            document.execCommand(cmd, false, null);
        }
        handleInput();
    }, [handleInput]);

    const handleToolbarClick = useCallback((btn, e) => {
        e.preventDefault();
        if (btn.prompt) {
            const val = window.prompt(btn.prompt);
            if (val) execCmd(btn.cmd, val);
        } else {
            execCmd(btn.cmd, btn.arg);
        }
    }, [execCmd]);

    const toggleHtml = () => {
        if (!showHtml) {
            // WYSIWYG → HTML: capture current innerHTML
            setHtmlValue(editorRef.current?.innerHTML ?? '');
            setShowHtml(true);
        } else {
            // HTML → WYSIWYG: store edited HTML in ref, then trigger re-render.
            // The useEffect above will apply it once contenteditable div exists.
            pendingHtml.current = htmlValue;
            setShowHtml(false);
        }
    };

    return (
        <div style={{
            border: `1.5px solid ${C.borderLight}`,
            borderRadius: 12,
            overflow: 'hidden',
            background: C.white,
            transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
            onFocus={e => {
                e.currentTarget.style.borderColor = C.primary500;
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,163,0.12)';
            }}
            onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    e.currentTarget.style.borderColor = C.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                }
            }}
        >
            {/* Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2,
                padding: '6px 10px',
                background: C.neutral50,
                borderBottom: `1px solid ${C.borderLight}`,
            }}>
                {TOOLBAR.map((btn, i) => {
                    if (btn.type === 'sep') return (
                        <div key={i} style={{ width: 1, height: 20, background: C.neutral200, margin: '0 4px' }} />
                    );
                    const isActive = activeCommands[btn.cmd];
                    return (
                        <button
                            key={i}
                            type="button"
                            title={btn.title}
                            onMouseDown={e => handleToolbarClick(btn, e)}
                            style={{
                                padding: '4px 8px', borderRadius: 6, border: 'none',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                                minWidth: 28, height: 28,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s',
                                background: isActive ? C.primary100 : 'transparent',
                                color: isActive ? C.primary600 : C.neutral700,
                                ...(btn.style ?? {}),
                            }}
                        >
                            {btn.icon}
                        </button>
                    );
                })}

                {/* HTML Toggle */}
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        type="button"
                        onClick={toggleHtml}
                        title={showHtml ? 'Preview' : 'Edit HTML'}
                        style={{
                            padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.borderLight}`,
                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            background: showHtml ? C.primary50 : C.white,
                            color: showHtml ? C.primary600 : C.textSec,
                            transition: 'all 0.15s',
                        }}
                    >
                        {showHtml ? '👁 Preview' : '</> HTML'}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            {showHtml ? (
                <textarea
                    value={htmlValue}
                    onChange={e => setHtmlValue(e.target.value)}
                    style={{
                        width: '100%', minHeight: 280, padding: '16px 20px',
                        fontFamily: 'JetBrains Mono, Fira Code, monospace',
                        fontSize: '0.8rem', lineHeight: 1.7,
                        border: 'none', outline: 'none', resize: 'vertical',
                        color: C.neutral900, background: '#1a1a2e',
                        color: '#7ec8e3',
                    }}
                />
            ) : (
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyUp={updateActiveStates}
                    onMouseUp={updateActiveStates}
                    data-placeholder={placeholder}
                    style={{
                        minHeight: 280, padding: '16px 20px',
                        outline: 'none',
                        fontSize: '0.95rem', lineHeight: 1.8,
                        color: C.neutral900,
                    }}
                />
            )}

            {/* Char count */}
            <div style={{
                padding: '6px 16px',
                borderTop: `1px solid ${C.borderLight}`,
                background: C.neutral50,
                fontSize: '0.72rem', color: C.textSec,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <span>Format: Rich Text (HTML)</span>
                <span>Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline</span>
            </div>
        </div>
    );
}
