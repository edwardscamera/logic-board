import Camera from "./Camera.js";
import Chip from "./Chip.js";
import Mouse from "./Mouse.js";

const $ = (selector: string) => document.querySelector(selector);
const canvas = <HTMLCanvasElement>$("canvas");
const g: CanvasRenderingContext2D = canvas.getContext("2d");
let tool: string = "INTERACT";

const chips: Chip[] = [];
let selectedOutputChip: Chip = null;
let selectedBuildChipType: string = "NODE";

const input = new Chip({
    x: 0,
    y: -2,
}, "switch");
const input2 = new Chip({
    x: 4,
    y: -2,
}, "switch");

const and = new Chip({
    x: 2,
    y: 2,
}, "and");

const output = new Chip({
    x: 2,
    y: 6,
}, "node");

chips.push(input, input2, and, output);

window.addEventListener("load", () => {
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    Mouse.initialize();
    Camera.initialize(canvas);

    // Setup Toolbar Buttons
    const toolbarBtns = Array.from($("#toolbar").getElementsByClassName("toolbar-btn"));
    toolbarBtns.forEach(toolBtn => {
        if (toolBtn.getAttribute("toolName") === tool) toolBtn.classList.add("selected");
        toolBtn.addEventListener("click", () => {
            toolbarBtns.forEach(btn => btn.classList.remove("selected"));
            toolBtn.classList.add("selected");
            tool = toolBtn.getAttribute("toolName");
        });
    });
    const chipBtns: HTMLElement[] = [];
    Object.keys(Chip.Chips).forEach(chipType => {
        const chipBtn = document.createElement("span");
        $("#toolbar").appendChild(chipBtn);
        chipBtns.push(chipBtn);
        chipBtn.classList.add("toolbar-btn");
        chipBtn.innerText = chipType;
        if (chipType === selectedBuildChipType) chipBtn.classList.add("selected");
        chipBtn.addEventListener("click", () => {
            chipBtns.forEach(btn => btn.classList.remove("selected"));
            chipBtn.classList.add("selected");
            selectedBuildChipType = chipType;
        });
    });

    window.requestAnimationFrame(draw);
});
const draw = () => {
    // Setup
    g.resetTransform();
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);

    g.translate(canvas.width / 2, canvas.height / 2);

    // Draw Gridlines
    g.lineWidth = 1;
    const drawColumn = (x: number, color: string) => {
        g.strokeStyle = color;
        g.beginPath();
        const xValue = (x - Camera.position.x) * Camera.PPU;
        g.moveTo(xValue, -canvas.height / 2);
        g.lineTo(xValue, canvas.height / 2);
        g.stroke();
    };
    const drawRow = (y: number, color: string) => {
        g.strokeStyle = color;
        g.beginPath();
        const yValue = (y - Camera.position.y) * Camera.PPU;
        g.moveTo(-canvas.width / 2, yValue);
        g.lineTo(canvas.width / 2, yValue);
        g.stroke();
    }
    for(let x = Math.floor(-canvas.width / Camera.PPU / 2 + Camera.position.x); x <= canvas.width / Camera.PPU / 2 + Camera.position.x; x++) {
        drawColumn(x, "#ddd");
    }
    for(let y = Math.floor(-canvas.height / Camera.PPU / 2 + Camera.position.y); y <= canvas.height / Camera.PPU / 2 + Camera.position.y; y++) {
        drawRow(y, "#ddd");
    }
    drawRow(0, "#000");
    drawColumn(0, "#000");

    g.scale(Camera.PPU, Camera.PPU);
    g.translate(-Camera.position.x, -Camera.position.y);

    // Draw selected output wire
    if (selectedOutputChip && tool === "WIRE") {
        const centeredOutputPosition = selectedOutputChip.getOutputPosition(true);
        const mousePos = Camera.screenToWorld(Mouse.position);
        g.lineWidth = 1 / 32;
        g.strokeStyle = selectedOutputChip.output ? "#0f0" : "#000";
        g.beginPath();
        g.moveTo(centeredOutputPosition.x, centeredOutputPosition.y);
        g.lineTo(mousePos.x, mousePos.y);
        g.stroke();
    }

    // Draw Chips
    chips.forEach(chip => {
        // Draw Chip
        g.fillStyle = chip.color;
        g.fillRect(chip.position.x, chip.position.y, 1, 1);

        // Draw Output Wires
        const centeredOutputPosition = chip.getOutputPosition(true);
        chip.outputChips.forEach(outputChip => {
            const centeredInputPosition = outputChip.Chip.getInputPosition(outputChip.InputID, true);
            g.lineWidth = 1 / 32;
            g.strokeStyle = chip.output ? "#0f0" : "#000";
            g.beginPath();
            g.moveTo(centeredOutputPosition.x, centeredOutputPosition.y);
            g.lineTo(centeredInputPosition.x, centeredInputPosition.y);
            g.stroke();
        });

        // Draw Inputs
        chip.inputs.forEach((input, i) => {
            g.fillStyle = input ? "#0f0" : "#aaa";

            const inputPosition = chip.getInputPosition(i);
            g.fillRect(inputPosition.x, inputPosition.y, Chip.outletSize, Chip.outletSize);
        });

        // Draw Output
        g.fillStyle = chip.output ? "#0f0" : "#aaa";
        const outputPosition = chip.getOutputPosition();
        g.fillRect(outputPosition.x, outputPosition.y, Chip.outletSize, Chip.outletSize);

        // Draw Label
        g.font = "bold 1px consolas";
        g.fillStyle = "#000";
        g.fillText(chip.type, chip.position.x, chip.position.y + 1, 1);
    });

    // Ghost Design
    if (tool === "DESIGN") {
        const chipProperties = Chip.Chips[selectedBuildChipType];
        const mousePos = Camera.screenToWorld(Mouse.position);
        g.fillStyle = chipProperties.color ?? "#aaa";
        g.fillRect(Math.floor(mousePos.x), Math.floor(mousePos.y), 1, 1);

        // Draw Label
        g.globalAlpha = 0.2;
        g.font = "bold 1px consolas";
        g.fillStyle = "#000";
        g.fillText(selectedBuildChipType, Math.floor(mousePos.x), Math.floor(mousePos.y) + 1, 1);
        g.globalAlpha = 1;
    }

    window.requestAnimationFrame(draw);
};

canvas.addEventListener("mousedown", (evtMouseDown: MouseEvent) => {
    if (evtMouseDown.button === 2) {
        const onMouseMove = (evtMouseMove: MouseEvent) => {
            Camera.position.x -= evtMouseMove.movementX / Camera.PPU;
            Camera.position.y -= evtMouseMove.movementY / Camera.PPU;
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", (evtMoseUp: MouseEvent) => {
            window.removeEventListener("mousemove", onMouseMove);
        }, { once: true, });
    }
});
canvas.addEventListener("mouseup", (evtMouseUp: MouseEvent) => {
    const mousePos = Camera.screenToWorld(Mouse.position);
    const selectedChip: Chip = chips.find(chip => {
        return chip.position.x === Math.floor(mousePos.x) && chip.position.y === Math.floor(mousePos.y);
    });
    if (selectedChip) {
        if (tool === "INTERACT") {
            if (selectedChip.type === "SWITCH") {
                selectedChip.output = !selectedChip.output;
                selectedChip.update();
            }
        }
        if (tool === "WIRE") {
            if (!selectedOutputChip) selectedOutputChip = selectedChip;
            else {
                const distances = selectedChip.inputs.map((value, i) => {
                    const inputPos = selectedChip.getInputPosition(i, true);
                    return {
                        value: value,
                        InputID: i,
                        distance: Math.sqrt((inputPos.x - mousePos.x) ** 2 + (inputPos.y - mousePos.y) ** 2)
                    };
                }).sort((a, b) => a.distance - b.distance);
                selectedOutputChip.setOutput({
                    Chip: selectedChip,
                    InputID: distances[0].InputID,
                })
            }
        }
        if (tool === "DESIGN" && evtMouseUp.button === 2) {
            selectedChip.clean();
        }
    } else {
        selectedOutputChip = null;
        if (tool === "DESIGN") {
            const mousePos = Camera.screenToWorld(Mouse.position);
            chips.push(new Chip({
                x: Math.floor(mousePos.x),
                y: Math.floor(mousePos.y),
            }, selectedBuildChipType));
        }
    }
});
canvas.addEventListener("wheel", (evtWheel: WheelEvent) => {
    Camera.zoomAtPosition(-Math.sign(evtWheel.deltaY), Camera.screenToWorld(Mouse.position));
});
canvas.addEventListener("contextmenu", (evtContextMenu: MouseEvent) => {
    evtContextMenu.preventDefault();
});