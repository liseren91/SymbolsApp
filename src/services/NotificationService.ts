import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.configure();
  }

  configure = () => {
    // Конфигурация для Android и iOS
    PushNotification.configure({
      // (Обязательно) Вызывается, когда пользователь нажимает на уведомление
      onNotification: function (notification: any) {
        console.log('NOTIFICATION:', notification);
        
        // Для iOS требуется завершить процесс уведомления
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      // IOS ONLY (optional): по умолчанию: все - 'badge', 'sound', 'alert'
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Должен ли процесс продолжаться после пользовательского взаимодействия с уведомлением
      popInitialNotification: true,

      // Запрашивать разрешения при регистрации
      requestPermissions: true,
    });

    // Создание каналов для Android
    if (Platform.OS === 'android') {
      this.createChannels();
    }
  }

  createChannels = () => {
    PushNotification.createChannel(
      {
        channelId: 'proximity-alerts', // (required)
        channelName: 'Proximity Alerts', // (required)
        channelDescription: 'Notifications when you approach points of interest', // (optional) default: undefined
        playSound: true, // (optional) default: true
        soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
        importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
      },
      (created: boolean) => console.log(`Channel 'proximity-alerts' created: ${created}`)
    );
  }

  // Отправить локальное уведомление
  localNotification = (title: string, message: string, data: object = {}) => {
    PushNotification.localNotification({
      channelId: 'proximity-alerts', // (required) для Android
      title: title,
      message: message,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
      data: data,
    });
  }

  // Отмена всех уведомлений
  cancelAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeAllDeliveredNotifications();
    }
  }
}

const notificationService = new NotificationService();
export default notificationService; 