import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export const SupabaseTest: React.FC = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testEmail, setTestEmail] = useState('test@drdo.gov.in');
  const [testPassword, setTestPassword] = useState('TestPassword123!');
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [
      ...prev.filter(r => r.test !== test),
      { test, status, message }
    ]);
  };

  const runDatabaseTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check public tables
    try {
      addTestResult('Public Tables', 'pending', 'Testing access to public tables...');
      
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .limit(5);
      
      if (orgsError) {
        addTestResult('Public Tables', 'error', `Organizations: ${orgsError.message}`);
      } else {
        addTestResult('Public Tables', 'success', `Found ${orgs?.length || 0} organizations`);
      }
    } catch (error) {
      addTestResult('Public Tables', 'error', `Unexpected error: ${error}`);
    }

    // Test 2: Check system settings
    try {
      addTestResult('System Settings', 'pending', 'Testing system settings access...');
      
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('is_public', true)
        .limit(5);
      
      if (settingsError) {
        addTestResult('System Settings', 'error', settingsError.message);
      } else {
        addTestResult('System Settings', 'success', `Found ${settings?.length || 0} public settings`);
      }
    } catch (error) {
      addTestResult('System Settings', 'error', `Unexpected error: ${error}`);
    }

    // Test 3: Check job positions
    try {
      addTestResult('Job Positions', 'pending', 'Testing job positions access...');
      
      const { data: jobs, error: jobsError } = await supabase
        .from('job_positions')
        .select('*')
        .eq('is_active', true)
        .limit(5);
      
      if (jobsError) {
        addTestResult('Job Positions', 'error', jobsError.message);
      } else {
        addTestResult('Job Positions', 'success', `Found ${jobs?.length || 0} active job positions`);
      }
    } catch (error) {
      addTestResult('Job Positions', 'error', `Unexpected error: ${error}`);
    }

    // Test 4: Test RLS on users table (should fail for anonymous)
    if (!user) {
      try {
        addTestResult('RLS Protection', 'pending', 'Testing RLS on users table...');
        
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        if (usersError) {
          addTestResult('RLS Protection', 'success', 'Users table properly protected by RLS');
        } else {
          addTestResult('RLS Protection', 'error', 'Users table accessible without auth - RLS issue!');
        }
      } catch (error) {
        addTestResult('RLS Protection', 'success', 'Users table properly protected');
      }
    }

    setIsRunning(false);
  };

  const testAuthentication = async () => {
    if (user) {
      // Test authenticated user operations
      try {
        addTestResult('Auth Operations', 'pending', 'Testing authenticated operations...');
        
        // Test user profile access
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          addTestResult('Auth Operations', 'error', `Profile access failed: ${profileError.message}`);
        } else {
          addTestResult('Auth Operations', 'success', `Profile loaded: ${profile.full_name || profile.email}`);
        }
        
        // Test creating a notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            title: 'Test Notification',
            message: 'This is a test notification from Supabase test',
            type: 'info'
          });
        
        if (notifError) {
          addTestResult('Notifications', 'error', `Failed to create notification: ${notifError.message}`);
        } else {
          addTestResult('Notifications', 'success', 'Test notification created successfully');
        }
        
      } catch (error) {
        addTestResult('Auth Operations', 'error', `Unexpected error: ${error}`);
      }
    }
  };

  const handleSignUp = async () => {
    try {
      const result = await signUp(testEmail, testPassword, {
        full_name: 'Test User',
        username: testEmail.split('@')[0],
        role: 'candidate',
        department: 'Testing',
        security_clearance: 'public'
      });
      
      if (result.error) {
        toast.error(`Sign up failed: ${result.error.message}`);
      } else {
        toast.success('Sign up successful! Check your email for verification.');
      }
    } catch (error) {
      toast.error(`Sign up error: ${error}`);
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signIn(testEmail, testPassword);
      
      if (result.error) {
        toast.error(`Sign in failed: ${result.error.message}`);
      } else {
        toast.success('Sign in successful!');
        await testAuthentication();
      }
    } catch (error) {
      toast.error(`Sign in error: ${error}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      setTestResults([]);
    } catch (error) {
      toast.error(`Sign out error: ${error}`);
    }
  };

  useEffect(() => {
    if (user) {
      testAuthentication();
    }
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            Test Supabase database connection, authentication, and CRUD operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runDatabaseTests} 
              disabled={isRunning}
              variant="outline"
            >
              {isRunning ? 'Running Tests...' : 'Test Database Connection'}
            </Button>
            
            {!user ? (
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Test email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-48"
                />
                <Input
                  type="password"
                  placeholder="Test password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-48"
                />
                <Button onClick={handleSignUp} variant="outline">
                  Sign Up
                </Button>
                <Button onClick={handleSignIn}>
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-green-600">
                  Signed in as: {user.email}
                </span>
                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`w-3 h-3 rounded-full ${
                    result.status === 'success' ? 'bg-green-500' :
                    result.status === 'error' ? 'bg-red-500' :
                    'bg-yellow-500 animate-pulse'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{result.test}</div>
                    <div className={`text-sm ${
                      result.status === 'success' ? 'text-green-600' :
                      result.status === 'error' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {result.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};