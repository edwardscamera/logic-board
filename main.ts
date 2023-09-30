import Camera from "./Camera.js";
import Mouse from "./Mouse.js";

const $ = (selector: string) => document.querySelector(selector);
const canvas = <HTMLCanvasElement>$("canvas");
const g: CanvasRenderingContext2D = canvas.getContext("2d");

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



    window.requestAnimationFrame(draw);
};

window.addEventListener("mousedown", (evtMouseDown: MouseEvent) => {
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
window.addEventListener("wheel", (evtWheel: WheelEvent) => {
    Camera.zoomAtPosition(-Math.sign(evtWheel.deltaY), Camera.screenToWorld(Mouse.position));
});
window.addEventListener("contextmenu", (evtContextMenu: MouseEvent) => {
    evtContextMenu.preventDefault();
});