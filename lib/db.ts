import { init } from "@instantdb/react-native";
import schema from "../instant.schema";
import Storage from "../storage/Storage.expo.native";

export const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANT_APP_ID!,
  schema,
  storage: new Storage("instantdb"),
});
