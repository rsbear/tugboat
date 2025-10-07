import { mount as svelteMount } from "svelte";
import App from "./App.svelte";

export const tugboatsMini = "svelte";
export function tugboatSvelte(target: HTMLElement, harborApi: any) {
  svelteMount(App, { target, props: { yeye: "yeyeye" } });
}
