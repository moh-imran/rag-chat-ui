import React, { useState } from 'react';
import { FeedbackData } from '../types';
import { chatApi } from '../utils/api';

interface FeedbackButtonsProps {
    queryId?: string;
    initialFeedback?: FeedbackData;
    onFeedbackSubmitted?: (feedback: FeedbackData) => void;
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
    queryId,
    initialFeedback,
    onFeedbackSubmitted,
}) => {
    const [feedback, setFeedback] = useState<FeedbackData | undefined>(initialFeedback);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleThumbsUp = async () => {
        if (!queryId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await chatApi.submitFeedback({
                query_id: queryId,
                feedback_type: 'thumbs_up',
            });

            const newFeedback: FeedbackData = {
                type: 'thumbs_up',
                submitted: true,
            };
            setFeedback(newFeedback);
            onFeedbackSubmitted?.(newFeedback);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleThumbsDown = async () => {
        if (!queryId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await chatApi.submitFeedback({
                query_id: queryId,
                feedback_type: 'thumbs_down',
            });

            const newFeedback: FeedbackData = {
                type: 'thumbs_down',
                submitted: true,
            };
            setFeedback(newFeedback);
            onFeedbackSubmitted?.(newFeedback);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!queryId) return null;

    return (
        <div className="flex items-center gap-2 mt-2">
            <button
                onClick={handleThumbsUp}
                disabled={feedback?.submitted || isSubmitting}
                className={`p-2 rounded-lg transition-all ${feedback?.type === 'thumbs_up'
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                    } ${feedback?.submitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                title="Helpful answer"
            >
                👍
            </button>
            <button
                onClick={handleThumbsDown}
                disabled={feedback?.submitted || isSubmitting}
                className={`p-2 rounded-lg transition-all ${feedback?.type === 'thumbs_down'
                        ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                    } ${feedback?.submitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                title="Not helpful"
            >
                👎
            </button>
            {feedback?.submitted && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Thanks for your feedback!
                </span>
            )}
        </div>
    );
};
