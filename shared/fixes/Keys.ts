export const Keys: { readonly [k in KeyCode]: Enum.KeyCode } = asObject(
	Enum.KeyCode.GetEnumItems().mapToMap((e) => $tuple(e.Name, e)),
);
export const isKey = (key: string): key is KeyCode => key in Keys;
