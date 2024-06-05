/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  Contract,
  ContractState,
  TestContractResult,
  HexString,
  ContractFactory,
  EventSubscribeOptions,
  EventSubscription,
  CallContractParams,
  CallContractResult,
  TestContractParams,
  ContractEvent,
  subscribeContractEvent,
  subscribeContractEvents,
  testMethod,
  callMethod,
  multicallMethods,
  fetchContractState,
  ContractInstance,
  getContractEventsCurrentCount,
  TestContractParamsWithoutMaps,
  TestContractResultWithoutMaps,
  SignExecuteContractMethodParams,
  SignExecuteScriptTxResult,
  signExecuteMethod,
  addStdIdToFields,
  encodeContractFields,
} from "@alephium/web3";
import { default as NFTTestContractJson } from "../nft/NFTTest.ral.json";
import { getContractByCodeHash } from "./contracts";
import {
  AddStruct1,
  AddStruct2,
  Balances,
  MapValue,
  TokenBalance,
  AllStructs,
} from "./types";

// Custom types for the contract
export namespace NFTTestTypes {
  export type Fields = {
    collectionId: HexString;
    nftIndex: bigint;
    uri: HexString;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getTokenUri: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getCollectionIndex: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<[HexString, bigint]>;
    };
  }
  export type CallMethodParams<T extends keyof CallMethodTable> =
    CallMethodTable[T]["params"];
  export type CallMethodResult<T extends keyof CallMethodTable> =
    CallMethodTable[T]["result"];
  export type MultiCallParams = Partial<{
    [Name in keyof CallMethodTable]: CallMethodTable[Name]["params"];
  }>;
  export type MultiCallResults<T extends MultiCallParams> = {
    [MaybeName in keyof T]: MaybeName extends keyof CallMethodTable
      ? CallMethodTable[MaybeName]["result"]
      : undefined;
  };

  export interface SignExecuteMethodTable {
    getTokenUri: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getCollectionIndex: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
  }
  export type SignExecuteMethodParams<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["params"];
  export type SignExecuteMethodResult<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["result"];
}

class Factory extends ContractFactory<NFTTestInstance, NFTTestTypes.Fields> {
  encodeFields(fields: NFTTestTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      AllStructs
    );
  }

  getInitialFieldsWithDefaultValues() {
    return this.contract.getInitialFieldsWithDefaultValues() as NFTTestTypes.Fields;
  }

  at(address: string): NFTTestInstance {
    return new NFTTestInstance(address);
  }

  tests = {
    getTokenUri: async (
      params: Omit<
        TestContractParamsWithoutMaps<NFTTestTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getTokenUri", params, getContractByCodeHash);
    },
    getCollectionIndex: async (
      params: Omit<
        TestContractParamsWithoutMaps<NFTTestTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<[HexString, bigint]>> => {
      return testMethod(
        this,
        "getCollectionIndex",
        params,
        getContractByCodeHash
      );
    },
  };
}

// Use this object to test and deploy the contract
export const NFTTest = new Factory(
  Contract.fromJson(
    NFTTestContractJson,
    "",
    "4897086210869e612d82995b765a447c5319a55a56e8a0c3c07b4d9ca81e15b1",
    AllStructs
  )
);

// Use this class to interact with the blockchain
export class NFTTestInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NFTTestTypes.State> {
    return fetchContractState(NFTTest, this);
  }

  methods = {
    getTokenUri: async (
      params?: NFTTestTypes.CallMethodParams<"getTokenUri">
    ): Promise<NFTTestTypes.CallMethodResult<"getTokenUri">> => {
      return callMethod(
        NFTTest,
        this,
        "getTokenUri",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getCollectionIndex: async (
      params?: NFTTestTypes.CallMethodParams<"getCollectionIndex">
    ): Promise<NFTTestTypes.CallMethodResult<"getCollectionIndex">> => {
      return callMethod(
        NFTTest,
        this,
        "getCollectionIndex",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  call = this.methods;

  txCall = {
    getTokenUri: async (
      params: NFTTestTypes.SignExecuteMethodParams<"getTokenUri">
    ): Promise<NFTTestTypes.SignExecuteMethodResult<"getTokenUri">> => {
      return signExecuteMethod(NFTTest, this, "getTokenUri", params);
    },
    getCollectionIndex: async (
      params: NFTTestTypes.SignExecuteMethodParams<"getCollectionIndex">
    ): Promise<NFTTestTypes.SignExecuteMethodResult<"getCollectionIndex">> => {
      return signExecuteMethod(NFTTest, this, "getCollectionIndex", params);
    },
  };

  async multicall<Calls extends NFTTestTypes.MultiCallParams>(
    calls: Calls
  ): Promise<NFTTestTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      NFTTest,
      this,
      calls,
      getContractByCodeHash
    )) as NFTTestTypes.MultiCallResults<Calls>;
  }
}
