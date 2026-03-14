export const SUPPORTED_PROVIDERS: {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
}[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    description: "Sync workouts, steps, heart rate, and body metrics from Apple Health via HealthKit.",
    dataTypes: ["steps", "heart_rate", "calories", "sleep", "workouts"],
  },
  {
    id: "google_fit",
    name: "Google Fit",
    description: "Import activity data, workouts, and biometrics from Google Fit.",
    dataTypes: ["steps", "heart_rate", "calories", "workouts", "weight"],
  },
  {
    id: "fitbit",
    name: "Fitbit",
    description: "Pull daily activity, sleep analysis, and heart rate data from your Fitbit device.",
    dataTypes: ["steps", "heart_rate", "sleep", "calories", "weight"],
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    description: "Sync performance metrics, GPS workouts, and recovery data from Garmin devices.",
    dataTypes: ["steps", "heart_rate", "sleep", "workouts", "stress"],
  },
];
