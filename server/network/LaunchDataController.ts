import { Base64 } from "@rbxts/crypto";
import { HttpService, Players, TeleportService } from "@rbxts/services";

export type BootFlag = {
	task: 0; // Join to job id
	jobId: string;
};

export namespace LaunchDataController {
	export function initialize() {
		Players.PlayerAdded.Connect((player) => {
			if (player.GetJoinData().SourcePlaceId) return;

			const rawData = player.GetJoinData().LaunchData;
			if (!rawData || rawData === "") return;

			try {
				const launchData = HttpService.JSONDecode(Base64.Decode(rawData)) as BootFlag;

				if (launchData.task === 0) {
					if (launchData.jobId === game.JobId) return;

					TeleportService.TeleportToPlaceInstance(game.PlaceId, launchData.jobId, player);
				}
			} catch (err) {
				$err(`Got an error while receiving boot flags: ${err} (${rawData})`);
			}
		});
	}

	export function getJoinURL() {
		return `https://www.roblox.com/games/start?placeId=${game.PlaceId}&launchData=${Base64.Encode(HttpService.JSONEncode({ task: 0, jobId: game.JobId } as BootFlag))}`;
	}
}
