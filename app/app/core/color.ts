interface IColor {
    r:number;
    g:number;
    b:number;
    a:number;
}

export default class Color implements IColor {
    public static BLACK = {r: 0, g: 0, b: 0, a: 255};
    public static BLUE = {r: 0, g: 150, b: 255, a: 255};
    public static RED = {r: 255, g: 0, b: 0, a: 255};

    public static colorFromImageData(imageData:ImageData) {
        const p = imageData.data;
        return new Color(p[0], p[1], p[2], p[3]);
    }

    public static equals(c1:IColor, c2:IColor) {
        return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
    }

    public static asString(c:IColor) {
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
    }

    public equals(color:IColor) {
        return Color.equals(this, color);
    }

    constructor(public r:number, public g:number, public b:number, public a:number) {
    }
}
