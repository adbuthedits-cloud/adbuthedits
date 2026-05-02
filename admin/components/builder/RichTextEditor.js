"use client";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // Import styles

// Dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link'
];

export default function RichTextEditor({ value, onChange }) {
    return (
        <div className="bg-white">
            <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={onChange}
                modules={modules}
                formats={formats}
                className="h-full"
            />
            {/* Custom overrides for Quill inside admin dark theme context if needed, but here it's inside a white container */}
            <style jsx global>{`
                .ql-container {
                    font-family: inherit;
                    font-size: 1rem;
                    min-height: 150px;
                }
                .ql-editor {
                    min-height: 150px;
                }
            `}</style>
        </div>
    );
}
