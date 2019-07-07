import { Manager, Types } from 'router-primitives';
/**
 * Extends the manager and changes how routers are instantialized.
 * Overrides router instantiation to turn routers in Mobx observables.
 */
declare class MobxManager extends Manager {
    createNewRouterInitArgs({ name, config, type, parentName }: Types.IRouterInitParams): Types.IRouterInitArgs;
    createRouterFromInitArgs(initalArgs: Types.IRouterInitArgs, routerActionNames: string[]): Types.IRouter;
    setNewRouterState(location: Types.IInputLocation): void;
}
export { MobxManager, };
