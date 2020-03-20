import {Message} from 'discord.js'
import {Plugin, NextFunction} from '../../typings/plugins'

const lyrics = [
    'When I was young It seemed that life was so wonderful A miracle, oh, it was beautiful, magical And all the birds in the trees Well, they\'d be singing so happily So joyfully, oh, playfully, watching me',
    'Good morning! Yeaaaaaah! One, two... one, two, three, four! Pump it up!',
    'Aaaah! I ramp, me no ramp Me no skin Me no play, yeah When me chant \'pon the microphone And me say with the DJ Junglists in the place Junglists on the case Scooter, are you readyyy?',
    'Love, peace and unity Siberia, the place to be The K, the L, the F and the -ology Hallelujah!',
    'One, two... one, two, three, yeah! Rough! Aah! Here we go!',
    'Stand up! Once again! We\'re gettin\' jiggy! Siberiaaaaaaaaaaaaaa! Yay! Goodbye!',
]

const plugin: Plugin = async (msg: Message, next: NextFunction): Promise<any> => {
    if (msg.content.match(/!scooter/i) === null) {
        return next()
    }

    const index = Math.round(Math.random() * (lyrics.length - 1))
    const lyric = lyrics[index]

    return msg.channel.send(lyric)
}

export default plugin
