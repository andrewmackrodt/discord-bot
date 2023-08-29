import axios from 'axios'
import { Message } from 'discord.js'
import { command } from '../../utils/command'
import { sendGenericErrorToChannel } from '../../utils/plugin'

const url = 'https://dog.ceo/api/breeds/image/random'

interface DogResponse {
    status: string
    message: string
}

export default class DogPlugin {
    @command('dog', {
        emoji: ':dog:',
        title: 'Dog',
        description: 'Fetch a random dog image.',
    })
    public async replyDog(message: Message): Promise<any> {
        let data: DogResponse
        try {
            const response = await axios.get<DogResponse>(url)
            data = response.data
            if (data.status !== 'success') {
                console.error('error: dog', data)
                return sendGenericErrorToChannel(message)
            }
        } catch (e) {
            console.error('error: dog', e)
            return sendGenericErrorToChannel(message)
        }
        return message.channel.send(data.message)
    }
}
