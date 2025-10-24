import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Eye } from 'lucide-react';

interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => void;
  onView?: () => void;
}

export const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, onView }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="bg-surface-element w-full outline-none px-3 py-2 rounded-md ring-2 ring-accent-blue"
      />
    );
  }

  return (
    <div
      className="group relative px-3 py-2 rounded-md cursor-text h-full flex items-center"
      onClick={() => setIsEditing(true)}
    >
      <span className="truncate block">{value || <span className="italic text-text-tertiary">empty</span>}</span>
      <div
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-surface-element-hover p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {onView && (
          <button onClick={onView} className="p-1 text-text-secondary hover:text-text-primary rounded" title="View">
            <Eye size={14} />
          </button>
        )}
        <button onClick={() => setIsEditing(true)} className="p-1 text-text-secondary hover:text-text-primary rounded" title="Edit">
          <Pencil size={14} />
        </button>
      </div>
    </div>
  );
};
