import { FileText } from 'lucide-react';

export default function EmptyState() {
    return (
        <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Welcome to RAG Assistant</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
                Upload documents and ask questions. I'll search through your documents and provide
                accurate answers with sources.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <div className="bg-slate-800/50 p-4 rounded-lg text-left">
                    <p className="text-blue-400 text-sm font-medium mb-1">Example:</p>
                    <p className="text-slate-300 text-sm">"What is machine learning?"</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg text-left">
                    <p className="text-purple-400 text-sm font-medium mb-1">Example:</p>
                    <p className="text-slate-300 text-sm">"Summarize the key points in the document"</p>
                </div>
            </div>
        </div>
    );
}