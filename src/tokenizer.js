const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
export const FONT_SIZE = 48;
export const LINE_HEIGHT = 1.6;
export const PARA_GAP = 2.5;
export const FONT = `${FONT_SIZE}px sans-serif`;

function parse(el, acc = [], tags = []) {
  [...el.childNodes].map((x) => {
    if (x.nodeType === Node.TEXT_NODE) {
      acc.push([x.textContent, tags.slice(0)]);
    } else if (x.nodeType === Node.ELEMENT_NODE) {
      parse(x, acc, [...tags, x.tagName]);
    }
  });
  return acc;
}

// {word: "For", styles: ["B", "I"], space: " ", metrics: TextMetrics}
function flatten(fragements) {
  return fragements
    .reduce((acc, [words, styles]) => {
      if (styles.includes("NOBR")) {
        acc.push([words, styles, ""]);
      } else {
        const reg = /\S+\s*/gm;
        const wrd = /\S+/;
        let matches;

        // split into word and following space
        let i = 0;
        while ((matches = reg.exec(words))) {
          const word = matches[0].match(wrd)[0];
          let space = /\s+/g.exec(matches[0]);
          if (space === null) {
            space = "";
          } else if (/\n\n/.test(space)) {
            space = "\n\n";
          } else if (/\n/.test(space)) {
            space = "\n";
          } else {
            space = " ";
          }
          // /\n\n/.test;
          const startSpace = i === 0 && words[0] === " ";
          acc.push([word, styles, space, startSpace]);
          i++;
        }
      }
      // measure text on canvas ctx
      return acc
        .filter((x) => x[0] !== "")
        .map(([word, styles, space, startSpace]) => {
          ctx.font = `${styles.includes("B") ? "bold" : ""} ${
            styles.includes("I") ? "italic" : ""
          } ${FONT}`;
          return [word, styles, space, startSpace, ctx.measureText(word)];
        });
    }, [])
    .map(([word, styles, space, startSpace, metrics]) => ({
      word,
      styles: styles.filter((x) => x !== "NOBR"),
      space,
      metrics,
      startSpace,
    }));
}

export function getGap() {
  ctx.font = FONT;
  return ctx.measureText("a a").width - ctx.measureText("a").width * 2;
}

export function tokenize(htmlText) {
  const el = document.createElement("div");
  el.innerHTML = htmlText;
  return flatten(parse(el));
}

console.log(
  "tokens",
  tokenize("For <b>God so <i>loved</i></b>.\n\n <nobr><i>John 3:16</i></nobr>")
);
// could do treewalker or create element
