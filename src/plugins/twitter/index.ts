import axios from 'axios'
import type { Message, TextChannel } from 'discord.js'
import type Discord from 'discord.js'
import type { NextFunction, Plugin } from '../../../types/plugins'
import type { Schedule } from '../../Schedule'

//region interfaces
interface ScreenNameWatcher {
    screenName: string
    lastUpdated: Date
    channelIds: string[]
}

interface Tweet {
    conversation_id_str: string
    created_at: string
    display_text_range: [number, number]
    entities: {
        hashtags: unknown[]
        media: object[]
        symbols: unknown[]
        urls: unknown[]
        user_mentions: unknown[]
    }
    extended_entities?: unknown
    favorite_count: number
    favorited: boolean
    full_text: string
    id: number
    id_str: string
    lang: string
    location: string
    permalink: string
    possibly_sensitive: boolean
    quote_count: number
    reply_count: number
    retweet_count: number
    retweeted: boolean
    text: string
    user: object
}

interface TweetTimeline {
    props: {
        pageProps: {
            timeline: {
                entries: {
                    content: { tweet: Tweet }
                    entry_id: string
                    sort_index: string
                    type: string
                }[]
            }
        }
    }
}
//endregion

enum Commands {
    ADD = 'add',
    DELETE = 'del',
    LIST = 'list',
}

export default class TwitterPlugin implements Plugin {
    private watchers: ScreenNameWatcher[] = []

    public async registerScheduler(client: Discord.Client, schedule: Schedule): Promise<void> {
        schedule.add('*/10 * * * * *', async () => {
            for (const watcher of this.watchers) {
                const elapsed = new Date().getTime() - watcher.lastUpdated.getTime()

                if (elapsed < 60000) {
                    continue
                }

                await this.sendNewTweetsToChannels(client, watcher)
            }
        })
    }

    public async onMessage(msg: Message, next: NextFunction): Promise<any> {
        const words = msg.content.split(/[ \t]+/)
        const [action, command, screenName] = words

        if (action !== '!twitter') {
            return next()
        }

        const channel = msg.channel as TextChannel
        const channelLongName = `"${channel.guild}"#${channel.name}`

        if (command === Commands.LIST) {
            if (words.length !== 2) {
                return msg.reply('usage: `!twitter [add|del username | list]`')
            }

            const screenNames = this.watchers
                .filter(w => w.channelIds.includes(channel.id))
                .map(w => w.screenName)

            console.log('twitter: %s list found %d entries', channelLongName, screenNames.length)

            if (screenNames.length === 0) {
                return msg.reply('I am not following anyone')
            } else {
                return msg.reply(`I am following: ${screenNames.join(', ')}`)
            }
        }

        if (words.length !== 3 ||
            command.match(/^(?:add|del)$/) === null ||
            screenName.length === 0
        ) {
            return msg.reply('usage: `!twitter [add|del username | list]`')
        }

        const watcherIndex = this.watchers.findIndex(w => w.screenName.toLowerCase() === screenName.toLowerCase())
        let watcher = this.watchers[watcherIndex]

        if (command === Commands.ADD) {
            if (watcher) {
                if (watcher.channelIds.includes(channel.id)) {
                    return msg.reply(`the twitter user \`${screenName}\` is already being followed`)
                }
                watcher.channelIds.push(channel.id)
            } else {
                const lastUpdated = new Date()
                lastUpdated.setMinutes(lastUpdated.getMinutes() - 5)
                watcher = { screenName, lastUpdated, channelIds: [channel.id] }

                const fetchSuccess = await this.sendNewTweetsToChannels(msg.client, watcher)

                if ( ! fetchSuccess) {
                    return msg.reply(`unknown twitter user \`${screenName}\``)
                }

                this.watchers.push(watcher)
            }

            console.log('twitter: %s started following %s', channelLongName, watcher.screenName)

            await msg.reply(`I'll post \`${screenName}\` latest tweets. Use \`!twitter del ${screenName}\` to stop.`)
        } else if (command === Commands.DELETE) {
            const index = watcher?.channelIds.indexOf(channel.id) ?? -1

            if (index === -1) {
                return msg.reply(`the twitter user \`${screenName}\` is not being followed`)
            }

            watcher.channelIds.splice(index, 1)

            console.log('twitter: %s stopped following %s', channelLongName, watcher.screenName)

            if (watcher.channelIds.length === 0) {
                this.watchers.splice(watcherIndex, 1)
            }
        } else {
            throw new Error(`Unknown command: ${command}`)
        }
    }

    protected async getTweets(screenName: string): Promise<Tweet[]> {
        const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${screenName}?showReplies=false`

        const response = await axios.get<string>(url, {
            headers: {
                accept: 'text/html',
                'accept-language': 'en-US,en;q=0.9,en-US;q=0.8',
                'cache-control': 'max-age=0',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            },
        })

        const text = /<script[^>]*>({"props".+?})<\/script>/.exec(response.data)?.[1]

        if ( ! text) {
            throw new Error('Failed to extract JSON')
        }

        const data = JSON.parse(text) as TweetTimeline

        return data.props.pageProps.timeline.entries
            .filter(e => e.type === 'tweet')
            .map(e => e.content.tweet)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    protected async sendNewTweetsToChannels(client: Discord.Client, watcher: ScreenNameWatcher): Promise<boolean> {
        console.info('twitter: fetching tweets ...', watcher.screenName)
        let fetchSuccess = false
        try {
            const tweets = await this.getTweets(watcher.screenName)
            fetchSuccess = true
            const newTweets = tweets.filter(tweet => new Date(tweet.created_at) >= watcher.lastUpdated).reverse()
            console.info('twitter: new tweets count:', newTweets.length)

            for (const tweet of newTweets) {
                for (const channelId of watcher.channelIds) {
                    try {
                        const channel = await client.channels.fetch(channelId, true) as TextChannel
                        await channel.send(`https://twitter.com/${tweet.permalink}`)
                    } catch (discordErr) {
                        console.error('twitter: error', discordErr)
                    }
                }
            }
        } catch (twitterErr) {
            console.error('twitter: error', twitterErr)
        } finally {
            watcher.lastUpdated = new Date()
        }
        return fetchSuccess
    }
}
