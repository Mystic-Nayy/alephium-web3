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

import { ec as EC } from 'elliptic'
import {
  ExplorerProvider,
  fromApiNumber256,
  fromApiTokens,
  NodeProvider,
  Number256,
  toApiNumber256,
  toApiNumber256Optional,
  toApiTokens,
  Token
} from '../api'
import { node } from '../api'
import * as utils from '../utils'
import { Eq, assertType } from '../utils'
import blake from 'blakejs'

export type OutputRef = node.OutputRef

const ec = new EC('secp256k1')

export interface Account {
  address: string
  group: number
  publicKey: string
}

export type SignerAddress = { signerAddress: string }
type TxBuildParams<T> = Omit<T, 'fromPublicKey' | 'targetBlockHash'> & SignerAddress
type SignResult<T> = Omit<T, 'gasPrice'> & { signature: string; gasPrice: Number256 }

export interface SignTransferTxParams {
  signerAddress: string
  destinations: Destination[]
  utxos?: OutputRef[]
  gasAmount?: number
  gasPrice?: Number256
}
assertType<Eq<keyof SignTransferTxParams, keyof TxBuildParams<node.BuildTransaction>>>()
export interface SignTransferTxResult {
  fromGroup: number
  toGroup: number
  unsignedTx: string
  txId: string
  signature: string
  gasAmount: number
  gasPrice: Number256
}
assertType<Eq<SignTransferTxResult, SignResult<node.BuildTransactionResult>>>()

export interface SignDeployContractTxParams {
  signerAddress: string
  bytecode: string
  initialAttoAlphAmount?: Number256
  initialTokenAmounts?: Token[]
  issueTokenAmount?: Number256
  gasAmount?: number
  gasPrice?: Number256
}
assertType<Eq<keyof SignDeployContractTxParams, keyof TxBuildParams<node.BuildDeployContractTx>>>()
export interface SignDeployContractTxResult {
  fromGroup: number
  toGroup: number
  unsignedTx: string
  txId: string
  signature: string
  contractId: string
  contractAddress: string
  gasAmount: number
  gasPrice: Number256
}
assertType<Eq<SignDeployContractTxResult, SignResult<node.BuildDeployContractTxResult> & { contractId: string }>>()

export interface SignExecuteScriptTxParams {
  signerAddress: string
  bytecode: string
  attoAlphAmount?: Number256
  tokens?: Token[]
  gasAmount?: number
  gasPrice?: Number256
}
assertType<Eq<keyof SignExecuteScriptTxParams, keyof TxBuildParams<node.BuildExecuteScriptTx>>>()
export interface SignExecuteScriptTxResult {
  fromGroup: number
  toGroup: number
  unsignedTx: string
  txId: string
  signature: string
  gasAmount: number
  gasPrice: Number256
}
assertType<Eq<SignExecuteScriptTxResult, SignResult<node.BuildExecuteScriptTxResult>>>()

export interface SignUnsignedTxParams {
  signerAddress: string
  unsignedTx: string
}
assertType<Eq<SignUnsignedTxParams, { unsignedTx: string } & SignerAddress>>()
export interface SignUnsignedTxResult {
  fromGroup: number
  toGroup: number
  unsignedTx: string
  txId: string
  signature: string
  gasAmount: number
  gasPrice: Number256
}
assertType<Eq<SignUnsignedTxResult, SignTransferTxResult>>

export interface SignMessageParams {
  signerAddress: string
  message: string
}
assertType<Eq<SignMessageParams, { message: string } & SignerAddress>>()
export interface SignMessageResult {
  signature: string
}

export interface SubmitTransactionParams {
  unsignedTx: string
  signature: string
}
export interface SubmissionResult {
  txId: string
  fromGroup: number
  toGroup: number
}

export interface SignerProvider {
  get nodeProvider(): NodeProvider | undefined
  get explorerProvider(): ExplorerProvider | undefined

  // If the target group is specified, the signer should return an account from that group
  getSelectedAccount(targetGroup?: number): Promise<Account>

  signAndSubmitTransferTx(params: SignTransferTxParams): Promise<SignTransferTxResult>
  signAndSubmitDeployContractTx(params: SignDeployContractTxParams): Promise<SignDeployContractTxResult>
  signAndSubmitExecuteScriptTx(params: SignExecuteScriptTxParams): Promise<SignExecuteScriptTxResult>
  signAndSubmitUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult>

  signUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult>
  // The message will be prefixed with 'Alephium Signed Message: ' before signing
  // so that the resulted signature cannot be reused for building transactions.
  signMessage(params: SignMessageParams): Promise<SignMessageResult>
}

export abstract class SignerProviderSimple implements SignerProvider {
  abstract get nodeProvider(): NodeProvider | undefined
  abstract get explorerProvider(): ExplorerProvider | undefined
  abstract getSelectedAccount(targetGroup?: number): Promise<Account>

  private getNodeProvider(): NodeProvider {
    if (this.nodeProvider === undefined) {
      throw Error('The signer does not contain a node provider')
    }
    return this.nodeProvider
  }

  async submitTransaction(params: SubmitTransactionParams): Promise<SubmissionResult> {
    const data: node.SubmitTransaction = { unsignedTx: params.unsignedTx, signature: params.signature }
    return this.getNodeProvider().transactions.postTransactionsSubmit(data)
  }

  async signAndSubmitTransferTx(params: SignTransferTxParams): Promise<SignTransferTxResult> {
    const signResult = await this.signTransferTx(params)
    await this.submitTransaction(signResult)
    return signResult
  }
  async signAndSubmitDeployContractTx(params: SignDeployContractTxParams): Promise<SignDeployContractTxResult> {
    const signResult = await this.signDeployContractTx(params)
    await this.submitTransaction(signResult)
    return signResult
  }
  async signAndSubmitExecuteScriptTx(params: SignExecuteScriptTxParams): Promise<SignExecuteScriptTxResult> {
    const signResult = await this.signExecuteScriptTx(params)
    await this.submitTransaction(signResult)
    return signResult
  }
  async signAndSubmitUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult> {
    const signResult = await this.signUnsignedTx(params)
    await this.submitTransaction(signResult)
    return signResult
  }

  private async usePublicKey<T extends SignerAddress>(
    params: T
  ): Promise<Omit<T, 'signerAddress'> & { fromPublicKey: string }> {
    const { signerAddress, ...restParams } = params
    const selectedAccount = await this.getSelectedAccount()
    if (signerAddress !== selectedAccount.address) {
      throw new Error('The signer address is not the selected address')
    } else {
      return { fromPublicKey: selectedAccount.publicKey, ...restParams }
    }
  }

  async signTransferTx(params: SignTransferTxParams): Promise<SignTransferTxResult> {
    const response = await this.buildTransferTx(params)
    const signature = await this.signRaw(params.signerAddress, response.txId)
    return { ...response, signature, gasPrice: fromApiNumber256(response.gasPrice) }
  }

  async buildTransferTx(params: SignTransferTxParams): Promise<node.BuildTransactionResult> {
    const data: node.BuildTransaction = {
      ...(await this.usePublicKey(params)),
      destinations: toApiDestinations(params.destinations),
      gasPrice: toApiNumber256Optional(params.gasPrice)
    }
    return this.getNodeProvider().transactions.postTransactionsBuild(data)
  }

  async signDeployContractTx(params: SignDeployContractTxParams): Promise<SignDeployContractTxResult> {
    const response = await this.buildContractCreationTx(params)
    const signature = await this.signRaw(params.signerAddress, response.txId)
    const contractId = utils.binToHex(utils.contractIdFromAddress(response.contractAddress))
    return { ...response, contractId, signature, gasPrice: fromApiNumber256(response.gasPrice) }
  }

  async buildContractCreationTx(params: SignDeployContractTxParams): Promise<node.BuildDeployContractTxResult> {
    const data: node.BuildDeployContractTx = {
      ...(await this.usePublicKey(params)),
      initialAttoAlphAmount: toApiNumber256Optional(params.initialAttoAlphAmount),
      initialTokenAmounts: toApiTokens(params.initialTokenAmounts),
      issueTokenAmount: toApiNumber256Optional(params.issueTokenAmount),
      gasPrice: toApiNumber256Optional(params.gasPrice)
    }
    return this.getNodeProvider().contracts.postContractsUnsignedTxDeployContract(data)
  }

  async signExecuteScriptTx(params: SignExecuteScriptTxParams): Promise<SignExecuteScriptTxResult> {
    const response = await this.buildScriptTx(params)
    const signature = await this.signRaw(params.signerAddress, response.txId)
    return { ...response, signature, gasPrice: fromApiNumber256(response.gasPrice) }
  }

  async buildScriptTx(params: SignExecuteScriptTxParams): Promise<node.BuildExecuteScriptTxResult> {
    const data: node.BuildExecuteScriptTx = {
      ...(await this.usePublicKey(params)),
      attoAlphAmount: toApiNumber256Optional(params.attoAlphAmount),
      tokens: toApiTokens(params.tokens),
      gasPrice: toApiNumber256Optional(params.gasPrice)
    }
    return this.getNodeProvider().contracts.postContractsUnsignedTxExecuteScript(data)
  }

  // in general, wallet should show the decoded information to user for confirmation
  // please overwrite this function for real wallet
  async signUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult> {
    const data = { unsignedTx: params.unsignedTx }
    const decoded = await this.getNodeProvider().transactions.postTransactionsDecodeUnsignedTx(data)
    const signature = await this.signRaw(params.signerAddress, decoded.unsignedTx.txId)
    return {
      fromGroup: decoded.fromGroup,
      toGroup: decoded.toGroup,
      unsignedTx: params.unsignedTx,
      txId: decoded.unsignedTx.txId,
      signature,
      gasAmount: decoded.unsignedTx.gasAmount,
      gasPrice: fromApiNumber256(decoded.unsignedTx.gasPrice)
    }
  }

  async signMessage(params: SignMessageParams): Promise<SignMessageResult> {
    const extendedMessage = extendMessage(params.message)
    const messageHash = blake.blake2b(extendedMessage, undefined, 32)
    const signature = await this.signRaw(params.signerAddress, utils.binToHex(messageHash))
    return { signature: signature }
  }

  abstract signRaw(signerAddress: string, hexString: string): Promise<string>
}

export abstract class SignerProviderWithMultipleAccounts extends SignerProviderSimple {
  abstract getAccounts(): Promise<Account[]>

  async getAccount(signerAddress: string): Promise<Account> {
    const accounts = await this.getAccounts()
    const account = accounts.find((a) => a.address === signerAddress)
    if (typeof account === 'undefined') {
      throw new Error('Unmatched signerAddress')
    } else {
      return account
    }
  }

  abstract setSelectedAccount(address: string): Promise<void>
}

export function verifyHexString(hexString: string, publicKey: string, signature: string): boolean {
  try {
    const key = ec.keyFromPublic(publicKey, 'hex')
    return key.verify(hexString, utils.signatureDecode(ec, signature))
  } catch (error) {
    return false
  }
}

function extendMessage(message: string): string {
  return 'Alephium Signed Message: ' + message
}

export function verifySignedMessage(message: string, publicKey: string, signature: string): boolean {
  const extendedMessage = extendMessage(message)
  const messageHash = blake.blake2b(extendedMessage, undefined, 32)
  return verifyHexString(utils.binToHex(messageHash), publicKey, signature)
}

export interface Destination {
  address: string
  attoAlphAmount: Number256
  tokens?: Token[]
  lockTime?: number
  message?: string
}
assertType<Eq<keyof Destination, keyof node.Destination>>

export function toApiDestination(data: Destination): node.Destination {
  return { ...data, attoAlphAmount: toApiNumber256(data.attoAlphAmount), tokens: toApiTokens(data.tokens) }
}

export function toApiDestinations(data: Destination[]): node.Destination[] {
  return data.map(toApiDestination)
}

export function fromApiDestination(data: node.Destination): Destination {
  return { ...data, attoAlphAmount: fromApiNumber256(data.attoAlphAmount), tokens: fromApiTokens(data.tokens) }
}
