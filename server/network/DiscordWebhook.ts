import { HttpService } from "@rbxts/services";
import { Secrets } from "engine/server/Secrets";

type Field = {
	name: string;
	value: string;
	inline?: boolean;
};

type Author = {
	name: string;
	url?: string;
	icon_url?: string;
};

type Footer = {
	text: string;
};

type Embed = {
	title?: string;
	description?: string;
	color: number;
	url?: string;
	author?: Author;
	timestamp?: string;
	fields?: readonly Field[];
	footer?: Footer;
};

type Message = {
	content?: string;
	embeds?: readonly Embed[];
	username?: string;
};

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
