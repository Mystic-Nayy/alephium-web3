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

import { utils } from '..'
import { fromApiNumber256, node, NodeProvider, toApiNumber256Optional, toApiTokens } from '../api'
import { addressFromPublicKey } from '../utils'
import { toApiDestinations } from './signer'
import {
  SignDeployContractTxParams,
  SignDeployContractTxResult,
  SignerAddress,
  SignExecuteScriptTxParams,
  SignExecuteScriptTxResult,
  SignTransferTxParams,
  SignTransferTxResult,
  SignUnsignedTxParams,
  SignUnsignedTxResult
} from './types'

export abstract class TransactionBuilder {
  abstract get nodeProvider(): NodeProvider

  static create(baseUrl: string, apiKey?: string) {
    const nodeProvider = new NodeProvider(baseUrl, apiKey)
    return new (class extends TransactionBuilder {
      get nodeProvider(): NodeProvider {
        return nodeProvider
      }
    })()
  }

  private static validatePublicKey(params: SignerAddress, publicKey: string) {
    const address = addressFromPublicKey(publicKey)
    if (address !== params.signerAddress) {
      throw new Error('Unmatched public key')
    }
  }

  async buildTransferTx(
    params: SignTransferTxParams,
    publicKey: string
  ): Promise<Omit<SignTransferTxResult, 'signature'>> {
    TransactionBuilder.validatePublicKey(params, publicKey)

    const { destinations, gasPrice, ...rest } = params
    const data: node.BuildTransaction = {
      fromPublicKey: publicKey,
      destinations: toApiDestinations(destinations),
      gasPrice: toApiNumber256Optional(gasPrice),
      ...rest
    }
    const response = await this.nodeProvider.transactions.postTransactionsBuild(data)
    return { ...response, gasPrice: fromApiNumber256(response.gasPrice) }
  }

  async buildDeployContractTx(
    params: SignDeployContractTxParams,
    publicKey: string
  ): Promise<Omit<SignDeployContractTxResult, 'signature'>> {
    TransactionBuilder.validatePublicKey(params, publicKey)

    const { initialAttoAlphAmount, initialTokenAmounts, issueTokenAmount, gasPrice, ...rest } = params
    const data: node.BuildDeployContractTx = {
      fromPublicKey: publicKey,
      initialAttoAlphAmount: toApiNumber256Optional(initialAttoAlphAmount),
      initialTokenAmounts: toApiTokens(initialTokenAmounts),
      issueTokenAmount: toApiNumber256Optional(issueTokenAmount),
      gasPrice: toApiNumber256Optional(gasPrice),
      ...rest
    }
    const response = await this.nodeProvider.contracts.postContractsUnsignedTxDeployContract(data)
    const contractId = utils.binToHex(utils.contractIdFromAddress(response.contractAddress))
    return { ...response, contractId, gasPrice: fromApiNumber256(response.gasPrice) }
  }

  async buildExecuteScriptTx(
    params: SignExecuteScriptTxParams,
    publicKey: string
  ): Promise<Omit<SignExecuteScriptTxResult, 'signature'>> {
    TransactionBuilder.validatePublicKey(params, publicKey)

    const { attoAlphAmount, tokens, gasPrice, ...rest } = params
    const data: node.BuildExecuteScriptTx = {
      fromPublicKey: publicKey,
      attoAlphAmount: toApiNumber256Optional(attoAlphAmount),
      tokens: toApiTokens(tokens),
      gasPrice: toApiNumber256Optional(gasPrice),
      ...rest
    }
    const response = await this.nodeProvider.contracts.postContractsUnsignedTxExecuteScript(data)
    return { ...response, gasPrice: fromApiNumber256(response.gasPrice) }
  }

  async buildUnsignedTx(params: SignUnsignedTxParams): Promise<Omit<SignUnsignedTxResult, 'signature'>> {
    const data = { unsignedTx: params.unsignedTx }
    const decoded = await this.nodeProvider.transactions.postTransactionsDecodeUnsignedTx(data)
    return {
      fromGroup: decoded.fromGroup,
      toGroup: decoded.toGroup,
      unsignedTx: params.unsignedTx,
      txId: decoded.unsignedTx.txId,
      gasAmount: decoded.unsignedTx.gasAmount,
      gasPrice: fromApiNumber256(decoded.unsignedTx.gasPrice)
    }
  }
}
