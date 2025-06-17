'use client';

import { useState } from 'react';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';

interface HabitCardProps {
  id: string;
  name: string;
  description?: string;
  isCompleted: boolean;
  trackingType: 'checklist' | 'count';
  currentCount?: number;
  targetCount?: number;
  unit?: string;
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
  unit,
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

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 pr-3">
          <h3 className="font-medium text-gray-900 text-base mb-1">{name}</h3>
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex-shrink-0">
          {trackingType === 'checklist' ? (
            <button
              onClick={handleChecklistToggle}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                isCompleted
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'border-2 border-gray-300 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              {isCompleted && <CheckIconSolid className="w-6 h-6" />}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCountChange(count - 1)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
              >
                -
              </button>
              <span className="text-lg font-semibold min-w-[30px] text-center text-gray-900">
                {count}
              </span>
              <button
                onClick={() => handleCountChange(count + 1)}
                className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors text-lg font-medium"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {trackingType === 'count' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-500 text-center">
            Target: {targetCount} {unit || ''} | Progress: {count}/{targetCount} {unit || ''}
          </div>
        </div>
      )}
    </div>
  );
}
