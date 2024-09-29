import { InputController } from "engine/client/InputController";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import type { ClientComponentEvents } from "engine/client/component/ClientComponentEvents";
import type { ReadonlyComponentChild } from "engine/shared/component/ComponentChild";

export namespace ClientComponentChild {
	export function createOnceBasedOnInputType<T extends IComponent>(types: Readonly<Record<InputType, () => T>>): T {
		return types[InputController.inputType.get()]();
	}
	export function registerBasedOnInputType<T extends IComponent>(
		state: IComponent & { readonly event: ClientComponentEvents },
		types: Readonly<Record<InputType, () => T>>,
		cleanOnDisable = false,
	): ReadonlyComponentChild<T> {
		const parent = new ComponentChild<T>(state, cleanOnDisable);
		state.event.onPrepare((inputType) => parent.set(types[inputType]()));

		return parent;
	}
}
