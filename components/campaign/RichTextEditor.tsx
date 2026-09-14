import React, { useRef, useState } from 'react';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import { improveCopyWithGemini } from '../../services/geminiService';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.476-1.476L12 18.75l1.938-.648a2.25 2.25 0 011.476-1.476L17.25 15l.648 1.938a2.25 2.25 0 011.476 1.476L21 18.75l-1.938.648a2.25 2.25 0 01-1.476 1.476z" />
  </svg>
);

const PERSONALIZATION_TAGS = [
  { label: 'Full Name', tag: '{{name}}', desc: "Insert contact's full name" },
  { label: 'First Name', tag: '{{first_name}}', desc: "Insert contact's first name" },
  { label: 'Company', tag: '{{company}}', desc: "Insert contact's organization" },
  { label: 'Email', tag: '{{email}}', desc: "Insert contact's email address" },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ label, value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [draggedTag, setDraggedTag] = useState<string | null>(null);

  const wrapText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = `${value.substring(0, start)}${before}${selectedText}${after}${value.substring(end)}`;
    onChange(newText);

    textarea.focus();
    setTimeout(() => {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = end + before.length;
    }, 0);
  };
  
  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = `${value.substring(0, start)}${placeholder}${value.substring(end)}`;
    onChange(newText);

    textarea.focus();
    setTimeout(() => {
      const newCursorPos = start + placeholder.length;
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
    }, 0);
  };

  const handleDragStart = (e: React.DragEvent, tag: string) => {
    e.dataTransfer.setData('text/plain', tag);
    setDraggedTag(tag);
  };

  const handleDragEnd = () => {
    setDraggedTag(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const tag = e.dataTransfer.getData('text/plain') || draggedTag;
    if (!tag) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    // Get drop position if supported or insert at cursor
    const start = textarea.selectionStart ?? value.length;
    const newText = `${value.substring(0, start)}${tag}${value.substring(start)}`;
    onChange(newText);

    textarea.focus();
    setTimeout(() => {
      const newCursorPos = start + tag.length;
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
    }, 0);
  };

  const handleAiAction = async (action: 'improve' | 'shorter' | 'persuasive' | 'casual' | 'formal' | 'fix_grammar') => {
    if (!value.trim()) {
      return;
    }
    setIsImproving(true);
    setAiMessage(null);
    try {
      const result = await improveCopyWithGemini({
        currentText: value,
        action,
      });
      if (result.improvedText) {
        onChange(result.improvedText);
        setAiMessage(result.summaryOfChanges || 'Copy polished successfully!');
        setTimeout(() => setAiMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Failed to improve copy with Gemini:', err);
      setAiMessage('Could not connect to Gemini AI. Check API configuration.');
      setTimeout(() => setAiMessage(null), 4000);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">{label}</label>
        </div>
        {aiMessage && (
          <span className="text-xs text-[#0b7b50] dark:text-emerald-400 animate-fade-in font-medium px-2 py-0.5 rounded-full bg-[#e7f7f0] dark:bg-emerald-950/60">
            {aiMessage}
          </span>
        )}
      </div>

      {/* Personalization Tags Bar */}
      <div className="flex items-center gap-2 flex-wrap py-2 px-3 bg-slate-50 dark:bg-[#11161f] border border-slate-200/70 dark:border-gray-800 rounded-xl">
        <span className="text-[11px] font-medium text-gray-400 shrink-0">
          Tags:
        </span>
        {PERSONALIZATION_TAGS.map(({ label: tagLabel, tag, desc }) => (
          <button
            key={tag}
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, tag)}
            onDragEnd={handleDragEnd}
            onClick={() => insertPlaceholder(tag)}
            title={`${desc} (Drag into editor or click to insert)`}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#18202c] border border-emerald-200/80 dark:border-emerald-900/50 text-[#0b7b50] dark:text-emerald-300 shadow-xs hover:border-[#0b7b50] hover:bg-[#e7f7f0] dark:hover:bg-emerald-950/40 cursor-grab active:cursor-grabbing transition-all hover:scale-105 active:scale-95"
          >
            <span>{tag}</span>
            <span className="text-[10px] text-gray-400 font-normal">({tagLabel})</span>
          </button>
        ))}
      </div>

      {/* Editor Box */}
      <div className="bg-white dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0b7b50] transition-all">
        {/* Formatting Toolbar */}
        <div className="p-2.5 bg-slate-50/70 dark:bg-[#151c27] border-b border-slate-200/70 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => wrapText('**', '**')}
              className="px-2.5 py-1 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg font-bold border border-transparent hover:border-slate-200 dark:hover:border-gray-700 transition-colors"
              title="Bold (**text**)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => wrapText('*', '*')}
              className="px-2.5 py-1 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg italic border border-transparent hover:border-slate-200 dark:hover:border-gray-700 transition-colors"
              title="Italic (*text*)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => wrapText('### ', '\n')}
              className="px-2.5 py-1 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg font-semibold border border-transparent hover:border-slate-200 dark:hover:border-gray-700 transition-colors"
              title="Heading"
            >
              H
            </button>
            <button
              type="button"
              onClick={() => wrapText('> ', '\n')}
              className="px-2.5 py-1 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-gray-700 transition-colors"
              title="Quote"
            >
              &ldquo;&rdquo;
            </button>
          </div>

          <div className="flex items-center">
            <Dropdown
              trigger={
                <button 
                  type="button" 
                  disabled={isImproving || !value.trim()}
                  className="px-3 py-1 text-xs font-semibold text-[#0b7b50] dark:text-emerald-300 bg-[#e7f7f0] dark:bg-emerald-950/60 hover:bg-[#d8f3e5] dark:hover:bg-emerald-900/60 border border-emerald-200/70 dark:border-emerald-900/50 rounded-full flex items-center transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <SparklesIcon className={`h-3.5 w-3.5 mr-1.5 ${isImproving ? 'animate-spin' : ''}`} />
                  {isImproving ? 'Polishing Copy...' : 'AI Copy Assistant'}
                </button>
              }
            >
              <DropdownItem onClick={() => handleAiAction('improve')}>
                ✨ Polish & Enhance Clarity
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('persuasive')}>
                🎯 Make High-Converting &amp; Persuasive
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('shorter')}>
                ⚡ Make Concise &amp; Punchy
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('casual')}>
                💬 Make Friendly &amp; Conversational
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('formal')}>
                👔 Make Formal &amp; Corporate
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('fix_grammar')}>
                ✓ Fix Grammar &amp; Wording
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="w-full h-56 bg-transparent p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-y leading-relaxed font-sans"
          placeholder="Hi {{name}},&#10;&#10;I noticed the great work you are doing at {{company}}..."
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
