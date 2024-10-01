import { Players } from "@rbxts/services";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import type { PlayerModule } from "engine/client/types/PlayerModule";

export namespace LocalPlayer {
	export const player = Players.LocalPlayer;
	export const mouse = player.GetMouse();
	export const character = new ObservableValue<Model | undefined>(undefined);
	export const humanoid = new ObservableValue<Humanoid | undefined>(undefined);
	export const rootPart = new ObservableValue<BasePart | undefined>(undefined);

	export const spawnEvent = new Signal();
	export const diedEvent = new Signal();

	player.CharacterAdded.Connect((_) => {
		if (!player.HasAppearanceLoaded()) {
			player.CharacterAppearanceLoaded.Wait();
		}

		playerSpawned();
	});
	if (player.Character) {
		playerSpawned();
	}

	function playerSpawned() {
		const char = player.Character!;
		character.set(char);

		const h = char.WaitForChild("Humanoid") as Humanoid;
		h.Died.Once(() => {
			character.set(undefined);
			humanoid.set(undefined);
			rootPart.set(undefined);

			diedEvent.Fire();
		});

		humanoid.set(h);
		rootPart.set(char.WaitForChild("HumanoidRootPart") as Part);

		spawnEvent.Fire();
	}

	/** Native `PlayerModule` library */
	export function getPlayerModule(): PlayerModule {
		const instance = player.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript;
		return require(instance) as PlayerModule;
	}
}
