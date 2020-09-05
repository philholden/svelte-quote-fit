import { action } from "@storybook/addon-actions";
import Component from "../src/index";

export default {
  title: "Component",
  component: Component,
};

export const Text = () => ({
  Component: Component,
  props: {
    style: "width: 80%; height: 320px; background: black;",
    text:
      "For God so loved the world that he gave his one and only Son so that whoever believes in him shall not perish but have eternal life. <nobr><b>John 3:16</b></nobr>",
  },
});
