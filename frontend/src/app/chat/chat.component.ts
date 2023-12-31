import { NgClass } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';

@Component({
	selector: 'app-chat',
	standalone: true,
	imports: [NgClass, FormsModule],
	templateUrl: './chat.component.html',
	styleUrl: './chat.component.css',
	providers: [ChatService],
})
export class ChatComponent {
	chats: Array<any> = [
		{
			id: 1,
			type: 0,
			msg: 'Hello, what can I do for you?',
		},
	];

	query = '';
	typeingText = "";
	isProcessing = false;

	constructor(private chatService: ChatService, private ngZone: NgZone) { }

	submit(e: Event) {
		e.preventDefault();
		if(this.query == "") return;
		const chatContainer = document.querySelector("#chatContainer")

		this.isProcessing = true;
		const newMsg = {
			id: crypto.randomUUID(),
			type: 1,
			msg: this.query
		}
		this.chats.push(newMsg)
		const payload = {
			prompt: this.query
		}

		this.query = "";
		try {
			fetch('http://localhost:5000/', {
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"Content-Type": "application/json"
			}
		}).then((response) => {
			const reader = response.body?.getReader();

			if (reader) {
				this.isProcessing = false;
				const processChunk = ({ done, value }: any) => {
					if (done) {
						// Stream has ended
						// console.log("done")
						this.chats.push({
							id: crypto.randomUUID(),
							type: 0,
							msg: this.typeingText
						})
						this.typeingText = "";
						return;
					}

					// Decode the Uint8Array to a string
					const textDecoder = new TextDecoder('utf-8');

					this.typeingText += textDecoder.decode(value);
					if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;


					// Continue to the next chunk
					reader.read().then(processChunk);
				};

				// Start reading the stream
				reader.read().then(processChunk);
			}
		})
		} catch (error: unknown) {
			this.chats.push({
				id: crypto.randomUUID(),
				type: 0,
				msg: "Internal Error",
				isError: true
			})
		}
		
	}
}
