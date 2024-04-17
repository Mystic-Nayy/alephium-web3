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
} from "@alephium/web3";
import { default as AssertContractJson } from "../test/Assert.ral.json";
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
export namespace AssertTypes {
  export type State = Omit<ContractState<any>, "fields">;

  export interface CallMethodTable {
    test: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<null>;
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
    test: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
  }
  export type SignExecuteMethodParams<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["params"];
  export type SignExecuteMethodResult<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["result"];
}

class Factory extends ContractFactory<AssertInstance, {}> {
  consts = {
    Error: BigInt(3),
    A: BigInt(-3),
    B: "1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH",
    C: "0011",
    Addresses: {
      A: "1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH",
      B: "14UAjZ3qcmEVKdTo84Kwf4RprTQi86w2TefnnGFjov9xF",
    },
    Numbers: { A: BigInt(0), B: BigInt(1) },
    ByteVecs: { A: "00", B: "11" },
  };

  at(address: string): AssertInstance {
    return new AssertInstance(address);
  }

  tests = {
    test: async (
      params?: Omit<
        TestContractParamsWithoutMaps<never, never>,
        "testArgs" | "initialFields"
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "test", params === undefined ? {} : params);
    },
  };
}

// Use this object to test and deploy the contract
export const Assert = new Factory(
  Contract.fromJson(
    AssertContractJson,
    "",
    "5bd05924fb9a23ea105df065a8c2dfa463b9ee53cc14a60320140d19dd6151ca",
    AllStructs
  )
);

// Use this class to interact with the blockchain
export class AssertInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<AssertTypes.State> {
    return fetchContractState(Assert, this);
  }

  methods = {
    test: async (
      params?: AssertTypes.CallMethodParams<"test">
    ): Promise<AssertTypes.CallMethodResult<"test">> => {
      return callMethod(
        Assert,
        this,
        "test",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  call = this.methods;

  transaction = {
    test: async (
      params: AssertTypes.SignExecuteMethodParams<"test">
    ): Promise<AssertTypes.SignExecuteMethodResult<"test">> => {
      return signExecuteMethod(Assert, this, "test", params);
    },
  };
}
