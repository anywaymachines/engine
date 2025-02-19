import { Players, RunService } from "@rbxts/services";
// import { DiscordWebhook } from "engine/server/network/DiscordWebhook";
import { HostedService } from "engine/shared/di/HostedService";
import { PlayerRank } from "engine/shared/PlayerRank";

export interface DiscordLoggingConfig {
	readonly footerText?: string;
}

export class DiscordLogging extends HostedService {
	private readonly storage: string[] = [];

	constructor(private readonly config: DiscordLoggingConfig) {
		super();
	}

	private getPlayerCredentialsString(player: Player) {
		return `[**@${player.Name}**](https://www.roblox.com/users/${player.UserId}/profile)`;
	}

	initialize() {
		if (RunService.IsStudio()) return;

		// Players
		Players.PlayerAdded.Connect((plr) => {
			this.addLine(`${this.getPlayerCredentialsString(plr)} joined the game`);

			if (plr.HasVerifiedBadge) {
				// DiscordWebhook.sendMessage({
				// 	content: `Verified player ${this.getPlayerCredentialsString(plr)} joined <@1049428656285548564>`,
				// });
			}
			if (PlayerRank.isRobloxEngineer(plr)) {
				// DiscordWebhook.sendMessage({
				// 	content: `Roblox staff ${this.getPlayerCredentialsString(plr)} joined <@1049428656285548564>`,
				// });
			}

			plr.Chatted.Connect((message, recipient) => {
				this.addLine(
					`${this.getPlayerCredentialsString(plr)} chatted \`${message}\`` +
						(recipient
							? ` to [**@${recipient!.Name}**](https://www.roblox.com/users/${recipient!.UserId}/profile)`
							: ""),
				);
			});
		});
		Players.PlayerRemoving.Connect((plr) => this.addLine(`${this.getPlayerCredentialsString(plr)} left the game`));

		// Send every 2 mins
		task.spawn(() => {
			while (true as boolean) {
				task.wait(120);
				this.sendMetrics();
			}
		});

		// Send on close
		game.BindToClose(() => {
			this.addLine(`\n**SERVER CLOSED**`);
			this.sendMetrics();
		});

		this.addLine("**SERVER STARTED**\n");
	}

	addLine(text: string) {
		this.storage.push(text);
	}

	private sendMetrics() {
		if (this.storage.size() === 0) return;

		const content = this.storage.join("\n");

		// DiscordWebhook.sendMessage({
		// 	embeds: [
		// 		{
		// 			description: content,
		// 			color: 0,
		// 			timestamp: DateTime.now().ToIsoDate(),
		// 			author: {
		// 				name: "JOIN",
		// 				url: LaunchDataController.getJoinURL(),
		// 			},
		// 			footer: !this.config.footerText ? undefined : { text: this.config.footerText },
		// 		},
		// 	],
		// });

		this.storage.clear();
	}
}
