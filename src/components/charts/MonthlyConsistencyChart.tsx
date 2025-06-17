'use client';

import { useMemo } from 'react';

interface MonthlyData {
  month: number;
  monthName: string;
  totalRecords: number;
  completedRecords: number;
  completionRate: number;
}

interface MonthlyConsistencyChartProps {
  data: MonthlyData[];
  year: number;
}

export function MonthlyConsistencyChart({ data, year }: MonthlyConsistencyChartProps) {
  const maxRate = useMemo(() => {
    return Math.max(...data.map(d => d.completionRate), 100);
  }, [data]);

  const averageRate = useMemo(() => {
    const validData = data.filter(d => d.totalRecords > 0);
    if (validData.length === 0) return 0;
    return validData.reduce((sum, d) => sum + d.completionRate, 0) / validData.length;
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Grafik Keistiqomahan Bulanan {year}
          </h3>
          <p className="text-sm text-gray-500">
            Rata-rata tingkat penyelesaian ibadah per bulan
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">
            {averageRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Rata-rata Tahunan</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* Chart area */}
        <div className="ml-14 relative h-64 bg-gray-50 rounded-lg p-4">
          {/* Grid lines */}
          <div className="absolute inset-4 flex flex-col justify-between">
            {[0, 25, 50, 75, 100].map(value => (
              <div key={value} className="border-t border-gray-200 w-full" />
            ))}
          </div>

          {/* Average line */}
          <div 
            className="absolute left-4 right-4 border-t-2 border-dashed border-purple-400"
            style={{ bottom: `${16 + (averageRate / 100) * (256 - 32)}px` }}
          />

          {/* Data points and lines */}
          <svg className="absolute inset-4 w-full h-full">
            {/* Line path */}
            <path
              d={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - (point.completionRate / 100) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="3"
              className="drop-shadow-sm"
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (point.completionRate / 100) * 100;
              
              return (
                <g key={point.month}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="6"
                    fill="#8b5cf6"
                    stroke="white"
                    strokeWidth="2"
                    className="drop-shadow-sm hover:r-8 transition-all cursor-pointer"
                  />
                  
                  {/* Tooltip on hover */}
                  <g className="opacity-0 hover:opacity-100 transition-opacity">
                    <rect
                      x={`${x}%`}
                      y={`${y - 15}%`}
                      width="60"
                      height="30"
                      rx="4"
                      fill="rgba(0,0,0,0.8)"
                      transform="translate(-30, -15)"
                    />
                    <text
                      x={`${x}%`}
                      y={`${y - 5}%`}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {point.completionRate.toFixed(1)}%
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-4 right-4 flex justify-between text-xs text-gray-500">
            {data.map(point => (
              <span key={point.month} className="transform -rotate-45 origin-top-left">
                {point.monthName.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-purple-600"></div>
          <span className="text-gray-600">Tingkat Keistiqomahan</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-purple-400"></div>
          <span className="text-gray-600">Rata-rata ({averageRate.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
        {data.map(point => (
          <div key={point.month} className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500 mb-1">{point.monthName}</div>
            <div className="font-semibold text-gray-900">
              {point.completionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">
              {point.completedRecords}/{point.totalRecords}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
