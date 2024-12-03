import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { ObservableSwitchAnd } from "engine/shared/event/ObservableSwitch";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ObservableSwitch, ObservableSwitchKey } from "engine/shared/event/ObservableSwitch";

const defaultKey = "$main$$";

export class VisibilityComponent implements ComponentTypes.DestroyableComponent {
	private transforms?: ((enabling: boolean) => ITransformBuilder)[];

	readonly visibility: ObservableSwitch;
	readonly instance: GuiObject;

	constructor(readonly component: InstanceComponent<GuiObject>) {
		this.instance = component.instance;
		this.visibility = new ObservableSwitchAnd(component.instance.Visible);

		this.visibility.subscribe((visible: boolean) => {
			const transforms = this.transforms;
			if (!transforms) {
				this.instance.Visible = visible;
				return;
			}

			Transforms.create()
				.if(visible, (tr) => tr.show(this.instance))
				.push(Transforms.parallel(...transforms.map((t) => t(visible))))
				.waitForTransformOfChildren(component)
				.if(!visible, (tr) => tr.then().hide(this.instance))
				.run(this, true);
		});
	}

	addTransform(onEnable: boolean, transform: ITransformBuilder): void {
		this.transforms ??= [];
		this.transforms.push((enabling) => {
			if (enabling !== onEnable) {
				return Transforms.create();
			}

			return transform;
		});
	}
	addTransformFunc(func: (enabling: boolean, builder: ITransformBuilder) => unknown): void {
		this.transforms ??= [];
		this.transforms.push((enabling) => {
			const builder = Transforms.create();
			func(enabling, builder);

			return builder;
		});
	}

	isVisible(key?: ObservableSwitchKey): boolean {
		if (!key) {
			return this.visibility.get();
		}

		return this.visibility.getKeyed(key);
	}

	setVisible(visible: boolean, key?: ObservableSwitchKey): void {
		if (visible) this.show(key);
		else this.hide(key);
	}

	show(key?: ObservableSwitchKey): void {
		key ??= defaultKey;
		this.visibility.set(key, true);
	}
	hide(key?: ObservableSwitchKey): void {
		key ??= defaultKey;
		this.visibility.set(key, false);
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
