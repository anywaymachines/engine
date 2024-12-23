import { Component } from "engine/shared/component/Component";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

const globalScale = new ObservableValue<number>(1);
export class AutoUIScaledControl extends InstanceComponent<GuiObject | ScreenGui> {
	static initializeGlobalScale(scale: ReadonlyObservableValue<number>) {
		scale.subscribe((sc) => globalScale.set(sc), true);
		globalScale.subscribe((scale) => $trace("GUI scaling set to", scale));
	}

	private readonly scale;

	constructor(instance: GuiObject | ScreenGui) {
		super(instance);
		this.scale = this.getComponent(AutoUIScaledComponent);
	}

	getScale() {
		return this.scale.getScale();
	}
}

export class AutoUIScaledComponent extends Component {
	private readonly uiscale: UIScale;

	constructor(parent: InstanceComponent<GuiObject | ScreenGui>) {
		super();

		const instance = parent.instance;
		let uiscale = instance.FindFirstChild("UIScale") as UIScale | undefined;
		if (!uiscale) {
			uiscale = new Instance("UIScale");
			uiscale.Parent = instance;
		}
		this.uiscale = uiscale;

		const findScreen = (instance: Instance): ScreenGui => {
			if (instance.IsA("ScreenGui")) return instance;

			const parent = instance.Parent;
			if (!parent) throw "Could not find screeen";

			return findScreen(parent);
		};
		const screen = findScreen(instance);

		const update = () => {
			const asize = screen.AbsoluteSize;
			const mult = globalScale.get();

			uiscale.Scale = math.min((asize.Y / 1080) * mult, 9999999);
		};

		this.event.subscribeObservable(this.event.readonlyObservableFromInstanceParam(screen, "AbsoluteSize"), update);
		this.event.subscribeObservable(globalScale, update);
		this.onEnable(update);
	}

	getScale() {
		return this.uiscale.Scale;
	}
}
