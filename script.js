const CANVAS = document.querySelector("#display");
const CTX = CANVAS.getContext("2d");

let gridSize = 32;
const camera = {
    x: 0,
    y: 0,
}
const mouse = {
    held: false,
    newWire: 0,
}

const itemdata = { "delete": true, "switch": true, "lamp": true, "battery": true, "not": true, "and": false, "or": false, "xor": false, "reader": false, };
const images = {};
Object.keys(itemdata).forEach(c => {
    images[c] = Object.assign(document.createElement("img"), {
        src: `./${c}.png`,
    });
});
let itemtouch = 0;
let itemwidth = 2;
let highlightWire = false;
let items = {};

const update = () => {
    CTX.lineWidth = 1;
    CTX.fillStyle = "#eeeeee";
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);

    drawGrid();
    drawCursor();
    drawItems();
};
const drawGrid = () => {
    CTX.strokeStyle = "#aaaaaa";
    let blocksWide = Math.ceil(CANVAS.width / gridSize);
    for (let i = 0; i < blocksWide; i++) {
        CTX.beginPath();
        CTX.moveTo(mod(i * gridSize - camera.x, blocksWide * gridSize), 0);
        CTX.lineTo(mod(i * gridSize - camera.x, blocksWide * gridSize), CANVAS.height);
        CTX.stroke();
    }
    let blocksTall = Math.ceil(CANVAS.height / gridSize);
    for (let i = 0; i < blocksTall; i++) {
        CTX.beginPath();
        CTX.moveTo(0, mod(i * gridSize - camera.y, blocksTall * gridSize));
        CTX.lineTo(CANVAS.width, mod(i * gridSize - camera.y, blocksTall * gridSize));
        CTX.stroke();
    }
};
const drawCursor = () => {
    CTX.strokeStyle = "#000";
    if (mouse.y < CANVAS.height - document.querySelector("#fileContainer").offsetHeight) CTX.strokeRect(
        Math.floor((mouse.x + camera.x % gridSize) / gridSize) * gridSize - camera.x % gridSize,
        Math.floor((mouse.y + camera.y % gridSize) / gridSize) * gridSize - camera.y % gridSize,
        gridSize * (itemdata[Object.keys(itemdata)[itemtouch]] ? 1 : itemwidth), gridSize)

    mouse.globalX = Math.floor(camera.x / gridSize) + Math.floor((mouse.x + camera.x % gridSize) / gridSize);
    mouse.globalY = Math.floor(camera.y / gridSize) + Math.floor((mouse.y + camera.y % gridSize) / gridSize);
    if (camera.x < 0) mouse.globalX++;
    if (camera.y < 0) mouse.globalY++;

    if (mouse.newWire === 1) {
        CTX.lineWidth = 5;
        CTX.lineCap = "butt";
        CTX.strokeStyle = "#000";
        CTX.beginPath();
        CTX.moveTo(mouse.highlightX * gridSize - camera.x, mouse.highlightY * gridSize - camera.y);
        CTX.lineTo(mouse.x, mouse.y);
        CTX.stroke();
    }
};
const drawItems = () => {
    highlightWire = false;
    Object.keys(items).forEach(bl => {
        let item = items[bl];

        // Draw Machine

        CTX.fillStyle = item.active ? "#00ff00" : "#ccc";
        CTX.strokeStyle = "#000";
        CTX.fillRect(item.x * gridSize - camera.x, item.y * gridSize - camera.y, Math.max(1, item.inputs.length) * gridSize, gridSize);

        CTX.fillStyle = "#000";
        CTX.font = "15px Arial";
        CTX.fillText(
            item.type.toUpperCase() + (item.type === "reader" ? ` (${item.active})` : ""),
            (item.x * gridSize - camera.x) + (Math.max(1, item.inputs.length) * gridSize / 2) - CTX.measureText(item.type.toUpperCase()).width / 2,
            (item.y * gridSize - camera.y) + (gridSize / 2)
        );

        // Draw Input Wires

        for (let i = 0; i < item.inputs.length; i++) {
            if (item.inputs[i] !== null) {
                CTX.lineWidth = 5;
                CTX.lineCap = "butt";
                CTX.strokeStyle = items[item.inputs[i]].result ? "#00ff00" : "#000";
                item.inputvals[i] = items[item.inputs[i]].result;
                CTX.beginPath();
                CTX.moveTo(
                    ((item.x + i) * gridSize - camera.x) + (gridSize / 2),
                    item.y * gridSize - camera.y);
                CTX.lineTo((items[item.inputs[i]].x * gridSize - camera.x) + (Math.max(1, items[item.inputs[i]].inputs.length) * gridSize) / 2, (items[item.inputs[i]].y + 1) * gridSize - camera.y);
                CTX.stroke();
            }
        }

        // Draw Input Outlet

        for (let i = 0; i < item.inputs.length; i++) {
            if (dist(((item.x + i) * gridSize - camera.x) + (gridSize / 2) - (gridSize / 8),
                item.y * gridSize - camera.y - gridSize / 4, mouse.x, mouse.y) < gridSize / 4 && mouse.newWire === 1) {
                CTX.fillStyle = `rgba(0, 0, 0, ${1})`;
                mouse.highlightCode2 = bl;
                mouse.highlightCode2i = i;
            } else {
                CTX.fillStyle = `rgba(0, 0, 0, ${.25})`;
            }
            CTX.fillRect(
                ((item.x + i) * gridSize - camera.x) + (gridSize / 2) - (gridSize / 8),
                item.y * gridSize - camera.y - gridSize / 4,
                gridSize / 4,
                gridSize / 4
            );
        }

        // Draw Output Outlet

        if (dist((item.x * gridSize - camera.x) + (Math.max(1, item.inputs.length) * gridSize) / 2, (item.y + 1) * gridSize - camera.y, mouse.x, mouse.y) > gridSize / 4) {
            CTX.fillStyle = `rgba(0, 0, 0, ${.25})`;
        } else {
            if (mouse.newWire === 0) {
                CTX.fillStyle = `rgba(0, 0, 0, ${1})`;
                highlightWire = true;
                mouse.highlightX = item.x + item.inputs.length / 2;
                mouse.highlightY = item.y + 1;
                mouse.highlightCode1 = bl;
            }
        }

        CTX.beginPath();
        CTX.moveTo((item.x * gridSize - camera.x) + (Math.max(1, item.inputs.length) * gridSize) / 2, (item.y + 1) * gridSize - camera.y);
        CTX.lineTo(((item.x * gridSize - camera.x) + (Math.max(1, item.inputs.length) * gridSize) / 2) - (gridSize / 6), ((item.y + 1) * gridSize - camera.y) + (gridSize / 6));
        CTX.lineTo(((item.x * gridSize - camera.x) + (Math.max(1, item.inputs.length) * gridSize) / 2) + (gridSize / 6), ((item.y + 1) * gridSize - camera.y) + (gridSize / 6));
        CTX.fill();

        // Do Logic

        switch (item.type) {
            case "battery":
                item.result = true;
                break;
            case "or":
                item.result = item.inputvals.reduce((a, b) => a + b) > 0;
                break;
            case "not":
                item.result = !item.inputvals[0];
                break;
            case "and":
                item.result = item.inputvals.reduce((a, b) => a + b) === item.inputvals.length;
                break;
            case "switch":
                item.result = item.active;
                break;
            case "lamp":
                item.result = item.inputvals[0];
                item.active = item.inputvals[0];
                break;
            case "xor":
                item.result = item.inputvals.reduce((a, b) => a + b) > 0;
                if (item.inputvals.reduce((a, b) => a + b) === item.inputvals.length) item.result = false;
                break;
            case "reader":
                item.result = item.inputvals.reduce((a, b) => a + b) > 0;
                let total = 1;
                item.active = 0;
                item.inputvals.reverse().forEach(i => {
                    if (i) item.active += total;
                    total *= 2;
                });
            default:
                item.result = item.inputvals.reduce((a, b) => a + b) > 0;
                break;
        }
    });
};
const resizeCanvas = () => {
    Object.assign(CANVAS, {
        width: window.innerWidth,
        height: window.innerHeight,
    });
    update();
};
const mod = (a, n) => a - n * Math.floor(a / n);
const dist = (x1, y1, x2, y2) => Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("mousedown", (e) => {
    if (e.button === 2) mouse.held = true;
});
window.addEventListener("mouseup", (e) => {
    if (e.button === 2) mouse.held = false;
    if (e.button === 0 && mouse.y < CANVAS.height - document.querySelector("#fileContainer").offsetHeight) {
        if (mouse.newWire === 1) {
            if (!mouse.highlightCode1 || !mouse.highlightCode2 || mouse.highlightCode2i == null) return;
            items[mouse.highlightCode2].inputs[mouse.highlightCode2i] = mouse.highlightCode1;
            mouse.newWire = 0;
            mouse.highlightCode1 = null;
            mouse.highlightCode2 = null;
            mouse.highlightCode2i = null;
            return;
        }
        if (!highlightWire) {
            if (mouse.newWire === 0) {
                let oneinput = Object.keys(itemdata).filter(i => itemdata[i]).includes(Object.keys(itemdata)[itemtouch]);
                let z = false;
                Object.keys(items).forEach(c => {
                    if (mouse.globalX >= items[c].x && mouse.globalX < items[c].x + items[c].inputs.length && mouse.globalY === items[c].y) {
                        z = true;
                        switch (items[c].type) {
                            case "switch":
                                items[c].active = !items[c].active;
                                break;
                        }
                        if (Object.keys(itemdata)[itemtouch] === "delete") {
                            removeKey(c);
                            delete items[c];
                        }
                    }
                });
                if (!z && Object.keys(itemdata)[itemtouch] !== "delete") items[generateKey()] = {
                    "type": Object.keys(itemdata)[itemtouch],
                    "x": mouse.globalX,
                    "y": mouse.globalY,
                    inputs: (new Array(oneinput ? 1 : itemwidth)).fill(null),
                    inputvals: (new Array(oneinput ? 1 : itemwidth)).fill(false),
                    result: false,
                    active: false,
                };
            }
        } else {
            mouse.newWire = 1;
        }
    }
});
const removeKey = (c) => {
    Object.keys(items).forEach(key => {
        if (items[key].inputs.includes(c)) items[key].inputs = items[key].inputs.map(i => {
            return i === c ? null : i;
        });
    });
};
window.addEventListener("contextmenu", (e) => {
    e.preventDefault()
    if (mouse.newWire === 1) mouse.newWire = 0;
});
window.addEventListener("mousemove", (e) => {
    if (mouse.held) {
        camera.x -= e.movementX;
        camera.y -= e.movementY;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener("wheel", (e) => {
    gridSize -= e.deltaY * 0.01;
    if (gridSize < 16) return gridSize = 16;
    if (gridSize > 128) return gridSize = 128;
});
window.setInterval(update, 1000 / 60);
resizeCanvas();
const generateKey = () => {
    let j = "";
    for (let i = 0; i < 16; i++) {
        j += String.fromCharCode(Math.floor(Math.random() * 74) + 48);
    }
    return j;
};
window.addEventListener("load", () => {
    Object.keys(itemdata).forEach(i => {
        let d = Object.assign(document.createElement("div"), {
            innerHTML: i,
            onclick: function () {
                itemtouch = Object.keys(itemdata).indexOf(i);
                Array.from(this.parentElement.children).forEach(q => q.classList.remove("buttonSelect"));
                this.classList.add("buttonSelect");
            },
        });
        if (images[i].naturalHeight > 0) {
            d.innerHTML = "";
            d.appendChild(images[i]);
        }
        d.classList.add("btn");
        document.querySelector("#buttonContainer").appendChild(d);
    });
    let k = Object.assign(document.createElement("input"), {
        type: "number",
        value: 1,
        min: 1,
        max: 10,
        id: "aaa",
        onchange: function () {
            itemwidth = parseInt(this.value);
        },
    });
    document.querySelector("#buttonContainer").appendChild(k);
    let k2 = Object.assign(document.createElement("label"), {
        for: "aaa",
        innerText: " Inputs",
    });
    document.querySelector("#buttonContainer").appendChild(k2);
});
document.querySelector("#import").onclick = () => {
    try {
        let a = atob(prompt("Enter your schematic data:"));
        items = JSON.parse(a);
    } catch (e) {
        alert("Corrupted schematic data!");
    }
};
document.querySelector("#export").onclick = () => {
    document.querySelector("#copy").value = btoa(JSON.stringify(items));
    document.querySelector("#copy").select();
    document.execCommand("copy");
    alert("Schematic copied to clipboard!");
};

/*
FULL ADDER

eyJCPzpGd00xQT1zXl1vX2dOIjp7InR5cGUiOiJzd2l0Y2giLCJ4IjoxLCJ5IjoxLCJpbnB1dHMiOltudWxsXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiTjpEWGdraEBybHFUZ2tVTSI6eyJ0eXBlIjoic3dpdGNoIiwieCI6MywieSI6MSwiaW5wdXRzIjpbbnVsbF0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sImpAQUpKRWVeM3BnSVxcTTBcXCI6eyJ0eXBlIjoic3dpdGNoIiwieCI6OSwieSI6MSwiaW5wdXRzIjpbbnVsbF0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIkNpQ3hJNFA7M0RxY0JzT0YiOnsidHlwZSI6InN3aXRjaCIsIngiOjExLCJ5IjoxLCJpbnB1dHMiOltudWxsXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiY2JcXGxMbl47O2BuZHNJbUwiOnsidHlwZSI6InJlYWRlciIsIngiOjksInkiOi0xLCJpbnB1dHMiOlsiakBBSkpFZV4zcGdJXFxNMFxcIiwiQ2lDeEk0UDszRHFjQnNPRiJdLCJpbnB1dHZhbHMiOltmYWxzZSxmYWxzZV0sInJlc3VsdCI6ZmFsc2UsImFjdGl2ZSI6MH0sIlRYVDI3VjEyc1Z3TjRzZ1UiOnsidHlwZSI6InJlYWRlciIsIngiOjEsInkiOi0xLCJpbnB1dHMiOlsiQj86RndNMUE9c15db19nTiIsIk46RFhna2hAcmxxVGdrVU0iXSwiaW5wdXR2YWxzIjpbZmFsc2UsZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOjB9LCI7QkdES1FiaEVSNXNSZ1t5Ijp7InR5cGUiOiJ4b3IiLCJ4Ijo3LCJ5IjozLCJpbnB1dHMiOlsiTjpEWGdraEBybHFUZ2tVTSIsIkNpQ3hJNFA7M0RxY0JzT0YiXSwiaW5wdXR2YWxzIjpbZmFsc2UsZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwibVRpTzlkd2QweXBhd2ZXUSI6eyJ0eXBlIjoiYW5kIiwieCI6NCwieSI6MywiaW5wdXRzIjpbIk46RFhna2hAcmxxVGdrVU0iLCJDaUN4STRQOzNEcWNCc09GIl0sImlucHV0dmFscyI6W2ZhbHNlLGZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIjFqPmJRYTRhRDg0NV15PFxcIjp7InR5cGUiOiJsYW1wIiwieCI6MTMsInkiOjUsImlucHV0cyI6WyI7QkdES1FiaEVSNXNSZ1t5Il0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sInNJOWhfS2BbVEE/MmRpREoiOnsidHlwZSI6ImFuZCIsIngiOjQsInkiOjYsImlucHV0cyI6WyJCPzpGd00xQT1zXl1vX2dOIiwiakBBSkpFZV4zcGdJXFxNMFxcIl0sImlucHV0dmFscyI6W2ZhbHNlLGZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sImBjWFo2eE1cXExcXEtYOTJbPyI6eyJ0eXBlIjoieG9yIiwieCI6NywieSI6NiwiaW5wdXRzIjpbIkI/OkZ3TTFBPXNeXW9fZ04iLCJqQEFKSkVlXjNwZ0lcXE0wXFwiXSwiaW5wdXR2YWxzIjpbZmFsc2UsZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiVnlFc1Z3STRjSW1NUkhYUSI6eyJ0eXBlIjoibGFtcCIsIngiOjgsInkiOjksImlucHV0cyI6WyJgY1haNnhNXFxMXFxLWDkyWz8iXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiPVhtP1o4a08yN3BYXVs4ZyI6eyJ0eXBlIjoibGFtcCIsIngiOjUsInkiOjksImlucHV0cyI6WyJzSTloX0tgW1RBPzJkaURKIl0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIjhES0RGSkw2XFxxdGA9c2FjIjp7InR5cGUiOiJsYW1wIiwieCI6MTAsInkiOjcsImlucHV0cyI6WyJtVGlPOWR3ZDB5cGF3ZldRIl0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sImdCPUc9R3RicTpWNExaQjEiOnsidHlwZSI6ImFuZCIsIngiOjgsInkiOjExLCJpbnB1dHMiOlsiVnlFc1Z3STRjSW1NUkhYUSIsIjhES0RGSkw2XFxxdGA9c2FjIl0sImlucHV0dmFscyI6W2ZhbHNlLGZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIltHcmRZQEhqRThUWThjazsiOnsidHlwZSI6InhvciIsIngiOjExLCJ5IjoxMSwiaW5wdXRzIjpbIlZ5RXNWd0k0Y0ltTVJIWFEiLCI4REtERkpMNlxccXRgPXNhYyJdLCJpbnB1dHZhbHMiOltmYWxzZSxmYWxzZV0sInJlc3VsdCI6ZmFsc2UsImFjdGl2ZSI6ZmFsc2V9LCI0eGI+a09YXT5udV1paDx4Ijp7InR5cGUiOiJsYW1wIiwieCI6MTIsInkiOjEzLCJpbnB1dHMiOlsiW0dyZFlASGpFOFRZOGNrOyJdLCJpbnB1dHZhbHMiOltmYWxzZV0sInJlc3VsdCI6ZmFsc2UsImFjdGl2ZSI6ZmFsc2V9LCJFd19QQ3N2Q0tMPVJ2XFw4UCI6eyJ0eXBlIjoiYW5kIiwieCI6NSwieSI6MTQsImlucHV0cyI6WyI9WG0/WjhrTzI3cFhdWzhnIiwiZ0I9Rz1HdGJxOlY0TFpCMSJdLCJpbnB1dHZhbHMiOltmYWxzZSxmYWxzZV0sInJlc3VsdCI6ZmFsc2UsImFjdGl2ZSI6ZmFsc2V9LCJ2aFVWOmR2dWEyZTxWWlA+Ijp7InR5cGUiOiJ4b3IiLCJ4Ijo4LCJ5IjoxNCwiaW5wdXRzIjpbIj1YbT9aOGtPMjdwWF1bOGciLCJnQj1HPUd0YnE6VjRMWkIxIl0sImlucHV0dmFscyI6W2ZhbHNlLGZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIlddcmVIN1ZCO3E1RzV0NWciOnsidHlwZSI6InJlYWRlciIsIngiOjksInkiOjE4LCJpbnB1dHMiOlsiRXdfUENzdkNLTD1SdlxcOFAiLCJ2aFVWOmR2dWEyZTxWWlA+IiwiNHhiPmtPWF0+bnVdaWg8eCIsIjFqPmJRYTRhRDg0NV15PFxcIl0sImlucHV0dmFscyI6W2ZhbHNlLGZhbHNlLGZhbHNlLGZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjowfX0=
*/