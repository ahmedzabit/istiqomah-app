'use client';

import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface HabitCardProps {
  id: string;
  name: string;
  description?: string;
  isCompleted: boolean;
  trackingType: 'checklist' | 'count';
  currentCount?: number;
  targetCount?: number;
  color?: string;
  date?: string;
  showDateInput?: boolean;
  onToggle: (id: string, isCompleted: boolean, count?: number, date?: string) => void;
  onDateChange?: (id: string, date: string) => void;
}

export function HabitCard({
  id,
  name,
  description,
  isCompleted,
  trackingType,
  currentCount = 0,
  targetCount = 1,
  color = '#8B5CF6',
  date,
  showDateInput = false,
  onToggle,
  onDateChange
}: HabitCardProps) {
  const [count, setCount] = useState(currentCount);
  const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0]);

  const handleChecklistToggle = () => {
    const newCompleted = !isCompleted;
    onToggle(id, newCompleted, undefined, selectedDate);
  };

  const handleCountChange = (newCount: number) => {
    if (newCount < 0) return;
    setCount(newCount);
    onToggle(id, newCount >= targetCount, newCount, selectedDate);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(id, newDate);
    }
  };

  const progress = trackingType === 'count' 
    ? Math.min((count / targetCount) * 100, 100)
    : isCompleted ? 100 : 0;

  return (
    <div className="habit-card">
      {showDateInput && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tanggal:
          </label>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        
        {trackingType === 'checklist' ? (
          <button
            onClick={handleChecklistToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              isCompleted
                ? 'bg-green-500 text-white'
                : 'border-2 border-gray-300 hover:border-green-400'
            }`}
          >
            {isCompleted && <CheckIconSolid className="w-5 h-5" />}
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCountChange(count - 1)}
              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
            >
              -
            </button>
            <span className="text-sm font-medium min-w-[20px] text-center">
              {count}
            </span>
            <button
              onClick={() => handleCountChange(count + 1)}
              className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white hover:bg-purple-600 transition-colors"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {trackingType === 'count' && (
            <div className="text-xs text-gray-500">
              Target: {targetCount}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {trackingType === 'checklist' 
              ? (isCompleted ? 'Selesai' : 'Belum selesai')
              : `${count}/${targetCount}`
            }
          </div>
        </div>
        
        <ProgressRing
          progress={progress}
          size={40}
          strokeWidth={4}
          color={color}
        >
          <div className="text-xs font-medium text-gray-700">
            {Math.round(progress)}%
          </div>
        </ProgressRing>
      </div>
    </div>
  );
}
