import { HttpService, LocalizationService, Players, RunService } from "@rbxts/services";
import { Secrets } from "engine/server/Secrets";
import { HostedService } from "engine/shared/di/HostedService";
import { JSON } from "engine/shared/fixes/Json";
import { PlayerRank } from "engine/shared/PlayerRank";

const endpoint = "https://logging.anywaymachines.com";
const headers = { Authorization: `Bearer ${Secrets.getSecret("logging_token")}` };

type LogAction = "join" | "leave" | "chat" | "server_start" | "server_stop";
type LogSource =
	| "server"
	| {
			readonly id: number;
			readonly name: string;
			readonly role: string | undefined;
			readonly country: string | undefined;
	  };
type LogServer = {
	readonly jobId: string;
	readonly isPrivate?: boolean | undefined;
};
interface Log {
	readonly source: LogSource;
	readonly action: LogAction | string;
	readonly data?: unknown;
	readonly server: LogServer;
	readonly timestamp: number;
}

const getRole = (player: Player): string | undefined => {
	if (player.HasVerifiedBadge) return "verified";
	if (PlayerRank.isRobloxEngineer(player)) return "roblox";
	if (PlayerRank.isAdmin(player)) return "admin";

	return undefined;
};
const getSourceFromPlayer = (plr: Player): LogSource => ({
	id: plr.UserId,
	name: plr.Name,
	role: getRole(plr),
	country: LocalizationService.GetCountryRegionForPlayerAsync(plr),
});

export class NetworkLogging extends HostedService {
	private readonly storage: Log[] = [];

	getServer(): LogServer {
		if (RunService.IsStudio()) {
			return { jobId: "studio" };
		}

		return {
			jobId: game.JobId,
			isPrivate: game.PrivateServerOwnerId > 0 ? true : undefined,
		};
	}

	constructor() {
		super();

		// Players
		this.event.subscribe(Players.PlayerAdded, (plr) => {
			this.log({
				source: getSourceFromPlayer(plr),
				action: "join",
			});

			plr.Chatted.Connect((message, recipient) => {
				this.log({
					source: getSourceFromPlayer(plr),
					action: "chat",
					data: {
						message,
						recipient: recipient ? getSourceFromPlayer(recipient) : undefined,
					},
				});
			});
		});
		this.event.subscribe(Players.PlayerRemoving, (plr) => {
			this.log({
				source: getSourceFromPlayer(plr),
				action: "leave",
			});
		});

		// Send every 1 min
		this.event.loop(60, () => this.sendMetrics());

		// Send on close
		game.BindToClose((reason) => {
			this.log({
				source: "server",
				action: "server_stop",
				data: { reason: reason.Name },
			});

			this.sendMetrics();
		});

		this.log({
			source: "server",
			action: "server_start",
		});
	}

	log(log: Omit<Log, "server" | "timestamp">): void {
		this.storage.push({
			...log,
			server: this.getServer(),
			timestamp: DateTime.now().UnixTimestamp,
		});
	}

	private sendMetrics() {
		if (this.storage.size() === 0) return;

		const data = { messages: this.storage };
		try {
			HttpService.PostAsync(`${endpoint}/log`, JSON.serialize(data), "ApplicationJson", false, headers);
		} catch (err) {
			$err("Error sending the logs:", err);
		}

		this.storage.clear();
	}
}
