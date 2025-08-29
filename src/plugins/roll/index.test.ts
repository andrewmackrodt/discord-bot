import type { Message } from 'discord.js'
import { It, mock, when } from 'strong-mock'

import RollPlugin from './index'

describe('replyRoll()', () => {
    async function parseRollResult(input?: string) {
        const mockMessage = mock<Message<true>>()
        const matcher = It.willCapture<string>()
        when(() => mockMessage.reply(matcher)).thenResolve(mockMessage)
        await new RollPlugin().replyRoll(mockMessage, input)
        const [total, rolls] = matcher.value!.replaceAll(/[^0-9=+]/g, '').split('=')
        return { total: parseInt(total), rolls: rolls.split('+').map((s) => parseInt(s)) }
    }

    afterEach(() => {
        jest.spyOn(Math, 'random').mockRestore()
    })

    it('defaults to 1d6 when no input', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.99999)
        const { total, rolls } = await parseRollResult()
        expect(rolls).toHaveLength(1)
        expect(total).toEqual(6)
        expect(total).toEqual(rolls.reduce((res, roll) => res + roll, 0))
    })

    it('rolls 1 when random is zero', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0)
        const { total, rolls } = await parseRollResult()
        expect(rolls).toHaveLength(1)
        expect(total).toEqual(1)
        expect(total).toEqual(rolls.reduce((res, roll) => res + roll, 0))
    })

    it('sums result of input 1d10', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.99999)
        const { total, rolls } = await parseRollResult('1d10')
        expect(rolls).toHaveLength(1)
        expect(total).toEqual(10)
        expect(total).toEqual(rolls.reduce((res, roll) => res + roll, 0))
    })

    it('sums result of input 2d20', async () => {
        const { total, rolls } = await parseRollResult('2d20')
        expect(rolls).toHaveLength(2)
        expect(total).toEqual(rolls.reduce((res, roll) => res + roll, 0))
    })
})
