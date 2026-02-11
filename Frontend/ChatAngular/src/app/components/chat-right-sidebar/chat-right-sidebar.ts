import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat-service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-chat-right-sidebar',
  standalone: true,
  imports: [TitleCasePipe],
  templateUrl: './chat-right-sidebar.html',
  styles: ``,
})
export class ChatRightSidebar {
  chatService = inject(ChatService);
}
