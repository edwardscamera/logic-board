export default class Input {
    public static mousePosition = {
        x: 0,
        y: 0,
    }
    public static keyDown: Record<string, boolean> = {};
    public static initialize() {
        window.addEventListener("mousemove", (evtMouseMove: MouseEvent) => {
            this.mousePosition.x = evtMouseMove.pageX;
            this.mousePosition.y = evtMouseMove.pageY;
        });
        window.addEventListener("keydown", (evtKeyDown: KeyboardEvent) => {
            this.keyDown[evtKeyDown.key] = true;
        });
        window.addEventListener("keyup", (evtKeyUp: KeyboardEvent) => {
            this.keyDown[evtKeyUp.key] = false;
        });
    }
}