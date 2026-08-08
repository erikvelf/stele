import {
  allowScreenCaptureAsync,
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
  preventScreenCaptureAsync,
} from 'expo-screen-capture';
import { Platform } from 'react-native';

// FLAG_SECURE (Android) and app switcher protection (iOS) are persistent
// window-level toggles enforced by the OS compositor, not per-transition
// effects, so this only needs to run once whenever the setting changes.
export function applyPrivacyProtection(hideInRecents: boolean): void {
  if (hideInRecents) {
    void preventScreenCaptureAsync();
    if (Platform.OS === 'ios') {
      void enableAppSwitcherProtectionAsync();
    }
    return;
  }

  void allowScreenCaptureAsync();
  if (Platform.OS === 'ios') {
    void disableAppSwitcherProtectionAsync();
  }
}
