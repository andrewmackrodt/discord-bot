import type { Command } from '../../registries/Command'

export function getFieldName(command: Command): string {
    let name = `.${command.fullCommand}`
    const args: string[] = []
    for (const [arg, options] of Object.entries(command.args)) {
        let str: string = arg
        if ( ! options.required) str += '?'
        args.push(`<${str}>`)
    }
    if (args.length > 0) {
        const separator = typeof command.separator === 'string'
            ? command.separator  + ' '
            : ' '
        name = name + ' ' + args.join(separator)
    }
    return name
}
