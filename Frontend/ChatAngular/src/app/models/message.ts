export interface Message {
  id: number;
  senderId: string | null;
  receiveId: string | null;
  content: string | null;
  createdDate: string;
  isRead: boolean;
}
