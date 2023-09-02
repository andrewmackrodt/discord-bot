declare module 'spotify-web-player' {
    export interface AccessTokenResponse {
        accessToken: string
        accessTokenExpirationTimestampMs: number
        isAnonymous: boolean
    }

    export type WebPlayerApiResponse<K extends string, S> = {
        data: {
            [key in K]: S
        }
        extensions: object
    }

    interface Playlist {
        __typename: 'Playlist'
        uri: string
        name: string
        description: string
        ownerV2: {
            data: {
                __typename: 'User'
                name: string
            }
        }
        images: {
            items: {
                sources: {
                    url: string
                    width: unknown
                    height: unknown
                }[]
            }[]
        }
    }

    interface ImageSource {
        url: string
        width: number
        height: number
    }

    interface Album {
        id: string
        uri: string
        name: string
        type: string
        copyright: {
            items: {
                type: string
                text: string
            }[]
        }
        date: {
            year: number
            month: number
            day: number
            precision: string
        }
        coverArt: {
            sources: ImageSource[]
        }
        tracks: {
            totalCount: number
        }
        label: string
        playability: {
            playable: boolean
            reason: string
        }
        sharingInfo: {
            shareId: string
            shareUrl: string
        }
    }

    export interface QueryArtistOverviewResponse {
        __typename: 'Artist'
        id: string
        uri: string
        saved: boolean
        sharingInfo: {
            shareUrl: string
            shareId: string
        }
        preRelease: unknown
        profile: {
            name: string
            verified: boolean
            pinnedItem: unknown
            biography: {
                type: string
                text: string
            }
            externalLinks: {
                items: unknown[]
            }
            playlistsV2: {
                totalCount: number
                items: {
                    data: Playlist
                }[]
            }
        }
        visuals: {
            gallery: {
                items: {
                    sources: ImageSource[]
                }[]
            }
            avatarImage: {
                sources: ImageSource[]
                extractedColors: {
                    colorRaw: {
                        hex: string
                    }
                }
            }
            headerImage: {
                sources: ImageSource[]
                extractedColors: {
                    colorRaw: {
                        hex: string
                    }
                }
            }
        }
        discography: {
            latest: Album
            popularReleasesAlbums: {
                totalCount: number
                items: Album[]
            }
            singles: {
                totalCount: number
                items: {
                    releases: {
                        items: Album[]
                    }
                }[]
            }
            albums: {
                totalCount: number
                items: {
                    releases: {
                        items: Album[]
                    }
                }[]
            }
            compilations: {
                totalCount: number
                items: {
                    releases: {
                        items: Album[]
                    }
                }[]
            }
            topTracks: {
                items: {
                    uid: string
                    track: {
                        id: string
                        uri: string
                        name: string
                        playcount: string
                        discNumber: number
                        duration: {
                            totalMilliseconds: number
                        }
                        playability: {
                            playable: boolean
                            reason: string
                        }
                        contentRating: {
                            label: string
                        }
                        artists: {
                            items: {
                                uri: string
                                profile: {
                                    name: string
                                }
                            }[]
                        }
                        albumOfTrack: {
                            uri: string
                            coverArt: {
                                sources: {
                                    url: string
                                }[]
                            }
                        }
                    }
                }[]
            }
        }
        stats: {
            followers: number
            monthlyListeners: number
            worldRank: number
            topCities: {
                items: {
                    numberOfListeners: number
                    city: string
                    country: string
                    region: string
                }[]
            }
        }
        relatedContent: {
            appearsOn: {
                totalCount: number
                items: {
                    releases: {
                        totalCount: number
                        items: {
                            uri: string
                            id: string
                            name: string
                            type: string
                            artists: {
                                items: {
                                    uri: string
                                    profile: {
                                        name: string
                                    }
                                }[]
                            }
                            coverArt: {
                                sources: ImageSource[]
                            }
                            date: {
                                year: number
                            }
                            sharingInfo: {
                                shareId: string
                                shareUrl: string
                            }
                        }[]
                    }
                }[]
            }
            featuringV2: {
                totalCount: number
                items: {
                    data: Playlist
                }[]
            }
            discoveredOnV2: {
                totalCount: number
                items: {
                    data: Playlist
                }[]
            }
            relatedArtists: {
                totalCount: number
                items: {
                    id: string
                    uri: string
                    profile: {
                        name: string
                    }
                    visuals: {
                        avatarImage: {
                            sources: ImageSource[]
                        }
                    }
                }[]
            }
        }
        goods: {
            events: {
                userLocation: {
                    name: string
                }
                concerts: {
                    totalCount: number
                    items: unknown[]
                    pagingInfo: {
                        limit: number
                    }
                }
            }
            merch: {
                items: {
                    image: {
                        sources: {
                            url: string
                        }[]
                    }
                    name: string
                    description: string
                    price: string
                    uri: string
                    url: string
                }[]
            }
        }
    }

    export interface GetAlbumResponse {
        __typename: 'Album'
        uri: string
        name: string
        artists: {
            totalCount: number
            items: {
                id: string
                uri: string
                profile: {
                    name: string
                }
                visuals: {
                    avatarImage: {
                        sources: ImageSource[]
                    }
                }
                sharingInfo: {
                    shareUrl: string
                }
            }[]
        }
        coverArt: {
            extractedColors: {
                colorRaw: {
                    hex: string
                }
                colorLight: {
                    hex: string
                }
                colorDark: {
                    hex: string
                }
            }
            sources: ImageSource[]
        }
        discs: {
            totalCount: number
            items: {
                number: number
                tracks: {
                    totalCount: number
                }
            }[]
        }
        releases: {
            totalCount: number
            items: unknown[]
        }
        type: string
        date: {
            isoString: string
            precision: string
        }
        playability: {
            playable: boolean
            reason: string
        }
        label: string
        copyright: {
            totalCount: number
            items: {
                type: string
                text: string
            }[]
        }
        courtesyLine: string
        saved: boolean
        sharingInfo: {
            shareUrl: string
            shareId: string
        }
        tracks: {
            totalCount: number
            items: {
                uid: string
                track: {
                    saved: boolean
                    uri: string
                    name: string
                    playcount: string
                    discNumber: number
                    trackNumber: number
                    contentRating: {
                        label: string
                    }
                    relinkingInformation: unknown
                    duration: {
                        totalMilliseconds: number
                    }
                    playability: {
                        playable: boolean
                    }
                    artists: {
                        items: {
                            uri: string
                            profile: {
                                name: string
                            }
                        }[]
                    }
                }
            }[]
        }
        moreAlbumsByArtist: {
            items: {
                discography: {
                    popularReleasesAlbums: {
                        items: {
                            id: string
                            uri: string
                            name: string
                            date: {
                                year: number
                            }
                            coverArt: {
                                sources: ImageSource[]
                            }
                            playability: {
                                playable: boolean
                                reason: string
                            }
                            sharingInfo: {
                                shareId: string
                                shareUrl: string
                            }
                            type: string
                        }[]
                    }
                }
            }[]
        }
    }
}
