import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat-service';
import { TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-window',
  imports: [TitleCasePipe, MatIcon, FormsModule],
  templateUrl: './chat-window.html',
  styles: ``,
})
export class ChatWindow {
  chatService = inject(ChatService);

  message: string = '';

  sendMessage() {}
}
