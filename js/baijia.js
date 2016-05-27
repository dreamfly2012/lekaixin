!
function(t) {
    String.prototype.trim === t && (String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "")
    }),
    Array.prototype.reduce === t && (Array.prototype.reduce = function(e) {
        if (void 0 === this || null === this) throw new TypeError;
        var n, i = Object(this),
        r = i.length >>> 0,
        o = 0;
        if ("function" != typeof e) throw new TypeError;
        if (0 == r && 1 == arguments.length) throw new TypeError;
        if (arguments.length >= 2) n = arguments[1];
        else for (;;) {
            if (o in i) {
                n = i[o++];
                break
            }
            if (++o >= r) throw new TypeError
        }
        for (; r > o;) o in i && (n = e.call(t, n, i[o], o, i)),
        o++;
        return n
    })
} ();
var Zepto = function() {
    function t(t) {
        return null == t ? String(t) : J[X.call(t)] || "object"
    }
    function e(e) {
        return "function" == t(e)
    }
    function n(t) {
        return null != t && t == t.window
    }
    function i(t) {
        return null != t && t.nodeType == t.DOCUMENT_NODE
    }
    function r(e) {
        return "object" == t(e)
    }
    function o(t) {
        return r(t) && !n(t) && t.__proto__ == Object.prototype
    }
    function a(t) {
        return t instanceof Array
    }
    function s(t) {
        return "number" == typeof t.length
    }
    function u(t) {
        return P.call(t,
        function(t) {
            return null != t
        })
    }
    function c(t) {
        return t.length > 0 ? S.fn.concat.apply([], t) : t
    }
    function l(t) {
        return t.replace(/::/g, "/").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/_/g, "-").toLowerCase()
    }
    function f(t) {
        return t in M ? M[t] : M[t] = new RegExp("(^|\\s)" + t + "(\\s|$)")
    }
    function h(t, e) {
        return "number" != typeof e || z[l(t)] ? e: e + "px"
    }
    function d(t) {
        var e, n;
        return k[t] || (e = A.createElement(t), A.body.appendChild(e), n = $(e, "").getPropertyValue("display"), e.parentNode.removeChild(e), "none" == n && (n = "block"), k[t] = n),
        k[t]
    }
    function p(t) {
        return "children" in t ? _.call(t.children) : S.map(t.childNodes,
        function(t) {
            return 1 == t.nodeType ? t: void 0
        })
    }
    function m(t, e, n) {
        for (T in e) n && (o(e[T]) || a(e[T])) ? (o(e[T]) && !o(t[T]) && (t[T] = {}), a(e[T]) && !a(t[T]) && (t[T] = []), m(t[T], e[T], n)) : e[T] !== E && (t[T] = e[T])
    }
    function v(t, e) {
        return e === E ? S(t) : S(t).filter(e)
    }
    function g(t, n, i, r) {
        return e(n) ? n.call(t, i, r) : n
    }
    function y(t, e, n) {
        null == n ? t.removeAttribute(e) : t.setAttribute(e, n)
    }
    function w(t, e) {
        var n = t.className,
        i = n && n.baseVal !== E;
        return e === E ? i ? n.baseVal: n: void(i ? n.baseVal = e: t.className = e)
    }
    function b(t) {
        var e;
        try {
            return t ? "true" == t || ("false" == t ? !1 : "null" == t ? null: isNaN(e = Number(t)) ? /^[\[\{]/.test(t) ? S.parseJSON(t) : t: e) : t
        } catch(n) {
            return t
        }
    }
    function x(t, e) {
        e(t);
        for (var n in t.childNodes) x(t.childNodes[n], e)
    }
    var E, T, S, j, N, C, O = [],
    _ = O.slice,
    P = O.filter,
    A = window.document,
    k = {},
    M = {},
    $ = A.defaultView.getComputedStyle,
    z = {
        "column-count": 1,
        columns: 1,
        "font-weight": 1,
        "line-height": 1,
        opacity: 1,
        "z-index": 1,
        zoom: 1
    },
    Z = /^\s*<(\w+|!)[^>]*>/,
    R = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
    L = /^(?:body|html)$/i,
    D = ["val", "css", "html", "text", "data", "width", "height", "offset"],
    q = ["after", "prepend", "before", "append"],
    B = A.createElement("table"),
    I = A.createElement("tr"),
    F = {
        tr: A.createElement("tbody"),
        tbody: B,
        thead: B,
        tfoot: B,
        td: I,
        th: I,
        "*": A.createElement("div")
    },
    H = /complete|loaded|interactive/,
    U = /^\.([\w-]+)$/,
    V = /^#([\w-]*)$/,
    W = /^[\w-]+$/,
    J = {},
    X = J.toString,
    Y = {},
    G = A.createElement("div");
    return Y.matches = function(t, e) {
        if (!t || 1 !== t.nodeType) return ! 1;
        var n = t.webkitMatchesSelector || t.mozMatchesSelector || t.oMatchesSelector || t.matchesSelector;
        if (n) return n.call(t, e);
        var i, r = t.parentNode,
        o = !r;
        return o && (r = G).appendChild(t),
        i = ~Y.qsa(r, e).indexOf(t),
        o && G.removeChild(t),
        i
    },
    N = function(t) {
        return t.replace(/-+(.)?/g,
        function(t, e) {
            return e ? e.toUpperCase() : ""
        })
    },
    C = function(t) {
        return P.call(t,
        function(e, n) {
            return t.indexOf(e) == n
        })
    },
    Y.fragment = function(t, e, n) {
        t.replace && (t = t.replace(R, "<$1></$2>")),
        e === E && (e = Z.test(t) && RegExp.$1),
        e in F || (e = "*");
        var i, r, a = F[e];
        return a.innerHTML = "" + t,
        r = S.each(_.call(a.childNodes),
        function() {
            a.removeChild(this)
        }),
        o(n) && (i = S(r), S.each(n,
        function(t, e) {
            D.indexOf(t) > -1 ? i[t](e) : i.attr(t, e)
        })),
        r
    },
    Y.Z = function(t, e) {
        return t = t || [],
        t.__proto__ = S.fn,
        t.selector = e || "",
        t
    },
    Y.isZ = function(t) {
        return t instanceof Y.Z
    },
    Y.init = function(t, n) {
        if (t) {
            if (e(t)) return S(A).ready(t);
            if (Y.isZ(t)) return t;
            var i;
            if (a(t)) i = u(t);
            else if (r(t)) i = [o(t) ? S.extend({},
            t) : t],
            t = null;
            else if (Z.test(t)) i = Y.fragment(t.trim(), RegExp.$1, n),
            t = null;
            else {
                if (n !== E) return S(n).find(t);
                i = Y.qsa(A, t)
            }
            return Y.Z(i, t)
        }
        return Y.Z()
    },
    S = function(t, e) {
        return Y.init(t, e)
    },
    S.extend = function(t) {
        var e, n = _.call(arguments, 1);
        return "boolean" == typeof t && (e = t, t = n.shift()),
        n.forEach(function(n) {
            m(t, n, e)
        }),
        t
    },
    Y.qsa = function(t, e) {
        var n;
        return i(t) && V.test(e) ? (n = t.getElementById(RegExp.$1)) ? [n] : [] : 1 !== t.nodeType && 9 !== t.nodeType ? [] : _.call(U.test(e) ? t.getElementsByClassName(RegExp.$1) : W.test(e) ? t.getElementsByTagName(e) : t.querySelectorAll(e))
    },
    S.contains = function(t, e) {
        return t !== e && t.contains(e)
    },
    S.type = t,
    S.isFunction = e,
    S.isWindow = n,
    S.isArray = a,
    S.isPlainObject = o,
    S.isEmptyObject = function(t) {
        var e;
        for (e in t) return ! 1;
        return ! 0
    },
    S.inArray = function(t, e, n) {
        return O.indexOf.call(e, t, n)
    },
    S.camelCase = N,
    S.trim = function(t) {
        return t.trim()
    },
    S.uuid = 0,
    S.support = {},
    S.expr = {},
    S.map = function(t, e) {
        var n, i, r, o = [];
        if (s(t)) for (i = 0; i < t.length; i++) n = e(t[i], i),
        null != n && o.push(n);
        else for (r in t) n = e(t[r], r),
        null != n && o.push(n);
        return c(o)
    },
    S.each = function(t, e) {
        var n, i;
        if (s(t)) {
            for (n = 0; n < t.length; n++) if (e.call(t[n], n, t[n]) === !1) return t
        } else for (i in t) if (e.call(t[i], i, t[i]) === !1) return t;
        return t
    },
    S.grep = function(t, e) {
        return P.call(t, e)
    },
    window.JSON && (S.parseJSON = JSON.parse),
    S.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),
    function(t, e) {
        J["[object " + e + "]"] = e.toLowerCase()
    }),
    S.fn = {
        forEach: O.forEach,
        reduce: O.reduce,
        push: O.push,
        sort: O.sort,
        indexOf: O.indexOf,
        concat: O.concat,
        map: function(t) {
            return S(S.map(this,
            function(e, n) {
                return t.call(e, n, e)
            }))
        },
        slice: function() {
            return S(_.apply(this, arguments))
        },
        ready: function(t) {
            return H.test(A.readyState) ? t(S) : A.addEventListener("DOMContentLoaded",
            function() {
                t(S)
            },
            !1),
            this
        },
        get: function(t) {
            return t === E ? _.call(this) : this[t >= 0 ? t: t + this.length]
        },
        toArray: function() {
            return this.get()
        },
        size: function() {
            return this.length
        },
        remove: function() {
            return this.each(function() {
                null != this.parentNode && this.parentNode.removeChild(this)
            })
        },
        each: function(t) {
            return O.every.call(this,
            function(e, n) {
                return t.call(e, n, e) !== !1
            }),
            this
        },
        filter: function(t) {
            return e(t) ? this.not(this.not(t)) : S(P.call(this,
            function(e) {
                return Y.matches(e, t)
            }))
        },
        add: function(t, e) {
            return S(C(this.concat(S(t, e))))
        },
        is: function(t) {
            return this.length > 0 && Y.matches(this[0], t)
        },
        not: function(t) {
            var n = [];
            if (e(t) && t.call !== E) this.each(function(e) {
                t.call(this, e) || n.push(this)
            });
            else {
                var i = "string" == typeof t ? this.filter(t) : s(t) && e(t.item) ? _.call(t) : S(t);
                this.forEach(function(t) {
                    i.indexOf(t) < 0 && n.push(t)
                })
            }
            return S(n)
        },
        has: function(t) {
            return this.filter(function() {
                return r(t) ? S.contains(this, t) : S(this).find(t).size()
            })
        },
        eq: function(t) {
            return - 1 === t ? this.slice(t) : this.slice(t, +t + 1)
        },
        first: function() {
            var t = this[0];
            return t && !r(t) ? t: S(t)
        },
        last: function() {
            var t = this[this.length - 1];
            return t && !r(t) ? t: S(t)
        },
        find: function(t) {
            var e, n = this;
            return e = "object" == typeof t ? S(t).filter(function() {
                var t = this;
                return O.some.call(n,
                function(e) {
                    return S.contains(e, t)
                })
            }) : 1 == this.length ? S(Y.qsa(this[0], t)) : this.map(function() {
                return Y.qsa(this, t)
            })
        },
        closest: function(t, e) {
            var n = this[0],
            r = !1;
            for ("object" == typeof t && (r = S(t)); n && !(r ? r.indexOf(n) >= 0 : Y.matches(n, t));) n = n !== e && !i(n) && n.parentNode;
            return S(n)
        },
        parents: function(t) {
            for (var e = [], n = this; n.length > 0;) n = S.map(n,
            function(t) {
                return (t = t.parentNode) && !i(t) && e.indexOf(t) < 0 ? (e.push(t), t) : void 0
            });
            return v(e, t)
        },
        parent: function(t) {
            return v(C(this.pluck("parentNode")), t)
        },
        children: function(t) {
            return v(this.map(function() {
                return p(this)
            }), t)
        },
        contents: function() {
            return this.map(function() {
                return _.call(this.childNodes)
            })
        },
        siblings: function(t) {
            return v(this.map(function(t, e) {
                return P.call(p(e.parentNode),
                function(t) {
                    return t !== e
                })
            }), t)
        },
        empty: function() {
            return this.each(function() {
                this.innerHTML = ""
            })
        },
        pluck: function(t) {
            return S.map(this,
            function(e) {
                return e[t]
            })
        },
        show: function() {
            return this.each(function() {
                "none" == this.style.display && (this.style.display = null),
                "none" == $(this, "").getPropertyValue("display") && (this.style.display = d(this.nodeName))
            })
        },
        replaceWith: function(t) {
            return this.before(t).remove()
        },
        wrap: function(t) {
            var n = e(t);
            if (this[0] && !n) var i = S(t).get(0),
            r = i.parentNode || this.length > 1;
            return this.each(function(e) {
                S(this).wrapAll(n ? t.call(this, e) : r ? i.cloneNode(!0) : i)
            })
        },
        wrapAll: function(t) {
            if (this[0]) {
                S(this[0]).before(t = S(t));
                for (var e; (e = t.children()).length;) t = e.first();
                S(t).append(this)
            }
            return this
        },
        wrapInner: function(t) {
            var n = e(t);
            return this.each(function(e) {
                var i = S(this),
                r = i.contents(),
                o = n ? t.call(this, e) : t;
                r.length ? r.wrapAll(o) : i.append(o)
            })
        },
        unwrap: function() {
            return this.parent().each(function() {
                S(this).replaceWith(S(this).children())
            }),
            this
        },
        clone: function() {
            return this.map(function() {
                return this.cloneNode(!0)
            })
        },
        hide: function() {
            return this.css("display", "none")
        },
        toggle: function(t) {
            return this.each(function() {
                var e = S(this); (t === E ? "none" == e.css("display") : t) ? e.show() : e.hide()
            })
        },
        prev: function(t) {
            return S(this.pluck("previousElementSibling")).filter(t || "*")
        },
        next: function(t) {
            return S(this.pluck("nextElementSibling")).filter(t || "*")
        },
        html: function(t) {
            return t === E ? this.length > 0 ? this[0].innerHTML: null: this.each(function(e) {
                var n = this.innerHTML;
                S(this).empty().append(g(this, t, e, n))
            })
        },
        text: function(t) {
            return t === E ? this.length > 0 ? this[0].textContent: null: this.each(function() {
                this.textContent = t
            })
        },
        attr: function(t, e) {
            var n;
            return "string" == typeof t && e === E ? 0 == this.length || 1 !== this[0].nodeType ? E: "value" == t && "INPUT" == this[0].nodeName ? this.val() : !(n = this[0].getAttribute(t)) && t in this[0] ? this[0][t] : n: this.each(function(n) {
                if (1 === this.nodeType) if (r(t)) for (T in t) y(this, T, t[T]);
                else y(this, t, g(this, e, n, this.getAttribute(t)))
            })
        },
        removeAttr: function(t) {
            return this.each(function() {
                1 === this.nodeType && y(this, t)
            })
        },
        prop: function(t, e) {
            return e === E ? this[0] && this[0][t] : this.each(function(n) {
                this[t] = g(this, e, n, this[t])
            })
        },
        data: function(t, e) {
            var n = this.attr("data-" + l(t), e);
            return null !== n ? b(n) : E
        },
        val: function(t) {
            return t === E ? this[0] && (this[0].multiple ? S(this[0]).find("option").filter(function() {
                return this.selected
            }).pluck("value") : this[0].value) : this.each(function(e) {
                this.value = g(this, t, e, this.value)
            })
        },
        offset: function(t) {
            if (t) return this.each(function(e) {
                var n = S(this),
                i = g(this, t, e, n.offset()),
                r = n.offsetParent().offset(),
                o = {
                    top: i.top - r.top,
                    left: i.left - r.left
                };
                "static" == n.css("position") && (o.position = "relative"),
                n.css(o)
            });
            if (0 == this.length) return null;
            var e = this[0].getBoundingClientRect();
            return {
                left: e.left + window.pageXOffset,
                top: e.top + window.pageYOffset,
                width: Math.round(e.width),
                height: Math.round(e.height)
            }
        },
        css: function(e, n) {
            if (arguments.length < 2 && "string" == typeof e) return this[0] && (this[0].style[N(e)] || $(this[0], "").getPropertyValue(e));
            var i = "";
            if ("string" == t(e)) n || 0 === n ? i = l(e) + ":" + h(e, n) : this.each(function() {
                this.style.removeProperty(l(e))
            });
            else for (T in e) e[T] || 0 === e[T] ? i += l(T) + ":" + h(T, e[T]) + ";": this.each(function() {
                this.style.removeProperty(l(T))
            });
            return this.each(function() {
                this.style.cssText += ";" + i
            })
        },
        index: function(t) {
            return t ? this.indexOf(S(t)[0]) : this.parent().children().indexOf(this[0])
        },
        hasClass: function(t) {
            return O.some.call(this,
            function(t) {
                return this.test(w(t))
            },
            f(t))
        },
        addClass: function(t) {
            return this.each(function(e) {
                j = [];
                var n = w(this),
                i = g(this, t, e, n);
                i.split(/\s+/g).forEach(function(t) {
                    S(this).hasClass(t) || j.push(t)
                },
                this),
                j.length && w(this, n + (n ? " ": "") + j.join(" "))
            })
        },
        removeClass: function(t) {
            return this.each(function(e) {
                return t === E ? w(this, "") : (j = w(this), g(this, t, e, j).split(/\s+/g).forEach(function(t) {
                    j = j.replace(f(t), " ")
                }), void w(this, j.trim()))
            })
        },
        toggleClass: function(t, e) {
            return this.each(function(n) {
                var i = S(this),
                r = g(this, t, n, w(this));
                r.split(/\s+/g).forEach(function(t) { (e === E ? !i.hasClass(t) : e) ? i.addClass(t) : i.removeClass(t)
                })
            })
        },
        scrollTop: function() {
            return this.length ? "scrollTop" in this[0] ? this[0].scrollTop: this[0].scrollY: void 0
        },
        position: function() {
            if (this.length) {
                var t = this[0],
                e = this.offsetParent(),
                n = this.offset(),
                i = L.test(e[0].nodeName) ? {
                    top: 0,
                    left: 0
                }: e.offset();
                return n.top -= parseFloat(S(t).css("margin-top")) || 0,
                n.left -= parseFloat(S(t).css("margin-left")) || 0,
                i.top += parseFloat(S(e[0]).css("border-top-width")) || 0,
                i.left += parseFloat(S(e[0]).css("border-left-width")) || 0,
                {
                    top: n.top - i.top,
                    left: n.left - i.left
                }
            }
        },
        offsetParent: function() {
            return this.map(function() {
                for (var t = this.offsetParent || A.body; t && !L.test(t.nodeName) && "static" == S(t).css("position");) t = t.offsetParent;
                return t
            })
        }
    },
    S.fn.detach = S.fn.remove,
    ["width", "height"].forEach(function(t) {
        S.fn[t] = function(e) {
            var r, o = this[0],
            a = t.replace(/./,
            function(t) {
                return t[0].toUpperCase()
            });
            return e === E ? n(o) ? o["inner" + a] : i(o) ? o.documentElement["offset" + a] : (r = this.offset()) && r[t] : this.each(function(n) {
                o = S(this),
                o.css(t, g(this, e, n, o[t]()))
            })
        }
    }),
    q.forEach(function(e, n) {
        var i = n % 2;
        S.fn[e] = function() {
            var e, r, o = S.map(arguments,
            function(n) {
                return e = t(n),
                "object" == e || "array" == e || null == n ? n: Y.fragment(n)
            }),
            a = this.length > 1;
            return o.length < 1 ? this: this.each(function(t, e) {
                r = i ? e: e.parentNode,
                e = 0 == n ? e.nextSibling: 1 == n ? e.firstChild: 2 == n ? e: null,
                o.forEach(function(t) {
                    if (a) t = t.cloneNode(!0);
                    else if (!r) return S(t).remove();
                    x(r.insertBefore(t, e),
                    function(t) {
                        null == t.nodeName || "SCRIPT" !== t.nodeName.toUpperCase() || t.type && "text/javascript" !== t.type || t.src || window.eval.call(window, t.innerHTML)
                    })
                })
            })
        },
        S.fn[i ? e + "To": "insert" + (n ? "Before": "After")] = function(t) {
            return S(t)[e](this),
            this
        }
    }),
    Y.Z.prototype = S.fn,
    Y.uniq = C,
    Y.deserializeValue = b,
    S.zepto = Y,
    S
} ();
window.Zepto = Zepto,
"$" in window || (window.$ = Zepto),
function(t) {
    function e(t) {
        var e = this.os = {},
        n = this.browser = {},
        i = t.match(/WebKit\/([\d.]+)/),
        r = t.match(/(Android)\s+([\d.]+)/),
        o = t.match(/(iPad).*OS\s([\d_]+)/),
        a = !o && t.match(/(iPhone\sOS)\s([\d_]+)/),
        s = t.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
        u = s && t.match(/TouchPad/),
        c = t.match(/Kindle\/([\d.]+)/),
        l = t.match(/Silk\/([\d._]+)/),
        f = t.match(/(BlackBerry).*Version\/([\d.]+)/),
        h = t.match(/(BB10).*Version\/([\d.]+)/),
        d = t.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
        p = t.match(/PlayBook/),
        m = t.match(/Chrome\/([\d.]+)/) || t.match(/CriOS\/([\d.]+)/),
        v = t.match(/Firefox\/([\d.]+)/); (n.webkit = !!i) && (n.version = i[1]),
        r && (e.android = !0, e.version = r[2]),
        a && (e.ios = e.iphone = !0, e.version = a[2].replace(/_/g, ".")),
        o && (e.ios = e.ipad = !0, e.version = o[2].replace(/_/g, ".")),
        s && (e.webos = !0, e.version = s[2]),
        u && (e.touchpad = !0),
        f && (e.blackberry = !0, e.version = f[2]),
        h && (e.bb10 = !0, e.version = h[2]),
        d && (e.rimtabletos = !0, e.version = d[2]),
        p && (n.playbook = !0),
        c && (e.kindle = !0, e.version = c[1]),
        l && (n.silk = !0, n.version = l[1]),
        !l && e.android && t.match(/Kindle Fire/) && (n.silk = !0),
        m && (n.chrome = !0, n.version = m[1]),
        v && (n.firefox = !0, n.version = v[1]),
        e.tablet = !!(o || p || r && !t.match(/Mobile/) || v && t.match(/Tablet/)),
        e.phone = !(e.tablet || !(r || a || s || f || h || m && t.match(/Android/) || m && t.match(/CriOS\/([\d.]+)/) || v && t.match(/Mobile/)))
    }
    e.call(t, navigator.userAgent),
    t.__detect = e
} (Zepto),
function(t) {
    function e(t) {
        return t._zid || (t._zid = d++)
    }
    function n(t, n, o, a) {
        if (n = i(n), n.ns) var s = r(n.ns);
        return (h[e(t)] || []).filter(function(t) {
            return ! (!t || n.e && t.e != n.e || n.ns && !s.test(t.ns) || o && e(t.fn) !== e(o) || a && t.sel != a)
        })
    }
    function i(t) {
        var e = ("" + t).split(".");
        return {
            e: e[0],
            ns: e.slice(1).sort().join(" ")
        }
    }
    function r(t) {
        return new RegExp("(?:^| )" + t.replace(" ", " .* ?") + "(?: |$)")
    }
    function o(e, n, i) {
        "string" != t.type(e) ? t.each(e, i) : e.split(/\s/).forEach(function(t) {
            i(t, n)
        })
    }
    function a(t, e) {
        return t.del && ("focus" == t.e || "blur" == t.e) || !!e
    }
    function s(t) {
        return m[t] || t
    }
    function u(n, r, u, c, l, f) {
        var d = e(n),
        p = h[d] || (h[d] = []);
        o(r, u,
        function(e, r) {
            var o = i(e);
            o.fn = r,
            o.sel = c,
            o.e in m && (r = function(e) {
                var n = e.relatedTarget;
                return ! n || n !== this && !t.contains(this, n) ? o.fn.apply(this, arguments) : void 0
            }),
            o.del = l && l(r, e);
            var u = o.del || r;
            o.proxy = function(t) {
                var e = u.apply(n, [t].concat(t.data));
                return e === !1 && (t.preventDefault(), t.stopPropagation()),
                e
            },
            o.i = p.length,
            p.push(o),
            n.addEventListener(s(o.e), o.proxy, a(o, f))
        })
    }
    function c(t, i, r, u, c) {
        var l = e(t);
        o(i || "", r,
        function(e, i) {
            n(t, e, i, u).forEach(function(e) {
                delete h[l][e.i],
                t.removeEventListener(s(e.e), e.proxy, a(e, c))
            })
        })
    }
    function l(e) {
        var n, i = {
            originalEvent: e
        };
        for (n in e) y.test(n) || void 0 === e[n] || (i[n] = e[n]);
        return t.each(w,
        function(t, n) {
            i[t] = function() {
                return this[n] = v,
                e[t].apply(e, arguments)
            },
            i[n] = g
        }),
        i
    }
    function f(t) {
        if (! ("defaultPrevented" in t)) {
            t.defaultPrevented = !1;
            var e = t.preventDefault;
            t.preventDefault = function() {
                this.defaultPrevented = !0,
                e.call(this)
            }
        }
    }
    var h = (t.zepto.qsa, {}),
    d = 1,
    p = {},
    m = {
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    };
    p.click = p.mousedown = p.mouseup = p.mousemove = "MouseEvents",
    t.event = {
        add: u,
        remove: c
    },
    t.proxy = function(n, i) {
        if (t.isFunction(n)) {
            var r = function() {
                return n.apply(i, arguments)
            };
            return r._zid = e(n),
            r
        }
        if ("string" == typeof i) return t.proxy(n[i], n);
        throw new TypeError("expected function")
    },
    t.fn.bind = function(t, e) {
        return this.each(function() {
            u(this, t, e)
        })
    },
    t.fn.unbind = function(t, e) {
        return this.each(function() {
            c(this, t, e)
        })
    },
    t.fn.one = function(t, e) {
        return this.each(function(n, i) {
            u(this, t, e, null,
            function(t, e) {
                return function() {
                    var n = t.apply(i, arguments);
                    return c(i, e, t),
                    n
                }
            })
        })
    };
    var v = function() {
        return ! 0
    },
    g = function() {
        return ! 1
    },
    y = /^([A-Z]|layer[XY]$)/,
    w = {
        preventDefault: "isDefaultPrevented",
        stopImmediatePropagation: "isImmediatePropagationStopped",
        stopPropagation: "isPropagationStopped"
    };
    t.fn.delegate = function(e, n, i) {
        return this.each(function(r, o) {
            u(o, n, i, e,
            function(n) {
                return function(i) {
                    var r, a = t(i.target).closest(e, o).get(0);
                    return a ? (r = t.extend(l(i), {
                        currentTarget: a,
                        liveFired: o
                    }), n.apply(a, [r].concat([].slice.call(arguments, 1)))) : void 0
                }
            })
        })
    },
    t.fn.undelegate = function(t, e, n) {
        return this.each(function() {
            c(this, e, n, t)
        })
    },
    t.fn.live = function(e, n) {
        return t(document.body).delegate(this.selector, e, n),
        this
    },
    t.fn.die = function(e, n) {
        return t(document.body).undelegate(this.selector, e, n),
        this
    },
    t.fn.on = function(e, n, i) {
        return ! n || t.isFunction(n) ? this.bind(e, n || i) : this.delegate(n, e, i)
    },
    t.fn.off = function(e, n, i) {
        return ! n || t.isFunction(n) ? this.unbind(e, n || i) : this.undelegate(n, e, i)
    },
    t.fn.trigger = function(e, n) {
        return ("string" == typeof e || t.isPlainObject(e)) && (e = t.Event(e)),
        f(e),
        e.data = n,
        this.each(function() {
            "dispatchEvent" in this && this.dispatchEvent(e)
        })
    },
    t.fn.triggerHandler = function(e, i) {
        var r, o;
        return this.each(function(a, s) {
            r = l("string" == typeof e ? t.Event(e) : e),
            r.data = i,
            r.target = s,
            t.each(n(s, e.type || e),
            function(t, e) {
                return o = e.proxy(r),
                r.isImmediatePropagationStopped() ? !1 : void 0
            })
        }),
        o
    },
    "focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select keydown keypress keyup error".split(" ").forEach(function(e) {
        t.fn[e] = function(t) {
            return t ? this.bind(e, t) : this.trigger(e)
        }
    }),
    ["focus", "blur"].forEach(function(e) {
        t.fn[e] = function(t) {
            return t ? this.bind(e, t) : this.each(function() {
                try {
                    this[e]()
                } catch(t) {}
            }),
            this
        }
    }),
    t.Event = function(t, e) {
        "string" != typeof t && (e = t, t = e.type);
        var n = document.createEvent(p[t] || "Events"),
        i = !0;
        if (e) for (var r in e)"bubbles" == r ? i = !!e[r] : n[r] = e[r];
        return n.initEvent(t, i, !0, null, null, null, null, null, null, null, null, null, null, null, null),
        n.isDefaultPrevented = function() {
            return this.defaultPrevented
        },
        n
    }
} (Zepto),
function(t) {
    function e(e, n, i) {
        var r = t.Event(n);
        return t(e).trigger(r, i),
        !r.defaultPrevented
    }
    function n(t, n, i, r) {
        return t.global ? e(n || y, i, r) : void 0
    }
    function i(e) {
        e.global && 0 === t.active++&&n(e, null, "ajaxStart")
    }
    function r(e) {
        e.global && !--t.active && n(e, null, "ajaxStop")
    }
    function o(t, e) {
        var i = e.context;
        return e.beforeSend.call(i, t, e) === !1 || n(e, i, "ajaxBeforeSend", [t, e]) === !1 ? !1 : void n(e, i, "ajaxSend", [t, e])
    }
    function a(t, e, i) {
        var r = i.context,
        o = "success";
        i.success.call(r, t, o, e),
        n(i, r, "ajaxSuccess", [e, i, t]),
        u(o, e, i)
    }
    function s(t, e, i, r) {
        var o = r.context;
        r.error.call(o, i, e, t),
        n(r, o, "ajaxError", [i, r, t]),
        u(e, i, r)
    }
    function u(t, e, i) {
        var o = i.context;
        i.complete.call(o, e, t),
        n(i, o, "ajaxComplete", [e, i]),
        r(i)
    }
    function c() {}
    function l(t) {
        return t && (t = t.split(";", 2)[0]),
        t && (t == T ? "html": t == E ? "json": b.test(t) ? "script": x.test(t) && "xml") || "text"
    }
    function f(t, e) {
        return (t + "&" + e).replace(/[&?]{1,2}/, "?")
    }
    function h(e) {
        e.processData && e.data && "string" != t.type(e.data) && (e.data = t.param(e.data, e.traditional)),
        !e.data || e.type && "GET" != e.type.toUpperCase() || (e.url = f(e.url, e.data))
    }
    function d(e, n, i, r) {
        var o = !t.isFunction(n);
        return {
            url: e,
            data: o ? n: void 0,
            success: o ? t.isFunction(i) ? i: void 0 : n,
            dataType: o ? r || i: i
        }
    }
    function p(e, n, i, r) {
        var o, a = t.isArray(n);
        t.each(n,
        function(n, s) {
            o = t.type(s),
            r && (n = i ? r: r + "[" + (a ? "": n) + "]"),
            !r && a ? e.add(s.name, s.value) : "array" == o || !i && "object" == o ? p(e, s, i, n) : e.add(n, s)
        })
    }
    var m, v, g = 0,
    y = window.document,
    w = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    b = /^(?:text|application)\/javascript/i,
    x = /^(?:text|application)\/xml/i,
    E = "application/json",
    T = "text/html",
    S = /^\s*$/;
    t.active = 0,
    t.ajaxJSONP = function(e) {
        if (! ("type" in e)) return t.ajax(e);
        var n, i = "jsonp" + ++g,
        r = y.createElement("script"),
        u = function() {
            clearTimeout(n),
            t(r).remove(),
            delete window[i]
        },
        l = function(t) {
            u(),
            t && "timeout" != t || (window[i] = c),
            s(null, t || "abort", f, e)
        },
        f = {
            abort: l
        };
        return o(f, e) === !1 ? (l("abort"), !1) : (window[i] = function(t) {
            u(),
            a(t, f, e)
        },
        r.onerror = function() {
            l("error")
        },
        r.src = e.url.replace(/=\?/, "=" + i), t("head").append(r), e.timeout > 0 && (n = setTimeout(function() {
            l("timeout")
        },
        e.timeout)), f)
    },
    t.ajaxSettings = {
        type: "GET",
        beforeSend: c,
        success: c,
        error: c,
        complete: c,
        context: null,
        global: !0,
        xhr: function() {
            return new window.XMLHttpRequest
        },
        accepts: {
            script: "text/javascript, application/javascript",
            json: E,
            xml: "application/xml, text/xml",
            html: T,
            text: "text/plain"
        },
        crossDomain: !1,
        timeout: 0,
        processData: !0,
        cache: !0
    },
    t.ajax = function(e) {
        var n = t.extend({},
        e || {});
        for (m in t.ajaxSettings) void 0 === n[m] && (n[m] = t.ajaxSettings[m]);
        i(n),
        n.crossDomain || (n.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(n.url) && RegExp.$2 != window.location.host),
        n.url || (n.url = window.location.toString()),
        h(n),
        n.cache === !1 && (n.url = f(n.url, "_=" + Date.now()));
        var r = n.dataType,
        u = /=\?/.test(n.url);
        if ("jsonp" == r || u) return u || (n.url = f(n.url, "callback=?")),
        t.ajaxJSONP(n);
        var d, p = n.accepts[r],
        g = {},
        y = /^([\w-]+:)\/\//.test(n.url) ? RegExp.$1: window.location.protocol,
        w = n.xhr();
        n.crossDomain || (g["X-Requested-With"] = "XMLHttpRequest"),
        p && (g.Accept = p, p.indexOf(",") > -1 && (p = p.split(",", 2)[0]), w.overrideMimeType && w.overrideMimeType(p)),
        (n.contentType || n.contentType !== !1 && n.data && "GET" != n.type.toUpperCase()) && (g["Content-Type"] = n.contentType || "application/x-www-form-urlencoded"),
        n.headers = t.extend(g, n.headers || {}),
        w.onreadystatechange = function() {
            if (4 == w.readyState) {
                w.onreadystatechange = c,
                clearTimeout(d);
                var e, i = !1;
                if (w.status >= 200 && w.status < 300 || 304 == w.status || 0 == w.status && "file:" == y) {
                    r = r || l(w.getResponseHeader("content-type")),
                    e = w.responseText;
                    try {
                        "script" == r ? (1, eval)(e) : "xml" == r ? e = w.responseXML: "json" == r && (e = S.test(e) ? null: t.parseJSON(e))
                    } catch(o) {
                        i = o
                    }
                    i ? s(i, "parsererror", w, n) : a(e, w, n)
                } else s(null, w.status ? "error": "abort", w, n)
            }
        };
        var b = "async" in n ? n.async: !0;
        w.open(n.type, n.url, b);
        for (v in n.headers) w.setRequestHeader(v, n.headers[v]);
        return o(w, n) === !1 ? (w.abort(), !1) : (n.timeout > 0 && (d = setTimeout(function() {
            w.onreadystatechange = c,
            w.abort(),
            s(null, "timeout", w, n)
        },
        n.timeout)), w.send(n.data ? n.data: null), w)
    },
    t.get = function() {
        return t.ajax(d.apply(null, arguments))
    },
    t.post = function() {
        var e = d.apply(null, arguments);
        return e.type = "POST",
        t.ajax(e)
    },
    t.getJSON = function() {
        var e = d.apply(null, arguments);
        return e.dataType = "json",
        t.ajax(e)
    },
    t.fn.load = function(e, n, i) {
        if (!this.length) return this;
        var r, o = this,
        a = e.split(/\s/),
        s = d(e, n, i),
        u = s.success;
        return a.length > 1 && (s.url = a[0], r = a[1]),
        s.success = function(e) {
            o.html(r ? t("<div>").html(e.replace(w, "")).find(r) : e),
            u && u.apply(o, arguments)
        },
        t.ajax(s),
        this
    };
    var j = encodeURIComponent;
    t.param = function(t, e) {
        var n = [];
        return n.add = function(t, e) {
            this.push(j(t) + "=" + j(e))
        },
        p(n, t, e),
        n.join("&").replace(/%20/g, "+")
    }
} (Zepto),
function(t) {
    t.fn.serializeArray = function() {
        var e, n = [];
        return t(Array.prototype.slice.call(this.get(0).elements)).each(function() {
            e = t(this);
            var i = e.attr("type");
            "fieldset" != this.nodeName.toLowerCase() && !this.disabled && "submit" != i && "reset" != i && "button" != i && ("radio" != i && "checkbox" != i || this.checked) && n.push({
                name: e.attr("name"),
                value: e.val()
            })
        }),
        n
    },
    t.fn.serialize = function() {
        var t = [];
        return this.serializeArray().forEach(function(e) {
            t.push(encodeURIComponent(e.name) + "=" + encodeURIComponent(e.value))
        }),
        t.join("&")
    },
    t.fn.submit = function(e) {
        if (e) this.bind("submit", e);
        else if (this.length) {
            var n = t.Event("submit");
            this.eq(0).trigger(n),
            n.defaultPrevented || this.get(0).submit()
        }
        return this
    }
} (Zepto),
function(t, e) {
    function n(t) {
        return i(t.replace(/([a-z])([A-Z])/, "$1-$2"))
    }
    function i(t) {
        return t.toLowerCase()
    }
    function r(t) {
        return o ? o + t: i(t)
    }
    var o, a, s, u, c, l, f, h, d = "",
    p = {
        Webkit: "webkit",
        Moz: "",
        O: "o",
        ms: "MS"
    },
    m = window.document,
    v = m.createElement("div"),
    g = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    y = {};
    t.each(p,
    function(t, n) {
        return v.style[t + "TransitionProperty"] !== e ? (d = "-" + i(t) + "-", o = n, !1) : void 0
    }),
    a = d + "transform",
    y[s = d + "transition-property"] = y[u = d + "transition-duration"] = y[c = d + "transition-timing-function"] = y[l = d + "animation-name"] = y[f = d + "animation-duration"] = y[h = d + "animation-timing-function"] = "",
    t.fx = {
        off: o === e && v.style.transitionProperty === e,
        speeds: {
            _default: 400,
            fast: 200,
            slow: 600
        },
        cssPrefix: d,
        transitionEnd: r("TransitionEnd"),
        animationEnd: r("AnimationEnd")
    },
    t.fn.animate = function(e, n, i, r) {
        return t.isPlainObject(n) && (i = n.easing, r = n.complete, n = n.duration),
        n && (n = ("number" == typeof n ? n: t.fx.speeds[n] || t.fx.speeds._default) / 1e3),
        this.anim(e, n, i, r)
    },
    t.fn.anim = function(i, r, o, d) {
        var p, m, v, w = {},
        b = "",
        x = this,
        E = t.fx.transitionEnd;
        if (r === e && (r = .4), t.fx.off && (r = 0), "string" == typeof i) w[l] = i,
        w[f] = r + "s",
        w[h] = o || "linear",
        E = t.fx.animationEnd;
        else {
            m = [];
            for (p in i) g.test(p) ? b += p + "(" + i[p] + ") ": (w[p] = i[p], m.push(n(p)));
            b && (w[a] = b, m.push(a)),
            r > 0 && "object" == typeof i && (w[s] = m.join(", "), w[u] = r + "s", w[c] = o || "linear")
        }
        return v = function(e) {
            if ("undefined" != typeof e) {
                if (e.target !== e.currentTarget) return;
                t(e.target).unbind(E, v)
            }
            t(this).css(y),
            d && d.call(this)
        },
        r > 0 && this.bind(E, v),
        this.size() && this.get(0).clientLeft,
        this.css(w),
        0 >= r && setTimeout(function() {
            x.each(function() {
                v.call(this)
            })
        },
        0),
        this
    },
    v = null
} (Zepto),
!
function(t) {
    t.matchMedia = function() {
        var e = 0,
        n = "gmu-media-detect",
        i = t.fx.transitionEnd,
        r = t.fx.cssPrefix,
        o = t("<style></style>").append("." + n + "{" + r + "transition: width 0.001ms; width: 0; position: absolute; top: -10000px;}\n").appendTo("head");
        return function(r) {
            var a, s, u = n + e++,
            c = [];
            return o.append("@media " + r + " { #" + u + " { width: 1px; } }\n"),
            "matchMedia" in window ? window.matchMedia(r) : (a = t('<div class="' + n + '" id="' + u + '"></div>').appendTo("body").on(i,
            function() {
                s.matches = 1 === a.width(),
                t.each(c,
                function(e, n) {
                    t.isFunction(n) && n.call(s, s)
                })
            }), s = {
                matches: 1 === a.width(),
                media: r,
                addListener: function(t) {
                    return c.push(t),
                    this
                },
                removeListener: function(t) {
                    var e = c.indexOf(t);
                    return~e && c.splice(e, 1),
                    this
                }
            })
        }
    } ()
} (Zepto),
!
function(t) {
    t.extend(t, {
        throttle: function(e, n, i) {
            function r() {
                function t() {
                    a = Date.now(),
                    n.apply(s, c)
                }
                function r() {
                    o = void 0
                }
                var s = this,
                u = Date.now() - a,
                c = arguments;
                i && !o && t(),
                o && clearTimeout(o),
                void 0 === i && u > e ? t() : o = setTimeout(i ? r: t, void 0 === i ? e - u: e)
            }
            var o, a = 0;
            return "function" != typeof n && (i = n, n = e, e = 250),
            r._zid = n._zid = n._zid || t.proxy(n)._zid,
            r
        },
        debounce: function(e, n, i) {
            return void 0 === n ? t.throttle(250, e, !1) : t.throttle(e, n, void 0 === i ? !1 : i !== !1)
        }
    })
} (Zepto),
$(function() {
    $.mediaQuery = {
        ortchange: "screen and (width: " + window.innerWidth + "px)"
    },
    $.matchMedia($.mediaQuery.ortchange).addListener(function() {
        $(window).trigger("ortchange")
    })
}),
!
function(t, e) {
    function n() {
        t(e).on("scroll", t.debounce(80,
        function() {
            t(e).trigger("scrollStop")
        },
        !1))
    }
    function i() {
        t(e).off("scroll"),
        n()
    }
    n(),
    t(e).on("pageshow",
    function(n) {
        n.persisted && t(e).off("touchstart", i).one("touchstart", i)
    })
} (Zepto, window),
!
function(t) {
    var e = [];
    t.fn.imglazyload = function(n) {
        function i(t) {
            var e = l ? window: u.offset(),
            i = e[f.win[0]],
            r = e[f.win[1]];
            return i >= t[f.img[0]] - n.threshold - r && i <= t[f.img[0]] + t[f.img[1]]
        }
        function r(i) {
            var r = t(i),
            o = {},
            a = r;
            d || (t.each(r.get(0).attributes,
            function() {~this.name.indexOf("data-") && (o[this.name] = this.value)
            }), a = t("<img />").attr(o)),
            r.trigger("startload"),
            a.on("load",
            function() { ! d && r.replaceWith(a),
                r.trigger("loadcomplete"),
                a.off("load")
            }).on("error",
            function() {
                var n = t.Event("error");
                r.trigger(n),
                n.defaultPrevented || e.push(i),
                a.off("error").remove()
            }).attr("src", r.attr(n.urlName))
        }
        function o() {
            var n, o, a, u;
            for (n = e.length; n--;) o = t(u = e[n]),
            a = o.offset(),
            i(a) && (s.call(e, n, 1), r(u))
        }
        function a() { ! d && h && t(e).append(h)
        }
        var s = Array.prototype.splice,
        n = t.extend({
            threshold: 0,
            container: window,
            urlName: "data-url",
            placeHolder: "",
            eventName: "scrollStop",
            innerScroll: !1,
            isVertical: !0
        },
        n),
        u = t(n.container),
        c = n.isVertical,
        l = t.isWindow(u.get(0)),
        f = {
            win: [c ? "scrollY": "scrollX", c ? "innerHeight": "innerWidth"],
            img: [c ? "top": "left", c ? "height": "width"]
        },
        h = t(n.placeHolder).length ? t(n.placeHolder) : null,
        d = t(this).is("img");
        return ! l && (f.win = f.img),
        e = Array.prototype.slice.call(t(e.reverse()).add(this), 0).reverse(),
        t.isFunction(t.fn.imglazyload.detect) ? (a(), this) : (t(document).ready(function() {
            a(),
            o()
        }), !n.innerScroll && t(window).on(n.eventName + " ortchange",
        function() {
            o()
        }), t.fn.imglazyload.detect = o, this)
    }
} (Zepto),
!
function() {
    var t = document.getElementById("gotop"),
    e = null,
    n = 0;
    window.onscroll = function() {
        var i = document.documentElement.scrollTop || document.body.scrollTop;
        t.style.visibility = "hidden",
        clearInterval(e),
        e = setInterval(function() {
            i > 2 * t.offsetTop && n == i && setTimeout(function() {
                t.style.visibility = "visible",
                clearInterval(e)
            },
            1500)
        },
        1e3),
        n = i
    },
    $(t).on("click",
    function() {
        window.scrollTo(0, 0),
        t.style.visibility = "hidden"
    })
} (),
!
function(t) {
    function e(e) {
        var n = t(e);
        n.siblings("span").addClass("img-loaded"),
        n.css({
            width: "100%",
            height: "auto"
        })
    }
    var n = t(".page-view-article");
    n.find(".lazy-load").imglazyload({
        threshold: 600
    }).on("loadcomplete",
    function() {
        var n = t(this);
        e(n)
    }),
    n.on("click", ".img-eye",
    function(e) {
        var n = t(e.target).closest(".img-eye");
        window.open(n.prev("img").data("originalurl"))
    }),
    window.onimageload = e
} (Zepto),
!
function(t) {
    function e(e, n) {
        setTimeout(function() {
            var i = t('<link rel="stylesheet" />'),
            r = util.queryString("fr"),
            r = r ? r: "";
            t("head").append(i),
            i.attr("href", [e, "from=" + ("iphone" == window.showType ? "webapp": "lite"), t.param(n), "fr=" + r, "m_ni=1", (new Date).getTime()].join("&")),
            setTimeout(function() {
                i.remove()
            },
            5e3)
        },
        0)
    }
    window.util = window.util || {},
    util.queryString = function(t) {
        return (document.location.search.match(new RegExp("(?:^\\?|&)" + t + "=(.*?)(?=&|$)")) || ["", null])[1]
    },
    util.vv = function(e, n, i) {
        var e = t(e);
        src = e.data("href"),
        act = e.data("act"),
        util.v({
            act: act
        }),
        i ? window.open(src) : setTimeout(function() {
            location.href = src
        },
        300),
        n && n.stopPropagation()
    },
    util.v = function(t) {
        var n = "http://log.news.baidu.com/v.gif?pid=107&wise=1";
        e(n, t)
    }
} (Zepto),
!
function() {
    function t(t) {
        var e = "";
        return "string" == typeof t ? e = t: "1" === t.status && (e = t.id),
        e
    }
    window.ad = window.ad || {},
    ad.render = function(e) {
        if (e.Top) {
            var n = t(e.Top);
            n && document.write(n)
        }
    }
} (Zepto),
!
function(t) {
    return util.v({
        wa_type: "bdbjbody",
        act: "switch",
        act_data_1: util.queryString("bjaid"),
        act_data_2: util.queryString("bjdomain"),
        act_data_3: writerName,
        act_data_4: t(".page-view-article-title").text(),
        act_data_5: "isBaijiaArtical"
    }),
    window.wx ? (t.getJSON("/news?tn=bdapiweixin_auth&appid=wxf3c5150a1ba3beb5&url=" + encodeURIComponent(location.href.split("#")[0]),
    function(t) {
        window.wx.config({
            debug: !1,
            appId: "wxf3c5150a1ba3beb5",
            timestamp: t.timestamp,
            nonceStr: t.nonceStr,
            signature: t.signature,
            jsApiList: ["onMenuShareTimeline", "onMenuShareAppMessage"]
        })
    }), void t(function() {
        var e = "http://news.baidu.com/resource/webapp-baijia-sharelogo1.png",
        n = location.href,
        i = t(".page-view-article-title").text(),
        r = t(".page-view-article-m_summary").length ? t(".page-view-article-m_summary .content").text() : t(t(".page-view-article-text")[1]).text();
        window.wx.ready(function() {
            window.wx.onMenuShareTimeline({
                title: i,
                desc: r,
                link: n,
                imgUrl: e,
                success: function() {},
                cancel: function() {}
            }),
            window.wx.onMenuShareAppMessage({
                title: i,
                desc: r,
                link: n,
                imgUrl: e,
                type: "",
                dataUrl: "",
                success: function() {},
                cancel: function() {}
            })
        })
    })) : void window.setTimeout(function() {
        var t = document.body || document.documentElement.getElementsByTagName("body")[0],
        e = document.head || document.documentElement.getElementsByTagName("head")[0],
        n = "http://news.baidu.com/resource/webapp-baijia-sharelogo1.png",
        i = document.createElement("img");
        i.style.position = "absolute",
        i.style.top = i.style.left = "-500px",
        i.style.zIndex = "-100",
        i.style.opacity = .1,
        i.src = n,
        t.insertBefore(i, t.firstChild);
        var r = document.createElement("link");
        r.rel = "shortcut icon",
        r.href = n,
        e.appendChild(r)
    },
    0)
} (Zepto); (function($) {
    var o = window.navigator.userAgent.toLowerCase();
    if (o.indexOf("micromessenger") != -1) {
        $('.btn-dld').data('href', 'http://a.app.qq.com/o/simple.jsp?pkgname=com.baidu.news&g_f=991653');
    } else {
        /* 适配客户端下载包地址，注意不用单行注释，避免被线上输出压缩成单行，导致js不执行 */
        if ('iphone' == showType) {
            $('.btn-dld').data('href', 'http://itunes.apple.com/cn/app/id482820737?mt=8');
        }
    }
})(Zepto); 

(function(){ 
	ad.render({"Top ":{"id ":" < script type = \"text\/javascript\">\n\/*\u65e0\u7ebf\u7aef\u5e7f\u544a*\/\nvar cpro_id = \"u1539737\";\n<\/script>\n<script src=\"http:\/\/cpro.baidustatic.com\/cpro\/ui\/cm.js\" type=\"text\/javascript\"><\/script>",
"status": "1"
},
"Banner": {
    "id": "u2440910",
    "status": "1"
},
"Info": {
    "id": "u2440913",
    "status": "1"
},
"Image": {
    "id": "u2440914",
    "status": "1"
},
"Cloud": {
    "id": "",
    "status": "1"
}
});
})();