import {Message} from 'discord.js'
import {Plugin} from './typings/plugins'
import * as Discord from 'discord.js'
import * as dotenv from 'dotenv'

dotenv.config()

const client = new Discord.Client()
const token: string = process.env.DISCORD_TOKEN!

const plugins: Plugin[] = [
    require('./src/plugins/fortune').default,
    require('./src/plugins/scooter').default,
    require('./src/plugins/xkcd').default,
]

;(async () => {
    client.on('error', error => {
        console.error(error)
    })

    client.login(token)

    client.on('ready', () => {
        console.info(`Logged in as ${client.user!.tag}!`)
    })

    client.on('message', async (message: Message) => {
        if ( ! message.guild) {
            return
        }

        const stack = plugins.slice()

        const dispatch = (plugin: Plugin): Promise<any> => {
            return plugin(message, async (err?: string | Error): Promise<any> => {
                if ( ! err) {
                    const sibling = stack.shift()
                    if (sibling) {
                        return dispatch(sibling)
                    }
                } else {
                    console.error(err)
                }
            })
        }

        return dispatch(stack.shift()!)
    })
}).call(this)
