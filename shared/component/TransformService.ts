import { TransformBuilder } from "engine/shared/component/Transform";
import { Objects } from "engine/shared/fixes/Objects";
import type {
	RunningTransform,
	TransformProps,
	TransformRunner,
	TweenableProperties,
} from "engine/shared/component/Transform";

export type TransformSetup<T extends object> = (transform: TransformBuilder<T>, instance: T) => void;
type State<T extends object> = { readonly [k in TweenableProperties<T>]?: T[k] };
export namespace TransformService {
	export const commonProps = {
		quadOut02: { style: "Quad", direction: "Out", duration: 0.2 },
	} as const satisfies Record<string, TransformProps>;

	const transforms = new Map<object, TransformRunner>();

	export function run<T extends object>(instance: T, setup: TransformSetup<T>): RunningTransform {
		transforms.get(instance)?.finish();

		const builder = new TransformBuilder<T>(instance);
		setup(builder, instance);

		const tr = builder.build();
		transforms.set(instance, tr);
		tr.onDestroy(() => transforms.delete(instance));

		tr.enable();

		return tr;
	}
	// export function start<T extends object>(builder: TransformBuilder<T>): RunningTransform {
	// 	transforms.get(instance)?.finish();

	// 	const container = new TransformContainer(instance);
	// 	transforms.set(instance, container);
	// 	container.run((transform, instance) => {
	// 		setup(transform, instance);
	// 		transform.then().func(() => {
	// 			container.destroy();
	// 			transforms.delete(instance);
	// 		});
	// 	});
	// 	container.enable();

	// 	return container;
	// }

	export function runParallel(...transforms: TransformBuilder<object>[]): void {}

	export function finish(instance: object) {
		transforms.get(instance)?.finish();
	}
	export function cancel(instance: object) {
		const transform = transforms.get(instance);
		if (!transform) return;

		transform.cancel();
		transform.destroy();
		transforms.delete(instance);
	}

	export function stateMachineFunc<
		T extends object,
		TStates extends { readonly [k in string]: (builder: TransformBuilder<T>) => void },
	>(
		instance: T,
		states: TStates,
		setupStart?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
	): { readonly [k in keyof TStates]: () => void } {
		const result: Partial<Readonly<Record<keyof TStates, () => void>>> = {};
		for (const [name, state] of pairs(states)) {
			result[name] = () => {
				const setup = (tr: TransformBuilder<T>) => {
					if (setupStart) {
						setupStart(tr, name);
						tr.then();
					}

					state(tr);

					if (setupEnd) {
						tr.then();
						setupEnd(tr, name);
					}
				};

				TransformService.run(instance, setup);
			};
		}

		return result as Readonly<Record<keyof TStates, () => void>>;
	}
	export function stateMachine<T extends object, TStates extends { readonly [k in string]: State<T> }>(
		instance: T,
		props: TransformProps,
		states: TStates,
		setupStart?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
	): { readonly [k in keyof TStates & string]: () => void } {
		return stateMachineFunc(
			instance,
			Objects.fromEntries(
				Objects.entriesArray(states).map(
					([k, state]) =>
						[
							k as keyof TStates & string,
							(tr: TransformBuilder<T>) => {
								for (const [key, value] of pairs(state)) {
									tr.transform(key as TweenableProperties<T>, value as never, props);
								}
							},
						] as const,
				),
			),
			setupStart,
			setupEnd,
		);
	}
	export function boolStateMachine<T extends object>(
		instance: T,
		props: TransformProps,
		trueState: State<T>,
		falseState: State<T>,
		setupStart?: (transform: TransformBuilder<T>, state: boolean) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: boolean) => void,
	): (value: boolean) => void {
		const sm = TransformService.stateMachine(
			instance,
			props,
			{ true: trueState, false: falseState },
			setupStart && ((tr, state) => setupStart?.(tr, state === "true")),
			setupEnd && ((tr, state) => setupEnd?.(tr, state === "true")),
		);
		return (value) => (value ? sm.true() : sm.false());
	}
	export function lazyBoolStateMachine<T extends object>(
		instance: T,
		props: TransformProps,
		trueState: State<T>,
		falseState: State<T>,
		setupStart?: (transform: TransformBuilder<T>, state: boolean) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: boolean) => void,
	): (value: boolean) => void {
		let cache: (value: boolean) => void;
		return () =>
			(cache ??= TransformService.boolStateMachine(instance, props, trueState, falseState, setupStart, setupEnd));
	}

	export function multi<T>(...states: ((value: T) => void)[]): (value: T) => void {
		return (value: T) => {
			for (const state of states) {
				state(value);
			}
		};
	}
}
