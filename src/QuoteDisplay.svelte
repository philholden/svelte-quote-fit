<script>
  import ResizeObserver from "resize-observer-polyfill";
  import { onMount } from "svelte";
  import { processText } from "./util";

  let ratio = window.devicePixelRatio || 1;
  let canvas;
  let _width;
  let _height;
  let song;
  let onResize;

  export let style = "width: 100%; height: 100%; background: black;";
  export let text =
    "hello people this is the text I am writing this is my name";

  $: {
    onResize = processText(text);
  }

  onMount(() => {
    let now = 0;
    let clear;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (performance.now() - now > 100) {
          clearTimeout(clear);
          _onResize(entry.contentRect);
          now = performance.now();
        } else {
          clearTimeout(clear);
          clear = setTimeout(() => _onResize(entry.contentRect), 100);
        }
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      clearTimeout(clear);
      resizeObserver.unobserve(canvas);
    };
  });

  function _onResize({ width, height }) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    if (typeof onResize === "function") onResize(canvas);
  }
</script>

<style>
  canvas {
    background: black;
  }
</style>

<canvas {style} bind:this={canvas} />
