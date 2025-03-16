import { ParallelTransformSequence, TransformSequence } from "engine/shared/component/Transform";
import { TransformBuilder } from "engine/shared/component/Transform";
import { TransformService } from "engine/shared/component/TransformService";
import type { TransformProps } from "engine/shared/component/Transform";

export namespace Transforms {
	export const commonProps = TransformService.commonProps;
	export const quadOut02 = commonProps.quadOut02;

	export function create(): TransformBuilder {
		return new TransformBuilder();
	}

	export function parallel(...transforms: readonly TransformBuilder[]): TransformBuilder {
		return create().push(new ParallelTransformSequence(transforms.map((t) => t.buildSequence())));
	}
	export function sequence(...transforms: readonly TransformBuilder[]): TransformBuilder {
		return create().push(new TransformSequence(transforms.map((t) => t.buildSequence())));
	}

	export function func(func: () => void | TransformBuilder): TransformBuilder {
		return create().func(func);
	}

	type State<T extends object> = { readonly [k in keyof T]?: T[k] };
	export function boolStateMachine<T extends object>(
		instance: T,
		props: TransformProps,
		trueState: State<T>,
		falseState: State<T>,
		setupStart?: (transform: TransformBuilder, state: boolean) => void,
		setupEnd?: (transform: TransformBuilder, state: boolean) => void,
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
