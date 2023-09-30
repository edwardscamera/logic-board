import Camera from "./Camera.js";
import Chip from "./Chip.js";
import ChipInput from "./ChipInput.js";
import Input from "./Input.js";

const $ = (selector: string) => document.querySelector(selector);
const canvas = <HTMLCanvasElement>$("canvas");
const g: CanvasRenderingContext2D = canvas.getContext("2d");
let tool: string = "INTERACT";

let chips: Chip[] = [];
let selectedOutputChip: Chip = null;
let selectedBuildChipType: string = "NODE";
let selectedInputNum: number = 1;
let selectedRotation: number = 0;
let highlightedOutlet: ChipInput | Chip;

window.addEventListener("load", () => {
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    Input.initialize();
    Camera.initialize(canvas);

    // Setup Rotation Listener
    Input.onKeyPressed("r", () => {
        selectedRotation += Math.PI / 2;
        selectedRotation %= Math.PI * 2;
    });

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
        $("#toolbar").insertBefore(chipBtn, $("#divider-2"));
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

            tool = "DESIGN";
            toolbarBtns.forEach(toolBtn => {
                toolBtn.classList.remove("selected");
                if (toolBtn.getAttribute("toolName") === tool) toolBtn.classList.add("selected");
            });
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

    highlightedOutlet = null;

    // Draw selected output wire
    if (selectedOutputChip && tool === "WIRE") drawTask.push({
        sort: 4,
        task(g) {
            const centeredOutputPosition = selectedOutputChip.getOutputPosition(0, 2);
            const mousePos = Camera.screenToWorld(Input.mousePosition);
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
                g.save();
                g.translate(chip.position.x + .5, chip.position.y + .5);
                g.rotate(chip.rotation);
                g.fillStyle = chip.color;
                g.fillRect(-.5, -.5, 1, 1);
                g.restore();
            },
        });
        
        // Draw Output Wires
        const centeredOutputPosition = chip.getOutputPosition(0, 2);
        chip.outputChips.forEach(outputChip => {
            const centeredInputPosition = outputChip.Chip.getInputPosition(outputChip.InputID, 0, -2);
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
                    const inputPosition = chip.getInputPosition(i, 0, -1);
                    g.fillStyle = input ? "#0f0" : "#aaa";
                    if (tool === "WIRE" && selectedOutputChip && Input.mouseIn(
                        inputPosition.x - chip.outletSize / 2,
                        inputPosition.y - chip.outletSize / 2,
                        chip.outletSize, chip.outletSize
                    )) {
                        g.fillStyle = "#ff0";
                        highlightedOutlet = {
                            Chip: chip,
                            InputID: i,
                        };
                    }
                    
                    g.fillRect(
                        inputPosition.x - chip.outletSize / 2,
                        inputPosition.y - chip.outletSize / 2,
                        chip.outletSize, chip.outletSize
                    );
                });

                // Draw Output
                g.fillStyle = chip.output ? "#0f0" : "#aaa";
                const outputPosition = chip.getOutputPosition(0, 1);
                if (tool === "WIRE" && !selectedOutputChip && Input.mouseIn(
                    outputPosition.x - chip.outletSize / 2,
                    outputPosition.y - chip.outletSize / 2,
                    chip.outletSize, chip.outletSize
                )) {
                    g.fillStyle = "#ff0";
                    highlightedOutlet = chip;
                }
                g.fillRect(
                    outputPosition.x - chip.outletSize / 2,
                    outputPosition.y - chip.outletSize / 2,
                    chip.outletSize, chip.outletSize
                );
            },
        });
        

        // Draw Label
        drawTask.push({
            sort: 2,
            task(g) {
                g.save();
                g.translate(chip.position.x + .5, chip.position.y + .5);
                g.rotate(chip.rotation);
                g.font = "bold 1px consolas";
                g.fillStyle = "#000";
                g.fillText(chip.type, -.5, -.5 + 1, 1);
                g.restore();
            },
        });
    });

    // Ghost Design
    if (tool === "DESIGN") drawTask.push({
        sort: 3,
        task(g) {
            g.save();
            const mousePos = Camera.screenToWorld(Input.mousePosition);
            g.translate(Math.floor(mousePos.x) + .5, Math.floor(mousePos.y) + .5);
            g.rotate(selectedRotation);
            g.globalAlpha = 0.5;

            const chipProperties = Chip.Chips[selectedBuildChipType];
            g.fillStyle = chipProperties.color ?? "#aaa";
            g.fillRect(-.5, -.5, 1, 1);
    
            // Draw Label
            g.font = "bold 1px consolas";
            g.fillStyle = "#000";
            g.fillText(selectedBuildChipType, -.5, -.5 + 1, 1);

            // Draw Input Label
            g.font = `bold 0.5px consolas`;
            g.fillText(selectedInputNum.toString(), -.5 + .5 - g.measureText(selectedInputNum.toString()).width / 2, -.5, 1);

            g.globalAlpha = 1;
            g.restore();
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
    if (tool === "WIRE") {
        if (!selectedOutputChip) selectedOutputChip = <Chip>highlightedOutlet;
        else {
            selectedOutputChip.setOutput(<ChipInput>highlightedOutlet);
            if (!Input.keyDown["Shift"]) selectedOutputChip = null;
        }
        return;
    }

    const mousePos = Camera.screenToWorld(Input.mousePosition);    
    const selectedChip: Chip = chips.find(chip => {
        return chip.position.x === Math.floor(mousePos.x) && chip.position.y === Math.floor(mousePos.y);
    });
    if (selectedChip) {
        if (tool === "INTERACT" && evtMouseUp.button === 0) {
            if (selectedChip.type === "SWITCH") {
                selectedChip.output = !selectedChip.output;
                selectedChip.update();
            }
        }
        if (tool === "DESIGN" && evtMouseUp.button === 2) {
            if (selectedChip.outputChips.length === 0 &&
                !selectedChip.inputChips.map(x => x ? 1 : 0).includes(1)
            ) {
                chips.splice(chips.indexOf(selectedChip), 1);
            } else selectedChip.clean();
        }
    } else {
        selectedOutputChip = null;
        if (tool === "DESIGN" && evtMouseUp.button === 0) {
            const mousePos = Camera.screenToWorld(Input.mousePosition);
            chips.push(new Chip({
                x: Math.floor(mousePos.x),
                y: Math.floor(mousePos.y),
            }, selectedBuildChipType, selectedInputNum, selectedRotation));
        }   
    }
    
});
canvas.addEventListener("wheel", (evtWheel: WheelEvent) => {
    if (tool === "DESIGN" && !Input.keyDown["Shift"]) {
        selectedInputNum += -Math.sign(evtWheel.deltaY);
        const properties = Chip.Chips[selectedBuildChipType];
        if (properties.minInputs !== null) selectedInputNum = Math.max(properties.minInputs, selectedInputNum);
        if (properties.maxInputs !== null) selectedInputNum = Math.min(properties.maxInputs, selectedInputNum);
    } else {
        Camera.zoomAtPosition(-Math.sign(evtWheel.deltaY), Camera.screenToWorld(Input.mousePosition));
    }
});
canvas.addEventListener("contextmenu", (evtContextMenu: MouseEvent) => {
    evtContextMenu.preventDefault();
});
$("#exportBtn").addEventListener("click", () => {
    const data: string = btoa(JSON.stringify(chips.map(chip => chip.serialize())));
    if (!navigator.clipboard) return alert(data);
    navigator.clipboard.writeText(data).then(() => {
        alert("Copied data!");
    }, err => {
        alert("An error occurred. Could not copy data.")
    });
});
$("#importBtn").addEventListener("click", () => {
    try {
        const result = JSON.parse(atob(prompt("Enter data: ")));
        chips = result.map((x: any) => {
            const newChip = new Chip({
                x: 0,
                y: 0,
            }, "NODE", 0, 0);
            Object.assign(newChip, x);
            return newChip;
        });
        for(let i = 0; i < chips.length; i++) {
            for(let j = 0; j < chips[i].outputChips.length; j++) {
                if (chips[i].outputChips[j].Chip) chips[i].outputChips[j].Chip = chips.find((x: any) => x.ID === chips[i].outputChips[j].Chip);
            };
            for(let j = 0; j < chips[i].inputChips.length; j++) {
                if (chips[i].inputChips[j]) chips[i].inputChips[j] = chips.find((x: any) => x.ID === chips[i].inputChips[j]);
            };
        }
    } catch(e) {
        alert("An error occurred reading the data.");
    }
});