import { Easing } from "engine/shared/component/Easing";
import { TransformService } from "engine/shared/component/TransformService";
import type { EasingDirection, EasingStyle } from "engine/shared/component/Easing";
import type {
	RunningTransform,
	Transform,
	TransformProps,
	TweenableProperties,
} from "engine/shared/component/Transform";

class TextTransform<T, TKey extends ExtractKeys<T, string>> implements Transform {
	constructor(
		private readonly instance: T,
		private readonly key: TKey,
		private readonly value: T[TKey] | (() => T[TKey]),
		private readonly duration: number,
		private readonly style: EasingStyle,
		private readonly direction: EasingDirection,
	) {
		this.instance = instance;
		this.key = key;
		this.value = value;
	}

	private startValue?: string;
	private actualValue?: string;

	runFrame(time: number): boolean {
		if (time >= this.duration) {
			this.finish();
			return true;
		}

		this.startValue ??= this.instance[this.key] as string;
		this.actualValue ??= (typeIs(this.value, "function") ? this.value() : this.value) as string;

		if (this.actualValue.size() === 0) {
			// erasing the current text

			const min = 1;
			const max = this.startValue.size();
			const num = Easing.easeValue(time / this.duration, max, min, this.style, this.direction);
			this.instance[this.key] = this.startValue.sub(1, num) as never;
		} else {
			// writing the new text

			const min = 1;
			const max = this.actualValue.size();
			const num = Easing.easeValue(time / this.duration, min, max, this.style, this.direction);
			this.instance[this.key] = this.actualValue.sub(1, num) as never;
		}

		return false;
	}

	finish() {
		this.instance[this.key] = (this.actualValue ??
			(typeIs(this.value, "function") ? this.value() : this.value)) as never;
	}
}

//

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [CommonTransformBuilderMacros, InstanceTransformBuilderMacros, GuiObjectTransformBuilderMacros];

type B = ITransformBuilder;

type Direction = "top" | "bottom" | "left" | "right";
const directionToOffset = (direction: Direction, power: number) => {
	const offsets: Record<Direction, UDim2> = {
		top: new UDim2(0, 0, 0, power),
		bottom: new UDim2(0, 0, 0, -power),
		left: new UDim2(0, power, 0, 0),
		right: new UDim2(0, -power, 0, 0),
	};

	return offsets[direction];
};

//

declare global {
	interface ITransformBuilder {
		/**
		 * Run this transform in the global {@link TransformService}
		 * @param cancelExisting Cancels any existing transforms for the same key if true, finish otherwise
		 */
		run(key: object, cancelExisting?: boolean): RunningTransform;

		/** Wait for the transform of a key to finish  */
		waitForTransformOf(key: object): ITransformBuilder;

		/** Wait for the transforms of all children to finish */
		waitForTransformOfChildren(component: Component): ITransformBuilder;

		if(condition: boolean, func: (builder: this) => unknown): this;

		setText<T extends object, TKey extends ExtractKeys<T, string>>(
			object: T,
			text: T[TKey],
			property: TKey,
			params?: TransformProps,
		): this;

		flash<T extends object, TKey extends TweenableProperties<T>>(
			this: ITransformBuilder,
			object: T,
			value: T[TKey] & defined,
			property: TKey,
			props?: TransformProps,
		): this;
	}
}
export const CommonTransformBuilderMacros: PropertyMacros<ITransformBuilder> = {
	run: (selv: B, key: object, cancelExisting: boolean = false): RunningTransform =>
		TransformService.run(key, selv, cancelExisting),

	waitForTransformOf: (selv: B, key: object): ITransformBuilder => {
		const transform = TransformService.getRunning(key);
		if (!transform) return selv;

		return selv.waitForTransform(transform);
	},
	waitForTransformOfChildren: (selv: B, component: Component): ITransformBuilder => {
		for (const child of component.getParented()) {
			selv.waitForTransformOf(child);
		}

		return selv;
	},

	if: (selv: B, condition: boolean, func: (builder: ITransformBuilder) => unknown): ITransformBuilder => {
		if (!condition) return selv;

		func(selv);
		return selv;
	},

	setText: <T extends object, TKey extends ExtractKeys<T, string>>(
		selv: ITransformBuilder,
		object: T,
		text: T[TKey],
		property: TKey,
		params?: TransformProps,
	) => {
		return selv.push(
			new TextTransform(
				object,
				property,
				text,
				params?.duration ?? 0,
				params?.style ?? "Quad",
				params?.direction ?? "Out",
			),
		);
	},
	flash: <T extends object, TKey extends TweenableProperties<T>>(
		selv: ITransformBuilder,
		object: T,
		value: T[TKey] & defined,
		property: TKey,
		props?: TransformProps,
	) => {
		return selv.push(
			selv
				.create()
				.transform(object, property, value, { style: "Quad", direction: "Out", ...props })
				.then()
				.transform(object, property, object[property]!, {
					duration: 0.4,
					style: "Quad",
					direction: "Out",
					...props,
				}),
		);
	},
};

//

declare global {
	interface ITransformBuilder {
		/** Destroy an `Instance` */
		destroy(instance: Instance): this;
	}
}
export const InstanceTransformBuilderMacros: PropertyMacros<ITransformBuilder> = {
	destroy: (selv: B, instance: Instance) => selv.func(() => instance.Destroy()),
};

//

declare global {
	interface ITransformBuilder {
		/** Move a `GuiObject` */
		move(instance: GuiObject, position: UDim2, params?: TransformProps): this;
		/** Move a `GuiObject` by X */
		moveX(instance: GuiObject, position: UDim, params?: TransformProps): this;
		/** Move a `GuiObject` by Y */
		moveY(instance: GuiObject, position: UDim, params?: TransformProps): this;

		/** Resize a `GuiObject` */
		resize(instance: GuiObject, size: UDim2, params?: TransformProps): this;
		/** Relatively move a `GuiObject` */
		moveRelative(instance: GuiObject, offset: UDim2, params?: TransformProps): this;
		/** Relatively resize a `GuiObject` */
		resizeRelative(instance: GuiObject, offset: UDim2, params?: TransformProps): this;

		// slideIn(instance: GuiObject, from: Direction, power: number, props?: TransformProps): this;
		// slideOut(instance: GuiObject, direction: Direction, power: number, props?: TransformProps): this;

		/** Set the visibility of a `GuiObject` */
		setVisible(instance: GuiObject, visible: boolean): this;
		/** Set the visibility of a `GuiObject` to true */
		show(instance: GuiObject): this;
		/** Set the visibility of a `GuiObject` to false */
		hide(instance: GuiObject): this;

		/** Transform the `GuiObject` transparency to 0 */
		fadeIn(instance: GuiObject, props?: TransformProps): this;
		/** Transform the `GuiObject` transparency to 1 */
		fadeOut(instance: GuiObject, props?: TransformProps): this;

		/** Set the `GuiObject` transparency to 1, and then transform to 0 */
		fadeInFrom0(instance: GuiObject, props: TransformProps): this;
		/** Set the `GuiObject` transparency to 0, and then transform to 1 */
		fadeOutFrom1(instance: GuiObject, props: TransformProps): this;

		flashColor<T extends GuiObject>(
			instance: T,
			color: Color3,
			property?: ExtractKeys<T & GuiObject, Color3> | "BackgroundColor3",
			props?: TransformProps,
		): this;
	}
}
export const GuiObjectTransformBuilderMacros: PropertyMacros<ITransformBuilder> = {
	move: (selv: B, instance: GuiObject, position: UDim2, params?: TransformProps) =>
		selv.transform(instance, "Position", position, params),
	moveX: (selv: B, instance: GuiObject, position: UDim, params?: TransformProps) =>
		selv.transform(instance, "Position", () => new UDim2(position, instance.Position.Y), params),
	moveY: (selv: B, instance: GuiObject, position: UDim, params?: TransformProps) =>
		selv.transform(instance, "Position", () => new UDim2(instance.Position.X, position), params),
	moveRelative: (selv: B, instance: GuiObject, offset: UDim2, params?: TransformProps) =>
		selv.transform(instance, "Position", () => instance.Position.add(offset), params),

	resize: (selv: B, instance: GuiObject, size: UDim2, params?: TransformProps) =>
		selv.transform(instance, "Size", size, params),
	resizeRelative: (selv: B, instance: GuiObject, offset: UDim2, params?: TransformProps) =>
		selv.transform(instance, "Size", () => instance.Size.add(offset), params),

	// slideIn: (selv: B, instance: GuiObject, from: Direction, power: number, props?: TransformProps) => {
	// 	return selv
	// 		.show(instance)
	// 		.moveRelative(instance, new UDim2().sub(directionToOffset(from, power)))
	// 		.move(instance, instance.Position, { duration: 0.5, style: "Quad", direction: "Out", ...props });
	// },
	// slideOut: (selv: B, instance: GuiObject, direction: Direction, power: number, props?: TransformProps) => {
	// 	return selv
	// 		.moveRelative(instance, new UDim2().sub(directionToOffset(direction, power)), {
	// 			duration: 0.5,
	// 			style: "Quad",
	// 			direction: "Out",
	// 			...props,
	// 		})
	// 		.then()
	// 		.hide(instance)
	// 		.move(instance, instance.Position);
	// },

	setVisible: (selv: B, instance: GuiObject, visible: boolean) => selv.transform(instance, "Visible", visible),
	show: (selv: B, instance: GuiObject) => selv.setVisible(instance, true),
	hide: (selv: B, instance: GuiObject) => selv.setVisible(instance, false),

	fadeIn: (selv: B, instance: GuiObject, params?: TransformProps) =>
		selv.transform(instance, "Transparency", 0, params),
	fadeOut: (selv: B, instance: GuiObject, params?: TransformProps) =>
		selv.transform(instance, "Transparency", 1, params),
	fadeInFrom0: (selv: B, instance: GuiObject, params?: TransformProps) =>
		selv.fadeOut(instance).then().fadeIn(instance, params),
	fadeOutFrom1: (selv: B, instance: GuiObject, params?: TransformProps) =>
		selv.fadeIn(instance).then().fadeOut(instance, params),

	flashColor: <T extends GuiObject>(
		selv: ITransformBuilder,
		instance: T,
		color: Color3,
		property: ExtractKeys<T & GuiObject, Color3> | "BackgroundColor3" = "BackgroundColor3",
		props?: TransformProps,
	) => {
		return selv.flash(instance, color as never, property as never, props);
	},
};