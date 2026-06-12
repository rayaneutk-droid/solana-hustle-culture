import { useEffect, useMemo, useRef } from 'react'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'

type CodeEditorProps = {
  ariaLabel: string
  language: 'html' | 'css' | 'js'
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ ariaLabel, language, value, onChange }: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const initialValueRef = useRef(value)

  const languageExtension = useMemo(() => {
    if (language === 'html') return html()
    if (language === 'css') return css()
    return javascript()
  }, [language])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      languageExtension,
      oneDark,
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          height: '100%',
          minHeight: '380px',
          backgroundColor: 'transparent',
          borderRadius: '18px',
          overflow: 'hidden',
        },
        '.cm-scroller': {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          fontSize: '13px',
          lineHeight: '1.55',
        },
        '.cm-content': {
          padding: '14px 0',
        },
        '.cm-gutters': {
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
        },
        '.cm-line': {
          padding: '0 14px',
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
      EditorView.contentAttributes.of({
        'aria-label': ariaLabel,
      }),
    ]

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions,
    })
    const view = new EditorView({ state, parent: host })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [ariaLabel, languageExtension])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentValue = view.state.doc.toString()
    if (currentValue === value) return

    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value,
      },
    })
  }, [value])

  return <div className="code-editor-shell" ref={hostRef} />
}
