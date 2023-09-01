type ExtractRequired<T> = Exclude<T, undefined>

type IsContainsAllRequired<T, K extends keyof T> = Pick<ExtractRequired<T>, K> extends ExtractRequired<T> ? true : false

type BuilderSetter<K> = K extends `${infer Head}${infer Tail}` ? `set${Capitalize<Head>}${Tail}` : K

export type BuilderWithArgs<T, U extends new (params: T) => InstanceType<U>, V extends keyof T> = {
    build: IsContainsAllRequired<T, V> extends true
        ? () => InstanceType<U> & Required<Pick<T, V>>
        : never
    toObject: () => Partial<T> & Required<Pick<T, V>>
} & {
    [K in keyof T as BuilderSetter<K>]-?: (value: T[K]) => BuilderWithArgs<T, U, V | K>
}

export type Builder<T, U extends new (params: T) => InstanceType<U>> = {
    build: Record<string, never> extends ExtractRequired<T>
        ? () => InstanceType<U>
        : never
    toObject: () => Partial<T>
} & {
    [K in keyof T as BuilderSetter<K>]-?: (value: T[K]) => BuilderWithArgs<T, U, K>
}

export function builder<T, U extends new (params: T) => InstanceType<U>>(ctor: U): Builder<T, U> {
    const params: Record<string, unknown> = {}

    return new Proxy({}, {
        get(target, property: string, receiver) {
            switch (property) {
                case 'build':
                    return (): InstanceType<U> => {
                        return new ctor(params as T)
                    }
                case 'toObject':
                    return (): T => {
                        return params as T
                    }
                default:
                    const key = property[3].toLowerCase() + property.slice(4)
                    return (value: unknown) => {
                        params[key] = value

                        return receiver
                    }
            }
        },
    }) as Builder<T, U>
}
