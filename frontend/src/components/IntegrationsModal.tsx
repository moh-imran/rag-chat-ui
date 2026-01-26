import React, { useState, useEffect } from 'react';
import { X, Trash2, Search } from 'lucide-react';
import { chatApi } from '../utils/api';

interface IntegrationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function IntegrationsModal({
    isOpen,
    onClose,
}: IntegrationsModalProps) {
    const [jobs, setJobs] = useState<Array<any>>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 10;

    const loadJobs = async () => {
        setLoading(true);
        try {
            const res = await chatApi.ingestListJobs();
            setJobs(res.jobs || []);
        } catch (e) {
            console.warn('Failed to load jobs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadJobs();
        }
    }, [isOpen]);

    const handleDeleteJob = async (jobId: string) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                // This is a placeholder. The user wants to delete from both mongo and qdrant.
                // I will need to implement a new endpoint in the backend for this.
                console.log(`Deleting job ${jobId}`);
                await chatApi.deleteIngestJob(jobId);
                loadJobs();
            } catch (error) {
                console.error('Failed to delete job', error);
            }
        }
    };

    const filteredJobs = jobs.filter(job =>
        (job.meta?.filename || job.meta?.url || job.meta?.repo_url || job.meta?.source_type || 'unknown').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop-color)] backdrop-blur-md">
            <div className="w-full max-w-4xl glass-panel rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-main)]">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Integrations</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <p>Loading jobs...</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                            <thead className="text-xs text-[var(--text-primary)] uppercase bg-[var(--bg-neutral)]">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Source</th>
                                    <th scope="col" className="px-6 py-3">Job ID</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentJobs.map(job => (
                                    <tr key={job.job_id} className="bg-[var(--bg-neutral-alpha)] border-b border-[var(--border-main)]">
                                        <td className="px-6 py-4 font-medium text-[var(--text-primary)] truncate">
                                            {job.meta?.filename || job.meta?.url || job.meta?.repo_url || job.meta?.source_type || 'unknown'}
                                        </td>
                                        <td className="px-6 py-4">{job.job_id.slice(0, 8)}...</td>
                                        <td className="px-6 py-4">{job.status}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDeleteJob(job.job_id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="p-6 border-t border-[var(--border-main)] flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 border border-[var(--border-main)] text-[var(--text-secondary)] rounded-lg font-bold hover:bg-white/5">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
