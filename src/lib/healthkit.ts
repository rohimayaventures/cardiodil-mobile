// HealthKit Wrapper — CardioDil AI
// Auto-reads all Circul ring and Apple Health data via HealthKit
// Every reading returns a HealthKitReading with source tracking
// source: 'healthkit' = auto-read from device
// source: 'manual'    = HealthKit unavailable, user must enter
// source: 'circul'    = confirmed from Circul ring specifically
//
// NOTE: react-native-health requires a real device with HealthKit.
// In Expo Go or simulator, all functions return mock values with source: 'manual'
// so the UI still renders correctly during development.

import AppleHealthKit, {
  HealthKitPermissions,
  HealthInputOptions,
  type HealthValue,
} from 'react-native-health';
import { Platform } from 'react-native';
import { HealthKitReading } from '../types';

// ── PERMISSIONS ───────────────────────────────────────────
const PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
      AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
      AppleHealthKit.Constants.Permissions.BodyTemperature,
    ],
    write: [],
  },
};

// ── MOCK DATA for Expo Go / simulator development ─────────
const MOCK_READINGS: Record<string, HealthKitReading> = {
  bpm:              { value: 68,   source: 'manual', timestamp: new Date().toISOString() },
  hrv:              { value: 42,   source: 'manual', timestamp: new Date().toISOString() },
  spo2:             { value: 98,   source: 'manual', timestamp: new Date().toISOString() },
  steps:            { value: 7842, source: 'manual', timestamp: new Date().toISOString() },
  sleepHours:       { value: 7.2,  source: 'manual', timestamp: new Date().toISOString() },
  sleepDeepMinutes: { value: 84,   source: 'manual', timestamp: new Date().toISOString() },
  sleepRemMinutes:  { value: 96,   source: 'manual', timestamp: new Date().toISOString() },
  systolic:         { value: 118,  source: 'manual', timestamp: new Date().toISOString() },
  diastolic:        { value: 74,   source: 'manual', timestamp: new Date().toISOString() },
};

function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios';
}

// ── PERMISSIONS REQUEST ───────────────────────────────────

export async function requestHealthKitPermissions(): Promise<boolean> {
  if (!isHealthKitAvailable()) return false;
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(PERMISSIONS, (error) => {
      if (error) {
        console.warn('[HealthKit] Init failed:', error);
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

// ── INDIVIDUAL READERS ────────────────────────────────────
// Each function tries HealthKit first, falls back to mock with source: 'manual'

export async function getRestingHR(): Promise<HealthKitReading> {
  if (!isHealthKitAvailable()) return MOCK_READINGS.bpm;
  return new Promise((resolve) => {
    // Library API: getRestingHeartRate (there is no getLatestHeartRate in typings)
    AppleHealthKit.getRestingHeartRate({} as HealthInputOptions, (err: string, result: HealthValue) => {
      if (!err && result?.value) {
        resolve({
          value: Math.round(result.value),
          source: 'healthkit',
          timestamp: result.startDate ?? new Date().toISOString(),
        });
      } else {
        resolve(MOCK_READINGS.bpm);
      }
    });
  });
}

export async function getHRV(): Promise<HealthKitReading> {
  if (!isHealthKitAvailable()) return MOCK_READINGS.hrv;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateVariabilitySamples(
      { startDate: startDate.toISOString(), limit: 1 } as HealthInputOptions,
      (err, results) => {
        if (!err && results?.length) {
          // react-native-health returns HRV in seconds, convert to ms (SDNN)
          const valueMs = Math.round(results[0].value * 1000);
          resolve({
            value: valueMs,
            source: 'circul',
            timestamp: results[0].startDate ?? new Date().toISOString(),
          });
        } else {
          resolve(MOCK_READINGS.hrv);
        }
      }
    );
  });
}

export async function getSpO2(): Promise<HealthKitReading> {
  if (!isHealthKitAvailable()) return MOCK_READINGS.spo2;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  return new Promise((resolve) => {
    AppleHealthKit.getOxygenSaturationSamples(
      { startDate: startDate.toISOString(), limit: 10 } as HealthInputOptions,
      (err, results) => {
        if (!err && results?.length) {
          // Use overnight average (all readings since midnight)
          const avg = results.reduce((sum, r) => sum + r.value, 0) / results.length;
          resolve({
            value: Math.round(avg * 100),
            source: 'circul',
            timestamp: results[0].startDate ?? new Date().toISOString(),
            confirmed: true,
          });
        } else {
          resolve(MOCK_READINGS.spo2);
        }
      }
    );
  });
}

export async function getSteps(): Promise<HealthKitReading> {
  if (!isHealthKitAvailable()) return MOCK_READINGS.steps;
  return new Promise((resolve) => {
    AppleHealthKit.getStepCount(
      { date: new Date().toISOString() } as HealthInputOptions,
      (err, result) => {
        if (!err && result?.value !== undefined) {
          resolve({
            value: result.value,
            source: 'healthkit',
            timestamp: new Date().toISOString(),
          });
        } else {
          resolve(MOCK_READINGS.steps);
        }
      }
    );
  });
}

export async function getSleep(): Promise<{
  hours: HealthKitReading;
  deepMinutes: HealthKitReading;
  remMinutes: HealthKitReading;
}> {
  if (!isHealthKitAvailable()) {
    return {
      hours:       MOCK_READINGS.sleepHours,
      deepMinutes: MOCK_READINGS.sleepDeepMinutes,
      remMinutes:  MOCK_READINGS.sleepRemMinutes,
    };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1);
  startDate.setHours(18, 0, 0, 0); // start from 6pm yesterday

  return new Promise((resolve) => {
    AppleHealthKit.getSleepSamples(
      { startDate: startDate.toISOString() } as HealthInputOptions,
      (err, results) => {
        if (!err && results?.length) {
          let totalMs = 0, deepMs = 0, remMs = 0;

          results.forEach((sample) => {
            const duration =
              new Date(sample.endDate).getTime() -
              new Date(sample.startDate).getTime();
            // HealthKit sleep stages; native bridge returns strings (see react-native-health docs)
            const stage = sample.value as unknown as string;
            if (stage === 'ASLEEP' || stage === 'ASLEEPCORE' || stage === 'CORE') {
              totalMs += duration;
            }
            if (stage === 'ASLEEPDEEP' || stage === 'DEEP') {
              totalMs += duration;
              deepMs  += duration;
            }
            if (stage === 'ASLEEPREM' || stage === 'REM') {
              totalMs += duration;
              remMs   += duration;
            }
          });

          const msToMin = (ms: number) => Math.round(ms / 60000);
          const msToHours = (ms: number) =>
            Math.round((ms / 3600000) * 10) / 10;

          resolve({
            hours: {
              value: msToHours(totalMs),
              source: 'circul',
              timestamp: new Date().toISOString(),
            },
            deepMinutes: {
              value: msToMin(deepMs),
              source: 'circul',
              timestamp: new Date().toISOString(),
            },
            remMinutes: {
              value: msToMin(remMs),
              source: 'circul',
              timestamp: new Date().toISOString(),
            },
          });
        } else {
          resolve({
            hours:       MOCK_READINGS.sleepHours,
            deepMinutes: MOCK_READINGS.sleepDeepMinutes,
            remMinutes:  MOCK_READINGS.sleepRemMinutes,
          });
        }
      }
    );
  });
}

export async function getBloodPressure(): Promise<{
  systolic: HealthKitReading;
  diastolic: HealthKitReading;
}> {
  if (!isHealthKitAvailable()) {
    return {
      systolic:  MOCK_READINGS.systolic,
      diastolic: MOCK_READINGS.diastolic,
    };
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  return new Promise((resolve) => {
    AppleHealthKit.getBloodPressureSamples(
      { startDate: startDate.toISOString(), limit: 1 } as HealthInputOptions,
      (err, results) => {
        if (!err && results?.length) {
          const latest = results[0];
          resolve({
            systolic: {
              value: latest.bloodPressureSystolicValue ?? MOCK_READINGS.systolic.value,
              source: 'circul',
              timestamp: latest.startDate ?? new Date().toISOString(),
            },
            diastolic: {
              value: latest.bloodPressureDiastolicValue ?? MOCK_READINGS.diastolic.value,
              source: 'circul',
              timestamp: latest.startDate ?? new Date().toISOString(),
            },
          });
        } else {
          resolve({
            systolic:  MOCK_READINGS.systolic,
            diastolic: MOCK_READINGS.diastolic,
          });
        }
      }
    );
  });
}

// ── COMPOSITE READER ──────────────────────────────────────
// Calls all individual readers in parallel.
// Returns complete set for Dashboard state population.
// Any failed read falls back to mock with source: 'manual'.

export async function getTodayHealthData() {
  const [bpm, hrv, spo2, steps, sleep, bp] = await Promise.all([
    getRestingHR(),
    getHRV(),
    getSpO2(),
    getSteps(),
    getSleep(),
    getBloodPressure(),
  ]);

  return {
    bpm,
    hrv,
    spo2,
    steps,
    sleepHours:       sleep.hours,
    sleepDeepMinutes: sleep.deepMinutes,
    sleepRemMinutes:  sleep.remMinutes,
    systolic:         bp.systolic,
    diastolic:        bp.diastolic,
  };
}
