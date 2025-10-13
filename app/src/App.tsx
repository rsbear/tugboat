// @ts-expect-error this is fine
import "./styles.css";

import { input } from "@tugboats/core";
import { createSignal, Show } from "solid-js";
import { AppPreferences } from "./AppPreferences";

function App() {
	const [greetMsg, setGreetMsg] = createSignal("");
	const [name, setName] = createSignal("");

	return (
		<main class="container">
			<h1>Welcome to Tauri + Solid</h1>

			<form
				id="the-form"
				class="row"
				onSubmit={(e) => {
					e.preventDefault();
				}}
			>
				<input
					id="the-input"
					onChange={(e) => setName(e.currentTarget.value)}
					placeholder="Enter a name..."
				/>
				<button type="submit">Greet</button>
			</form>
			<p>{greetMsg()}</p>

			<div id="tugboats-slot"></div>

			<Show when={true}>
				<AppPreferences />
			</Show>
		</main>
	);
}

export default App;
