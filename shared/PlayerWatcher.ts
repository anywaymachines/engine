import { Players } from "@rbxts/services";
import { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";

export namespace PlayerWatcher {
	export const errDestroyed: ErrorResponse = { success: false, message: "PLAYER DESTROYED" };

	export const players = new ObservableCollectionSet<Player>();
	onJoin((player) => players.add(player));
	onQuit((player) => players.remove(player));

	/** Susbcribes on a player join event, and immediately runs on for existing player */
	export function onJoin(func: (player: Player) => void) {
		const sub = Players.PlayerAdded.Connect(func);
		for (const player of Players.GetPlayers()) {
			func(player);
		}

		return sub;
	}

	/** Susbcribes on a player quit event */
	export function onQuit(func: (player: Player) => void) {
		return Players.PlayerRemoving.Connect(func);
	}

	/** Susbcribes on a player join event, and immediately runs on for existing player */
	export function onCharacterAdded(func: (character: Model, player: Player) => void) {
		return onJoin((player) => {
			player.CharacterAdded.Connect((char) => func(char, player));
			if (player.Character) {
				func(player.Character, player);
			}
		});
	}

	/** Susbcribes on a player join event, and immediately runs on for existing player */
	export function onHumanoidAdded(func: (humanoid: Humanoid, character: Model, player: Player) => void) {
		return onCharacterAdded((character, player) =>
			func(character.WaitForChild("Humanoid") as Humanoid, character, player),
		);
	}
}
