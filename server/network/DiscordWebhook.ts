import { HttpService } from "@rbxts/services";
import { Secrets } from "engine/server/Secrets";

interface Field {
	readonly name: string;
	readonly value: string;
	readonly inline?: boolean;
}

interface Author {
	readonly name: string;
	readonly url?: string;
	readonly icon_url?: string;
}

interface Footer {
	readonly text: string;
}

interface Embed {
	readonly title?: string;
	readonly description?: string;
	readonly color: number;
	readonly url?: string;
	readonly author?: Author;
	readonly timestamp?: string;
	readonly fields?: readonly Field[];
	readonly footer?: Footer;
}

interface Message {
	readonly content?: string;
	readonly embeds?: readonly Embed[];
	readonly username?: string;
}

export namespace DiscordWebhook {
	const webhook = Secrets.getSecret("discord_webhook");

	export function sendMessage(message: Message) {
		request(HttpService.JSONEncode(message));
	}

	function request(data: string) {
		task.spawn(() => {
			try {
				HttpService.PostAsync(webhook, data);
			} catch (error) {
				$log("Discord logging failed", error);
			}
		});
	}
}
