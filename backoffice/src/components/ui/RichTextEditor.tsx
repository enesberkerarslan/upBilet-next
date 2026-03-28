'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Heading2,
  Pilcrow,
} from 'lucide-react';

function Toolbar({ editor }: { editor: Editor | null }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed?.isActive('bold') ?? false,
      italic: ed?.isActive('italic') ?? false,
      underline: ed?.isActive('underline') ?? false,
      strike: ed?.isActive('strike') ?? false,
      bulletList: ed?.isActive('bulletList') ?? false,
      orderedList: ed?.isActive('orderedList') ?? false,
      blockquote: ed?.isActive('blockquote') ?? false,
      link: ed?.isActive('link') ?? false,
      h2: ed?.isActive('heading', { level: 2 }) ?? false,
    }),
  });

  if (!editor) return null;

  const btn =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40';
  const active = 'bg-indigo-100 text-indigo-800 border-indigo-200';

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Bağlantı URL (https://...)', prev ?? 'https://');
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-1.5 py-1.5 rounded-t-lg">
      <button
        type="button"
        className={`${btn} ${state?.bold ? active : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        title="Kalın"
      >
        <Bold size={16} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className={`${btn} ${state?.italic ? active : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        title="İtalik"
      >
        <Italic size={16} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className={`${btn} ${state?.underline ? active : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Altı çizili"
      >
        <UnderlineIcon size={16} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className={`${btn} ${state?.strike ? active : ''}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Üstü çizili"
      >
        <Strikethrough size={16} strokeWidth={2.25} />
      </button>
      <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden />
      <button
        type="button"
        className={`${btn} ${state?.h2 ? active : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Başlık 2"
      >
        <Heading2 size={16} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => editor.chain().focus().setParagraph().run()}
        title="Paragraf"
      >
        <Pilcrow size={16} strokeWidth={2.25} />
      </button>
      <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden />
      <button type="button" className={`${btn} ${state?.link ? active : ''}`} onClick={setLink} title="Bağlantı ekle / düzenle">
        <Link2 size={16} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!state?.link}
        title="Bağlantıyı kaldır"
      >
        <Link2Off size={16} strokeWidth={2.25} />
      </button>
      <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden />
      <button
        type="button"
        className={`${btn} ${state?.bulletList ? active : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Madde işaretli liste"
      >
        <List size={16} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className={`${btn} ${state?.orderedList ? active : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numaralı liste"
      >
        <ListOrdered size={16} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className={`${btn} ${state?.blockquote ? active : ''}`}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Alıntı"
      >
        <Quote size={16} strokeWidth={2.25} />
      </button>
      <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden />
      <button
        type="button"
        className={btn}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Geri al"
      >
        <Undo2 size={16} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Yinele"
      >
        <Redo2 size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Editor’ü sıfırlamak için (modal kayıt değişince) benzersiz anahtar */
  resetKey: string;
  label?: string;
  disabled?: boolean;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Yazın...',
  resetKey,
  label,
  disabled = false,
  minHeight = 'min-h-[200px]',
}: RichTextEditorProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: { class: 'text-indigo-600 underline' },
        }),
        Placeholder.configure({ placeholder }),
      ],
      content: value || '',
      editable: !disabled,
      editorProps: {
        attributes: {
          class: `prose-mirror-content px-3 py-2 text-sm text-gray-900 ${minHeight} max-w-none focus:outline-none`,
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
    },
    [resetKey]
  );

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // Form state bir frame sonra gelince Tiptap boş kalabiliyordu; dış value ile eşitle
  useEffect(() => {
    if (!editor) return;
    const next = value || '';
    const current = editor.getHTML();
    if (next === current) return;
    if (!next.trim() && editor.isEmpty) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  return (
    <div>
      {label ? <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label> : null}
      <div className={`rich-text-editor rounded-lg border border-gray-300 bg-white overflow-hidden ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <Toolbar editor={editor} />
        <EditorContent editor={editor} className="rich-text-editor-content" />
      </div>
    </div>
  );
}
