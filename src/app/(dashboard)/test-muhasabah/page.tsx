'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { upsertMuhasabahEntry, getMuhasabahEntry, checkMuhasabahTableExists } from '@/lib/supabase/database';
import { formatDateForDB } from '@/lib/utils';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowLeftIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'running';
  message: string;
  details?: string;
}

export default function TestMuhasabahPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const updateResult = (test: string, status: TestResult['status'], message: string, details?: string) => {
    setResults(prev => {
      const existing = prev.find(r => r.test === test);
      if (existing) {
        return prev.map(r => r.test === test ? { ...r, status, message, details } : r);
      } else {
        return [...prev, { test, status, message, details }];
      }
    });
  };

  const runTests = async () => {
    if (!user) return;

    setIsRunning(true);
    setResults([]);

    const testDate = formatDateForDB(new Date());
    const testId = crypto.randomUUID();

    try {
      // Test 1: Check table exists
      updateResult('Table Check', 'running', 'Checking if muhasabah table exists...');
      
      const tableCheck = await checkMuhasabahTableExists();
      if (tableCheck.exists) {
        updateResult('Table Check', 'success', 'Muhasabah table exists and is accessible');
      } else {
        updateResult('Table Check', 'error', 'Muhasabah table not found', tableCheck.error || 'Unknown error');
        setIsRunning(false);
        return;
      }

      // Test 2: Test UUID generation
      updateResult('UUID Generation', 'running', 'Testing UUID generation...');
      
      try {
        const testUuid = crypto.randomUUID();
        updateResult('UUID Generation', 'success', `UUID generated successfully: ${testUuid.substring(0, 8)}...`);
      } catch (err: any) {
        updateResult('UUID Generation', 'error', 'Failed to generate UUID', err.message);
      }

      // Test 3: Test insert
      updateResult('Insert Test', 'running', 'Testing muhasabah entry insert...');
      
      const testEntry = {
        id: testId,
        user_id: user.id,
        date: testDate,
        good_things: 'Test entry - automated test',
        improvements: 'Test improvements - automated test',
        prayers_hopes: 'Test prayers - automated test',
        mood: 'happy' as const
      };

      try {
        await upsertMuhasabahEntry(testEntry);
        updateResult('Insert Test', 'success', 'Successfully inserted test muhasabah entry');
      } catch (err: any) {
        updateResult('Insert Test', 'error', 'Failed to insert muhasabah entry', err.message);
        setIsRunning(false);
        return;
      }

      // Test 4: Test read
      updateResult('Read Test', 'running', 'Testing muhasabah entry read...');
      
      try {
        const readEntry = await getMuhasabahEntry(user.id, testDate);
        if (readEntry && readEntry.good_things === testEntry.good_things) {
          updateResult('Read Test', 'success', 'Successfully read back test muhasabah entry');
        } else {
          updateResult('Read Test', 'error', 'Failed to read back test entry or data mismatch');
        }
      } catch (err: any) {
        updateResult('Read Test', 'error', 'Failed to read muhasabah entry', err.message);
      }

      // Test 5: Test update
      updateResult('Update Test', 'running', 'Testing muhasabah entry update...');
      
      const updatedEntry = {
        ...testEntry,
        good_things: 'Updated test entry - automated test',
        mood: 'very_happy' as const
      };

      try {
        await upsertMuhasabahEntry(updatedEntry);
        
        // Verify update
        const verifyEntry = await getMuhasabahEntry(user.id, testDate);
        if (verifyEntry && verifyEntry.good_things === updatedEntry.good_things && verifyEntry.mood === 'very_happy') {
          updateResult('Update Test', 'success', 'Successfully updated test muhasabah entry');
        } else {
          updateResult('Update Test', 'error', 'Update succeeded but verification failed');
        }
      } catch (err: any) {
        updateResult('Update Test', 'error', 'Failed to update muhasabah entry', err.message);
      }

      // Test 6: Cleanup
      updateResult('Cleanup', 'running', 'Cleaning up test data...');
      
      try {
        await supabase
          .from('muhasabah_entries')
          .delete()
          .eq('user_id', user.id)
          .eq('date', testDate)
          .like('good_things', '%automated test%');
        
        updateResult('Cleanup', 'success', 'Test data cleaned up successfully');
      } catch (err: any) {
        updateResult('Cleanup', 'error', 'Failed to cleanup test data', err.message);
      }

    } catch (err: any) {
      updateResult('General Error', 'error', 'Unexpected error during testing', err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'running':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const allTestsPassed = results.length > 0 && errorCount === 0 && !isRunning;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href={ROUTES.MUHASABAH}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Test Muhasabah Feature</h1>
          <p className="text-gray-600">Comprehensive test of muhasabah functionality</p>
        </div>
      </div>

      {/* Test Runner */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BeakerIcon className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-medium text-gray-900">Muhasabah Feature Test</h3>
                <p className="text-sm text-gray-500">
                  Test all muhasabah operations: create, read, update, delete
                </p>
              </div>
            </div>
            <Button
              onClick={runTests}
              disabled={isRunning || !user}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            {allTestsPassed && (
              <div className="p-4 bg-green-100 border border-green-200 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    🎉 All tests passed! Muhasabah feature is working correctly.
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.test}</div>
                      <div className="text-sm text-gray-700">{result.message}</div>
                      {result.details && (
                        <div className="text-xs text-gray-500 mt-1 font-mono bg-white p-2 rounded border">
                          {result.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">What This Test Does</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Test Coverage:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li><strong>Table Check:</strong> Verifies muhasabah_entries table exists</li>
                <li><strong>UUID Generation:</strong> Tests client-side UUID generation</li>
                <li><strong>Insert Test:</strong> Creates a new muhasabah entry</li>
                <li><strong>Read Test:</strong> Retrieves the created entry</li>
                <li><strong>Update Test:</strong> Modifies the entry</li>
                <li><strong>Cleanup:</strong> Removes test data</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">If Tests Fail:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Check the <Link href={ROUTES.DATABASE_CHECK} className="text-blue-600 underline">Database Health Check</Link></li>
                <li>Run the database migration scripts</li>
                <li>Use the "Auto Repair" function if available</li>
                <li>Check browser console for detailed errors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
