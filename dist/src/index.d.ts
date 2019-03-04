import { Manager, Types } from 'recursive-router';
declare class MobxManager extends Manager {
    createNewRouterInitArgs({ name, config, type, parentName }: Types.IRouterInitParams): Types.IRouterInitArgs;
    createRouterFromInitArgs(initalArgs: Types.IRouterInitArgs, routerActionNames: string[]): Types.IRouter;
    setNewRouterState(location: Types.IInputLocation): void;
}
export { MobxManager, };
