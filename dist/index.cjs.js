'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var routerPrimitives = require('router-primitives');
var mobx = require('mobx');

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

mobx.decorate(routerPrimitives.RouterCache, {
    _cacheStore: mobx.observable,
    wasVisible: mobx.computed,
    removeCache: mobx.action,
    setWasPreviouslyVisibleToFromLocation: mobx.action,
    setWasPreviouslyVisibleTo: mobx.action
});
// class MobxRouterCache extends RouterCache {
//   public __cacheStore: boolean | undefined = undefined;
//   constructor() {
//     super();
//   }
// }
mobx.decorate(routerPrimitives.Router, {
    parent: mobx.observable,
    routers: mobx.observable,
    root: mobx.observable,
    config: mobx.observable,
    isPathRouter: mobx.computed,
    isRootRouter: mobx.computed,
    pathLocation: mobx.computed,
    siblings: mobx.computed,
    routeKey: mobx.computed,
    serialize: mobx.action,
    // state: computed,
    lastDefinedParentsDisableChildCacheState: mobx.computed
    // _EXPERIMENTAL_internal_state: observable
});
var MobxRouter = /** @class */ (function (_super) {
    __extends(MobxRouter, _super);
    function MobxRouter(init) {
        var _this = _super.call(this, init) || this;
        _this.__state = mobx.observable.object({});
        _this.__history = mobx.observable.array([]);
        _this.__EXPERIMENTAL_internal_state = mobx.observable.object({});
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
        mobx.runInAction(function () {
            mobx.set(_this.__EXPERIMENTAL_internal_state, __assign({}, internalState));
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
}(routerPrimitives.Router));
mobx.decorate(MobxRouter, {
    __state: mobx.observable,
    state: mobx.computed,
    __history: mobx.observable,
    history: mobx.computed,
    __EXPERIMENTAL_internal_state: mobx.observable,
    EXPERIMENTAL_internal_state: mobx.computed
    // show: action,
    // hide: action
});
mobx.decorate(routerPrimitives.Manager, {
    // rootRouter: observable
    // routers: observable
    calcNewRouterState: mobx.action
    // setCacheAndHide: action
    // setChildrenDefaults: action
    // createActionWrapperFunction: action
});
var actionFnDecorator = function (fn) {
    return mobx.action(fn);
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
        _this.__routers = mobx.observable.object({});
        var initArgs = __assign(__assign({}, init), { router: MobxRouter });
        mobx.runInAction(function () {
            _this.__routers = mobx.observable.object({});
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
            routers: {},
            manager: this,
            root: this.rootRouter,
            actions: actions,
            cache: this.routerCacheClass // eslint-disable-line
        };
    };
    MobxManager.prototype.registerRouter = function (name, router) {
        var _this = this;
        mobx.runInAction(function () {
            var _a;
            mobx.extendObservable(_this.__routers, (_a = {}, _a[name] = router, _a));
        });
    };
    MobxManager.prototype.unregisterRouter = function (name) {
        // runInAction(() => {
        //   delete this.__routers[name];
        // });
    };
    Object.defineProperty(MobxManager.prototype, "routers", {
        get: function () {
            console.log("getting routers");
            return this.__routers;
        },
        enumerable: true,
        configurable: true
    });
    MobxManager.prototype.createRouterFromInitArgs = function (initalArgs) {
        var routerClass = this.routerTypes[initalArgs.type];
        var mobxRouter = new routerClass(__assign({}, initalArgs));
        mobx.runInAction(function () {
            // check if parent is visible
            if (mobxRouter.parent && mobxRouter.parent.state.visible === true) {
                var defaultAction = mobxRouter.config.defaultAction || [];
                mobx.set(mobxRouter.__state, {
                    visible: defaultAction.includes("show")
                });
                // check if root router
            }
            else if (mobxRouter.isRootRouter) {
                mobx.set(mobxRouter.__state, {
                    visible: true
                });
            }
            else {
                mobx.set(mobxRouter.__state, {
                    visible: false
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
                mobx.runInAction(function () {
                    // console.log("setting new router state", r.name, routerSpecificState);
                    mobx.set(r.__state, __assign(__assign({}, routerSpecificState), r.EXPERIMENTAL_internal_state));
                    mobx.set(r.__history, newHistory_1);
                });
            }
        });
    };
    return MobxManager;
}(routerPrimitives.Manager));
mobx.decorate(MobxManager, {
    // __routers: observable,
    routers: mobx.computed,
    setNewRouterState: mobx.action
});

exports.MobxManager = MobxManager;
