import { RunService } from "@rbxts/services";
import { RemoteEventBase } from "engine/shared/event/RemoteEventBase";
import { Signal } from "engine/shared/event/Signal";
import type { CreatableRemoteEvents } from "engine/shared/event/RemoteEventBase";

type CustomRemoteEvent<T extends Callback> = Instance & {
	readonly OnServerEvent: RBXScriptSignal<(player: Player, ...args: Parameters<T>) => ReturnType<T>>;
	readonly OnClientEvent: RBXScriptSignal<T>;

	FireServer(...args: Parameters<T>): void;
	FireClient(player: Player, ...args: Parameters<T>): void;
};

/** Event which if invoked:
 * On client, sends it to the server;
 * On server, runs it.
 */
export abstract class C2SRemoteEvent<T> extends RemoteEventBase<T, CustomRemoteEvent<(arg: T) => void>> {
	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		super(name, eventType);

		if (RunService.IsServer()) {
			this.event.OnServerEvent.Connect((player, arg) => {
				this.justRun(player, arg);
			});
		}
	}

	abstract justRun(player: Player | undefined, arg: T): void;

	send(arg: T) {
		if (RunService.IsClient()) {
			this.event.FireServer(arg);
		}
		if (RunService.IsServer()) {
			this.justRun(undefined, arg);
		}
	}
}
export class AutoC2SRemoteEvent<T> extends C2SRemoteEvent<T> {
	readonly clientInvoked = new Signal<(arg: T) => void>();
	readonly invoked = new Signal<(player: Player | undefined, arg: T) => void>();

	send(arg: T): void {
		this.clientInvoked.Fire(arg);
		return super.send(arg);
	}
	justRun(player: Player | undefined, arg: T): void {
		this.invoked.Fire(player, arg);
	}
}
