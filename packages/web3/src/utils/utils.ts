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

import { ec as EC, SignatureInput } from 'elliptic'
import BN from 'bn.js'
import blake from 'blakejs'
import bs58 from './bs58'
import { Buffer } from 'buffer/'

import { TOTAL_NUMBER_OF_GROUPS, TOTAL_NUMBER_OF_CHAINS } from '../constants'
import djb2 from './djb2'
import { KeyType } from '../signer'
import { HexString } from '../contract'

export const networkIds = ['mainnet', 'testnet', 'devnet'] as const
export type NetworkId = (typeof networkIds)[number]

const ec = new EC('secp256k1')

export function encodeSignature(signature: EC.Signature | { r: BN; s: BN }): string {
  let sNormalized = signature.s
  if (ec.n && signature.s.cmp(ec.nh) === 1) {
    sNormalized = ec.n.sub(signature.s)
  }

  const r = signature.r.toString('hex', 66).slice(2)
  const s = sNormalized.toString('hex', 66).slice(2)
  return r + s
}

export function encodeHexSignature(rHex: string, sHex: string): string {
  return encodeSignature({ r: new BN(rHex, 'hex'), s: new BN(sHex, 'hex') })
}

// the signature should be in hex string format for 64 bytes
export function signatureDecode(ec: EC, signature: string): SignatureInput {
  if (signature.length !== 128) {
    throw new Error('Invalid signature length')
  }

  const sHex = signature.slice(64, 128)
  const s = new BN(sHex, 'hex')
  if (ec.n && s.cmp(ec.nh) < 1) {
    const decoded = { r: signature.slice(0, 64), s: sHex }
    return decoded
  } else {
    throw new Error('The signature is not normalized')
  }
}

export function xorByte(intValue: number): number {
  const byte0 = (intValue >> 24) & 0xff
  const byte1 = (intValue >> 16) & 0xff
  const byte2 = (intValue >> 8) & 0xff
  const byte3 = intValue & 0xff
  return (byte0 ^ byte1 ^ byte2 ^ byte3) & 0xff
}

export function isHexString(input: string): boolean {
  return input.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(input)
}

export function toNonNegativeBigInt(input: string): bigint | undefined {
  try {
    const bigIntValue = BigInt(input)
    return bigIntValue < 0n ? undefined : bigIntValue
  } catch {
    return undefined
  }
}

export enum AddressType {
  P2PKH = 0x00,
  P2MPKH = 0x01,
  P2SH = 0x02,
  P2C = 0x03
}

export function groupOfAddress(address: string): number {
  const decoded = bs58.decode(address)

  if (decoded.length == 0) throw new Error('Address string is empty')
  const addressType = decoded[0]
  const addressBody = decoded.slice(1)

  if (addressType == AddressType.P2PKH) {
    return groupOfP2pkhAddress(addressBody)
  } else if (addressType == AddressType.P2MPKH) {
    return groupOfP2mpkhAddress(addressBody)
  } else if (addressType == AddressType.P2SH) {
    return groupOfP2shAddress(addressBody)
  } else {
    // Contract Address
    const id = contractIdFromAddress(address)
    return id[`${id.length - 1}`]
  }
}

function groupOfAddressBytes(bytes: Uint8Array): number {
  const hint = djb2(bytes) | 1
  const hash = xorByte(hint)
  const group = hash % TOTAL_NUMBER_OF_GROUPS
  return group
}

// Pay to public key hash address
function groupOfP2pkhAddress(address: Uint8Array): number {
  if (address.length != 32) {
    throw new Error(`Invalid p2pkh address length: ${address.length}`)
  }

  return groupOfAddressBytes(address)
}

// Pay to multiple public key hash address
function groupOfP2mpkhAddress(address: Uint8Array): number {
  if ((address.length - 2) % 32 != 0) {
    throw new Error(`Invalid p2mpkh address length: ${address.length}`)
  }

  return groupOfAddressBytes(address.slice(1, 33))
}

// Pay to script hash address
function groupOfP2shAddress(address: Uint8Array): number {
  return groupOfAddressBytes(address)
}

export function contractIdFromAddress(address: string): Uint8Array {
  return idFromAddress(address)
}

export function tokenIdFromAddress(address: string): Uint8Array {
  return idFromAddress(address)
}

function idFromAddress(address: string): Uint8Array {
  const decoded = bs58.decode(address)

  if (decoded.length == 0) throw new Error('Address string is empty')
  const addressType = decoded[0]
  const addressBody = decoded.slice(1)

  if (addressType == AddressType.P2C) {
    return addressBody
  } else {
    throw new Error(`Invalid contract address type: ${addressType}`)
  }
}

export function hexToBinUnsafe(hex: string): Uint8Array {
  return Buffer.from(hex, 'hex')
}

export function binToHex(bin: Uint8Array): string {
  return Buffer.from(bin).toString('hex')
}

export function groupOfPrivateKey(privateKey: string, keyType?: KeyType): number {
  return groupOfAddress(addressFromPublicKey(publicKeyFromPrivateKey(privateKey, keyType), keyType))
}

export function publicKeyFromPrivateKey(privateKey: string, _keyType?: KeyType): string {
  const keyType = _keyType ?? 'default'

  if (keyType === 'default') {
    const key = ec.keyFromPrivate(privateKey)
    return key.getPublic(true, 'hex')
  } else if (keyType === 'bip340-schnorr') {
    return ec.g.mul(new BN(privateKey, 16)).encode('hex', true).slice(2)
  } else {
    throw new Error(`Not supported`)
  }
}

export function addressFromPublicKey(publicKey: string, _keyType?: KeyType): string {
  const keyType = _keyType ?? 'default'

  if (keyType === 'default') {
    const addressType = Buffer.from([AddressType.P2PKH])
    const hash = Buffer.from(blake.blake2b(Buffer.from(publicKey, 'hex'), undefined, 32))
    const bytes = Buffer.concat([addressType, hash])
    return bs58.encode(bytes)
  } else if (keyType === 'bip340-schnorr') {
    const lockupScript = Buffer.from(`0101000000000458144020${publicKey}8685`, 'hex')
    return addressFromScript(lockupScript)
  } else {
    const lockupScript = Buffer.from(
      `020100000000048618144021${publicKey}180100010d0140901440404142434445464748494a4b4c4d4e4f505152535455565758595a6162636465666768696a6b6c6d6e6f707172737475767778797a303132333435363738392d5f17011600431702140017030c170416041602314c406f1600160416040d2a626c170516050e3c170616031601160616060d2a6244170316040d2a1602314c0a160016040d2a16040e2a626c4a010c170716050f38103b1607103c39170816031601160816080d2a6244170316040e2a1602314c0a160016040e2a16040f2a626c4a010c17091607130f380e3b160913063c39170a1609133f38170b16031601160a160a0d2a62441601160b160b0d2a6244170316040f2a17044a7f8d16020f2e170c160c0c2f4c0216034a0916030c1603430f2b160c2a6202`,
      'hex'
    )
    return addressFromScript(lockupScript)
  }
}

export function addressFromScript(script: Uint8Array): string {
  const scriptHash = blake.blake2b(script, undefined, 32)
  const addressType = Buffer.from([AddressType.P2SH])
  return bs58.encode(Buffer.concat([addressType, scriptHash]))
}

export function addressFromContractId(contractId: string): string {
  const addressType = Buffer.from([AddressType.P2C])
  const hash = Buffer.from(hexToBinUnsafe(contractId))
  const bytes = Buffer.concat([addressType, hash])
  return bs58.encode(bytes)
}

export function addressFromTokenId(tokenId: string): string {
  const contractId = tokenId // contract ID is the same as token ID
  return addressFromContractId(contractId)
}

export function contractIdFromTx(txId: string, outputIndex: number): string {
  const txIdBin = hexToBinUnsafe(txId)
  const data = Buffer.concat([txIdBin, Buffer.from([outputIndex])])
  const hash = blake.blake2b(data, undefined, 32)
  return binToHex(hash)
}

export function subContractId(parentContractId: string, pathInHex: string, group: number): string {
  if (group < 0 || group >= TOTAL_NUMBER_OF_GROUPS) {
    throw new Error(`Invalid group ${group}`)
  }
  const data = Buffer.concat([hexToBinUnsafe(parentContractId), hexToBinUnsafe(pathInHex)])
  const bytes = Buffer.concat([
    blake.blake2b(blake.blake2b(data, undefined, 32), undefined, 32).slice(0, -1),
    Buffer.from([group])
  ])
  return binToHex(bytes)
}

export function blockChainIndex(blockHash: HexString): { fromGroup: number; toGroup: number } {
  if (blockHash.length != 64) {
    throw Error(`Invalid block hash: ${blockHash}`)
  }

  const rawIndex = Number('0x' + blockHash.slice(-4)) % TOTAL_NUMBER_OF_CHAINS
  return { fromGroup: Math.floor(rawIndex / TOTAL_NUMBER_OF_GROUPS), toGroup: rawIndex % TOTAL_NUMBER_OF_GROUPS }
}

export function stringToHex(str: string): string {
  let hex = ''
  for (let i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16)
  }
  return hex
}

export function hexToString(str: string): string {
  if (!isHexString(str)) {
    throw new Error(`Invalid hex string: ${str}`)
  }
  return Buffer.from(str, 'hex').toString()
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type _Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false
export type Eq<X, Y> = _Eq<{ [P in keyof X]: X[P] }, { [P in keyof Y]: Y[P] }>
// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
export function assertType<T extends true>(): void {}
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
