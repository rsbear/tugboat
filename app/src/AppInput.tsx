import { input } from "@tugboats/core";

export function AppInput(props: null) {
	return (
		<form class="flex items-center">
			<input
				type="text"
				class="flex-1"
				placeholder="Oh, hi hello"
				autocomplete="off"
				autocapitalize="off"
				autocorrect="off"
			/>
			<button type="submit" class="flex-0">
				Submit
			</button>
		</form>
	);
}
