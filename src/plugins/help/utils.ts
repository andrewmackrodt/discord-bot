import type { Command } from '../../registries/Command'

export function getFieldName(c: Command): string {
    let name = `.${c.command}`
    const args: string[] = []
    for (const [arg, options] of Object.entries(c.args)) {
        let str: string = options.example ?? arg
        if ( ! options.required) str += '?'
        args.push(`<${str}>`)
    }
    if (args.length > 0) {
        const separator = typeof c.separator === 'string'
            ? c.separator  + ' '
            : ' '
        name = name + ' ' + args.join(separator)
    }
    return name
}
