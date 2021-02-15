# List of peer dependencies:
-   "mobx-state-tree": "^3.x", 
-   "mobx-devtools-mst": "^0.9.x",
-   "react": "^16.x"

# How to install

-   Install package
-   Install all peerdependencies 

# How to create store 

```ts
// Import package
import { configureStore } from 'mst-storebooster';

// Import: 
// RootStore - MST tree model, 
// RootStoreModel - type of RootStore (aka Instance<RootStore>)
// RootStoreEnv - type of a global MST environment object with utils or tree nodes or trees themselves
// Any other MST tree models that were instantiated inside RootStore 
import {
    RootStore,
    RootStoreModel,
    RootStoreEnv,
    bookPhoneWidgetStoreInstance,
    // ...other instances
} from 'src/stores/models';

export type InstantiatedStoresType = typeof InstantiatedStoresBox;
export type BusType = typeof Bus;

export const InstantiatedStoresBox = {
    // master system's store instances;
    // other teams will have to mock instance that exist on the Bus for development;
    // they will not be distrubited with a package;
    // e.g., this store doesn't exist on the Bus -> Do not mock
    bookPhoneWidgetStore: bookPhoneWidgetStoreInstance,
    // e.g., a team needs some data from this store and gets access to it via Bus -> Mock path to this part of data
    IexistOntheBusStore: IexistOntheBusStoreInstance,

    // other teams' store instances;
    // master system will need these instances in dev;
    // It is team's duty to provide these instances in their npm packages
    team1RootStore: { 
        // all instances of team1 stores must be put inside this object
        team1StoreForSth: team1StoreForSthInstance,
    },
    team2RootStore: { 
        // all instances of team2 stores wiil be put inside this object
        team2StoreForSth: team2StoreForSthInstance,
    },
};

// all properties and their values must be declared in RootStoreEnv.
// Properties below are given as an example, they might not exist on the Bus
export const Bus = {
    // master system's bus data
    // other teams will haver to mock these for development
    commonLogoutUser: () => {
        // some common util
    },
    commonUserData: {
        // some common data needed for all teams
    },
    iExist: IexistOntheBusStore[0].doI.exist,
    // other teams' bus data
    // It is team's duty to provide these instances in their npm packages
    team1StoreParts: {
        // some parts from the store of a team that master system needs
        changeSth: team1StoreForSth.modelOfSth.changeSth,
        // ... other parts
    },
    team2StoreParts: {
        // some parts from the store of a team that master system needs
        changeSth: team2StoreForSth.modelOfSth.changeSth,
        // ... other parts

    },
};

// create root store with necessary stores and types
// and export all utils
export const {
    StoreProvider,
    useInject,
} = configureStore<
    RootStoreModel,
    RootStoreEnv,
    InstantiatedStoresType,
    BusType
>({
    RootStore,
    InstantiatedStoresBox,
    Bus,
})
```

# How to use created utils

## StoreProvider


```ts

// import created StoreProvider util in App.tsx
import { StoreProvider } from 'src/stores';

// wrap your element in it

<StoreProvider>
    App Entry Point - Bomjour!
    <App />
</StoreProvider>

```

## useInject


```ts

import React, { FC } from 'react';
import { observer } from "mobx-react-lite";
import { RootStoreModel, useInject } from "src/stores"

// create store selector function for injecting part of the Root store into a component;
// only one paramater and it is of type of RootStoreModel
// return value can be any data structure or primitives
const mapStore = ({ bookPhoneWidgetStore }: RootStoreModel) => bookPhoneWidgetStore.phoneInfo.changeView;

// observe changes via MRL **observer** 
export const SomeNestedElement: FC<{}> = observer((props) => {
    // types are inferred
    const changeView = useInject(mapStore)

    const handleChangeView = () => changeView('newPage');
    return (
        <div className={'some class'}>
            <button className={'another class'} onClick={handleChangeView}/>
        </div>
    );
});

```

