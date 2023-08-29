import axios from 'axios'
import { Message } from 'discord.js'
import { command } from '../../utils/command'
import { sendErrorToChannel, sendGenericErrorToChannel } from '../../utils/plugin'

type Collection<T> = {
    results?: T[]
    generationtime_ms: number
}

interface Geocode {
    id: number
    name: string
    latitude: number
    longitude: number
    elevation: number
    country_code: string
    country_id: number
    country: string
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


export default class WeatherPlugin {
    @command('weather', {
        emoji: ':white_sun_cloud:',
        title: 'Weather',
        description: 'Fetch the current temperate.',
        separator: null,
        args: {
            city: { required: true },
        },
    })
    public async replyWeather(message: Message, city: string): Promise<any> {
        try {
            const geocode = await this.searchGeocode(city)
            if ( ! geocode) {
                return sendErrorToChannel(message, 'unknown city')
            }
            const { current_weather } = await this.getForecast(geocode.latitude, geocode.longitude)
            const { temperature } = current_weather
            return message.reply(`The current temperature in ${geocode.name} (${geocode.country_code}) is ${temperature} C`)
        } catch (e) {
            return sendGenericErrorToChannel(message)
        }
    }

    protected async searchGeocode(city: string): Promise<Geocode | null> {
        const { data } = await axios.get<Collection<Geocode>>(
            'https://geocoding-api.open-meteo.com/v1/search', {
                params: {
                    name: city,
                    count: 1,
                    language: 'en',
                    format: 'json',
                },
            })

        if ( ! data.results || data.results.length === 0) {
            return null
        }

        return data.results[0]
    }

    protected async getForecast(latitude: number, longitude: number): Promise<Forecast> {
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
