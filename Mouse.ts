export default class Mouse {
    public static position = {
        x: 0,
        y: 0,
    }
    public static initialize() {
        window.addEventListener("mousemove", (evtMouseMove: MouseEvent) => {
            this.position.x = evtMouseMove.pageX;
            this.position.y = evtMouseMove.pageY;
        });
    }
}