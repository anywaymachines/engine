import { OldTransformBuilder } from "engine/shared/component/OldTransform";
import { TransformService } from "engine/shared/component/TransformService";
import { Objects } from "engine/shared/fixes/Objects";
import type { OldTransformRunner } from "engine/shared/component/OldTransform";
import type { RunningTransform, TransformProps, TweenableProperties } from "engine/shared/component/Transform";

export type TransformSetup<T extends object> = (transform: OldTransformBuilder<T>, instance: T) => void;
type State<T extends object> = { readonly [k in TweenableProperties<T>]?: T[k] };
/** @deprecated */
export namespace OldTransformService {
	export const commonProps = {
		quadOut02: { style: "Quad", direction: "Out", duration: 0.2 },
	} as const satisfies Record<string, TransformProps>;

	const transforms = new Map<object, OldTransformRunner>();

	export function run<T extends object>(instance: T, setup: TransformSetup<T>): RunningTransform {
		transforms.get(instance)?.finish();

		const builder = new OldTransformBuilder<T>(instance);
		setup(builder, instance);

		const tr = builder.build();
		transforms.set(instance, tr);
		tr.onDestroy(() => transforms.delete(instance));

		tr.enable();

		return tr;
	}

	export function runParallel(...transforms: OldTransformBuilder<object>[]): void {}

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
		TStates extends { readonly [k in string]: (builder: ITransformBuilder) => void },
	>(
		instance: T,
		states: TStates,
		setupStart?: (transform: ITransformBuilder, state: keyof TStates) => void,
		setupEnd?: (transform: ITransformBuilder, state: keyof TStates) => void,
	): { readonly [k in keyof TStates]: () => void } {
		const result: Partial<Readonly<Record<keyof TStates, () => void>>> = {};
		for (const [name, state] of pairs(states)) {
			result[name] = () => {
				const setup = (tr: ITransformBuilder) => {
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
		setupStart?: (transform: ITransformBuilder, state: keyof TStates) => void,
		setupEnd?: (transform: ITransformBuilder, state: keyof TStates) => void,
	): { readonly [k in keyof TStates & string]: () => void } {
		return stateMachineFunc(
			instance,
			Objects.fromEntries(
				Objects.entriesArray(states).map(
					([k, state]) =>
						[
							k as keyof TStates & string,
							(tr: ITransformBuilder) => {
								for (const [key, value] of pairs(state)) {
									tr.transform(instance, key as TweenableProperties<T>, value as never, props);
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
		setupStart?: (transform: ITransformBuilder, state: boolean) => void,
		setupEnd?: (transform: ITransformBuilder, state: boolean) => void,
	): (value: boolean) => void {
		const sm = stateMachine(
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
		setupStart?: (transform: ITransformBuilder, state: boolean) => void,
		setupEnd?: (transform: ITransformBuilder, state: boolean) => void,
	): (value: boolean) => void {
		let cache: (value: boolean) => void;
		return () => (cache ??= boolStateMachine(instance, props, trueState, falseState, setupStart, setupEnd));
	}

	export function multi<T>(...states: ((value: T) => void)[]): (value: T) => void {
		return (value: T) => {
			for (const state of states) {
				state(value);
			}
		};
	}
}
