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
let selectedInputNum: number = 1;

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

            const properties = Chip.Chips[chipType];
            
            if (properties.minInputs !== null) selectedInputNum = Math.max(properties.minInputs, selectedInputNum);
            if (properties.maxInputs !== null) selectedInputNum = Math.min(properties.maxInputs, selectedInputNum);
        });
    });

    window.requestAnimationFrame(draw);
});
const draw = () => {
    const drawTask: {
        sort: number;
        task(g: CanvasRenderingContext2D): void;
    }[] = [];
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
    if (selectedOutputChip && tool === "WIRE") drawTask.push({
        sort: 4,
        task(g) {
            const centeredOutputPosition = selectedOutputChip.getOutputPosition(0, 1);
            const mousePos = Camera.screenToWorld(Mouse.position);
            g.lineWidth = 1 / 32;
            g.strokeStyle = selectedOutputChip.output ? "#0f0" : "#000";
            g.beginPath();
            g.moveTo(centeredOutputPosition.x, centeredOutputPosition.y);
            g.lineTo(mousePos.x, mousePos.y);
            g.stroke();
        },
    });

    // Draw Chips
    chips.forEach(chip => {
        // Draw Chip
        drawTask.push({
            sort: 1,
            task(g) {
                g.fillStyle = chip.color;
                g.fillRect(chip.position.x, chip.position.y, 1, 1);
            },
        });
        
        // Draw Output Wires
        const centeredOutputPosition = chip.getOutputPosition(0, 1);
        chip.outputChips.forEach(outputChip => {
            const centeredInputPosition = outputChip.Chip.getInputPosition(outputChip.InputID, 0, -1);
            drawTask.push({
                sort: 0,
                task(g) {
                    g.lineWidth = 1 / 32;
                    g.strokeStyle = chip.output ? "#0f0" : "#000";
                    g.beginPath();
                    g.moveTo(centeredOutputPosition.x, centeredOutputPosition.y);
                    g.lineTo(centeredInputPosition.x, centeredInputPosition.y);
                    g.stroke();
                }
            });
        });

        drawTask.push({
            sort: 1,
            task(g) {
                // Draw Inputs
                chip.inputs.forEach((input, i) => {
                    g.fillStyle = input ? "#0f0" : "#aaa";

                    const inputPosition = chip.getInputPosition(i);
                    g.fillRect(inputPosition.x, inputPosition.y, chip.outletSize, chip.outletSize);
                });

                // Draw Output
                g.fillStyle = chip.output ? "#0f0" : "#aaa";
                const outputPosition = chip.getOutputPosition();
                g.fillRect(outputPosition.x, outputPosition.y, chip.outletSize, chip.outletSize);
            },
        });
        

        // Draw Label
        drawTask.push({
            sort: 2,
            task(g) {
                g.font = "bold 1px consolas";
                g.fillStyle = "#000";
                g.fillText(chip.type, chip.position.x, chip.position.y + 1, 1);
            },
        });
    });

    // Ghost Design
    if (tool === "DESIGN") drawTask.push({
        sort: 3,
        task(g) {
            g.globalAlpha = 0.5;
            const chipProperties = Chip.Chips[selectedBuildChipType];
            const mousePos = Camera.screenToWorld(Mouse.position);
            g.fillStyle = chipProperties.color ?? "#aaa";
            g.fillRect(Math.floor(mousePos.x), Math.floor(mousePos.y), 1, 1);
    
            // Draw Label
            g.font = "bold 1px consolas";
            g.fillStyle = "#000";
            g.fillText(selectedBuildChipType, Math.floor(mousePos.x), Math.floor(mousePos.y) + 1, 1);

            // Draw Input Label
            g.font = `bold 0.5px consolas`;
            g.fillText(selectedInputNum.toString(), Math.floor(mousePos.x) + .5 - g.measureText(selectedInputNum.toString()).width / 2, Math.floor(mousePos.y), 1);

            g.globalAlpha = 1;
        },
    });

    drawTask.sort((a, b) => (a.sort - b.sort)).forEach(task => {
        task.task(g);
    });

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
                    const inputPos = selectedChip.getInputPosition(i);
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
            }, selectedBuildChipType, selectedInputNum));
        }
    }
});
canvas.addEventListener("wheel", (evtWheel: WheelEvent) => {
    if (tool === "DESIGN") {
        selectedInputNum += Math.sign(evtWheel.deltaY);
        const properties = Chip.Chips[selectedBuildChipType];
        if (properties.minInputs !== null) selectedInputNum = Math.max(properties.minInputs, selectedInputNum);
        if (properties.maxInputs !== null) selectedInputNum = Math.min(properties.maxInputs, selectedInputNum);
    } else {
        Camera.zoomAtPosition(-Math.sign(evtWheel.deltaY), Camera.screenToWorld(Mouse.position));
    }
});
canvas.addEventListener("contextmenu", (evtContextMenu: MouseEvent) => {
    evtContextMenu.preventDefault();
});