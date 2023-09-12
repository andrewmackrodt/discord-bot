import { Message } from 'discord.js'
import { command, CommandUsageError } from '../../utils/command'

export default class RollPlugin {
    @command('roll', {
        emoji: '🎲',
        title: 'Roll Dice',
        description: 'Roll some dice.',
        args: {
            input: { example: '2d10' },
        },
    })
    public async replyRoll(message: Message<true>, input?: string): Promise<any> {
        let count: number, sides: number
        if (input) {
            const args = input.split('d').map(s => parseInt(s))
            if (args.length !== 2 || args.find(n => isNaN(n))) {
                throw new CommandUsageError('roll', 'use format "2d10" for 2 dice with 10 sides')
            }
            [count, sides] = args
            if (10 < count || count < 1) {
                throw new CommandUsageError('roll', 'count must be between 1 and 10')
            }
            if (20 < sides || sides < 4) {
                throw new CommandUsageError('roll', 'sides must be between 4 and 20')
            }
        } else {
            count = 1
            sides = 6
        }
        const rolls: number[] = []
        let total = 0
        for (let i = 0; i < count; i++) {
            const roll = 1 + Math.floor(Math.random() * sides)
            total += roll
            rolls.push(roll)
        }
        const text = `**${total}** = (` + rolls.join(' + ') + ')'
        return message.reply(`🎲 ${text}`)
    }
}
