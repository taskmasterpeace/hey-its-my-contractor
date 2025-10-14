"use client";

import { useState } from "react";
import { ResearchResult } from "@contractor-platform/types";
import {
  ExternalLink,
  Save,
  Copy,
  Share2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ResearchResultsProps {
  result: ResearchResult;
  onSave: (
    result: ResearchResult,
    tags: string[],
    notes?: string,
    isPrivate?: boolean
  ) => void;
  onRelatedQuery: (query: string, type?: string) => void;
}

export function ResearchResults({
  result,
  onSave,
  onRelatedQuery,
}: ResearchResultsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNotes, setSaveNotes] = useState("");
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSave = () => {
    onSave(result, saveTags, saveNotes.trim() || undefined, isPrivate);
    setShowSaveDialog(false);
    setSaveNotes("");
    setSaveTags([]);
    setIsPrivate(false);
  };

  const addTag = () => {
    if (newTag.trim() && !saveTags.includes(newTag.trim())) {
      setSaveTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSaveTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const getSourceFavicon = (domain: string) => {
    return `https://www.google.com/s2/favicons?sz=16&domain=${domain}`;
  };

  const formatConfidence = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    const color =
      percentage >= 85
        ? "text-green-600"
        : percentage >= 70
        ? "text-yellow-600"
        : "text-red-600";
    return { percentage, color };
  };

  const { percentage: confidencePercent, color: confidenceColor } =
    formatConfidence(result.confidence);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 truncate">
              &ldquo;{result.query}&rdquo;
            </p>
          </div>
          <div className="flex items-center space-x-3 ml-4">
            <div className={`text-xs font-medium ${confidenceColor}`}>
              {confidencePercent}% confidence
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">Copy</span>
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center space-x-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors border border-purple-200"
                title="Save research"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Answer */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800 prose-li:text-gray-800">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg text-sm"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => (
                <h1 className="text-xl font-bold text-gray-900 mb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 mb-4">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-800">{children}</li>
              ),
              p: ({ children }) => (
                <p className="text-gray-800 leading-relaxed mb-3">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">
                  {children}
                </strong>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {children}
                </a>
              ),
            }}
          >
            {result.answer}
          </ReactMarkdown>
        </div>
      </div>

      {/* Copy Success Message */}
      {copied && (
        <div className="absolute top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
          Copied to clipboard!
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Save Research
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {saveTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    placeholder="Add tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="Add personal notes or context..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sharing & Privacy
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">
                        Share with project members
                      </div>
                      <div className="text-xs text-gray-500">
                        All team members can view this research
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">
                        Keep private
                      </div>
                      <div className="text-xs text-gray-500">
                        Only you can view this research
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Save className="w-4 h-4" />
                <span>Save Research</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
