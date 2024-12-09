import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { InstanceValueTransformContainer } from "engine/shared/component/InstanceValueTransformContainer";
import type { ValueOverlayKey } from "engine/shared/component/OverlayValueStorage";
import type { ITransformBuilder } from "engine/shared/component/Transform";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

export class VisibilityComponent implements ComponentTypes.DestroyableComponent {
	private readonly transforming: InstanceValueTransformContainer<boolean>;
	private readonly value;
	readonly instance: GuiObject;

	constructor(readonly component: InstanceComponent<GuiObject>) {
		this.instance = component.instance;
		this.value = component.valuesComponent().get("Visible");
		this.value.setDefaultComputingValue(true);

		this.transforming = this.value.transforms;
		this.transforming.addTransform((value) => {
			if (!value) return Transforms.create();
			return Transforms.create().show(this.instance);
		});
	}

	subscribeFrom(values: { readonly [k in string]: ReadonlyObservableValue<boolean> }): void {
		this.value.subscribeFrom(values);
	}

	waitForTransform(): ITransformBuilder {
		return Transforms.create().waitForTransformOf(this.transforming);
	}
	waitForTransformThenDestroy() {
		this.waitForTransform()
			.then()
			.func(() => this.component.destroy())
			.run(this);
	}

	addTransformFunc(func: (enabling: boolean) => ITransformBuilder): void {
		this.transforming.addTransform(func);
	}
	addTransform(onEnable: boolean, transform: ITransformBuilder): void {
		this.addTransformFunc((enabling) => {
			if (enabling !== onEnable) {
				return Transforms.create();
			}

			return transform;
		});
	}

	isVisible(): boolean {
		return this.value.value.get();
	}

	setVisible(visible: boolean, key?: ValueOverlayKey): void {
		if (visible) this.show(key);
		else this.hide(key);
	}

	show(key?: ValueOverlayKey): void {
		this.value.and(key, true);
	}
	hide(key?: ValueOverlayKey): void {
		this.value.and(key, false);
	}

	private initializedShowOnEnable = false;
	/** Setup the control to be shown when enabled and hidden when disabled  */
	initShowOnEnable(): this {
		if (this.initializedShowOnEnable) return this;

		this.initializedShowOnEnable = true;
		this.component.onEnabledStateChange((enabled) => this.setVisible(enabled));
		return this;
	}

	destroy(): void {
		TransformService.cancel(this);
	}
}
