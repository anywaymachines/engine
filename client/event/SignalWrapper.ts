import type { ReadonlyArgsSignal } from "engine/shared/event/Signal";

export type SignalWrapperConnection = (this: void) => void;
type CallbackOf<TArgs extends unknown[]> = (...args: TArgs) => void;

export interface ISignalWrapper<TArgs extends unknown[]> {
	subscribe(callback: CallbackOf<TArgs>): SignalWrapperConnection;
}

class SignalWrapperBase<TArgs extends unknown[]> {
	protected readonly signal: ISignalWrapper<TArgs>;

	constructor(signal: RBXScriptSignal<CallbackOf<TArgs>> | ISignalWrapper<TArgs>) {
		if ("Connect" in signal) {
			signal = SignalWrapperBase.wrapSignal(signal);
		}

		this.signal = signal;
	}

	private static wrapSignal<TArgs extends unknown[]>(
		signal: RBXScriptSignal<CallbackOf<TArgs>>,
	): ISignalWrapper<TArgs> {
		return {
			subscribe(callback) {
				const sub = signal.Connect(callback);
				return () => sub.Disconnect();
			},
		};
	}
}

export class SignalWrapper<TArgs extends unknown[]>
	extends SignalWrapperBase<TArgs>
	implements ISignalWrapper<TArgs>, ReadonlyArgsSignal<TArgs>
{
	private readonly events = new Map<Callback, Callback>();
	private connection: SignalWrapperConnection | undefined;
	private destroyed = false;

	constructor(signal: RBXScriptSignal<CallbackOf<TArgs>> | ISignalWrapper<TArgs>) {
		super(signal);
	}

	Connect(callback: CallbackOf<TArgs>): { Disconnect(): void } {
		const unsub = this.subscribe(callback);
		return {
			Disconnect() {
				unsub();
			},
		};
	}

	subscribe(callback: CallbackOf<TArgs>): SignalWrapperConnection {
		if (this.destroyed) return () => {};

		this.connection ??= this.signal.subscribe((...args) => {
			for (const [_, event] of [...this.events]) {
				event(...args);
			}
		});

		this.events.set(callback, callback);
		return () => this.events.delete(callback);
	}

	unsubscribeAll() {
		this.events.clear();
	}

	destroy(): void {
		this.destroyed = true;
		this.unsubscribeAll();
		this.connection?.();
	}
}

export class ThinSignalWrapper<TArgs extends unknown[]> extends SignalWrapperBase<TArgs> {
	private readonly events: Callback[] = [];
	private connection: SignalWrapperConnection | undefined;
	private destroyed = false;

	constructor(signal: RBXScriptSignal<CallbackOf<TArgs>> | ISignalWrapper<TArgs>) {
		super(signal);
	}

	subscribe(callback: CallbackOf<TArgs>): void {
		if (this.destroyed) return;

		this.connection ??= this.signal.subscribe((...args) => {
			for (const event of this.events) {
				event(...args);
			}
		});

		this.events.push(callback);
	}

	unsubscribeAll() {
		this.events.clear();
	}

	destroy(): void {
		this.destroyed = true;
		this.unsubscribeAll();
		this.connection?.();
	}
}
