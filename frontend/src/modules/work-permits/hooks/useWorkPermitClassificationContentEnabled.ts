import { useEffect, useState } from 'react';
import settingsService from '@/modules/settings/services/settingsService';
import {
  FEATURE_WORK_PERMIT_CLASSIFICATION_CONTENT_KEY,
  parseBooleanSettingValue,
} from '../constants/workPermitFeatureFlags';

/**
 * Feature flag: show work classification safety guideline editor + attachments across work permit / classification UI.
 * Default off when setting is missing or not 'true'/'1'.
 */
export function useWorkPermitClassificationContentEnabled() {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const raw = await settingsService.getSettingValue(FEATURE_WORK_PERMIT_CLASSIFICATION_CONTENT_KEY);
        if (!cancelled) setEnabled(parseBooleanSettingValue(raw));
      } catch {
        if (!cancelled) setEnabled(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { enabled, isLoading };
}
