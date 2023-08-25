import 'reflect-metadata'
import { setDefaults, UnexpectedProperty } from 'strong-mock'

setDefaults({
    unexpectedProperty: UnexpectedProperty.THROW,
})
