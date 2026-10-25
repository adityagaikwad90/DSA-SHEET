import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RotateCcw, X, Loader2 } from 'lucide-react';
import './QuestionCompletionDialog.css';

/**
 * Compact modal dialog for updating question completion progress and notes.
 * Contains only:
 * 1. Heading: Update Progress
 * 2. Question title
 * 3. Learning Notes textarea
 * 4. Actions: Cancel, Needs Practice, Solved Easily
 */
const QuestionCompletionDialog = ({
  isOpen,
  question,
  existingRecord,
  onSave,
  onClose,
  isSaving = false,
  errorMessage = ''
}) => {
  const [notes, setNotes] = useState('');
  const textareaRef = useRef(null);

  // Sync notes from existing record when opened
  useEffect(() => {
    if (isOpen) {
      setNotes(existingRecord?.notes || '');
      // Focus textarea shortly after animation
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, existingRecord]);

  // Handle Escape key to close without saving
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !question) return null;

  const handleStatusSelect = (status) => {
    if (isSaving) return;
    onSave(status, notes);
  };

  return (
    <AnimatePresence>
      <div className="completion-modal-backdrop" onClick={!isSaving ? onClose : undefined}>
        <motion.div
          className="completion-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="completion-dialog-title"
        >
          {/* Header */}
          <div className="completion-modal-header">
            <h2 id="completion-dialog-title" className="completion-dialog-title">
              Update Progress
            </h2>
            <button
              type="button"
              className="completion-close-btn"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Question Title */}
          <div className="completion-question-name" title={question.title}>
            {question.title}
          </div>

          {/* Learning Notes Field */}
          <div className="completion-notes-group">
            <label htmlFor="learning-notes-input" className="completion-notes-label">
              Learning Notes
            </label>
            <textarea
              id="learning-notes-input"
              ref={textareaRef}
              className="completion-notes-textarea"
              placeholder="Add your approach, key observations, mistakes, or anything to remember..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isSaving}
            />
          </div>

          {/* Error Message if Save Failed */}
          {errorMessage && (
            <div className="completion-error-banner" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Dialog Actions */}
          <div className="completion-modal-actions">
            <button
              id="dialog-cancel-btn"
              type="button"
              className="completion-btn completion-btn-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              id="dialog-practice-btn"
              type="button"
              className={`completion-btn completion-btn-practice ${
                existingRecord?.status === 'needs_practice' ? 'selected-status' : ''
              }`}
              onClick={() => handleStatusSelect('needs_practice')}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 size={16} className="btn-spinner" />
              ) : (
                <RotateCcw size={15} />
              )}
              Needs Practice
            </button>

            <button
              id="dialog-solved-btn"
              type="button"
              className={`completion-btn completion-btn-solved ${
                existingRecord?.status === 'solved_easily' ? 'selected-status' : ''
              }`}
              onClick={() => handleStatusSelect('solved_easily')}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 size={16} className="btn-spinner" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              Solved Easily
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuestionCompletionDialog;
