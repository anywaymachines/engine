import { Throttler } from "engine/shared/Throttler";

export namespace PlayerRank {
	export function isRobloxEngineer(player: Player): boolean {
		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.IsInGroup(1200769));

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function isAdmin(groupId: number, player: Player): boolean {
		if (player.Name === "i3ymm" || player.Name === "3QAXM" || player.Name === "samlovebutter") return true;

		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.GetRankInGroup(groupId) > 250);

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function getRank(groupId: number, player: Player): number {
		const req = Throttler.retryOnFail<number>(3, 1, () => player.GetRankInGroup(groupId));

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : 0;
	}
}
