'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, fileContent?: string) => void;
  disabled?: boolean;
  acceptedFileTypes?: string[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ChatInput({
  onSend,
  disabled = false,
  acceptedFileTypes,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input, attachedFile?.content);
      setInput('');
      setAttachedFile(null);
      setFileError(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File too large (max 5MB)');
      return;
    }

    // Read file as text
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        content,
      });
    };
    reader.onerror = () => {
      setFileError('Failed to read file');
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFileError(null);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Build accept string for file input
  const acceptString = acceptedFileTypes?.join(',') || '';
  const showUploadButton = acceptedFileTypes && acceptedFileTypes.length > 0;

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {/* Attached file chip */}
      {attachedFile && (
        <div className="mb-2 flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 max-w-[200px] truncate">
              {attachedFile.name}
            </span>
            <button
              type="button"
              onClick={removeAttachment}
              className="text-blue-400 hover:text-blue-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* File error */}
      {fileError && (
        <div className="mb-2 text-xs text-red-400">
          {fileError}
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* File upload button */}
        {showUploadButton && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptString}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-3 text-[#64748b] hover:text-blue-400 hover:bg-[#1e293b] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Upload file (${acceptedFileTypes.join(', ')})`}
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-xl text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '200px', minHeight: '52px' }}
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
