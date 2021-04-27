/// file:///D:/Projects/logicmap/index.html
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

const itemdata = { "delete": true, "switch": true, "output": true, "battery": true, "not": true, "and": false, "or": false, "xor": false, "reader": false, };
const images = {
    "switch_active": Object.assign(document.createElement("img"), { src: "./switch_active.png" }),
    "output_active": Object.assign(document.createElement("img"), { src: "./output_active.png" }),
};
Object.keys(itemdata).forEach(c => {
    images[c] = Object.assign(document.createElement("img"), {
        src: `./${c}.png`,
    });
});
let itemtouch = 0;
let itemwidth = 2;
let highlightWire = false;
let items = {};
let useicons = false;

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
        CTX.strokeStyle = "#001";
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

        if (!useicons || images[item.type].naturalHeight === 0) {
            CTX.fillStyle = "#000";
            CTX.font = "15px Arial";
            const mytext = item.type.toUpperCase() + (item.type === "reader" ? ` (${item.active})` : "");
            CTX.fillText(
                mytext,
                (item.x * gridSize - camera.x) + (Math.max(1, item.inputs.length) * gridSize / 2) - CTX.measureText(mytext).width / 2,
                (item.y * gridSize - camera.y) + (gridSize / 2)
            );
        } else {
            CTX.drawImage(item.active ? images[item.type + "_active"] : images[item.type], (item.x * gridSize - camera.x) + ((item.inputs.length - 1) * gridSize) / 2, item.y * gridSize - camera.y, gridSize, gridSize)
        }

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
            case "output":
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
const reloadgui = () => {
    document.querySelector("#buttonContainer").innerHTML = "";
    Object.keys(itemdata).forEach(i => {
        let d = Object.assign(document.createElement("div"), {
            innerHTML: i,
            onclick: function () {
                itemtouch = Object.keys(itemdata).indexOf(i);
                Array.from(this.parentElement.children).forEach(q => q.classList.remove("buttonSelect"));
                this.classList.add("buttonSelect");
            },
        });
        if (images[i].naturalHeight > 0 && useicons) {
            d.innerHTML = "";
            d.appendChild(images[i]);
        }
        d.classList.add("btn");
        if (i === "switch") d.classList.add("buttonSelect");
        itemtouch = 1;
        document.querySelector("#buttonContainer").appendChild(d);
    });
    let k = Object.assign(document.createElement("input"), {
        type: "number",
        value: itemwidth,
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
    document.querySelector("#buttonContainer").appendChild(document.createElement("br"));
    let z = Object.assign(document.createElement("input"), {
        type: "checkbox",
        id: "aab",
        checked: useicons,
        onchange: function () {
            useicons = this.checked;
            reloadgui();
        },
    });
    document.querySelector("#buttonContainer").appendChild(z);
    let z2 = Object.assign(document.createElement("label"), {
        for: "aab",
        innerText: " Use Icons",
    });
    document.querySelector("#buttonContainer").appendChild(z2);
};
window.addEventListener("load", reloadgui);
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

eyI7QkdES1FiaEVSNXNSZ1t5Ijp7InR5cGUiOiJ4b3IiLCJ4Ijo3LCJ5IjozLCJpbnB1dHMiOlsiWEpmR2YzUjVHWkdQUk1SUiIsImw7P2xOW2xweGFTOFBfNUAiXSwiaW5wdXR2YWxzIjpbdHJ1ZSx0cnVlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIm1UaU85ZHdkMHlwYXdmV1EiOnsidHlwZSI6ImFuZCIsIngiOjQsInkiOjMsImlucHV0cyI6WyJYSmZHZjNSNUdaR1BSTVJSIiwibDs/bE5bbHB4YVM4UF81QCJdLCJpbnB1dHZhbHMiOlt0cnVlLHRydWVdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6ZmFsc2V9LCIxaj5iUWE0YUQ4NDVdeTxcXCI6eyJ0eXBlIjoib3V0cHV0IiwieCI6MTMsInkiOjUsImlucHV0cyI6WyI7QkdES1FiaEVSNXNSZ1t5Il0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sInNJOWhfS2BbVEE/MmRpREoiOnsidHlwZSI6ImFuZCIsIngiOjQsInkiOjYsImlucHV0cyI6WyJGSzg2OV1IdTJkUG83QURuIiwiYThmeEhtS09oeUp3QXR4XiJdLCJpbnB1dHZhbHMiOltmYWxzZSx0cnVlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sImBjWFo2eE1cXExcXEtYOTJbPyI6eyJ0eXBlIjoieG9yIiwieCI6NywieSI6NiwiaW5wdXRzIjpbIkZLODY5XUh1MmRQbzdBRG4iLCJhOGZ4SG1LT2h5SndBdHheIl0sImlucHV0dmFscyI6W2ZhbHNlLHRydWVdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6ZmFsc2V9LCJWeUVzVndJNGNJbU1SSFhRIjp7InR5cGUiOiJvdXRwdXQiLCJ4Ijo4LCJ5Ijo5LCJpbnB1dHMiOlsiYGNYWjZ4TVxcTFxcS1g5Mls/Il0sImlucHV0dmFscyI6W3RydWVdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6dHJ1ZX0sIj1YbT9aOGtPMjdwWF1bOGciOnsidHlwZSI6Im91dHB1dCIsIngiOjUsInkiOjksImlucHV0cyI6WyJzSTloX0tgW1RBPzJkaURKIl0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIjhES0RGSkw2XFxxdGA9c2FjIjp7InR5cGUiOiJvdXRwdXQiLCJ4IjoxMCwieSI6NywiaW5wdXRzIjpbIm1UaU85ZHdkMHlwYXdmV1EiXSwiaW5wdXR2YWxzIjpbdHJ1ZV0sInJlc3VsdCI6dHJ1ZSwiYWN0aXZlIjp0cnVlfSwiZ0I9Rz1HdGJxOlY0TFpCMSI6eyJ0eXBlIjoiYW5kIiwieCI6OCwieSI6MTEsImlucHV0cyI6WyJWeUVzVndJNGNJbU1SSFhRIiwiOERLREZKTDZcXHF0YD1zYWMiXSwiaW5wdXR2YWxzIjpbdHJ1ZSx0cnVlXSwicmVzdWx0Ijp0cnVlLCJhY3RpdmUiOmZhbHNlfSwiW0dyZFlASGpFOFRZOGNrOyI6eyJ0eXBlIjoieG9yIiwieCI6MTEsInkiOjExLCJpbnB1dHMiOlsiVnlFc1Z3STRjSW1NUkhYUSIsIjhES0RGSkw2XFxxdGA9c2FjIl0sImlucHV0dmFscyI6W3RydWUsdHJ1ZV0sInJlc3VsdCI6ZmFsc2UsImFjdGl2ZSI6ZmFsc2V9LCI0eGI+a09YXT5udV1paDx4Ijp7InR5cGUiOiJvdXRwdXQiLCJ4IjoxMiwieSI6MTMsImlucHV0cyI6WyJbR3JkWUBIakU4VFk4Y2s7Il0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIkV3X1BDc3ZDS0w9UnZcXDhQIjp7InR5cGUiOiJhbmQiLCJ4Ijo1LCJ5IjoxNCwiaW5wdXRzIjpbIj1YbT9aOGtPMjdwWF1bOGciLCJnQj1HPUd0YnE6VjRMWkIxIl0sImlucHV0dmFscyI6W2ZhbHNlLHRydWVdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwidmhVVjpkdnVhMmU8VlpQPiI6eyJ0eXBlIjoieG9yIiwieCI6OCwieSI6MTQsImlucHV0cyI6WyI9WG0/WjhrTzI3cFhdWzhnIiwiZ0I9Rz1HdGJxOlY0TFpCMSJdLCJpbnB1dHZhbHMiOltmYWxzZSx0cnVlXSwicmVzdWx0Ijp0cnVlLCJhY3RpdmUiOmZhbHNlfSwiV11yZUg3VkI7cTVHNXQ1ZyI6eyJ0eXBlIjoicmVhZGVyIiwieCI6OSwieSI6MTgsImlucHV0cyI6WyJFd19QQ3N2Q0tMPVJ2XFw4UCIsInZoVVY6ZHZ1YTJlPFZaUD4iLCI0eGI+a09YXT5udV1paDx4IiwiMWo+YlFhNGFEODQ1XXk8XFwiXSwiaW5wdXR2YWxzIjpbZmFsc2UsZmFsc2UsdHJ1ZSxmYWxzZV0sInJlc3VsdCI6dHJ1ZSwiYWN0aXZlIjo0fSwiOmcxY051T0FWMnBgXkBgcyI6eyJ0eXBlIjoiYW5kIiwieCI6LTIsInkiOi00LCJpbnB1dHMiOlsiTnVVdUBQOWludDBZd1NmXFwiLCJZaz4xM0N0P0xWM0M1WHgwIiwiN2pQSGNIdXhgOzB5ZDxKOiJdLCJpbnB1dHZhbHMiOlt0cnVlLHRydWUsdHJ1ZV0sInJlc3VsdCI6dHJ1ZSwiYWN0aXZlIjpmYWxzZX0sImhjQGlQS15ZT3VgOFtGYjUiOnsidHlwZSI6ImFuZCIsIngiOjEsInkiOi00LCJpbnB1dHMiOlsiTnVVdUBQOWludDBZd1NmXFwiLCJvTlM6SWo6UGY+bW5xZWd3Iiwia2FvYUV0U21ZcGdkYlhhZiJdLCJpbnB1dHZhbHMiOlt0cnVlLGZhbHNlLHRydWVdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiT2ReZml0RmJmXmhKOTd4TyI6eyJ0eXBlIjoiYW5kIiwieCI6NCwieSI6LTQsImlucHV0cyI6WyJOdVV1QFA5aW50MFl3U2ZcXCIsIm9OUzpJajpQZj5tbnFlZ3ciLCJuaEppbG1mRmdTSl50TFQ7Il0sImlucHV0dmFscyI6W3RydWUsZmFsc2UsZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiZj03NzRPaVVWND1GPDVYMSI6eyJ0eXBlIjoiYW5kIiwieCI6NywieSI6LTQsImlucHV0cyI6WyJEXzxQPTJeNVJtNF1OXzl5Iiwic01kQmg7OUpSX3JKRHVASyIsIkZmcXIwVWhWSUZnYGVcXGF4Il0sImlucHV0dmFscyI6W3RydWUsZmFsc2UsZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiYjxicF5cXHhfWFt3UT5ON2kiOnsidHlwZSI6ImFuZCIsIngiOjEwLCJ5IjotNCwiaW5wdXRzIjpbIkRfPFA9Ml41Um00XU5fOXkiLCJRVHF4NGJGVW8/TnJAbGRiIiwiQmdjQ2lraWtTSmVgPzpncSJdLCJpbnB1dHZhbHMiOlt0cnVlLHRydWUsZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiXWdJbGZYWktRZFxcS09VWlMiOnsidHlwZSI6ImFuZCIsIngiOjEzLCJ5IjotNCwiaW5wdXRzIjpbIkRfPFA9Ml41Um00XU5fOXkiLCJRVHF4NGJGVW8/TnJAbGRiIiwia3Vza3Q3bGZeeGtAYEZwUiJdLCJpbnB1dHZhbHMiOlt0cnVlLHRydWUsdHJ1ZV0sInJlc3VsdCI6dHJ1ZSwiYWN0aXZlIjpmYWxzZX0sIllrPjEzQ3Q/TFYzQzVYeDAiOnsidHlwZSI6Im5vdCIsIngiOi0xLCJ5IjotNiwiaW5wdXRzIjpbIm9OUzpJajpQZj5tbnFlZ3ciXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6ZmFsc2V9LCI3alBIY0h1eGA7MHlkPEo6Ijp7InR5cGUiOiJub3QiLCJ4IjowLCJ5IjotNiwiaW5wdXRzIjpbIm5oSmlsbWZGZ1NKXnRMVDsiXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6ZmFsc2V9LCJrYW9hRXRTbVlwZ2RiWGFmIjp7InR5cGUiOiJub3QiLCJ4IjozLCJ5IjotNiwiaW5wdXRzIjpbIm5oSmlsbWZGZ1NKXnRMVDsiXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6ZmFsc2V9LCJzTWRCaDs5SlJfckpEdUBLIjp7InR5cGUiOiJub3QiLCJ4Ijo4LCJ5IjotNiwiaW5wdXRzIjpbIlFUcXg0YkZVbz9OckBsZGIiXSwiaW5wdXR2YWxzIjpbdHJ1ZV0sInJlc3VsdCI6ZmFsc2UsImFjdGl2ZSI6ZmFsc2V9LCJGZnFyMFVoVklGZ2BlXFxheCI6eyJ0eXBlIjoibm90IiwieCI6OSwieSI6LTYsImlucHV0cyI6WyJrdXNrdDdsZl54a0BgRnBSIl0sImlucHV0dmFscyI6W3RydWVdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiQmdjQ2lraWtTSmVgPzpncSI6eyJ0eXBlIjoibm90IiwieCI6MTIsInkiOi02LCJpbnB1dHMiOlsia3Vza3Q3bGZeeGtAYEZwUiJdLCJpbnB1dHZhbHMiOlt0cnVlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIk51VXVAUDlpbnQwWXdTZlxcIjp7InR5cGUiOiJzd2l0Y2giLCJ4IjoxLCJ5IjotOCwiaW5wdXRzIjpbbnVsbF0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0Ijp0cnVlLCJhY3RpdmUiOnRydWV9LCJvTlM6SWo6UGY+bW5xZWd3Ijp7InR5cGUiOiJzd2l0Y2giLCJ4IjoyLCJ5IjotOCwiaW5wdXRzIjpbbnVsbF0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0IjpmYWxzZSwiYWN0aXZlIjpmYWxzZX0sIm5oSmlsbWZGZ1NKXnRMVDsiOnsidHlwZSI6InN3aXRjaCIsIngiOjMsInkiOi04LCJpbnB1dHMiOltudWxsXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiRF88UD0yXjVSbTRdTl85eSI6eyJ0eXBlIjoic3dpdGNoIiwieCI6MTAsInkiOi04LCJpbnB1dHMiOltudWxsXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6dHJ1ZX0sIlFUcXg0YkZVbz9OckBsZGIiOnsidHlwZSI6InN3aXRjaCIsIngiOjExLCJ5IjotOCwiaW5wdXRzIjpbbnVsbF0sImlucHV0dmFscyI6W2ZhbHNlXSwicmVzdWx0Ijp0cnVlLCJhY3RpdmUiOnRydWV9LCJrdXNrdDdsZl54a0BgRnBSIjp7InR5cGUiOiJzd2l0Y2giLCJ4IjoxMiwieSI6LTgsImlucHV0cyI6W251bGxdLCJpbnB1dHZhbHMiOltmYWxzZV0sInJlc3VsdCI6dHJ1ZSwiYWN0aXZlIjp0cnVlfSwiRks4NjldSHUyZFBvN0FEbiI6eyJ0eXBlIjoib3V0cHV0IiwieCI6MSwieSI6MCwiaW5wdXRzIjpbIlFdVDI5OVl4dGI4cmVTQEAiXSwiaW5wdXR2YWxzIjpbZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiWEpmR2YzUjVHWkdQUk1SUiI6eyJ0eXBlIjoib3V0cHV0IiwieCI6MywieSI6MCwiaW5wdXRzIjpbIlViUnk1a29GQWs1SVE+eF0iXSwiaW5wdXR2YWxzIjpbdHJ1ZV0sInJlc3VsdCI6dHJ1ZSwiYWN0aXZlIjp0cnVlfSwiVWJSeTVrb0ZBazVJUT54XSI6eyJ0eXBlIjoib3IiLCJ4Ijo0LCJ5IjotMiwiaW5wdXRzIjpbIjpnMWNOdU9BVjJwYF5AYHMiLCJPZF5maXRGYmZeaEo5N3hPIl0sImlucHV0dmFscyI6W3RydWUsZmFsc2VdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6ZmFsc2V9LCJRXVQyOTlZeHRiOHJlU0BAIjp7InR5cGUiOiJvciIsIngiOjEsInkiOi0yLCJpbnB1dHMiOlsiaGNAaVBLXllPdWA4W0ZiNSIsIk9kXmZpdEZiZl5oSjk3eE8iXSwiaW5wdXR2YWxzIjpbZmFsc2UsZmFsc2VdLCJyZXN1bHQiOmZhbHNlLCJhY3RpdmUiOmZhbHNlfSwiYThmeEhtS09oeUp3QXR4XiI6eyJ0eXBlIjoib3V0cHV0IiwieCI6OSwieSI6MCwiaW5wdXRzIjpbIlVnM244N15TMzhpW0A3OFMiXSwiaW5wdXR2YWxzIjpbdHJ1ZV0sInJlc3VsdCI6dHJ1ZSwiYWN0aXZlIjp0cnVlfSwibDs/bE5bbHB4YVM4UF81QCI6eyJ0eXBlIjoib3V0cHV0IiwieCI6MTEsInkiOjAsImlucHV0cyI6WyI2OEpWVnIydmxDSTJJN0xLIl0sImlucHV0dmFscyI6W3RydWVdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6dHJ1ZX0sIlVnM244N15TMzhpW0A3OFMiOnsidHlwZSI6Im9yIiwieCI6OCwieSI6LTIsImlucHV0cyI6WyJiPGJwXlxceF9YW3dRPk43aSIsIl1nSWxmWFpLUWRcXEtPVVpTIl0sImlucHV0dmFscyI6W2ZhbHNlLHRydWVdLCJyZXN1bHQiOnRydWUsImFjdGl2ZSI6ZmFsc2V9LCI2OEpWVnIydmxDSTJJN0xLIjp7InR5cGUiOiJvciIsIngiOjExLCJ5IjotMiwiaW5wdXRzIjpbImY9Nzc0T2lVVjQ9Rjw1WDEiLCJdZ0lsZlhaS1FkXFxLT1VaUyJdLCJpbnB1dHZhbHMiOltmYWxzZSx0cnVlXSwicmVzdWx0Ijp0cnVlLCJhY3RpdmUiOmZhbHNlfX0=
*/