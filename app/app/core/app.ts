'use strict';

import * as Bluebird from 'bluebird';
import Color from './color';
import ImageLoader from './imageLoader';

export class App {
    private imageLoader:ImageLoader = new ImageLoader();
    private drawingCanvas:HTMLCanvasElement;
    private fundusImage:HTMLImageElement;
    private previewCanvas:HTMLCanvasElement;
    private drawingCtx:CanvasRenderingContext2D;
    private previewOpacitySlider:HTMLInputElement;
    private currentFillColor:IColor = Color.BLUE;
    private debouncedRedrawPreview = App.debounce(this.redrawPreview.bind(this), 300);
    private brushColorSwitch:HTMLButtonElement;
    private nextButton:HTMLButtonElement;
    private notificationEl:HTMLElement;

    private static API_URL = 'http://localhost:1337';

    private static debounce(fn:Function, delay:number) {
        let timer:number = null;
        return function (...args:Array<any>) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }

    private init() {
        this.addEventHandlers();
        this.updatePreviewOpacity();

        this.loadNext();
    }

    private addEventHandlers() {
        this.drawingCanvas.addEventListener('mousedown', (ev:MouseEvent) => {
            this.handleMouseEvent(ev);

            const onMousemove = this.handleMouseEvent.bind(this);
            const onMouseup = () => {
                this.drawingCanvas.removeEventListener('mousemove', onMousemove);
                this.drawingCanvas.removeEventListener('mouseup', onMouseup);
            };

            this.drawingCanvas.addEventListener('mousemove', onMousemove);
            this.drawingCanvas.addEventListener('mouseup', onMouseup);
        });

        this.previewOpacitySlider.addEventListener('input', this.updatePreviewOpacity.bind(this));

        this.brushColorSwitch.addEventListener('click', this.switchBrushColor.bind(this));

        this.nextButton.addEventListener('click', () => {
            this.saveResult().then(() => {
                this.loadNext();
            });
        });
    }

    private handleMouseEvent(ev:MouseEvent) {
        ev.preventDefault();
        this.colorVessel(ev);
    }

    private colorVessel(ev:MouseEvent) {
        const {x, y} = this.getClickCoordinates(ev);
        this.brush(x, y);
        this.debouncedRedrawPreview();
    }

    private brush(x:number, y:number) {
        const canvasWidth = this.drawingCanvas.width;
        const canvasHeight = this.drawingCanvas.height;
        let sw = 5;
        let sh = 5;
        let px = x - (sw - 1) / 2;
        let py = y - (sh - 1) / 2;

        if (px < 0) {
            px = 0;
            --sw;
        }
        if (py < 0) {
            py = 0;
            --sh;
        }
        if (px + sw > canvasWidth) {
            --sw;
        }
        if (py + sh > canvasHeight) {
            --sh;
        }
        const currentImageData = this.drawingCtx.getImageData(px, py, sw, sh);
        const d = currentImageData.data;
        for (let i = 0; i < d.length * 4; i += 4) {
            if (d[i] <= 128 && d[i + 1] <= 128 && d[i + 2] <= 128) { // background
                continue;
            }
            d[i] = this.currentFillColor.r;
            d[i + 1] = this.currentFillColor.g;
            d[i + 2] = this.currentFillColor.b;
        }
        this.drawingCtx.putImageData(currentImageData, px, py);
    }

    private switchBrushColor() {
        this.brushColorSwitch.classList.remove('color-blue');
        this.brushColorSwitch.classList.remove('color-red');

        if (Color.equals(this.currentFillColor, Color.RED)) {
            this.currentFillColor = Color.BLUE;
            this.brushColorSwitch.classList.add('color-blue');
        } else if (Color.equals(this.currentFillColor, Color.BLUE)) {
            this.currentFillColor = Color.RED;
            this.brushColorSwitch.classList.add('color-red');
        }
    }

    private saveResult():Bluebird<any> {
        const data = this.drawingCanvas.toDataURL();
        return Bluebird.resolve($.ajax({
            type: 'POST',
            url: `${App.API_URL}/classification`,
            data: {
                image: data,
                name: this.imageLoader.getCurrentIndex()
            }
        }));
    }

    private loadNext() {
        this.imageLoader.goToNext();
        if (!this.imageLoader.hasNext()) {
            this.finished();
            return;
        }

        this.loadFundusImage().then(() => {
            return this.loadVesselsImage();
        }).then(() => {
            this.redrawPreview();
        });
    }

    private loadFundusImage():Bluebird<any> {
        const path = this.imageLoader.getFundusImagePath();

        return this.imageLoader.loadImage(path).then((image:HTMLImageElement) => {
            this.fundusImage.src = path;
        });
    }

    private loadVesselsImage():Bluebird<any> {
        this.clearCanvas();
        const path = this.imageLoader.getVesselImagePath();
        return this.imageLoader.loadImage(path).then((image:HTMLImageElement) => {
            this.drawingCtx.drawImage(image, 0, 0);
        });
    }

    private clearCanvas() {
        // clear canvas hack
        this.drawingCanvas.width = this.drawingCanvas.width;
        this.redrawPreview();
    }

    private getClickCoordinates(ev:MouseEvent):{x:number, y:number} {
        let x:number, y:number;

        if (ev.pageX != null && ev.pageY != null) {
            x = ev.pageX;
            y = ev.pageY;
        } else {
            x = ev.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = ev.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        x -= this.drawingCanvas.offsetLeft;
        y -= this.drawingCanvas.offsetTop;

        return {x, y};
    }

    private redrawPreview() {
        this.previewCanvas.width = this.drawingCanvas.width;
        this.previewCanvas.height = this.drawingCanvas.height;
        const previewCtx = this.previewCanvas.getContext('2d');
        const drawnImageData = this.drawingCtx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        const d = drawnImageData.data;
        for (let i = 0; i < d.length * 4; i += 4) {
            if (d[i] <= 128 && d[i + 1] <= 128 && d[i + 2] <= 128) {
                d[i + 3] = 0;
            } else if (d[i] >= 128 && d[i + 1] >= 128 && d[i + 2] >= 128) {
                d[i + 3] = 0;
            }
        }
        previewCtx.putImageData(drawnImageData, 0, 0);
    }

    private updatePreviewOpacity() {
        this.changePreviewTransparency(Number(this.previewOpacitySlider.value));
    }

    private changePreviewTransparency(val:number) {
        this.previewCanvas.style.opacity = String(val);
    }

    private finished():void {
        this.notificationEl.textContent = 'To było ostatnie zdjęcie.';
    }

    constructor(private $:JQueryStatic) {
        this.drawingCanvas = <HTMLCanvasElement>$('#vessels').get(0);
        this.previewCanvas = <HTMLCanvasElement>$('#preview').get(0);
        this.fundusImage = <HTMLImageElement>$('#fundus').get(0);
        this.previewOpacitySlider = <HTMLInputElement>$('#preview-opacity-slider').get(0);
        this.brushColorSwitch = <HTMLButtonElement>$('.vessels-brush-color').get(0);
        this.nextButton = <HTMLButtonElement>$('#next-button').get(0);
        this.notificationEl = $('#notification').get(0);
        this.drawingCtx = this.drawingCanvas.getContext('2d');

        this.init();
    }
}
