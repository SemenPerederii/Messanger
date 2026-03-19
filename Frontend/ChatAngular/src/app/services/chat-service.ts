import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';
import { User } from '../models/user';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Message } from '../models/message';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private authService = inject(AuthService);
  private hubUrl = environment.baseUrlHub
  private hubConnection?: HubConnection;

  chatMessages = signal<Message[]>([]);
  isLoading = signal<boolean>(true);
  autoScrollEnabled = signal<boolean>(true);

  currentOpenedChat = signal<User | null>(null);
  onlineUsers = signal<User[]>([]);

  startConnection(token: string, senderId?: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?senderId=${senderId || ''}`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('Conntection started');
      })
      .catch((error) => {
        console.log('Conntection or login error', error);
      });

    this.hubConnection!.on('OnlineUsers', (user: User[]) => {
      console.log(user);
      this.onlineUsers.update(() =>
        user.filter((user) => user.userName !== this.authService.currentLoggedUser!.userName),
      );
    });

    this.hubConnection!.on('NotifyTypingToUser', (senderUserName) => {
      this.onlineUsers.update((users) =>
        users.map((user) => {
          if (user.userName === senderUserName) {
            user.isTyping = true;
          }
          return user;
        }),
      );

      setTimeout(() => {
        this.onlineUsers.update((users) =>
          users.map((user) => {
            if (user.userName === senderUserName) {
              user.isTyping = false;
            }
            return user;
          }),
        );
      }, 2000);
    });

    this.hubConnection!.on('ReceiveMessageList', (message) => {
      this.isLoading.update(() => true);
      this.chatMessages.update((messages) => [...messages, ...message]);
      this.isLoading.update(() => false);
    });

    this.hubConnection!.on('ReceiveNewMessage', (message: Message) => {
      this.chatMessages.update((messages) => [...messages, message]);
      document.title = `(${this.chatMessages().length + 1}) New Message`;
    });
  }

  disConnectConnection() {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      this.hubConnection.stop().catch((error) => console.log(error));
    }
  }

  sendMessage(message: string) {
    this.chatMessages.update((messages) => [
      ...messages,
      {
        content: message,
        senderId: this.authService.currentLoggedUser!.id,
        receiveId: this.currentOpenedChat()?.id!,
        createdDate: new Date().toString(),
        isRead: false,
        id: 0,
      },
    ]);
    this.hubConnection
      ?.invoke('SendMessage', { receiverId: this.currentOpenedChat()?.id, content: message })
      .then((id) => {
        console.log('message send to', id);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  status(userName: string): string {
    const currentChatUser = this.currentOpenedChat();
    if (!currentChatUser) {
      return 'offline';
    }

    const onlineUser = this.onlineUsers().find((user) => user.userName === userName);

    return onlineUser?.isTyping ? 'Typing...' : this.isUserOnline();
  }

  isUserOnline(): string {
    let onlineUser = this.onlineUsers().find(
      (user) => user.userName === this.currentOpenedChat()?.userName,
    );
    return onlineUser?.isOnline ? 'online' : this.currentOpenedChat()!.userName;
  }

  loadMessages(pageNumber: number) {
    this.isLoading.update(() => true);
    this.hubConnection
      ?.invoke('LoadMessages', this.currentOpenedChat()?.id, pageNumber)
      .then()
      .catch()
      .finally(() => {
        this.isLoading.update(() => false);
      });
  }

  notifyTyping() {
    this.hubConnection!.invoke('NotifyTyping', this.currentOpenedChat()?.userName)
      .then((x) => {
        (console.log('notify for'), x);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  clearMessages() {
    this.chatMessages.set([]);
  }
}
