import { ReplicatedStorage, ContentProvider } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { Element } from "engine/shared/Element";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { ButtonDefinition } from "engine/client/gui/Button";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

const clickSound = Element.create("Sound", {
	Name: "Click",
	SoundId: "rbxassetid://876939830",
	Parent: ReplicatedStorage,
});
ContentProvider.PreloadAsync([clickSound]);

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
			let sub: SignalConnection | undefined;
			this.onDisable(() => sub?.Disconnect());

			parent.instance.AutoButtonColor = false;
			const bg = parent.valuesComponent().get("BackgroundColor3");
			const k = 99999;

			this.event.subscribe(parent.instance.MouseButton1Down, () => {
				bg.effect(k, (color) => color.Lerp(new Color3(1, 1, 1), 0.5));
			});

			const stop = () => bg.effect(k, undefined);
			this.event.subscribe(parent.instance.MouseLeave, stop);
			this.event.subscribe(parent.instance.MouseButton1Up, stop);
		}
	}
}
