import path from 'node:path'

import { subClass } from 'gm'

const gm = subClass({ imageMagick: true })
const assetsPath = path.resolve(__dirname, 'assets')
const fontsPath = path.resolve(assetsPath, 'fonts')
const defaultFont = path.resolve(fontsPath, 'Impact/impact.ttf')
const imagesPath = path.resolve(assetsPath, 'images')

export interface Image {
    name: string
    filename: string
    width: number
    height: number
    font?: string
    color: string
    stroke?: string
    texts: TextPosition[]
}

type TextPosition = { w: number; h: number } & (
    | { x: number; y: number; gravity?: string }
    | { gravity?: string }
)

interface CreateImageResult {
    data: Buffer
    contentType: string
    name: string
}

export class UnknownImageError extends Error {}

export class TextCountError extends Error {
    constructor(readonly expected: number) {
        super(`Image requires ${expected} arguments`)
    }
}

export const images: Record<string, Image> = {
    batman: {
        name: 'Batman slapping Robin',
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
        name: 'Disaster Girl',
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
        name: 'Drake Hotline Bling',
        filename: 'drake.jpg',
        width: 717,
        height: 717,
        color: '#000000',
        texts: [
            { x: 356, y: 9, w: 347, h: 340 },
            { x: 356, y: 380, w: 347, h: 340 },
        ],
    },
    morty: {
        name: 'You son of a *****',
        filename: 'morty.gif',
        width: 640,
        height: 360,
        color: '#ffffff',
        stroke: '#000000',
        texts: [
            { w: 600, h: 56, gravity: 'south' },
        ],
    },
    success: {
        name: 'Success Kid',
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
) =>
    new Promise<number>((resolve, reject) => {
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

export async function createImage(name: string, texts: string[]): Promise<CreateImageResult> {
    if (!(name in images)) {
        throw new UnknownImageError()
    }

    const image = images[name]

    if (texts.length !== image.texts.length) {
        throw new TextCountError(image.texts.length)
    }

    const pointSize = await Promise.all(
        image.texts.map((dimensions, i) =>
            getPointSize(
                dimensions,
                image.font ?? defaultFont,
                typeof image.stroke === 'string',
                texts[i],
            ),
        ),
    ).then((arr) => arr.sort((a, b) => a - b).at(0)!)

    const srcImagePath = path.resolve(imagesPath, image.filename)

    let state = gm(srcImagePath)
        .background('none')
        .coalesce()
        .fill(image.color)
        .font(image.font ?? defaultFont)
        .pointSize(pointSize)

    if (image.stroke) {
        state = state.stroke(image.stroke).strokeWidth(1)
    }

    let format: string

    if (image.filename.toLowerCase().endsWith('.gif')) {
        format = 'gif'
    } else {
        format = 'jpeg'
    }

    for (let i = 0; i < texts.length; i++) {
        const position = image.texts[i]
        const { w, h, x, y } = { ...{ x: 0, y: 0 }, ...position }
        if (format === 'gif') {
            state = state.drawText(x, y, texts[i], position.gravity)
        } else {
            state = state
                .out('-gravity', position.gravity ?? 'center')
                .out('-size', `${w}x${h}`)
                .out(`caption:${texts[i]}`)
        }
        state = state
            .out(
                ...(() => {
                    if (!('x' in position)) return []
                    const { x, y } = position
                    const xs = x >= 0 ? `+${x}` : `${x}`
                    const ys = y >= 0 ? `+${y}` : `${y}`
                    return ['-geometry', [xs, ys].join('')]
                })(),
            )
            .out('-gravity', position.gravity ?? 'northwest')
        if (format === 'gif') {
            state = state.out('-compose', 'over').out('-layers', 'composite')
        } else {
            state = state.out('-composite')
        }
    }

    if (format === 'gif') {
        state = state.out('-layers', 'optimize')
    }

    return new Promise<CreateImageResult>((resolve, reject) => {
        state.toBuffer(format, (err, buffer) => {
            if (err) {
                reject(err)
            } else {
                resolve({
                    data: buffer,
                    contentType: `image/${format}`,
                    name: `${name}.${format}`,
                })
            }
        })
    })
}
