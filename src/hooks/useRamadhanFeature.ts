import { useState, useEffect } from 'react';
import { isRamadhanFeatureEnabled } from '@/lib/supabase/database';

export function useRamadhanFeature() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkRamadhanStatus = async () => {
    try {
      const enabled = await isRamadhanFeatureEnabled();
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error checking Ramadhan feature:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        error: error
      });
      // Always set to false on error to prevent app crashes
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkRamadhanStatus();
    
    // Set up interval to check periodically (every 30 seconds)
    const interval = setInterval(checkRamadhanStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshStatus = () => {
    setIsLoading(true);
    checkRamadhanStatus();
  };

  return {
    isEnabled,
    isLoading,
    refreshStatus
  };
}
