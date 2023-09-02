import axios from 'axios'
import { Message } from 'discord.js'
import { command } from '../../utils/command'
import { sendErrorToChannel, sendGenericErrorToChannel } from '../../utils/plugin'

//region interfaces
interface Geocode {
    place_id: number
    licence: string
    osm_type: string
    osm_id: number
    lat: string
    lon: string
    category: string
    type: string
    place_rank: number
    importance: number
    addresstype: string
    name: string
    display_name: string
    boundingbox: [string, string, string, string]
}

interface CurrentWeather {
    temperature: number
    windspeed: number
    winddirection: number
    weathercode: number
    is_day: number
    time: string
}

interface Forecast {
    latitude: number
    longitude: number
    generationtime_ms: number
    utc_offset_seconds: number
    timezone: string
    timezone_abbreviation: string
    elevation: number
    current_weather: CurrentWeather
}
//endregion

export default class WeatherPlugin {
    @command('weather', {
        emoji: ':white_sun_cloud:',
        title: 'Weather',
        description: 'Fetch the current temperate.',
        separator: null,
        args: {
            location: { required: true },
        },
    })
    public async replyWeather(message: Message, location: string): Promise<any> {
        try {
            const geocode = await this.searchGeocode(location)
            if ( ! geocode) {
                return sendErrorToChannel(message, 'unknown city')
            }
            const { current_weather } = await this.getForecast(geocode.lat, geocode.lon)
            const { temperature } = current_weather
            const country = geocode.display_name.split(', ').pop()
            return message.reply(`The current temperature in ${geocode.name} (${country}) is ${temperature} C`)
        } catch (e) {
            return sendGenericErrorToChannel(message)
        }
    }

    protected async searchGeocode(location: string): Promise<Geocode | null> {
        const { data } = await axios.get<Geocode[]>(
            'https://nominatim.openstreetmap.org/search.php', {
                params: {
                    q: location,
                    format: 'jsonv2',
                },
            })

        if (data.length === 0) {
            return null
        }

        return data[0]
    }

    protected async getForecast(latitude: string, longitude: string): Promise<Forecast> {
        const { data } = await axios.get<Forecast>(
            'https://api.open-meteo.com/v1/forecast', {
                params: {
                    latitude,
                    longitude,
                    current_weather: true,
                    format: 'json',
                },
            })

        return data
    }
}
