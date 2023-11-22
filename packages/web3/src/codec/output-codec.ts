/*
Copyright 2018 - 2022 The Alephium Authors
This file is part of the alephium project.

The library is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with the library. If not, see <http://www.gnu.org/licenses/>.
*/
import { Parser } from 'binary-parser'
import { DecodedArray } from './array-codec'
import { DecodedCompactInt, compactUnsignedIntCodec } from './compact-int-codec'
import { P2C } from './lockup-script-codec'
import { Codec } from './codec'
import { AssetOutput, assetOutputCodec, tokensCodec } from './asset-output-codec'
import { ContractOutput, contractOutputCodec } from './contract-output-codec'

export interface Either<L, R> {
  either: number
  value: L | R
}

export interface Output {
  value: Either<AssetOutput, ContractOutput>
}

export class OutputCodec implements Codec<Output> {
  parser = Parser.start()
    .uint8('either')
    .choice('value', {
      tag: 'either',
      choices: {
        0: assetOutputCodec.parser,
        1: contractOutputCodec.parser
      }
    })

  encode(input: Output): Buffer {
    const result = [input.value.either]
    if (input.value.either === 0) {
      result.push(...assetOutputCodec.encode(input.value.value as AssetOutput))
    } else if (input.value.either === 1) {
      result.push(...contractOutputCodec.encode(input.value.value as ContractOutput))
    }
    return Buffer.from(result)
  }

  decode(input: Buffer): Output {
    return this.parser.parse(input)
  }
}

export const outputCodec = new OutputCodec()
