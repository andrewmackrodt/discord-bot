import axios from 'axios'
import type { Message } from 'discord.js'
import { command } from '../../utils/command'
import { sendErrorReply, sendGenericErrorReply } from '../../utils/plugin'

interface TranslationResult {
    translations: {
        detected_source_language: string
        text: string
    }[]
}

enum Languages {
    German = 'de',
    English = 'en',
    Spanish = 'es',
    French = 'fr',
    Italian = 'it',
    Japanese = 'ja',
    Dutch = 'nl',
    Polish = 'pl',
    Portuguese = 'pt',
    Russian = 'ru',
    Chinese = 'zh',
}

export default class TranslatePlugin {
    @command('translate', {
        emoji: ':speech_balloon:',
        title: 'Translate',
        description: 'Translate a message.',
        lastArgIsText: true,
        args: { lang: {}, text: {} },
    })
    public async replyTranslate(message: Message<true>, lang?: Languages | string, text?: string): Promise<any> {
        let targetLang: string

        if (lang) {
            // detect the target language
            const match = Object.entries(Languages)
                .find(([name, code]) =>
                    name.localeCompare(lang, undefined, { sensitivity: 'base' }) === 0 ||
                    code.localeCompare(lang, undefined, { sensitivity: 'base' }) === 0,
                )

            if ( ! match) {
                const languages = Object.keys(Languages).map(s => s.toLowerCase()).join(', ')
                return sendErrorReply(message, 'unsupported language\n\nchoose from: ' + languages)
            }

            targetLang = match[1]
        } else {
            // default to english
            targetLang = 'en'
        }

        if ( ! this.authKey) {
            return sendErrorReply(message, 'the translate plugin is not correctly configured, please contact the server admin')
        }

        let reference: Message | undefined
        let sourceText: string

        if ( ! text) {
            if ( ! message.reference) {
                return sendErrorReply(message, 'either specify the text to translate or use .translate as a message reply')
            }
            reference = await message.fetchReference()
            // remove quoted replies from the reference message
            sourceText = reference.content
                .replace(/^:speech_balloon:.+\n+(?:(?:>|<@[0-9]+).*\n+)*/m, '').trim()
        } else {
            sourceText = text.trim()
        }

        let data: TranslationResult

        try {
            const response = await axios.post<TranslationResult>(
                'https://api-free.deepl.com/v2/translate',
                {
                    text: [
                        sourceText,
                    ],
                    target_lang: targetLang,
                },
                {
                    headers: {
                        authorization: `DeepL-Auth-Key ${this.authKey}`,
                    },
                    responseType: 'json',
                })

            data = response.data
        } catch (e) {
            console.error('translate: error', e)

            return sendGenericErrorReply(message)
        }

        const sourceLang = data.translations[0].detected_source_language
        const translated = data.translations.map(t => t.text).join('\n\n')

        let sb = `:speech_balloon:  Translation from ${sourceLang.toLowerCase()} to ${targetLang}:\n`
        if (reference) {
            sb += [`<@${reference.author.id}> wrote:`, ...sourceText.split('\n')].map(s => '> ' + s).join('\n') + '\n'
        }
        sb += '\n' + translated

        return message.reply(sb)
    }

    protected get authKey(): string | null {
        return process.env.DEEPL_AUTH_KEY?.length ? process.env.DEEPL_AUTH_KEY : null
    }
}
