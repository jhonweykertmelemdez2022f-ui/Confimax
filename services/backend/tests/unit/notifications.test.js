const NotificationsService = require('../../src/services/notifications.service');
const { Notification } = require('../../src/models/notification.model');

jest.mock('../../src/models/notification.model', () => ({
  Notification: {
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const notificationData = {
        user_id: '1',
        title: 'Test',
        message: 'Test message',
        type: 'info',
      };

      const mockCreated = { _id: '123', ...notificationData };
      Notification.create.mockResolvedValue(mockCreated);

      const result = await NotificationsService.create(notificationData);

      expect(result).toEqual(mockCreated);
    });
  });

  describe('list', () => {
    it('should list notifications for user', async () => {
      const mockNotifications = [
        { _id: '1', user_id: 'user1', title: 'Notif 1' },
        { _id: '2', user_id: 'user1', title: 'Notif 2' },
      ];

      Notification.limit.mockResolvedValue(mockNotifications);

      const result = await NotificationsService.list('user1', 50, 0, false);

      expect(Notification.find).toHaveBeenCalledWith({ user_id: 'user1' });
    });

    it('should list only unread notifications', async () => {
      Notification.limit.mockResolvedValue([]);

      await NotificationsService.list('user1', 50, 0, true);

      expect(Notification.find).toHaveBeenCalledWith({ user_id: 'user1', read: false });
    });
  });

  describe('markRead', () => {
    it('should mark notification as read', async () => {
      const mockUpdated = { _id: '123', read: true };

      Notification.findByIdAndUpdate.mockResolvedValue(mockUpdated);

      const result = await NotificationsService.markRead('123');

      expect(result).toEqual(mockUpdated);
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read for user', async () => {
      Notification.updateMany.mockResolvedValue({ modifiedCount: 5 });

      await NotificationsService.markAllRead('user1');

      expect(Notification.updateMany).toHaveBeenCalledWith(
        { user_id: 'user1', read: false },
        { read: true, read_at: expect.any(Date) }
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      Notification.findByIdAndDelete.mockResolvedValue(true);

      await NotificationsService.deleteNotification('123');

      expect(Notification.findByIdAndDelete).toHaveBeenCalledWith('123');
    });
  });

  describe('unreadCount', () => {
    it('should return unread count for user', async () => {
      Notification.countDocuments.mockResolvedValue(3);

      const result = await NotificationsService.unreadCount('user1');

      expect(result).toBe(3);
      expect(Notification.countDocuments).toHaveBeenCalledWith({ user_id: 'user1', read: false });
    });
  });
});
