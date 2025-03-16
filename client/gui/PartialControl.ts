import { Control } from "engine/client/gui/Control";
import type { ControlConfig } from "engine/client/gui/Control";

const childNotExists = {} as Symbol;

export class PartialControl<
	TParts extends object & { readonly [k in string]: unknown },
	T extends GuiObject = GuiObject,
	TPartsField extends object = TParts,
> extends Control<T> {
	readonly parts: TPartsField;

	constructor(instance: T, parts?: Partial<TParts>, config?: ControlConfig) {
		super(instance, config);

		const partsBackend: { [k in string]: unknown } = { ...parts };
		this.parts = setmetatable({} as TPartsField, {
			__index: (_, key) => {
				if (!typeIs(key, "string")) {
					throw `Invalid part key ${key}`;
				}

				const existing = partsBackend[key];
				if (existing === undefined) {
					const inst = instance.FindFirstChild(key, true);
					if (!inst) {
						partsBackend[key] = childNotExists;
						return undefined;
					}

					partsBackend[key] = inst;
					return inst;
				}
				if (existing === childNotExists) {
					return undefined;
				}

				return existing;
			},
		});
	}
}
