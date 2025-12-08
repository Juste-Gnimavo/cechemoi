'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre contenu...',
  className = '',
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      [{ color: [] }, { background: [] }],
      ['clean'],
    ],
  }

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'align',
    'link',
    'image',
    'blockquote',
    'code-block',
    'color',
    'background',
  ]

  if (!mounted) {
    return (
      <div className={`min-h-[300px] rounded-lg border border-gray-200 dark:border-dark-700 bg-gray-100 dark:bg-dark-900 ${className}`}>
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-500">Chargement de l'éditeur...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <style jsx global>{`
        /* Light mode styles for Quill editor */
        .rich-text-editor-wrapper .quill {
          background: rgb(249 250 251);
          border: 1px solid rgb(229 231 235);
          border-radius: 0.5rem;
        }

        .rich-text-editor-wrapper .ql-toolbar {
          background: rgb(243 244 246);
          border: none;
          border-bottom: 1px solid rgb(229 231 235);
          border-radius: 0.5rem 0.5rem 0 0;
        }

        .rich-text-editor-wrapper .ql-container {
          border: none;
          font-size: 16px;
          min-height: 300px;
          color: rgb(17 24 39);
        }

        .rich-text-editor-wrapper .ql-editor {
          min-height: 300px;
          color: rgb(17 24 39);
        }

        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: rgb(107 114 128);
          font-style: normal;
        }

        .rich-text-editor-wrapper .ql-stroke {
          stroke: rgb(75 85 99);
        }

        .rich-text-editor-wrapper .ql-fill {
          fill: rgb(75 85 99);
        }

        .rich-text-editor-wrapper .ql-picker-label {
          color: rgb(75 85 99);
        }

        .rich-text-editor-wrapper .ql-picker-options {
          background: rgb(255 255 255);
          border: 1px solid rgb(229 231 235);
        }

        .rich-text-editor-wrapper .ql-picker-item:hover {
          background: rgb(243 244 246);
          color: rgb(17 24 39);
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover,
        .rich-text-editor-wrapper .ql-toolbar button:focus {
          background: rgb(229 231 235);
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active {
          background: rgb(59 130 246);
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #fff;
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #fff;
        }

        /* Dark mode styles for Quill editor */
        .dark .rich-text-editor-wrapper .quill {
          background: rgb(17 24 39);
          border: 1px solid rgb(55 65 81);
        }

        .dark .rich-text-editor-wrapper .ql-toolbar {
          background: rgb(31 41 55);
          border-bottom: 1px solid rgb(55 65 81);
        }

        .dark .rich-text-editor-wrapper .ql-container {
          color: #fff;
        }

        .dark .rich-text-editor-wrapper .ql-editor {
          color: #fff;
        }

        .dark .rich-text-editor-wrapper .ql-stroke {
          stroke: rgb(156 163 175);
        }

        .dark .rich-text-editor-wrapper .ql-fill {
          fill: rgb(156 163 175);
        }

        .dark .rich-text-editor-wrapper .ql-picker-label {
          color: rgb(156 163 175);
        }

        .dark .rich-text-editor-wrapper .ql-picker-options {
          background: rgb(31 41 55);
          border: 1px solid rgb(55 65 81);
        }

        .dark .rich-text-editor-wrapper .ql-picker-item:hover {
          background: rgb(55 65 81);
          color: #fff;
        }

        .dark .rich-text-editor-wrapper .ql-toolbar button:hover,
        .dark .rich-text-editor-wrapper .ql-toolbar button:focus {
          background: rgb(55 65 81);
        }

        /* Styles for the content */
        .rich-text-editor-wrapper .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }

        .rich-text-editor-wrapper .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }

        .rich-text-editor-wrapper .ql-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }

        .rich-text-editor-wrapper .ql-editor p {
          margin-bottom: 1em;
        }

        .rich-text-editor-wrapper .ql-editor ul,
        .rich-text-editor-wrapper .ql-editor ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }

        .rich-text-editor-wrapper .ql-editor blockquote {
          border-left: 4px solid rgb(59 130 246);
          padding-left: 1em;
          margin-left: 0;
          margin-bottom: 1em;
          color: rgb(107 114 128);
        }

        .dark .rich-text-editor-wrapper .ql-editor blockquote {
          color: rgb(209 213 219);
        }

        .rich-text-editor-wrapper .ql-editor code {
          background: rgb(243 244 246);
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-family: monospace;
        }

        .dark .rich-text-editor-wrapper .ql-editor code {
          background: rgb(31 41 55);
        }

        .rich-text-editor-wrapper .ql-editor pre {
          background: rgb(243 244 246);
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1em;
        }

        .dark .rich-text-editor-wrapper .ql-editor pre {
          background: rgb(31 41 55);
        }

        .rich-text-editor-wrapper .ql-editor a {
          color: rgb(59 130 246);
          text-decoration: underline;
        }

        .rich-text-editor-wrapper .ql-editor img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }
      `}</style>

      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  )
}
