import React, { useRef, useState } from 'react';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import { improveCopyWithGemini } from '../../services/geminiService';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const UserIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const OfficeBuildingIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-1-4h1" /></svg>;
const TagIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;
const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.476-1.476L12 18.75l1.938-.648a2.25 2.25 0 011.476-1.476L17.25 15l.648 1.938a2.25 2.25 0 011.476 1.476L21 18.75l-1.938.648a2.25 2.25 0 01-1.476 1.476z" />
  </svg>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({ label, value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

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
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {aiMessage && (
          <span className="text-xs text-brand-600 dark:text-brand-400 animate-fade-in font-medium">
            ✨ {aiMessage}
          </span>
        )}
      </div>
      <div className="bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md">
        <div className="p-2 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => wrapText('**', '**')} className="px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-bold" title="Bold">B</button>
            <button type="button" onClick={() => wrapText('*', '*')} className="px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded italic" title="Italic">I</button>
            <Dropdown
              trigger={
                  <button type="button" className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      Personalize
                  </button>
              }
            >
              <DropdownItem icon={<UserIcon className="h-5 w-5" />} onClick={() => insertPlaceholder('{{name}}')}>
                Recipient Name
              </DropdownItem>
              <DropdownItem icon={<OfficeBuildingIcon className="h-5 w-5" />} onClick={() => insertPlaceholder('{{company}}')}>
                Recipient Company
              </DropdownItem>
            </Dropdown>
          </div>

          <div className="flex items-center">
            <Dropdown
              trigger={
                <button 
                  type="button" 
                  disabled={isImproving || !value.trim()}
                  className="px-2.5 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-800 rounded flex items-center transition-colors disabled:opacity-50"
                >
                  <SparklesIcon className={`h-3.5 w-3.5 mr-1.5 ${isImproving ? 'animate-spin' : ''}`} />
                  {isImproving ? 'Gemini Writing...' : 'Gemini AI Assistant'}
                </button>
              }
            >
              <DropdownItem onClick={() => handleAiAction('improve')}>
                ✨ Polish & Enhance Clarity
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('persuasive')}>
                🎯 Make High-Converting & Persuasive
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('shorter')}>
                ⚡ Make Concise & Punchy
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('casual')}>
                💬 Make Friendly & Conversational
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('formal')}>
                👔 Make Formal & Corporate
              </DropdownItem>
              <DropdownItem onClick={() => handleAiAction('fix_grammar')}>
                ✓ Fix Grammar & Wording
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-48 bg-transparent p-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-y"
          placeholder="Type your email content here..."
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
