import * as Bluebird from 'bluebird';

export default class ImageLoader {
    private static IMAGES_PATH = '/images/drive';
    private static FUNDUS_IMAGE_SUFFIX = '';
    private static FUNDUS_IMAGE_EXTENSION = '.jpeg';
    private static VESSELS_IMAGE_SUFFIX = '';
    private static VESSELS_IMAGE_EXTENSION = '.jpeg';
    private static IMAGES_RANGE = [1, 10];
    private static STORAGE_INDEX_KEY = 'currentImageIndex';

    private currentImageIndex:number;

    private static padLeft(text:string, len:number, char:string):string {
        const lengthDifference = len - text.length;
        if (lengthDifference <= 0) {
            return text;
        }

        return char.repeat(lengthDifference) + text;
    }

    public loadImage(src:string):Bluebird<HTMLImageElement> {
        const image = new Image();
        image.src = src;
        return new Bluebird<HTMLImageElement>((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = () => {
                reject(new Error(`Couldn't load the image ${src}`));
            };
        });
    }

    public getCurrentIndex():string {
        return ImageLoader.padLeft(String(this.currentImageIndex), 2, '0');
    }

    public hasNext():boolean {
        return this.currentImageIndex == null || this.currentImageIndex <= ImageLoader.IMAGES_RANGE[1];
    }

    public goToNext() {
        if (this.currentImageIndex == null) {
            this.currentImageIndex = ImageLoader.IMAGES_RANGE[0];
        } else if (this.currentImageIndex <= ImageLoader.IMAGES_RANGE[1]) {
            this.currentImageIndex = this.currentImageIndex + 1;
        }
        window.localStorage.setItem(ImageLoader.STORAGE_INDEX_KEY, String(this.currentImageIndex));
    }

    public getFundusImagePath() {
        const paddedIndex = this.getCurrentIndex();
        return `${ImageLoader.IMAGES_PATH}/fundus/${paddedIndex}${ImageLoader.FUNDUS_IMAGE_SUFFIX}${ImageLoader.FUNDUS_IMAGE_EXTENSION}`;
    }

    public getVesselImagePath() {
        const paddedIndex = this.getCurrentIndex();
        return `${ImageLoader.IMAGES_PATH}/vessels/${paddedIndex}${ImageLoader.VESSELS_IMAGE_SUFFIX}${ImageLoader.VESSELS_IMAGE_EXTENSION}`;
    }

    constructor() {
        const savedIndex = Number(window.localStorage.getItem(ImageLoader.STORAGE_INDEX_KEY));
        if (savedIndex) {
            this.currentImageIndex = (savedIndex - 1);
        } else {
            this.currentImageIndex = null;
        }
    }
}
