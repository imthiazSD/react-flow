export function pointInRect(x, y, rect) {
    return inRange(x, rect.x, rect.x + rect.width) &&
           inRange(y, rect.y, rect.y + rect.height);

}
function inRange(value, min, max) {
    return value >= Math.min(min, max) && value <= Math.max(min, max);
}
