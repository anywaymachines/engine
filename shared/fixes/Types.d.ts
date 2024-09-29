/* eslint-disable @typescript-eslint/no-explicit-any */

type Replace<T, TKey extends keyof T, TValue> = Reconstruct<Omit<T, TKey> & { readonly [k in TKey]: TValue }>;
type ReplaceWith<T, TProps extends { readonly [k in keyof T | string]?: unknown }> = Reconstruct<
	Omit<T, keyof TProps & keyof T> & TProps
>;

type MakePartial<T, TKey extends keyof T> = Reconstruct<Omit<T, TKey> & { [k in TKey]?: T[k] }>;
type MakeRequired<T, TKey extends keyof T> = Reconstruct<Omit<T, TKey> & { [k in TKey]-?: T[k] & defined }>;

type OmitOverUnion<T, K extends keyof T> = T extends T ? Omit<T, K> : never;

type ConstructorOf<T = unknown, TArgs extends any[] = any[]> = new (...args: TArgs) => T;
type AbstractConstructorOf<T = unknown, TArgs extends any[] = any[]> = abstract new (...args: TArgs) => T;
type ArgsOf<T = AbstractConstructorOf> =
	T extends AbstractConstructorOf<unknown, infer A extends unknown[]> ? A : never;
type InstanceOf<T extends AbstractConstructorOf> = T extends AbstractConstructorOf<infer R extends object> ? R : never;
