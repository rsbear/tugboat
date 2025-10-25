import { input as H } from "@tugboats/core";
function st(a) {
  return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, "default") ? a.default : a;
}
var O = { exports: {} }, C = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var z;
function it() {
  if (z) return C;
  z = 1;
  var a = Symbol.for("react.transitional.element"), y = Symbol.for("react.fragment");
  function d(h, c, _) {
    var E = null;
    if (_ !== void 0 && (E = "" + _), c.key !== void 0 && (E = "" + c.key), "key" in c) {
      _ = {};
      for (var R in c)
        R !== "key" && (_[R] = c[R]);
    } else _ = c;
    return c = _.ref, {
      $$typeof: a,
      type: h,
      key: E,
      ref: c !== void 0 ? c : null,
      props: _
    };
  }
  return C.Fragment = y, C.jsx = d, C.jsxs = d, C;
}
var G;
function ft() {
  return G || (G = 1, O.exports = it()), O.exports;
}
var p = ft(), N = { exports: {} }, n = {}, B;
function ct() {
  if (B) return n;
  B = 1;
  var a = {};
  /**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var y = Symbol.for("react.transitional.element"), d = Symbol.for("react.portal"), h = Symbol.for("react.fragment"), c = Symbol.for("react.strict_mode"), _ = Symbol.for("react.profiler"), E = Symbol.for("react.consumer"), R = Symbol.for("react.context"), x = Symbol.for("react.forward_ref"), Z = Symbol.for("react.suspense"), F = Symbol.for("react.memo"), $ = Symbol.for("react.lazy"), K = Symbol.for("react.activity"), Y = Symbol.iterator;
  function V(t) {
    return t === null || typeof t != "object" ? null : (t = Y && t[Y] || t["@@iterator"], typeof t == "function" ? t : null);
  }
  var M = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, k = Object.assign, I = {};
  function m(t, e, u) {
    this.props = t, this.context = e, this.refs = I, this.updater = u || M;
  }
  m.prototype.isReactComponent = {}, m.prototype.setState = function(t, e) {
    if (typeof t != "object" && typeof t != "function" && t != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, t, e, "setState");
  }, m.prototype.forceUpdate = function(t) {
    this.updater.enqueueForceUpdate(this, t, "forceUpdate");
  };
  function L() {
  }
  L.prototype = m.prototype;
  function S(t, e, u) {
    this.props = t, this.context = e, this.refs = I, this.updater = u || M;
  }
  var g = S.prototype = new L();
  g.constructor = S, k(g, m.prototype), g.isPureReactComponent = !0;
  var q = Array.isArray;
  function A() {
  }
  var i = { H: null, A: null, T: null, S: null }, U = Object.prototype.hasOwnProperty;
  function w(t, e, u) {
    var r = u.ref;
    return {
      $$typeof: y,
      type: t,
      key: e,
      ref: r !== void 0 ? r : null,
      props: u
    };
  }
  function tt(t, e) {
    return w(t.type, e, t.props);
  }
  function P(t) {
    return typeof t == "object" && t !== null && t.$$typeof === y;
  }
  function et(t) {
    var e = { "=": "=0", ":": "=2" };
    return "$" + t.replace(/[=:]/g, function(u) {
      return e[u];
    });
  }
  var D = /\/+/g;
  function b(t, e) {
    return typeof t == "object" && t !== null && t.key != null ? et("" + t.key) : e.toString(36);
  }
  function nt(t) {
    switch (t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw t.reason;
      default:
        switch (typeof t.status == "string" ? t.then(A, A) : (t.status = "pending", t.then(
          function(e) {
            t.status === "pending" && (t.status = "fulfilled", t.value = e);
          },
          function(e) {
            t.status === "pending" && (t.status = "rejected", t.reason = e);
          }
        )), t.status) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw t.reason;
        }
    }
    throw t;
  }
  function T(t, e, u, r, o) {
    var s = typeof t;
    (s === "undefined" || s === "boolean") && (t = null);
    var f = !1;
    if (t === null) f = !0;
    else
      switch (s) {
        case "bigint":
        case "string":
        case "number":
          f = !0;
          break;
        case "object":
          switch (t.$$typeof) {
            case y:
            case d:
              f = !0;
              break;
            case $:
              return f = t._init, T(
                f(t._payload),
                e,
                u,
                r,
                o
              );
          }
      }
    if (f)
      return o = o(t), f = r === "" ? "." + b(t, 0) : r, q(o) ? (u = "", f != null && (u = f.replace(D, "$&/") + "/"), T(o, e, u, "", function(ot) {
        return ot;
      })) : o != null && (P(o) && (o = tt(
        o,
        u + (o.key == null || t && t.key === o.key ? "" : ("" + o.key).replace(
          D,
          "$&/"
        ) + "/") + f
      )), e.push(o)), 1;
    f = 0;
    var v = r === "" ? "." : r + ":";
    if (q(t))
      for (var l = 0; l < t.length; l++)
        r = t[l], s = v + b(r, l), f += T(
          r,
          e,
          u,
          s,
          o
        );
    else if (l = V(t), typeof l == "function")
      for (t = l.call(t), l = 0; !(r = t.next()).done; )
        r = r.value, s = v + b(r, l++), f += T(
          r,
          e,
          u,
          s,
          o
        );
    else if (s === "object") {
      if (typeof t.then == "function")
        return T(
          nt(t),
          e,
          u,
          r,
          o
        );
      throw e = String(t), Error(
        "Objects are not valid as a React child (found: " + (e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return f;
  }
  function j(t, e, u) {
    if (t == null) return t;
    var r = [], o = 0;
    return T(t, r, "", "", function(s) {
      return e.call(u, s, o++);
    }), r;
  }
  function rt(t) {
    if (t._status === -1) {
      var e = t._result;
      e = e(), e.then(
        function(u) {
          (t._status === 0 || t._status === -1) && (t._status = 1, t._result = u);
        },
        function(u) {
          (t._status === 0 || t._status === -1) && (t._status = 2, t._result = u);
        }
      ), t._status === -1 && (t._status = 0, t._result = e);
    }
    if (t._status === 1) return t._result.default;
    throw t._result;
  }
  var J = typeof reportError == "function" ? reportError : function(t) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var e = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof t == "object" && t !== null && typeof t.message == "string" ? String(t.message) : String(t),
        error: t
      });
      if (!window.dispatchEvent(e)) return;
    } else if (typeof a == "object" && typeof a.emit == "function") {
      a.emit("uncaughtException", t);
      return;
    }
    console.error(t);
  }, ut = {
    map: j,
    forEach: function(t, e, u) {
      j(
        t,
        function() {
          e.apply(this, arguments);
        },
        u
      );
    },
    count: function(t) {
      var e = 0;
      return j(t, function() {
        e++;
      }), e;
    },
    toArray: function(t) {
      return j(t, function(e) {
        return e;
      }) || [];
    },
    only: function(t) {
      if (!P(t))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return t;
    }
  };
  return n.Activity = K, n.Children = ut, n.Component = m, n.Fragment = h, n.Profiler = _, n.PureComponent = S, n.StrictMode = c, n.Suspense = Z, n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, n.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(t) {
      return i.H.useMemoCache(t);
    }
  }, n.cache = function(t) {
    return function() {
      return t.apply(null, arguments);
    };
  }, n.cacheSignal = function() {
    return null;
  }, n.cloneElement = function(t, e, u) {
    if (t == null)
      throw Error(
        "The argument must be a React element, but you passed " + t + "."
      );
    var r = k({}, t.props), o = t.key;
    if (e != null)
      for (s in e.key !== void 0 && (o = "" + e.key), e)
        !U.call(e, s) || s === "key" || s === "__self" || s === "__source" || s === "ref" && e.ref === void 0 || (r[s] = e[s]);
    var s = arguments.length - 2;
    if (s === 1) r.children = u;
    else if (1 < s) {
      for (var f = Array(s), v = 0; v < s; v++)
        f[v] = arguments[v + 2];
      r.children = f;
    }
    return w(t.type, o, r);
  }, n.createContext = function(t) {
    return t = {
      $$typeof: R,
      _currentValue: t,
      _currentValue2: t,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, t.Provider = t, t.Consumer = {
      $$typeof: E,
      _context: t
    }, t;
  }, n.createElement = function(t, e, u) {
    var r, o = {}, s = null;
    if (e != null)
      for (r in e.key !== void 0 && (s = "" + e.key), e)
        U.call(e, r) && r !== "key" && r !== "__self" && r !== "__source" && (o[r] = e[r]);
    var f = arguments.length - 2;
    if (f === 1) o.children = u;
    else if (1 < f) {
      for (var v = Array(f), l = 0; l < f; l++)
        v[l] = arguments[l + 2];
      o.children = v;
    }
    if (t && t.defaultProps)
      for (r in f = t.defaultProps, f)
        o[r] === void 0 && (o[r] = f[r]);
    return w(t, s, o);
  }, n.createRef = function() {
    return { current: null };
  }, n.forwardRef = function(t) {
    return { $$typeof: x, render: t };
  }, n.isValidElement = P, n.lazy = function(t) {
    return {
      $$typeof: $,
      _payload: { _status: -1, _result: t },
      _init: rt
    };
  }, n.memo = function(t, e) {
    return {
      $$typeof: F,
      type: t,
      compare: e === void 0 ? null : e
    };
  }, n.startTransition = function(t) {
    var e = i.T, u = {};
    i.T = u;
    try {
      var r = t(), o = i.S;
      o !== null && o(u, r), typeof r == "object" && r !== null && typeof r.then == "function" && r.then(A, J);
    } catch (s) {
      J(s);
    } finally {
      e !== null && u.types !== null && (e.types = u.types), i.T = e;
    }
  }, n.unstable_useCacheRefresh = function() {
    return i.H.useCacheRefresh();
  }, n.use = function(t) {
    return i.H.use(t);
  }, n.useActionState = function(t, e, u) {
    return i.H.useActionState(t, e, u);
  }, n.useCallback = function(t, e) {
    return i.H.useCallback(t, e);
  }, n.useContext = function(t) {
    return i.H.useContext(t);
  }, n.useDebugValue = function() {
  }, n.useDeferredValue = function(t, e) {
    return i.H.useDeferredValue(t, e);
  }, n.useEffect = function(t, e) {
    return i.H.useEffect(t, e);
  }, n.useEffectEvent = function(t) {
    return i.H.useEffectEvent(t);
  }, n.useId = function() {
    return i.H.useId();
  }, n.useImperativeHandle = function(t, e, u) {
    return i.H.useImperativeHandle(t, e, u);
  }, n.useInsertionEffect = function(t, e) {
    return i.H.useInsertionEffect(t, e);
  }, n.useLayoutEffect = function(t, e) {
    return i.H.useLayoutEffect(t, e);
  }, n.useMemo = function(t, e) {
    return i.H.useMemo(t, e);
  }, n.useOptimistic = function(t, e) {
    return i.H.useOptimistic(t, e);
  }, n.useReducer = function(t, e, u) {
    return i.H.useReducer(t, e, u);
  }, n.useRef = function(t) {
    return i.H.useRef(t);
  }, n.useState = function(t) {
    return i.H.useState(t);
  }, n.useSyncExternalStore = function(t, e, u) {
    return i.H.useSyncExternalStore(
      t,
      e,
      u
    );
  }, n.useTransition = function() {
    return i.H.useTransition();
  }, n.version = "19.2.0", n;
}
var Q;
function at() {
  return Q || (Q = 1, N.exports = ct()), N.exports;
}
var X = at();
const W = /* @__PURE__ */ st(X);
console.log("input", H);
function pt() {
  const [a, y] = W.useState(""), [d, h] = W.useState(null);
  return X.useEffect(() => {
    const c = H.subscribe((E) => {
      console.log("input value", E), y(E.raw);
    }), _ = H.onSubmit(({ raw: E, alias: R, query: x }) => {
      console.log("🎯 Submit handler called!", { raw: E, alias: R, query: x }), h({ raw: E, alias: R, query: x });
    });
    return () => {
      c(), _();
    };
  }, []), /* @__PURE__ */ p.jsxs("div", { className: "bg-gray-800/50 p-6 rounded-lg border border-gray-700 animate-fade-in", children: [
    /* @__PURE__ */ p.jsx("h1", { className: "text-2xl font-bold text-white", children: "deno is dopey" }),
    /* @__PURE__ */ p.jsx(
      "input",
      {
        type: "text",
        value: a,
        onChange: (c) => y(c.target.value)
      }
    ),
    /* @__PURE__ */ p.jsxs("div", { children: [
      "react state value: ",
      a
    ] }),
    d && /* @__PURE__ */ p.jsxs("div", { className: "mt-4 p-4 bg-green-900/50 border border-green-700 rounded", children: [
      /* @__PURE__ */ p.jsx("h2", { className: "text-lg font-semibold text-green-300", children: "Last Submit:" }),
      /* @__PURE__ */ p.jsxs("div", { className: "text-white space-y-1 mt-2", children: [
        /* @__PURE__ */ p.jsxs("div", { children: [
          /* @__PURE__ */ p.jsx("span", { className: "font-bold", children: "Raw:" }),
          " ",
          d.raw
        ] }),
        /* @__PURE__ */ p.jsxs("div", { children: [
          /* @__PURE__ */ p.jsx("span", { className: "font-bold", children: "Alias:" }),
          " ",
          d.alias
        ] }),
        /* @__PURE__ */ p.jsxs("div", { children: [
          /* @__PURE__ */ p.jsx("span", { className: "font-bold", children: "Query:" }),
          " ",
          d.query
        ] })
      ] })
    ] })
  ] });
}
export {
  pt as default
};
