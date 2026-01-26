import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none"
            components={{
                code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;

                    if (isInline) {
                        return (
                            <code
                                className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-500 dark:text-pink-400 text-xs font-mono"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    }

                    return (
                        <CodeBlock language={match?.[1] || 'text'}>
                            {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                    );
                },
                pre({ children }) {
                    return <>{children}</>;
                },
                p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                    return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                    return <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>;
                },
                li({ children }) {
                    return <li className="text-sm">{children}</li>;
                },
                h1({ children }) {
                    return <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>;
                },
                h2({ children }) {
                    return <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>;
                },
                h3({ children }) {
                    return <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>;
                },
                blockquote({ children }) {
                    return (
                        <blockquote className="border-l-2 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-600 dark:text-gray-400 my-2">
                            {children}
                        </blockquote>
                    );
                },
                a({ href, children }) {
                    return (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 underline"
                        >
                            {children}
                        </a>
                    );
                },
                table({ children }) {
                    return (
                        <div className="overflow-x-auto my-2">
                            <table className="min-w-full text-xs border-collapse">
                                {children}
                            </table>
                        </div>
                    );
                },
                th({ children }) {
                    return (
                        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
                            {children}
                        </th>
                    );
                },
                td({ children }) {
                    return (
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                            {children}
                        </td>
                    );
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

interface CodeBlockProps {
    language: string;
    children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-2 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 text-gray-400 text-xs">
                <span>{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                    margin: 0,
                    padding: '12px',
                    fontSize: '12px',
                    borderRadius: '0 0 8px 8px',
                }}
            >
                {children}
            </SyntaxHighlighter>
        </div>
    );
};
