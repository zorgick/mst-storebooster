import React from "react";
import makeInspectable from "mobx-devtools-mst";
import { IAnyModelType, Instance } from "mobx-state-tree";

/*
 * Generic Types:
 *  - first generic is GenRootStoreModel, which extends Instance type from MST. This
 *  is needed for methods, that Instance provides.
 *  - second generic is GenStoreEnv, which extends object for now. This is needed for TS to recognize
 *  stores that exist on the store bus
 *  - third generic is GenInstantiatedStoresBox, which represents instantiated stores
 *  that are loaded into the RootStore.
 *  - fourth generic is GenBus, which represent instantiated stores
 *  that must be accessible through the store bus
 */
export const configureStore = <
  GenRootStoreModel extends Instance<IAnyModelType>,
  GenStoreEnv extends Record<string, unknown>,
  GenInstantiatedStoresBox extends Record<string, unknown>,
  GenBus extends Record<string, unknown>
>({
  RootStore,
  InstantiatedStoresBox,
  Bus,
  ExecutionEnv = "production",
}: {
  RootStore: IAnyModelType;
  InstantiatedStoresBox: GenInstantiatedStoresBox;
  Bus: GenBus;
  ExecutionEnv?: "development" | "production";
}): {
  rootStore: GenRootStoreModel;
  StoreContext: React.Context<GenRootStoreModel | null>;
  StoreProvider: React.FC<{ children: React.ReactNode }>;
  useStore: () => GenRootStoreModel | null;
  useInject: (mapStore: <GenReturn>(store: GenRootStoreModel) => GenReturn) => void;
} => {
  // for now it will be a function with its own scope
  const createStore = (): GenRootStoreModel => {
    // @ts-ignore
    const env: GenStoreEnv = {
      ...Bus,
    };

    const rootStore: GenRootStoreModel = RootStore.create(
      {
        ...InstantiatedStoresBox,
      },
      env
    );

    return rootStore;
  };
  const rootStore = createStore();

  // React utils
  const StoreContext = React.createContext<GenRootStoreModel | null>(null);

  const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!children) {
      throw new Error("Provider cannot be mounted without React Element inside");
    }
    if (ExecutionEnv !== "production") {
      makeInspectable(rootStore as Record<string, unknown>);
    }
    return React.createElement(
      StoreContext.Provider,
      {
        value: rootStore,
      },
      children
    );
  };

  const useStore = (): GenRootStoreModel => {
    const value = React.useContext(StoreContext);
    if (!value) {
      throw new Error("useStore must be used within a StoreProvider. Please, add context!");
    }
    return value;
  };

  // type MapStore<GenReturn> = (store: GenRootStoreModel) => GenReturn;
  type MapStore<GenReturn> = (store: any) => GenReturn;

  /**
       * It is a simple property picker, same as
       * redux selector (memoization is handled by MST itself)
       * **NOTE!** Define a mapStore function beforehand.
       * Pass it to useInject, the latter will select a property from a global store
       * @example
        const mapStore = (
          store // or destructure it
        ) => {
          return {
              someDataForComponent: store.some.deep.property.we.need
          }
        };
        ...
        const {someDataForComponent} = useInject(mapStore);
       */
  const useInject = <GenReturn>(mapStore: MapStore<GenReturn>) => {
    const store = useStore();
    return mapStore(store);
  };

  const storeStruct = {
    rootStore,
    StoreContext,
    StoreProvider,
    useStore,
    useInject,
  };

  return storeStruct;
};
