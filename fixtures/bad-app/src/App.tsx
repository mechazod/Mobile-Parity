import { Platform } from "react-native";
import * as Camera from "expo-camera";

export function setup() {
  if (Platform.OS === "ios") {
    console.log("ios only setup");
  }
}
export const pad = Platform.select({ ios: 20 });
export const badge = Platform.OS === "android" && "beta";
export function ok() {
  if (Platform.OS === "ios") { return 1; }
  return 2;
}
export function intended() {
  // parity-ignore PG001: Android uses the system picker
  if (Platform.OS === "ios") { console.log("native picker"); }
}
export { Camera };
