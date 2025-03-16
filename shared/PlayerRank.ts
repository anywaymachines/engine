import { RunService } from "@rbxts/services";
import { Throttler } from "engine/shared/Throttler";

export namespace PlayerRank {
	export const developers: number[] = [];

	export function isRobloxEngineer(player: Player): boolean {
		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.IsInGroup(1200769));

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function isAdmin(player: Player): boolean {
		if (RunService.IsStudio()) return true;
		return developers.includes(player.UserId);
	}
	export function isAdminById(playerId: number): boolean {
		if (RunService.IsStudio()) return true;
		return developers.includes(playerId);
	}
}
