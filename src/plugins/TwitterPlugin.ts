import { NextFunction, Plugin } from '../../types/plugins'
import { TwitterClient } from 'twitter-api-client'
import Discord, { Message, TextChannel } from 'discord.js'
import { Schedule } from '../Schedule'
import UsersLookup from 'twitter-api-client/dist/interfaces/types/UsersLookupTypes'

interface ScreenNameWatcher {
    profile: UsersLookup
    channelIds: string[]
    lastUpdated: Date
}

enum Commands {
    ADD = 'add',
    DELETE = 'del',
    LIST = 'list',
}

export default class TwitterPlugin implements Plugin {
    private watchers: ScreenNameWatcher[] = []
    private _isSupported?: boolean
    private _twitter?: TwitterClient

    protected get isSupported(): boolean {
        if (typeof this._isSupported === 'undefined') {
            this._isSupported = Boolean(process.env.TWITTER_API_KEY &&
                process.env.TWITTER_API_SECRET &&
                process.env.TWITTER_ACCESS_TOKEN &&
                process.env.TWITTER_ACCESS_TOKEN_SECRET)
        }

        return this._isSupported
    }

    protected get twitter(): TwitterClient {
        if ( ! this._twitter) {
            this._twitter = new TwitterClient({
                apiKey: process.env.TWITTER_API_KEY!,
                apiSecret: process.env.TWITTER_API_SECRET!,
                accessToken: process.env.TWITTER_ACCESS_TOKEN!,
                accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
            })
        }

        return this._twitter
    }

    public async registerScheduler(client: Discord.Client, schedule: Schedule): Promise<void> {
        if ( ! this.isSupported) {
            return
        }

        schedule.add('*/10 * * * * *', async () => {
            for (const watcher of this.watchers) {
                const elapsed = new Date().getTime() - watcher.lastUpdated.getTime()

                if (elapsed < 60000) {
                    continue
                }

                try {
                    console.info('twitter: fetching tweets ...', watcher.profile.screen_name)

                    const tweets = await this.twitter.tweets.statusesUserTimeline({ user_id: watcher.profile.id_str })
                    const newTweets = tweets.filter(tweet => new Date(tweet.created_at) >= watcher.lastUpdated).reverse()

                    console.info('twitter: new tweets count:', newTweets.length)

                    for (const tweet of newTweets) {
                        for (const channelId of watcher.channelIds) {
                            try {
                                const channel = await client.channels.fetch(channelId, true) as TextChannel
                                await channel.send(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
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
            }
        })
    }

    public async onMessage(msg: Message, next: NextFunction): Promise<any> {
        const words = msg.content.split(/[ \t]+/)
        const [action, command, screenName] = words

        if (action !== '!twitter') {
            return next()
        }

        if ( ! this.isSupported) {
            return msg.reply('the twitter plugin is not correctly configured, please contact the server admin')
        }

        const channel = msg.channel as TextChannel
        const channelLongName = `"${channel.guild}"#${channel.name}`

        if (command === Commands.LIST) {
            if (words.length !== 2) {
                return msg.reply('usage: `!twitter [add|del username | list]`')
            }

            const screenNames = this.watchers
                .filter(w => w.channelIds.includes(channel.id))
                .map(w => w.profile.screen_name)

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

        const watcherIndex = this.watchers.findIndex(w => w.profile.screen_name.toLowerCase() === screenName.toLowerCase())
        let watcher = this.watchers[watcherIndex]

        if (command === Commands.ADD) {
            if ( ! watcher) {
                let usersLookups: UsersLookup[] = []

                try {
                    usersLookups = await this.twitter.accountsAndUsers.usersLookup({ screen_name: screenName })
                } catch (e) {
                    console.error('twitter: error', e)
                }

                if (usersLookups.length === 0) {
                    return msg.reply(`unknown twitter user \`${screenName}\``)
                }

                const lastUpdated = new Date()
                lastUpdated.setMinutes(lastUpdated.getMinutes() - 5)

                watcher = {
                    profile: usersLookups[0],
                    channelIds: [],
                    lastUpdated,
                }

                this.watchers.push(watcher)
            }

            if ( ! watcher.channelIds.includes(channel.id)) {
                console.log('twitter: %s started following %s', channelLongName, watcher.profile.screen_name)
                watcher.channelIds.push(channel.id)
                await msg.reply(`I'll post \`${screenName}\` latest tweets. Use \`!twitter del ${screenName}\` to stop.`)
            } else {
                return msg.reply(`the twitter user \`${screenName}\` is already being followed`)
            }
        } else if (command === Commands.DELETE) {
            const index = watcher?.channelIds.indexOf(channel.id) ?? -1

            if (index === -1) {
                return msg.reply(`the twitter user \`${screenName}\` is not being followed`)
            }

            watcher.channelIds.splice(index, 1)

            console.log('twitter: %s stopped following %s', channelLongName, watcher.profile.screen_name)

            if (watcher.channelIds.length === 0) {
                this.watchers.splice(watcherIndex, 1)
            }
        } else {
            throw new Error(`Unknown command: ${command}`)
        }
    }
}
