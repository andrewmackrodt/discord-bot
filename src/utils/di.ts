import { injectable, singleton } from 'tsyringe'
import type constructor from 'tsyringe/dist/typings/types/constructor'

export function component(): <T>(target: constructor<T>) => void {
    return (target) => {
        injectable()(target)
        singleton()(target)
    }
}
