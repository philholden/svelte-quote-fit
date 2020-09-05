import { action } from "@storybook/addon-actions";
import Component from "../src/index";

export default {
  title: "Component",
  component: Component,
};

export const John316 = () => ({
  Component: Component,
  props: {
    style: "width: 80%; height: 320px; background: black;",
    text:
      "For God so loved the world that he gave his one and only Son so that whoever believes in him shall not perish but have eternal life. <nobr><b>John 3:16</b></nobr>",
  },
});

export const Mark836 = () => ({
  Component: Component,
  props: {
    style: "width: 80%; height: 320px; background: black;",
    text:
      "For what shall it <i>profit</i> a man, if he shall gain the whole world, but lose his soul?<br> <nobr><b>Mark 8:36</b></nobr>",
  },
});

export const Romans323 = () => ({
  Component: Component,
  props: {
    style: "width: 80%; height: 320px; background: black;",
    text:
      "For all have sinned and fall short of the glory of God.\n <nobr><b>Romans 3:23</b></nobr>",
  },
});

export const Peter1318 = () => ({
  Component: Component,
  props: {
    style: "width: 80%; height: 320px; background: black;",
    text:
      "For Christ died for sins, once for all, the righteous for the unrighteous to bring us to God.<br> <nobr><b>1 Peter 3:18</b></nobr>",
  },
});

export const HymnSheet = () => ({
  Component: Component,
  props: {
    style: "width: 80%; height: 320px; background: black;",
    text: "Hymn Sheet",
  },
});
