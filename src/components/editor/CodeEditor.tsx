'use client';

import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'html' | 'css' | 'javascript';
  isDark?: boolean;
  readOnly?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  isDark = false,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Language extension
    const languageExtension =
      language === 'html' ? html() :
      language === 'css' ? css() :
      javascript();

    // Theme
    const theme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: isDark ? '#18181b' : '#ffffff',
      },
      '.cm-content': {
        caretColor: isDark ? '#ffffff' : '#000000',
        color: isDark ? '#fafafa' : '#27272a',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: isDark ? '#ffffff' : '#000000',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: isDark ? '#27272a' : '#e4e4e7',
      },
      '.cm-activeLine': {
        backgroundColor: isDark ? '#27272a' : '#f4f4f5',
      },
      '.cm-gutters': {
        backgroundColor: isDark ? '#18181b' : '#fafafa',
        color: isDark ? '#71717a' : '#a1a1aa',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: isDark ? '#27272a' : '#e4e4e7',
      },
    }, { dark: isDark });

    // Create editor state
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        languageExtension,
        theme,
        EditorView.editable.of(!readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // Cleanup
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, isDark, readOnly]); // Recreate editor when language/theme changes

  // Update content when value prop changes externally
  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value,
          },
        });
      }
    }
  }, [value]);

  return <div ref={editorRef} className="h-full overflow-auto" />;
}
