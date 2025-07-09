declare module 'react-native-push-notification' {
  export interface Importance {
    HIGH: number;
    DEFAULT: number;
    LOW: number;
    MIN: number;
    NONE: number;
  }

  export const Importance: Importance;

  export interface PushNotificationOptions {
    onNotification?: (notification: any) => void;
    permissions?: {
      alert?: boolean;
      badge?: boolean;
      sound?: boolean;
    };
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  export interface ChannelOptions {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    playSound?: boolean;
    soundName?: string;
    importance?: number;
    vibrate?: boolean;
  }

  export interface LocalNotificationOptions {
    channelId?: string;
    title?: string;
    message: string;
    playSound?: boolean;
    soundName?: string;
    importance?: string;
    vibrate?: boolean;
    vibration?: number;
    data?: any;
  }

  export function configure(options: PushNotificationOptions): void;
  export function createChannel(channel: ChannelOptions, callback: (created: boolean) => void): void;
  export function localNotification(details: LocalNotificationOptions): void;
  export function cancelAllLocalNotifications(): void;
}

declare module '@react-native-community/push-notification-ios' {
  export enum FetchResult {
    NoData = 'UIBackgroundFetchResultNoData',
    NewData = 'UIBackgroundFetchResultNewData',
    Failed = 'UIBackgroundFetchResultFailed',
  }

  export function removeAllDeliveredNotifications(): void;
} 