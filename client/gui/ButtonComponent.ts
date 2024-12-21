import { ReplicatedStorage, ContentProvider } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { Transforms } from "engine/shared/component/Transforms";
import { Element } from "engine/shared/Element";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { ButtonDefinition } from "engine/client/gui/Button";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { TransformProps } from "engine/shared/component/Transform";

const clickSound = Element.create("Sound", {
	Name: "Click",
	SoundId: "rbxassetid://876939830",
	Parent: ReplicatedStorage,
});
task.spawn(() => ContentProvider.PreloadAsync([clickSound]));

/** Component that handles {@link GuiButton.Activated} event and provides a signal for it. */
export class ButtonComponent extends Component {
	readonly activated: ReadonlyArgsSignal;

	constructor(parent: InstanceComponent<ButtonDefinition>) {
		super();

		const activated = new ArgsSignal();
		this.activated = activated;

		const silent = parent.getAttribute<boolean>("silent") === true;
		this.event.subscribe(parent.instance.Activated, () => {
			if (!silent) clickSound.Play();
			activated.Fire();
		});

		if (parent.instance.AutoButtonColor) {
			parent.instance.AutoButtonColor = false;
			const props: TransformProps = { ...Transforms.quadOut02, duration: 0.1 };

			const bg = parent.valuesComponent().get("BackgroundColor3");

			const bgColor = new ObservableValue(new Color3(0, 0, 0));
			const bgAlpha = new ObservableValue(0);
			const upd = () =>
				bg.effect("button_highlight", (color) => color.Lerp(bgColor.get(), bgAlpha.get()), 999999);

			this.event.subscribeObservable(bgColor, upd);
			this.event.subscribeObservable(bgAlpha, upd);
			this.onEnable(upd);

			this.event.subscribe(parent.instance.MouseEnter, () => {
				Transforms.create() //
					.transformObservable(bgColor, new Color3(0, 0, 0), props)
					.transformObservable(bgAlpha, 0.3, props)
					.run(bgAlpha, true);
			});

			this.event.subscribe(parent.instance.MouseButton1Down, () => {
				Transforms.create() //
					.transformObservable(bgColor, new Color3(1, 1, 1), props)
					.transformObservable(bgAlpha, 0.3, props)
					.run(bgAlpha, true);
			});

			const stop = () => {
				Transforms.create() //
					.transformObservable(bgAlpha, 0, props)
					.run(bgAlpha, true);
			};
			this.onDisable(stop);
			this.event.subscribe(parent.instance.MouseLeave, stop);
			this.event.subscribe(parent.instance.MouseButton1Up, stop);
		}
	}
}
