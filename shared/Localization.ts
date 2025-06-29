import { LocalizationService } from "@rbxts/services";
import { Objects } from "engine/shared/fixes/Objects";

export namespace Localization {
	let disabled = false;

	/**
	Translates any registered english words to player's language
	@argument player Player object
	@argument text Text to translate
	*/
	export function translateForPlayer(player: Player, ...text: readonly string[]): string {
		if (disabled) {
			return text.join("");
		}

		if (game.PlaceId === 0) {
			// LocalizationService is unavailable when editing a local file, just freezes forever
			return text.join("");
		}

		try {
			return Objects.awaitThrow(
				Promise.try(() => {
					const translator = LocalizationService.GetTranslatorForLocaleAsync(player.LocaleId);
					return text.map((text) => translator.Translate(game, text)).join("");
				}).timeout(1),
			);
		} catch (err) {
			$err("Disabling LocalizationService as it returned nothing for a second");
			disabled = true;

			return text.join("");
		}
	}
}
