import { createImage, TextCountError, UnknownImageError } from './functions'

describe('createImage', () => {
    it('throws UnknownImageError when receiving unknown input name', async () => {
        await expect(() => createImage('doesNotExist', [])).rejects.toThrow(UnknownImageError)
    })

    it('throws TextCountError when receiving too few text items', async () => {
        await expect(() => createImage('batman', ['a'])).rejects.toThrow(TextCountError)
    })

    it('throws TextCountError when receiving too many text items', async () => {
        await expect(() =>
            createImage('batman', [
                'a',
                'b',
                'c',
            ]),
        ).rejects.toThrow(TextCountError)
    })

    const imageTests: [string, string[]][] = [
        [
            'batman',
            [
                'There are too many Batman comics.',
                "There's no such thing as too many Batman comics!",
            ],
        ],
        ['dg', ['JUST SAW A GIANT SPIDER', "I'M OK NOW"]],
        ['drake', ['LETTUCE & TOMATO SANDWICH', 'BACON, LETTUCE & TOMATO SANDWICH']],
        ['morty', ["You son of a *****... I'm in"]],
        ['success', ['NOT STARTED ASSIGNMENT DUE TODAY', "TEACHER'S STRIKE"]],
    ]

    imageTests.forEach(([name, texts], i) => {
        it(`creates image [${i}]: ${name}`, async () => {
            expect.assertions(1)
            const { data } = await createImage(name, texts)
            expect(data.length).toBeGreaterThan(1000)
        })
    })
})
