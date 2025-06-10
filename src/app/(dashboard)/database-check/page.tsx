'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { checkMuhasabahTableExists, repairMuhasabahTable } from '@/lib/supabase/database';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  DatabaseIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface CheckResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function DatabaseCheckPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [user, setUser] = useState<any>(null);
  const [repairMessage, setRepairMessage] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const runDatabaseChecks = async () => {
    if (!user) return;

    setIsChecking(true);
    const checkResults: CheckResult[] = [];

    try {
      // Check 1: Basic database connection
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (error) {
          checkResults.push({
            name: 'Database Connection',
            status: 'error',
            message: 'Failed to connect to database',
            details: error.message
          });
        } else {
          checkResults.push({
            name: 'Database Connection',
            status: 'success',
            message: 'Successfully connected to database'
          });
        }
      } catch (err: any) {
        checkResults.push({
          name: 'Database Connection',
          status: 'error',
          message: 'Database connection failed',
          details: err.message
        });
      }

      // Check 2: Core tables exist
      const coreTables = ['profiles', 'ibadah_types', 'user_ibadah', 'ibadah_records'];
      
      for (const table of coreTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);

          if (error) {
            checkResults.push({
              name: `Table: ${table}`,
              status: 'error',
              message: `Table ${table} not accessible`,
              details: error.message
            });
          } else {
            checkResults.push({
              name: `Table: ${table}`,
              status: 'success',
              message: `Table ${table} exists and accessible`
            });
          }
        } catch (err: any) {
          checkResults.push({
            name: `Table: ${table}`,
            status: 'error',
            message: `Failed to check table ${table}`,
            details: err.message
          });
        }
      }

      // Check 3: Muhasabah table (new feature)
      const muhasabahCheck = await checkMuhasabahTableExists();
      if (muhasabahCheck.exists) {
        checkResults.push({
          name: 'Muhasabah Table',
          status: 'success',
          message: 'Muhasabah table exists and accessible'
        });
      } else {
        checkResults.push({
          name: 'Muhasabah Table',
          status: 'warning',
          message: 'Muhasabah table not found',
          details: 'Run database-migration-muhasabah.sql to add muhasabah functionality'
        });
      }

      // Check 4: User profile exists
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          checkResults.push({
            name: 'User Profile',
            status: 'warning',
            message: 'User profile not found',
            details: 'Profile will be created automatically on first use'
          });
        } else {
          checkResults.push({
            name: 'User Profile',
            status: 'success',
            message: 'User profile exists'
          });
        }
      } catch (err: any) {
        checkResults.push({
          name: 'User Profile',
          status: 'error',
          message: 'Failed to check user profile',
          details: err.message
        });
      }

      // Check 5: RLS policies
      try {
        const { data, error } = await supabase
          .from('user_ibadah')
          .select('id')
          .limit(1);

        if (error && error.message.includes('permission denied')) {
          checkResults.push({
            name: 'Row Level Security',
            status: 'error',
            message: 'RLS policies not configured correctly',
            details: 'Check RLS policies in Supabase dashboard'
          });
        } else {
          checkResults.push({
            name: 'Row Level Security',
            status: 'success',
            message: 'RLS policies working correctly'
          });
        }
      } catch (err: any) {
        checkResults.push({
          name: 'Row Level Security',
          status: 'warning',
          message: 'Could not verify RLS policies',
          details: err.message
        });
      }

    } catch (err: any) {
      checkResults.push({
        name: 'General Check',
        status: 'error',
        message: 'Unexpected error during database checks',
        details: err.message
      });
    }

    setResults(checkResults);
    setIsChecking(false);
  };

  const repairDatabase = async () => {
    setIsRepairing(true);
    setRepairMessage('');

    try {
      const result = await repairMuhasabahTable();

      if (result.success) {
        setRepairMessage('✅ ' + result.message);
        // Re-run checks after repair
        setTimeout(() => {
          runDatabaseChecks();
        }, 1000);
      } else {
        setRepairMessage('❌ ' + result.message);
      }
    } catch (err: any) {
      setRepairMessage('❌ Repair failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRepairing(false);
    }
  };

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href={ROUTES.DASHBOARD}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Database Health Check</h1>
          <p className="text-gray-600">Verify your database setup and configuration</p>
        </div>
      </div>

      {/* Run Check Button */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DatabaseIcon className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-medium text-gray-900">Database Status Check</h3>
                <p className="text-sm text-gray-500">
                  Check if all required tables and configurations are set up correctly
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={runDatabaseChecks}
                disabled={isChecking || !user}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isChecking ? 'Checking...' : 'Run Check'}
              </Button>

              {errorCount > 0 && (
                <Button
                  onClick={repairDatabase}
                  disabled={isRepairing || !user}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isRepairing ? 'Repairing...' : 'Auto Repair'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repair Message */}
      {repairMessage && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-mono">{repairMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {results.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Check Results</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            </div>

            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.name}</div>
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

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Setup Instructions</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">If you see errors:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Check the <code className="bg-gray-100 px-1 rounded">DATABASE_UPDATE_GUIDE.md</code> file</li>
                <li>Run the appropriate SQL scripts in your Supabase SQL Editor</li>
                <li>For new installations: Run all setup scripts (step1-step4)</li>
                <li>For existing installations: Run <code className="bg-gray-100 px-1 rounded">database-migration-muhasabah.sql</code></li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Common Issues:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li><strong>Table not found:</strong> Run the table creation scripts</li>
                <li><strong>Permission denied:</strong> Check RLS policies</li>
                <li><strong>Connection failed:</strong> Verify Supabase configuration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
