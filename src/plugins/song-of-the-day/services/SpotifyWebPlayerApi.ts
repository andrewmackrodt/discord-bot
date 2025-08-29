import axios from 'axios'
import type {
    AccessTokenResponse,
    GetAlbumResponse,
    QueryArtistOverviewResponse,
    WebPlayerApiResponse,
} from 'spotify-web-player'

import { component } from '../../../utils/di'

enum SpotifyQueryHashes {
    QUERY_ARTIST_OVERVIEW = '35648a112beb1794e39ab931365f6ae4a8d45e65396d641eeda94e4003d41497',
    GET_ALBUM = '46ae954ef2d2fe7732b4b2b4022157b2e18b7ea84f70591ceb164e4de1b5d5d3',
}

const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'

@component()
export class SpotifyWebPlayerApi {
    protected accessTokenResponse?: AccessTokenResponse

    async getArtist(artistId: string): Promise<QueryArtistOverviewResponse> {
        const accessToken = await this.getAccessToken()

        const { data: res } = await axios.get<
            WebPlayerApiResponse<'artistUnion', QueryArtistOverviewResponse>
        >('https://api-partner.spotify.com/pathfinder/v1/query', {
            params: {
                operationName: 'queryArtistOverview',
                variables: JSON.stringify({
                    uri: `spotify:artist:${artistId}`,
                    locale: '',
                    includePrerelease: true,
                }),
                extensions: `{"persistedQuery":{"version":1,"sha256Hash":"${SpotifyQueryHashes.QUERY_ARTIST_OVERVIEW}"}}`,
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': userAgent,
            },
        })

        const artist = res.data.artistUnion

        if (!artist) {
            throw new Error(`Spotify lookup failed for artist ${artistId}`)
        }

        return artist
    }

    async getAlbum(albumId: string): Promise<GetAlbumResponse> {
        const accessToken = await this.getAccessToken()

        const { data: res } = await axios.get<WebPlayerApiResponse<'albumUnion', GetAlbumResponse>>(
            'https://api-partner.spotify.com/pathfinder/v1/query',
            {
                params: {
                    operationName: 'getAlbum',
                    variables: JSON.stringify({
                        uri: `spotify:album:${albumId}`,
                        locale: '',
                        offset: 0,
                        limit: 50,
                    }),
                    extensions: `{"persistedQuery":{"version":1,"sha256Hash":"${SpotifyQueryHashes.GET_ALBUM}"}}`,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'User-Agent': userAgent,
                },
            },
        )

        const album = res.data.albumUnion

        if (!album) {
            throw new Error(`Spotify lookup failed for album ${albumId}`)
        }

        return album
    }

    protected async getAccessToken(): Promise<string> {
        if (this.accessTokenResponse) {
            const expiresIn =
                this.accessTokenResponse.accessTokenExpirationTimestampMs - new Date().getTime()

            if (expiresIn >= 30) {
                return this.accessTokenResponse.accessToken
            }
        }

        this.accessTokenResponse = await axios
            .get<AccessTokenResponse>('https://open.spotify.com/get_access_token', {
                params: {
                    reason: 'transport',
                    productType: 'web_player',
                },
                headers: {
                    'User-Agent': userAgent,
                },
            })
            .then((response) => response.data)

        const expiresIn =
            this.accessTokenResponse.accessTokenExpirationTimestampMs - new Date().getTime()

        console.log(`Spotify Web Player API access token expires in: ${expiresIn} ms`)

        return this.accessTokenResponse!.accessToken
    }
}
