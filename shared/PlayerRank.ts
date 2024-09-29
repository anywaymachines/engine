import { Throttler } from "engine/shared/Throttler";

export namespace PlayerRank {
	const GROUP = 1088368;

	export function isAdmin(player: Player): boolean {
		if (player.Name === "i3ymm" || player.Name === "3QAXM" || player.Name === "samlovebutter") return true;

		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.GetRankInGroup(GROUP) > 250);

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function getRank(player: Player): number {
		const req = Throttler.retryOnFail<number>(3, 1, () => player.GetRankInGroup(GROUP));

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : 0;
	}
}
