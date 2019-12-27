import { Manager, Types, IManagerInit } from "router-primitives";
/**
 * Extends the manager and changes how routers are initialized.
 * Overrides router instantiation to turn routers in Mobx observables.
 */
declare class MobxManager extends Manager {
    constructor(init: IManagerInit);
    createNewRouterInitArgs({ name, config, type, parentName }: Types.IRouterCreationInfo): Types.IRouterInitArgs;
    createRouterFromInitArgs(initalArgs: Types.IRouterInitArgs): Types.IRouter;
    /**
     * Given a location change, set the new router state tree state
     * AKA:new location -> new state
     *
     * The method `calcNewRouterState` will recursively walk down the tree calling each
     * routers reducer to calculate the state
     *
     * This library avoids setting router state in a central state store.
     * Instead, state is set on each router.
     * Here we map over each state and set it on its respective router
     */
    setNewRouterState(location: Types.IInputLocation): void;
}
export { MobxManager };
