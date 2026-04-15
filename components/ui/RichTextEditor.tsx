"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import { useEffect } from "react"

// ── Toolbar button ────────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
        active
          ? "bg-[#C07C0A] text-white"
          : "text-[#6B6560] hover:bg-[#F5F4F1] hover:text-[#1A1916]"
      }`}
    >
      {children}
    </button>
  )
}

// ── Icon helpers ──────────────────────────────────────────────────────────────

const Ico = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

// ── Editor ────────────────────────────────────────────────────────────────────

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write article content here…",
  minHeight = 300,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#0474C4] underline" } }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "outline-none prose prose-sm max-w-none text-[#1A1916] text-[13px] leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML())
    },
  })

  // Sync external value changes (e.g. when editing an existing insight)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current && !(editor.isEmpty && !value)) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="border border-[#E5E2DC] rounded-[10px] overflow-hidden focus-within:border-[#C07C0A] transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-[#E5E2DC] bg-[#FAFAF9]">
        {/* Headings */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <span className="text-[11px] font-bold leading-none">H1</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <span className="text-[11px] font-bold leading-none">H2</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <span className="text-[11px] font-bold leading-none">H3</span>
        </ToolbarBtn>

        <span className="w-px h-4 bg-[#E5E2DC] mx-1" />

        {/* Marks */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Ico d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </ToolbarBtn>

        <span className="w-px h-4 bg-[#E5E2DC] mx-1" />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2 2"/>
          </svg>
        </ToolbarBtn>

        <span className="w-px h-4 bg-[#E5E2DC] mx-1" />

        {/* Extras */}
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Horizontal rule">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="px-4 py-3 [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-[#A8A39C] [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  )
}
