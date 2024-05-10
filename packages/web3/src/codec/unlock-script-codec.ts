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
import { Buffer } from 'buffer/'
import { Parser } from 'binary-parser'
import { ArrayCodec, DecodedArray } from './array-codec'
import { compactUnsignedIntCodec, compactSignedIntCodec, DecodedCompactInt } from './compact-int-codec'
import { Codec } from './codec'
import { Script, scriptCodec } from './script-codec'
import { ByteString, byteStringCodec } from './bytestring-codec'
import { LockupScript, lockupScriptCodec } from './lockup-script-codec'

export interface P2PKH {
  publicKey: Buffer
}

class P2PKHCodec implements Codec<P2PKH> {
  parser = Parser.start().buffer('publicKey', { length: 33 })

  encode(input: P2PKH): Buffer {
    return input.publicKey
  }

  decode(input: Buffer): P2PKH {
    return this.parser.parse(input)
  }
}
const p2pkhCodec = new P2PKHCodec()

export interface P2MPKH {
  publicKeys: DecodedArray<{
    publicKey: P2PKH
    index: DecodedCompactInt
  }>
}

class P2MPKHCodec implements Codec<P2MPKH> {
  parser = Parser.start().nest('publicKeys', {
    type: ArrayCodec.arrayParser(
      Parser.start()
        .nest('publicKey', { type: p2pkhCodec.parser })
        .nest('index', { type: compactUnsignedIntCodec.parser })
    )
  })

  encode(input: P2MPKH): Buffer {
    return Buffer.concat([
      Buffer.from(compactUnsignedIntCodec.encode(input.publicKeys.length)),
      ...input.publicKeys.value.map((v) => {
        return Buffer.concat([v.publicKey.publicKey, Buffer.from(compactUnsignedIntCodec.encode(v.index))])
      })
    ])
  }

  decode(input: Buffer): any {
    return this.parser.parse(input)
  }
}
const p2mpkhCodec = new P2MPKHCodec()

export interface Val {
  type: number
  val: number | DecodedCompactInt | ByteString | LockupScript
}
class ValCodec implements Codec<Val> {
  parser = Parser.start()
    .int8('type')
    .choice('val', {
      tag: 'type',
      choices: {
        0x00: new Parser().uint8('value'), // Boolean
        0x01: compactSignedIntCodec.parser, // I256
        0x02: compactUnsignedIntCodec.parser, // U256
        0x03: byteStringCodec.parser, // ByteVec
        0x04: lockupScriptCodec.parser // Address
      }
    })

  encode(input: Val): Buffer {
    const valType = input.type

    if (valType === 0x00) {
      // Boolean
      return Buffer.from([valType, input.val as number])
    } else if (valType === 0x01) {
      // I256
      return Buffer.from([valType, ...compactUnsignedIntCodec.encode(input.val as DecodedCompactInt)])
    } else if (valType === 0x02) {
      // U256
      return Buffer.from([valType, ...compactUnsignedIntCodec.encode(input.val as DecodedCompactInt)])
    } else if (valType === 0x03) {
      // ByteVec
      return Buffer.from([valType, ...byteStringCodec.encode(input.val as ByteString)])
    } else if (valType === 0x04) {
      // Address
      return Buffer.from([valType, ...lockupScriptCodec.encode(input.val as LockupScript)])
    } else {
      throw new Error(`ValCodec: unsupported val type: ${valType}`)
    }
  }

  decode(input: Buffer): Val {
    return this.parser.parse(input)
  }
}

const valCodec = new ValCodec()
const valsCodec = new ArrayCodec(valCodec)

export interface P2SH {
  script: Script
  params: DecodedArray<Val>
}

export class P2SHCodec implements Codec<P2SH> {
  parser = Parser.start()
    .nest('script', {
      type: scriptCodec.parser
    })
    .nest('params', {
      type: valsCodec.parser
    })

  encode(input: P2SH): Buffer {
    return Buffer.concat([scriptCodec.encode(input.script), valsCodec.encode(input.params.value)])
  }

  decode(input: Buffer): P2SH {
    return this.parser.parse(input)
  }
}

const p2shCodec = new P2SHCodec()

export interface UnlockScript {
  scriptType: number
  script: P2PKH | P2MPKH | P2SH
}

export class UnlockScriptCodec implements Codec<UnlockScript> {
  parser = Parser.start()
    .uint8('scriptType')
    .choice('script', {
      tag: 'scriptType',
      choices: {
        0: p2pkhCodec.parser,
        1: p2mpkhCodec.parser,
        2: p2shCodec.parser,
        3: Parser.start() // TODO: SameAsPrevious, FIXME
      }
    })

  encode(input: UnlockScript): Buffer {
    const scriptType = input.scriptType
    const inputUnLockScript = input.script
    const inputUnLockScriptType = Buffer.from([scriptType])

    if (scriptType === 0) {
      // P2PKH
      return Buffer.concat([inputUnLockScriptType, p2pkhCodec.encode(inputUnLockScript as P2PKH)])
    } else if (scriptType === 1) {
      // P2MPKH
      return Buffer.concat([inputUnLockScriptType, p2mpkhCodec.encode(inputUnLockScript as P2MPKH)])
    } else if (scriptType === 2) {
      // P2SH
      return Buffer.concat([inputUnLockScriptType, p2shCodec.encode(input.script as P2SH)])
    } else if (scriptType === 3) {
      // SameAsPrevious
      return inputUnLockScriptType
    } else {
      throw new Error(`TODO: encode unlock script: ${scriptType}`)
    }
  }

  decode(input: Buffer): UnlockScript {
    return this.parser.parse(input)
  }
}

export const unlockScriptCodec = new UnlockScriptCodec()
