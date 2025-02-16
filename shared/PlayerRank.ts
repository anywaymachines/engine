import { RunService } from "@rbxts/services";
import { Throttler } from "engine/shared/Throttler";

export namespace PlayerRank {
	export const DEVELOPERS = ["i3ymm", "3QAXM", "samlovebutter", "mgcode_ru", "grgrwerfwe", "hyprlandd"];

	export function isRobloxEngineer(player: Player): boolean {
		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.IsInGroup(1200769));

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function isAdmin(player: Player): boolean {
		if (RunService.IsStudio()) return true;

		return DEVELOPERS.includes(player.Name);
	}
}
