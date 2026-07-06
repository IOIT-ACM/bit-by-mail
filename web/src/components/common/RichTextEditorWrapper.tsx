import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react'

export const RichTextEditorWrapper: React.FC<{
  value: string
  onChange: (value: string) => void
  onMount?: (editor: any) => void
}> = ({ value, onChange, onMount }) => {
  const isUpdatingRef = useRef(false)
  const initialMount = useRef(true)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (initialMount.current) return
      isUpdatingRef.current = true
      let html = editor.getHTML()
      html = html.replace(/<p><\/p>/g, '<p><br></p>')
      onChange(html)
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 10)
    },
  })

  useEffect(() => {
    initialMount.current = false
  }, [])

  useEffect(() => {
    if (editor && onMount) {
      onMount(editor)
    }
  }, [editor, onMount])

  useEffect(() => {
    if (editor && !isUpdatingRef.current) {
      let currentHtml = editor.getHTML()
      currentHtml = currentHtml.replace(/<p><\/p>/g, '<p><br></p>')
      if (currentHtml !== value) {
        editor.commands.setContent(value)
      }
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)
    if (url === null) {
      return
    }
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#1e1e2a]">
      <style>{`
        .tiptap {
          outline: none;
          height: 100%;
          padding: 1rem;
          color: #FFFFFFE6;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
        }
        .tiptap p { margin-top: 0; margin-bottom: 1em; }
        .tiptap p:empty::before { content: "\\00a0"; }
        .tiptap p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap ul { list-style-type: disc; padding-left: 1.5em; margin-top: 0; margin-bottom: 1em; }
        .tiptap ol { list-style-type: decimal; padding-left: 1.5em; margin-top: 0; margin-bottom: 1em; }
        .tiptap a { color: #3b82f6; text-decoration: underline; cursor: pointer; }
        .tiptap img { max-width: 100%; height: auto; border-radius: 0.375rem; margin-bottom: 1em; }
        .tiptap strong { font-weight: 700; color: #fff; }
        .tiptap em { font-style: italic; }
      `}</style>

      <div className="flex items-center gap-1 p-2 border-b border-borders-primary bg-surface-element shrink-0 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:bg-surface-element-hover hover:text-text-primary'}`}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:bg-surface-element-hover hover:text-text-primary'}`}
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-borders-primary mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:bg-surface-element-hover hover:text-text-primary'}`}
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:bg-surface-element-hover hover:text-text-primary'}`}
        >
          <ListOrdered size={16} />
        </button>
        <div className="w-px h-4 bg-borders-primary mx-1" />
        <button
          onClick={setLink}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('link') ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:bg-surface-element-hover hover:text-text-primary'}`}
        >
          <LinkIcon size={16} />
        </button>
        {editor.isActive('link') && (
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-md text-text-secondary hover:bg-surface-element-hover hover:text-status-danger-text transition-colors"
          >
            <Unlink size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} className="h-full min-h-[200px]" />
      </div>
    </div>
  )
}
