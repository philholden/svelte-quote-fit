import {
  tokenize,
  getGap,
  FONT_SIZE,
  PARA_GAP,
  LINE_HEIGHT,
  FONT,
} from "./tokenizer";
import renderAffineText from "./render-affine-text";

//for (let i = 0; i < 100; i++) numbers.push((10 + Math.random() * 100) | 0);

//numbers.push(0);
//numbers.push(0);
//for (let i = 0; i < 50; i++) numbers.push((10 + Math.random() * 100) | 0);
// find longest word or unbreakable
// warp to this length and find aspect ratio
// find shortest wordPlus line
// wrap to this length and find aspect ratio
// until number of lines is line breaks + 1

//words is and array of token lengths

function wrap(tokens, gap, lineWidth) {
  //let baseLine = lineHeight
  const lines = [{ tokens: [], length: 0, plusWord: Number.MAX_SAFE_INTEGER }];
  let lineNum = 0;
  let prevGap = 0;
  for (let token of tokens) {
    const startGap = token.startSpace ? gap : 0;
    const x = lines[lineNum].length + prevGap + startGap;
    const length =
      lines[lineNum].length + prevGap + startGap + token.metrics.width;

    if (length > lineWidth) {
      lines[lineNum].plusWord = length;
      lineNum++;
      prevGap = token.space === " " ? gap : 0;
      lines[lineNum] = {
        plusWord: Number.MAX_SAFE_INTEGER,
        length: token.metrics.width,
        tokens: [{ ...token, x: 0 }],
      };
    } else {
      lines[lineNum].plusWord = Number.MAX_SAFE_INTEGER;
      lines[lineNum].length = length;
      lines[lineNum].tokens.push({ ...token, x });
      prevGap = token.space === " " ? gap : 0;
    }

    if (token.space === "\n\n") {
      lines[lineNum].plusWord = Number.MAX_SAFE_INTEGER;
      lines[lineNum].paragraph = true;
      lineNum++;
      prevGap = 0;
      lines[lineNum] = {
        // paragraph: true,
        length: 0,
        tokens: [],
      };
    } else if (token.space === "\n") {
      lines[lineNum].plusWord = Number.MAX_SAFE_INTEGER;
      lineNum++;
      prevGap = 0;
      lines[lineNum] = {
        length: 0,
        tokens: [],
      };
    }
  }

  //  console.log('lines',lines)
  return lines;
}

// one entry for each number of lines
function computeLayouts(tokens, gap) {
  let lineWidth = Math.max(...tokens.map((x) => x.metrics.width));
  let lines;
  const layouts = [];
  const rejectedLayouts = [];
  let i = 0;
  let lineCount = Number.MAX_SAFE_INTEGER;
  do {
    i++;
    lines = wrap(tokens, gap, lineWidth);
    lineWidth = Math.min(
      Number.MAX_SAFE_INTEGER,
      ...lines.map((x) => x.plusWord)
    );
    if (lines.length < lineCount) {
      lineCount = lines.length;
      layouts.push(lines);
    } else {
      //layouts.push(lines);
      rejectedLayouts.push(lines);
    }
  } while (lineWidth !== Number.MAX_SAFE_INTEGER && i < tokens.length * 6);
  return layouts;
}

// find bounds
function computeMargin(
  layout,
  fontSize = FONT_SIZE,
  lineHeight = LINE_HEIGHT,
  paraGap = PARA_GAP
) {
  const left = Math.min(
    0,
    ...layout.map((line) => line.tokens[0].metrics.actualBoundingBoxLeft)
  );
  const top = -Math.max(
    ...layout[0].tokens.map((token) => token.metrics.actualBoundingBoxAscent)
  );
  const maxDescent = Math.max(
    ...layout[layout.length - 1].tokens.map(
      (token) => token.metrics.actualBoundingBoxDescent
    )
  );
  const linesHeight = layout
    .map((x) => (x.paragraph ? paraGap : lineHeight))
    .reduce((a, b) => a + b, 0);
  const bottom = maxDescent + linesHeight * fontSize;

  const [head, ...tail] = layout;
  const longest = tail.reduce((acc, item) => {
    return acc.length > item.length ? acc : item;
  }, head);
  const last = longest.tokens[longest.tokens.length - 1];
  const right =
    longest.length + (last.metrics.actualBoundingBoxRight - last.metrics.width);
  const width = right - left;
  const height = maxDescent + top + linesHeight * fontSize; //bottom - top;
  return { left, top, bottom, right, width, height, aspect: width / height };
}

function orderDrawCalls(
  layout,
  fontSize = FONT_SIZE,
  lineHeight = LINE_HEIGHT,
  paraGap = PARA_GAP
) {
  const drawCalls = [];
  let prevKey;
  let acc = "";
  let prevToken;
  let y = 0;
  let index = 0;
  layout.forEach((line) => {
    line.tokens.forEach((token, i) => {
      const key = token.styles.join("-");
      if (prevKey === undefined) {
        drawCalls[index] = {
          text: token.word,
          styles: token.styles,
          x: token.x,
          y,
          key,
        };
      } else if (key === prevKey) {
        const { text } = drawCalls[index];
        drawCalls[index].text =
          (text ? text + prevToken.space : "") + token.word;
      } else {
        index++;
        drawCalls[index] = {
          text: token.word,
          styles: token.styles,
          x: token.x,
          y,
          key,
        };
      }
      prevKey = key;
      prevToken = token;
    });
    prevToken = undefined;
    prevKey = undefined;
    index++;
    y = y + (line.paragraph ? paraGap : lineHeight) * fontSize;
    drawCalls.sort((a, b) => (a.key > b.key ? 1 : a.key === b.key ? 0 : -1));
  });
  return drawCalls;
}

export function processText(text) {
  const tokens = tokenize(text.replace(/<br>/g, "\n").replace(/<p>/g, "\n\n"));
  const layouts = computeLayouts(tokens, getGap());
  const bounds = layouts.map((layout) => computeMargin(layout));
  return function onResize(canvas) {
    const { width, height } = canvas;
    const aspect = width / height;
    const idealCharSize = 0.1; //0.039;
    const minWidth = FONT_SIZE * 5;

    const data = layouts.map((layout, i) => {
      const bound = bounds[i];
      const sf =
        aspect > bound.aspect ? height / bound.height : width / bound.width;
      // how big is a character relative to the screen area
      const charSize = (FONT_SIZE * sf * FONT_SIZE * sf) / (width * height); //=0.009
      // how close does it match aspect
      const dist = Math.abs(bound.aspect - aspect);
      return { bound, layout, dist, charSize, sf };
    });
    // best fit
    data.sort((a, b) => {
      if (a.bound.width < minWidth && b.bound.width >= minWidth) {
        return 1;
      }
      if (a.bound.width >= minWidth && b.bound.width < minWidth) {
        return -1;
      }
      return b.sf - a.sf;
    });

    // near ideal and above minWidth
    // data.sort((a, b) => {
    //   if (a.bound.width < minWidth && b.bound.width >= minWidth) {
    //     return 1;
    //   }
    //   if (a.bound.width >= minWidth && b.bound.width < minWidth) {
    //     return -1;
    //   }
    //   return (
    //     Math.abs(idealCharSize - a.charSize) -
    //     Math.abs(idealCharSize - b.charSize)
    //   );
    // });

    let { layout, sf, bound } = data[0];
    const maxSf = Math.sqrt(
      (idealCharSize * width * height) / (FONT_SIZE * FONT_SIZE)
    );
    sf = Math.min(sf, maxSf);
    const drawCalls = orderDrawCalls(layout);
    const ctx = canvas.getContext("2d");

    renderAffineText(
      ctx,
      { x: 0, y: 0, w: bound.width, h: bound.height, sf },
      (ctx) => {
        drawCalls.forEach((drawCall) => {
          ctx.fillStyle = "white";

          ctx.font = `${drawCall.styles.includes("B") ? "bold" : ""} ${
            drawCall.styles.includes("I") ? "italic" : ""
          } ${FONT}`;
          ctx.fillText(drawCall.text, drawCall.x, drawCall.y + -bound.top);
        });
      },
      {
        fill: "#fff",
        posX: width / 2,
        posY: height / 2,
        scaleX: 1,
        scaleY: 1,
      }
    );
  };
}
