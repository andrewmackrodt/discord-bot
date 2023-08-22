import path from 'node:path'
import { subClass } from 'gm'

const gm = subClass({ imageMagick: true })
const assetsPath = path.resolve(__dirname, 'assets')
const fontsPath = path.resolve(assetsPath, 'fonts')
const defaultFont = path.resolve(fontsPath, 'Impact/impact.ttf')
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

type TextPosition = { w: number; h: number } & (
    { x: number; y: number } |
    { gravity: string } )

interface Image {
    filename: string
    width: number
    height: number
    font?: string
    color: string
    stroke?: string
    texts: TextPosition[]
}

export const images: Record<string, Image> = {
    batman: {
        filename: 'batman.png',
        font: path.resolve(fontsPath, 'NotoSans/NotoSans-Regular.ttf'),
        width: 580,
        height: 564,
        color: '#000000',
        texts: [
            { x: 28, y: 9, w: 242, h: 94 },
            { x: 330, y: 10, w: 234, h: 98 },
        ],
    },
    dg: {
        filename: 'disaster-girl.png',
        width: 577,
        height: 433,
        color: '#ffffff',
        stroke: '#000000',
        texts: [
            { w: 548, h: 160, gravity: 'north' },
            { w: 548, h: 160, gravity: 'south' },
        ],
    },
    drake: {
        filename: 'drake.jpg',
        width: 717,
        height: 717,
        color: '#000000',
        texts: [
            { x: 356, y: 9, w: 347, h: 340 },
            { x: 356, y: 380, w: 347, h: 340 },
        ],
    },
    success: {
        filename: 'success-kid.jpg',
        width: 500,
        height: 500,
        color: '#ffffff',
        stroke: '#000000',
        texts: [
            { w: 480, h: 136, gravity: 'north' },
            { w: 480, h: 136, gravity: 'south' },
        ],
    },
}

const getPointSize = (
    dimensions: { w: number; h: number },
    font: string,
    stroke: boolean,
    text: string,
) => new Promise<number>((resolve, reject) => {
    let state = gm(dimensions.w, dimensions.h)
        .font(font)
        .out(`caption:${text}`)
        .out('-format', '%[caption:pointsize]')
    if (stroke) {
        state = state.strokeWidth(1)
    }
    state.write('info:', (err, stdout) => {
        if (err) {
            return reject(err)
        } else {
            resolve(Number(stdout))
        }
    })
})

export async function createImage(name: string, texts: string[]): Promise<Buffer> {
    if ( ! (name in images)) {
        throw new UnknownImageError()
    }

    const image = images[name]

    if (texts.length !== image.texts.length) {
        throw new TextCountError(image.texts.length)
    }

    const pointSize = await Promise.all(
        image.texts.map((dimensions, i) => getPointSize(
            dimensions,
            image.font ?? defaultFont,
            typeof image.stroke === 'string',
            texts[i],
        )))
        .then(arr => arr.sort((a, b) => a - b).at(0)!)

    const srcImagePath = path.resolve(imagesPath, image.filename)

    let state = gm(srcImagePath)
        .background('none')
        .fill(image.color)
        .font(image.font ?? defaultFont)
        .pointSize(pointSize)
        .gravity('Center')

    if (image.stroke) {
        state = state.stroke(image.stroke).strokeWidth(1)
    }

    for (const i in texts) {
        const position = image.texts[i]
        const text = texts[i]
        const { w, h } = position
        state = state.out('-size', `${w}x${h}`)
        if ('gravity' in position) {
            state = state.out('-gravity', position.gravity).out(`caption:${text}`)
        } else {
            let { x, y } = position
            x = Math.floor((image.width - w) / 2) - x
            y = Math.floor((image.height - h) / 2) - y
            state = state.out(`caption:${text}`).out('-geometry', `-${x}-${y}`)
        }
        state = state.out('-composite')
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
