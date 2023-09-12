import { Message } from 'discord.js'
import { command } from '../../utils/command'

const answers = [
    // affirmative
    'It is certain',
    'It is decidedly so',
    'Without a doubt',
    'Yes - definitely',
    'You may rely on it',
    'As I see it, yes',
    'Most likely',
    'Outlook good',
    'Yes',
    'Signs point to yes',
    // non-committal
    'Reply hazy, try again',
    'Ask again later',
    'Better not tell you now',
    'Cannot predict now',
    'Concentrate and ask again',
    // negative
    'Don\'t count on it',
    'My reply is no',
    'My sources say no',
    'Outlook not so good',
    'Very doubtful',
]

export default class MagicEightBallPlugin {
    @command('8ball', {
        emoji: ':8ball:',
        title: 'Magic 8 Ball',
        description: 'Ask the Magic 8 Ball a question.',
        separator: null,
        args: {
            question: { required: true },
        },
    })
    public async replyFortune(message: Message<true>, question: string): Promise<any> {
        const index = Math.floor(Math.random() * answers.length)
        const answer = answers[index]
        return message.reply(`:8ball: ${answer}`)
    }
}
