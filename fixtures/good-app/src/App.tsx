import { Platform } from "react-native";
import * as Camera from "expo-camera";
export const pad = Platform.select({ ios: 20, android: 16 });
export const x = Platform.select({ ios: 1, default: 2 });
export function setup() {
  if (Platform.OS === "ios") { return 1; } else { return 2; }
}
export { Camera };
