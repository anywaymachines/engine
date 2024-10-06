import { Players, RunService } from "@rbxts/services";
import { DiscordWebhook } from "engine/server/network/DiscordWebhook";
import { LaunchDataController } from "engine/server/network/LaunchDataController";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace DiscordLogging {
	const storage: string[] = [];

	function getPlayerCredentialsString(player: Player) {
		return `[**@${player.Name}**](https://www.roblox.com/users/${player.UserId}/profile)`;
	}

	export function initialize() {
		if (RunService.IsStudio()) return;

		// Players
		Players.PlayerAdded.Connect((plr) => {
			addLine(` joined the game`);

			if (plr.HasVerifiedBadge) {
				DiscordWebhook.sendMessage({
					content: `Verified player ${getPlayerCredentialsString(plr)} joined <@1049428656285548564>`,
				});
			}
			if (GameDefinitions.isRobloxEngineer(plr)) {
				DiscordWebhook.sendMessage({
					content: `Roblox staff ${getPlayerCredentialsString(plr)} joined <@1049428656285548564>`,
				});
			}

			plr.Chatted.Connect((message, recipient) => {
				addLine(
					`${getPlayerCredentialsString(plr)} chatted \`${message}\`` +
						(recipient
							? ` to [**@${recipient!.Name}**](https://www.roblox.com/users/${recipient!.UserId}/profile)`
							: ""),
				);
			});
		});
		Players.PlayerRemoving.Connect((plr) => addLine(`${getPlayerCredentialsString(plr)} left the game`));

		// Send every 2 mins
		task.spawn(() => {
			while (true as boolean) {
				task.wait(120);
				sendMetrics();
			}
		});

		// Send on close
		game.BindToClose(() => {
			addLine(`\n**SERVER CLOSED**`);
			sendMetrics();
		});

		addLine("**SERVER STARTED**\n");
	}

	export function addLine(text: string) {
		storage.push(text);
	}

	function sendMetrics() {
		if (storage.size() === 0) return;

		const content = storage.join("\n");

		DiscordWebhook.sendMessage({
			embeds: [
				{
					description: content,
					color: 0,
					timestamp: DateTime.now().ToIsoDate(),
					author: {
						name: "JOIN",
						url: LaunchDataController.getJoinURL(),
					},
					footer: {
						text:
							`🔨 ${GameDefinitions.isTestPlace() ? "⚠️ Test" : ""} Build ${game.PlaceVersion}` +
							(game.PrivateServerOwnerId !== 0 ? ", Private Server" : "") +
							` (${game.JobId.sub(game.JobId.size() - 4)})`,
					},
				},
			],
		});

		storage.clear();
	}
}
