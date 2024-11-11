import { TransformBuilder } from "engine/shared/component/Transform";
import { ParallelTransformSequence, TransformSequence } from "engine/shared/component/Transform";
import { TransformService } from "engine/shared/component/TransformService";
import type { TransformProps, TweenableProperties } from "engine/shared/component/Transform";

export namespace Transforms {
	export const commonProps = TransformService.commonProps;

	export function create(): ITransformBuilder {
		return new TransformBuilder() as unknown as ITransformBuilder;
	}

	export function parallel(...transforms: readonly ITransformBuilder[]): ITransformBuilder {
		return create().push(new ParallelTransformSequence(transforms.map((t) => t.buildSequence())));
	}
	export function sequence(...transforms: readonly ITransformBuilder[]): ITransformBuilder {
		return create().push(new TransformSequence(transforms.map((t) => t.buildSequence())));
	}

	export function transform(...args: Parameters<ITransformBuilder["transform"]>): ITransformBuilder {
		return create().transform(...args);
	}
	export function transformMulti(...args: Parameters<ITransformBuilder["transformMulti"]>): ITransformBuilder {
		return create().transformMulti(...args);
	}

	export function func(func: () => void | ITransformBuilder): ITransformBuilder {
		return create().func(func);
	}

	type State<T extends object> = { readonly [k in TweenableProperties<T>]?: T[k] & defined };
	export function boolStateMachine<T extends object>(
		instance: T,
		props: TransformProps,
		trueState: State<T>,
		falseState: State<T>,
		setupStart?: (transform: ITransformBuilder, state: boolean) => void,
		setupEnd?: (transform: ITransformBuilder, state: boolean) => void,
	): (value: boolean) => void {
		return (value) => {
			let tr = create();

			setupStart?.(tr, value);
			tr = tr.transformMulti(instance, value ? trueState : falseState, props);
			setupEnd?.(tr, value);

			tr.run(instance);
		};
	}

	export function multiStateMachine<T>(...states: ((value: T) => void)[]): (value: T) => void {
		return (value: T) => {
			for (const state of states) {
				state(value);
			}
		};
	}
}
