import path from 'node:path'
import { subClass } from 'gm'

const gm = subClass({ imageMagick: true })
const assetsPath = path.resolve(__dirname, 'assets')
const fontsPath = path.resolve(assetsPath, 'fonts')
const fontPath = path.resolve(fontsPath, 'NotoSans/NotoSans-Regular.ttf')
const imagesPath = path.resolve(assetsPath, 'images')

export class UnknownImageError extends Error {
}

export class TextCountError extends Error {
    public constructor(
        public readonly expected: number,
    ) {
        super(`Image requires ${expected} arguments`)
    }
}

interface Text {
    x: number
    y: number
    w: number
    h: number
}

interface Image {
    filename: string
    width: number
    height: number
    fill: string
    texts: Text[]
}

export const images: Record<string, Image> = {
    batman: {
        filename: 'batman.png',
        width: 580,
        height: 564,
        fill: '#000000',
        texts: [
            { x: 28, y: 9, w: 242, h: 94 },
            { x: 330, y: 10, w: 234, h: 98 },
        ],
    },
    dg: {
        filename: 'disaster-girl.png',
        width: 577,
        height: 433,
        fill: '#ffffff',
        texts: [
            { x: 16, y: 0, w: 548, h: 160 },
            { x: 16, y: 276, w: 548, h: 160 },
        ],
    },
    drake: {
        filename: 'drake.jpg',
        width: 717,
        height: 717,
        fill: '#000000',
        texts: [
            { x: 356, y: 9, w: 347, h: 340 },
            { x: 356, y: 380, w: 347, h: 340 },
        ],
    },
    success: {
        filename: 'success-kid.jpg',
        width: 500,
        height: 500,
        fill: '#ffffff',
        texts: [
            { x: 6, y: -4, w: 480, h: 136 },
            { x: 6, y: 360, w: 480, h: 136 },
        ],
    },
}

export async function createImage(name: string, texts: string[]): Promise<Buffer> {
    if ( ! (name in images)) {
        throw new UnknownImageError()
    }

    const image = images[name]

    if (texts.length !== image.texts.length) {
        throw new TextCountError(image.texts.length)
    }

    const srcImagePath = path.resolve(imagesPath, image.filename)

    let state = gm(srcImagePath)
        .font(fontPath)
        .background('none')
        .fill(image.fill)
        .gravity('Center')

    for (let i = 0; i < texts.length; i++) {
        let { x, y, w, h } = image.texts[i]
        x = Math.floor((image.width - w) / 2) - x
        y = Math.floor((image.height - h) / 2) - y
        const text = texts[i]
        state = state
            .out('-size', `${w}x${h}`, `caption:${text}`)
            .out('-geometry', `-${x}-${y}`)
            .out('-composite')
    }

    return new Promise<Buffer>((resolve, reject) => {
        state.toBuffer('jpeg', (err, buffer) => {
            if (err) {
                reject(err)
            } else {
                resolve(buffer)
            }
        })
    })
}
