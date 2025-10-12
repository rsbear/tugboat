function _1(R) {
  return R && R.__esModule && Object.prototype.hasOwnProperty.call(R, "default") ? R.default : R;
}
var ni = { exports: {} }, be = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var h1;
function wd() {
  if (h1) return be;
  h1 = 1;
  var R = Symbol.for("react.transitional.element"), C = Symbol.for("react.fragment");
  function k(nl, o, Nl) {
    var ol = null;
    if (Nl !== void 0 && (ol = "" + Nl), o.key !== void 0 && (ol = "" + o.key), "key" in o) {
      Nl = {};
      for (var pl in o)
        pl !== "key" && (Nl[pl] = o[pl]);
    } else Nl = o;
    return o = Nl.ref, {
      $$typeof: R,
      type: nl,
      key: ol,
      ref: o !== void 0 ? o : null,
      props: Nl
    };
  }
  return be.Fragment = C, be.jsx = k, be.jsxs = k, be;
}
var s1;
function Wd() {
  return s1 || (s1 = 1, ni.exports = wd()), ni.exports;
}
var Te = Wd(), fi = { exports: {} }, Y = {}, S1;
function $d() {
  if (S1) return Y;
  S1 = 1;
  var R = {};
  /**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var C = Symbol.for("react.transitional.element"), k = Symbol.for("react.portal"), nl = Symbol.for("react.fragment"), o = Symbol.for("react.strict_mode"), Nl = Symbol.for("react.profiler"), ol = Symbol.for("react.consumer"), pl = Symbol.for("react.context"), N = Symbol.for("react.forward_ref"), E = Symbol.for("react.suspense"), ll = Symbol.for("react.memo"), fl = Symbol.for("react.lazy"), q = Symbol.for("react.activity"), gt = Symbol.iterator;
  function ft(v) {
    return v === null || typeof v != "object" ? null : (v = gt && v[gt] || v["@@iterator"], typeof v == "function" ? v : null);
  }
  var Bl = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, Ll = Object.assign, wt = {};
  function Kl(v, T, _) {
    this.props = v, this.context = T, this.refs = wt, this.updater = _ || Bl;
  }
  Kl.prototype.isReactComponent = {}, Kl.prototype.setState = function(v, T) {
    if (typeof v != "object" && typeof v != "function" && v != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, v, T, "setState");
  }, Kl.prototype.forceUpdate = function(v) {
    this.updater.enqueueForceUpdate(this, v, "forceUpdate");
  };
  function Wt() {
  }
  Wt.prototype = Kl.prototype;
  function Al(v, T, _) {
    this.props = v, this.context = T, this.refs = wt, this.updater = _ || Bl;
  }
  var bt = Al.prototype = new Wt();
  bt.constructor = Al, Ll(bt, Kl.prototype), bt.isPureReactComponent = !0;
  var Jl = Array.isArray;
  function wl() {
  }
  var K = { H: null, A: null, T: null, S: null }, Cl = Object.prototype.hasOwnProperty;
  function _t(v, T, _) {
    var r = _.ref;
    return {
      $$typeof: C,
      type: v,
      key: T,
      ref: r !== void 0 ? r : null,
      props: _
    };
  }
  function Tu(v, T) {
    return _t(v.type, T, v.props);
  }
  function Wl(v) {
    return typeof v == "object" && v !== null && v.$$typeof === C;
  }
  function Ot(v) {
    var T = { "=": "=0", ":": "=2" };
    return "$" + v.replace(/[=:]/g, function(_) {
      return T[_];
    });
  }
  var ju = /\/+/g;
  function zt(v, T) {
    return typeof v == "object" && v !== null && v.key != null ? Ot("" + v.key) : T.toString(36);
  }
  function M(v) {
    switch (v.status) {
      case "fulfilled":
        return v.value;
      case "rejected":
        throw v.reason;
      default:
        switch (typeof v.status == "string" ? v.then(wl, wl) : (v.status = "pending", v.then(
          function(T) {
            v.status === "pending" && (v.status = "fulfilled", v.value = T);
          },
          function(T) {
            v.status === "pending" && (v.status = "rejected", v.reason = T);
          }
        )), v.status) {
          case "fulfilled":
            return v.value;
          case "rejected":
            throw v.reason;
        }
    }
    throw v;
  }
  function A(v, T, _, r, X) {
    var Q = typeof v;
    (Q === "undefined" || Q === "boolean") && (v = null);
    var F = !1;
    if (v === null) F = !0;
    else
      switch (Q) {
        case "bigint":
        case "string":
        case "number":
          F = !0;
          break;
        case "object":
          switch (v.$$typeof) {
            case C:
            case k:
              F = !0;
              break;
            case fl:
              return F = v._init, A(
                F(v._payload),
                T,
                _,
                r,
                X
              );
          }
      }
    if (F)
      return X = X(v), F = r === "" ? "." + zt(v, 0) : r, Jl(X) ? (_ = "", F != null && (_ = F.replace(ju, "$&/") + "/"), A(X, T, _, "", function(Ma) {
        return Ma;
      })) : X != null && (Wl(X) && (X = Tu(
        X,
        _ + (X.key == null || v && v.key === X.key ? "" : ("" + X.key).replace(
          ju,
          "$&/"
        ) + "/") + F
      )), T.push(X)), 1;
    F = 0;
    var ql = r === "" ? "." : r + ":";
    if (Jl(v))
      for (var hl = 0; hl < v.length; hl++)
        r = v[hl], Q = ql + zt(r, hl), F += A(
          r,
          T,
          _,
          Q,
          X
        );
    else if (hl = ft(v), typeof hl == "function")
      for (v = hl.call(v), hl = 0; !(r = v.next()).done; )
        r = r.value, Q = ql + zt(r, hl++), F += A(
          r,
          T,
          _,
          Q,
          X
        );
    else if (Q === "object") {
      if (typeof v.then == "function")
        return A(
          M(v),
          T,
          _,
          r,
          X
        );
      throw T = String(v), Error(
        "Objects are not valid as a React child (found: " + (T === "[object Object]" ? "object with keys {" + Object.keys(v).join(", ") + "}" : T) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return F;
  }
  function O(v, T, _) {
    if (v == null) return v;
    var r = [], X = 0;
    return A(v, r, "", "", function(Q) {
      return T.call(_, Q, X++);
    }), r;
  }
  function W(v) {
    if (v._status === -1) {
      var T = v._result;
      T = T(), T.then(
        function(_) {
          (v._status === 0 || v._status === -1) && (v._status = 1, v._result = _);
        },
        function(_) {
          (v._status === 0 || v._status === -1) && (v._status = 2, v._result = _);
        }
      ), v._status === -1 && (v._status = 0, v._result = T);
    }
    if (v._status === 1) return v._result.default;
    throw v._result;
  }
  var cl = typeof reportError == "function" ? reportError : function(v) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var T = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof v == "object" && v !== null && typeof v.message == "string" ? String(v.message) : String(v),
        error: v
      });
      if (!window.dispatchEvent(T)) return;
    } else if (typeof R == "object" && typeof R.emit == "function") {
      R.emit("uncaughtException", v);
      return;
    }
    console.error(v);
  }, $l = {
    map: O,
    forEach: function(v, T, _) {
      O(
        v,
        function() {
          T.apply(this, arguments);
        },
        _
      );
    },
    count: function(v) {
      var T = 0;
      return O(v, function() {
        T++;
      }), T;
    },
    toArray: function(v) {
      return O(v, function(T) {
        return T;
      }) || [];
    },
    only: function(v) {
      if (!Wl(v))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return v;
    }
  };
  return Y.Activity = q, Y.Children = $l, Y.Component = Kl, Y.Fragment = nl, Y.Profiler = Nl, Y.PureComponent = Al, Y.StrictMode = o, Y.Suspense = E, Y.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = K, Y.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(v) {
      return K.H.useMemoCache(v);
    }
  }, Y.cache = function(v) {
    return function() {
      return v.apply(null, arguments);
    };
  }, Y.cacheSignal = function() {
    return null;
  }, Y.cloneElement = function(v, T, _) {
    if (v == null)
      throw Error(
        "The argument must be a React element, but you passed " + v + "."
      );
    var r = Ll({}, v.props), X = v.key;
    if (T != null)
      for (Q in T.key !== void 0 && (X = "" + T.key), T)
        !Cl.call(T, Q) || Q === "key" || Q === "__self" || Q === "__source" || Q === "ref" && T.ref === void 0 || (r[Q] = T[Q]);
    var Q = arguments.length - 2;
    if (Q === 1) r.children = _;
    else if (1 < Q) {
      for (var F = Array(Q), ql = 0; ql < Q; ql++)
        F[ql] = arguments[ql + 2];
      r.children = F;
    }
    return _t(v.type, X, r);
  }, Y.createContext = function(v) {
    return v = {
      $$typeof: pl,
      _currentValue: v,
      _currentValue2: v,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, v.Provider = v, v.Consumer = {
      $$typeof: ol,
      _context: v
    }, v;
  }, Y.createElement = function(v, T, _) {
    var r, X = {}, Q = null;
    if (T != null)
      for (r in T.key !== void 0 && (Q = "" + T.key), T)
        Cl.call(T, r) && r !== "key" && r !== "__self" && r !== "__source" && (X[r] = T[r]);
    var F = arguments.length - 2;
    if (F === 1) X.children = _;
    else if (1 < F) {
      for (var ql = Array(F), hl = 0; hl < F; hl++)
        ql[hl] = arguments[hl + 2];
      X.children = ql;
    }
    if (v && v.defaultProps)
      for (r in F = v.defaultProps, F)
        X[r] === void 0 && (X[r] = F[r]);
    return _t(v, Q, X);
  }, Y.createRef = function() {
    return { current: null };
  }, Y.forwardRef = function(v) {
    return { $$typeof: N, render: v };
  }, Y.isValidElement = Wl, Y.lazy = function(v) {
    return {
      $$typeof: fl,
      _payload: { _status: -1, _result: v },
      _init: W
    };
  }, Y.memo = function(v, T) {
    return {
      $$typeof: ll,
      type: v,
      compare: T === void 0 ? null : T
    };
  }, Y.startTransition = function(v) {
    var T = K.T, _ = {};
    K.T = _;
    try {
      var r = v(), X = K.S;
      X !== null && X(_, r), typeof r == "object" && r !== null && typeof r.then == "function" && r.then(wl, cl);
    } catch (Q) {
      cl(Q);
    } finally {
      T !== null && _.types !== null && (T.types = _.types), K.T = T;
    }
  }, Y.unstable_useCacheRefresh = function() {
    return K.H.useCacheRefresh();
  }, Y.use = function(v) {
    return K.H.use(v);
  }, Y.useActionState = function(v, T, _) {
    return K.H.useActionState(v, T, _);
  }, Y.useCallback = function(v, T) {
    return K.H.useCallback(v, T);
  }, Y.useContext = function(v) {
    return K.H.useContext(v);
  }, Y.useDebugValue = function() {
  }, Y.useDeferredValue = function(v, T) {
    return K.H.useDeferredValue(v, T);
  }, Y.useEffect = function(v, T) {
    return K.H.useEffect(v, T);
  }, Y.useEffectEvent = function(v) {
    return K.H.useEffectEvent(v);
  }, Y.useId = function() {
    return K.H.useId();
  }, Y.useImperativeHandle = function(v, T, _) {
    return K.H.useImperativeHandle(v, T, _);
  }, Y.useInsertionEffect = function(v, T) {
    return K.H.useInsertionEffect(v, T);
  }, Y.useLayoutEffect = function(v, T) {
    return K.H.useLayoutEffect(v, T);
  }, Y.useMemo = function(v, T) {
    return K.H.useMemo(v, T);
  }, Y.useOptimistic = function(v, T) {
    return K.H.useOptimistic(v, T);
  }, Y.useReducer = function(v, T, _) {
    return K.H.useReducer(v, T, _);
  }, Y.useRef = function(v) {
    return K.H.useRef(v);
  }, Y.useState = function(v) {
    return K.H.useState(v);
  }, Y.useSyncExternalStore = function(v, T, _) {
    return K.H.useSyncExternalStore(
      v,
      T,
      _
    );
  }, Y.useTransition = function() {
    return K.H.useTransition();
  }, Y.version = "19.2.0", Y;
}
var o1;
function mi() {
  return o1 || (o1 = 1, fi.exports = $d()), fi.exports;
}
var Fd = mi();
const kd = /* @__PURE__ */ _1(Fd);
var ci = { exports: {} }, ze = {}, ii = { exports: {} }, yi = {};
/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var g1;
function Id() {
  return g1 || (g1 = 1, (function(R) {
    function C(M, A) {
      var O = M.length;
      M.push(A);
      l: for (; 0 < O; ) {
        var W = O - 1 >>> 1, cl = M[W];
        if (0 < o(cl, A))
          M[W] = A, M[O] = cl, O = W;
        else break l;
      }
    }
    function k(M) {
      return M.length === 0 ? null : M[0];
    }
    function nl(M) {
      if (M.length === 0) return null;
      var A = M[0], O = M.pop();
      if (O !== A) {
        M[0] = O;
        l: for (var W = 0, cl = M.length, $l = cl >>> 1; W < $l; ) {
          var v = 2 * (W + 1) - 1, T = M[v], _ = v + 1, r = M[_];
          if (0 > o(T, O))
            _ < cl && 0 > o(r, T) ? (M[W] = r, M[_] = O, W = _) : (M[W] = T, M[v] = O, W = v);
          else if (_ < cl && 0 > o(r, O))
            M[W] = r, M[_] = O, W = _;
          else break l;
        }
      }
      return A;
    }
    function o(M, A) {
      var O = M.sortIndex - A.sortIndex;
      return O !== 0 ? O : M.id - A.id;
    }
    if (R.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
      var Nl = performance;
      R.unstable_now = function() {
        return Nl.now();
      };
    } else {
      var ol = Date, pl = ol.now();
      R.unstable_now = function() {
        return ol.now() - pl;
      };
    }
    var N = [], E = [], ll = 1, fl = null, q = 3, gt = !1, ft = !1, Bl = !1, Ll = !1, wt = typeof setTimeout == "function" ? setTimeout : null, Kl = typeof clearTimeout == "function" ? clearTimeout : null, Wt = typeof setImmediate < "u" ? setImmediate : null;
    function Al(M) {
      for (var A = k(E); A !== null; ) {
        if (A.callback === null) nl(E);
        else if (A.startTime <= M)
          nl(E), A.sortIndex = A.expirationTime, C(N, A);
        else break;
        A = k(E);
      }
    }
    function bt(M) {
      if (Bl = !1, Al(M), !ft)
        if (k(N) !== null)
          ft = !0, Jl || (Jl = !0, Wl());
        else {
          var A = k(E);
          A !== null && zt(bt, A.startTime - M);
        }
    }
    var Jl = !1, wl = -1, K = 5, Cl = -1;
    function _t() {
      return Ll ? !0 : !(R.unstable_now() - Cl < K);
    }
    function Tu() {
      if (Ll = !1, Jl) {
        var M = R.unstable_now();
        Cl = M;
        var A = !0;
        try {
          l: {
            ft = !1, Bl && (Bl = !1, Kl(wl), wl = -1), gt = !0;
            var O = q;
            try {
              t: {
                for (Al(M), fl = k(N); fl !== null && !(fl.expirationTime > M && _t()); ) {
                  var W = fl.callback;
                  if (typeof W == "function") {
                    fl.callback = null, q = fl.priorityLevel;
                    var cl = W(
                      fl.expirationTime <= M
                    );
                    if (M = R.unstable_now(), typeof cl == "function") {
                      fl.callback = cl, Al(M), A = !0;
                      break t;
                    }
                    fl === k(N) && nl(N), Al(M);
                  } else nl(N);
                  fl = k(N);
                }
                if (fl !== null) A = !0;
                else {
                  var $l = k(E);
                  $l !== null && zt(
                    bt,
                    $l.startTime - M
                  ), A = !1;
                }
              }
              break l;
            } finally {
              fl = null, q = O, gt = !1;
            }
            A = void 0;
          }
        } finally {
          A ? Wl() : Jl = !1;
        }
      }
    }
    var Wl;
    if (typeof Wt == "function")
      Wl = function() {
        Wt(Tu);
      };
    else if (typeof MessageChannel < "u") {
      var Ot = new MessageChannel(), ju = Ot.port2;
      Ot.port1.onmessage = Tu, Wl = function() {
        ju.postMessage(null);
      };
    } else
      Wl = function() {
        wt(Tu, 0);
      };
    function zt(M, A) {
      wl = wt(function() {
        M(R.unstable_now());
      }, A);
    }
    R.unstable_IdlePriority = 5, R.unstable_ImmediatePriority = 1, R.unstable_LowPriority = 4, R.unstable_NormalPriority = 3, R.unstable_Profiling = null, R.unstable_UserBlockingPriority = 2, R.unstable_cancelCallback = function(M) {
      M.callback = null;
    }, R.unstable_forceFrameRate = function(M) {
      0 > M || 125 < M ? console.error(
        "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
      ) : K = 0 < M ? Math.floor(1e3 / M) : 5;
    }, R.unstable_getCurrentPriorityLevel = function() {
      return q;
    }, R.unstable_next = function(M) {
      switch (q) {
        case 1:
        case 2:
        case 3:
          var A = 3;
          break;
        default:
          A = q;
      }
      var O = q;
      q = A;
      try {
        return M();
      } finally {
        q = O;
      }
    }, R.unstable_requestPaint = function() {
      Ll = !0;
    }, R.unstable_runWithPriority = function(M, A) {
      switch (M) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          M = 3;
      }
      var O = q;
      q = M;
      try {
        return A();
      } finally {
        q = O;
      }
    }, R.unstable_scheduleCallback = function(M, A, O) {
      var W = R.unstable_now();
      switch (typeof O == "object" && O !== null ? (O = O.delay, O = typeof O == "number" && 0 < O ? W + O : W) : O = W, M) {
        case 1:
          var cl = -1;
          break;
        case 2:
          cl = 250;
          break;
        case 5:
          cl = 1073741823;
          break;
        case 4:
          cl = 1e4;
          break;
        default:
          cl = 5e3;
      }
      return cl = O + cl, M = {
        id: ll++,
        callback: A,
        priorityLevel: M,
        startTime: O,
        expirationTime: cl,
        sortIndex: -1
      }, O > W ? (M.sortIndex = O, C(E, M), k(N) === null && M === k(E) && (Bl ? (Kl(wl), wl = -1) : Bl = !0, zt(bt, O - W))) : (M.sortIndex = cl, C(N, M), ft || gt || (ft = !0, Jl || (Jl = !0, Wl()))), M;
    }, R.unstable_shouldYield = _t, R.unstable_wrapCallback = function(M) {
      var A = q;
      return function() {
        var O = q;
        q = A;
        try {
          return M.apply(this, arguments);
        } finally {
          q = O;
        }
      };
    };
  })(yi)), yi;
}
var b1;
function Pd() {
  return b1 || (b1 = 1, ii.exports = Id()), ii.exports;
}
var vi = { exports: {} }, Rl = {};
/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var z1;
function lh() {
  if (z1) return Rl;
  z1 = 1;
  var R = mi();
  function C(N) {
    var E = "https://react.dev/errors/" + N;
    if (1 < arguments.length) {
      E += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var ll = 2; ll < arguments.length; ll++)
        E += "&args[]=" + encodeURIComponent(arguments[ll]);
    }
    return "Minified React error #" + N + "; visit " + E + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function k() {
  }
  var nl = {
    d: {
      f: k,
      r: function() {
        throw Error(C(522));
      },
      D: k,
      C: k,
      L: k,
      m: k,
      X: k,
      S: k,
      M: k
    },
    p: 0,
    findDOMNode: null
  }, o = Symbol.for("react.portal");
  function Nl(N, E, ll) {
    var fl = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: o,
      key: fl == null ? null : "" + fl,
      children: N,
      containerInfo: E,
      implementation: ll
    };
  }
  var ol = R.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function pl(N, E) {
    if (N === "font") return "";
    if (typeof E == "string")
      return E === "use-credentials" ? E : "";
  }
  return Rl.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = nl, Rl.createPortal = function(N, E) {
    var ll = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!E || E.nodeType !== 1 && E.nodeType !== 9 && E.nodeType !== 11)
      throw Error(C(299));
    return Nl(N, E, null, ll);
  }, Rl.flushSync = function(N) {
    var E = ol.T, ll = nl.p;
    try {
      if (ol.T = null, nl.p = 2, N) return N();
    } finally {
      ol.T = E, nl.p = ll, nl.d.f();
    }
  }, Rl.preconnect = function(N, E) {
    typeof N == "string" && (E ? (E = E.crossOrigin, E = typeof E == "string" ? E === "use-credentials" ? E : "" : void 0) : E = null, nl.d.C(N, E));
  }, Rl.prefetchDNS = function(N) {
    typeof N == "string" && nl.d.D(N);
  }, Rl.preinit = function(N, E) {
    if (typeof N == "string" && E && typeof E.as == "string") {
      var ll = E.as, fl = pl(ll, E.crossOrigin), q = typeof E.integrity == "string" ? E.integrity : void 0, gt = typeof E.fetchPriority == "string" ? E.fetchPriority : void 0;
      ll === "style" ? nl.d.S(
        N,
        typeof E.precedence == "string" ? E.precedence : void 0,
        {
          crossOrigin: fl,
          integrity: q,
          fetchPriority: gt
        }
      ) : ll === "script" && nl.d.X(N, {
        crossOrigin: fl,
        integrity: q,
        fetchPriority: gt,
        nonce: typeof E.nonce == "string" ? E.nonce : void 0
      });
    }
  }, Rl.preinitModule = function(N, E) {
    if (typeof N == "string")
      if (typeof E == "object" && E !== null) {
        if (E.as == null || E.as === "script") {
          var ll = pl(
            E.as,
            E.crossOrigin
          );
          nl.d.M(N, {
            crossOrigin: ll,
            integrity: typeof E.integrity == "string" ? E.integrity : void 0,
            nonce: typeof E.nonce == "string" ? E.nonce : void 0
          });
        }
      } else E == null && nl.d.M(N);
  }, Rl.preload = function(N, E) {
    if (typeof N == "string" && typeof E == "object" && E !== null && typeof E.as == "string") {
      var ll = E.as, fl = pl(ll, E.crossOrigin);
      nl.d.L(N, ll, {
        crossOrigin: fl,
        integrity: typeof E.integrity == "string" ? E.integrity : void 0,
        nonce: typeof E.nonce == "string" ? E.nonce : void 0,
        type: typeof E.type == "string" ? E.type : void 0,
        fetchPriority: typeof E.fetchPriority == "string" ? E.fetchPriority : void 0,
        referrerPolicy: typeof E.referrerPolicy == "string" ? E.referrerPolicy : void 0,
        imageSrcSet: typeof E.imageSrcSet == "string" ? E.imageSrcSet : void 0,
        imageSizes: typeof E.imageSizes == "string" ? E.imageSizes : void 0,
        media: typeof E.media == "string" ? E.media : void 0
      });
    }
  }, Rl.preloadModule = function(N, E) {
    if (typeof N == "string")
      if (E) {
        var ll = pl(E.as, E.crossOrigin);
        nl.d.m(N, {
          as: typeof E.as == "string" && E.as !== "script" ? E.as : void 0,
          crossOrigin: ll,
          integrity: typeof E.integrity == "string" ? E.integrity : void 0
        });
      } else nl.d.m(N);
  }, Rl.requestFormReset = function(N) {
    nl.d.r(N);
  }, Rl.unstable_batchedUpdates = function(N, E) {
    return N(E);
  }, Rl.useFormState = function(N, E, ll) {
    return ol.H.useFormState(N, E, ll);
  }, Rl.useFormStatus = function() {
    return ol.H.useHostTransitionStatus();
  }, Rl.version = "19.2.0", Rl;
}
var T1;
function th() {
  if (T1) return vi.exports;
  T1 = 1;
  function R() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(R);
      } catch (C) {
        console.error(C);
      }
  }
  return R(), vi.exports = lh(), vi.exports;
}
var E1;
function uh() {
  if (E1) return ze;
  E1 = 1;
  var R = {};
  /**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var C = Pd(), k = mi(), nl = th();
  function o(l) {
    var t = "https://react.dev/errors/" + l;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var u = 2; u < arguments.length; u++)
        t += "&args[]=" + encodeURIComponent(arguments[u]);
    }
    return "Minified React error #" + l + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function Nl(l) {
    return !(!l || l.nodeType !== 1 && l.nodeType !== 9 && l.nodeType !== 11);
  }
  function ol(l) {
    var t = l, u = l;
    if (l.alternate) for (; t.return; ) t = t.return;
    else {
      l = t;
      do
        t = l, (t.flags & 4098) !== 0 && (u = t.return), l = t.return;
      while (l);
    }
    return t.tag === 3 ? u : null;
  }
  function pl(l) {
    if (l.tag === 13) {
      var t = l.memoizedState;
      if (t === null && (l = l.alternate, l !== null && (t = l.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function N(l) {
    if (l.tag === 31) {
      var t = l.memoizedState;
      if (t === null && (l = l.alternate, l !== null && (t = l.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function E(l) {
    if (ol(l) !== l)
      throw Error(o(188));
  }
  function ll(l) {
    var t = l.alternate;
    if (!t) {
      if (t = ol(l), t === null) throw Error(o(188));
      return t !== l ? null : l;
    }
    for (var u = l, a = t; ; ) {
      var e = u.return;
      if (e === null) break;
      var n = e.alternate;
      if (n === null) {
        if (a = e.return, a !== null) {
          u = a;
          continue;
        }
        break;
      }
      if (e.child === n.child) {
        for (n = e.child; n; ) {
          if (n === u) return E(e), l;
          if (n === a) return E(e), t;
          n = n.sibling;
        }
        throw Error(o(188));
      }
      if (u.return !== a.return) u = e, a = n;
      else {
        for (var f = !1, c = e.child; c; ) {
          if (c === u) {
            f = !0, u = e, a = n;
            break;
          }
          if (c === a) {
            f = !0, a = e, u = n;
            break;
          }
          c = c.sibling;
        }
        if (!f) {
          for (c = n.child; c; ) {
            if (c === u) {
              f = !0, u = n, a = e;
              break;
            }
            if (c === a) {
              f = !0, a = n, u = e;
              break;
            }
            c = c.sibling;
          }
          if (!f) throw Error(o(189));
        }
      }
      if (u.alternate !== a) throw Error(o(190));
    }
    if (u.tag !== 3) throw Error(o(188));
    return u.stateNode.current === u ? l : t;
  }
  function fl(l) {
    var t = l.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return l;
    for (l = l.child; l !== null; ) {
      if (t = fl(l), t !== null) return t;
      l = l.sibling;
    }
    return null;
  }
  var q = Object.assign, gt = Symbol.for("react.element"), ft = Symbol.for("react.transitional.element"), Bl = Symbol.for("react.portal"), Ll = Symbol.for("react.fragment"), wt = Symbol.for("react.strict_mode"), Kl = Symbol.for("react.profiler"), Wt = Symbol.for("react.consumer"), Al = Symbol.for("react.context"), bt = Symbol.for("react.forward_ref"), Jl = Symbol.for("react.suspense"), wl = Symbol.for("react.suspense_list"), K = Symbol.for("react.memo"), Cl = Symbol.for("react.lazy"), _t = Symbol.for("react.activity"), Tu = Symbol.for("react.memo_cache_sentinel"), Wl = Symbol.iterator;
  function Ot(l) {
    return l === null || typeof l != "object" ? null : (l = Wl && l[Wl] || l["@@iterator"], typeof l == "function" ? l : null);
  }
  var ju = Symbol.for("react.client.reference");
  function zt(l) {
    if (l == null) return null;
    if (typeof l == "function")
      return l.$$typeof === ju ? null : l.displayName || l.name || null;
    if (typeof l == "string") return l;
    switch (l) {
      case Ll:
        return "Fragment";
      case Kl:
        return "Profiler";
      case wt:
        return "StrictMode";
      case Jl:
        return "Suspense";
      case wl:
        return "SuspenseList";
      case _t:
        return "Activity";
    }
    if (typeof l == "object")
      switch (l.$$typeof) {
        case Bl:
          return "Portal";
        case Al:
          return l.displayName || "Context";
        case Wt:
          return (l._context.displayName || "Context") + ".Consumer";
        case bt:
          var t = l.render;
          return l = l.displayName, l || (l = t.displayName || t.name || "", l = l !== "" ? "ForwardRef(" + l + ")" : "ForwardRef"), l;
        case K:
          return t = l.displayName || null, t !== null ? t : zt(l.type) || "Memo";
        case Cl:
          t = l._payload, l = l._init;
          try {
            return zt(l(t));
          } catch {
          }
      }
    return null;
  }
  var M = Array.isArray, A = k.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, O = nl.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, W = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, cl = [], $l = -1;
  function v(l) {
    return { current: l };
  }
  function T(l) {
    0 > $l || (l.current = cl[$l], cl[$l] = null, $l--);
  }
  function _(l, t) {
    $l++, cl[$l] = l.current, l.current = t;
  }
  var r = v(null), X = v(null), Q = v(null), F = v(null);
  function ql(l, t) {
    switch (_(Q, t), _(X, l), _(r, null), t.nodeType) {
      case 9:
      case 11:
        l = (l = t.documentElement) && (l = l.namespaceURI) ? Cv(l) : 0;
        break;
      default:
        if (l = t.tagName, t = t.namespaceURI)
          t = Cv(t), l = Gv(t, l);
        else
          switch (l) {
            case "svg":
              l = 1;
              break;
            case "math":
              l = 2;
              break;
            default:
              l = 0;
          }
    }
    T(r), _(r, l);
  }
  function hl() {
    T(r), T(X), T(Q);
  }
  function Ma(l) {
    l.memoizedState !== null && _(F, l);
    var t = r.current, u = Gv(t, l.type);
    t !== u && (_(X, l), _(r, u));
  }
  function Ee(l) {
    X.current === l && (T(r), T(X)), F.current === l && (T(F), se._currentValue = W);
  }
  var jn, di;
  function Eu(l) {
    if (jn === void 0)
      try {
        throw Error();
      } catch (u) {
        var t = u.stack.trim().match(/\n( *(at )?)/);
        jn = t && t[1] || "", di = -1 < u.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < u.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
    return `
` + jn + l + di;
  }
  var Zn = !1;
  function Vn(l, t) {
    if (!l || Zn) return "";
    Zn = !0;
    var u = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = {
        DetermineComponentFrameRoot: function() {
          try {
            if (t) {
              var z = function() {
                throw Error();
              };
              if (Object.defineProperty(z.prototype, "props", {
                set: function() {
                  throw Error();
                }
              }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(z, []);
                } catch (S) {
                  var s = S;
                }
                Reflect.construct(l, [], z);
              } else {
                try {
                  z.call();
                } catch (S) {
                  s = S;
                }
                l.call(z.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (S) {
                s = S;
              }
              (z = l()) && typeof z.catch == "function" && z.catch(function() {
              });
            }
          } catch (S) {
            if (S && s && typeof S.stack == "string")
              return [S.stack, s.stack];
          }
          return [null, null];
        }
      };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var e = Object.getOwnPropertyDescriptor(
        a.DetermineComponentFrameRoot,
        "name"
      );
      e && e.configurable && Object.defineProperty(
        a.DetermineComponentFrameRoot,
        "name",
        { value: "DetermineComponentFrameRoot" }
      );
      var n = a.DetermineComponentFrameRoot(), f = n[0], c = n[1];
      if (f && c) {
        var i = f.split(`
`), h = c.split(`
`);
        for (e = a = 0; a < i.length && !i[a].includes("DetermineComponentFrameRoot"); )
          a++;
        for (; e < h.length && !h[e].includes(
          "DetermineComponentFrameRoot"
        ); )
          e++;
        if (a === i.length || e === h.length)
          for (a = i.length - 1, e = h.length - 1; 1 <= a && 0 <= e && i[a] !== h[e]; )
            e--;
        for (; 1 <= a && 0 <= e; a--, e--)
          if (i[a] !== h[e]) {
            if (a !== 1 || e !== 1)
              do
                if (a--, e--, 0 > e || i[a] !== h[e]) {
                  var g = `
` + i[a].replace(" at new ", " at ");
                  return l.displayName && g.includes("<anonymous>") && (g = g.replace("<anonymous>", l.displayName)), g;
                }
              while (1 <= a && 0 <= e);
            break;
          }
      }
    } finally {
      Zn = !1, Error.prepareStackTrace = u;
    }
    return (u = l ? l.displayName || l.name : "") ? Eu(u) : "";
  }
  function O1(l, t) {
    switch (l.tag) {
      case 26:
      case 27:
      case 5:
        return Eu(l.type);
      case 16:
        return Eu("Lazy");
      case 13:
        return l.child !== t && t !== null ? Eu("Suspense Fallback") : Eu("Suspense");
      case 19:
        return Eu("SuspenseList");
      case 0:
      case 15:
        return Vn(l.type, !1);
      case 11:
        return Vn(l.type.render, !1);
      case 1:
        return Vn(l.type, !0);
      case 31:
        return Eu("Activity");
      default:
        return "";
    }
  }
  function hi(l) {
    try {
      var t = "", u = null;
      do
        t += O1(l, u), u = l, l = l.return;
      while (l);
      return t;
    } catch (a) {
      return `
Error generating stack: ` + a.message + `
` + a.stack;
    }
  }
  var xn = Object.prototype.hasOwnProperty, Ln = C.unstable_scheduleCallback, Kn = C.unstable_cancelCallback, M1 = C.unstable_shouldYield, D1 = C.unstable_requestPaint, Fl = C.unstable_now, U1 = C.unstable_getCurrentPriorityLevel, si = C.unstable_ImmediatePriority, Si = C.unstable_UserBlockingPriority, Ae = C.unstable_NormalPriority, r1 = C.unstable_LowPriority, oi = C.unstable_IdlePriority, H1 = C.log, N1 = C.unstable_setDisableYieldValue, Da = null, kl = null;
  function $t(l) {
    if (typeof H1 == "function" && N1(l), kl && typeof kl.setStrictMode == "function")
      try {
        kl.setStrictMode(Da, l);
      } catch {
      }
  }
  var Il = Math.clz32 ? Math.clz32 : q1, R1 = Math.log, p1 = Math.LN2;
  function q1(l) {
    return l >>>= 0, l === 0 ? 32 : 31 - (R1(l) / p1 | 0) | 0;
  }
  var _e = 256, Oe = 262144, Me = 4194304;
  function Au(l) {
    var t = l & 42;
    if (t !== 0) return t;
    switch (l & -l) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
        return l & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return l & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return l & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return l;
    }
  }
  function De(l, t, u) {
    var a = l.pendingLanes;
    if (a === 0) return 0;
    var e = 0, n = l.suspendedLanes, f = l.pingedLanes;
    l = l.warmLanes;
    var c = a & 134217727;
    return c !== 0 ? (a = c & ~n, a !== 0 ? e = Au(a) : (f &= c, f !== 0 ? e = Au(f) : u || (u = c & ~l, u !== 0 && (e = Au(u))))) : (c = a & ~n, c !== 0 ? e = Au(c) : f !== 0 ? e = Au(f) : u || (u = a & ~l, u !== 0 && (e = Au(u)))), e === 0 ? 0 : t !== 0 && t !== e && (t & n) === 0 && (n = e & -e, u = t & -t, n >= u || n === 32 && (u & 4194048) !== 0) ? t : e;
  }
  function Ua(l, t) {
    return (l.pendingLanes & ~(l.suspendedLanes & ~l.pingedLanes) & t) === 0;
  }
  function Y1(l, t) {
    switch (l) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return t + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function gi() {
    var l = Me;
    return Me <<= 1, (Me & 62914560) === 0 && (Me = 4194304), l;
  }
  function Jn(l) {
    for (var t = [], u = 0; 31 > u; u++) t.push(l);
    return t;
  }
  function ra(l, t) {
    l.pendingLanes |= t, t !== 268435456 && (l.suspendedLanes = 0, l.pingedLanes = 0, l.warmLanes = 0);
  }
  function B1(l, t, u, a, e, n) {
    var f = l.pendingLanes;
    l.pendingLanes = u, l.suspendedLanes = 0, l.pingedLanes = 0, l.warmLanes = 0, l.expiredLanes &= u, l.entangledLanes &= u, l.errorRecoveryDisabledLanes &= u, l.shellSuspendCounter = 0;
    var c = l.entanglements, i = l.expirationTimes, h = l.hiddenUpdates;
    for (u = f & ~u; 0 < u; ) {
      var g = 31 - Il(u), z = 1 << g;
      c[g] = 0, i[g] = -1;
      var s = h[g];
      if (s !== null)
        for (h[g] = null, g = 0; g < s.length; g++) {
          var S = s[g];
          S !== null && (S.lane &= -536870913);
        }
      u &= ~z;
    }
    a !== 0 && bi(l, a, 0), n !== 0 && e === 0 && l.tag !== 0 && (l.suspendedLanes |= n & ~(f & ~t));
  }
  function bi(l, t, u) {
    l.pendingLanes |= t, l.suspendedLanes &= ~t;
    var a = 31 - Il(t);
    l.entangledLanes |= t, l.entanglements[a] = l.entanglements[a] | 1073741824 | u & 261930;
  }
  function zi(l, t) {
    var u = l.entangledLanes |= t;
    for (l = l.entanglements; u; ) {
      var a = 31 - Il(u), e = 1 << a;
      e & t | l[a] & t && (l[a] |= t), u &= ~e;
    }
  }
  function Ti(l, t) {
    var u = t & -t;
    return u = (u & 42) !== 0 ? 1 : wn(u), (u & (l.suspendedLanes | t)) !== 0 ? 0 : u;
  }
  function wn(l) {
    switch (l) {
      case 2:
        l = 1;
        break;
      case 8:
        l = 4;
        break;
      case 32:
        l = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        l = 128;
        break;
      case 268435456:
        l = 134217728;
        break;
      default:
        l = 0;
    }
    return l;
  }
  function Wn(l) {
    return l &= -l, 2 < l ? 8 < l ? (l & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function Ei() {
    var l = O.p;
    return l !== 0 ? l : (l = window.event, l === void 0 ? 32 : f1(l.type));
  }
  function Ai(l, t) {
    var u = O.p;
    try {
      return O.p = l, t();
    } finally {
      O.p = u;
    }
  }
  var Ft = Math.random().toString(36).slice(2), Ml = "__reactFiber$" + Ft, Gl = "__reactProps$" + Ft, Zu = "__reactContainer$" + Ft, $n = "__reactEvents$" + Ft, C1 = "__reactListeners$" + Ft, G1 = "__reactHandles$" + Ft, _i = "__reactResources$" + Ft, Ha = "__reactMarker$" + Ft;
  function Fn(l) {
    delete l[Ml], delete l[Gl], delete l[$n], delete l[C1], delete l[G1];
  }
  function Vu(l) {
    var t = l[Ml];
    if (t) return t;
    for (var u = l.parentNode; u; ) {
      if (t = u[Zu] || u[Ml]) {
        if (u = t.alternate, t.child !== null || u !== null && u.child !== null)
          for (l = Lv(l); l !== null; ) {
            if (u = l[Ml]) return u;
            l = Lv(l);
          }
        return t;
      }
      l = u, u = l.parentNode;
    }
    return null;
  }
  function xu(l) {
    if (l = l[Ml] || l[Zu]) {
      var t = l.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3)
        return l;
    }
    return null;
  }
  function Na(l) {
    var t = l.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return l.stateNode;
    throw Error(o(33));
  }
  function Lu(l) {
    var t = l[_i];
    return t || (t = l[_i] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), t;
  }
  function _l(l) {
    l[Ha] = !0;
  }
  var Oi = /* @__PURE__ */ new Set(), Mi = {};
  function _u(l, t) {
    Ku(l, t), Ku(l + "Capture", t);
  }
  function Ku(l, t) {
    for (Mi[l] = t, l = 0; l < t.length; l++)
      Oi.add(t[l]);
  }
  var X1 = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ), Di = {}, Ui = {};
  function Q1(l) {
    return xn.call(Ui, l) ? !0 : xn.call(Di, l) ? !1 : X1.test(l) ? Ui[l] = !0 : (Di[l] = !0, !1);
  }
  function Ue(l, t, u) {
    if (Q1(t))
      if (u === null) l.removeAttribute(t);
      else {
        switch (typeof u) {
          case "undefined":
          case "function":
          case "symbol":
            l.removeAttribute(t);
            return;
          case "boolean":
            var a = t.toLowerCase().slice(0, 5);
            if (a !== "data-" && a !== "aria-") {
              l.removeAttribute(t);
              return;
            }
        }
        l.setAttribute(t, "" + u);
      }
  }
  function re(l, t, u) {
    if (u === null) l.removeAttribute(t);
    else {
      switch (typeof u) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          l.removeAttribute(t);
          return;
      }
      l.setAttribute(t, "" + u);
    }
  }
  function Ht(l, t, u, a) {
    if (a === null) l.removeAttribute(u);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          l.removeAttribute(u);
          return;
      }
      l.setAttributeNS(t, u, "" + a);
    }
  }
  function ct(l) {
    switch (typeof l) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return l;
      case "object":
        return l;
      default:
        return "";
    }
  }
  function ri(l) {
    var t = l.type;
    return (l = l.nodeName) && l.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function j1(l, t, u) {
    var a = Object.getOwnPropertyDescriptor(
      l.constructor.prototype,
      t
    );
    if (!l.hasOwnProperty(t) && typeof a < "u" && typeof a.get == "function" && typeof a.set == "function") {
      var e = a.get, n = a.set;
      return Object.defineProperty(l, t, {
        configurable: !0,
        get: function() {
          return e.call(this);
        },
        set: function(f) {
          u = "" + f, n.call(this, f);
        }
      }), Object.defineProperty(l, t, {
        enumerable: a.enumerable
      }), {
        getValue: function() {
          return u;
        },
        setValue: function(f) {
          u = "" + f;
        },
        stopTracking: function() {
          l._valueTracker = null, delete l[t];
        }
      };
    }
  }
  function kn(l) {
    if (!l._valueTracker) {
      var t = ri(l) ? "checked" : "value";
      l._valueTracker = j1(
        l,
        t,
        "" + l[t]
      );
    }
  }
  function Hi(l) {
    if (!l) return !1;
    var t = l._valueTracker;
    if (!t) return !0;
    var u = t.getValue(), a = "";
    return l && (a = ri(l) ? l.checked ? "true" : "false" : l.value), l = a, l !== u ? (t.setValue(l), !0) : !1;
  }
  function He(l) {
    if (l = l || (typeof document < "u" ? document : void 0), typeof l > "u") return null;
    try {
      return l.activeElement || l.body;
    } catch {
      return l.body;
    }
  }
  var Z1 = /[\n"\\]/g;
  function it(l) {
    return l.replace(
      Z1,
      function(t) {
        return "\\" + t.charCodeAt(0).toString(16) + " ";
      }
    );
  }
  function In(l, t, u, a, e, n, f, c) {
    l.name = "", f != null && typeof f != "function" && typeof f != "symbol" && typeof f != "boolean" ? l.type = f : l.removeAttribute("type"), t != null ? f === "number" ? (t === 0 && l.value === "" || l.value != t) && (l.value = "" + ct(t)) : l.value !== "" + ct(t) && (l.value = "" + ct(t)) : f !== "submit" && f !== "reset" || l.removeAttribute("value"), t != null ? Pn(l, f, ct(t)) : u != null ? Pn(l, f, ct(u)) : a != null && l.removeAttribute("value"), e == null && n != null && (l.defaultChecked = !!n), e != null && (l.checked = e && typeof e != "function" && typeof e != "symbol"), c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? l.name = "" + ct(c) : l.removeAttribute("name");
  }
  function Ni(l, t, u, a, e, n, f, c) {
    if (n != null && typeof n != "function" && typeof n != "symbol" && typeof n != "boolean" && (l.type = n), t != null || u != null) {
      if (!(n !== "submit" && n !== "reset" || t != null)) {
        kn(l);
        return;
      }
      u = u != null ? "" + ct(u) : "", t = t != null ? "" + ct(t) : u, c || t === l.value || (l.value = t), l.defaultValue = t;
    }
    a = a ?? e, a = typeof a != "function" && typeof a != "symbol" && !!a, l.checked = c ? l.checked : !!a, l.defaultChecked = !!a, f != null && typeof f != "function" && typeof f != "symbol" && typeof f != "boolean" && (l.name = f), kn(l);
  }
  function Pn(l, t, u) {
    t === "number" && He(l.ownerDocument) === l || l.defaultValue === "" + u || (l.defaultValue = "" + u);
  }
  function Ju(l, t, u, a) {
    if (l = l.options, t) {
      t = {};
      for (var e = 0; e < u.length; e++)
        t["$" + u[e]] = !0;
      for (u = 0; u < l.length; u++)
        e = t.hasOwnProperty("$" + l[u].value), l[u].selected !== e && (l[u].selected = e), e && a && (l[u].defaultSelected = !0);
    } else {
      for (u = "" + ct(u), t = null, e = 0; e < l.length; e++) {
        if (l[e].value === u) {
          l[e].selected = !0, a && (l[e].defaultSelected = !0);
          return;
        }
        t !== null || l[e].disabled || (t = l[e]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function Ri(l, t, u) {
    if (t != null && (t = "" + ct(t), t !== l.value && (l.value = t), u == null)) {
      l.defaultValue !== t && (l.defaultValue = t);
      return;
    }
    l.defaultValue = u != null ? "" + ct(u) : "";
  }
  function pi(l, t, u, a) {
    if (t == null) {
      if (a != null) {
        if (u != null) throw Error(o(92));
        if (M(a)) {
          if (1 < a.length) throw Error(o(93));
          a = a[0];
        }
        u = a;
      }
      u == null && (u = ""), t = u;
    }
    u = ct(t), l.defaultValue = u, a = l.textContent, a === u && a !== "" && a !== null && (l.value = a), kn(l);
  }
  function wu(l, t) {
    if (t) {
      var u = l.firstChild;
      if (u && u === l.lastChild && u.nodeType === 3) {
        u.nodeValue = t;
        return;
      }
    }
    l.textContent = t;
  }
  var V1 = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  );
  function qi(l, t, u) {
    var a = t.indexOf("--") === 0;
    u == null || typeof u == "boolean" || u === "" ? a ? l.setProperty(t, "") : t === "float" ? l.cssFloat = "" : l[t] = "" : a ? l.setProperty(t, u) : typeof u != "number" || u === 0 || V1.has(t) ? t === "float" ? l.cssFloat = u : l[t] = ("" + u).trim() : l[t] = u + "px";
  }
  function Yi(l, t, u) {
    if (t != null && typeof t != "object")
      throw Error(o(62));
    if (l = l.style, u != null) {
      for (var a in u)
        !u.hasOwnProperty(a) || t != null && t.hasOwnProperty(a) || (a.indexOf("--") === 0 ? l.setProperty(a, "") : a === "float" ? l.cssFloat = "" : l[a] = "");
      for (var e in t)
        a = t[e], t.hasOwnProperty(e) && u[e] !== a && qi(l, e, a);
    } else
      for (var n in t)
        t.hasOwnProperty(n) && qi(l, n, t[n]);
  }
  function lf(l) {
    if (l.indexOf("-") === -1) return !1;
    switch (l) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var x1 = /* @__PURE__ */ new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]), L1 = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function Ne(l) {
    return L1.test("" + l) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : l;
  }
  function Nt() {
  }
  var tf = null;
  function uf(l) {
    return l = l.target || l.srcElement || window, l.correspondingUseElement && (l = l.correspondingUseElement), l.nodeType === 3 ? l.parentNode : l;
  }
  var Wu = null, $u = null;
  function Bi(l) {
    var t = xu(l);
    if (t && (l = t.stateNode)) {
      var u = l[Gl] || null;
      l: switch (l = t.stateNode, t.type) {
        case "input":
          if (In(
            l,
            u.value,
            u.defaultValue,
            u.defaultValue,
            u.checked,
            u.defaultChecked,
            u.type,
            u.name
          ), t = u.name, u.type === "radio" && t != null) {
            for (u = l; u.parentNode; ) u = u.parentNode;
            for (u = u.querySelectorAll(
              'input[name="' + it(
                "" + t
              ) + '"][type="radio"]'
            ), t = 0; t < u.length; t++) {
              var a = u[t];
              if (a !== l && a.form === l.form) {
                var e = a[Gl] || null;
                if (!e) throw Error(o(90));
                In(
                  a,
                  e.value,
                  e.defaultValue,
                  e.defaultValue,
                  e.checked,
                  e.defaultChecked,
                  e.type,
                  e.name
                );
              }
            }
            for (t = 0; t < u.length; t++)
              a = u[t], a.form === l.form && Hi(a);
          }
          break l;
        case "textarea":
          Ri(l, u.value, u.defaultValue);
          break l;
        case "select":
          t = u.value, t != null && Ju(l, !!u.multiple, t, !1);
      }
    }
  }
  var af = !1;
  function Ci(l, t, u) {
    if (af) return l(t, u);
    af = !0;
    try {
      var a = l(t);
      return a;
    } finally {
      if (af = !1, (Wu !== null || $u !== null) && (bn(), Wu && (t = Wu, l = $u, $u = Wu = null, Bi(t), l)))
        for (t = 0; t < l.length; t++) Bi(l[t]);
    }
  }
  function Ra(l, t) {
    var u = l.stateNode;
    if (u === null) return null;
    var a = u[Gl] || null;
    if (a === null) return null;
    u = a[t];
    l: switch (t) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (a = !a.disabled) || (l = l.type, a = !(l === "button" || l === "input" || l === "select" || l === "textarea")), l = !a;
        break l;
      default:
        l = !1;
    }
    if (l) return null;
    if (u && typeof u != "function")
      throw Error(
        o(231, t, typeof u)
      );
    return u;
  }
  var Rt = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), ef = !1;
  if (Rt)
    try {
      var pa = {};
      Object.defineProperty(pa, "passive", {
        get: function() {
          ef = !0;
        }
      }), window.addEventListener("test", pa, pa), window.removeEventListener("test", pa, pa);
    } catch {
      ef = !1;
    }
  var kt = null, nf = null, Re = null;
  function Gi() {
    if (Re) return Re;
    var l, t = nf, u = t.length, a, e = "value" in kt ? kt.value : kt.textContent, n = e.length;
    for (l = 0; l < u && t[l] === e[l]; l++) ;
    var f = u - l;
    for (a = 1; a <= f && t[u - a] === e[n - a]; a++) ;
    return Re = e.slice(l, 1 < a ? 1 - a : void 0);
  }
  function pe(l) {
    var t = l.keyCode;
    return "charCode" in l ? (l = l.charCode, l === 0 && t === 13 && (l = 13)) : l = t, l === 10 && (l = 13), 32 <= l || l === 13 ? l : 0;
  }
  function qe() {
    return !0;
  }
  function Xi() {
    return !1;
  }
  function Xl(l) {
    function t(u, a, e, n, f) {
      this._reactName = u, this._targetInst = e, this.type = a, this.nativeEvent = n, this.target = f, this.currentTarget = null;
      for (var c in l)
        l.hasOwnProperty(c) && (u = l[c], this[c] = u ? u(n) : n[c]);
      return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? qe : Xi, this.isPropagationStopped = Xi, this;
    }
    return q(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var u = this.nativeEvent;
        u && (u.preventDefault ? u.preventDefault() : typeof u.returnValue != "unknown" && (u.returnValue = !1), this.isDefaultPrevented = qe);
      },
      stopPropagation: function() {
        var u = this.nativeEvent;
        u && (u.stopPropagation ? u.stopPropagation() : typeof u.cancelBubble != "unknown" && (u.cancelBubble = !0), this.isPropagationStopped = qe);
      },
      persist: function() {
      },
      isPersistent: qe
    }), t;
  }
  var Ou = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(l) {
      return l.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, Ye = Xl(Ou), qa = q({}, Ou, { view: 0, detail: 0 }), K1 = Xl(qa), ff, cf, Ya, Be = q({}, qa, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: vf,
    button: 0,
    buttons: 0,
    relatedTarget: function(l) {
      return l.relatedTarget === void 0 ? l.fromElement === l.srcElement ? l.toElement : l.fromElement : l.relatedTarget;
    },
    movementX: function(l) {
      return "movementX" in l ? l.movementX : (l !== Ya && (Ya && l.type === "mousemove" ? (ff = l.screenX - Ya.screenX, cf = l.screenY - Ya.screenY) : cf = ff = 0, Ya = l), ff);
    },
    movementY: function(l) {
      return "movementY" in l ? l.movementY : cf;
    }
  }), Qi = Xl(Be), J1 = q({}, Be, { dataTransfer: 0 }), w1 = Xl(J1), W1 = q({}, qa, { relatedTarget: 0 }), yf = Xl(W1), $1 = q({}, Ou, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), F1 = Xl($1), k1 = q({}, Ou, {
    clipboardData: function(l) {
      return "clipboardData" in l ? l.clipboardData : window.clipboardData;
    }
  }), I1 = Xl(k1), P1 = q({}, Ou, { data: 0 }), ji = Xl(P1), lm = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, tm = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, um = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function am(l) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(l) : (l = um[l]) ? !!t[l] : !1;
  }
  function vf() {
    return am;
  }
  var em = q({}, qa, {
    key: function(l) {
      if (l.key) {
        var t = lm[l.key] || l.key;
        if (t !== "Unidentified") return t;
      }
      return l.type === "keypress" ? (l = pe(l), l === 13 ? "Enter" : String.fromCharCode(l)) : l.type === "keydown" || l.type === "keyup" ? tm[l.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: vf,
    charCode: function(l) {
      return l.type === "keypress" ? pe(l) : 0;
    },
    keyCode: function(l) {
      return l.type === "keydown" || l.type === "keyup" ? l.keyCode : 0;
    },
    which: function(l) {
      return l.type === "keypress" ? pe(l) : l.type === "keydown" || l.type === "keyup" ? l.keyCode : 0;
    }
  }), nm = Xl(em), fm = q({}, Be, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }), Zi = Xl(fm), cm = q({}, qa, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: vf
  }), im = Xl(cm), ym = q({}, Ou, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), vm = Xl(ym), mm = q({}, Be, {
    deltaX: function(l) {
      return "deltaX" in l ? l.deltaX : "wheelDeltaX" in l ? -l.wheelDeltaX : 0;
    },
    deltaY: function(l) {
      return "deltaY" in l ? l.deltaY : "wheelDeltaY" in l ? -l.wheelDeltaY : "wheelDelta" in l ? -l.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), dm = Xl(mm), hm = q({}, Ou, {
    newState: 0,
    oldState: 0
  }), sm = Xl(hm), Sm = [9, 13, 27, 32], mf = Rt && "CompositionEvent" in window, Ba = null;
  Rt && "documentMode" in document && (Ba = document.documentMode);
  var om = Rt && "TextEvent" in window && !Ba, Vi = Rt && (!mf || Ba && 8 < Ba && 11 >= Ba), xi = " ", Li = !1;
  function Ki(l, t) {
    switch (l) {
      case "keyup":
        return Sm.indexOf(t.keyCode) !== -1;
      case "keydown":
        return t.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function Ji(l) {
    return l = l.detail, typeof l == "object" && "data" in l ? l.data : null;
  }
  var Fu = !1;
  function gm(l, t) {
    switch (l) {
      case "compositionend":
        return Ji(t);
      case "keypress":
        return t.which !== 32 ? null : (Li = !0, xi);
      case "textInput":
        return l = t.data, l === xi && Li ? null : l;
      default:
        return null;
    }
  }
  function bm(l, t) {
    if (Fu)
      return l === "compositionend" || !mf && Ki(l, t) ? (l = Gi(), Re = nf = kt = null, Fu = !1, l) : null;
    switch (l) {
      case "paste":
        return null;
      case "keypress":
        if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
          if (t.char && 1 < t.char.length)
            return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case "compositionend":
        return Vi && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var zm = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0
  };
  function wi(l) {
    var t = l && l.nodeName && l.nodeName.toLowerCase();
    return t === "input" ? !!zm[l.type] : t === "textarea";
  }
  function Wi(l, t, u, a) {
    Wu ? $u ? $u.push(a) : $u = [a] : Wu = a, t = Mn(t, "onChange"), 0 < t.length && (u = new Ye(
      "onChange",
      "change",
      null,
      u,
      a
    ), l.push({ event: u, listeners: t }));
  }
  var Ca = null, Ga = null;
  function Tm(l) {
    Nv(l, 0);
  }
  function Ce(l) {
    var t = Na(l);
    if (Hi(t)) return l;
  }
  function $i(l, t) {
    if (l === "change") return t;
  }
  var Fi = !1;
  if (Rt) {
    var df;
    if (Rt) {
      var hf = "oninput" in document;
      if (!hf) {
        var ki = document.createElement("div");
        ki.setAttribute("oninput", "return;"), hf = typeof ki.oninput == "function";
      }
      df = hf;
    } else df = !1;
    Fi = df && (!document.documentMode || 9 < document.documentMode);
  }
  function Ii() {
    Ca && (Ca.detachEvent("onpropertychange", Pi), Ga = Ca = null);
  }
  function Pi(l) {
    if (l.propertyName === "value" && Ce(Ga)) {
      var t = [];
      Wi(
        t,
        Ga,
        l,
        uf(l)
      ), Ci(Tm, t);
    }
  }
  function Em(l, t, u) {
    l === "focusin" ? (Ii(), Ca = t, Ga = u, Ca.attachEvent("onpropertychange", Pi)) : l === "focusout" && Ii();
  }
  function Am(l) {
    if (l === "selectionchange" || l === "keyup" || l === "keydown")
      return Ce(Ga);
  }
  function _m(l, t) {
    if (l === "click") return Ce(t);
  }
  function Om(l, t) {
    if (l === "input" || l === "change")
      return Ce(t);
  }
  function Mm(l, t) {
    return l === t && (l !== 0 || 1 / l === 1 / t) || l !== l && t !== t;
  }
  var Pl = typeof Object.is == "function" ? Object.is : Mm;
  function Xa(l, t) {
    if (Pl(l, t)) return !0;
    if (typeof l != "object" || l === null || typeof t != "object" || t === null)
      return !1;
    var u = Object.keys(l), a = Object.keys(t);
    if (u.length !== a.length) return !1;
    for (a = 0; a < u.length; a++) {
      var e = u[a];
      if (!xn.call(t, e) || !Pl(l[e], t[e]))
        return !1;
    }
    return !0;
  }
  function l0(l) {
    for (; l && l.firstChild; ) l = l.firstChild;
    return l;
  }
  function t0(l, t) {
    var u = l0(l);
    l = 0;
    for (var a; u; ) {
      if (u.nodeType === 3) {
        if (a = l + u.textContent.length, l <= t && a >= t)
          return { node: u, offset: t - l };
        l = a;
      }
      l: {
        for (; u; ) {
          if (u.nextSibling) {
            u = u.nextSibling;
            break l;
          }
          u = u.parentNode;
        }
        u = void 0;
      }
      u = l0(u);
    }
  }
  function u0(l, t) {
    return l && t ? l === t ? !0 : l && l.nodeType === 3 ? !1 : t && t.nodeType === 3 ? u0(l, t.parentNode) : "contains" in l ? l.contains(t) : l.compareDocumentPosition ? !!(l.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function a0(l) {
    l = l != null && l.ownerDocument != null && l.ownerDocument.defaultView != null ? l.ownerDocument.defaultView : window;
    for (var t = He(l.document); t instanceof l.HTMLIFrameElement; ) {
      try {
        var u = typeof t.contentWindow.location.href == "string";
      } catch {
        u = !1;
      }
      if (u) l = t.contentWindow;
      else break;
      t = He(l.document);
    }
    return t;
  }
  function sf(l) {
    var t = l && l.nodeName && l.nodeName.toLowerCase();
    return t && (t === "input" && (l.type === "text" || l.type === "search" || l.type === "tel" || l.type === "url" || l.type === "password") || t === "textarea" || l.contentEditable === "true");
  }
  var Dm = Rt && "documentMode" in document && 11 >= document.documentMode, ku = null, Sf = null, Qa = null, of = !1;
  function e0(l, t, u) {
    var a = u.window === u ? u.document : u.nodeType === 9 ? u : u.ownerDocument;
    of || ku == null || ku !== He(a) || (a = ku, "selectionStart" in a && sf(a) ? a = { start: a.selectionStart, end: a.selectionEnd } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
      anchorNode: a.anchorNode,
      anchorOffset: a.anchorOffset,
      focusNode: a.focusNode,
      focusOffset: a.focusOffset
    }), Qa && Xa(Qa, a) || (Qa = a, a = Mn(Sf, "onSelect"), 0 < a.length && (t = new Ye(
      "onSelect",
      "select",
      null,
      t,
      u
    ), l.push({ event: t, listeners: a }), t.target = ku)));
  }
  function Mu(l, t) {
    var u = {};
    return u[l.toLowerCase()] = t.toLowerCase(), u["Webkit" + l] = "webkit" + t, u["Moz" + l] = "moz" + t, u;
  }
  var Iu = {
    animationend: Mu("Animation", "AnimationEnd"),
    animationiteration: Mu("Animation", "AnimationIteration"),
    animationstart: Mu("Animation", "AnimationStart"),
    transitionrun: Mu("Transition", "TransitionRun"),
    transitionstart: Mu("Transition", "TransitionStart"),
    transitioncancel: Mu("Transition", "TransitionCancel"),
    transitionend: Mu("Transition", "TransitionEnd")
  }, gf = {}, n0 = {};
  Rt && (n0 = document.createElement("div").style, "AnimationEvent" in window || (delete Iu.animationend.animation, delete Iu.animationiteration.animation, delete Iu.animationstart.animation), "TransitionEvent" in window || delete Iu.transitionend.transition);
  function Du(l) {
    if (gf[l]) return gf[l];
    if (!Iu[l]) return l;
    var t = Iu[l], u;
    for (u in t)
      if (t.hasOwnProperty(u) && u in n0)
        return gf[l] = t[u];
    return l;
  }
  var f0 = Du("animationend"), c0 = Du("animationiteration"), i0 = Du("animationstart"), Um = Du("transitionrun"), rm = Du("transitionstart"), Hm = Du("transitioncancel"), y0 = Du("transitionend"), v0 = /* @__PURE__ */ new Map(), bf = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
    " "
  );
  bf.push("scrollEnd");
  function Tt(l, t) {
    v0.set(l, t), _u(t, [l]);
  }
  var Ge = typeof reportError == "function" ? reportError : function(l) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var t = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof l == "object" && l !== null && typeof l.message == "string" ? String(l.message) : String(l),
        error: l
      });
      if (!window.dispatchEvent(t)) return;
    } else if (typeof R == "object" && typeof R.emit == "function") {
      R.emit("uncaughtException", l);
      return;
    }
    console.error(l);
  }, yt = [], Pu = 0, zf = 0;
  function Xe() {
    for (var l = Pu, t = zf = Pu = 0; t < l; ) {
      var u = yt[t];
      yt[t++] = null;
      var a = yt[t];
      yt[t++] = null;
      var e = yt[t];
      yt[t++] = null;
      var n = yt[t];
      if (yt[t++] = null, a !== null && e !== null) {
        var f = a.pending;
        f === null ? e.next = e : (e.next = f.next, f.next = e), a.pending = e;
      }
      n !== 0 && m0(u, e, n);
    }
  }
  function Qe(l, t, u, a) {
    yt[Pu++] = l, yt[Pu++] = t, yt[Pu++] = u, yt[Pu++] = a, zf |= a, l.lanes |= a, l = l.alternate, l !== null && (l.lanes |= a);
  }
  function Tf(l, t, u, a) {
    return Qe(l, t, u, a), je(l);
  }
  function Uu(l, t) {
    return Qe(l, null, null, t), je(l);
  }
  function m0(l, t, u) {
    l.lanes |= u;
    var a = l.alternate;
    a !== null && (a.lanes |= u);
    for (var e = !1, n = l.return; n !== null; )
      n.childLanes |= u, a = n.alternate, a !== null && (a.childLanes |= u), n.tag === 22 && (l = n.stateNode, l === null || l._visibility & 1 || (e = !0)), l = n, n = n.return;
    return l.tag === 3 ? (n = l.stateNode, e && t !== null && (e = 31 - Il(u), l = n.hiddenUpdates, a = l[e], a === null ? l[e] = [t] : a.push(t), t.lane = u | 536870912), n) : null;
  }
  function je(l) {
    if (50 < ce)
      throw ce = 0, Hc = null, Error(o(185));
    for (var t = l.return; t !== null; )
      l = t, t = l.return;
    return l.tag === 3 ? l.stateNode : null;
  }
  var la = {};
  function Nm(l, t, u, a) {
    this.tag = l, this.key = u, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function lt(l, t, u, a) {
    return new Nm(l, t, u, a);
  }
  function Ef(l) {
    return l = l.prototype, !(!l || !l.isReactComponent);
  }
  function pt(l, t) {
    var u = l.alternate;
    return u === null ? (u = lt(
      l.tag,
      t,
      l.key,
      l.mode
    ), u.elementType = l.elementType, u.type = l.type, u.stateNode = l.stateNode, u.alternate = l, l.alternate = u) : (u.pendingProps = t, u.type = l.type, u.flags = 0, u.subtreeFlags = 0, u.deletions = null), u.flags = l.flags & 65011712, u.childLanes = l.childLanes, u.lanes = l.lanes, u.child = l.child, u.memoizedProps = l.memoizedProps, u.memoizedState = l.memoizedState, u.updateQueue = l.updateQueue, t = l.dependencies, u.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, u.sibling = l.sibling, u.index = l.index, u.ref = l.ref, u.refCleanup = l.refCleanup, u;
  }
  function d0(l, t) {
    l.flags &= 65011714;
    var u = l.alternate;
    return u === null ? (l.childLanes = 0, l.lanes = t, l.child = null, l.subtreeFlags = 0, l.memoizedProps = null, l.memoizedState = null, l.updateQueue = null, l.dependencies = null, l.stateNode = null) : (l.childLanes = u.childLanes, l.lanes = u.lanes, l.child = u.child, l.subtreeFlags = 0, l.deletions = null, l.memoizedProps = u.memoizedProps, l.memoizedState = u.memoizedState, l.updateQueue = u.updateQueue, l.type = u.type, t = u.dependencies, l.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), l;
  }
  function Ze(l, t, u, a, e, n) {
    var f = 0;
    if (a = l, typeof l == "function") Ef(l) && (f = 1);
    else if (typeof l == "string")
      f = Bd(
        l,
        u,
        r.current
      ) ? 26 : l === "html" || l === "head" || l === "body" ? 27 : 5;
    else
      l: switch (l) {
        case _t:
          return l = lt(31, u, t, e), l.elementType = _t, l.lanes = n, l;
        case Ll:
          return ru(u.children, e, n, t);
        case wt:
          f = 8, e |= 24;
          break;
        case Kl:
          return l = lt(12, u, t, e | 2), l.elementType = Kl, l.lanes = n, l;
        case Jl:
          return l = lt(13, u, t, e), l.elementType = Jl, l.lanes = n, l;
        case wl:
          return l = lt(19, u, t, e), l.elementType = wl, l.lanes = n, l;
        default:
          if (typeof l == "object" && l !== null)
            switch (l.$$typeof) {
              case Al:
                f = 10;
                break l;
              case Wt:
                f = 9;
                break l;
              case bt:
                f = 11;
                break l;
              case K:
                f = 14;
                break l;
              case Cl:
                f = 16, a = null;
                break l;
            }
          f = 29, u = Error(
            o(130, l === null ? "null" : typeof l, "")
          ), a = null;
      }
    return t = lt(f, u, t, e), t.elementType = l, t.type = a, t.lanes = n, t;
  }
  function ru(l, t, u, a) {
    return l = lt(7, l, a, t), l.lanes = u, l;
  }
  function Af(l, t, u) {
    return l = lt(6, l, null, t), l.lanes = u, l;
  }
  function h0(l) {
    var t = lt(18, null, null, 0);
    return t.stateNode = l, t;
  }
  function _f(l, t, u) {
    return t = lt(
      4,
      l.children !== null ? l.children : [],
      l.key,
      t
    ), t.lanes = u, t.stateNode = {
      containerInfo: l.containerInfo,
      pendingChildren: null,
      implementation: l.implementation
    }, t;
  }
  var s0 = /* @__PURE__ */ new WeakMap();
  function vt(l, t) {
    if (typeof l == "object" && l !== null) {
      var u = s0.get(l);
      return u !== void 0 ? u : (t = {
        value: l,
        source: t,
        stack: hi(t)
      }, s0.set(l, t), t);
    }
    return {
      value: l,
      source: t,
      stack: hi(t)
    };
  }
  var ta = [], ua = 0, Ve = null, ja = 0, mt = [], dt = 0, It = null, Mt = 1, Dt = "";
  function qt(l, t) {
    ta[ua++] = ja, ta[ua++] = Ve, Ve = l, ja = t;
  }
  function S0(l, t, u) {
    mt[dt++] = Mt, mt[dt++] = Dt, mt[dt++] = It, It = l;
    var a = Mt;
    l = Dt;
    var e = 32 - Il(a) - 1;
    a &= ~(1 << e), u += 1;
    var n = 32 - Il(t) + e;
    if (30 < n) {
      var f = e - e % 5;
      n = (a & (1 << f) - 1).toString(32), a >>= f, e -= f, Mt = 1 << 32 - Il(t) + e | u << e | a, Dt = n + l;
    } else
      Mt = 1 << n | u << e | a, Dt = l;
  }
  function Of(l) {
    l.return !== null && (qt(l, 1), S0(l, 1, 0));
  }
  function Mf(l) {
    for (; l === Ve; )
      Ve = ta[--ua], ta[ua] = null, ja = ta[--ua], ta[ua] = null;
    for (; l === It; )
      It = mt[--dt], mt[dt] = null, Dt = mt[--dt], mt[dt] = null, Mt = mt[--dt], mt[dt] = null;
  }
  function o0(l, t) {
    mt[dt++] = Mt, mt[dt++] = Dt, mt[dt++] = It, Mt = t.id, Dt = t.overflow, It = l;
  }
  var Dl = null, il = null, L = !1, Pt = null, ht = !1, Df = Error(o(519));
  function lu(l) {
    var t = Error(
      o(
        418,
        1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
        ""
      )
    );
    throw Za(vt(t, l)), Df;
  }
  function g0(l) {
    var t = l.stateNode, u = l.type, a = l.memoizedProps;
    switch (t[Ml] = l, t[Gl] = a, u) {
      case "dialog":
        Z("cancel", t), Z("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        Z("load", t);
        break;
      case "video":
      case "audio":
        for (u = 0; u < ye.length; u++)
          Z(ye[u], t);
        break;
      case "source":
        Z("error", t);
        break;
      case "img":
      case "image":
      case "link":
        Z("error", t), Z("load", t);
        break;
      case "details":
        Z("toggle", t);
        break;
      case "input":
        Z("invalid", t), Ni(
          t,
          a.value,
          a.defaultValue,
          a.checked,
          a.defaultChecked,
          a.type,
          a.name,
          !0
        );
        break;
      case "select":
        Z("invalid", t);
        break;
      case "textarea":
        Z("invalid", t), pi(t, a.value, a.defaultValue, a.children);
    }
    u = a.children, typeof u != "string" && typeof u != "number" && typeof u != "bigint" || t.textContent === "" + u || a.suppressHydrationWarning === !0 || Yv(t.textContent, u) ? (a.popover != null && (Z("beforetoggle", t), Z("toggle", t)), a.onScroll != null && Z("scroll", t), a.onScrollEnd != null && Z("scrollend", t), a.onClick != null && (t.onclick = Nt), t = !0) : t = !1, t || lu(l, !0);
  }
  function b0(l) {
    for (Dl = l.return; Dl; )
      switch (Dl.tag) {
        case 5:
        case 31:
        case 13:
          ht = !1;
          return;
        case 27:
        case 3:
          ht = !0;
          return;
        default:
          Dl = Dl.return;
      }
  }
  function aa(l) {
    if (l !== Dl) return !1;
    if (!L) return b0(l), L = !0, !1;
    var t = l.tag, u;
    if ((u = t !== 3 && t !== 27) && ((u = t === 5) && (u = l.type, u = !(u !== "form" && u !== "button") || Lc(l.type, l.memoizedProps)), u = !u), u && il && lu(l), b0(l), t === 13) {
      if (l = l.memoizedState, l = l !== null ? l.dehydrated : null, !l) throw Error(o(317));
      il = xv(l);
    } else if (t === 31) {
      if (l = l.memoizedState, l = l !== null ? l.dehydrated : null, !l) throw Error(o(317));
      il = xv(l);
    } else
      t === 27 ? (t = il, su(l.type) ? (l = $c, $c = null, il = l) : il = t) : il = Dl ? St(l.stateNode.nextSibling) : null;
    return !0;
  }
  function Hu() {
    il = Dl = null, L = !1;
  }
  function Uf() {
    var l = Pt;
    return l !== null && (Vl === null ? Vl = l : Vl.push.apply(
      Vl,
      l
    ), Pt = null), l;
  }
  function Za(l) {
    Pt === null ? Pt = [l] : Pt.push(l);
  }
  var rf = v(null), Nu = null, Yt = null;
  function tu(l, t, u) {
    _(rf, t._currentValue), t._currentValue = u;
  }
  function Bt(l) {
    l._currentValue = rf.current, T(rf);
  }
  function Hf(l, t, u) {
    for (; l !== null; ) {
      var a = l.alternate;
      if ((l.childLanes & t) !== t ? (l.childLanes |= t, a !== null && (a.childLanes |= t)) : a !== null && (a.childLanes & t) !== t && (a.childLanes |= t), l === u) break;
      l = l.return;
    }
  }
  function Nf(l, t, u, a) {
    var e = l.child;
    for (e !== null && (e.return = l); e !== null; ) {
      var n = e.dependencies;
      if (n !== null) {
        var f = e.child;
        n = n.firstContext;
        l: for (; n !== null; ) {
          var c = n;
          n = e;
          for (var i = 0; i < t.length; i++)
            if (c.context === t[i]) {
              n.lanes |= u, c = n.alternate, c !== null && (c.lanes |= u), Hf(
                n.return,
                u,
                l
              ), a || (f = null);
              break l;
            }
          n = c.next;
        }
      } else if (e.tag === 18) {
        if (f = e.return, f === null) throw Error(o(341));
        f.lanes |= u, n = f.alternate, n !== null && (n.lanes |= u), Hf(f, u, l), f = null;
      } else f = e.child;
      if (f !== null) f.return = e;
      else
        for (f = e; f !== null; ) {
          if (f === l) {
            f = null;
            break;
          }
          if (e = f.sibling, e !== null) {
            e.return = f.return, f = e;
            break;
          }
          f = f.return;
        }
      e = f;
    }
  }
  function ea(l, t, u, a) {
    l = null;
    for (var e = t, n = !1; e !== null; ) {
      if (!n) {
        if ((e.flags & 524288) !== 0) n = !0;
        else if ((e.flags & 262144) !== 0) break;
      }
      if (e.tag === 10) {
        var f = e.alternate;
        if (f === null) throw Error(o(387));
        if (f = f.memoizedProps, f !== null) {
          var c = e.type;
          Pl(e.pendingProps.value, f.value) || (l !== null ? l.push(c) : l = [c]);
        }
      } else if (e === F.current) {
        if (f = e.alternate, f === null) throw Error(o(387));
        f.memoizedState.memoizedState !== e.memoizedState.memoizedState && (l !== null ? l.push(se) : l = [se]);
      }
      e = e.return;
    }
    l !== null && Nf(
      t,
      l,
      u,
      a
    ), t.flags |= 262144;
  }
  function xe(l) {
    for (l = l.firstContext; l !== null; ) {
      if (!Pl(
        l.context._currentValue,
        l.memoizedValue
      ))
        return !0;
      l = l.next;
    }
    return !1;
  }
  function Ru(l) {
    Nu = l, Yt = null, l = l.dependencies, l !== null && (l.firstContext = null);
  }
  function Ul(l) {
    return z0(Nu, l);
  }
  function Le(l, t) {
    return Nu === null && Ru(l), z0(l, t);
  }
  function z0(l, t) {
    var u = t._currentValue;
    if (t = { context: t, memoizedValue: u, next: null }, Yt === null) {
      if (l === null) throw Error(o(308));
      Yt = t, l.dependencies = { lanes: 0, firstContext: t }, l.flags |= 524288;
    } else Yt = Yt.next = t;
    return u;
  }
  var Rm = typeof AbortController < "u" ? AbortController : function() {
    var l = [], t = this.signal = {
      aborted: !1,
      addEventListener: function(u, a) {
        l.push(a);
      }
    };
    this.abort = function() {
      t.aborted = !0, l.forEach(function(u) {
        return u();
      });
    };
  }, pm = C.unstable_scheduleCallback, qm = C.unstable_NormalPriority, gl = {
    $$typeof: Al,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function Rf() {
    return {
      controller: new Rm(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function Va(l) {
    l.refCount--, l.refCount === 0 && pm(qm, function() {
      l.controller.abort();
    });
  }
  var xa = null, pf = 0, na = 0, fa = null;
  function Ym(l, t) {
    if (xa === null) {
      var u = xa = [];
      pf = 0, na = Bc(), fa = {
        status: "pending",
        value: void 0,
        then: function(a) {
          u.push(a);
        }
      };
    }
    return pf++, t.then(T0, T0), t;
  }
  function T0() {
    if (--pf === 0 && xa !== null) {
      fa !== null && (fa.status = "fulfilled");
      var l = xa;
      xa = null, na = 0, fa = null;
      for (var t = 0; t < l.length; t++) (0, l[t])();
    }
  }
  function Bm(l, t) {
    var u = [], a = {
      status: "pending",
      value: null,
      reason: null,
      then: function(e) {
        u.push(e);
      }
    };
    return l.then(
      function() {
        a.status = "fulfilled", a.value = t;
        for (var e = 0; e < u.length; e++) (0, u[e])(t);
      },
      function(e) {
        for (a.status = "rejected", a.reason = e, e = 0; e < u.length; e++)
          (0, u[e])(void 0);
      }
    ), a;
  }
  var E0 = A.S;
  A.S = function(l, t) {
    ev = Fl(), typeof t == "object" && t !== null && typeof t.then == "function" && Ym(l, t), E0 !== null && E0(l, t);
  };
  var pu = v(null);
  function qf() {
    var l = pu.current;
    return l !== null ? l : el.pooledCache;
  }
  function Ke(l, t) {
    t === null ? _(pu, pu.current) : _(pu, t.pool);
  }
  function A0() {
    var l = qf();
    return l === null ? null : { parent: gl._currentValue, pool: l };
  }
  var ca = Error(o(460)), Yf = Error(o(474)), Je = Error(o(542)), we = { then: function() {
  } };
  function _0(l) {
    return l = l.status, l === "fulfilled" || l === "rejected";
  }
  function O0(l, t, u) {
    switch (u = l[u], u === void 0 ? l.push(t) : u !== t && (t.then(Nt, Nt), t = u), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw l = t.reason, D0(l), l;
      default:
        if (typeof t.status == "string") t.then(Nt, Nt);
        else {
          if (l = el, l !== null && 100 < l.shellSuspendCounter)
            throw Error(o(482));
          l = t, l.status = "pending", l.then(
            function(a) {
              if (t.status === "pending") {
                var e = t;
                e.status = "fulfilled", e.value = a;
              }
            },
            function(a) {
              if (t.status === "pending") {
                var e = t;
                e.status = "rejected", e.reason = a;
              }
            }
          );
        }
        switch (t.status) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw l = t.reason, D0(l), l;
        }
        throw Yu = t, ca;
    }
  }
  function qu(l) {
    try {
      var t = l._init;
      return t(l._payload);
    } catch (u) {
      throw u !== null && typeof u == "object" && typeof u.then == "function" ? (Yu = u, ca) : u;
    }
  }
  var Yu = null;
  function M0() {
    if (Yu === null) throw Error(o(459));
    var l = Yu;
    return Yu = null, l;
  }
  function D0(l) {
    if (l === ca || l === Je)
      throw Error(o(483));
  }
  var ia = null, La = 0;
  function We(l) {
    var t = La;
    return La += 1, ia === null && (ia = []), O0(ia, l, t);
  }
  function Ka(l, t) {
    t = t.props.ref, l.ref = t !== void 0 ? t : null;
  }
  function $e(l, t) {
    throw t.$$typeof === gt ? Error(o(525)) : (l = Object.prototype.toString.call(t), Error(
      o(
        31,
        l === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : l
      )
    ));
  }
  function U0(l) {
    function t(m, y) {
      if (l) {
        var d = m.deletions;
        d === null ? (m.deletions = [y], m.flags |= 16) : d.push(y);
      }
    }
    function u(m, y) {
      if (!l) return null;
      for (; y !== null; )
        t(m, y), y = y.sibling;
      return null;
    }
    function a(m) {
      for (var y = /* @__PURE__ */ new Map(); m !== null; )
        m.key !== null ? y.set(m.key, m) : y.set(m.index, m), m = m.sibling;
      return y;
    }
    function e(m, y) {
      return m = pt(m, y), m.index = 0, m.sibling = null, m;
    }
    function n(m, y, d) {
      return m.index = d, l ? (d = m.alternate, d !== null ? (d = d.index, d < y ? (m.flags |= 67108866, y) : d) : (m.flags |= 67108866, y)) : (m.flags |= 1048576, y);
    }
    function f(m) {
      return l && m.alternate === null && (m.flags |= 67108866), m;
    }
    function c(m, y, d, b) {
      return y === null || y.tag !== 6 ? (y = Af(d, m.mode, b), y.return = m, y) : (y = e(y, d), y.return = m, y);
    }
    function i(m, y, d, b) {
      var H = d.type;
      return H === Ll ? g(
        m,
        y,
        d.props.children,
        b,
        d.key
      ) : y !== null && (y.elementType === H || typeof H == "object" && H !== null && H.$$typeof === Cl && qu(H) === y.type) ? (y = e(y, d.props), Ka(y, d), y.return = m, y) : (y = Ze(
        d.type,
        d.key,
        d.props,
        null,
        m.mode,
        b
      ), Ka(y, d), y.return = m, y);
    }
    function h(m, y, d, b) {
      return y === null || y.tag !== 4 || y.stateNode.containerInfo !== d.containerInfo || y.stateNode.implementation !== d.implementation ? (y = _f(d, m.mode, b), y.return = m, y) : (y = e(y, d.children || []), y.return = m, y);
    }
    function g(m, y, d, b, H) {
      return y === null || y.tag !== 7 ? (y = ru(
        d,
        m.mode,
        b,
        H
      ), y.return = m, y) : (y = e(y, d), y.return = m, y);
    }
    function z(m, y, d) {
      if (typeof y == "string" && y !== "" || typeof y == "number" || typeof y == "bigint")
        return y = Af(
          "" + y,
          m.mode,
          d
        ), y.return = m, y;
      if (typeof y == "object" && y !== null) {
        switch (y.$$typeof) {
          case ft:
            return d = Ze(
              y.type,
              y.key,
              y.props,
              null,
              m.mode,
              d
            ), Ka(d, y), d.return = m, d;
          case Bl:
            return y = _f(
              y,
              m.mode,
              d
            ), y.return = m, y;
          case Cl:
            return y = qu(y), z(m, y, d);
        }
        if (M(y) || Ot(y))
          return y = ru(
            y,
            m.mode,
            d,
            null
          ), y.return = m, y;
        if (typeof y.then == "function")
          return z(m, We(y), d);
        if (y.$$typeof === Al)
          return z(
            m,
            Le(m, y),
            d
          );
        $e(m, y);
      }
      return null;
    }
    function s(m, y, d, b) {
      var H = y !== null ? y.key : null;
      if (typeof d == "string" && d !== "" || typeof d == "number" || typeof d == "bigint")
        return H !== null ? null : c(m, y, "" + d, b);
      if (typeof d == "object" && d !== null) {
        switch (d.$$typeof) {
          case ft:
            return d.key === H ? i(m, y, d, b) : null;
          case Bl:
            return d.key === H ? h(m, y, d, b) : null;
          case Cl:
            return d = qu(d), s(m, y, d, b);
        }
        if (M(d) || Ot(d))
          return H !== null ? null : g(m, y, d, b, null);
        if (typeof d.then == "function")
          return s(
            m,
            y,
            We(d),
            b
          );
        if (d.$$typeof === Al)
          return s(
            m,
            y,
            Le(m, d),
            b
          );
        $e(m, d);
      }
      return null;
    }
    function S(m, y, d, b, H) {
      if (typeof b == "string" && b !== "" || typeof b == "number" || typeof b == "bigint")
        return m = m.get(d) || null, c(y, m, "" + b, H);
      if (typeof b == "object" && b !== null) {
        switch (b.$$typeof) {
          case ft:
            return m = m.get(
              b.key === null ? d : b.key
            ) || null, i(y, m, b, H);
          case Bl:
            return m = m.get(
              b.key === null ? d : b.key
            ) || null, h(y, m, b, H);
          case Cl:
            return b = qu(b), S(
              m,
              y,
              d,
              b,
              H
            );
        }
        if (M(b) || Ot(b))
          return m = m.get(d) || null, g(y, m, b, H, null);
        if (typeof b.then == "function")
          return S(
            m,
            y,
            d,
            We(b),
            H
          );
        if (b.$$typeof === Al)
          return S(
            m,
            y,
            d,
            Le(y, b),
            H
          );
        $e(y, b);
      }
      return null;
    }
    function D(m, y, d, b) {
      for (var H = null, J = null, U = y, G = y = 0, x = null; U !== null && G < d.length; G++) {
        U.index > G ? (x = U, U = null) : x = U.sibling;
        var w = s(
          m,
          U,
          d[G],
          b
        );
        if (w === null) {
          U === null && (U = x);
          break;
        }
        l && U && w.alternate === null && t(m, U), y = n(w, y, G), J === null ? H = w : J.sibling = w, J = w, U = x;
      }
      if (G === d.length)
        return u(m, U), L && qt(m, G), H;
      if (U === null) {
        for (; G < d.length; G++)
          U = z(m, d[G], b), U !== null && (y = n(
            U,
            y,
            G
          ), J === null ? H = U : J.sibling = U, J = U);
        return L && qt(m, G), H;
      }
      for (U = a(U); G < d.length; G++)
        x = S(
          U,
          m,
          G,
          d[G],
          b
        ), x !== null && (l && x.alternate !== null && U.delete(
          x.key === null ? G : x.key
        ), y = n(
          x,
          y,
          G
        ), J === null ? H = x : J.sibling = x, J = x);
      return l && U.forEach(function(zu) {
        return t(m, zu);
      }), L && qt(m, G), H;
    }
    function p(m, y, d, b) {
      if (d == null) throw Error(o(151));
      for (var H = null, J = null, U = y, G = y = 0, x = null, w = d.next(); U !== null && !w.done; G++, w = d.next()) {
        U.index > G ? (x = U, U = null) : x = U.sibling;
        var zu = s(m, U, w.value, b);
        if (zu === null) {
          U === null && (U = x);
          break;
        }
        l && U && zu.alternate === null && t(m, U), y = n(zu, y, G), J === null ? H = zu : J.sibling = zu, J = zu, U = x;
      }
      if (w.done)
        return u(m, U), L && qt(m, G), H;
      if (U === null) {
        for (; !w.done; G++, w = d.next())
          w = z(m, w.value, b), w !== null && (y = n(w, y, G), J === null ? H = w : J.sibling = w, J = w);
        return L && qt(m, G), H;
      }
      for (U = a(U); !w.done; G++, w = d.next())
        w = S(U, m, G, w.value, b), w !== null && (l && w.alternate !== null && U.delete(w.key === null ? G : w.key), y = n(w, y, G), J === null ? H = w : J.sibling = w, J = w);
      return l && U.forEach(function(Jd) {
        return t(m, Jd);
      }), L && qt(m, G), H;
    }
    function al(m, y, d, b) {
      if (typeof d == "object" && d !== null && d.type === Ll && d.key === null && (d = d.props.children), typeof d == "object" && d !== null) {
        switch (d.$$typeof) {
          case ft:
            l: {
              for (var H = d.key; y !== null; ) {
                if (y.key === H) {
                  if (H = d.type, H === Ll) {
                    if (y.tag === 7) {
                      u(
                        m,
                        y.sibling
                      ), b = e(
                        y,
                        d.props.children
                      ), b.return = m, m = b;
                      break l;
                    }
                  } else if (y.elementType === H || typeof H == "object" && H !== null && H.$$typeof === Cl && qu(H) === y.type) {
                    u(
                      m,
                      y.sibling
                    ), b = e(y, d.props), Ka(b, d), b.return = m, m = b;
                    break l;
                  }
                  u(m, y);
                  break;
                } else t(m, y);
                y = y.sibling;
              }
              d.type === Ll ? (b = ru(
                d.props.children,
                m.mode,
                b,
                d.key
              ), b.return = m, m = b) : (b = Ze(
                d.type,
                d.key,
                d.props,
                null,
                m.mode,
                b
              ), Ka(b, d), b.return = m, m = b);
            }
            return f(m);
          case Bl:
            l: {
              for (H = d.key; y !== null; ) {
                if (y.key === H)
                  if (y.tag === 4 && y.stateNode.containerInfo === d.containerInfo && y.stateNode.implementation === d.implementation) {
                    u(
                      m,
                      y.sibling
                    ), b = e(y, d.children || []), b.return = m, m = b;
                    break l;
                  } else {
                    u(m, y);
                    break;
                  }
                else t(m, y);
                y = y.sibling;
              }
              b = _f(d, m.mode, b), b.return = m, m = b;
            }
            return f(m);
          case Cl:
            return d = qu(d), al(
              m,
              y,
              d,
              b
            );
        }
        if (M(d))
          return D(
            m,
            y,
            d,
            b
          );
        if (Ot(d)) {
          if (H = Ot(d), typeof H != "function") throw Error(o(150));
          return d = H.call(d), p(
            m,
            y,
            d,
            b
          );
        }
        if (typeof d.then == "function")
          return al(
            m,
            y,
            We(d),
            b
          );
        if (d.$$typeof === Al)
          return al(
            m,
            y,
            Le(m, d),
            b
          );
        $e(m, d);
      }
      return typeof d == "string" && d !== "" || typeof d == "number" || typeof d == "bigint" ? (d = "" + d, y !== null && y.tag === 6 ? (u(m, y.sibling), b = e(y, d), b.return = m, m = b) : (u(m, y), b = Af(d, m.mode, b), b.return = m, m = b), f(m)) : u(m, y);
    }
    return function(m, y, d, b) {
      try {
        La = 0;
        var H = al(
          m,
          y,
          d,
          b
        );
        return ia = null, H;
      } catch (U) {
        if (U === ca || U === Je) throw U;
        var J = lt(29, U, null, m.mode);
        return J.lanes = b, J.return = m, J;
      } finally {
      }
    };
  }
  var Bu = U0(!0), r0 = U0(!1), uu = !1;
  function Bf(l) {
    l.updateQueue = {
      baseState: l.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null
    };
  }
  function Cf(l, t) {
    l = l.updateQueue, t.updateQueue === l && (t.updateQueue = {
      baseState: l.baseState,
      firstBaseUpdate: l.firstBaseUpdate,
      lastBaseUpdate: l.lastBaseUpdate,
      shared: l.shared,
      callbacks: null
    });
  }
  function au(l) {
    return { lane: l, tag: 0, payload: null, callback: null, next: null };
  }
  function eu(l, t, u) {
    var a = l.updateQueue;
    if (a === null) return null;
    if (a = a.shared, ($ & 2) !== 0) {
      var e = a.pending;
      return e === null ? t.next = t : (t.next = e.next, e.next = t), a.pending = t, t = je(l), m0(l, null, u), t;
    }
    return Qe(l, a, t, u), je(l);
  }
  function Ja(l, t, u) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (u & 4194048) !== 0)) {
      var a = t.lanes;
      a &= l.pendingLanes, u |= a, t.lanes = u, zi(l, u);
    }
  }
  function Gf(l, t) {
    var u = l.updateQueue, a = l.alternate;
    if (a !== null && (a = a.updateQueue, u === a)) {
      var e = null, n = null;
      if (u = u.firstBaseUpdate, u !== null) {
        do {
          var f = {
            lane: u.lane,
            tag: u.tag,
            payload: u.payload,
            callback: null,
            next: null
          };
          n === null ? e = n = f : n = n.next = f, u = u.next;
        } while (u !== null);
        n === null ? e = n = t : n = n.next = t;
      } else e = n = t;
      u = {
        baseState: a.baseState,
        firstBaseUpdate: e,
        lastBaseUpdate: n,
        shared: a.shared,
        callbacks: a.callbacks
      }, l.updateQueue = u;
      return;
    }
    l = u.lastBaseUpdate, l === null ? u.firstBaseUpdate = t : l.next = t, u.lastBaseUpdate = t;
  }
  var Xf = !1;
  function wa() {
    if (Xf) {
      var l = fa;
      if (l !== null) throw l;
    }
  }
  function Wa(l, t, u, a) {
    Xf = !1;
    var e = l.updateQueue;
    uu = !1;
    var n = e.firstBaseUpdate, f = e.lastBaseUpdate, c = e.shared.pending;
    if (c !== null) {
      e.shared.pending = null;
      var i = c, h = i.next;
      i.next = null, f === null ? n = h : f.next = h, f = i;
      var g = l.alternate;
      g !== null && (g = g.updateQueue, c = g.lastBaseUpdate, c !== f && (c === null ? g.firstBaseUpdate = h : c.next = h, g.lastBaseUpdate = i));
    }
    if (n !== null) {
      var z = e.baseState;
      f = 0, g = h = i = null, c = n;
      do {
        var s = c.lane & -536870913, S = s !== c.lane;
        if (S ? (V & s) === s : (a & s) === s) {
          s !== 0 && s === na && (Xf = !0), g !== null && (g = g.next = {
            lane: 0,
            tag: c.tag,
            payload: c.payload,
            callback: null,
            next: null
          });
          l: {
            var D = l, p = c;
            s = t;
            var al = u;
            switch (p.tag) {
              case 1:
                if (D = p.payload, typeof D == "function") {
                  z = D.call(al, z, s);
                  break l;
                }
                z = D;
                break l;
              case 3:
                D.flags = D.flags & -65537 | 128;
              case 0:
                if (D = p.payload, s = typeof D == "function" ? D.call(al, z, s) : D, s == null) break l;
                z = q({}, z, s);
                break l;
              case 2:
                uu = !0;
            }
          }
          s = c.callback, s !== null && (l.flags |= 64, S && (l.flags |= 8192), S = e.callbacks, S === null ? e.callbacks = [s] : S.push(s));
        } else
          S = {
            lane: s,
            tag: c.tag,
            payload: c.payload,
            callback: c.callback,
            next: null
          }, g === null ? (h = g = S, i = z) : g = g.next = S, f |= s;
        if (c = c.next, c === null) {
          if (c = e.shared.pending, c === null)
            break;
          S = c, c = S.next, S.next = null, e.lastBaseUpdate = S, e.shared.pending = null;
        }
      } while (!0);
      g === null && (i = z), e.baseState = i, e.firstBaseUpdate = h, e.lastBaseUpdate = g, n === null && (e.shared.lanes = 0), yu |= f, l.lanes = f, l.memoizedState = z;
    }
  }
  function H0(l, t) {
    if (typeof l != "function")
      throw Error(o(191, l));
    l.call(t);
  }
  function N0(l, t) {
    var u = l.callbacks;
    if (u !== null)
      for (l.callbacks = null, l = 0; l < u.length; l++)
        H0(u[l], t);
  }
  var ya = v(null), Fe = v(0);
  function R0(l, t) {
    l = Lt, _(Fe, l), _(ya, t), Lt = l | t.baseLanes;
  }
  function Qf() {
    _(Fe, Lt), _(ya, ya.current);
  }
  function jf() {
    Lt = Fe.current, T(ya), T(Fe);
  }
  var tt = v(null), st = null;
  function nu(l) {
    var t = l.alternate;
    _(sl, sl.current & 1), _(tt, l), st === null && (t === null || ya.current !== null || t.memoizedState !== null) && (st = l);
  }
  function Zf(l) {
    _(sl, sl.current), _(tt, l), st === null && (st = l);
  }
  function p0(l) {
    l.tag === 22 ? (_(sl, sl.current), _(tt, l), st === null && (st = l)) : fu();
  }
  function fu() {
    _(sl, sl.current), _(tt, tt.current);
  }
  function ut(l) {
    T(tt), st === l && (st = null), T(sl);
  }
  var sl = v(0);
  function ke(l) {
    for (var t = l; t !== null; ) {
      if (t.tag === 13) {
        var u = t.memoizedState;
        if (u !== null && (u = u.dehydrated, u === null || wc(u) || Wc(u)))
          return t;
      } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        t.child.return = t, t = t.child;
        continue;
      }
      if (t === l) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === l) return null;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
    return null;
  }
  var Ct = 0, B = null, tl = null, bl = null, Ie = !1, va = !1, Cu = !1, Pe = 0, $a = 0, ma = null, Cm = 0;
  function ml() {
    throw Error(o(321));
  }
  function Vf(l, t) {
    if (t === null) return !1;
    for (var u = 0; u < t.length && u < l.length; u++)
      if (!Pl(l[u], t[u])) return !1;
    return !0;
  }
  function xf(l, t, u, a, e, n) {
    return Ct = n, B = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, A.H = l === null || l.memoizedState === null ? Sy : ec, Cu = !1, n = u(a, e), Cu = !1, va && (n = Y0(
      t,
      u,
      a,
      e
    )), q0(l), n;
  }
  function q0(l) {
    A.H = Ia;
    var t = tl !== null && tl.next !== null;
    if (Ct = 0, bl = tl = B = null, Ie = !1, $a = 0, ma = null, t) throw Error(o(300));
    l === null || zl || (l = l.dependencies, l !== null && xe(l) && (zl = !0));
  }
  function Y0(l, t, u, a) {
    B = l;
    var e = 0;
    do {
      if (va && (ma = null), $a = 0, va = !1, 25 <= e) throw Error(o(301));
      if (e += 1, bl = tl = null, l.updateQueue != null) {
        var n = l.updateQueue;
        n.lastEffect = null, n.events = null, n.stores = null, n.memoCache != null && (n.memoCache.index = 0);
      }
      A.H = oy, n = t(u, a);
    } while (va);
    return n;
  }
  function Gm() {
    var l = A.H, t = l.useState()[0];
    return t = typeof t.then == "function" ? Fa(t) : t, l = l.useState()[0], (tl !== null ? tl.memoizedState : null) !== l && (B.flags |= 1024), t;
  }
  function Lf() {
    var l = Pe !== 0;
    return Pe = 0, l;
  }
  function Kf(l, t, u) {
    t.updateQueue = l.updateQueue, t.flags &= -2053, l.lanes &= ~u;
  }
  function Jf(l) {
    if (Ie) {
      for (l = l.memoizedState; l !== null; ) {
        var t = l.queue;
        t !== null && (t.pending = null), l = l.next;
      }
      Ie = !1;
    }
    Ct = 0, bl = tl = B = null, va = !1, $a = Pe = 0, ma = null;
  }
  function Yl() {
    var l = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return bl === null ? B.memoizedState = bl = l : bl = bl.next = l, bl;
  }
  function Sl() {
    if (tl === null) {
      var l = B.alternate;
      l = l !== null ? l.memoizedState : null;
    } else l = tl.next;
    var t = bl === null ? B.memoizedState : bl.next;
    if (t !== null)
      bl = t, tl = l;
    else {
      if (l === null)
        throw B.alternate === null ? Error(o(467)) : Error(o(310));
      tl = l, l = {
        memoizedState: tl.memoizedState,
        baseState: tl.baseState,
        baseQueue: tl.baseQueue,
        queue: tl.queue,
        next: null
      }, bl === null ? B.memoizedState = bl = l : bl = bl.next = l;
    }
    return bl;
  }
  function ln() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function Fa(l) {
    var t = $a;
    return $a += 1, ma === null && (ma = []), l = O0(ma, l, t), t = B, (bl === null ? t.memoizedState : bl.next) === null && (t = t.alternate, A.H = t === null || t.memoizedState === null ? Sy : ec), l;
  }
  function tn(l) {
    if (l !== null && typeof l == "object") {
      if (typeof l.then == "function") return Fa(l);
      if (l.$$typeof === Al) return Ul(l);
    }
    throw Error(o(438, String(l)));
  }
  function wf(l) {
    var t = null, u = B.updateQueue;
    if (u !== null && (t = u.memoCache), t == null) {
      var a = B.alternate;
      a !== null && (a = a.updateQueue, a !== null && (a = a.memoCache, a != null && (t = {
        data: a.data.map(function(e) {
          return e.slice();
        }),
        index: 0
      })));
    }
    if (t == null && (t = { data: [], index: 0 }), u === null && (u = ln(), B.updateQueue = u), u.memoCache = t, u = t.data[t.index], u === void 0)
      for (u = t.data[t.index] = Array(l), a = 0; a < l; a++)
        u[a] = Tu;
    return t.index++, u;
  }
  function Gt(l, t) {
    return typeof t == "function" ? t(l) : t;
  }
  function un(l) {
    var t = Sl();
    return Wf(t, tl, l);
  }
  function Wf(l, t, u) {
    var a = l.queue;
    if (a === null) throw Error(o(311));
    a.lastRenderedReducer = u;
    var e = l.baseQueue, n = a.pending;
    if (n !== null) {
      if (e !== null) {
        var f = e.next;
        e.next = n.next, n.next = f;
      }
      t.baseQueue = e = n, a.pending = null;
    }
    if (n = l.baseState, e === null) l.memoizedState = n;
    else {
      t = e.next;
      var c = f = null, i = null, h = t, g = !1;
      do {
        var z = h.lane & -536870913;
        if (z !== h.lane ? (V & z) === z : (Ct & z) === z) {
          var s = h.revertLane;
          if (s === 0)
            i !== null && (i = i.next = {
              lane: 0,
              revertLane: 0,
              gesture: null,
              action: h.action,
              hasEagerState: h.hasEagerState,
              eagerState: h.eagerState,
              next: null
            }), z === na && (g = !0);
          else if ((Ct & s) === s) {
            h = h.next, s === na && (g = !0);
            continue;
          } else
            z = {
              lane: 0,
              revertLane: h.revertLane,
              gesture: null,
              action: h.action,
              hasEagerState: h.hasEagerState,
              eagerState: h.eagerState,
              next: null
            }, i === null ? (c = i = z, f = n) : i = i.next = z, B.lanes |= s, yu |= s;
          z = h.action, Cu && u(n, z), n = h.hasEagerState ? h.eagerState : u(n, z);
        } else
          s = {
            lane: z,
            revertLane: h.revertLane,
            gesture: h.gesture,
            action: h.action,
            hasEagerState: h.hasEagerState,
            eagerState: h.eagerState,
            next: null
          }, i === null ? (c = i = s, f = n) : i = i.next = s, B.lanes |= z, yu |= z;
        h = h.next;
      } while (h !== null && h !== t);
      if (i === null ? f = n : i.next = c, !Pl(n, l.memoizedState) && (zl = !0, g && (u = fa, u !== null)))
        throw u;
      l.memoizedState = n, l.baseState = f, l.baseQueue = i, a.lastRenderedState = n;
    }
    return e === null && (a.lanes = 0), [l.memoizedState, a.dispatch];
  }
  function $f(l) {
    var t = Sl(), u = t.queue;
    if (u === null) throw Error(o(311));
    u.lastRenderedReducer = l;
    var a = u.dispatch, e = u.pending, n = t.memoizedState;
    if (e !== null) {
      u.pending = null;
      var f = e = e.next;
      do
        n = l(n, f.action), f = f.next;
      while (f !== e);
      Pl(n, t.memoizedState) || (zl = !0), t.memoizedState = n, t.baseQueue === null && (t.baseState = n), u.lastRenderedState = n;
    }
    return [n, a];
  }
  function B0(l, t, u) {
    var a = B, e = Sl(), n = L;
    if (n) {
      if (u === void 0) throw Error(o(407));
      u = u();
    } else u = t();
    var f = !Pl(
      (tl || e).memoizedState,
      u
    );
    if (f && (e.memoizedState = u, zl = !0), e = e.queue, If(X0.bind(null, a, e, l), [
      l
    ]), e.getSnapshot !== t || f || bl !== null && bl.memoizedState.tag & 1) {
      if (a.flags |= 2048, da(
        9,
        { destroy: void 0 },
        G0.bind(
          null,
          a,
          e,
          u,
          t
        ),
        null
      ), el === null) throw Error(o(349));
      n || (Ct & 127) !== 0 || C0(a, t, u);
    }
    return u;
  }
  function C0(l, t, u) {
    l.flags |= 16384, l = { getSnapshot: t, value: u }, t = B.updateQueue, t === null ? (t = ln(), B.updateQueue = t, t.stores = [l]) : (u = t.stores, u === null ? t.stores = [l] : u.push(l));
  }
  function G0(l, t, u, a) {
    t.value = u, t.getSnapshot = a, Q0(t) && j0(l);
  }
  function X0(l, t, u) {
    return u(function() {
      Q0(t) && j0(l);
    });
  }
  function Q0(l) {
    var t = l.getSnapshot;
    l = l.value;
    try {
      var u = t();
      return !Pl(l, u);
    } catch {
      return !0;
    }
  }
  function j0(l) {
    var t = Uu(l, 2);
    t !== null && xl(t, l, 2);
  }
  function Ff(l) {
    var t = Yl();
    if (typeof l == "function") {
      var u = l;
      if (l = u(), Cu) {
        $t(!0);
        try {
          u();
        } finally {
          $t(!1);
        }
      }
    }
    return t.memoizedState = t.baseState = l, t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Gt,
      lastRenderedState: l
    }, t;
  }
  function Z0(l, t, u, a) {
    return l.baseState = u, Wf(
      l,
      tl,
      typeof a == "function" ? a : Gt
    );
  }
  function Xm(l, t, u, a, e) {
    if (nn(l)) throw Error(o(485));
    if (l = t.action, l !== null) {
      var n = {
        payload: e,
        action: l,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function(f) {
          n.listeners.push(f);
        }
      };
      A.T !== null ? u(!0) : n.isTransition = !1, a(n), u = t.pending, u === null ? (n.next = t.pending = n, V0(t, n)) : (n.next = u.next, t.pending = u.next = n);
    }
  }
  function V0(l, t) {
    var u = t.action, a = t.payload, e = l.state;
    if (t.isTransition) {
      var n = A.T, f = {};
      A.T = f;
      try {
        var c = u(e, a), i = A.S;
        i !== null && i(f, c), x0(l, t, c);
      } catch (h) {
        kf(l, t, h);
      } finally {
        n !== null && f.types !== null && (n.types = f.types), A.T = n;
      }
    } else
      try {
        n = u(e, a), x0(l, t, n);
      } catch (h) {
        kf(l, t, h);
      }
  }
  function x0(l, t, u) {
    u !== null && typeof u == "object" && typeof u.then == "function" ? u.then(
      function(a) {
        L0(l, t, a);
      },
      function(a) {
        return kf(l, t, a);
      }
    ) : L0(l, t, u);
  }
  function L0(l, t, u) {
    t.status = "fulfilled", t.value = u, K0(t), l.state = u, t = l.pending, t !== null && (u = t.next, u === t ? l.pending = null : (u = u.next, t.next = u, V0(l, u)));
  }
  function kf(l, t, u) {
    var a = l.pending;
    if (l.pending = null, a !== null) {
      a = a.next;
      do
        t.status = "rejected", t.reason = u, K0(t), t = t.next;
      while (t !== a);
    }
    l.action = null;
  }
  function K0(l) {
    l = l.listeners;
    for (var t = 0; t < l.length; t++) (0, l[t])();
  }
  function J0(l, t) {
    return t;
  }
  function w0(l, t) {
    if (L) {
      var u = el.formState;
      if (u !== null) {
        l: {
          var a = B;
          if (L) {
            if (il) {
              t: {
                for (var e = il, n = ht; e.nodeType !== 8; ) {
                  if (!n) {
                    e = null;
                    break t;
                  }
                  if (e = St(
                    e.nextSibling
                  ), e === null) {
                    e = null;
                    break t;
                  }
                }
                n = e.data, e = n === "F!" || n === "F" ? e : null;
              }
              if (e) {
                il = St(
                  e.nextSibling
                ), a = e.data === "F!";
                break l;
              }
            }
            lu(a);
          }
          a = !1;
        }
        a && (t = u[0]);
      }
    }
    return u = Yl(), u.memoizedState = u.baseState = t, a = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: J0,
      lastRenderedState: t
    }, u.queue = a, u = dy.bind(
      null,
      B,
      a
    ), a.dispatch = u, a = Ff(!1), n = ac.bind(
      null,
      B,
      !1,
      a.queue
    ), a = Yl(), e = {
      state: t,
      dispatch: null,
      action: l,
      pending: null
    }, a.queue = e, u = Xm.bind(
      null,
      B,
      e,
      n,
      u
    ), e.dispatch = u, a.memoizedState = l, [t, u, !1];
  }
  function W0(l) {
    var t = Sl();
    return $0(t, tl, l);
  }
  function $0(l, t, u) {
    if (t = Wf(
      l,
      t,
      J0
    )[0], l = un(Gt)[0], typeof t == "object" && t !== null && typeof t.then == "function")
      try {
        var a = Fa(t);
      } catch (f) {
        throw f === ca ? Je : f;
      }
    else a = t;
    t = Sl();
    var e = t.queue, n = e.dispatch;
    return u !== t.memoizedState && (B.flags |= 2048, da(
      9,
      { destroy: void 0 },
      Qm.bind(null, e, u),
      null
    )), [a, n, l];
  }
  function Qm(l, t) {
    l.action = t;
  }
  function F0(l) {
    var t = Sl(), u = tl;
    if (u !== null)
      return $0(t, u, l);
    Sl(), t = t.memoizedState, u = Sl();
    var a = u.queue.dispatch;
    return u.memoizedState = l, [t, a, !1];
  }
  function da(l, t, u, a) {
    return l = { tag: l, create: u, deps: a, inst: t, next: null }, t = B.updateQueue, t === null && (t = ln(), B.updateQueue = t), u = t.lastEffect, u === null ? t.lastEffect = l.next = l : (a = u.next, u.next = l, l.next = a, t.lastEffect = l), l;
  }
  function k0() {
    return Sl().memoizedState;
  }
  function an(l, t, u, a) {
    var e = Yl();
    B.flags |= l, e.memoizedState = da(
      1 | t,
      { destroy: void 0 },
      u,
      a === void 0 ? null : a
    );
  }
  function en(l, t, u, a) {
    var e = Sl();
    a = a === void 0 ? null : a;
    var n = e.memoizedState.inst;
    tl !== null && a !== null && Vf(a, tl.memoizedState.deps) ? e.memoizedState = da(t, n, u, a) : (B.flags |= l, e.memoizedState = da(
      1 | t,
      n,
      u,
      a
    ));
  }
  function I0(l, t) {
    an(8390656, 8, l, t);
  }
  function If(l, t) {
    en(2048, 8, l, t);
  }
  function jm(l) {
    B.flags |= 4;
    var t = B.updateQueue;
    if (t === null)
      t = ln(), B.updateQueue = t, t.events = [l];
    else {
      var u = t.events;
      u === null ? t.events = [l] : u.push(l);
    }
  }
  function P0(l) {
    var t = Sl().memoizedState;
    return jm({ ref: t, nextImpl: l }), function() {
      if (($ & 2) !== 0) throw Error(o(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function ly(l, t) {
    return en(4, 2, l, t);
  }
  function ty(l, t) {
    return en(4, 4, l, t);
  }
  function uy(l, t) {
    if (typeof t == "function") {
      l = l();
      var u = t(l);
      return function() {
        typeof u == "function" ? u() : t(null);
      };
    }
    if (t != null)
      return l = l(), t.current = l, function() {
        t.current = null;
      };
  }
  function ay(l, t, u) {
    u = u != null ? u.concat([l]) : null, en(4, 4, uy.bind(null, t, l), u);
  }
  function Pf() {
  }
  function ey(l, t) {
    var u = Sl();
    t = t === void 0 ? null : t;
    var a = u.memoizedState;
    return t !== null && Vf(t, a[1]) ? a[0] : (u.memoizedState = [l, t], l);
  }
  function ny(l, t) {
    var u = Sl();
    t = t === void 0 ? null : t;
    var a = u.memoizedState;
    if (t !== null && Vf(t, a[1]))
      return a[0];
    if (a = l(), Cu) {
      $t(!0);
      try {
        l();
      } finally {
        $t(!1);
      }
    }
    return u.memoizedState = [a, t], a;
  }
  function lc(l, t, u) {
    return u === void 0 || (Ct & 1073741824) !== 0 && (V & 261930) === 0 ? l.memoizedState = t : (l.memoizedState = u, l = fv(), B.lanes |= l, yu |= l, u);
  }
  function fy(l, t, u, a) {
    return Pl(u, t) ? u : ya.current !== null ? (l = lc(l, u, a), Pl(l, t) || (zl = !0), l) : (Ct & 42) === 0 || (Ct & 1073741824) !== 0 && (V & 261930) === 0 ? (zl = !0, l.memoizedState = u) : (l = fv(), B.lanes |= l, yu |= l, t);
  }
  function cy(l, t, u, a, e) {
    var n = O.p;
    O.p = n !== 0 && 8 > n ? n : 8;
    var f = A.T, c = {};
    A.T = c, ac(l, !1, t, u);
    try {
      var i = e(), h = A.S;
      if (h !== null && h(c, i), i !== null && typeof i == "object" && typeof i.then == "function") {
        var g = Bm(
          i,
          a
        );
        ka(
          l,
          t,
          g,
          nt(l)
        );
      } else
        ka(
          l,
          t,
          a,
          nt(l)
        );
    } catch (z) {
      ka(
        l,
        t,
        { then: function() {
        }, status: "rejected", reason: z },
        nt()
      );
    } finally {
      O.p = n, f !== null && c.types !== null && (f.types = c.types), A.T = f;
    }
  }
  function Zm() {
  }
  function tc(l, t, u, a) {
    if (l.tag !== 5) throw Error(o(476));
    var e = iy(l).queue;
    cy(
      l,
      e,
      t,
      W,
      u === null ? Zm : function() {
        return yy(l), u(a);
      }
    );
  }
  function iy(l) {
    var t = l.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: W,
      baseState: W,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Gt,
        lastRenderedState: W
      },
      next: null
    };
    var u = {};
    return t.next = {
      memoizedState: u,
      baseState: u,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Gt,
        lastRenderedState: u
      },
      next: null
    }, l.memoizedState = t, l = l.alternate, l !== null && (l.memoizedState = t), t;
  }
  function yy(l) {
    var t = iy(l);
    t.next === null && (t = l.alternate.memoizedState), ka(
      l,
      t.next.queue,
      {},
      nt()
    );
  }
  function uc() {
    return Ul(se);
  }
  function vy() {
    return Sl().memoizedState;
  }
  function my() {
    return Sl().memoizedState;
  }
  function Vm(l) {
    for (var t = l.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var u = nt();
          l = au(u);
          var a = eu(t, l, u);
          a !== null && (xl(a, t, u), Ja(a, t, u)), t = { cache: Rf() }, l.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function xm(l, t, u) {
    var a = nt();
    u = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: u,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, nn(l) ? hy(t, u) : (u = Tf(l, t, u, a), u !== null && (xl(u, l, a), sy(u, t, a)));
  }
  function dy(l, t, u) {
    var a = nt();
    ka(l, t, u, a);
  }
  function ka(l, t, u, a) {
    var e = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: u,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (nn(l)) hy(t, e);
    else {
      var n = l.alternate;
      if (l.lanes === 0 && (n === null || n.lanes === 0) && (n = t.lastRenderedReducer, n !== null))
        try {
          var f = t.lastRenderedState, c = n(f, u);
          if (e.hasEagerState = !0, e.eagerState = c, Pl(c, f))
            return Qe(l, t, e, 0), el === null && Xe(), !1;
        } catch {
        } finally {
        }
      if (u = Tf(l, t, e, a), u !== null)
        return xl(u, l, a), sy(u, t, a), !0;
    }
    return !1;
  }
  function ac(l, t, u, a) {
    if (a = {
      lane: 2,
      revertLane: Bc(),
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, nn(l)) {
      if (t) throw Error(o(479));
    } else
      t = Tf(
        l,
        u,
        a,
        2
      ), t !== null && xl(t, l, 2);
  }
  function nn(l) {
    var t = l.alternate;
    return l === B || t !== null && t === B;
  }
  function hy(l, t) {
    va = Ie = !0;
    var u = l.pending;
    u === null ? t.next = t : (t.next = u.next, u.next = t), l.pending = t;
  }
  function sy(l, t, u) {
    if ((u & 4194048) !== 0) {
      var a = t.lanes;
      a &= l.pendingLanes, u |= a, t.lanes = u, zi(l, u);
    }
  }
  var Ia = {
    readContext: Ul,
    use: tn,
    useCallback: ml,
    useContext: ml,
    useEffect: ml,
    useImperativeHandle: ml,
    useLayoutEffect: ml,
    useInsertionEffect: ml,
    useMemo: ml,
    useReducer: ml,
    useRef: ml,
    useState: ml,
    useDebugValue: ml,
    useDeferredValue: ml,
    useTransition: ml,
    useSyncExternalStore: ml,
    useId: ml,
    useHostTransitionStatus: ml,
    useFormState: ml,
    useActionState: ml,
    useOptimistic: ml,
    useMemoCache: ml,
    useCacheRefresh: ml
  };
  Ia.useEffectEvent = ml;
  var Sy = {
    readContext: Ul,
    use: tn,
    useCallback: function(l, t) {
      return Yl().memoizedState = [
        l,
        t === void 0 ? null : t
      ], l;
    },
    useContext: Ul,
    useEffect: I0,
    useImperativeHandle: function(l, t, u) {
      u = u != null ? u.concat([l]) : null, an(
        4194308,
        4,
        uy.bind(null, t, l),
        u
      );
    },
    useLayoutEffect: function(l, t) {
      return an(4194308, 4, l, t);
    },
    useInsertionEffect: function(l, t) {
      an(4, 2, l, t);
    },
    useMemo: function(l, t) {
      var u = Yl();
      t = t === void 0 ? null : t;
      var a = l();
      if (Cu) {
        $t(!0);
        try {
          l();
        } finally {
          $t(!1);
        }
      }
      return u.memoizedState = [a, t], a;
    },
    useReducer: function(l, t, u) {
      var a = Yl();
      if (u !== void 0) {
        var e = u(t);
        if (Cu) {
          $t(!0);
          try {
            u(t);
          } finally {
            $t(!1);
          }
        }
      } else e = t;
      return a.memoizedState = a.baseState = e, l = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: l,
        lastRenderedState: e
      }, a.queue = l, l = l.dispatch = xm.bind(
        null,
        B,
        l
      ), [a.memoizedState, l];
    },
    useRef: function(l) {
      var t = Yl();
      return l = { current: l }, t.memoizedState = l;
    },
    useState: function(l) {
      l = Ff(l);
      var t = l.queue, u = dy.bind(null, B, t);
      return t.dispatch = u, [l.memoizedState, u];
    },
    useDebugValue: Pf,
    useDeferredValue: function(l, t) {
      var u = Yl();
      return lc(u, l, t);
    },
    useTransition: function() {
      var l = Ff(!1);
      return l = cy.bind(
        null,
        B,
        l.queue,
        !0,
        !1
      ), Yl().memoizedState = l, [!1, l];
    },
    useSyncExternalStore: function(l, t, u) {
      var a = B, e = Yl();
      if (L) {
        if (u === void 0)
          throw Error(o(407));
        u = u();
      } else {
        if (u = t(), el === null)
          throw Error(o(349));
        (V & 127) !== 0 || C0(a, t, u);
      }
      e.memoizedState = u;
      var n = { value: u, getSnapshot: t };
      return e.queue = n, I0(X0.bind(null, a, n, l), [
        l
      ]), a.flags |= 2048, da(
        9,
        { destroy: void 0 },
        G0.bind(
          null,
          a,
          n,
          u,
          t
        ),
        null
      ), u;
    },
    useId: function() {
      var l = Yl(), t = el.identifierPrefix;
      if (L) {
        var u = Dt, a = Mt;
        u = (a & ~(1 << 32 - Il(a) - 1)).toString(32) + u, t = "_" + t + "R_" + u, u = Pe++, 0 < u && (t += "H" + u.toString(32)), t += "_";
      } else
        u = Cm++, t = "_" + t + "r_" + u.toString(32) + "_";
      return l.memoizedState = t;
    },
    useHostTransitionStatus: uc,
    useFormState: w0,
    useActionState: w0,
    useOptimistic: function(l) {
      var t = Yl();
      t.memoizedState = t.baseState = l;
      var u = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = u, t = ac.bind(
        null,
        B,
        !0,
        u
      ), u.dispatch = t, [l, t];
    },
    useMemoCache: wf,
    useCacheRefresh: function() {
      return Yl().memoizedState = Vm.bind(
        null,
        B
      );
    },
    useEffectEvent: function(l) {
      var t = Yl(), u = { impl: l };
      return t.memoizedState = u, function() {
        if (($ & 2) !== 0)
          throw Error(o(440));
        return u.impl.apply(void 0, arguments);
      };
    }
  }, ec = {
    readContext: Ul,
    use: tn,
    useCallback: ey,
    useContext: Ul,
    useEffect: If,
    useImperativeHandle: ay,
    useInsertionEffect: ly,
    useLayoutEffect: ty,
    useMemo: ny,
    useReducer: un,
    useRef: k0,
    useState: function() {
      return un(Gt);
    },
    useDebugValue: Pf,
    useDeferredValue: function(l, t) {
      var u = Sl();
      return fy(
        u,
        tl.memoizedState,
        l,
        t
      );
    },
    useTransition: function() {
      var l = un(Gt)[0], t = Sl().memoizedState;
      return [
        typeof l == "boolean" ? l : Fa(l),
        t
      ];
    },
    useSyncExternalStore: B0,
    useId: vy,
    useHostTransitionStatus: uc,
    useFormState: W0,
    useActionState: W0,
    useOptimistic: function(l, t) {
      var u = Sl();
      return Z0(u, tl, l, t);
    },
    useMemoCache: wf,
    useCacheRefresh: my
  };
  ec.useEffectEvent = P0;
  var oy = {
    readContext: Ul,
    use: tn,
    useCallback: ey,
    useContext: Ul,
    useEffect: If,
    useImperativeHandle: ay,
    useInsertionEffect: ly,
    useLayoutEffect: ty,
    useMemo: ny,
    useReducer: $f,
    useRef: k0,
    useState: function() {
      return $f(Gt);
    },
    useDebugValue: Pf,
    useDeferredValue: function(l, t) {
      var u = Sl();
      return tl === null ? lc(u, l, t) : fy(
        u,
        tl.memoizedState,
        l,
        t
      );
    },
    useTransition: function() {
      var l = $f(Gt)[0], t = Sl().memoizedState;
      return [
        typeof l == "boolean" ? l : Fa(l),
        t
      ];
    },
    useSyncExternalStore: B0,
    useId: vy,
    useHostTransitionStatus: uc,
    useFormState: F0,
    useActionState: F0,
    useOptimistic: function(l, t) {
      var u = Sl();
      return tl !== null ? Z0(u, tl, l, t) : (u.baseState = l, [l, u.queue.dispatch]);
    },
    useMemoCache: wf,
    useCacheRefresh: my
  };
  oy.useEffectEvent = P0;
  function nc(l, t, u, a) {
    t = l.memoizedState, u = u(a, t), u = u == null ? t : q({}, t, u), l.memoizedState = u, l.lanes === 0 && (l.updateQueue.baseState = u);
  }
  var fc = {
    enqueueSetState: function(l, t, u) {
      l = l._reactInternals;
      var a = nt(), e = au(a);
      e.payload = t, u != null && (e.callback = u), t = eu(l, e, a), t !== null && (xl(t, l, a), Ja(t, l, a));
    },
    enqueueReplaceState: function(l, t, u) {
      l = l._reactInternals;
      var a = nt(), e = au(a);
      e.tag = 1, e.payload = t, u != null && (e.callback = u), t = eu(l, e, a), t !== null && (xl(t, l, a), Ja(t, l, a));
    },
    enqueueForceUpdate: function(l, t) {
      l = l._reactInternals;
      var u = nt(), a = au(u);
      a.tag = 2, t != null && (a.callback = t), t = eu(l, a, u), t !== null && (xl(t, l, u), Ja(t, l, u));
    }
  };
  function gy(l, t, u, a, e, n, f) {
    return l = l.stateNode, typeof l.shouldComponentUpdate == "function" ? l.shouldComponentUpdate(a, n, f) : t.prototype && t.prototype.isPureReactComponent ? !Xa(u, a) || !Xa(e, n) : !0;
  }
  function by(l, t, u, a) {
    l = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(u, a), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(u, a), t.state !== l && fc.enqueueReplaceState(t, t.state, null);
  }
  function Gu(l, t) {
    var u = t;
    if ("ref" in t) {
      u = {};
      for (var a in t)
        a !== "ref" && (u[a] = t[a]);
    }
    if (l = l.defaultProps) {
      u === t && (u = q({}, u));
      for (var e in l)
        u[e] === void 0 && (u[e] = l[e]);
    }
    return u;
  }
  function zy(l) {
    Ge(l);
  }
  function Ty(l) {
    console.error(l);
  }
  function Ey(l) {
    Ge(l);
  }
  function fn(l, t) {
    try {
      var u = l.onUncaughtError;
      u(t.value, { componentStack: t.stack });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function Ay(l, t, u) {
    try {
      var a = l.onCaughtError;
      a(u.value, {
        componentStack: u.stack,
        errorBoundary: t.tag === 1 ? t.stateNode : null
      });
    } catch (e) {
      setTimeout(function() {
        throw e;
      });
    }
  }
  function cc(l, t, u) {
    return u = au(u), u.tag = 3, u.payload = { element: null }, u.callback = function() {
      fn(l, t);
    }, u;
  }
  function _y(l) {
    return l = au(l), l.tag = 3, l;
  }
  function Oy(l, t, u, a) {
    var e = u.type.getDerivedStateFromError;
    if (typeof e == "function") {
      var n = a.value;
      l.payload = function() {
        return e(n);
      }, l.callback = function() {
        Ay(t, u, a);
      };
    }
    var f = u.stateNode;
    f !== null && typeof f.componentDidCatch == "function" && (l.callback = function() {
      Ay(t, u, a), typeof e != "function" && (vu === null ? vu = /* @__PURE__ */ new Set([this]) : vu.add(this));
      var c = a.stack;
      this.componentDidCatch(a.value, {
        componentStack: c !== null ? c : ""
      });
    });
  }
  function Lm(l, t, u, a, e) {
    if (u.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
      if (t = u.alternate, t !== null && ea(
        t,
        u,
        e,
        !0
      ), u = tt.current, u !== null) {
        switch (u.tag) {
          case 31:
          case 13:
            return st === null ? zn() : u.alternate === null && dl === 0 && (dl = 3), u.flags &= -257, u.flags |= 65536, u.lanes = e, a === we ? u.flags |= 16384 : (t = u.updateQueue, t === null ? u.updateQueue = /* @__PURE__ */ new Set([a]) : t.add(a), pc(l, a, e)), !1;
          case 22:
            return u.flags |= 65536, a === we ? u.flags |= 16384 : (t = u.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([a])
            }, u.updateQueue = t) : (u = t.retryQueue, u === null ? t.retryQueue = /* @__PURE__ */ new Set([a]) : u.add(a)), pc(l, a, e)), !1;
        }
        throw Error(o(435, u.tag));
      }
      return pc(l, a, e), zn(), !1;
    }
    if (L)
      return t = tt.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = e, a !== Df && (l = Error(o(422), { cause: a }), Za(vt(l, u)))) : (a !== Df && (t = Error(o(423), {
        cause: a
      }), Za(
        vt(t, u)
      )), l = l.current.alternate, l.flags |= 65536, e &= -e, l.lanes |= e, a = vt(a, u), e = cc(
        l.stateNode,
        a,
        e
      ), Gf(l, e), dl !== 4 && (dl = 2)), !1;
    var n = Error(o(520), { cause: a });
    if (n = vt(n, u), fe === null ? fe = [n] : fe.push(n), dl !== 4 && (dl = 2), t === null) return !0;
    a = vt(a, u), u = t;
    do {
      switch (u.tag) {
        case 3:
          return u.flags |= 65536, l = e & -e, u.lanes |= l, l = cc(u.stateNode, a, l), Gf(u, l), !1;
        case 1:
          if (t = u.type, n = u.stateNode, (u.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || n !== null && typeof n.componentDidCatch == "function" && (vu === null || !vu.has(n))))
            return u.flags |= 65536, e &= -e, u.lanes |= e, e = _y(e), Oy(
              e,
              l,
              u,
              a
            ), Gf(u, e), !1;
      }
      u = u.return;
    } while (u !== null);
    return !1;
  }
  var ic = Error(o(461)), zl = !1;
  function rl(l, t, u, a) {
    t.child = l === null ? r0(t, null, u, a) : Bu(
      t,
      l.child,
      u,
      a
    );
  }
  function My(l, t, u, a, e) {
    u = u.render;
    var n = t.ref;
    if ("ref" in a) {
      var f = {};
      for (var c in a)
        c !== "ref" && (f[c] = a[c]);
    } else f = a;
    return Ru(t), a = xf(
      l,
      t,
      u,
      f,
      n,
      e
    ), c = Lf(), l !== null && !zl ? (Kf(l, t, e), Xt(l, t, e)) : (L && c && Of(t), t.flags |= 1, rl(l, t, a, e), t.child);
  }
  function Dy(l, t, u, a, e) {
    if (l === null) {
      var n = u.type;
      return typeof n == "function" && !Ef(n) && n.defaultProps === void 0 && u.compare === null ? (t.tag = 15, t.type = n, Uy(
        l,
        t,
        n,
        a,
        e
      )) : (l = Ze(
        u.type,
        null,
        a,
        t,
        t.mode,
        e
      ), l.ref = t.ref, l.return = t, t.child = l);
    }
    if (n = l.child, !oc(l, e)) {
      var f = n.memoizedProps;
      if (u = u.compare, u = u !== null ? u : Xa, u(f, a) && l.ref === t.ref)
        return Xt(l, t, e);
    }
    return t.flags |= 1, l = pt(n, a), l.ref = t.ref, l.return = t, t.child = l;
  }
  function Uy(l, t, u, a, e) {
    if (l !== null) {
      var n = l.memoizedProps;
      if (Xa(n, a) && l.ref === t.ref)
        if (zl = !1, t.pendingProps = a = n, oc(l, e))
          (l.flags & 131072) !== 0 && (zl = !0);
        else
          return t.lanes = l.lanes, Xt(l, t, e);
    }
    return yc(
      l,
      t,
      u,
      a,
      e
    );
  }
  function ry(l, t, u, a) {
    var e = a.children, n = l !== null ? l.memoizedState : null;
    if (l === null && t.stateNode === null && (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), a.mode === "hidden") {
      if ((t.flags & 128) !== 0) {
        if (n = n !== null ? n.baseLanes | u : u, l !== null) {
          for (a = t.child = l.child, e = 0; a !== null; )
            e = e | a.lanes | a.childLanes, a = a.sibling;
          a = e & ~n;
        } else a = 0, t.child = null;
        return Hy(
          l,
          t,
          n,
          u,
          a
        );
      }
      if ((u & 536870912) !== 0)
        t.memoizedState = { baseLanes: 0, cachePool: null }, l !== null && Ke(
          t,
          n !== null ? n.cachePool : null
        ), n !== null ? R0(t, n) : Qf(), p0(t);
      else
        return a = t.lanes = 536870912, Hy(
          l,
          t,
          n !== null ? n.baseLanes | u : u,
          u,
          a
        );
    } else
      n !== null ? (Ke(t, n.cachePool), R0(t, n), fu(), t.memoizedState = null) : (l !== null && Ke(t, null), Qf(), fu());
    return rl(l, t, e, u), t.child;
  }
  function Pa(l, t) {
    return l !== null && l.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function Hy(l, t, u, a, e) {
    var n = qf();
    return n = n === null ? null : { parent: gl._currentValue, pool: n }, t.memoizedState = {
      baseLanes: u,
      cachePool: n
    }, l !== null && Ke(t, null), Qf(), p0(t), l !== null && ea(l, t, a, !0), t.childLanes = e, null;
  }
  function cn(l, t) {
    return t = vn(
      { mode: t.mode, children: t.children },
      l.mode
    ), t.ref = l.ref, l.child = t, t.return = l, t;
  }
  function Ny(l, t, u) {
    return Bu(t, l.child, null, u), l = cn(t, t.pendingProps), l.flags |= 2, ut(t), t.memoizedState = null, l;
  }
  function Km(l, t, u) {
    var a = t.pendingProps, e = (t.flags & 128) !== 0;
    if (t.flags &= -129, l === null) {
      if (L) {
        if (a.mode === "hidden")
          return l = cn(t, a), t.lanes = 536870912, Pa(null, l);
        if (Zf(t), (l = il) ? (l = Vv(
          l,
          ht
        ), l = l !== null && l.data === "&" ? l : null, l !== null && (t.memoizedState = {
          dehydrated: l,
          treeContext: It !== null ? { id: Mt, overflow: Dt } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, u = h0(l), u.return = t, t.child = u, Dl = t, il = null)) : l = null, l === null) throw lu(t);
        return t.lanes = 536870912, null;
      }
      return cn(t, a);
    }
    var n = l.memoizedState;
    if (n !== null) {
      var f = n.dehydrated;
      if (Zf(t), e)
        if (t.flags & 256)
          t.flags &= -257, t = Ny(
            l,
            t,
            u
          );
        else if (t.memoizedState !== null)
          t.child = l.child, t.flags |= 128, t = null;
        else throw Error(o(558));
      else if (zl || ea(l, t, u, !1), e = (u & l.childLanes) !== 0, zl || e) {
        if (a = el, a !== null && (f = Ti(a, u), f !== 0 && f !== n.retryLane))
          throw n.retryLane = f, Uu(l, f), xl(a, l, f), ic;
        zn(), t = Ny(
          l,
          t,
          u
        );
      } else
        l = n.treeContext, il = St(f.nextSibling), Dl = t, L = !0, Pt = null, ht = !1, l !== null && o0(t, l), t = cn(t, a), t.flags |= 4096;
      return t;
    }
    return l = pt(l.child, {
      mode: a.mode,
      children: a.children
    }), l.ref = t.ref, t.child = l, l.return = t, l;
  }
  function yn(l, t) {
    var u = t.ref;
    if (u === null)
      l !== null && l.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof u != "function" && typeof u != "object")
        throw Error(o(284));
      (l === null || l.ref !== u) && (t.flags |= 4194816);
    }
  }
  function yc(l, t, u, a, e) {
    return Ru(t), u = xf(
      l,
      t,
      u,
      a,
      void 0,
      e
    ), a = Lf(), l !== null && !zl ? (Kf(l, t, e), Xt(l, t, e)) : (L && a && Of(t), t.flags |= 1, rl(l, t, u, e), t.child);
  }
  function Ry(l, t, u, a, e, n) {
    return Ru(t), t.updateQueue = null, u = Y0(
      t,
      a,
      u,
      e
    ), q0(l), a = Lf(), l !== null && !zl ? (Kf(l, t, n), Xt(l, t, n)) : (L && a && Of(t), t.flags |= 1, rl(l, t, u, n), t.child);
  }
  function py(l, t, u, a, e) {
    if (Ru(t), t.stateNode === null) {
      var n = la, f = u.contextType;
      typeof f == "object" && f !== null && (n = Ul(f)), n = new u(a, n), t.memoizedState = n.state !== null && n.state !== void 0 ? n.state : null, n.updater = fc, t.stateNode = n, n._reactInternals = t, n = t.stateNode, n.props = a, n.state = t.memoizedState, n.refs = {}, Bf(t), f = u.contextType, n.context = typeof f == "object" && f !== null ? Ul(f) : la, n.state = t.memoizedState, f = u.getDerivedStateFromProps, typeof f == "function" && (nc(
        t,
        u,
        f,
        a
      ), n.state = t.memoizedState), typeof u.getDerivedStateFromProps == "function" || typeof n.getSnapshotBeforeUpdate == "function" || typeof n.UNSAFE_componentWillMount != "function" && typeof n.componentWillMount != "function" || (f = n.state, typeof n.componentWillMount == "function" && n.componentWillMount(), typeof n.UNSAFE_componentWillMount == "function" && n.UNSAFE_componentWillMount(), f !== n.state && fc.enqueueReplaceState(n, n.state, null), Wa(t, a, n, e), wa(), n.state = t.memoizedState), typeof n.componentDidMount == "function" && (t.flags |= 4194308), a = !0;
    } else if (l === null) {
      n = t.stateNode;
      var c = t.memoizedProps, i = Gu(u, c);
      n.props = i;
      var h = n.context, g = u.contextType;
      f = la, typeof g == "object" && g !== null && (f = Ul(g));
      var z = u.getDerivedStateFromProps;
      g = typeof z == "function" || typeof n.getSnapshotBeforeUpdate == "function", c = t.pendingProps !== c, g || typeof n.UNSAFE_componentWillReceiveProps != "function" && typeof n.componentWillReceiveProps != "function" || (c || h !== f) && by(
        t,
        n,
        a,
        f
      ), uu = !1;
      var s = t.memoizedState;
      n.state = s, Wa(t, a, n, e), wa(), h = t.memoizedState, c || s !== h || uu ? (typeof z == "function" && (nc(
        t,
        u,
        z,
        a
      ), h = t.memoizedState), (i = uu || gy(
        t,
        u,
        i,
        a,
        s,
        h,
        f
      )) ? (g || typeof n.UNSAFE_componentWillMount != "function" && typeof n.componentWillMount != "function" || (typeof n.componentWillMount == "function" && n.componentWillMount(), typeof n.UNSAFE_componentWillMount == "function" && n.UNSAFE_componentWillMount()), typeof n.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof n.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = a, t.memoizedState = h), n.props = a, n.state = h, n.context = f, a = i) : (typeof n.componentDidMount == "function" && (t.flags |= 4194308), a = !1);
    } else {
      n = t.stateNode, Cf(l, t), f = t.memoizedProps, g = Gu(u, f), n.props = g, z = t.pendingProps, s = n.context, h = u.contextType, i = la, typeof h == "object" && h !== null && (i = Ul(h)), c = u.getDerivedStateFromProps, (h = typeof c == "function" || typeof n.getSnapshotBeforeUpdate == "function") || typeof n.UNSAFE_componentWillReceiveProps != "function" && typeof n.componentWillReceiveProps != "function" || (f !== z || s !== i) && by(
        t,
        n,
        a,
        i
      ), uu = !1, s = t.memoizedState, n.state = s, Wa(t, a, n, e), wa();
      var S = t.memoizedState;
      f !== z || s !== S || uu || l !== null && l.dependencies !== null && xe(l.dependencies) ? (typeof c == "function" && (nc(
        t,
        u,
        c,
        a
      ), S = t.memoizedState), (g = uu || gy(
        t,
        u,
        g,
        a,
        s,
        S,
        i
      ) || l !== null && l.dependencies !== null && xe(l.dependencies)) ? (h || typeof n.UNSAFE_componentWillUpdate != "function" && typeof n.componentWillUpdate != "function" || (typeof n.componentWillUpdate == "function" && n.componentWillUpdate(a, S, i), typeof n.UNSAFE_componentWillUpdate == "function" && n.UNSAFE_componentWillUpdate(
        a,
        S,
        i
      )), typeof n.componentDidUpdate == "function" && (t.flags |= 4), typeof n.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof n.componentDidUpdate != "function" || f === l.memoizedProps && s === l.memoizedState || (t.flags |= 4), typeof n.getSnapshotBeforeUpdate != "function" || f === l.memoizedProps && s === l.memoizedState || (t.flags |= 1024), t.memoizedProps = a, t.memoizedState = S), n.props = a, n.state = S, n.context = i, a = g) : (typeof n.componentDidUpdate != "function" || f === l.memoizedProps && s === l.memoizedState || (t.flags |= 4), typeof n.getSnapshotBeforeUpdate != "function" || f === l.memoizedProps && s === l.memoizedState || (t.flags |= 1024), a = !1);
    }
    return n = a, yn(l, t), a = (t.flags & 128) !== 0, n || a ? (n = t.stateNode, u = a && typeof u.getDerivedStateFromError != "function" ? null : n.render(), t.flags |= 1, l !== null && a ? (t.child = Bu(
      t,
      l.child,
      null,
      e
    ), t.child = Bu(
      t,
      null,
      u,
      e
    )) : rl(l, t, u, e), t.memoizedState = n.state, l = t.child) : l = Xt(
      l,
      t,
      e
    ), l;
  }
  function qy(l, t, u, a) {
    return Hu(), t.flags |= 256, rl(l, t, u, a), t.child;
  }
  var vc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function mc(l) {
    return { baseLanes: l, cachePool: A0() };
  }
  function dc(l, t, u) {
    return l = l !== null ? l.childLanes & ~u : 0, t && (l |= et), l;
  }
  function Yy(l, t, u) {
    var a = t.pendingProps, e = !1, n = (t.flags & 128) !== 0, f;
    if ((f = n) || (f = l !== null && l.memoizedState === null ? !1 : (sl.current & 2) !== 0), f && (e = !0, t.flags &= -129), f = (t.flags & 32) !== 0, t.flags &= -33, l === null) {
      if (L) {
        if (e ? nu(t) : fu(), (l = il) ? (l = Vv(
          l,
          ht
        ), l = l !== null && l.data !== "&" ? l : null, l !== null && (t.memoizedState = {
          dehydrated: l,
          treeContext: It !== null ? { id: Mt, overflow: Dt } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, u = h0(l), u.return = t, t.child = u, Dl = t, il = null)) : l = null, l === null) throw lu(t);
        return Wc(l) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var c = a.children;
      return a = a.fallback, e ? (fu(), e = t.mode, c = vn(
        { mode: "hidden", children: c },
        e
      ), a = ru(
        a,
        e,
        u,
        null
      ), c.return = t, a.return = t, c.sibling = a, t.child = c, a = t.child, a.memoizedState = mc(u), a.childLanes = dc(
        l,
        f,
        u
      ), t.memoizedState = vc, Pa(null, a)) : (nu(t), hc(t, c));
    }
    var i = l.memoizedState;
    if (i !== null && (c = i.dehydrated, c !== null)) {
      if (n)
        t.flags & 256 ? (nu(t), t.flags &= -257, t = sc(
          l,
          t,
          u
        )) : t.memoizedState !== null ? (fu(), t.child = l.child, t.flags |= 128, t = null) : (fu(), c = a.fallback, e = t.mode, a = vn(
          { mode: "visible", children: a.children },
          e
        ), c = ru(
          c,
          e,
          u,
          null
        ), c.flags |= 2, a.return = t, c.return = t, a.sibling = c, t.child = a, Bu(
          t,
          l.child,
          null,
          u
        ), a = t.child, a.memoizedState = mc(u), a.childLanes = dc(
          l,
          f,
          u
        ), t.memoizedState = vc, t = Pa(null, a));
      else if (nu(t), Wc(c)) {
        if (f = c.nextSibling && c.nextSibling.dataset, f) var h = f.dgst;
        f = h, a = Error(o(419)), a.stack = "", a.digest = f, Za({ value: a, source: null, stack: null }), t = sc(
          l,
          t,
          u
        );
      } else if (zl || ea(l, t, u, !1), f = (u & l.childLanes) !== 0, zl || f) {
        if (f = el, f !== null && (a = Ti(f, u), a !== 0 && a !== i.retryLane))
          throw i.retryLane = a, Uu(l, a), xl(f, l, a), ic;
        wc(c) || zn(), t = sc(
          l,
          t,
          u
        );
      } else
        wc(c) ? (t.flags |= 192, t.child = l.child, t = null) : (l = i.treeContext, il = St(
          c.nextSibling
        ), Dl = t, L = !0, Pt = null, ht = !1, l !== null && o0(t, l), t = hc(
          t,
          a.children
        ), t.flags |= 4096);
      return t;
    }
    return e ? (fu(), c = a.fallback, e = t.mode, i = l.child, h = i.sibling, a = pt(i, {
      mode: "hidden",
      children: a.children
    }), a.subtreeFlags = i.subtreeFlags & 65011712, h !== null ? c = pt(
      h,
      c
    ) : (c = ru(
      c,
      e,
      u,
      null
    ), c.flags |= 2), c.return = t, a.return = t, a.sibling = c, t.child = a, Pa(null, a), a = t.child, c = l.child.memoizedState, c === null ? c = mc(u) : (e = c.cachePool, e !== null ? (i = gl._currentValue, e = e.parent !== i ? { parent: i, pool: i } : e) : e = A0(), c = {
      baseLanes: c.baseLanes | u,
      cachePool: e
    }), a.memoizedState = c, a.childLanes = dc(
      l,
      f,
      u
    ), t.memoizedState = vc, Pa(l.child, a)) : (nu(t), u = l.child, l = u.sibling, u = pt(u, {
      mode: "visible",
      children: a.children
    }), u.return = t, u.sibling = null, l !== null && (f = t.deletions, f === null ? (t.deletions = [l], t.flags |= 16) : f.push(l)), t.child = u, t.memoizedState = null, u);
  }
  function hc(l, t) {
    return t = vn(
      { mode: "visible", children: t },
      l.mode
    ), t.return = l, l.child = t;
  }
  function vn(l, t) {
    return l = lt(22, l, null, t), l.lanes = 0, l;
  }
  function sc(l, t, u) {
    return Bu(t, l.child, null, u), l = hc(
      t,
      t.pendingProps.children
    ), l.flags |= 2, t.memoizedState = null, l;
  }
  function By(l, t, u) {
    l.lanes |= t;
    var a = l.alternate;
    a !== null && (a.lanes |= t), Hf(l.return, t, u);
  }
  function Sc(l, t, u, a, e, n) {
    var f = l.memoizedState;
    f === null ? l.memoizedState = {
      isBackwards: t,
      rendering: null,
      renderingStartTime: 0,
      last: a,
      tail: u,
      tailMode: e,
      treeForkCount: n
    } : (f.isBackwards = t, f.rendering = null, f.renderingStartTime = 0, f.last = a, f.tail = u, f.tailMode = e, f.treeForkCount = n);
  }
  function Cy(l, t, u) {
    var a = t.pendingProps, e = a.revealOrder, n = a.tail;
    a = a.children;
    var f = sl.current, c = (f & 2) !== 0;
    if (c ? (f = f & 1 | 2, t.flags |= 128) : f &= 1, _(sl, f), rl(l, t, a, u), a = L ? ja : 0, !c && l !== null && (l.flags & 128) !== 0)
      l: for (l = t.child; l !== null; ) {
        if (l.tag === 13)
          l.memoizedState !== null && By(l, u, t);
        else if (l.tag === 19)
          By(l, u, t);
        else if (l.child !== null) {
          l.child.return = l, l = l.child;
          continue;
        }
        if (l === t) break l;
        for (; l.sibling === null; ) {
          if (l.return === null || l.return === t)
            break l;
          l = l.return;
        }
        l.sibling.return = l.return, l = l.sibling;
      }
    switch (e) {
      case "forwards":
        for (u = t.child, e = null; u !== null; )
          l = u.alternate, l !== null && ke(l) === null && (e = u), u = u.sibling;
        u = e, u === null ? (e = t.child, t.child = null) : (e = u.sibling, u.sibling = null), Sc(
          t,
          !1,
          e,
          u,
          n,
          a
        );
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (u = null, e = t.child, t.child = null; e !== null; ) {
          if (l = e.alternate, l !== null && ke(l) === null) {
            t.child = e;
            break;
          }
          l = e.sibling, e.sibling = u, u = e, e = l;
        }
        Sc(
          t,
          !0,
          u,
          null,
          n,
          a
        );
        break;
      case "together":
        Sc(
          t,
          !1,
          null,
          null,
          void 0,
          a
        );
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function Xt(l, t, u) {
    if (l !== null && (t.dependencies = l.dependencies), yu |= t.lanes, (u & t.childLanes) === 0)
      if (l !== null) {
        if (ea(
          l,
          t,
          u,
          !1
        ), (u & t.childLanes) === 0)
          return null;
      } else return null;
    if (l !== null && t.child !== l.child)
      throw Error(o(153));
    if (t.child !== null) {
      for (l = t.child, u = pt(l, l.pendingProps), t.child = u, u.return = t; l.sibling !== null; )
        l = l.sibling, u = u.sibling = pt(l, l.pendingProps), u.return = t;
      u.sibling = null;
    }
    return t.child;
  }
  function oc(l, t) {
    return (l.lanes & t) !== 0 ? !0 : (l = l.dependencies, !!(l !== null && xe(l)));
  }
  function Jm(l, t, u) {
    switch (t.tag) {
      case 3:
        ql(t, t.stateNode.containerInfo), tu(t, gl, l.memoizedState.cache), Hu();
        break;
      case 27:
      case 5:
        Ma(t);
        break;
      case 4:
        ql(t, t.stateNode.containerInfo);
        break;
      case 10:
        tu(
          t,
          t.type,
          t.memoizedProps.value
        );
        break;
      case 31:
        if (t.memoizedState !== null)
          return t.flags |= 128, Zf(t), null;
        break;
      case 13:
        var a = t.memoizedState;
        if (a !== null)
          return a.dehydrated !== null ? (nu(t), t.flags |= 128, null) : (u & t.child.childLanes) !== 0 ? Yy(l, t, u) : (nu(t), l = Xt(
            l,
            t,
            u
          ), l !== null ? l.sibling : null);
        nu(t);
        break;
      case 19:
        var e = (l.flags & 128) !== 0;
        if (a = (u & t.childLanes) !== 0, a || (ea(
          l,
          t,
          u,
          !1
        ), a = (u & t.childLanes) !== 0), e) {
          if (a)
            return Cy(
              l,
              t,
              u
            );
          t.flags |= 128;
        }
        if (e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null, e.lastEffect = null), _(sl, sl.current), a) break;
        return null;
      case 22:
        return t.lanes = 0, ry(
          l,
          t,
          u,
          t.pendingProps
        );
      case 24:
        tu(t, gl, l.memoizedState.cache);
    }
    return Xt(l, t, u);
  }
  function Gy(l, t, u) {
    if (l !== null)
      if (l.memoizedProps !== t.pendingProps)
        zl = !0;
      else {
        if (!oc(l, u) && (t.flags & 128) === 0)
          return zl = !1, Jm(
            l,
            t,
            u
          );
        zl = (l.flags & 131072) !== 0;
      }
    else
      zl = !1, L && (t.flags & 1048576) !== 0 && S0(t, ja, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        l: {
          var a = t.pendingProps;
          if (l = qu(t.elementType), t.type = l, typeof l == "function")
            Ef(l) ? (a = Gu(l, a), t.tag = 1, t = py(
              null,
              t,
              l,
              a,
              u
            )) : (t.tag = 0, t = yc(
              null,
              t,
              l,
              a,
              u
            ));
          else {
            if (l != null) {
              var e = l.$$typeof;
              if (e === bt) {
                t.tag = 11, t = My(
                  null,
                  t,
                  l,
                  a,
                  u
                );
                break l;
              } else if (e === K) {
                t.tag = 14, t = Dy(
                  null,
                  t,
                  l,
                  a,
                  u
                );
                break l;
              }
            }
            throw t = zt(l) || l, Error(o(306, t, ""));
          }
        }
        return t;
      case 0:
        return yc(
          l,
          t,
          t.type,
          t.pendingProps,
          u
        );
      case 1:
        return a = t.type, e = Gu(
          a,
          t.pendingProps
        ), py(
          l,
          t,
          a,
          e,
          u
        );
      case 3:
        l: {
          if (ql(
            t,
            t.stateNode.containerInfo
          ), l === null) throw Error(o(387));
          a = t.pendingProps;
          var n = t.memoizedState;
          e = n.element, Cf(l, t), Wa(t, a, null, u);
          var f = t.memoizedState;
          if (a = f.cache, tu(t, gl, a), a !== n.cache && Nf(
            t,
            [gl],
            u,
            !0
          ), wa(), a = f.element, n.isDehydrated)
            if (n = {
              element: a,
              isDehydrated: !1,
              cache: f.cache
            }, t.updateQueue.baseState = n, t.memoizedState = n, t.flags & 256) {
              t = qy(
                l,
                t,
                a,
                u
              );
              break l;
            } else if (a !== e) {
              e = vt(
                Error(o(424)),
                t
              ), Za(e), t = qy(
                l,
                t,
                a,
                u
              );
              break l;
            } else {
              switch (l = t.stateNode.containerInfo, l.nodeType) {
                case 9:
                  l = l.body;
                  break;
                default:
                  l = l.nodeName === "HTML" ? l.ownerDocument.body : l;
              }
              for (il = St(l.firstChild), Dl = t, L = !0, Pt = null, ht = !0, u = r0(
                t,
                null,
                a,
                u
              ), t.child = u; u; )
                u.flags = u.flags & -3 | 4096, u = u.sibling;
            }
          else {
            if (Hu(), a === e) {
              t = Xt(
                l,
                t,
                u
              );
              break l;
            }
            rl(l, t, a, u);
          }
          t = t.child;
        }
        return t;
      case 26:
        return yn(l, t), l === null ? (u = Wv(
          t.type,
          null,
          t.pendingProps,
          null
        )) ? t.memoizedState = u : L || (u = t.type, l = t.pendingProps, a = Dn(
          Q.current
        ).createElement(u), a[Ml] = t, a[Gl] = l, Hl(a, u, l), _l(a), t.stateNode = a) : t.memoizedState = Wv(
          t.type,
          l.memoizedProps,
          t.pendingProps,
          l.memoizedState
        ), null;
      case 27:
        return Ma(t), l === null && L && (a = t.stateNode = Kv(
          t.type,
          t.pendingProps,
          Q.current
        ), Dl = t, ht = !0, e = il, su(t.type) ? ($c = e, il = St(a.firstChild)) : il = e), rl(
          l,
          t,
          t.pendingProps.children,
          u
        ), yn(l, t), l === null && (t.flags |= 4194304), t.child;
      case 5:
        return l === null && L && ((e = a = il) && (a = Ad(
          a,
          t.type,
          t.pendingProps,
          ht
        ), a !== null ? (t.stateNode = a, Dl = t, il = St(a.firstChild), ht = !1, e = !0) : e = !1), e || lu(t)), Ma(t), e = t.type, n = t.pendingProps, f = l !== null ? l.memoizedProps : null, a = n.children, Lc(e, n) ? a = null : f !== null && Lc(e, f) && (t.flags |= 32), t.memoizedState !== null && (e = xf(
          l,
          t,
          Gm,
          null,
          null,
          u
        ), se._currentValue = e), yn(l, t), rl(l, t, a, u), t.child;
      case 6:
        return l === null && L && ((l = u = il) && (u = _d(
          u,
          t.pendingProps,
          ht
        ), u !== null ? (t.stateNode = u, Dl = t, il = null, l = !0) : l = !1), l || lu(t)), null;
      case 13:
        return Yy(l, t, u);
      case 4:
        return ql(
          t,
          t.stateNode.containerInfo
        ), a = t.pendingProps, l === null ? t.child = Bu(
          t,
          null,
          a,
          u
        ) : rl(l, t, a, u), t.child;
      case 11:
        return My(
          l,
          t,
          t.type,
          t.pendingProps,
          u
        );
      case 7:
        return rl(
          l,
          t,
          t.pendingProps,
          u
        ), t.child;
      case 8:
        return rl(
          l,
          t,
          t.pendingProps.children,
          u
        ), t.child;
      case 12:
        return rl(
          l,
          t,
          t.pendingProps.children,
          u
        ), t.child;
      case 10:
        return a = t.pendingProps, tu(t, t.type, a.value), rl(l, t, a.children, u), t.child;
      case 9:
        return e = t.type._context, a = t.pendingProps.children, Ru(t), e = Ul(e), a = a(e), t.flags |= 1, rl(l, t, a, u), t.child;
      case 14:
        return Dy(
          l,
          t,
          t.type,
          t.pendingProps,
          u
        );
      case 15:
        return Uy(
          l,
          t,
          t.type,
          t.pendingProps,
          u
        );
      case 19:
        return Cy(l, t, u);
      case 31:
        return Km(l, t, u);
      case 22:
        return ry(
          l,
          t,
          u,
          t.pendingProps
        );
      case 24:
        return Ru(t), a = Ul(gl), l === null ? (e = qf(), e === null && (e = el, n = Rf(), e.pooledCache = n, n.refCount++, n !== null && (e.pooledCacheLanes |= u), e = n), t.memoizedState = { parent: a, cache: e }, Bf(t), tu(t, gl, e)) : ((l.lanes & u) !== 0 && (Cf(l, t), Wa(t, null, null, u), wa()), e = l.memoizedState, n = t.memoizedState, e.parent !== a ? (e = { parent: a, cache: a }, t.memoizedState = e, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = e), tu(t, gl, a)) : (a = n.cache, tu(t, gl, a), a !== e.cache && Nf(
          t,
          [gl],
          u,
          !0
        ))), rl(
          l,
          t,
          t.pendingProps.children,
          u
        ), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(o(156, t.tag));
  }
  function Qt(l) {
    l.flags |= 4;
  }
  function gc(l, t, u, a, e) {
    if ((t = (l.mode & 32) !== 0) && (t = !1), t) {
      if (l.flags |= 16777216, (e & 335544128) === e)
        if (l.stateNode.complete) l.flags |= 8192;
        else if (vv()) l.flags |= 8192;
        else
          throw Yu = we, Yf;
    } else l.flags &= -16777217;
  }
  function Xy(l, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0)
      l.flags &= -16777217;
    else if (l.flags |= 16777216, !Pv(t))
      if (vv()) l.flags |= 8192;
      else
        throw Yu = we, Yf;
  }
  function mn(l, t) {
    t !== null && (l.flags |= 4), l.flags & 16384 && (t = l.tag !== 22 ? gi() : 536870912, l.lanes |= t, oa |= t);
  }
  function le(l, t) {
    if (!L)
      switch (l.tailMode) {
        case "hidden":
          t = l.tail;
          for (var u = null; t !== null; )
            t.alternate !== null && (u = t), t = t.sibling;
          u === null ? l.tail = null : u.sibling = null;
          break;
        case "collapsed":
          u = l.tail;
          for (var a = null; u !== null; )
            u.alternate !== null && (a = u), u = u.sibling;
          a === null ? t || l.tail === null ? l.tail = null : l.tail.sibling = null : a.sibling = null;
      }
  }
  function yl(l) {
    var t = l.alternate !== null && l.alternate.child === l.child, u = 0, a = 0;
    if (t)
      for (var e = l.child; e !== null; )
        u |= e.lanes | e.childLanes, a |= e.subtreeFlags & 65011712, a |= e.flags & 65011712, e.return = l, e = e.sibling;
    else
      for (e = l.child; e !== null; )
        u |= e.lanes | e.childLanes, a |= e.subtreeFlags, a |= e.flags, e.return = l, e = e.sibling;
    return l.subtreeFlags |= a, l.childLanes = u, t;
  }
  function wm(l, t, u) {
    var a = t.pendingProps;
    switch (Mf(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return yl(t), null;
      case 1:
        return yl(t), null;
      case 3:
        return u = t.stateNode, a = null, l !== null && (a = l.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), Bt(gl), hl(), u.pendingContext && (u.context = u.pendingContext, u.pendingContext = null), (l === null || l.child === null) && (aa(t) ? Qt(t) : l === null || l.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, Uf())), yl(t), null;
      case 26:
        var e = t.type, n = t.memoizedState;
        return l === null ? (Qt(t), n !== null ? (yl(t), Xy(t, n)) : (yl(t), gc(
          t,
          e,
          null,
          a,
          u
        ))) : n ? n !== l.memoizedState ? (Qt(t), yl(t), Xy(t, n)) : (yl(t), t.flags &= -16777217) : (l = l.memoizedProps, l !== a && Qt(t), yl(t), gc(
          t,
          e,
          l,
          a,
          u
        )), null;
      case 27:
        if (Ee(t), u = Q.current, e = t.type, l !== null && t.stateNode != null)
          l.memoizedProps !== a && Qt(t);
        else {
          if (!a) {
            if (t.stateNode === null)
              throw Error(o(166));
            return yl(t), null;
          }
          l = r.current, aa(t) ? g0(t) : (l = Kv(e, a, u), t.stateNode = l, Qt(t));
        }
        return yl(t), null;
      case 5:
        if (Ee(t), e = t.type, l !== null && t.stateNode != null)
          l.memoizedProps !== a && Qt(t);
        else {
          if (!a) {
            if (t.stateNode === null)
              throw Error(o(166));
            return yl(t), null;
          }
          if (n = r.current, aa(t))
            g0(t);
          else {
            var f = Dn(
              Q.current
            );
            switch (n) {
              case 1:
                n = f.createElementNS(
                  "http://www.w3.org/2000/svg",
                  e
                );
                break;
              case 2:
                n = f.createElementNS(
                  "http://www.w3.org/1998/Math/MathML",
                  e
                );
                break;
              default:
                switch (e) {
                  case "svg":
                    n = f.createElementNS(
                      "http://www.w3.org/2000/svg",
                      e
                    );
                    break;
                  case "math":
                    n = f.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      e
                    );
                    break;
                  case "script":
                    n = f.createElement("div"), n.innerHTML = "<script><\/script>", n = n.removeChild(
                      n.firstChild
                    );
                    break;
                  case "select":
                    n = typeof a.is == "string" ? f.createElement("select", {
                      is: a.is
                    }) : f.createElement("select"), a.multiple ? n.multiple = !0 : a.size && (n.size = a.size);
                    break;
                  default:
                    n = typeof a.is == "string" ? f.createElement(e, { is: a.is }) : f.createElement(e);
                }
            }
            n[Ml] = t, n[Gl] = a;
            l: for (f = t.child; f !== null; ) {
              if (f.tag === 5 || f.tag === 6)
                n.appendChild(f.stateNode);
              else if (f.tag !== 4 && f.tag !== 27 && f.child !== null) {
                f.child.return = f, f = f.child;
                continue;
              }
              if (f === t) break l;
              for (; f.sibling === null; ) {
                if (f.return === null || f.return === t)
                  break l;
                f = f.return;
              }
              f.sibling.return = f.return, f = f.sibling;
            }
            t.stateNode = n;
            l: switch (Hl(n, e, a), e) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                a = !!a.autoFocus;
                break l;
              case "img":
                a = !0;
                break l;
              default:
                a = !1;
            }
            a && Qt(t);
          }
        }
        return yl(t), gc(
          t,
          t.type,
          l === null ? null : l.memoizedProps,
          t.pendingProps,
          u
        ), null;
      case 6:
        if (l && t.stateNode != null)
          l.memoizedProps !== a && Qt(t);
        else {
          if (typeof a != "string" && t.stateNode === null)
            throw Error(o(166));
          if (l = Q.current, aa(t)) {
            if (l = t.stateNode, u = t.memoizedProps, a = null, e = Dl, e !== null)
              switch (e.tag) {
                case 27:
                case 5:
                  a = e.memoizedProps;
              }
            l[Ml] = t, l = !!(l.nodeValue === u || a !== null && a.suppressHydrationWarning === !0 || Yv(l.nodeValue, u)), l || lu(t, !0);
          } else
            l = Dn(l).createTextNode(
              a
            ), l[Ml] = t, t.stateNode = l;
        }
        return yl(t), null;
      case 31:
        if (u = t.memoizedState, l === null || l.memoizedState !== null) {
          if (a = aa(t), u !== null) {
            if (l === null) {
              if (!a) throw Error(o(318));
              if (l = t.memoizedState, l = l !== null ? l.dehydrated : null, !l) throw Error(o(557));
              l[Ml] = t;
            } else
              Hu(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            yl(t), l = !1;
          } else
            u = Uf(), l !== null && l.memoizedState !== null && (l.memoizedState.hydrationErrors = u), l = !0;
          if (!l)
            return t.flags & 256 ? (ut(t), t) : (ut(t), null);
          if ((t.flags & 128) !== 0)
            throw Error(o(558));
        }
        return yl(t), null;
      case 13:
        if (a = t.memoizedState, l === null || l.memoizedState !== null && l.memoizedState.dehydrated !== null) {
          if (e = aa(t), a !== null && a.dehydrated !== null) {
            if (l === null) {
              if (!e) throw Error(o(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(o(317));
              e[Ml] = t;
            } else
              Hu(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            yl(t), e = !1;
          } else
            e = Uf(), l !== null && l.memoizedState !== null && (l.memoizedState.hydrationErrors = e), e = !0;
          if (!e)
            return t.flags & 256 ? (ut(t), t) : (ut(t), null);
        }
        return ut(t), (t.flags & 128) !== 0 ? (t.lanes = u, t) : (u = a !== null, l = l !== null && l.memoizedState !== null, u && (a = t.child, e = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (e = a.alternate.memoizedState.cachePool.pool), n = null, a.memoizedState !== null && a.memoizedState.cachePool !== null && (n = a.memoizedState.cachePool.pool), n !== e && (a.flags |= 2048)), u !== l && u && (t.child.flags |= 8192), mn(t, t.updateQueue), yl(t), null);
      case 4:
        return hl(), l === null && Qc(t.stateNode.containerInfo), yl(t), null;
      case 10:
        return Bt(t.type), yl(t), null;
      case 19:
        if (T(sl), a = t.memoizedState, a === null) return yl(t), null;
        if (e = (t.flags & 128) !== 0, n = a.rendering, n === null)
          if (e) le(a, !1);
          else {
            if (dl !== 0 || l !== null && (l.flags & 128) !== 0)
              for (l = t.child; l !== null; ) {
                if (n = ke(l), n !== null) {
                  for (t.flags |= 128, le(a, !1), l = n.updateQueue, t.updateQueue = l, mn(t, l), t.subtreeFlags = 0, l = u, u = t.child; u !== null; )
                    d0(u, l), u = u.sibling;
                  return _(
                    sl,
                    sl.current & 1 | 2
                  ), L && qt(t, a.treeForkCount), t.child;
                }
                l = l.sibling;
              }
            a.tail !== null && Fl() > on && (t.flags |= 128, e = !0, le(a, !1), t.lanes = 4194304);
          }
        else {
          if (!e)
            if (l = ke(n), l !== null) {
              if (t.flags |= 128, e = !0, l = l.updateQueue, t.updateQueue = l, mn(t, l), le(a, !0), a.tail === null && a.tailMode === "hidden" && !n.alternate && !L)
                return yl(t), null;
            } else
              2 * Fl() - a.renderingStartTime > on && u !== 536870912 && (t.flags |= 128, e = !0, le(a, !1), t.lanes = 4194304);
          a.isBackwards ? (n.sibling = t.child, t.child = n) : (l = a.last, l !== null ? l.sibling = n : t.child = n, a.last = n);
        }
        return a.tail !== null ? (l = a.tail, a.rendering = l, a.tail = l.sibling, a.renderingStartTime = Fl(), l.sibling = null, u = sl.current, _(
          sl,
          e ? u & 1 | 2 : u & 1
        ), L && qt(t, a.treeForkCount), l) : (yl(t), null);
      case 22:
      case 23:
        return ut(t), jf(), a = t.memoizedState !== null, l !== null ? l.memoizedState !== null !== a && (t.flags |= 8192) : a && (t.flags |= 8192), a ? (u & 536870912) !== 0 && (t.flags & 128) === 0 && (yl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : yl(t), u = t.updateQueue, u !== null && mn(t, u.retryQueue), u = null, l !== null && l.memoizedState !== null && l.memoizedState.cachePool !== null && (u = l.memoizedState.cachePool.pool), a = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool), a !== u && (t.flags |= 2048), l !== null && T(pu), null;
      case 24:
        return u = null, l !== null && (u = l.memoizedState.cache), t.memoizedState.cache !== u && (t.flags |= 2048), Bt(gl), yl(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(o(156, t.tag));
  }
  function Wm(l, t) {
    switch (Mf(t), t.tag) {
      case 1:
        return l = t.flags, l & 65536 ? (t.flags = l & -65537 | 128, t) : null;
      case 3:
        return Bt(gl), hl(), l = t.flags, (l & 65536) !== 0 && (l & 128) === 0 ? (t.flags = l & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return Ee(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (ut(t), t.alternate === null)
            throw Error(o(340));
          Hu();
        }
        return l = t.flags, l & 65536 ? (t.flags = l & -65537 | 128, t) : null;
      case 13:
        if (ut(t), l = t.memoizedState, l !== null && l.dehydrated !== null) {
          if (t.alternate === null)
            throw Error(o(340));
          Hu();
        }
        return l = t.flags, l & 65536 ? (t.flags = l & -65537 | 128, t) : null;
      case 19:
        return T(sl), null;
      case 4:
        return hl(), null;
      case 10:
        return Bt(t.type), null;
      case 22:
      case 23:
        return ut(t), jf(), l !== null && T(pu), l = t.flags, l & 65536 ? (t.flags = l & -65537 | 128, t) : null;
      case 24:
        return Bt(gl), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Qy(l, t) {
    switch (Mf(t), t.tag) {
      case 3:
        Bt(gl), hl();
        break;
      case 26:
      case 27:
      case 5:
        Ee(t);
        break;
      case 4:
        hl();
        break;
      case 31:
        t.memoizedState !== null && ut(t);
        break;
      case 13:
        ut(t);
        break;
      case 19:
        T(sl);
        break;
      case 10:
        Bt(t.type);
        break;
      case 22:
      case 23:
        ut(t), jf(), l !== null && T(pu);
        break;
      case 24:
        Bt(gl);
    }
  }
  function te(l, t) {
    try {
      var u = t.updateQueue, a = u !== null ? u.lastEffect : null;
      if (a !== null) {
        var e = a.next;
        u = e;
        do {
          if ((u.tag & l) === l) {
            a = void 0;
            var n = u.create, f = u.inst;
            a = n(), f.destroy = a;
          }
          u = u.next;
        } while (u !== e);
      }
    } catch (c) {
      P(t, t.return, c);
    }
  }
  function cu(l, t, u) {
    try {
      var a = t.updateQueue, e = a !== null ? a.lastEffect : null;
      if (e !== null) {
        var n = e.next;
        a = n;
        do {
          if ((a.tag & l) === l) {
            var f = a.inst, c = f.destroy;
            if (c !== void 0) {
              f.destroy = void 0, e = t;
              var i = u, h = c;
              try {
                h();
              } catch (g) {
                P(
                  e,
                  i,
                  g
                );
              }
            }
          }
          a = a.next;
        } while (a !== n);
      }
    } catch (g) {
      P(t, t.return, g);
    }
  }
  function jy(l) {
    var t = l.updateQueue;
    if (t !== null) {
      var u = l.stateNode;
      try {
        N0(t, u);
      } catch (a) {
        P(l, l.return, a);
      }
    }
  }
  function Zy(l, t, u) {
    u.props = Gu(
      l.type,
      l.memoizedProps
    ), u.state = l.memoizedState;
    try {
      u.componentWillUnmount();
    } catch (a) {
      P(l, t, a);
    }
  }
  function ue(l, t) {
    try {
      var u = l.ref;
      if (u !== null) {
        switch (l.tag) {
          case 26:
          case 27:
          case 5:
            var a = l.stateNode;
            break;
          case 30:
            a = l.stateNode;
            break;
          default:
            a = l.stateNode;
        }
        typeof u == "function" ? l.refCleanup = u(a) : u.current = a;
      }
    } catch (e) {
      P(l, t, e);
    }
  }
  function Ut(l, t) {
    var u = l.ref, a = l.refCleanup;
    if (u !== null)
      if (typeof a == "function")
        try {
          a();
        } catch (e) {
          P(l, t, e);
        } finally {
          l.refCleanup = null, l = l.alternate, l != null && (l.refCleanup = null);
        }
      else if (typeof u == "function")
        try {
          u(null);
        } catch (e) {
          P(l, t, e);
        }
      else u.current = null;
  }
  function Vy(l) {
    var t = l.type, u = l.memoizedProps, a = l.stateNode;
    try {
      l: switch (t) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          u.autoFocus && a.focus();
          break l;
        case "img":
          u.src ? a.src = u.src : u.srcSet && (a.srcset = u.srcSet);
      }
    } catch (e) {
      P(l, l.return, e);
    }
  }
  function bc(l, t, u) {
    try {
      var a = l.stateNode;
      od(a, l.type, u, t), a[Gl] = t;
    } catch (e) {
      P(l, l.return, e);
    }
  }
  function xy(l) {
    return l.tag === 5 || l.tag === 3 || l.tag === 26 || l.tag === 27 && su(l.type) || l.tag === 4;
  }
  function zc(l) {
    l: for (; ; ) {
      for (; l.sibling === null; ) {
        if (l.return === null || xy(l.return)) return null;
        l = l.return;
      }
      for (l.sibling.return = l.return, l = l.sibling; l.tag !== 5 && l.tag !== 6 && l.tag !== 18; ) {
        if (l.tag === 27 && su(l.type) || l.flags & 2 || l.child === null || l.tag === 4) continue l;
        l.child.return = l, l = l.child;
      }
      if (!(l.flags & 2)) return l.stateNode;
    }
  }
  function Tc(l, t, u) {
    var a = l.tag;
    if (a === 5 || a === 6)
      l = l.stateNode, t ? (u.nodeType === 9 ? u.body : u.nodeName === "HTML" ? u.ownerDocument.body : u).insertBefore(l, t) : (t = u.nodeType === 9 ? u.body : u.nodeName === "HTML" ? u.ownerDocument.body : u, t.appendChild(l), u = u._reactRootContainer, u != null || t.onclick !== null || (t.onclick = Nt));
    else if (a !== 4 && (a === 27 && su(l.type) && (u = l.stateNode, t = null), l = l.child, l !== null))
      for (Tc(l, t, u), l = l.sibling; l !== null; )
        Tc(l, t, u), l = l.sibling;
  }
  function dn(l, t, u) {
    var a = l.tag;
    if (a === 5 || a === 6)
      l = l.stateNode, t ? u.insertBefore(l, t) : u.appendChild(l);
    else if (a !== 4 && (a === 27 && su(l.type) && (u = l.stateNode), l = l.child, l !== null))
      for (dn(l, t, u), l = l.sibling; l !== null; )
        dn(l, t, u), l = l.sibling;
  }
  function Ly(l) {
    var t = l.stateNode, u = l.memoizedProps;
    try {
      for (var a = l.type, e = t.attributes; e.length; )
        t.removeAttributeNode(e[0]);
      Hl(t, a, u), t[Ml] = l, t[Gl] = u;
    } catch (n) {
      P(l, l.return, n);
    }
  }
  var jt = !1, Tl = !1, Ec = !1, Ky = typeof WeakSet == "function" ? WeakSet : Set, Ol = null;
  function $m(l, t) {
    if (l = l.containerInfo, Vc = qn, l = a0(l), sf(l)) {
      if ("selectionStart" in l)
        var u = {
          start: l.selectionStart,
          end: l.selectionEnd
        };
      else
        l: {
          u = (u = l.ownerDocument) && u.defaultView || window;
          var a = u.getSelection && u.getSelection();
          if (a && a.rangeCount !== 0) {
            u = a.anchorNode;
            var e = a.anchorOffset, n = a.focusNode;
            a = a.focusOffset;
            try {
              u.nodeType, n.nodeType;
            } catch {
              u = null;
              break l;
            }
            var f = 0, c = -1, i = -1, h = 0, g = 0, z = l, s = null;
            t: for (; ; ) {
              for (var S; z !== u || e !== 0 && z.nodeType !== 3 || (c = f + e), z !== n || a !== 0 && z.nodeType !== 3 || (i = f + a), z.nodeType === 3 && (f += z.nodeValue.length), (S = z.firstChild) !== null; )
                s = z, z = S;
              for (; ; ) {
                if (z === l) break t;
                if (s === u && ++h === e && (c = f), s === n && ++g === a && (i = f), (S = z.nextSibling) !== null) break;
                z = s, s = z.parentNode;
              }
              z = S;
            }
            u = c === -1 || i === -1 ? null : { start: c, end: i };
          } else u = null;
        }
      u = u || { start: 0, end: 0 };
    } else u = null;
    for (xc = { focusedElem: l, selectionRange: u }, qn = !1, Ol = t; Ol !== null; )
      if (t = Ol, l = t.child, (t.subtreeFlags & 1028) !== 0 && l !== null)
        l.return = t, Ol = l;
      else
        for (; Ol !== null; ) {
          switch (t = Ol, n = t.alternate, l = t.flags, t.tag) {
            case 0:
              if ((l & 4) !== 0 && (l = t.updateQueue, l = l !== null ? l.events : null, l !== null))
                for (u = 0; u < l.length; u++)
                  e = l[u], e.ref.impl = e.nextImpl;
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((l & 1024) !== 0 && n !== null) {
                l = void 0, u = t, e = n.memoizedProps, n = n.memoizedState, a = u.stateNode;
                try {
                  var D = Gu(
                    u.type,
                    e
                  );
                  l = a.getSnapshotBeforeUpdate(
                    D,
                    n
                  ), a.__reactInternalSnapshotBeforeUpdate = l;
                } catch (p) {
                  P(
                    u,
                    u.return,
                    p
                  );
                }
              }
              break;
            case 3:
              if ((l & 1024) !== 0) {
                if (l = t.stateNode.containerInfo, u = l.nodeType, u === 9)
                  Jc(l);
                else if (u === 1)
                  switch (l.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      Jc(l);
                      break;
                    default:
                      l.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((l & 1024) !== 0) throw Error(o(163));
          }
          if (l = t.sibling, l !== null) {
            l.return = t.return, Ol = l;
            break;
          }
          Ol = t.return;
        }
  }
  function Jy(l, t, u) {
    var a = u.flags;
    switch (u.tag) {
      case 0:
      case 11:
      case 15:
        Vt(l, u), a & 4 && te(5, u);
        break;
      case 1:
        if (Vt(l, u), a & 4)
          if (l = u.stateNode, t === null)
            try {
              l.componentDidMount();
            } catch (f) {
              P(u, u.return, f);
            }
          else {
            var e = Gu(
              u.type,
              t.memoizedProps
            );
            t = t.memoizedState;
            try {
              l.componentDidUpdate(
                e,
                t,
                l.__reactInternalSnapshotBeforeUpdate
              );
            } catch (f) {
              P(
                u,
                u.return,
                f
              );
            }
          }
        a & 64 && jy(u), a & 512 && ue(u, u.return);
        break;
      case 3:
        if (Vt(l, u), a & 64 && (l = u.updateQueue, l !== null)) {
          if (t = null, u.child !== null)
            switch (u.child.tag) {
              case 27:
              case 5:
                t = u.child.stateNode;
                break;
              case 1:
                t = u.child.stateNode;
            }
          try {
            N0(l, t);
          } catch (f) {
            P(u, u.return, f);
          }
        }
        break;
      case 27:
        t === null && a & 4 && Ly(u);
      case 26:
      case 5:
        Vt(l, u), t === null && a & 4 && Vy(u), a & 512 && ue(u, u.return);
        break;
      case 12:
        Vt(l, u);
        break;
      case 31:
        Vt(l, u), a & 4 && $y(l, u);
        break;
      case 13:
        Vt(l, u), a & 4 && Fy(l, u), a & 64 && (l = u.memoizedState, l !== null && (l = l.dehydrated, l !== null && (u = ed.bind(
          null,
          u
        ), Od(l, u))));
        break;
      case 22:
        if (a = u.memoizedState !== null || jt, !a) {
          t = t !== null && t.memoizedState !== null || Tl, e = jt;
          var n = Tl;
          jt = a, (Tl = t) && !n ? xt(
            l,
            u,
            (u.subtreeFlags & 8772) !== 0
          ) : Vt(l, u), jt = e, Tl = n;
        }
        break;
      case 30:
        break;
      default:
        Vt(l, u);
    }
  }
  function wy(l) {
    var t = l.alternate;
    t !== null && (l.alternate = null, wy(t)), l.child = null, l.deletions = null, l.sibling = null, l.tag === 5 && (t = l.stateNode, t !== null && Fn(t)), l.stateNode = null, l.return = null, l.dependencies = null, l.memoizedProps = null, l.memoizedState = null, l.pendingProps = null, l.stateNode = null, l.updateQueue = null;
  }
  var vl = null, Ql = !1;
  function Zt(l, t, u) {
    for (u = u.child; u !== null; )
      Wy(l, t, u), u = u.sibling;
  }
  function Wy(l, t, u) {
    if (kl && typeof kl.onCommitFiberUnmount == "function")
      try {
        kl.onCommitFiberUnmount(Da, u);
      } catch {
      }
    switch (u.tag) {
      case 26:
        Tl || Ut(u, t), Zt(
          l,
          t,
          u
        ), u.memoizedState ? u.memoizedState.count-- : u.stateNode && (u = u.stateNode, u.parentNode.removeChild(u));
        break;
      case 27:
        Tl || Ut(u, t);
        var a = vl, e = Ql;
        su(u.type) && (vl = u.stateNode, Ql = !1), Zt(
          l,
          t,
          u
        ), me(u.stateNode), vl = a, Ql = e;
        break;
      case 5:
        Tl || Ut(u, t);
      case 6:
        if (a = vl, e = Ql, vl = null, Zt(
          l,
          t,
          u
        ), vl = a, Ql = e, vl !== null)
          if (Ql)
            try {
              (vl.nodeType === 9 ? vl.body : vl.nodeName === "HTML" ? vl.ownerDocument.body : vl).removeChild(u.stateNode);
            } catch (n) {
              P(
                u,
                t,
                n
              );
            }
          else
            try {
              vl.removeChild(u.stateNode);
            } catch (n) {
              P(
                u,
                t,
                n
              );
            }
        break;
      case 18:
        vl !== null && (Ql ? (l = vl, jv(
          l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l,
          u.stateNode
        ), Oa(l)) : jv(vl, u.stateNode));
        break;
      case 4:
        a = vl, e = Ql, vl = u.stateNode.containerInfo, Ql = !0, Zt(
          l,
          t,
          u
        ), vl = a, Ql = e;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        cu(2, u, t), Tl || cu(4, u, t), Zt(
          l,
          t,
          u
        );
        break;
      case 1:
        Tl || (Ut(u, t), a = u.stateNode, typeof a.componentWillUnmount == "function" && Zy(
          u,
          t,
          a
        )), Zt(
          l,
          t,
          u
        );
        break;
      case 21:
        Zt(
          l,
          t,
          u
        );
        break;
      case 22:
        Tl = (a = Tl) || u.memoizedState !== null, Zt(
          l,
          t,
          u
        ), Tl = a;
        break;
      default:
        Zt(
          l,
          t,
          u
        );
    }
  }
  function $y(l, t) {
    if (t.memoizedState === null && (l = t.alternate, l !== null && (l = l.memoizedState, l !== null))) {
      l = l.dehydrated;
      try {
        Oa(l);
      } catch (u) {
        P(t, t.return, u);
      }
    }
  }
  function Fy(l, t) {
    if (t.memoizedState === null && (l = t.alternate, l !== null && (l = l.memoizedState, l !== null && (l = l.dehydrated, l !== null))))
      try {
        Oa(l);
      } catch (u) {
        P(t, t.return, u);
      }
  }
  function Fm(l) {
    switch (l.tag) {
      case 31:
      case 13:
      case 19:
        var t = l.stateNode;
        return t === null && (t = l.stateNode = new Ky()), t;
      case 22:
        return l = l.stateNode, t = l._retryCache, t === null && (t = l._retryCache = new Ky()), t;
      default:
        throw Error(o(435, l.tag));
    }
  }
  function hn(l, t) {
    var u = Fm(l);
    t.forEach(function(a) {
      if (!u.has(a)) {
        u.add(a);
        var e = nd.bind(null, l, a);
        a.then(e, e);
      }
    });
  }
  function jl(l, t) {
    var u = t.deletions;
    if (u !== null)
      for (var a = 0; a < u.length; a++) {
        var e = u[a], n = l, f = t, c = f;
        l: for (; c !== null; ) {
          switch (c.tag) {
            case 27:
              if (su(c.type)) {
                vl = c.stateNode, Ql = !1;
                break l;
              }
              break;
            case 5:
              vl = c.stateNode, Ql = !1;
              break l;
            case 3:
            case 4:
              vl = c.stateNode.containerInfo, Ql = !0;
              break l;
          }
          c = c.return;
        }
        if (vl === null) throw Error(o(160));
        Wy(n, f, e), vl = null, Ql = !1, n = e.alternate, n !== null && (n.return = null), e.return = null;
      }
    if (t.subtreeFlags & 13886)
      for (t = t.child; t !== null; )
        ky(t, l), t = t.sibling;
  }
  var Et = null;
  function ky(l, t) {
    var u = l.alternate, a = l.flags;
    switch (l.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        jl(t, l), Zl(l), a & 4 && (cu(3, l, l.return), te(3, l), cu(5, l, l.return));
        break;
      case 1:
        jl(t, l), Zl(l), a & 512 && (Tl || u === null || Ut(u, u.return)), a & 64 && jt && (l = l.updateQueue, l !== null && (a = l.callbacks, a !== null && (u = l.shared.hiddenCallbacks, l.shared.hiddenCallbacks = u === null ? a : u.concat(a))));
        break;
      case 26:
        var e = Et;
        if (jl(t, l), Zl(l), a & 512 && (Tl || u === null || Ut(u, u.return)), a & 4) {
          var n = u !== null ? u.memoizedState : null;
          if (a = l.memoizedState, u === null)
            if (a === null)
              if (l.stateNode === null) {
                l: {
                  a = l.type, u = l.memoizedProps, e = e.ownerDocument || e;
                  t: switch (a) {
                    case "title":
                      n = e.getElementsByTagName("title")[0], (!n || n[Ha] || n[Ml] || n.namespaceURI === "http://www.w3.org/2000/svg" || n.hasAttribute("itemprop")) && (n = e.createElement(a), e.head.insertBefore(
                        n,
                        e.querySelector("head > title")
                      )), Hl(n, a, u), n[Ml] = l, _l(n), a = n;
                      break l;
                    case "link":
                      var f = kv(
                        "link",
                        "href",
                        e
                      ).get(a + (u.href || ""));
                      if (f) {
                        for (var c = 0; c < f.length; c++)
                          if (n = f[c], n.getAttribute("href") === (u.href == null || u.href === "" ? null : u.href) && n.getAttribute("rel") === (u.rel == null ? null : u.rel) && n.getAttribute("title") === (u.title == null ? null : u.title) && n.getAttribute("crossorigin") === (u.crossOrigin == null ? null : u.crossOrigin)) {
                            f.splice(c, 1);
                            break t;
                          }
                      }
                      n = e.createElement(a), Hl(n, a, u), e.head.appendChild(n);
                      break;
                    case "meta":
                      if (f = kv(
                        "meta",
                        "content",
                        e
                      ).get(a + (u.content || ""))) {
                        for (c = 0; c < f.length; c++)
                          if (n = f[c], n.getAttribute("content") === (u.content == null ? null : "" + u.content) && n.getAttribute("name") === (u.name == null ? null : u.name) && n.getAttribute("property") === (u.property == null ? null : u.property) && n.getAttribute("http-equiv") === (u.httpEquiv == null ? null : u.httpEquiv) && n.getAttribute("charset") === (u.charSet == null ? null : u.charSet)) {
                            f.splice(c, 1);
                            break t;
                          }
                      }
                      n = e.createElement(a), Hl(n, a, u), e.head.appendChild(n);
                      break;
                    default:
                      throw Error(o(468, a));
                  }
                  n[Ml] = l, _l(n), a = n;
                }
                l.stateNode = a;
              } else
                Iv(
                  e,
                  l.type,
                  l.stateNode
                );
            else
              l.stateNode = Fv(
                e,
                a,
                l.memoizedProps
              );
          else
            n !== a ? (n === null ? u.stateNode !== null && (u = u.stateNode, u.parentNode.removeChild(u)) : n.count--, a === null ? Iv(
              e,
              l.type,
              l.stateNode
            ) : Fv(
              e,
              a,
              l.memoizedProps
            )) : a === null && l.stateNode !== null && bc(
              l,
              l.memoizedProps,
              u.memoizedProps
            );
        }
        break;
      case 27:
        jl(t, l), Zl(l), a & 512 && (Tl || u === null || Ut(u, u.return)), u !== null && a & 4 && bc(
          l,
          l.memoizedProps,
          u.memoizedProps
        );
        break;
      case 5:
        if (jl(t, l), Zl(l), a & 512 && (Tl || u === null || Ut(u, u.return)), l.flags & 32) {
          e = l.stateNode;
          try {
            wu(e, "");
          } catch (D) {
            P(l, l.return, D);
          }
        }
        a & 4 && l.stateNode != null && (e = l.memoizedProps, bc(
          l,
          e,
          u !== null ? u.memoizedProps : e
        )), a & 1024 && (Ec = !0);
        break;
      case 6:
        if (jl(t, l), Zl(l), a & 4) {
          if (l.stateNode === null)
            throw Error(o(162));
          a = l.memoizedProps, u = l.stateNode;
          try {
            u.nodeValue = a;
          } catch (D) {
            P(l, l.return, D);
          }
        }
        break;
      case 3:
        if (Hn = null, e = Et, Et = Un(t.containerInfo), jl(t, l), Et = e, Zl(l), a & 4 && u !== null && u.memoizedState.isDehydrated)
          try {
            Oa(t.containerInfo);
          } catch (D) {
            P(l, l.return, D);
          }
        Ec && (Ec = !1, Iy(l));
        break;
      case 4:
        a = Et, Et = Un(
          l.stateNode.containerInfo
        ), jl(t, l), Zl(l), Et = a;
        break;
      case 12:
        jl(t, l), Zl(l);
        break;
      case 31:
        jl(t, l), Zl(l), a & 4 && (a = l.updateQueue, a !== null && (l.updateQueue = null, hn(l, a)));
        break;
      case 13:
        jl(t, l), Zl(l), l.child.flags & 8192 && l.memoizedState !== null != (u !== null && u.memoizedState !== null) && (Sn = Fl()), a & 4 && (a = l.updateQueue, a !== null && (l.updateQueue = null, hn(l, a)));
        break;
      case 22:
        e = l.memoizedState !== null;
        var i = u !== null && u.memoizedState !== null, h = jt, g = Tl;
        if (jt = h || e, Tl = g || i, jl(t, l), Tl = g, jt = h, Zl(l), a & 8192)
          l: for (t = l.stateNode, t._visibility = e ? t._visibility & -2 : t._visibility | 1, e && (u === null || i || jt || Tl || Xu(l)), u = null, t = l; ; ) {
            if (t.tag === 5 || t.tag === 26) {
              if (u === null) {
                i = u = t;
                try {
                  if (n = i.stateNode, e)
                    f = n.style, typeof f.setProperty == "function" ? f.setProperty("display", "none", "important") : f.display = "none";
                  else {
                    c = i.stateNode;
                    var z = i.memoizedProps.style, s = z != null && z.hasOwnProperty("display") ? z.display : null;
                    c.style.display = s == null || typeof s == "boolean" ? "" : ("" + s).trim();
                  }
                } catch (D) {
                  P(i, i.return, D);
                }
              }
            } else if (t.tag === 6) {
              if (u === null) {
                i = t;
                try {
                  i.stateNode.nodeValue = e ? "" : i.memoizedProps;
                } catch (D) {
                  P(i, i.return, D);
                }
              }
            } else if (t.tag === 18) {
              if (u === null) {
                i = t;
                try {
                  var S = i.stateNode;
                  e ? Zv(S, !0) : Zv(i.stateNode, !1);
                } catch (D) {
                  P(i, i.return, D);
                }
              }
            } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === l) && t.child !== null) {
              t.child.return = t, t = t.child;
              continue;
            }
            if (t === l) break l;
            for (; t.sibling === null; ) {
              if (t.return === null || t.return === l) break l;
              u === t && (u = null), t = t.return;
            }
            u === t && (u = null), t.sibling.return = t.return, t = t.sibling;
          }
        a & 4 && (a = l.updateQueue, a !== null && (u = a.retryQueue, u !== null && (a.retryQueue = null, hn(l, u))));
        break;
      case 19:
        jl(t, l), Zl(l), a & 4 && (a = l.updateQueue, a !== null && (l.updateQueue = null, hn(l, a)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        jl(t, l), Zl(l);
    }
  }
  function Zl(l) {
    var t = l.flags;
    if (t & 2) {
      try {
        for (var u, a = l.return; a !== null; ) {
          if (xy(a)) {
            u = a;
            break;
          }
          a = a.return;
        }
        if (u == null) throw Error(o(160));
        switch (u.tag) {
          case 27:
            var e = u.stateNode, n = zc(l);
            dn(l, n, e);
            break;
          case 5:
            var f = u.stateNode;
            u.flags & 32 && (wu(f, ""), u.flags &= -33);
            var c = zc(l);
            dn(l, c, f);
            break;
          case 3:
          case 4:
            var i = u.stateNode.containerInfo, h = zc(l);
            Tc(
              l,
              h,
              i
            );
            break;
          default:
            throw Error(o(161));
        }
      } catch (g) {
        P(l, l.return, g);
      }
      l.flags &= -3;
    }
    t & 4096 && (l.flags &= -4097);
  }
  function Iy(l) {
    if (l.subtreeFlags & 1024)
      for (l = l.child; l !== null; ) {
        var t = l;
        Iy(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), l = l.sibling;
      }
  }
  function Vt(l, t) {
    if (t.subtreeFlags & 8772)
      for (t = t.child; t !== null; )
        Jy(l, t.alternate, t), t = t.sibling;
  }
  function Xu(l) {
    for (l = l.child; l !== null; ) {
      var t = l;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          cu(4, t, t.return), Xu(t);
          break;
        case 1:
          Ut(t, t.return);
          var u = t.stateNode;
          typeof u.componentWillUnmount == "function" && Zy(
            t,
            t.return,
            u
          ), Xu(t);
          break;
        case 27:
          me(t.stateNode);
        case 26:
        case 5:
          Ut(t, t.return), Xu(t);
          break;
        case 22:
          t.memoizedState === null && Xu(t);
          break;
        case 30:
          Xu(t);
          break;
        default:
          Xu(t);
      }
      l = l.sibling;
    }
  }
  function xt(l, t, u) {
    for (u = u && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
      var a = t.alternate, e = l, n = t, f = n.flags;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          xt(
            e,
            n,
            u
          ), te(4, n);
          break;
        case 1:
          if (xt(
            e,
            n,
            u
          ), a = n, e = a.stateNode, typeof e.componentDidMount == "function")
            try {
              e.componentDidMount();
            } catch (h) {
              P(a, a.return, h);
            }
          if (a = n, e = a.updateQueue, e !== null) {
            var c = a.stateNode;
            try {
              var i = e.shared.hiddenCallbacks;
              if (i !== null)
                for (e.shared.hiddenCallbacks = null, e = 0; e < i.length; e++)
                  H0(i[e], c);
            } catch (h) {
              P(a, a.return, h);
            }
          }
          u && f & 64 && jy(n), ue(n, n.return);
          break;
        case 27:
          Ly(n);
        case 26:
        case 5:
          xt(
            e,
            n,
            u
          ), u && a === null && f & 4 && Vy(n), ue(n, n.return);
          break;
        case 12:
          xt(
            e,
            n,
            u
          );
          break;
        case 31:
          xt(
            e,
            n,
            u
          ), u && f & 4 && $y(e, n);
          break;
        case 13:
          xt(
            e,
            n,
            u
          ), u && f & 4 && Fy(e, n);
          break;
        case 22:
          n.memoizedState === null && xt(
            e,
            n,
            u
          ), ue(n, n.return);
          break;
        case 30:
          break;
        default:
          xt(
            e,
            n,
            u
          );
      }
      t = t.sibling;
    }
  }
  function Ac(l, t) {
    var u = null;
    l !== null && l.memoizedState !== null && l.memoizedState.cachePool !== null && (u = l.memoizedState.cachePool.pool), l = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (l = t.memoizedState.cachePool.pool), l !== u && (l != null && l.refCount++, u != null && Va(u));
  }
  function _c(l, t) {
    l = null, t.alternate !== null && (l = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== l && (t.refCount++, l != null && Va(l));
  }
  function At(l, t, u, a) {
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; )
        Py(
          l,
          t,
          u,
          a
        ), t = t.sibling;
  }
  function Py(l, t, u, a) {
    var e = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        At(
          l,
          t,
          u,
          a
        ), e & 2048 && te(9, t);
        break;
      case 1:
        At(
          l,
          t,
          u,
          a
        );
        break;
      case 3:
        At(
          l,
          t,
          u,
          a
        ), e & 2048 && (l = null, t.alternate !== null && (l = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== l && (t.refCount++, l != null && Va(l)));
        break;
      case 12:
        if (e & 2048) {
          At(
            l,
            t,
            u,
            a
          ), l = t.stateNode;
          try {
            var n = t.memoizedProps, f = n.id, c = n.onPostCommit;
            typeof c == "function" && c(
              f,
              t.alternate === null ? "mount" : "update",
              l.passiveEffectDuration,
              -0
            );
          } catch (i) {
            P(t, t.return, i);
          }
        } else
          At(
            l,
            t,
            u,
            a
          );
        break;
      case 31:
        At(
          l,
          t,
          u,
          a
        );
        break;
      case 13:
        At(
          l,
          t,
          u,
          a
        );
        break;
      case 23:
        break;
      case 22:
        n = t.stateNode, f = t.alternate, t.memoizedState !== null ? n._visibility & 2 ? At(
          l,
          t,
          u,
          a
        ) : ae(l, t) : n._visibility & 2 ? At(
          l,
          t,
          u,
          a
        ) : (n._visibility |= 2, ha(
          l,
          t,
          u,
          a,
          (t.subtreeFlags & 10256) !== 0 || !1
        )), e & 2048 && Ac(f, t);
        break;
      case 24:
        At(
          l,
          t,
          u,
          a
        ), e & 2048 && _c(t.alternate, t);
        break;
      default:
        At(
          l,
          t,
          u,
          a
        );
    }
  }
  function ha(l, t, u, a, e) {
    for (e = e && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var n = l, f = t, c = u, i = a, h = f.flags;
      switch (f.tag) {
        case 0:
        case 11:
        case 15:
          ha(
            n,
            f,
            c,
            i,
            e
          ), te(8, f);
          break;
        case 23:
          break;
        case 22:
          var g = f.stateNode;
          f.memoizedState !== null ? g._visibility & 2 ? ha(
            n,
            f,
            c,
            i,
            e
          ) : ae(
            n,
            f
          ) : (g._visibility |= 2, ha(
            n,
            f,
            c,
            i,
            e
          )), e && h & 2048 && Ac(
            f.alternate,
            f
          );
          break;
        case 24:
          ha(
            n,
            f,
            c,
            i,
            e
          ), e && h & 2048 && _c(f.alternate, f);
          break;
        default:
          ha(
            n,
            f,
            c,
            i,
            e
          );
      }
      t = t.sibling;
    }
  }
  function ae(l, t) {
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; ) {
        var u = l, a = t, e = a.flags;
        switch (a.tag) {
          case 22:
            ae(u, a), e & 2048 && Ac(
              a.alternate,
              a
            );
            break;
          case 24:
            ae(u, a), e & 2048 && _c(a.alternate, a);
            break;
          default:
            ae(u, a);
        }
        t = t.sibling;
      }
  }
  var ee = 8192;
  function sa(l, t, u) {
    if (l.subtreeFlags & ee)
      for (l = l.child; l !== null; )
        lv(
          l,
          t,
          u
        ), l = l.sibling;
  }
  function lv(l, t, u) {
    switch (l.tag) {
      case 26:
        sa(
          l,
          t,
          u
        ), l.flags & ee && l.memoizedState !== null && Cd(
          u,
          Et,
          l.memoizedState,
          l.memoizedProps
        );
        break;
      case 5:
        sa(
          l,
          t,
          u
        );
        break;
      case 3:
      case 4:
        var a = Et;
        Et = Un(l.stateNode.containerInfo), sa(
          l,
          t,
          u
        ), Et = a;
        break;
      case 22:
        l.memoizedState === null && (a = l.alternate, a !== null && a.memoizedState !== null ? (a = ee, ee = 16777216, sa(
          l,
          t,
          u
        ), ee = a) : sa(
          l,
          t,
          u
        ));
        break;
      default:
        sa(
          l,
          t,
          u
        );
    }
  }
  function tv(l) {
    var t = l.alternate;
    if (t !== null && (l = t.child, l !== null)) {
      t.child = null;
      do
        t = l.sibling, l.sibling = null, l = t;
      while (l !== null);
    }
  }
  function ne(l) {
    var t = l.deletions;
    if ((l.flags & 16) !== 0) {
      if (t !== null)
        for (var u = 0; u < t.length; u++) {
          var a = t[u];
          Ol = a, av(
            a,
            l
          );
        }
      tv(l);
    }
    if (l.subtreeFlags & 10256)
      for (l = l.child; l !== null; )
        uv(l), l = l.sibling;
  }
  function uv(l) {
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        ne(l), l.flags & 2048 && cu(9, l, l.return);
        break;
      case 3:
        ne(l);
        break;
      case 12:
        ne(l);
        break;
      case 22:
        var t = l.stateNode;
        l.memoizedState !== null && t._visibility & 2 && (l.return === null || l.return.tag !== 13) ? (t._visibility &= -3, sn(l)) : ne(l);
        break;
      default:
        ne(l);
    }
  }
  function sn(l) {
    var t = l.deletions;
    if ((l.flags & 16) !== 0) {
      if (t !== null)
        for (var u = 0; u < t.length; u++) {
          var a = t[u];
          Ol = a, av(
            a,
            l
          );
        }
      tv(l);
    }
    for (l = l.child; l !== null; ) {
      switch (t = l, t.tag) {
        case 0:
        case 11:
        case 15:
          cu(8, t, t.return), sn(t);
          break;
        case 22:
          u = t.stateNode, u._visibility & 2 && (u._visibility &= -3, sn(t));
          break;
        default:
          sn(t);
      }
      l = l.sibling;
    }
  }
  function av(l, t) {
    for (; Ol !== null; ) {
      var u = Ol;
      switch (u.tag) {
        case 0:
        case 11:
        case 15:
          cu(8, u, t);
          break;
        case 23:
        case 22:
          if (u.memoizedState !== null && u.memoizedState.cachePool !== null) {
            var a = u.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          Va(u.memoizedState.cache);
      }
      if (a = u.child, a !== null) a.return = u, Ol = a;
      else
        l: for (u = l; Ol !== null; ) {
          a = Ol;
          var e = a.sibling, n = a.return;
          if (wy(a), a === u) {
            Ol = null;
            break l;
          }
          if (e !== null) {
            e.return = n, Ol = e;
            break l;
          }
          Ol = n;
        }
    }
  }
  var km = {
    getCacheForType: function(l) {
      var t = Ul(gl), u = t.data.get(l);
      return u === void 0 && (u = l(), t.data.set(l, u)), u;
    },
    cacheSignal: function() {
      return Ul(gl).controller.signal;
    }
  }, Im = typeof WeakMap == "function" ? WeakMap : Map, $ = 0, el = null, j = null, V = 0, I = 0, at = null, iu = !1, Sa = !1, Oc = !1, Lt = 0, dl = 0, yu = 0, Qu = 0, Mc = 0, et = 0, oa = 0, fe = null, Vl = null, Dc = !1, Sn = 0, ev = 0, on = 1 / 0, gn = null, vu = null, El = 0, mu = null, ga = null, Kt = 0, Uc = 0, rc = null, nv = null, ce = 0, Hc = null;
  function nt() {
    return ($ & 2) !== 0 && V !== 0 ? V & -V : A.T !== null ? Bc() : Ei();
  }
  function fv() {
    if (et === 0)
      if ((V & 536870912) === 0 || L) {
        var l = Oe;
        Oe <<= 1, (Oe & 3932160) === 0 && (Oe = 262144), et = l;
      } else et = 536870912;
    return l = tt.current, l !== null && (l.flags |= 32), et;
  }
  function xl(l, t, u) {
    (l === el && (I === 2 || I === 9) || l.cancelPendingCommit !== null) && (ba(l, 0), du(
      l,
      V,
      et,
      !1
    )), ra(l, u), (($ & 2) === 0 || l !== el) && (l === el && (($ & 2) === 0 && (Qu |= u), dl === 4 && du(
      l,
      V,
      et,
      !1
    )), rt(l));
  }
  function cv(l, t, u) {
    if (($ & 6) !== 0) throw Error(o(327));
    var a = !u && (t & 127) === 0 && (t & l.expiredLanes) === 0 || Ua(l, t), e = a ? td(l, t) : Rc(l, t, !0), n = a;
    do {
      if (e === 0) {
        Sa && !a && du(l, t, 0, !1);
        break;
      } else {
        if (u = l.current.alternate, n && !Pm(u)) {
          e = Rc(l, t, !1), n = !1;
          continue;
        }
        if (e === 2) {
          if (n = t, l.errorRecoveryDisabledLanes & n)
            var f = 0;
          else
            f = l.pendingLanes & -536870913, f = f !== 0 ? f : f & 536870912 ? 536870912 : 0;
          if (f !== 0) {
            t = f;
            l: {
              var c = l;
              e = fe;
              var i = c.current.memoizedState.isDehydrated;
              if (i && (ba(c, f).flags |= 256), f = Rc(
                c,
                f,
                !1
              ), f !== 2) {
                if (Oc && !i) {
                  c.errorRecoveryDisabledLanes |= n, Qu |= n, e = 4;
                  break l;
                }
                n = Vl, Vl = e, n !== null && (Vl === null ? Vl = n : Vl.push.apply(
                  Vl,
                  n
                ));
              }
              e = f;
            }
            if (n = !1, e !== 2) continue;
          }
        }
        if (e === 1) {
          ba(l, 0), du(l, t, 0, !0);
          break;
        }
        l: {
          switch (a = l, n = e, n) {
            case 0:
            case 1:
              throw Error(o(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              du(
                a,
                t,
                et,
                !iu
              );
              break l;
            case 2:
              Vl = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(o(329));
          }
          if ((t & 62914560) === t && (e = Sn + 300 - Fl(), 10 < e)) {
            if (du(
              a,
              t,
              et,
              !iu
            ), De(a, 0, !0) !== 0) break l;
            Kt = t, a.timeoutHandle = Xv(
              iv.bind(
                null,
                a,
                u,
                Vl,
                gn,
                Dc,
                t,
                et,
                Qu,
                oa,
                iu,
                n,
                "Throttled",
                -0,
                0
              ),
              e
            );
            break l;
          }
          iv(
            a,
            u,
            Vl,
            gn,
            Dc,
            t,
            et,
            Qu,
            oa,
            iu,
            n,
            null,
            -0,
            0
          );
        }
      }
      break;
    } while (!0);
    rt(l);
  }
  function iv(l, t, u, a, e, n, f, c, i, h, g, z, s, S) {
    if (l.timeoutHandle = -1, z = t.subtreeFlags, z & 8192 || (z & 16785408) === 16785408) {
      z = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: Nt
      }, lv(
        t,
        n,
        z
      );
      var D = (n & 62914560) === n ? Sn - Fl() : (n & 4194048) === n ? ev - Fl() : 0;
      if (D = Gd(
        z,
        D
      ), D !== null) {
        Kt = n, l.cancelPendingCommit = D(
          ov.bind(
            null,
            l,
            t,
            n,
            u,
            a,
            e,
            f,
            c,
            i,
            g,
            z,
            null,
            s,
            S
          )
        ), du(l, n, f, !h);
        return;
      }
    }
    ov(
      l,
      t,
      n,
      u,
      a,
      e,
      f,
      c,
      i
    );
  }
  function Pm(l) {
    for (var t = l; ; ) {
      var u = t.tag;
      if ((u === 0 || u === 11 || u === 15) && t.flags & 16384 && (u = t.updateQueue, u !== null && (u = u.stores, u !== null)))
        for (var a = 0; a < u.length; a++) {
          var e = u[a], n = e.getSnapshot;
          e = e.value;
          try {
            if (!Pl(n(), e)) return !1;
          } catch {
            return !1;
          }
        }
      if (u = t.child, t.subtreeFlags & 16384 && u !== null)
        u.return = t, t = u;
      else {
        if (t === l) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === l) return !0;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    }
    return !0;
  }
  function du(l, t, u, a) {
    t &= ~Mc, t &= ~Qu, l.suspendedLanes |= t, l.pingedLanes &= ~t, a && (l.warmLanes |= t), a = l.expirationTimes;
    for (var e = t; 0 < e; ) {
      var n = 31 - Il(e), f = 1 << n;
      a[n] = -1, e &= ~f;
    }
    u !== 0 && bi(l, u, t);
  }
  function bn() {
    return ($ & 6) === 0 ? (ie(0), !1) : !0;
  }
  function Nc() {
    if (j !== null) {
      if (I === 0)
        var l = j.return;
      else
        l = j, Yt = Nu = null, Jf(l), ia = null, La = 0, l = j;
      for (; l !== null; )
        Qy(l.alternate, l), l = l.return;
      j = null;
    }
  }
  function ba(l, t) {
    var u = l.timeoutHandle;
    u !== -1 && (l.timeoutHandle = -1, zd(u)), u = l.cancelPendingCommit, u !== null && (l.cancelPendingCommit = null, u()), Kt = 0, Nc(), el = l, j = u = pt(l.current, null), V = t, I = 0, at = null, iu = !1, Sa = Ua(l, t), Oc = !1, oa = et = Mc = Qu = yu = dl = 0, Vl = fe = null, Dc = !1, (t & 8) !== 0 && (t |= t & 32);
    var a = l.entangledLanes;
    if (a !== 0)
      for (l = l.entanglements, a &= t; 0 < a; ) {
        var e = 31 - Il(a), n = 1 << e;
        t |= l[e], a &= ~n;
      }
    return Lt = t, Xe(), u;
  }
  function yv(l, t) {
    B = null, A.H = Ia, t === ca || t === Je ? (t = M0(), I = 3) : t === Yf ? (t = M0(), I = 4) : I = t === ic ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, at = t, j === null && (dl = 1, fn(
      l,
      vt(t, l.current)
    ));
  }
  function vv() {
    var l = tt.current;
    return l === null ? !0 : (V & 4194048) === V ? st === null : (V & 62914560) === V || (V & 536870912) !== 0 ? l === st : !1;
  }
  function mv() {
    var l = A.H;
    return A.H = Ia, l === null ? Ia : l;
  }
  function dv() {
    var l = A.A;
    return A.A = km, l;
  }
  function zn() {
    dl = 4, iu || (V & 4194048) !== V && tt.current !== null || (Sa = !0), (yu & 134217727) === 0 && (Qu & 134217727) === 0 || el === null || du(
      el,
      V,
      et,
      !1
    );
  }
  function Rc(l, t, u) {
    var a = $;
    $ |= 2;
    var e = mv(), n = dv();
    (el !== l || V !== t) && (gn = null, ba(l, t)), t = !1;
    var f = dl;
    l: do
      try {
        if (I !== 0 && j !== null) {
          var c = j, i = at;
          switch (I) {
            case 8:
              Nc(), f = 6;
              break l;
            case 3:
            case 2:
            case 9:
            case 6:
              tt.current === null && (t = !0);
              var h = I;
              if (I = 0, at = null, za(l, c, i, h), u && Sa) {
                f = 0;
                break l;
              }
              break;
            default:
              h = I, I = 0, at = null, za(l, c, i, h);
          }
        }
        ld(), f = dl;
        break;
      } catch (g) {
        yv(l, g);
      }
    while (!0);
    return t && l.shellSuspendCounter++, Yt = Nu = null, $ = a, A.H = e, A.A = n, j === null && (el = null, V = 0, Xe()), f;
  }
  function ld() {
    for (; j !== null; ) hv(j);
  }
  function td(l, t) {
    var u = $;
    $ |= 2;
    var a = mv(), e = dv();
    el !== l || V !== t ? (gn = null, on = Fl() + 500, ba(l, t)) : Sa = Ua(
      l,
      t
    );
    l: do
      try {
        if (I !== 0 && j !== null) {
          t = j;
          var n = at;
          t: switch (I) {
            case 1:
              I = 0, at = null, za(l, t, n, 1);
              break;
            case 2:
            case 9:
              if (_0(n)) {
                I = 0, at = null, sv(t);
                break;
              }
              t = function() {
                I !== 2 && I !== 9 || el !== l || (I = 7), rt(l);
              }, n.then(t, t);
              break l;
            case 3:
              I = 7;
              break l;
            case 4:
              I = 5;
              break l;
            case 7:
              _0(n) ? (I = 0, at = null, sv(t)) : (I = 0, at = null, za(l, t, n, 7));
              break;
            case 5:
              var f = null;
              switch (j.tag) {
                case 26:
                  f = j.memoizedState;
                case 5:
                case 27:
                  var c = j;
                  if (f ? Pv(f) : c.stateNode.complete) {
                    I = 0, at = null;
                    var i = c.sibling;
                    if (i !== null) j = i;
                    else {
                      var h = c.return;
                      h !== null ? (j = h, Tn(h)) : j = null;
                    }
                    break t;
                  }
              }
              I = 0, at = null, za(l, t, n, 5);
              break;
            case 6:
              I = 0, at = null, za(l, t, n, 6);
              break;
            case 8:
              Nc(), dl = 6;
              break l;
            default:
              throw Error(o(462));
          }
        }
        ud();
        break;
      } catch (g) {
        yv(l, g);
      }
    while (!0);
    return Yt = Nu = null, A.H = a, A.A = e, $ = u, j !== null ? 0 : (el = null, V = 0, Xe(), dl);
  }
  function ud() {
    for (; j !== null && !M1(); )
      hv(j);
  }
  function hv(l) {
    var t = Gy(l.alternate, l, Lt);
    l.memoizedProps = l.pendingProps, t === null ? Tn(l) : j = t;
  }
  function sv(l) {
    var t = l, u = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = Ry(
          u,
          t,
          t.pendingProps,
          t.type,
          void 0,
          V
        );
        break;
      case 11:
        t = Ry(
          u,
          t,
          t.pendingProps,
          t.type.render,
          t.ref,
          V
        );
        break;
      case 5:
        Jf(t);
      default:
        Qy(u, t), t = j = d0(t, Lt), t = Gy(u, t, Lt);
    }
    l.memoizedProps = l.pendingProps, t === null ? Tn(l) : j = t;
  }
  function za(l, t, u, a) {
    Yt = Nu = null, Jf(t), ia = null, La = 0;
    var e = t.return;
    try {
      if (Lm(
        l,
        e,
        t,
        u,
        V
      )) {
        dl = 1, fn(
          l,
          vt(u, l.current)
        ), j = null;
        return;
      }
    } catch (n) {
      if (e !== null) throw j = e, n;
      dl = 1, fn(
        l,
        vt(u, l.current)
      ), j = null;
      return;
    }
    t.flags & 32768 ? (L || a === 1 ? l = !0 : Sa || (V & 536870912) !== 0 ? l = !1 : (iu = l = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = tt.current, a !== null && a.tag === 13 && (a.flags |= 16384))), Sv(t, l)) : Tn(t);
  }
  function Tn(l) {
    var t = l;
    do {
      if ((t.flags & 32768) !== 0) {
        Sv(
          t,
          iu
        );
        return;
      }
      l = t.return;
      var u = wm(
        t.alternate,
        t,
        Lt
      );
      if (u !== null) {
        j = u;
        return;
      }
      if (t = t.sibling, t !== null) {
        j = t;
        return;
      }
      j = t = l;
    } while (t !== null);
    dl === 0 && (dl = 5);
  }
  function Sv(l, t) {
    do {
      var u = Wm(l.alternate, l);
      if (u !== null) {
        u.flags &= 32767, j = u;
        return;
      }
      if (u = l.return, u !== null && (u.flags |= 32768, u.subtreeFlags = 0, u.deletions = null), !t && (l = l.sibling, l !== null)) {
        j = l;
        return;
      }
      j = l = u;
    } while (l !== null);
    dl = 6, j = null;
  }
  function ov(l, t, u, a, e, n, f, c, i) {
    l.cancelPendingCommit = null;
    do
      En();
    while (El !== 0);
    if (($ & 6) !== 0) throw Error(o(327));
    if (t !== null) {
      if (t === l.current) throw Error(o(177));
      if (n = t.lanes | t.childLanes, n |= zf, B1(
        l,
        u,
        n,
        f,
        c,
        i
      ), l === el && (j = el = null, V = 0), ga = t, mu = l, Kt = u, Uc = n, rc = e, nv = a, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (l.callbackNode = null, l.callbackPriority = 0, fd(Ae, function() {
        return Ev(), null;
      })) : (l.callbackNode = null, l.callbackPriority = 0), a = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || a) {
        a = A.T, A.T = null, e = O.p, O.p = 2, f = $, $ |= 4;
        try {
          $m(l, t, u);
        } finally {
          $ = f, O.p = e, A.T = a;
        }
      }
      El = 1, gv(), bv(), zv();
    }
  }
  function gv() {
    if (El === 1) {
      El = 0;
      var l = mu, t = ga, u = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || u) {
        u = A.T, A.T = null;
        var a = O.p;
        O.p = 2;
        var e = $;
        $ |= 4;
        try {
          ky(t, l);
          var n = xc, f = a0(l.containerInfo), c = n.focusedElem, i = n.selectionRange;
          if (f !== c && c && c.ownerDocument && u0(
            c.ownerDocument.documentElement,
            c
          )) {
            if (i !== null && sf(c)) {
              var h = i.start, g = i.end;
              if (g === void 0 && (g = h), "selectionStart" in c)
                c.selectionStart = h, c.selectionEnd = Math.min(
                  g,
                  c.value.length
                );
              else {
                var z = c.ownerDocument || document, s = z && z.defaultView || window;
                if (s.getSelection) {
                  var S = s.getSelection(), D = c.textContent.length, p = Math.min(i.start, D), al = i.end === void 0 ? p : Math.min(i.end, D);
                  !S.extend && p > al && (f = al, al = p, p = f);
                  var m = t0(
                    c,
                    p
                  ), y = t0(
                    c,
                    al
                  );
                  if (m && y && (S.rangeCount !== 1 || S.anchorNode !== m.node || S.anchorOffset !== m.offset || S.focusNode !== y.node || S.focusOffset !== y.offset)) {
                    var d = z.createRange();
                    d.setStart(m.node, m.offset), S.removeAllRanges(), p > al ? (S.addRange(d), S.extend(y.node, y.offset)) : (d.setEnd(y.node, y.offset), S.addRange(d));
                  }
                }
              }
            }
            for (z = [], S = c; S = S.parentNode; )
              S.nodeType === 1 && z.push({
                element: S,
                left: S.scrollLeft,
                top: S.scrollTop
              });
            for (typeof c.focus == "function" && c.focus(), c = 0; c < z.length; c++) {
              var b = z[c];
              b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
            }
          }
          qn = !!Vc, xc = Vc = null;
        } finally {
          $ = e, O.p = a, A.T = u;
        }
      }
      l.current = t, El = 2;
    }
  }
  function bv() {
    if (El === 2) {
      El = 0;
      var l = mu, t = ga, u = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || u) {
        u = A.T, A.T = null;
        var a = O.p;
        O.p = 2;
        var e = $;
        $ |= 4;
        try {
          Jy(l, t.alternate, t);
        } finally {
          $ = e, O.p = a, A.T = u;
        }
      }
      El = 3;
    }
  }
  function zv() {
    if (El === 4 || El === 3) {
      El = 0, D1();
      var l = mu, t = ga, u = Kt, a = nv;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? El = 5 : (El = 0, ga = mu = null, Tv(l, l.pendingLanes));
      var e = l.pendingLanes;
      if (e === 0 && (vu = null), Wn(u), t = t.stateNode, kl && typeof kl.onCommitFiberRoot == "function")
        try {
          kl.onCommitFiberRoot(
            Da,
            t,
            void 0,
            (t.current.flags & 128) === 128
          );
        } catch {
        }
      if (a !== null) {
        t = A.T, e = O.p, O.p = 2, A.T = null;
        try {
          for (var n = l.onRecoverableError, f = 0; f < a.length; f++) {
            var c = a[f];
            n(c.value, {
              componentStack: c.stack
            });
          }
        } finally {
          A.T = t, O.p = e;
        }
      }
      (Kt & 3) !== 0 && En(), rt(l), e = l.pendingLanes, (u & 261930) !== 0 && (e & 42) !== 0 ? l === Hc ? ce++ : (ce = 0, Hc = l) : ce = 0, ie(0);
    }
  }
  function Tv(l, t) {
    (l.pooledCacheLanes &= t) === 0 && (t = l.pooledCache, t != null && (l.pooledCache = null, Va(t)));
  }
  function En() {
    return gv(), bv(), zv(), Ev();
  }
  function Ev() {
    if (El !== 5) return !1;
    var l = mu, t = Uc;
    Uc = 0;
    var u = Wn(Kt), a = A.T, e = O.p;
    try {
      O.p = 32 > u ? 32 : u, A.T = null, u = rc, rc = null;
      var n = mu, f = Kt;
      if (El = 0, ga = mu = null, Kt = 0, ($ & 6) !== 0) throw Error(o(331));
      var c = $;
      if ($ |= 4, uv(n.current), Py(
        n,
        n.current,
        f,
        u
      ), $ = c, ie(0, !1), kl && typeof kl.onPostCommitFiberRoot == "function")
        try {
          kl.onPostCommitFiberRoot(Da, n);
        } catch {
        }
      return !0;
    } finally {
      O.p = e, A.T = a, Tv(l, t);
    }
  }
  function Av(l, t, u) {
    t = vt(u, t), t = cc(l.stateNode, t, 2), l = eu(l, t, 2), l !== null && (ra(l, 2), rt(l));
  }
  function P(l, t, u) {
    if (l.tag === 3)
      Av(l, l, u);
    else
      for (; t !== null; ) {
        if (t.tag === 3) {
          Av(
            t,
            l,
            u
          );
          break;
        } else if (t.tag === 1) {
          var a = t.stateNode;
          if (typeof t.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (vu === null || !vu.has(a))) {
            l = vt(u, l), u = _y(2), a = eu(t, u, 2), a !== null && (Oy(
              u,
              a,
              t,
              l
            ), ra(a, 2), rt(a));
            break;
          }
        }
        t = t.return;
      }
  }
  function pc(l, t, u) {
    var a = l.pingCache;
    if (a === null) {
      a = l.pingCache = new Im();
      var e = /* @__PURE__ */ new Set();
      a.set(t, e);
    } else
      e = a.get(t), e === void 0 && (e = /* @__PURE__ */ new Set(), a.set(t, e));
    e.has(u) || (Oc = !0, e.add(u), l = ad.bind(null, l, t, u), t.then(l, l));
  }
  function ad(l, t, u) {
    var a = l.pingCache;
    a !== null && a.delete(t), l.pingedLanes |= l.suspendedLanes & u, l.warmLanes &= ~u, el === l && (V & u) === u && (dl === 4 || dl === 3 && (V & 62914560) === V && 300 > Fl() - Sn ? ($ & 2) === 0 && ba(l, 0) : Mc |= u, oa === V && (oa = 0)), rt(l);
  }
  function _v(l, t) {
    t === 0 && (t = gi()), l = Uu(l, t), l !== null && (ra(l, t), rt(l));
  }
  function ed(l) {
    var t = l.memoizedState, u = 0;
    t !== null && (u = t.retryLane), _v(l, u);
  }
  function nd(l, t) {
    var u = 0;
    switch (l.tag) {
      case 31:
      case 13:
        var a = l.stateNode, e = l.memoizedState;
        e !== null && (u = e.retryLane);
        break;
      case 19:
        a = l.stateNode;
        break;
      case 22:
        a = l.stateNode._retryCache;
        break;
      default:
        throw Error(o(314));
    }
    a !== null && a.delete(t), _v(l, u);
  }
  function fd(l, t) {
    return Ln(l, t);
  }
  var An = null, Ta = null, qc = !1, _n = !1, Yc = !1, hu = 0;
  function rt(l) {
    l !== Ta && l.next === null && (Ta === null ? An = Ta = l : Ta = Ta.next = l), _n = !0, qc || (qc = !0, id());
  }
  function ie(l, t) {
    if (!Yc && _n) {
      Yc = !0;
      do
        for (var u = !1, a = An; a !== null; ) {
          if (l !== 0) {
            var e = a.pendingLanes;
            if (e === 0) var n = 0;
            else {
              var f = a.suspendedLanes, c = a.pingedLanes;
              n = (1 << 31 - Il(42 | l) + 1) - 1, n &= e & ~(f & ~c), n = n & 201326741 ? n & 201326741 | 1 : n ? n | 2 : 0;
            }
            n !== 0 && (u = !0, Uv(a, n));
          } else
            n = V, n = De(
              a,
              a === el ? n : 0,
              a.cancelPendingCommit !== null || a.timeoutHandle !== -1
            ), (n & 3) === 0 || Ua(a, n) || (u = !0, Uv(a, n));
          a = a.next;
        }
      while (u);
      Yc = !1;
    }
  }
  function cd() {
    Ov();
  }
  function Ov() {
    _n = qc = !1;
    var l = 0;
    hu !== 0 && bd() && (l = hu);
    for (var t = Fl(), u = null, a = An; a !== null; ) {
      var e = a.next, n = Mv(a, t);
      n === 0 ? (a.next = null, u === null ? An = e : u.next = e, e === null && (Ta = u)) : (u = a, (l !== 0 || (n & 3) !== 0) && (_n = !0)), a = e;
    }
    El !== 0 && El !== 5 || ie(l), hu !== 0 && (hu = 0);
  }
  function Mv(l, t) {
    for (var u = l.suspendedLanes, a = l.pingedLanes, e = l.expirationTimes, n = l.pendingLanes & -62914561; 0 < n; ) {
      var f = 31 - Il(n), c = 1 << f, i = e[f];
      i === -1 ? ((c & u) === 0 || (c & a) !== 0) && (e[f] = Y1(c, t)) : i <= t && (l.expiredLanes |= c), n &= ~c;
    }
    if (t = el, u = V, u = De(
      l,
      l === t ? u : 0,
      l.cancelPendingCommit !== null || l.timeoutHandle !== -1
    ), a = l.callbackNode, u === 0 || l === t && (I === 2 || I === 9) || l.cancelPendingCommit !== null)
      return a !== null && a !== null && Kn(a), l.callbackNode = null, l.callbackPriority = 0;
    if ((u & 3) === 0 || Ua(l, u)) {
      if (t = u & -u, t === l.callbackPriority) return t;
      switch (a !== null && Kn(a), Wn(u)) {
        case 2:
        case 8:
          u = Si;
          break;
        case 32:
          u = Ae;
          break;
        case 268435456:
          u = oi;
          break;
        default:
          u = Ae;
      }
      return a = Dv.bind(null, l), u = Ln(u, a), l.callbackPriority = t, l.callbackNode = u, t;
    }
    return a !== null && a !== null && Kn(a), l.callbackPriority = 2, l.callbackNode = null, 2;
  }
  function Dv(l, t) {
    if (El !== 0 && El !== 5)
      return l.callbackNode = null, l.callbackPriority = 0, null;
    var u = l.callbackNode;
    if (En() && l.callbackNode !== u)
      return null;
    var a = V;
    return a = De(
      l,
      l === el ? a : 0,
      l.cancelPendingCommit !== null || l.timeoutHandle !== -1
    ), a === 0 ? null : (cv(l, a, t), Mv(l, Fl()), l.callbackNode != null && l.callbackNode === u ? Dv.bind(null, l) : null);
  }
  function Uv(l, t) {
    if (En()) return null;
    cv(l, t, !0);
  }
  function id() {
    Td(function() {
      ($ & 6) !== 0 ? Ln(
        si,
        cd
      ) : Ov();
    });
  }
  function Bc() {
    if (hu === 0) {
      var l = na;
      l === 0 && (l = _e, _e <<= 1, (_e & 261888) === 0 && (_e = 256)), hu = l;
    }
    return hu;
  }
  function rv(l) {
    return l == null || typeof l == "symbol" || typeof l == "boolean" ? null : typeof l == "function" ? l : Ne("" + l);
  }
  function Hv(l, t) {
    var u = t.ownerDocument.createElement("input");
    return u.name = t.name, u.value = t.value, l.id && u.setAttribute("form", l.id), t.parentNode.insertBefore(u, t), l = new FormData(l), u.parentNode.removeChild(u), l;
  }
  function yd(l, t, u, a, e) {
    if (t === "submit" && u && u.stateNode === e) {
      var n = rv(
        (e[Gl] || null).action
      ), f = a.submitter;
      f && (t = (t = f[Gl] || null) ? rv(t.formAction) : f.getAttribute("formAction"), t !== null && (n = t, f = null));
      var c = new Ye(
        "action",
        "action",
        null,
        a,
        e
      );
      l.push({
        event: c,
        listeners: [
          {
            instance: null,
            listener: function() {
              if (a.defaultPrevented) {
                if (hu !== 0) {
                  var i = f ? Hv(e, f) : new FormData(e);
                  tc(
                    u,
                    {
                      pending: !0,
                      data: i,
                      method: e.method,
                      action: n
                    },
                    null,
                    i
                  );
                }
              } else
                typeof n == "function" && (c.preventDefault(), i = f ? Hv(e, f) : new FormData(e), tc(
                  u,
                  {
                    pending: !0,
                    data: i,
                    method: e.method,
                    action: n
                  },
                  n,
                  i
                ));
            },
            currentTarget: e
          }
        ]
      });
    }
  }
  for (var Cc = 0; Cc < bf.length; Cc++) {
    var Gc = bf[Cc], vd = Gc.toLowerCase(), md = Gc[0].toUpperCase() + Gc.slice(1);
    Tt(
      vd,
      "on" + md
    );
  }
  Tt(f0, "onAnimationEnd"), Tt(c0, "onAnimationIteration"), Tt(i0, "onAnimationStart"), Tt("dblclick", "onDoubleClick"), Tt("focusin", "onFocus"), Tt("focusout", "onBlur"), Tt(Um, "onTransitionRun"), Tt(rm, "onTransitionStart"), Tt(Hm, "onTransitionCancel"), Tt(y0, "onTransitionEnd"), Ku("onMouseEnter", ["mouseout", "mouseover"]), Ku("onMouseLeave", ["mouseout", "mouseover"]), Ku("onPointerEnter", ["pointerout", "pointerover"]), Ku("onPointerLeave", ["pointerout", "pointerover"]), _u(
    "onChange",
    "change click focusin focusout input keydown keyup selectionchange".split(" ")
  ), _u(
    "onSelect",
    "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
      " "
    )
  ), _u("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), _u(
    "onCompositionEnd",
    "compositionend focusout keydown keypress keyup mousedown".split(" ")
  ), _u(
    "onCompositionStart",
    "compositionstart focusout keydown keypress keyup mousedown".split(" ")
  ), _u(
    "onCompositionUpdate",
    "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
  );
  var ye = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
    " "
  ), dd = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(ye)
  );
  function Nv(l, t) {
    t = (t & 4) !== 0;
    for (var u = 0; u < l.length; u++) {
      var a = l[u], e = a.event;
      a = a.listeners;
      l: {
        var n = void 0;
        if (t)
          for (var f = a.length - 1; 0 <= f; f--) {
            var c = a[f], i = c.instance, h = c.currentTarget;
            if (c = c.listener, i !== n && e.isPropagationStopped())
              break l;
            n = c, e.currentTarget = h;
            try {
              n(e);
            } catch (g) {
              Ge(g);
            }
            e.currentTarget = null, n = i;
          }
        else
          for (f = 0; f < a.length; f++) {
            if (c = a[f], i = c.instance, h = c.currentTarget, c = c.listener, i !== n && e.isPropagationStopped())
              break l;
            n = c, e.currentTarget = h;
            try {
              n(e);
            } catch (g) {
              Ge(g);
            }
            e.currentTarget = null, n = i;
          }
      }
    }
  }
  function Z(l, t) {
    var u = t[$n];
    u === void 0 && (u = t[$n] = /* @__PURE__ */ new Set());
    var a = l + "__bubble";
    u.has(a) || (Rv(t, l, 2, !1), u.add(a));
  }
  function Xc(l, t, u) {
    var a = 0;
    t && (a |= 4), Rv(
      u,
      l,
      a,
      t
    );
  }
  var On = "_reactListening" + Math.random().toString(36).slice(2);
  function Qc(l) {
    if (!l[On]) {
      l[On] = !0, Oi.forEach(function(u) {
        u !== "selectionchange" && (dd.has(u) || Xc(u, !1, l), Xc(u, !0, l));
      });
      var t = l.nodeType === 9 ? l : l.ownerDocument;
      t === null || t[On] || (t[On] = !0, Xc("selectionchange", !1, t));
    }
  }
  function Rv(l, t, u, a) {
    switch (f1(t)) {
      case 2:
        var e = jd;
        break;
      case 8:
        e = Zd;
        break;
      default:
        e = li;
    }
    u = e.bind(
      null,
      t,
      u,
      l
    ), e = void 0, !ef || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (e = !0), a ? e !== void 0 ? l.addEventListener(t, u, {
      capture: !0,
      passive: e
    }) : l.addEventListener(t, u, !0) : e !== void 0 ? l.addEventListener(t, u, {
      passive: e
    }) : l.addEventListener(t, u, !1);
  }
  function jc(l, t, u, a, e) {
    var n = a;
    if ((t & 1) === 0 && (t & 2) === 0 && a !== null)
      l: for (; ; ) {
        if (a === null) return;
        var f = a.tag;
        if (f === 3 || f === 4) {
          var c = a.stateNode.containerInfo;
          if (c === e) break;
          if (f === 4)
            for (f = a.return; f !== null; ) {
              var i = f.tag;
              if ((i === 3 || i === 4) && f.stateNode.containerInfo === e)
                return;
              f = f.return;
            }
          for (; c !== null; ) {
            if (f = Vu(c), f === null) return;
            if (i = f.tag, i === 5 || i === 6 || i === 26 || i === 27) {
              a = n = f;
              continue l;
            }
            c = c.parentNode;
          }
        }
        a = a.return;
      }
    Ci(function() {
      var h = n, g = uf(u), z = [];
      l: {
        var s = v0.get(l);
        if (s !== void 0) {
          var S = Ye, D = l;
          switch (l) {
            case "keypress":
              if (pe(u) === 0) break l;
            case "keydown":
            case "keyup":
              S = nm;
              break;
            case "focusin":
              D = "focus", S = yf;
              break;
            case "focusout":
              D = "blur", S = yf;
              break;
            case "beforeblur":
            case "afterblur":
              S = yf;
              break;
            case "click":
              if (u.button === 2) break l;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              S = Qi;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              S = w1;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              S = im;
              break;
            case f0:
            case c0:
            case i0:
              S = F1;
              break;
            case y0:
              S = vm;
              break;
            case "scroll":
            case "scrollend":
              S = K1;
              break;
            case "wheel":
              S = dm;
              break;
            case "copy":
            case "cut":
            case "paste":
              S = I1;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              S = Zi;
              break;
            case "toggle":
            case "beforetoggle":
              S = sm;
          }
          var p = (t & 4) !== 0, al = !p && (l === "scroll" || l === "scrollend"), m = p ? s !== null ? s + "Capture" : null : s;
          p = [];
          for (var y = h, d; y !== null; ) {
            var b = y;
            if (d = b.stateNode, b = b.tag, b !== 5 && b !== 26 && b !== 27 || d === null || m === null || (b = Ra(y, m), b != null && p.push(
              ve(y, b, d)
            )), al) break;
            y = y.return;
          }
          0 < p.length && (s = new S(
            s,
            D,
            null,
            u,
            g
          ), z.push({ event: s, listeners: p }));
        }
      }
      if ((t & 7) === 0) {
        l: {
          if (s = l === "mouseover" || l === "pointerover", S = l === "mouseout" || l === "pointerout", s && u !== tf && (D = u.relatedTarget || u.fromElement) && (Vu(D) || D[Zu]))
            break l;
          if ((S || s) && (s = g.window === g ? g : (s = g.ownerDocument) ? s.defaultView || s.parentWindow : window, S ? (D = u.relatedTarget || u.toElement, S = h, D = D ? Vu(D) : null, D !== null && (al = ol(D), p = D.tag, D !== al || p !== 5 && p !== 27 && p !== 6) && (D = null)) : (S = null, D = h), S !== D)) {
            if (p = Qi, b = "onMouseLeave", m = "onMouseEnter", y = "mouse", (l === "pointerout" || l === "pointerover") && (p = Zi, b = "onPointerLeave", m = "onPointerEnter", y = "pointer"), al = S == null ? s : Na(S), d = D == null ? s : Na(D), s = new p(
              b,
              y + "leave",
              S,
              u,
              g
            ), s.target = al, s.relatedTarget = d, b = null, Vu(g) === h && (p = new p(
              m,
              y + "enter",
              D,
              u,
              g
            ), p.target = d, p.relatedTarget = al, b = p), al = b, S && D)
              t: {
                for (p = hd, m = S, y = D, d = 0, b = m; b; b = p(b))
                  d++;
                b = 0;
                for (var H = y; H; H = p(H))
                  b++;
                for (; 0 < d - b; )
                  m = p(m), d--;
                for (; 0 < b - d; )
                  y = p(y), b--;
                for (; d--; ) {
                  if (m === y || y !== null && m === y.alternate) {
                    p = m;
                    break t;
                  }
                  m = p(m), y = p(y);
                }
                p = null;
              }
            else p = null;
            S !== null && pv(
              z,
              s,
              S,
              p,
              !1
            ), D !== null && al !== null && pv(
              z,
              al,
              D,
              p,
              !0
            );
          }
        }
        l: {
          if (s = h ? Na(h) : window, S = s.nodeName && s.nodeName.toLowerCase(), S === "select" || S === "input" && s.type === "file")
            var J = $i;
          else if (wi(s))
            if (Fi)
              J = Om;
            else {
              J = Am;
              var U = Em;
            }
          else
            S = s.nodeName, !S || S.toLowerCase() !== "input" || s.type !== "checkbox" && s.type !== "radio" ? h && lf(h.elementType) && (J = $i) : J = _m;
          if (J && (J = J(l, h))) {
            Wi(
              z,
              J,
              u,
              g
            );
            break l;
          }
          U && U(l, s, h), l === "focusout" && h && s.type === "number" && h.memoizedProps.value != null && Pn(s, "number", s.value);
        }
        switch (U = h ? Na(h) : window, l) {
          case "focusin":
            (wi(U) || U.contentEditable === "true") && (ku = U, Sf = h, Qa = null);
            break;
          case "focusout":
            Qa = Sf = ku = null;
            break;
          case "mousedown":
            of = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            of = !1, e0(z, u, g);
            break;
          case "selectionchange":
            if (Dm) break;
          case "keydown":
          case "keyup":
            e0(z, u, g);
        }
        var G;
        if (mf)
          l: {
            switch (l) {
              case "compositionstart":
                var x = "onCompositionStart";
                break l;
              case "compositionend":
                x = "onCompositionEnd";
                break l;
              case "compositionupdate":
                x = "onCompositionUpdate";
                break l;
            }
            x = void 0;
          }
        else
          Fu ? Ki(l, u) && (x = "onCompositionEnd") : l === "keydown" && u.keyCode === 229 && (x = "onCompositionStart");
        x && (Vi && u.locale !== "ko" && (Fu || x !== "onCompositionStart" ? x === "onCompositionEnd" && Fu && (G = Gi()) : (kt = g, nf = "value" in kt ? kt.value : kt.textContent, Fu = !0)), U = Mn(h, x), 0 < U.length && (x = new ji(
          x,
          l,
          null,
          u,
          g
        ), z.push({ event: x, listeners: U }), G ? x.data = G : (G = Ji(u), G !== null && (x.data = G)))), (G = om ? gm(l, u) : bm(l, u)) && (x = Mn(h, "onBeforeInput"), 0 < x.length && (U = new ji(
          "onBeforeInput",
          "beforeinput",
          null,
          u,
          g
        ), z.push({
          event: U,
          listeners: x
        }), U.data = G)), yd(
          z,
          l,
          h,
          u,
          g
        );
      }
      Nv(z, t);
    });
  }
  function ve(l, t, u) {
    return {
      instance: l,
      listener: t,
      currentTarget: u
    };
  }
  function Mn(l, t) {
    for (var u = t + "Capture", a = []; l !== null; ) {
      var e = l, n = e.stateNode;
      if (e = e.tag, e !== 5 && e !== 26 && e !== 27 || n === null || (e = Ra(l, u), e != null && a.unshift(
        ve(l, e, n)
      ), e = Ra(l, t), e != null && a.push(
        ve(l, e, n)
      )), l.tag === 3) return a;
      l = l.return;
    }
    return [];
  }
  function hd(l) {
    if (l === null) return null;
    do
      l = l.return;
    while (l && l.tag !== 5 && l.tag !== 27);
    return l || null;
  }
  function pv(l, t, u, a, e) {
    for (var n = t._reactName, f = []; u !== null && u !== a; ) {
      var c = u, i = c.alternate, h = c.stateNode;
      if (c = c.tag, i !== null && i === a) break;
      c !== 5 && c !== 26 && c !== 27 || h === null || (i = h, e ? (h = Ra(u, n), h != null && f.unshift(
        ve(u, h, i)
      )) : e || (h = Ra(u, n), h != null && f.push(
        ve(u, h, i)
      ))), u = u.return;
    }
    f.length !== 0 && l.push({ event: t, listeners: f });
  }
  var sd = /\r\n?/g, Sd = /\u0000|\uFFFD/g;
  function qv(l) {
    return (typeof l == "string" ? l : "" + l).replace(sd, `
`).replace(Sd, "");
  }
  function Yv(l, t) {
    return t = qv(t), qv(l) === t;
  }
  function ul(l, t, u, a, e, n) {
    switch (u) {
      case "children":
        typeof a == "string" ? t === "body" || t === "textarea" && a === "" || wu(l, a) : (typeof a == "number" || typeof a == "bigint") && t !== "body" && wu(l, "" + a);
        break;
      case "className":
        re(l, "class", a);
        break;
      case "tabIndex":
        re(l, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        re(l, u, a);
        break;
      case "style":
        Yi(l, a, n);
        break;
      case "data":
        if (t !== "object") {
          re(l, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (t !== "a" || u !== "href")) {
          l.removeAttribute(u);
          break;
        }
        if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
          l.removeAttribute(u);
          break;
        }
        a = Ne("" + a), l.setAttribute(u, a);
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          l.setAttribute(
            u,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof n == "function" && (u === "formAction" ? (t !== "input" && ul(l, t, "name", e.name, e, null), ul(
            l,
            t,
            "formEncType",
            e.formEncType,
            e,
            null
          ), ul(
            l,
            t,
            "formMethod",
            e.formMethod,
            e,
            null
          ), ul(
            l,
            t,
            "formTarget",
            e.formTarget,
            e,
            null
          )) : (ul(l, t, "encType", e.encType, e, null), ul(l, t, "method", e.method, e, null), ul(l, t, "target", e.target, e, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          l.removeAttribute(u);
          break;
        }
        a = Ne("" + a), l.setAttribute(u, a);
        break;
      case "onClick":
        a != null && (l.onclick = Nt);
        break;
      case "onScroll":
        a != null && Z("scroll", l);
        break;
      case "onScrollEnd":
        a != null && Z("scrollend", l);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(o(61));
          if (u = a.__html, u != null) {
            if (e.children != null) throw Error(o(60));
            l.innerHTML = u;
          }
        }
        break;
      case "multiple":
        l.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        l.muted = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
          l.removeAttribute("xlink:href");
          break;
        }
        u = Ne("" + a), l.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          u
        );
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        a != null && typeof a != "function" && typeof a != "symbol" ? l.setAttribute(u, "" + a) : l.removeAttribute(u);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        a && typeof a != "function" && typeof a != "symbol" ? l.setAttribute(u, "") : l.removeAttribute(u);
        break;
      case "capture":
      case "download":
        a === !0 ? l.setAttribute(u, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? l.setAttribute(u, a) : l.removeAttribute(u);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? l.setAttribute(u, a) : l.removeAttribute(u);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? l.removeAttribute(u) : l.setAttribute(u, a);
        break;
      case "popover":
        Z("beforetoggle", l), Z("toggle", l), Ue(l, "popover", a);
        break;
      case "xlinkActuate":
        Ht(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:actuate",
          a
        );
        break;
      case "xlinkArcrole":
        Ht(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:arcrole",
          a
        );
        break;
      case "xlinkRole":
        Ht(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:role",
          a
        );
        break;
      case "xlinkShow":
        Ht(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:show",
          a
        );
        break;
      case "xlinkTitle":
        Ht(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:title",
          a
        );
        break;
      case "xlinkType":
        Ht(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:type",
          a
        );
        break;
      case "xmlBase":
        Ht(
          l,
          "http://www.w3.org/XML/1998/namespace",
          "xml:base",
          a
        );
        break;
      case "xmlLang":
        Ht(
          l,
          "http://www.w3.org/XML/1998/namespace",
          "xml:lang",
          a
        );
        break;
      case "xmlSpace":
        Ht(
          l,
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          a
        );
        break;
      case "is":
        Ue(l, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < u.length) || u[0] !== "o" && u[0] !== "O" || u[1] !== "n" && u[1] !== "N") && (u = x1.get(u) || u, Ue(l, u, a));
    }
  }
  function Zc(l, t, u, a, e, n) {
    switch (u) {
      case "style":
        Yi(l, a, n);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(o(61));
          if (u = a.__html, u != null) {
            if (e.children != null) throw Error(o(60));
            l.innerHTML = u;
          }
        }
        break;
      case "children":
        typeof a == "string" ? wu(l, a) : (typeof a == "number" || typeof a == "bigint") && wu(l, "" + a);
        break;
      case "onScroll":
        a != null && Z("scroll", l);
        break;
      case "onScrollEnd":
        a != null && Z("scrollend", l);
        break;
      case "onClick":
        a != null && (l.onclick = Nt);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!Mi.hasOwnProperty(u))
          l: {
            if (u[0] === "o" && u[1] === "n" && (e = u.endsWith("Capture"), t = u.slice(2, e ? u.length - 7 : void 0), n = l[Gl] || null, n = n != null ? n[u] : null, typeof n == "function" && l.removeEventListener(t, n, e), typeof a == "function")) {
              typeof n != "function" && n !== null && (u in l ? l[u] = null : l.hasAttribute(u) && l.removeAttribute(u)), l.addEventListener(t, a, e);
              break l;
            }
            u in l ? l[u] = a : a === !0 ? l.setAttribute(u, "") : Ue(l, u, a);
          }
    }
  }
  function Hl(l, t, u) {
    switch (t) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        Z("error", l), Z("load", l);
        var a = !1, e = !1, n;
        for (n in u)
          if (u.hasOwnProperty(n)) {
            var f = u[n];
            if (f != null)
              switch (n) {
                case "src":
                  a = !0;
                  break;
                case "srcSet":
                  e = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(o(137, t));
                default:
                  ul(l, t, n, f, u, null);
              }
          }
        e && ul(l, t, "srcSet", u.srcSet, u, null), a && ul(l, t, "src", u.src, u, null);
        return;
      case "input":
        Z("invalid", l);
        var c = n = f = e = null, i = null, h = null;
        for (a in u)
          if (u.hasOwnProperty(a)) {
            var g = u[a];
            if (g != null)
              switch (a) {
                case "name":
                  e = g;
                  break;
                case "type":
                  f = g;
                  break;
                case "checked":
                  i = g;
                  break;
                case "defaultChecked":
                  h = g;
                  break;
                case "value":
                  n = g;
                  break;
                case "defaultValue":
                  c = g;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (g != null)
                    throw Error(o(137, t));
                  break;
                default:
                  ul(l, t, a, g, u, null);
              }
          }
        Ni(
          l,
          n,
          c,
          i,
          h,
          f,
          e,
          !1
        );
        return;
      case "select":
        Z("invalid", l), a = f = n = null;
        for (e in u)
          if (u.hasOwnProperty(e) && (c = u[e], c != null))
            switch (e) {
              case "value":
                n = c;
                break;
              case "defaultValue":
                f = c;
                break;
              case "multiple":
                a = c;
              default:
                ul(l, t, e, c, u, null);
            }
        t = n, u = f, l.multiple = !!a, t != null ? Ju(l, !!a, t, !1) : u != null && Ju(l, !!a, u, !0);
        return;
      case "textarea":
        Z("invalid", l), n = e = a = null;
        for (f in u)
          if (u.hasOwnProperty(f) && (c = u[f], c != null))
            switch (f) {
              case "value":
                a = c;
                break;
              case "defaultValue":
                e = c;
                break;
              case "children":
                n = c;
                break;
              case "dangerouslySetInnerHTML":
                if (c != null) throw Error(o(91));
                break;
              default:
                ul(l, t, f, c, u, null);
            }
        pi(l, a, e, n);
        return;
      case "option":
        for (i in u)
          if (u.hasOwnProperty(i) && (a = u[i], a != null))
            switch (i) {
              case "selected":
                l.selected = a && typeof a != "function" && typeof a != "symbol";
                break;
              default:
                ul(l, t, i, a, u, null);
            }
        return;
      case "dialog":
        Z("beforetoggle", l), Z("toggle", l), Z("cancel", l), Z("close", l);
        break;
      case "iframe":
      case "object":
        Z("load", l);
        break;
      case "video":
      case "audio":
        for (a = 0; a < ye.length; a++)
          Z(ye[a], l);
        break;
      case "image":
        Z("error", l), Z("load", l);
        break;
      case "details":
        Z("toggle", l);
        break;
      case "embed":
      case "source":
      case "link":
        Z("error", l), Z("load", l);
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (h in u)
          if (u.hasOwnProperty(h) && (a = u[h], a != null))
            switch (h) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(o(137, t));
              default:
                ul(l, t, h, a, u, null);
            }
        return;
      default:
        if (lf(t)) {
          for (g in u)
            u.hasOwnProperty(g) && (a = u[g], a !== void 0 && Zc(
              l,
              t,
              g,
              a,
              u,
              void 0
            ));
          return;
        }
    }
    for (c in u)
      u.hasOwnProperty(c) && (a = u[c], a != null && ul(l, t, c, a, u, null));
  }
  function od(l, t, u, a) {
    switch (t) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var e = null, n = null, f = null, c = null, i = null, h = null, g = null;
        for (S in u) {
          var z = u[S];
          if (u.hasOwnProperty(S) && z != null)
            switch (S) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                i = z;
              default:
                a.hasOwnProperty(S) || ul(l, t, S, null, a, z);
            }
        }
        for (var s in a) {
          var S = a[s];
          if (z = u[s], a.hasOwnProperty(s) && (S != null || z != null))
            switch (s) {
              case "type":
                n = S;
                break;
              case "name":
                e = S;
                break;
              case "checked":
                h = S;
                break;
              case "defaultChecked":
                g = S;
                break;
              case "value":
                f = S;
                break;
              case "defaultValue":
                c = S;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (S != null)
                  throw Error(o(137, t));
                break;
              default:
                S !== z && ul(
                  l,
                  t,
                  s,
                  S,
                  a,
                  z
                );
            }
        }
        In(
          l,
          f,
          c,
          i,
          h,
          g,
          n,
          e
        );
        return;
      case "select":
        S = f = c = s = null;
        for (n in u)
          if (i = u[n], u.hasOwnProperty(n) && i != null)
            switch (n) {
              case "value":
                break;
              case "multiple":
                S = i;
              default:
                a.hasOwnProperty(n) || ul(
                  l,
                  t,
                  n,
                  null,
                  a,
                  i
                );
            }
        for (e in a)
          if (n = a[e], i = u[e], a.hasOwnProperty(e) && (n != null || i != null))
            switch (e) {
              case "value":
                s = n;
                break;
              case "defaultValue":
                c = n;
                break;
              case "multiple":
                f = n;
              default:
                n !== i && ul(
                  l,
                  t,
                  e,
                  n,
                  a,
                  i
                );
            }
        t = c, u = f, a = S, s != null ? Ju(l, !!u, s, !1) : !!a != !!u && (t != null ? Ju(l, !!u, t, !0) : Ju(l, !!u, u ? [] : "", !1));
        return;
      case "textarea":
        S = s = null;
        for (c in u)
          if (e = u[c], u.hasOwnProperty(c) && e != null && !a.hasOwnProperty(c))
            switch (c) {
              case "value":
                break;
              case "children":
                break;
              default:
                ul(l, t, c, null, a, e);
            }
        for (f in a)
          if (e = a[f], n = u[f], a.hasOwnProperty(f) && (e != null || n != null))
            switch (f) {
              case "value":
                s = e;
                break;
              case "defaultValue":
                S = e;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (e != null) throw Error(o(91));
                break;
              default:
                e !== n && ul(l, t, f, e, a, n);
            }
        Ri(l, s, S);
        return;
      case "option":
        for (var D in u)
          if (s = u[D], u.hasOwnProperty(D) && s != null && !a.hasOwnProperty(D))
            switch (D) {
              case "selected":
                l.selected = !1;
                break;
              default:
                ul(
                  l,
                  t,
                  D,
                  null,
                  a,
                  s
                );
            }
        for (i in a)
          if (s = a[i], S = u[i], a.hasOwnProperty(i) && s !== S && (s != null || S != null))
            switch (i) {
              case "selected":
                l.selected = s && typeof s != "function" && typeof s != "symbol";
                break;
              default:
                ul(
                  l,
                  t,
                  i,
                  s,
                  a,
                  S
                );
            }
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var p in u)
          s = u[p], u.hasOwnProperty(p) && s != null && !a.hasOwnProperty(p) && ul(l, t, p, null, a, s);
        for (h in a)
          if (s = a[h], S = u[h], a.hasOwnProperty(h) && s !== S && (s != null || S != null))
            switch (h) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (s != null)
                  throw Error(o(137, t));
                break;
              default:
                ul(
                  l,
                  t,
                  h,
                  s,
                  a,
                  S
                );
            }
        return;
      default:
        if (lf(t)) {
          for (var al in u)
            s = u[al], u.hasOwnProperty(al) && s !== void 0 && !a.hasOwnProperty(al) && Zc(
              l,
              t,
              al,
              void 0,
              a,
              s
            );
          for (g in a)
            s = a[g], S = u[g], !a.hasOwnProperty(g) || s === S || s === void 0 && S === void 0 || Zc(
              l,
              t,
              g,
              s,
              a,
              S
            );
          return;
        }
    }
    for (var m in u)
      s = u[m], u.hasOwnProperty(m) && s != null && !a.hasOwnProperty(m) && ul(l, t, m, null, a, s);
    for (z in a)
      s = a[z], S = u[z], !a.hasOwnProperty(z) || s === S || s == null && S == null || ul(l, t, z, s, a, S);
  }
  function Bv(l) {
    switch (l) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function gd() {
    if (typeof performance.getEntriesByType == "function") {
      for (var l = 0, t = 0, u = performance.getEntriesByType("resource"), a = 0; a < u.length; a++) {
        var e = u[a], n = e.transferSize, f = e.initiatorType, c = e.duration;
        if (n && c && Bv(f)) {
          for (f = 0, c = e.responseEnd, a += 1; a < u.length; a++) {
            var i = u[a], h = i.startTime;
            if (h > c) break;
            var g = i.transferSize, z = i.initiatorType;
            g && Bv(z) && (i = i.responseEnd, f += g * (i < c ? 1 : (c - h) / (i - h)));
          }
          if (--a, t += 8 * (n + f) / (e.duration / 1e3), l++, 10 < l) break;
        }
      }
      if (0 < l) return t / l / 1e6;
    }
    return navigator.connection && (l = navigator.connection.downlink, typeof l == "number") ? l : 5;
  }
  var Vc = null, xc = null;
  function Dn(l) {
    return l.nodeType === 9 ? l : l.ownerDocument;
  }
  function Cv(l) {
    switch (l) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Gv(l, t) {
    if (l === 0)
      switch (t) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return l === 1 && t === "foreignObject" ? 0 : l;
  }
  function Lc(l, t) {
    return l === "textarea" || l === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var Kc = null;
  function bd() {
    var l = window.event;
    return l && l.type === "popstate" ? l === Kc ? !1 : (Kc = l, !0) : (Kc = null, !1);
  }
  var Xv = typeof setTimeout == "function" ? setTimeout : void 0, zd = typeof clearTimeout == "function" ? clearTimeout : void 0, Qv = typeof Promise == "function" ? Promise : void 0, Td = typeof queueMicrotask == "function" ? queueMicrotask : typeof Qv < "u" ? function(l) {
    return Qv.resolve(null).then(l).catch(Ed);
  } : Xv;
  function Ed(l) {
    setTimeout(function() {
      throw l;
    });
  }
  function su(l) {
    return l === "head";
  }
  function jv(l, t) {
    var u = t, a = 0;
    do {
      var e = u.nextSibling;
      if (l.removeChild(u), e && e.nodeType === 8)
        if (u = e.data, u === "/$" || u === "/&") {
          if (a === 0) {
            l.removeChild(e), Oa(t);
            return;
          }
          a--;
        } else if (u === "$" || u === "$?" || u === "$~" || u === "$!" || u === "&")
          a++;
        else if (u === "html")
          me(l.ownerDocument.documentElement);
        else if (u === "head") {
          u = l.ownerDocument.head, me(u);
          for (var n = u.firstChild; n; ) {
            var f = n.nextSibling, c = n.nodeName;
            n[Ha] || c === "SCRIPT" || c === "STYLE" || c === "LINK" && n.rel.toLowerCase() === "stylesheet" || u.removeChild(n), n = f;
          }
        } else
          u === "body" && me(l.ownerDocument.body);
      u = e;
    } while (u);
    Oa(t);
  }
  function Zv(l, t) {
    var u = l;
    l = 0;
    do {
      var a = u.nextSibling;
      if (u.nodeType === 1 ? t ? (u._stashedDisplay = u.style.display, u.style.display = "none") : (u.style.display = u._stashedDisplay || "", u.getAttribute("style") === "" && u.removeAttribute("style")) : u.nodeType === 3 && (t ? (u._stashedText = u.nodeValue, u.nodeValue = "") : u.nodeValue = u._stashedText || ""), a && a.nodeType === 8)
        if (u = a.data, u === "/$") {
          if (l === 0) break;
          l--;
        } else
          u !== "$" && u !== "$?" && u !== "$~" && u !== "$!" || l++;
      u = a;
    } while (u);
  }
  function Jc(l) {
    var t = l.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var u = t;
      switch (t = t.nextSibling, u.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Jc(u), Fn(u);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (u.rel.toLowerCase() === "stylesheet") continue;
      }
      l.removeChild(u);
    }
  }
  function Ad(l, t, u, a) {
    for (; l.nodeType === 1; ) {
      var e = u;
      if (l.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!a && (l.nodeName !== "INPUT" || l.type !== "hidden"))
          break;
      } else if (a) {
        if (!l[Ha])
          switch (t) {
            case "meta":
              if (!l.hasAttribute("itemprop")) break;
              return l;
            case "link":
              if (n = l.getAttribute("rel"), n === "stylesheet" && l.hasAttribute("data-precedence"))
                break;
              if (n !== e.rel || l.getAttribute("href") !== (e.href == null || e.href === "" ? null : e.href) || l.getAttribute("crossorigin") !== (e.crossOrigin == null ? null : e.crossOrigin) || l.getAttribute("title") !== (e.title == null ? null : e.title))
                break;
              return l;
            case "style":
              if (l.hasAttribute("data-precedence")) break;
              return l;
            case "script":
              if (n = l.getAttribute("src"), (n !== (e.src == null ? null : e.src) || l.getAttribute("type") !== (e.type == null ? null : e.type) || l.getAttribute("crossorigin") !== (e.crossOrigin == null ? null : e.crossOrigin)) && n && l.hasAttribute("async") && !l.hasAttribute("itemprop"))
                break;
              return l;
            default:
              return l;
          }
      } else if (t === "input" && l.type === "hidden") {
        var n = e.name == null ? null : "" + e.name;
        if (e.type === "hidden" && l.getAttribute("name") === n)
          return l;
      } else return l;
      if (l = St(l.nextSibling), l === null) break;
    }
    return null;
  }
  function _d(l, t, u) {
    if (t === "") return null;
    for (; l.nodeType !== 3; )
      if ((l.nodeType !== 1 || l.nodeName !== "INPUT" || l.type !== "hidden") && !u || (l = St(l.nextSibling), l === null)) return null;
    return l;
  }
  function Vv(l, t) {
    for (; l.nodeType !== 8; )
      if ((l.nodeType !== 1 || l.nodeName !== "INPUT" || l.type !== "hidden") && !t || (l = St(l.nextSibling), l === null)) return null;
    return l;
  }
  function wc(l) {
    return l.data === "$?" || l.data === "$~";
  }
  function Wc(l) {
    return l.data === "$!" || l.data === "$?" && l.ownerDocument.readyState !== "loading";
  }
  function Od(l, t) {
    var u = l.ownerDocument;
    if (l.data === "$~") l._reactRetry = t;
    else if (l.data !== "$?" || u.readyState !== "loading")
      t();
    else {
      var a = function() {
        t(), u.removeEventListener("DOMContentLoaded", a);
      };
      u.addEventListener("DOMContentLoaded", a), l._reactRetry = a;
    }
  }
  function St(l) {
    for (; l != null; l = l.nextSibling) {
      var t = l.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (t = l.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F")
          break;
        if (t === "/$" || t === "/&") return null;
      }
    }
    return l;
  }
  var $c = null;
  function xv(l) {
    l = l.nextSibling;
    for (var t = 0; l; ) {
      if (l.nodeType === 8) {
        var u = l.data;
        if (u === "/$" || u === "/&") {
          if (t === 0)
            return St(l.nextSibling);
          t--;
        } else
          u !== "$" && u !== "$!" && u !== "$?" && u !== "$~" && u !== "&" || t++;
      }
      l = l.nextSibling;
    }
    return null;
  }
  function Lv(l) {
    l = l.previousSibling;
    for (var t = 0; l; ) {
      if (l.nodeType === 8) {
        var u = l.data;
        if (u === "$" || u === "$!" || u === "$?" || u === "$~" || u === "&") {
          if (t === 0) return l;
          t--;
        } else u !== "/$" && u !== "/&" || t++;
      }
      l = l.previousSibling;
    }
    return null;
  }
  function Kv(l, t, u) {
    switch (t = Dn(u), l) {
      case "html":
        if (l = t.documentElement, !l) throw Error(o(452));
        return l;
      case "head":
        if (l = t.head, !l) throw Error(o(453));
        return l;
      case "body":
        if (l = t.body, !l) throw Error(o(454));
        return l;
      default:
        throw Error(o(451));
    }
  }
  function me(l) {
    for (var t = l.attributes; t.length; )
      l.removeAttributeNode(t[0]);
    Fn(l);
  }
  var ot = /* @__PURE__ */ new Map(), Jv = /* @__PURE__ */ new Set();
  function Un(l) {
    return typeof l.getRootNode == "function" ? l.getRootNode() : l.nodeType === 9 ? l : l.ownerDocument;
  }
  var Jt = O.d;
  O.d = {
    f: Md,
    r: Dd,
    D: Ud,
    C: rd,
    L: Hd,
    m: Nd,
    X: pd,
    S: Rd,
    M: qd
  };
  function Md() {
    var l = Jt.f(), t = bn();
    return l || t;
  }
  function Dd(l) {
    var t = xu(l);
    t !== null && t.tag === 5 && t.type === "form" ? yy(t) : Jt.r(l);
  }
  var Ea = typeof document > "u" ? null : document;
  function wv(l, t, u) {
    var a = Ea;
    if (a && typeof t == "string" && t) {
      var e = it(t);
      e = 'link[rel="' + l + '"][href="' + e + '"]', typeof u == "string" && (e += '[crossorigin="' + u + '"]'), Jv.has(e) || (Jv.add(e), l = { rel: l, crossOrigin: u, href: t }, a.querySelector(e) === null && (t = a.createElement("link"), Hl(t, "link", l), _l(t), a.head.appendChild(t)));
    }
  }
  function Ud(l) {
    Jt.D(l), wv("dns-prefetch", l, null);
  }
  function rd(l, t) {
    Jt.C(l, t), wv("preconnect", l, t);
  }
  function Hd(l, t, u) {
    Jt.L(l, t, u);
    var a = Ea;
    if (a && l && t) {
      var e = 'link[rel="preload"][as="' + it(t) + '"]';
      t === "image" && u && u.imageSrcSet ? (e += '[imagesrcset="' + it(
        u.imageSrcSet
      ) + '"]', typeof u.imageSizes == "string" && (e += '[imagesizes="' + it(
        u.imageSizes
      ) + '"]')) : e += '[href="' + it(l) + '"]';
      var n = e;
      switch (t) {
        case "style":
          n = Aa(l);
          break;
        case "script":
          n = _a(l);
      }
      ot.has(n) || (l = q(
        {
          rel: "preload",
          href: t === "image" && u && u.imageSrcSet ? void 0 : l,
          as: t
        },
        u
      ), ot.set(n, l), a.querySelector(e) !== null || t === "style" && a.querySelector(de(n)) || t === "script" && a.querySelector(he(n)) || (t = a.createElement("link"), Hl(t, "link", l), _l(t), a.head.appendChild(t)));
    }
  }
  function Nd(l, t) {
    Jt.m(l, t);
    var u = Ea;
    if (u && l) {
      var a = t && typeof t.as == "string" ? t.as : "script", e = 'link[rel="modulepreload"][as="' + it(a) + '"][href="' + it(l) + '"]', n = e;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          n = _a(l);
      }
      if (!ot.has(n) && (l = q({ rel: "modulepreload", href: l }, t), ot.set(n, l), u.querySelector(e) === null)) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (u.querySelector(he(n)))
              return;
        }
        a = u.createElement("link"), Hl(a, "link", l), _l(a), u.head.appendChild(a);
      }
    }
  }
  function Rd(l, t, u) {
    Jt.S(l, t, u);
    var a = Ea;
    if (a && l) {
      var e = Lu(a).hoistableStyles, n = Aa(l);
      t = t || "default";
      var f = e.get(n);
      if (!f) {
        var c = { loading: 0, preload: null };
        if (f = a.querySelector(
          de(n)
        ))
          c.loading = 5;
        else {
          l = q(
            { rel: "stylesheet", href: l, "data-precedence": t },
            u
          ), (u = ot.get(n)) && Fc(l, u);
          var i = f = a.createElement("link");
          _l(i), Hl(i, "link", l), i._p = new Promise(function(h, g) {
            i.onload = h, i.onerror = g;
          }), i.addEventListener("load", function() {
            c.loading |= 1;
          }), i.addEventListener("error", function() {
            c.loading |= 2;
          }), c.loading |= 4, rn(f, t, a);
        }
        f = {
          type: "stylesheet",
          instance: f,
          count: 1,
          state: c
        }, e.set(n, f);
      }
    }
  }
  function pd(l, t) {
    Jt.X(l, t);
    var u = Ea;
    if (u && l) {
      var a = Lu(u).hoistableScripts, e = _a(l), n = a.get(e);
      n || (n = u.querySelector(he(e)), n || (l = q({ src: l, async: !0 }, t), (t = ot.get(e)) && kc(l, t), n = u.createElement("script"), _l(n), Hl(n, "link", l), u.head.appendChild(n)), n = {
        type: "script",
        instance: n,
        count: 1,
        state: null
      }, a.set(e, n));
    }
  }
  function qd(l, t) {
    Jt.M(l, t);
    var u = Ea;
    if (u && l) {
      var a = Lu(u).hoistableScripts, e = _a(l), n = a.get(e);
      n || (n = u.querySelector(he(e)), n || (l = q({ src: l, async: !0, type: "module" }, t), (t = ot.get(e)) && kc(l, t), n = u.createElement("script"), _l(n), Hl(n, "link", l), u.head.appendChild(n)), n = {
        type: "script",
        instance: n,
        count: 1,
        state: null
      }, a.set(e, n));
    }
  }
  function Wv(l, t, u, a) {
    var e = (e = Q.current) ? Un(e) : null;
    if (!e) throw Error(o(446));
    switch (l) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof u.precedence == "string" && typeof u.href == "string" ? (t = Aa(u.href), u = Lu(
          e
        ).hoistableStyles, a = u.get(t), a || (a = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, u.set(t, a)), a) : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (u.rel === "stylesheet" && typeof u.href == "string" && typeof u.precedence == "string") {
          l = Aa(u.href);
          var n = Lu(
            e
          ).hoistableStyles, f = n.get(l);
          if (f || (e = e.ownerDocument || e, f = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }, n.set(l, f), (n = e.querySelector(
            de(l)
          )) && !n._p && (f.instance = n, f.state.loading = 5), ot.has(l) || (u = {
            rel: "preload",
            as: "style",
            href: u.href,
            crossOrigin: u.crossOrigin,
            integrity: u.integrity,
            media: u.media,
            hrefLang: u.hrefLang,
            referrerPolicy: u.referrerPolicy
          }, ot.set(l, u), n || Yd(
            e,
            l,
            u,
            f.state
          ))), t && a === null)
            throw Error(o(528, ""));
          return f;
        }
        if (t && a !== null)
          throw Error(o(529, ""));
        return null;
      case "script":
        return t = u.async, u = u.src, typeof u == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = _a(u), u = Lu(
          e
        ).hoistableScripts, a = u.get(t), a || (a = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, u.set(t, a)), a) : { type: "void", instance: null, count: 0, state: null };
      default:
        throw Error(o(444, l));
    }
  }
  function Aa(l) {
    return 'href="' + it(l) + '"';
  }
  function de(l) {
    return 'link[rel="stylesheet"][' + l + "]";
  }
  function $v(l) {
    return q({}, l, {
      "data-precedence": l.precedence,
      precedence: null
    });
  }
  function Yd(l, t, u, a) {
    l.querySelector('link[rel="preload"][as="style"][' + t + "]") ? a.loading = 1 : (t = l.createElement("link"), a.preload = t, t.addEventListener("load", function() {
      return a.loading |= 1;
    }), t.addEventListener("error", function() {
      return a.loading |= 2;
    }), Hl(t, "link", u), _l(t), l.head.appendChild(t));
  }
  function _a(l) {
    return '[src="' + it(l) + '"]';
  }
  function he(l) {
    return "script[async]" + l;
  }
  function Fv(l, t, u) {
    if (t.count++, t.instance === null)
      switch (t.type) {
        case "style":
          var a = l.querySelector(
            'style[data-href~="' + it(u.href) + '"]'
          );
          if (a)
            return t.instance = a, _l(a), a;
          var e = q({}, u, {
            "data-href": u.href,
            "data-precedence": u.precedence,
            href: null,
            precedence: null
          });
          return a = (l.ownerDocument || l).createElement(
            "style"
          ), _l(a), Hl(a, "style", e), rn(a, u.precedence, l), t.instance = a;
        case "stylesheet":
          e = Aa(u.href);
          var n = l.querySelector(
            de(e)
          );
          if (n)
            return t.state.loading |= 4, t.instance = n, _l(n), n;
          a = $v(u), (e = ot.get(e)) && Fc(a, e), n = (l.ownerDocument || l).createElement("link"), _l(n);
          var f = n;
          return f._p = new Promise(function(c, i) {
            f.onload = c, f.onerror = i;
          }), Hl(n, "link", a), t.state.loading |= 4, rn(n, u.precedence, l), t.instance = n;
        case "script":
          return n = _a(u.src), (e = l.querySelector(
            he(n)
          )) ? (t.instance = e, _l(e), e) : (a = u, (e = ot.get(n)) && (a = q({}, u), kc(a, e)), l = l.ownerDocument || l, e = l.createElement("script"), _l(e), Hl(e, "link", a), l.head.appendChild(e), t.instance = e);
        case "void":
          return null;
        default:
          throw Error(o(443, t.type));
      }
    else
      t.type === "stylesheet" && (t.state.loading & 4) === 0 && (a = t.instance, t.state.loading |= 4, rn(a, u.precedence, l));
    return t.instance;
  }
  function rn(l, t, u) {
    for (var a = u.querySelectorAll(
      'link[rel="stylesheet"][data-precedence],style[data-precedence]'
    ), e = a.length ? a[a.length - 1] : null, n = e, f = 0; f < a.length; f++) {
      var c = a[f];
      if (c.dataset.precedence === t) n = c;
      else if (n !== e) break;
    }
    n ? n.parentNode.insertBefore(l, n.nextSibling) : (t = u.nodeType === 9 ? u.head : u, t.insertBefore(l, t.firstChild));
  }
  function Fc(l, t) {
    l.crossOrigin == null && (l.crossOrigin = t.crossOrigin), l.referrerPolicy == null && (l.referrerPolicy = t.referrerPolicy), l.title == null && (l.title = t.title);
  }
  function kc(l, t) {
    l.crossOrigin == null && (l.crossOrigin = t.crossOrigin), l.referrerPolicy == null && (l.referrerPolicy = t.referrerPolicy), l.integrity == null && (l.integrity = t.integrity);
  }
  var Hn = null;
  function kv(l, t, u) {
    if (Hn === null) {
      var a = /* @__PURE__ */ new Map(), e = Hn = /* @__PURE__ */ new Map();
      e.set(u, a);
    } else
      e = Hn, a = e.get(u), a || (a = /* @__PURE__ */ new Map(), e.set(u, a));
    if (a.has(l)) return a;
    for (a.set(l, null), u = u.getElementsByTagName(l), e = 0; e < u.length; e++) {
      var n = u[e];
      if (!(n[Ha] || n[Ml] || l === "link" && n.getAttribute("rel") === "stylesheet") && n.namespaceURI !== "http://www.w3.org/2000/svg") {
        var f = n.getAttribute(t) || "";
        f = l + f;
        var c = a.get(f);
        c ? c.push(n) : a.set(f, [n]);
      }
    }
    return a;
  }
  function Iv(l, t, u) {
    l = l.ownerDocument || l, l.head.insertBefore(
      u,
      t === "title" ? l.querySelector("head > title") : null
    );
  }
  function Bd(l, t, u) {
    if (u === 1 || t.itemProp != null) return !1;
    switch (l) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
          break;
        return !0;
      case "link":
        if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
          break;
        switch (t.rel) {
          case "stylesheet":
            return l = t.disabled, typeof t.precedence == "string" && l == null;
          default:
            return !0;
        }
      case "script":
        if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
          return !0;
    }
    return !1;
  }
  function Pv(l) {
    return !(l.type === "stylesheet" && (l.state.loading & 3) === 0);
  }
  function Cd(l, t, u, a) {
    if (u.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (u.state.loading & 4) === 0) {
      if (u.instance === null) {
        var e = Aa(a.href), n = t.querySelector(
          de(e)
        );
        if (n) {
          t = n._p, t !== null && typeof t == "object" && typeof t.then == "function" && (l.count++, l = Nn.bind(l), t.then(l, l)), u.state.loading |= 4, u.instance = n, _l(n);
          return;
        }
        n = t.ownerDocument || t, a = $v(a), (e = ot.get(e)) && Fc(a, e), n = n.createElement("link"), _l(n);
        var f = n;
        f._p = new Promise(function(c, i) {
          f.onload = c, f.onerror = i;
        }), Hl(n, "link", a), u.instance = n;
      }
      l.stylesheets === null && (l.stylesheets = /* @__PURE__ */ new Map()), l.stylesheets.set(u, t), (t = u.state.preload) && (u.state.loading & 3) === 0 && (l.count++, u = Nn.bind(l), t.addEventListener("load", u), t.addEventListener("error", u));
    }
  }
  var Ic = 0;
  function Gd(l, t) {
    return l.stylesheets && l.count === 0 && pn(l, l.stylesheets), 0 < l.count || 0 < l.imgCount ? function(u) {
      var a = setTimeout(function() {
        if (l.stylesheets && pn(l, l.stylesheets), l.unsuspend) {
          var n = l.unsuspend;
          l.unsuspend = null, n();
        }
      }, 6e4 + t);
      0 < l.imgBytes && Ic === 0 && (Ic = 62500 * gd());
      var e = setTimeout(
        function() {
          if (l.waitingForImages = !1, l.count === 0 && (l.stylesheets && pn(l, l.stylesheets), l.unsuspend)) {
            var n = l.unsuspend;
            l.unsuspend = null, n();
          }
        },
        (l.imgBytes > Ic ? 50 : 800) + t
      );
      return l.unsuspend = u, function() {
        l.unsuspend = null, clearTimeout(a), clearTimeout(e);
      };
    } : null;
  }
  function Nn() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) pn(this, this.stylesheets);
      else if (this.unsuspend) {
        var l = this.unsuspend;
        this.unsuspend = null, l();
      }
    }
  }
  var Rn = null;
  function pn(l, t) {
    l.stylesheets = null, l.unsuspend !== null && (l.count++, Rn = /* @__PURE__ */ new Map(), t.forEach(Xd, l), Rn = null, Nn.call(l));
  }
  function Xd(l, t) {
    if (!(t.state.loading & 4)) {
      var u = Rn.get(l);
      if (u) var a = u.get(null);
      else {
        u = /* @__PURE__ */ new Map(), Rn.set(l, u);
        for (var e = l.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ), n = 0; n < e.length; n++) {
          var f = e[n];
          (f.nodeName === "LINK" || f.getAttribute("media") !== "not all") && (u.set(f.dataset.precedence, f), a = f);
        }
        a && u.set(null, a);
      }
      e = t.instance, f = e.getAttribute("data-precedence"), n = u.get(f) || a, n === a && u.set(null, e), u.set(f, e), this.count++, a = Nn.bind(this), e.addEventListener("load", a), e.addEventListener("error", a), n ? n.parentNode.insertBefore(e, n.nextSibling) : (l = l.nodeType === 9 ? l.head : l, l.insertBefore(e, l.firstChild)), t.state.loading |= 4;
    }
  }
  var se = {
    $$typeof: Al,
    Provider: null,
    Consumer: null,
    _currentValue: W,
    _currentValue2: W,
    _threadCount: 0
  };
  function Qd(l, t, u, a, e, n, f, c, i) {
    this.tag = 1, this.containerInfo = l, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Jn(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Jn(0), this.hiddenUpdates = Jn(null), this.identifierPrefix = a, this.onUncaughtError = e, this.onCaughtError = n, this.onRecoverableError = f, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = i, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function l1(l, t, u, a, e, n, f, c, i, h, g, z) {
    return l = new Qd(
      l,
      t,
      u,
      f,
      i,
      h,
      g,
      z,
      c
    ), t = 1, n === !0 && (t |= 24), n = lt(3, null, null, t), l.current = n, n.stateNode = l, t = Rf(), t.refCount++, l.pooledCache = t, t.refCount++, n.memoizedState = {
      element: a,
      isDehydrated: u,
      cache: t
    }, Bf(n), l;
  }
  function t1(l) {
    return l ? (l = la, l) : la;
  }
  function u1(l, t, u, a, e, n) {
    e = t1(e), a.context === null ? a.context = e : a.pendingContext = e, a = au(t), a.payload = { element: u }, n = n === void 0 ? null : n, n !== null && (a.callback = n), u = eu(l, a, t), u !== null && (xl(u, l, t), Ja(u, l, t));
  }
  function a1(l, t) {
    if (l = l.memoizedState, l !== null && l.dehydrated !== null) {
      var u = l.retryLane;
      l.retryLane = u !== 0 && u < t ? u : t;
    }
  }
  function Pc(l, t) {
    a1(l, t), (l = l.alternate) && a1(l, t);
  }
  function e1(l) {
    if (l.tag === 13 || l.tag === 31) {
      var t = Uu(l, 67108864);
      t !== null && xl(t, l, 67108864), Pc(l, 67108864);
    }
  }
  function n1(l) {
    if (l.tag === 13 || l.tag === 31) {
      var t = nt();
      t = wn(t);
      var u = Uu(l, t);
      u !== null && xl(u, l, t), Pc(l, t);
    }
  }
  var qn = !0;
  function jd(l, t, u, a) {
    var e = A.T;
    A.T = null;
    var n = O.p;
    try {
      O.p = 2, li(l, t, u, a);
    } finally {
      O.p = n, A.T = e;
    }
  }
  function Zd(l, t, u, a) {
    var e = A.T;
    A.T = null;
    var n = O.p;
    try {
      O.p = 8, li(l, t, u, a);
    } finally {
      O.p = n, A.T = e;
    }
  }
  function li(l, t, u, a) {
    if (qn) {
      var e = ti(a);
      if (e === null)
        jc(
          l,
          t,
          a,
          Yn,
          u
        ), c1(l, a);
      else if (xd(
        e,
        l,
        t,
        u,
        a
      ))
        a.stopPropagation();
      else if (c1(l, a), t & 4 && -1 < Vd.indexOf(l)) {
        for (; e !== null; ) {
          var n = xu(e);
          if (n !== null)
            switch (n.tag) {
              case 3:
                if (n = n.stateNode, n.current.memoizedState.isDehydrated) {
                  var f = Au(n.pendingLanes);
                  if (f !== 0) {
                    var c = n;
                    for (c.pendingLanes |= 2, c.entangledLanes |= 2; f; ) {
                      var i = 1 << 31 - Il(f);
                      c.entanglements[1] |= i, f &= ~i;
                    }
                    rt(n), ($ & 6) === 0 && (on = Fl() + 500, ie(0));
                  }
                }
                break;
              case 31:
              case 13:
                c = Uu(n, 2), c !== null && xl(c, n, 2), bn(), Pc(n, 2);
            }
          if (n = ti(a), n === null && jc(
            l,
            t,
            a,
            Yn,
            u
          ), n === e) break;
          e = n;
        }
        e !== null && a.stopPropagation();
      } else
        jc(
          l,
          t,
          a,
          null,
          u
        );
    }
  }
  function ti(l) {
    return l = uf(l), ui(l);
  }
  var Yn = null;
  function ui(l) {
    if (Yn = null, l = Vu(l), l !== null) {
      var t = ol(l);
      if (t === null) l = null;
      else {
        var u = t.tag;
        if (u === 13) {
          if (l = pl(t), l !== null) return l;
          l = null;
        } else if (u === 31) {
          if (l = N(t), l !== null) return l;
          l = null;
        } else if (u === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated)
            return t.tag === 3 ? t.stateNode.containerInfo : null;
          l = null;
        } else t !== l && (l = null);
      }
    }
    return Yn = l, null;
  }
  function f1(l) {
    switch (l) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (U1()) {
          case si:
            return 2;
          case Si:
            return 8;
          case Ae:
          case r1:
            return 32;
          case oi:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var ai = !1, Su = null, ou = null, gu = null, Se = /* @__PURE__ */ new Map(), oe = /* @__PURE__ */ new Map(), bu = [], Vd = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
    " "
  );
  function c1(l, t) {
    switch (l) {
      case "focusin":
      case "focusout":
        Su = null;
        break;
      case "dragenter":
      case "dragleave":
        ou = null;
        break;
      case "mouseover":
      case "mouseout":
        gu = null;
        break;
      case "pointerover":
      case "pointerout":
        Se.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        oe.delete(t.pointerId);
    }
  }
  function ge(l, t, u, a, e, n) {
    return l === null || l.nativeEvent !== n ? (l = {
      blockedOn: t,
      domEventName: u,
      eventSystemFlags: a,
      nativeEvent: n,
      targetContainers: [e]
    }, t !== null && (t = xu(t), t !== null && e1(t)), l) : (l.eventSystemFlags |= a, t = l.targetContainers, e !== null && t.indexOf(e) === -1 && t.push(e), l);
  }
  function xd(l, t, u, a, e) {
    switch (t) {
      case "focusin":
        return Su = ge(
          Su,
          l,
          t,
          u,
          a,
          e
        ), !0;
      case "dragenter":
        return ou = ge(
          ou,
          l,
          t,
          u,
          a,
          e
        ), !0;
      case "mouseover":
        return gu = ge(
          gu,
          l,
          t,
          u,
          a,
          e
        ), !0;
      case "pointerover":
        var n = e.pointerId;
        return Se.set(
          n,
          ge(
            Se.get(n) || null,
            l,
            t,
            u,
            a,
            e
          )
        ), !0;
      case "gotpointercapture":
        return n = e.pointerId, oe.set(
          n,
          ge(
            oe.get(n) || null,
            l,
            t,
            u,
            a,
            e
          )
        ), !0;
    }
    return !1;
  }
  function i1(l) {
    var t = Vu(l.target);
    if (t !== null) {
      var u = ol(t);
      if (u !== null) {
        if (t = u.tag, t === 13) {
          if (t = pl(u), t !== null) {
            l.blockedOn = t, Ai(l.priority, function() {
              n1(u);
            });
            return;
          }
        } else if (t === 31) {
          if (t = N(u), t !== null) {
            l.blockedOn = t, Ai(l.priority, function() {
              n1(u);
            });
            return;
          }
        } else if (t === 3 && u.stateNode.current.memoizedState.isDehydrated) {
          l.blockedOn = u.tag === 3 ? u.stateNode.containerInfo : null;
          return;
        }
      }
    }
    l.blockedOn = null;
  }
  function Bn(l) {
    if (l.blockedOn !== null) return !1;
    for (var t = l.targetContainers; 0 < t.length; ) {
      var u = ti(l.nativeEvent);
      if (u === null) {
        u = l.nativeEvent;
        var a = new u.constructor(
          u.type,
          u
        );
        tf = a, u.target.dispatchEvent(a), tf = null;
      } else
        return t = xu(u), t !== null && e1(t), l.blockedOn = u, !1;
      t.shift();
    }
    return !0;
  }
  function y1(l, t, u) {
    Bn(l) && u.delete(t);
  }
  function Ld() {
    ai = !1, Su !== null && Bn(Su) && (Su = null), ou !== null && Bn(ou) && (ou = null), gu !== null && Bn(gu) && (gu = null), Se.forEach(y1), oe.forEach(y1);
  }
  function Cn(l, t) {
    l.blockedOn === t && (l.blockedOn = null, ai || (ai = !0, C.unstable_scheduleCallback(
      C.unstable_NormalPriority,
      Ld
    )));
  }
  var Gn = null;
  function v1(l) {
    Gn !== l && (Gn = l, C.unstable_scheduleCallback(
      C.unstable_NormalPriority,
      function() {
        Gn === l && (Gn = null);
        for (var t = 0; t < l.length; t += 3) {
          var u = l[t], a = l[t + 1], e = l[t + 2];
          if (typeof a != "function") {
            if (ui(a || u) === null)
              continue;
            break;
          }
          var n = xu(u);
          n !== null && (l.splice(t, 3), t -= 3, tc(
            n,
            {
              pending: !0,
              data: e,
              method: u.method,
              action: a
            },
            a,
            e
          ));
        }
      }
    ));
  }
  function Oa(l) {
    function t(i) {
      return Cn(i, l);
    }
    Su !== null && Cn(Su, l), ou !== null && Cn(ou, l), gu !== null && Cn(gu, l), Se.forEach(t), oe.forEach(t);
    for (var u = 0; u < bu.length; u++) {
      var a = bu[u];
      a.blockedOn === l && (a.blockedOn = null);
    }
    for (; 0 < bu.length && (u = bu[0], u.blockedOn === null); )
      i1(u), u.blockedOn === null && bu.shift();
    if (u = (l.ownerDocument || l).$$reactFormReplay, u != null)
      for (a = 0; a < u.length; a += 3) {
        var e = u[a], n = u[a + 1], f = e[Gl] || null;
        if (typeof n == "function")
          f || v1(u);
        else if (f) {
          var c = null;
          if (n && n.hasAttribute("formAction")) {
            if (e = n, f = n[Gl] || null)
              c = f.formAction;
            else if (ui(e) !== null) continue;
          } else c = f.action;
          typeof c == "function" ? u[a + 1] = c : (u.splice(a, 3), a -= 3), v1(u);
        }
      }
  }
  function m1() {
    function l(n) {
      n.canIntercept && n.info === "react-transition" && n.intercept({
        handler: function() {
          return new Promise(function(f) {
            return e = f;
          });
        },
        focusReset: "manual",
        scroll: "manual"
      });
    }
    function t() {
      e !== null && (e(), e = null), a || setTimeout(u, 20);
    }
    function u() {
      if (!a && !navigation.transition) {
        var n = navigation.currentEntry;
        n && n.url != null && navigation.navigate(n.url, {
          state: n.getState(),
          info: "react-transition",
          history: "replace"
        });
      }
    }
    if (typeof navigation == "object") {
      var a = !1, e = null;
      return navigation.addEventListener("navigate", l), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(u, 100), function() {
        a = !0, navigation.removeEventListener("navigate", l), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), e !== null && (e(), e = null);
      };
    }
  }
  function ei(l) {
    this._internalRoot = l;
  }
  Xn.prototype.render = ei.prototype.render = function(l) {
    var t = this._internalRoot;
    if (t === null) throw Error(o(409));
    var u = t.current, a = nt();
    u1(u, a, l, t, null, null);
  }, Xn.prototype.unmount = ei.prototype.unmount = function() {
    var l = this._internalRoot;
    if (l !== null) {
      this._internalRoot = null;
      var t = l.containerInfo;
      u1(l.current, 2, null, l, null, null), bn(), t[Zu] = null;
    }
  };
  function Xn(l) {
    this._internalRoot = l;
  }
  Xn.prototype.unstable_scheduleHydration = function(l) {
    if (l) {
      var t = Ei();
      l = { blockedOn: null, target: l, priority: t };
      for (var u = 0; u < bu.length && t !== 0 && t < bu[u].priority; u++) ;
      bu.splice(u, 0, l), u === 0 && i1(l);
    }
  };
  var d1 = k.version;
  if (d1 !== "19.2.0")
    throw Error(
      o(
        527,
        d1,
        "19.2.0"
      )
    );
  O.findDOMNode = function(l) {
    var t = l._reactInternals;
    if (t === void 0)
      throw typeof l.render == "function" ? Error(o(188)) : (l = Object.keys(l).join(","), Error(o(268, l)));
    return l = ll(t), l = l !== null ? fl(l) : null, l = l === null ? null : l.stateNode, l;
  };
  var Kd = {
    bundleType: 0,
    version: "19.2.0",
    rendererPackageName: "react-dom",
    currentDispatcherRef: A,
    reconcilerVersion: "19.2.0"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Qn = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Qn.isDisabled && Qn.supportsFiber)
      try {
        Da = Qn.inject(
          Kd
        ), kl = Qn;
      } catch {
      }
  }
  return ze.createRoot = function(l, t) {
    if (!Nl(l)) throw Error(o(299));
    var u = !1, a = "", e = zy, n = Ty, f = Ey;
    return t != null && (t.unstable_strictMode === !0 && (u = !0), t.identifierPrefix !== void 0 && (a = t.identifierPrefix), t.onUncaughtError !== void 0 && (e = t.onUncaughtError), t.onCaughtError !== void 0 && (n = t.onCaughtError), t.onRecoverableError !== void 0 && (f = t.onRecoverableError)), t = l1(
      l,
      1,
      !1,
      null,
      null,
      u,
      a,
      null,
      e,
      n,
      f,
      m1
    ), l[Zu] = t.current, Qc(l), new ei(t);
  }, ze.hydrateRoot = function(l, t, u) {
    if (!Nl(l)) throw Error(o(299));
    var a = !1, e = "", n = zy, f = Ty, c = Ey, i = null;
    return u != null && (u.unstable_strictMode === !0 && (a = !0), u.identifierPrefix !== void 0 && (e = u.identifierPrefix), u.onUncaughtError !== void 0 && (n = u.onUncaughtError), u.onCaughtError !== void 0 && (f = u.onCaughtError), u.onRecoverableError !== void 0 && (c = u.onRecoverableError), u.formState !== void 0 && (i = u.formState)), t = l1(
      l,
      1,
      !0,
      t,
      u ?? null,
      a,
      e,
      i,
      n,
      f,
      c,
      m1
    ), t.context = t1(null), u = t.current, a = nt(), a = wn(a), e = au(a), e.callback = null, eu(u, e, a), u = a, t.current.lanes = u, ra(t, u), rt(t), l[Zu] = t.current, Qc(l), new Xn(t);
  }, ze.version = "19.2.0", ze;
}
var A1;
function ah() {
  if (A1) return ci.exports;
  A1 = 1;
  function R() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(R);
      } catch (C) {
        console.error(C);
      }
  }
  return R(), ci.exports = uh(), ci.exports;
}
var eh = ah();
const nh = /* @__PURE__ */ _1(eh);
function fh() {
  const [R, C] = kd.useState("");
  return /* @__PURE__ */ Te.jsxs("div", { className: "bg-gray-800/50 p-6 rounded-lg border border-gray-700 animate-fade-in", children: [
    /* @__PURE__ */ Te.jsx("h1", { className: "text-2xl font-bold text-white", children: "sup man im really tired of js" }),
    /* @__PURE__ */ Te.jsx(
      "input",
      {
        type: "text",
        value: R,
        onChange: (k) => C(k.target.value)
      }
    ),
    /* @__PURE__ */ Te.jsxs("div", { children: [
      "react state value: ",
      R
    ] })
  ] });
}
function ch(R) {
  const C = nh.createRoot(R);
  return C.render(/* @__PURE__ */ Te.jsx(fh, {})), C;
}
export {
  ch as tugboatReact
};
