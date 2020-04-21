import { RouterCache, Router, Manager } from 'router-primitives';
import { decorate, observable, action, computed, runInAction, set, extendObservable } from 'mobx';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

decorate(RouterCache, {
    cache: observable,
    transactionCache: observable,
    startTransaction: action,
    saveTransaction: action,
    discardTransaction: action,
    removeCache: action,
    setCache: action,
    setCacheFromSerialized: action,
});
// class MobxRouterCache extends RouterCache {
//   public __cacheStore: boolean | undefined = undefined;
//   constructor() {
//     super();
//   }
// }
decorate(Router, {
    parent: observable,
    routers: observable,
    root: observable,
    config: observable,
    isPathRouter: computed,
    isRootRouter: computed,
    pathLocation: computed,
    siblings: computed,
    routeKey: computed,
    serialize: action,
    // state: computed,
    lastDefinedParentsDisableChildCacheState: computed,
});
var MobxRouter = /** @class */ (function (_super) {
    __extends(MobxRouter, _super);
    function MobxRouter(init) {
        var _this = _super.call(this, init) || this;
        _this.__state = observable.object({ visible: false });
        _this.__history = observable.array([]);
        _this.__EXPERIMENTAL_internal_state = observable.object({});
        return _this;
    }
    Object.defineProperty(MobxRouter.prototype, "state", {
        get: function () {
            // return observable({
            return this.__state;
            // return { ...this.__state, ...this.EXPERIMENTAL_internal_state };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MobxRouter.prototype, "history", {
        get: function () {
            return this.__history;
        },
        enumerable: true,
        configurable: true
    });
    MobxRouter.prototype.EXPERIMENTAL_setInternalState = function (internalState) {
        var _this = this;
        runInAction(function () {
            set(_this.__EXPERIMENTAL_internal_state, __assign({}, internalState));
        });
    };
    Object.defineProperty(MobxRouter.prototype, "EXPERIMENTAL_internal_state", {
        get: function () {
            return this.__EXPERIMENTAL_internal_state || {};
        },
        enumerable: true,
        configurable: true
    });
    return MobxRouter;
}(Router));
decorate(MobxRouter, {
    __state: observable,
    state: computed,
    __history: observable,
    history: computed,
    __EXPERIMENTAL_internal_state: observable,
    EXPERIMENTAL_internal_state: computed,
});
decorate(Manager, {
    // rootRouter: observable
    // routers: observable
    calcNewRouterState: action,
});
var actionFnDecorator = function (fn) {
    return action(fn);
};
/**
 * Extends the manager and changes how routers are initialized.
 * Overrides router instantiation to turn routers in Mobx observables.
 */
var MobxManager = /** @class */ (function (_super) {
    __extends(MobxManager, _super);
    function MobxManager(init) {
        var _this = 
        // const router = MobxRouter;
        _super.call(this, {}, { shouldInitialize: false, actionFnDecorator: actionFnDecorator }) || this;
        _this.__routers = observable.object({});
        var initArgs = __assign(__assign({}, init), { router: MobxRouter });
        runInAction(function () {
            _this.__routers = observable.object({});
        });
        _this.initializeManager(initArgs);
        return _this;
        // this.__routers = observable<{ [routerName: string]: RouterInstance }>({});
        // this.__routers = {};
    }
    // remove getState and subscribe
    MobxManager.prototype.createNewRouterInitArgs = function (_a) {
        var name = _a.name, config = _a.config, type = _a.type, parentName = _a.parentName;
        var parent = this.routers[parentName];
        var actions = Object.keys(this.templates[type].actions);
        return {
            name: name,
            config: __assign({}, config),
            type: type,
            parent: parent,
            children: {},
            manager: this,
            root: this.rootRouter,
            actions: actions,
        };
    };
    MobxManager.prototype.registerRouter = function (name, router) {
        var _this = this;
        runInAction(function () {
            var _a;
            extendObservable(_this.__routers, (_a = {}, _a[name] = router, _a));
        });
    };
    MobxManager.prototype.unregisterRouter = function (name) {
        // runInAction(() => {
        //   delete this.__routers[name];
        // });
    };
    Object.defineProperty(MobxManager.prototype, "routers", {
        get: function () {
            return this.__routers;
        },
        enumerable: true,
        configurable: true
    });
    MobxManager.prototype.createRouterFromInitArgs = function (initalArgs) {
        var routerClass = this.routerTypes[initalArgs.type];
        var mobxRouter = new routerClass(__assign({}, initalArgs));
        runInAction(function () {
            // check if parent is visible
            if (mobxRouter.parent && mobxRouter.parent.state.visible === true) {
                var defaultAction = mobxRouter.config.defaultAction || [];
                set(mobxRouter.__state, {
                    visible: defaultAction.includes("show"),
                });
                // check if root router
            }
            else if (mobxRouter.isRootRouter) {
                set(mobxRouter.__state, {
                    visible: true,
                });
            }
            else {
                set(mobxRouter.__state, {
                    visible: false,
                });
            }
        });
        return mobxRouter;
    };
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
    MobxManager.prototype.setNewRouterState = function (location) {
        this.setCacheFromLocation(location);
        if (this.removeCacheAfterRehydration &&
            location.search[this.cacheKey] !== undefined) {
            return this.removeCacheFromLocation(location);
        }
        var newState = this.calcNewRouterState(location, this.rootRouter);
        var routers = this.routers;
        Object.values(routers).forEach(function (r) {
            var routerSpecificState = newState[r.name];
            // Only update state if it is defined for this router
            // TODO remove the history length limitation and use config option
            if (routerSpecificState !== undefined) {
                var newHistory_1 = [__assign({}, r.state)]
                    .concat(r.history)
                    .filter(function (s) { return s !== undefined && s.visible !== undefined; });
                if (newHistory_1.length > 5) {
                    newHistory_1 = newHistory_1.slice(0, 5);
                }
                runInAction(function () {
                    set(r.__state, __assign(__assign({}, routerSpecificState), r.EXPERIMENTAL_internal_state));
                    set(r.__history, newHistory_1);
                });
            }
        });
    };
    return MobxManager;
}(Manager));
decorate(MobxManager, {
    // __routers: observable,
    routers: computed,
    setCacheFromLocation: action,
    setNewRouterState: action,
});

export { MobxManager };
