export function random<T>(array: T[]): T {
    const offset = Math.round(Math.random() * (array.length - 1))

    return array[offset]
}
