import { InputController } from "engine/client/InputController";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import type { Component } from "engine/shared/component/Component";
import type { ReadonlyComponentChild } from "engine/shared/component/ComponentChild";

export namespace ClientComponentChild {
	export function createOnceBasedOnInputType<T extends Component>(types: Readonly<Record<InputType, () => T>>): T {
		return types[InputController.inputType.get()]();
	}
	export function registerBasedOnInputType<T extends Component>(
		state: Component,
		types: Readonly<Record<InputType, () => T>>,
		cleanOnDisable = false,
	): ReadonlyComponentChild<T> {
		const parent = state.parent(new ComponentChild<T>(cleanOnDisable));
		state.event.onPrepare((inputType) => parent.set(types[inputType]()));

		return parent;
	}
}
