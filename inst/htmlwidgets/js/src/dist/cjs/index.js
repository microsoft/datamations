'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

module.exports = require('./features');

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined$1; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  define(Gp, "constructor", GeneratorFunctionPrototype);
  define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  });
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined$1) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined$1;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined$1;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  define(Gp, iteratorSymbol, function() {
    return this;
  });

  define(Gp, "toString", function() {
    return "[object Generator]";
  });

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined$1;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined$1, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined$1;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined$1;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined$1;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined$1;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined$1;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, in modern engines
  // we can explicitly access globalThis. In older engines we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}

const CONF = {
  X_FIELD: "datamations_x",
  Y_FIELD: "datamations_y",
  ORDER_FIELD: "datamations_order",
  SCHEME: "https://vega.github.io/schema/vega-lite/v4.json",
};

const IGNORE_FIELDS = [
  'tooltip', 'x', 'y',
  'datamations_x', 'datamations_y'
];

const META_PARSE_VALUES = {
  grid: "grid",
  jitter: "jitter",
};

/**
 * Gets selectors for each componenent, such as slider and animation divs
 * @param {String} id root container id where all the animation components are rendered
 * @returns object of selectors
 */
function getSelectors(id) {
  const base = "#" + id;

  return {
    axisSelector: base + " .vega-for-axis",
    visSelector: base + " .vega-vis",
    descr: base + " .description",
    slider: base + " .slider",
    otherLayers: base + " .vega-other-layers",
    controls: base + " .controls-wrapper",
    exportWrap: base + " .export-wrapper",
    exportBtn: base + " .export-btn",
    replayBtn: base + " .replay-btn",
  };
}

/**
 * Splits layers into separate vega-lite specifications, removes layer field
 * @param {Object} input vega-lite specification with layers
 * @returns a list of specs
 */
function splitLayers(input) {
  const specArray = [];
  const spec = input.spec;

  if (spec && spec.layer) {
    spec.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input));
      const animated = i === spec.layer.length - 1;

      if (obj.meta) {
        obj.meta.animated = animated;
      } else {
        obj.meta = { animated };
      }

      obj.spec.encoding = d.encoding;
      obj.spec.mark = d.mark;
      delete obj.spec.layer;
      specArray.push(obj);
    });
  } else if (input.layer) {
    input.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input));
      const animated = i === input.layer.length - 1;

      if (obj.meta) {
        obj.meta.animated = animated;
      } else {
        obj.meta = { animated };
      }

      obj.encoding = d.encoding;
      obj.mark = d.mark;
      delete obj.layer;
      specArray.push(obj);
    });
  }

  return specArray;
}

/**
 * Looks up a word based of buckets and value.
 * Example:
 *   - words: ['a', 'b', 'c']
 *   - buckets: [10, 20, 30]
 *   - value: 25
 *   will return 'c'
 * @param {Array} words list of words
 * @param {Array} buckets list of numbers
 * @param {Number} value score to lookup
 */
function lookupByBucket(words, buckets, value) {
  return words[buckets.findIndex((d) => value <= d)];
}

/**
 * Finds correct number of rows for grid based on biggest group
 * @param {Array} vegaLiteSpecs an array of vega lite specs
 * @returns a number of rows
 */
function getRows(vegaLiteSpecs) {
  let maxRows = 0;

  vegaLiteSpecs
    .filter((d) => d.meta.parse === "grid")
    .forEach((spec) => {
      let { width: specWidth, height: specHeight } = spec.spec || spec;
      const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
      const splitField = spec.meta.splitField;
      const groupKeys = [];

      if (spec.facet) {
        if (spec.facet.column) {
          groupKeys.push(spec.facet.column.field);
        }
        if (spec.facet.row) {
          groupKeys.push(spec.facet.row.field);
        }
      }

      let specValues = spec.data.values;

      const gap = 2;
      const distance = 4 + gap;

      let secondarySplit = Object.keys(encoding).filter((d) => {
        const field = encoding[d].field;
        return (
          field !== splitField &&
          IGNORE_FIELDS.indexOf(d) === -1 &&
          groupKeys.indexOf(field) === -1
        );
      })[0];

      // combine groups if secondarySplit
      if (splitField && secondarySplit) {
        const secondaryField = encoding[secondarySplit].field;
        const keys = [...groupKeys, splitField];

        const grouped = d3.rollups(
          specValues,
          (arr) => {
            const obj = {};
            let sum = 0;

            arr.forEach((x) => {
              sum += x.n;
              obj[x[secondaryField]] = sum;
            });

            const o = {
              [splitField]: arr[0][splitField],
              [secondaryField]: obj,
              n: sum,
            };

            groupKeys.forEach((x) => {
              o[x] = arr[0][x];
            });

            return o;
          },
          ...keys.map((key) => {
            return (d) => d[key];
          })
        );

        specValues = grouped.flatMap((d) => {
          if (keys.length === 1) {
            return d[1];
          } else {
            return d[1].flatMap((d) => d[1]);
          }
        });

        specWidth = specWidth / grouped.length;
      }

      const maxN = d3.max(specValues, (d) => d.n);

      let rows = Math.ceil(Math.sqrt(maxN));
      let maxCols = Math.ceil(maxN / rows);

      // if horizontal gap is less than 5,
      // then take up all vertical space to increase rows and reduce columns
      if (specWidth / maxCols < 5) {
        rows = Math.floor(specHeight / distance);
      }

      if (rows > maxRows) {
        maxRows = rows;
      }
    });

  return maxRows;
}

/*
* Layout generation functions for datamations.
* Supports:
* - grid view: meta.parse = "grid"
* - jittered  view: meta.parse = "jitter"
*/

/**
 * Generates data for grid specs
 * @param {Object} spec vega-lite spec
 * @param {Number} rows number of rows
 * @param {Boolean} stacked if true, circles are stacked and vertically aliged
 * @returns an array of objects
 */
function generateGrid(spec, rows = 10, stacked = false) {
  const splitField = spec.meta.splitField;
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  const groupKeys = [];

  let {width: specWidth} = spec.spec || spec;

  if (spec.facet) {
    if (spec.facet.column) {
      groupKeys.push(spec.facet.column.field);
      spec.facet.column.sort = { "field": CONF.ORDER_FIELD };
    }
    if (spec.facet.row) {
      groupKeys.push(spec.facet.row.field);
      spec.facet.row.sort = { "field": CONF.ORDER_FIELD };
    }
  }

  let specValues = spec.data.values;

  const metas = [];

  specValues.forEach((d, i) => {
    d[CONF.ORDER_FIELD] = i;
    if (d.meta) {
      metas.push(...Object.keys(d.meta));
    }
  });

  let secondarySplit = Object.keys(encoding).filter(d => {
    const field = encoding[d].field;
    return field !== splitField &&
           IGNORE_FIELDS.indexOf(d) === -1 &&
           groupKeys.indexOf(field) === -1 &&
           metas.indexOf(field) === -1;
  })[0];

  let secondaryField = null;

  // combine groups
  // for example, if splitField = player, but color = hit:

  // { "n": 5,  "player": "a", "hit": "yes" },
  // { "n": 10, "player": "a", "hit": "no" },
  // { "n": 15, "player": "b", "hit": "yes" },
  // { "n": 35, "player": "b", "hit": "no" }

  // after this code block we will get:
  // { "n": 15,  "player": "a", "hit": { "yes": 5, "no": 10 } },
  // { "n": 50, "player": "b", "hit": { "yes": 15, "no": 35 } },

  if (splitField && secondarySplit) {
    secondaryField = encoding[secondarySplit].field;
    const keys = [...groupKeys, splitField];

    const grouped = d3.rollups(
      specValues,
      arr => {
        const obj = {};
        let sum = 0;

        arr.forEach(x => {
          sum += x.n;
          obj[x[secondaryField]] = sum;
        });

        const o = {
          [splitField]: arr[0][splitField],
          [secondaryField]: obj,
          n: sum,
        };

        groupKeys.forEach(x => {
          o[x] = arr[0][x];
        });

        return o;
      },
      ...keys.map((key) => {
        return (d) => d[key];
      })
    );

    specValues = grouped.flatMap((d) => {
      if (keys.length === 1) {
        return d[1];
      } else {
        return d[1].flatMap((d) => d[1]);
      }
    });

    specWidth = specWidth / grouped.length;
  }

  let maxCols = Math.ceil(d3.max(specValues, d => d.n) / rows);
  let splitOptions = [];

  if (splitField) {
    splitOptions = Array.from(
      new Set(specValues.map((d) => d[splitField]))
    );
  }

  let counter = 1;

  const reduce = (v) => {
    const arr = [];

    v.forEach((d, j) => {
      const n = d.n;
      const columns = Math.ceil(n / rows);
      const xCenter = splitField ? splitOptions.indexOf(d[splitField]) + 1 : 1;

      let startCol = (xCenter - 1) * maxCols + j; // inner grid start
      startCol += Math.floor((maxCols - columns) / 2); // center alignment

      const datum = {};

      // remove n and gemini_ids, we won't need them any more
      Object.keys(d).forEach(k => {
        if (k !== 'n' && k !== 'gemini_ids') {
          datum[k] = d[k];
        }
      });

      for (let i = 0; i < n; i++) {
        const x = startCol + Math.floor(i / rows);
        const y = rows - 1 - i % rows;
        const colorFieldObj = {};

        // for secondary split, e.g. is_hit, find correct key and value
        if (secondaryField && typeof[d[secondaryField]] === "object") {
          const keys = Object.keys(d[secondaryField]).sort((a, b) => {
            return d[secondaryField][a] - d[secondaryField][b];
          });

          colorFieldObj[secondaryField] = lookupByBucket(
            keys,
            keys.map(k => d[secondaryField][k]),
            i + 1,
          );
        }

        arr.push({
          ...datum,
          ...colorFieldObj,
          gemini_id: d.gemini_ids ? d.gemini_ids[i] : counter,
          [CONF.X_FIELD]: stacked ? xCenter : x,
          [CONF.Y_FIELD]: stacked ? i + 1 : y,
        });

        counter++;
      }
    });

    return arr;
  };

  let gridValues = [];

  if (groupKeys.length === 0) {
    gridValues = reduce(specValues);
  } else {
    gridValues = d3.rollups(
      specValues,
      reduce,
      ...groupKeys.map((key) => {
        return (d) => d[key];
      })
    )
    .flatMap((d) => {
      if (groupKeys.length === 1) {
        return d[1];
      } else {
        return d[1].flatMap((d) => d[1]);
      }
    });
  }

  const num_groups = splitOptions.length;

  return {
    gridValues,
    domain: [
      -maxCols / 2,
      (num_groups * maxCols) + (num_groups - 1) + maxCols / 2 - 1
    ],
    num_groups
  };
}

/**
 * Generates infogrid specification
 * @param {Object} spec vega-lite specification
 * @param {Number} rows number of rows in a grid
 * @returns grid specification
 */
function getGridSpec(spec, rows = 10, stacked = false) {
  return new Promise((res) => {
    const { gridValues: grid, domain, num_groups } = generateGrid(spec, rows, stacked);
    const obj = {...spec};
    const encoding = obj.spec ? obj.spec.encoding : obj.encoding;

    const dx = stacked ? 1 : 1;

    const xDomain = stacked || num_groups === 0 ? [
      d3.min(grid, d => d[CONF.X_FIELD]) - dx,
      d3.max(grid, d => d[CONF.X_FIELD]) + dx
    ] : domain;

    const yPadding = (spec.facet && spec.facet.row) ? 0.8 : 0.4;

    const yDomain = [
      stacked ? 0 : d3.min(grid, (d) => d[CONF.Y_FIELD]) - yPadding,
      d3.max(grid, (d) => d[CONF.Y_FIELD]) + yPadding + (stacked ? 10 : 0),
    ];

    const middle = yDomain[0] + (yDomain[1] - yDomain[0]) / 2;

    obj.data.values = grid;

    encoding.x.scale = {
      type: "linear",
      domain: xDomain,
    };

    encoding.y.scale = {
      type: "linear",
      domain: [
        Math.min(yDomain[0], middle - rows / 2),
        Math.max(yDomain[1], middle + rows / 2)
      ],
    };

    encoding.x.field = CONF.X_FIELD;
    encoding.y.field = CONF.Y_FIELD;

    // set axis labels when splitField
    if (spec.meta.splitField) {
      const labels = Array.from(
        new Set(grid.map(d => d[spec.meta.splitField]))
      );

      const expr = {};

      labels.forEach((d) => {
        // find min and max x values for each label
        const extent = d3.extent(
          spec.data.values.filter(x => x[spec.meta.splitField] === d),
          d => d[CONF.X_FIELD],
        );

        const middle = Math.ceil(extent[0] + (extent[1] - extent[0]) / 2);
        expr[middle] = d;
      });

      spec.meta.rules = obj.meta.rules = labels.map(m => {
        return {
          filter: `datum['${spec.meta.splitField}'] === '${m}'`,
          groupKey: spec.meta.splitField,
          groupValue: m,
        }
      });

      encoding.x.axis = {
        labelExpr: `${JSON.stringify(expr)}[datum.label]`,
        values: Object.keys(expr).map(d => +d),
        labelAngle: -90,
        grid: false,
        title: spec.meta.splitField,
      };
    }

    return res(obj);
  });
}

/**
 * Generates jittered specification using d3-force
 * @param {Object} spec vega-lite specification
 * @returns jittered spec
 */
function getJitterSpec(spec) {
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  const width = spec.spec ? spec.spec.width : spec.width;
  const nodes = spec.data.values;

  const circleRadius = 4;

  let innerGroupCount = 1;

  if (spec.meta.splitField) {
    innerGroupCount = new Set(
      nodes.map(d => d[spec.meta.splitField])
    ).size;
  }

  const facetSize = width ? width : 150;
  const yExtent = d3.extent(nodes, d => d[CONF.Y_FIELD]);
  const xScale = d3.scaleBand()
    .domain(d3.range(1, innerGroupCount + 1))
    .range([0, facetSize])
    .paddingOuter(0.5);

  const arr = nodes.slice().filter(d => d[CONF.Y_FIELD] !== undefined).map((d, i) => {
    d.oldX = d[CONF.X_FIELD];
    d.oldY = d[CONF.Y_FIELD];

    let x = xScale(d[CONF.X_FIELD]) + xScale.bandwidth() / 2;
    let y = d[CONF.Y_FIELD];

    d.scaledX = Math.round(x);

    return {
      ...d,
      x: x,
      y: y,
    };
  });

  const simulation = d3
    .forceSimulation(arr)
    .force("x", d3.forceX().x(d => d.x))
    .force("y", d3.forceY().strength(0.002).y(d => d[CONF.Y_FIELD]))
    .force("collide", d3
      .forceCollide()
      .strength(0.01)
      .radius(circleRadius)
    )
    .stop();

  return new Promise((res) => {
    const bandwidth = xScale.bandwidth() * 0.9;

    for (let i = 0; i < 120; i++) {
      simulation.tick();

      arr.forEach(d => {
        const x = xScale(d.oldX);
        d.y = d.oldY;
        
        // restrict to the bounds: [5%, 95%] of width
        d.x = Math.max(
          x + xScale.bandwidth() * 0.05,
          Math.min(x + bandwidth, d.x),
        );
      });
    }

    if (encoding.y.scale) {
      encoding.y.scale.domain = yExtent;
    } else {
      encoding.y.scale = {
        domain: yExtent
      };
    }

    encoding.x.scale = {
      domain: [0, facetSize]
    };

    // jitter still needs encoding fields to be x and y,
    // because d3-force uses x and y internally.
    encoding.x.field = "x";
    encoding.y.field = "y";

    // if meta.axes is falsy, and we have custom x-axis
    if (!spec.meta.axes && encoding.x.axis && spec.meta.xAxisLabels) {
      const labels = spec.meta.xAxisLabels;

      const axisExpr = {};
      const mapped = labels.map((d, i) => {
        const x = Math.round(xScale(i + 1) + xScale.bandwidth() / 2);
        axisExpr[x] = d;
        return { x, label: d };
      });

      encoding.x.axis.labelExpr = `${JSON.stringify(axisExpr)}[datum.label]`;
      encoding.x.axis.values = mapped.map(d => d.x);
    }

    return res({
      ...spec,
      data: {
        name: "source",
        values: arr,
      },
    });
  });
}

/**
 * Custom animations generation script.
 * Supports:
 * - count
 * - median
 * - mean
 * - quantile
 * - min
 * - max
 * Inspiration from: https://giorgi-ghviniashvili.github.io/aggregate-animation-data/designs/
 */

/**
 * Generates a spec for count animation
 * @param {Object} source source spec
 * @param {Object} target target spec
 * @param {Object} shrink if truthy, circles will be pulled up
 * @returns a vega lite spec
 */
const getCountStep = (source, target, shrink = false) => {
  const { width, height } = target.spec || target;
  let values = source.data.values.slice();
  const sourceMeta = source.meta;

  // generate rules layer
  const rules = sourceMeta.rules.map((d, i) => {
    const n = sourceMeta.rules.length;
    return {
      transform: [{ filter: d.filter }],
      name: `rule-${i + 1}`,
      mark: {
        type: "rule",
        x: { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: { expr: `${i + 1} * (width / ${n + 1}) + 5` },
      },
      encoding: {
        y: {
          field: CONF.Y_FIELD,
          type: "quantitative",
          aggregate: "count",
          // axis: null,
        },
      },
    };
  });

  if (shrink) {
    values = values.map((d, i) => {
      const y = target.data.values[i][CONF.Y_FIELD];
      return {
        ...d,
        [CONF.Y_FIELD]: y,
      };
    });
  }

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    data: {
      name: "source",
      values,
    },
    layer: [
      {
        name: "main",
        mark: source.mark,
        encoding: source.encoding,
      },
      ...rules,
    ],
  };
};

/**
 * Generates a spec for median and quantile animations
 * @param {Object} source source spec
 * @param {Object} target target spec
 * @param {Number} step step counter. null is the last step
 * @param {Number} p a percentile
 * @returns a vega lite spec
 */
const getMedianStep = (source, target, step = 0, p = 0.5) => {
  const all_groups = [];
  const { width, height } = target.spec || target;
  const isLast = step === null;
  const hasFacet = source.meta.hasFacet;
  const meta = source.meta;
  const values = [];

  const reduce = (data) => {
    const groupValue = data[0][CONF.X_FIELD];

    let sorted = data
      .slice()
      .sort((a, b) => {
        const sortFn = hasFacet ? "descending" : "ascending";
        return d3[sortFn](a[CONF.Y_FIELD], b[CONF.Y_FIELD]);
      })
      .map((d, i) => {
        return {
          ...d,
          rank: i + 1,
        };
      });

    // inspired by median animation https://uwdata.github.io/gemini2-editor/ 
    const y_median = d3.quantile(sorted, p, (d) => {
      return hasFacet ? d.oldY : d[CONF.Y_FIELD];
    });
    const y_median_pos = hasFacet ? data[0].scaleY(y_median) : y_median;
    const median_rank = d3.quantile(sorted, 0.5, (d) => d.rank);
    const max_rank = d3.max(sorted, (d) => d.rank);
    const diff = isLast ? null : max_rank - median_rank - step;
    const dx = hasFacet ? 5 : 0.1;

    sorted = sorted.map((d) => {
      const rank_delta_abs = Math.abs(d.rank - median_rank);
      const y_delta = (hasFacet ? d.oldY : d[CONF.Y_FIELD]) - y_median;
      const bisection =
        diff !== null && rank_delta_abs <= diff ? 0 : y_delta > 0 ? 1 : -1;

      let newField = null;

      if (bisection === -1) {
        newField = d[CONF.X_FIELD] - dx;
      } else if (bisection === 1) {
        newField = d[CONF.X_FIELD] + dx;
      } else {
        newField = d[CONF.X_FIELD];
      }

      return {
        ...d,
        bisection,
        [CONF.X_FIELD + "_pos"]: newField,
        y_median,
        y_median_pos,
      };
    });

    let filter = `datum['${CONF.X_FIELD}'] === ${groupValue} && datum.bisection === 0`;
    let groupFilter = `datum['${CONF.X_FIELD}'] === ${groupValue}`;

    let groupId = groupValue;

    if (hasFacet) {
      filter += " && ";
      groupFilter += " && ";
      groupId += "_";

      if (meta.columnFacet) {
        filter += `datum['${meta.columnFacet.field}'] === '${
          data[0][meta.columnFacet.field]
        }'`;
        groupFilter += `datum['${meta.columnFacet.field}'] === '${
          data[0][meta.columnFacet.field]
        }'`;
        groupId += data[0][meta.columnFacet.field];
      }

      if (meta.columnFacet && meta.rowFacet) {
        filter += " && ";
        groupFilter += " && ";
        groupId += "_";
      }

      if (meta.rowFacet) {
        filter += `datum['${meta.rowFacet.field}'] === '${
          data[0][meta.rowFacet.field]
        }'`;
        groupFilter += `datum['${meta.rowFacet.field}'] === '${
          data[0][meta.rowFacet.field]
        }'`;
        groupId += data[0][meta.rowFacet.field];
      }
    }

    all_groups.push({
      filter,
      groupFilter,
      groupValue,
      groupKey: CONF.X_FIELD,
      median: y_median,
      groupId,
      median_pos: y_median_pos,
      rankDiff: Math.abs(max_rank - median_rank),
      rule_start: d3.min(sorted, (d) => d[CONF.X_FIELD + "_pos"]) + 1,
      rule_end: d3.max(sorted, (d) => d[CONF.X_FIELD + "_pos"]) - 1,
    });

    values.push(...sorted);
  };

  const groupKeys = [CONF.X_FIELD];

  if (hasFacet) {
    if (meta.columnFacet) {
      groupKeys.push(meta.columnFacet.field);
    }

    if (meta.rowFacet) {
      groupKeys.push(meta.rowFacet.field);
    }
  }

  d3.rollup(
    source.data.values.slice(),
    reduce,
    ...groupKeys.map((key) => {
      return (d) => d[key];
    })
  );

  const rules = [];

  let ruleField = isLast ? "y_median" : CONF.Y_FIELD;

  if (hasFacet) {
    ruleField = isLast ? "y_median_pos" : CONF.Y_FIELD;
  }

  all_groups.forEach((d, i) => {
    const n = all_groups.length;

    const top_rule = {
      transform: isLast ? [{ filter: d.groupFilter }] : [{ filter: d.filter }],
      name: `top_rule_${d.groupId}`,
      mark: {
        type: "rule",
        x: hasFacet
          ? d.rule_start
          : { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: hasFacet
          ? d.rule_end
          : { expr: `${i + 1} * (width / ${n + 1}) + 5` },
      },
      encoding: {
        y: {
          field: ruleField,
          type: "quantitative",
          aggregate: "max",
          axis: null,
        },
      },
    };

    const bottom_rule = {
      transform: isLast ? [{ filter: d.groupFilter }] : [{ filter: d.filter }],
      name: `bottom_rule_${d.groupId}`,
      mark: {
        type: "rule",
        x: hasFacet
          ? d.rule_start
          : { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: hasFacet
          ? d.rule_end
          : { expr: `${i + 1} * (width / ${n + 1}) + 5` },
      },
      encoding: {
        y: {
          field: ruleField,
          type: "quantitative",
          aggregate: "min",
          axis: null,
        },
      },
    };

    rules.push(top_rule, bottom_rule);
  });

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    meta: {
      all_groups,
    },
    data: {
      name: "source",
      values,
    },
    layer: [
      {
        name: "main",
        mark: source.mark,
        encoding: {
          ...source.encoding,
          x: {
            ...source.encoding.x,
            field: CONF.X_FIELD + "_pos",
          },
          color: source.encoding.color
        },
      },
      ...rules,
    ],
    resolve: { axis: { y: "independent" } },
  };
};

/**
 * Generates a spec for mean animation
 * @param {Object} source source spec
 * @param {Object} target target spec
 * @returns a vega lite spec
 */
const getMeanStep = (source, target) => {
  const all_groups = [];
  const { width, height } = target.spec || target;
  const domain = source.encoding.y.scale.domain;

  const hasFacet = source.meta.hasFacet;
  const meta = source.meta;

  const values = [];

  const reduce = (data) => {
    const groupValue = data[0][CONF.X_FIELD];

    let sorted = data
      .slice()
      .sort((a, b) => {
        const sortFn = hasFacet ? "descending" : "ascending";
        return d3[sortFn](a[CONF.Y_FIELD], b[CONF.Y_FIELD]);
      })
      .map((d, i) => {
        return {
          ...d,
          rank: i + 1,
        };
      });

    const y_mean = d3.mean(sorted, (d) => {
      return hasFacet ? d.oldY : d[CONF.Y_FIELD];
    });
    const y_mean_pos = hasFacet ? data[0].scaleY(y_mean) : y_mean;
    const mean_rank = d3.mean(sorted, (d) => d.rank);
    const max_rank = d3.max(sorted, (d) => d.rank);
    const dividor = max_rank * 1.4;
    const multiplier = hasFacet ? 25 : 1;

    sorted = sorted.map((d) => {
      const rankRatio_from_mean = (d.rank - mean_rank) / dividor;

      const rankRatio_from_mean_start = (d.rank - 0.5 - mean_rank) / dividor;
      const rankRatio_from_mean_end = (d.rank + 0.5 - mean_rank) / dividor;

      return {
        ...d,
        [CONF.X_FIELD + "_pos"]:
          d[CONF.X_FIELD] + rankRatio_from_mean * multiplier,
        [CONF.X_FIELD + "_pos_start"]:
          d[CONF.X_FIELD] + rankRatio_from_mean_start * multiplier,
        [CONF.X_FIELD + "_pos_end"]:
          d[CONF.X_FIELD] + rankRatio_from_mean_end * multiplier,
        y_mean,
        y_mean_pos,
      };
    });

    let filter = `datum['${CONF.X_FIELD}'] === ${groupValue}`;
    let groupId = groupValue;

    if (hasFacet) {
      filter += " && ";
      groupId += "_";

      if (meta.columnFacet) {
        filter += `datum['${meta.columnFacet.field}'] === '${
          data[0][meta.columnFacet.field]
        }'`;
        groupId += data[0][meta.columnFacet.field];
      }

      if (meta.columnFacet && meta.rowFacet) {
        filter += " && ";
        groupId += "_";
      }

      if (meta.rowFacet) {
        filter += `datum['${meta.rowFacet.field}'] === '${
          data[0][meta.rowFacet.field]
        }'`;
        groupId += data[0][meta.rowFacet.field];
      }
    }

    all_groups.push({
      filter,
      groupValue,
      groupKey: CONF.X_FIELD,
      groupId: groupId,
      mean: y_mean,
      mean_pos: y_mean_pos,
      rule_start: d3.min(sorted, (d) => d[CONF.X_FIELD + "_pos_start"]),
      rule_end: d3.max(sorted, (d) => d[CONF.X_FIELD + "_pos_end"]),
    });

    values.push(...sorted);

    return sorted;
  };

  const groupKeys = [CONF.X_FIELD];

  if (hasFacet) {
    if (meta.columnFacet) {
      groupKeys.push(meta.columnFacet.field);
    }

    if (meta.rowFacet) {
      groupKeys.push(meta.rowFacet.field);
    }
  }

  d3.rollups(
    source.data.values.slice(),
    reduce,
    ...groupKeys.map((key) => {
      return (d) => d[key];
    })
  );

  const rules = [];

  all_groups.forEach((d, i) => {
    const n = all_groups.length;

    const rule = {
      transform: [{ filter: d.filter }],
      name: `rule_${d.groupId}`,
      mark: {
        type: "rule",
        x: hasFacet
          ? d.rule_start
          : {
              expr: `${i + 1} * (width / ${n + 1}) - (width / ${n + 1}) * 0.35`,
            },
        x2: hasFacet
          ? d.rule_end
          : {
              expr: `${i + 1} * (width / ${n + 1}) + (width / ${n + 1}) * 0.35`,
            },
      },
      encoding: {
        y: {
          field: hasFacet ? "y_mean_pos" : CONF.Y_FIELD,
          type: "quantitative",
          aggregate: "mean",
          axis: null,
          scale: { domain },
        },
      },
    };

    rules.push(rule);
  });

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    meta: {
      all_groups,
    },
    data: {
      name: "source",
      values,
    },
    layer: [
      {
        name: "main",
        mark: source.mark,
        encoding: {
          ...source.encoding,
          x: {
            ...source.encoding.x,
            field: CONF.X_FIELD + "_pos",
          },
        },
      },
      ...rules,
    ],
    resolve: { axis: { y: "independent" } },
  };
};

/**
 * Generates a spec for min and max animations
 * @param {Object} source source spec
 * @param {Object} target target spec
 * @param {String} minOrMax "min" or "max"
 * @returns a vega lite spec
 */
const getMinMaxStep = (source, target, minOrMax = "min") => {
  const { width, height } = target.spec || target;
  const aggrFn = minOrMax === "min" ? d3.min : d3.max;
  const domain = source.encoding.y.scale.domain;
  const groupKeys = [CONF.X_FIELD];
  const hasFacet = source.meta.hasFacet;
  const meta = source.meta;

  const values = [];

  if (hasFacet) {
    if (meta.columnFacet) {
      groupKeys.push(meta.columnFacet.field);
    }

    if (meta.rowFacet) {
      groupKeys.push(meta.rowFacet.field);
    }
  }

  const all_groups = [];

  d3.rollup(
    source.data.values.slice(),
    (data) => {
      const groupValue = data[0][CONF.X_FIELD];
      let filter = `datum['${CONF.X_FIELD}'] === ${groupValue}`;
      let groupId = groupValue;

      if (hasFacet) {
        filter += " && ";
        groupId += "_";

        if (meta.columnFacet) {
          filter += `datum['${meta.columnFacet.field}'] === '${
            data[0][meta.columnFacet.field]
          }'`;
          groupId += data[0][meta.columnFacet.field];
        }

        if (meta.columnFacet && meta.rowFacet) {
          filter += " && ";
          groupId += "_";
        }

        if (meta.rowFacet) {
          filter += `datum['${meta.rowFacet.field}'] === '${
            data[0][meta.rowFacet.field]
          }'`;
          groupId += data[0][meta.rowFacet.field];
        }
      }

      const aggr = aggrFn(data, (d) => {
        return hasFacet ? d.oldY : d[CONF.Y_FIELD];
      });
      const aggr_pos = hasFacet ? data[0].scaleY(aggr) : aggr;

      all_groups.push({
        filter,
        groupValue,
        groupKey: CONF.X_FIELD,
        aggr,
        aggr_pos,
        groupId,
        rule_start: d3.min(data, (d) => d[CONF.X_FIELD] - 2),
        rule_end: d3.max(data, (d) => d[CONF.X_FIELD] + 2),
      });

      const g = data.find((d) => {
        const v = hasFacet ? d.oldY : d[CONF.Y_FIELD];
        return v === aggr;
      });

      values.push(
        ...data.map((d) => {
          const isAggr = g && g.gemini_id === d.gemini_id;

          return {
            ...d,
            isAggr,
            aggr_pos,
          };
        })
      );
    },
    ...groupKeys.map((key) => {
      return (d) => d[key];
    })
  );

  const rules = all_groups.map((group, i) => {
    const n = all_groups.length;
    return {
      transform: [{ filter: group.filter }],
      name: `rule_${group.groupId}`,
      mark: {
        type: "rule",
        x: hasFacet
          ? group.rule_start
          : { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: hasFacet
          ? group.rule_end
          : { expr: `${i + 1} * (width / ${n + 1}) + 5` },
      },
      encoding: {
        y: {
          field: hasFacet ? "aggr_pos" : CONF.Y_FIELD,
          type: "quantitative",
          aggregate: minOrMax,
          axis: null,
          scale: { domain },
        },
      },
    };
  });

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    meta: {
      all_groups,
    },
    data: {
      name: "source",
      values: values,
    },
    layer: [
      {
        name: "main",
        mark: source.mark,
        encoding: {
          ...source.encoding,
        },
      },
      ...rules,
    ],
    resolve: { axis: { y: "independent" } },
  };
};

/**
 * Configuration for custom animations.
 * When meta.custom_animation is present, 
 * it looks up a function here and generates custom animation specifications
 */
const CustomAnimations = {
  /**
   * steps:
   * 1) stack sets
   * 2) put rules (lines) using aggregate count
   * 3) replace with count bubbles (aggregate count) (basically target spec)
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  count: async (rawSource, target) => {
    const stacks = await getGridSpec(rawSource, 10, true);
    delete stacks.encoding.y.axis;
    const rules = getCountStep(rawSource, target, false);
    const pullUp = getCountStep(rawSource, target, true);
    return [stacks, rules, pullUp, target];
  },
  /**
   * min animation steps:
   * 1) source spec
   * 2) stack sets, with a rule line at min circle
   * 3) pull circles down
   * 4) target spec
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  min: (rawSource, target) => {
    const step_1 = getMinMaxStep(rawSource, target, "min");

    const step_2 = {
      ...step_1,
      transform: [{ filter: "datum.isAggr === true" }],
      layer: [
        {
          ...step_1.layer[0],
          encoding: {
            ...step_1.layer[0].encoding,
            y: {
              ...step_1.layer[0].encoding.y,
              aggregate: "min",
            },
          },
        },
        ...step_1.layer.slice(1),
      ],
    };

    return [rawSource, step_1, step_2, target];
  },
  /**
   * max animation steps:
   * 1) source spec
   * 2) stack sets, with a rule line at max circle
   * 3) pull circles up
   * 4) target spec
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  max: (rawSource, target, source) => {
    const step_1 = getMinMaxStep(rawSource, target, "max");

    const step_2 = {
      ...step_1,
      transform: [{ filter: "datum.isAggr === true" }],
      layer: [
        {
          ...step_1.layer[0],
          encoding: {
            ...step_1.layer[0].encoding,
            y: {
              ...step_1.layer[0].encoding.y,
              aggregate: "max",
            },
          },
        },
        ...step_1.layer.slice(1),
      ],
    };

    return [rawSource, step_1, step_2, target];
  },
  /**
   * mean animation steps:
   * 1) source spec
   * 2) intermediate: circles will be placed diagonally "/" 
   * 3) add lines (rules) at mean level
   * 4) convert circles to small ticks
   * 5) show vertical lines
   * 6) collapse the lines to mean level
   * 7) target spec
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  mean: (rawSource, target) => {
    const step_1 = getMeanStep(rawSource, target);

    const barWidth = 2;

    const step_2 = {
      ...step_1,
      layer: [
        {
          name: "main",
          mark: { type: "tick", orient: "horizontal", width: barWidth },
          encoding: {
            y: {
              ...rawSource.encoding.y,
            },
            x: {
              ...rawSource.encoding.x,
              field: CONF.X_FIELD + "_pos_start",
            },
            x2: {
              field: CONF.X_FIELD + "_pos_end",
            },
            color: rawSource.encoding.color
          },
        },
        ...step_1.layer.slice(1),
      ],
    };
    const step_3 = {
      ...step_2,
      layer: [
        {
          ...step_2.layer[0],
          mark: {
            type: "bar",
            width: barWidth,
          },
          encoding: {
            ...step_2.layer[0].encoding,
            y2: {
              field: "y_mean_pos",
            },
          },
        },
        ...step_2.layer.slice(1),
      ],
    };
    const step_4 = {
      ...step_2,
      layer: [
        {
          ...step_2.layer[0],
          mark: {
            type: "bar",
            width: barWidth,
          },
          encoding: {
            ...step_2.layer[0].encoding,
            y: {
              ...step_2.layer[0].encoding.y,
              field: "y_mean_pos",
            },
            y2: {
              field: "y_mean_pos",
            },
          },
        },
        ...step_2.layer.slice(1),
      ],
    };

    const intermediate = {
      ...rawSource,
      data: {
        values: step_1.data.values,
      },
      encoding: {
        ...rawSource.encoding,
        x: {
          ...rawSource.encoding.x,
          field: CONF.X_FIELD + "_pos",
        },
      },
    };

    return [rawSource, intermediate, step_1, step_2, step_3, step_4, target];
  },
  /**
   * median and quantile animation steps:
   * 1) source spec
   * 2) show rules at the top and bottom
   * 3) split circles by median and move to the right and left and move rules to median level
   * 4) target spec
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  median: (rawSource, target, calculatedSource, p) => {
    const percent = (p === undefined || p === null) ? 0.5 : p;
    const initial = getMedianStep(rawSource, target, 0, percent);
    const last_with_points = getMedianStep(rawSource, target, null, percent);

    return [
      rawSource,
      initial,
      last_with_points,
      target
    ];
  },
};

/**
 * Hack faceted view since gemini.js does not support multi view animations
 * Finding coordinates of each circle and treat them as real values in the one axis view 
 * Adding axis layer underneath to look exactly same as faceted view
 */

/**
 * Get empty spec, if no data is present
 * @param {Object} spec 
 * @returns vega-lite spec
 */
function getEmptySpec(spec) {
  const description = spec.meta.description;
  const splitField = spec.meta.splitField;

  return {
    $scheme: CONF.SCHEME,
    width: 300,
    height: 300,
    meta: {
      description,
      axes: false,
    },
    data: {
      values: [
        {
          [CONF.X_FIELD]: 0,
          [CONF.Y_FIELD]: 0,
        },
      ],
    },
    mark: {
      type: "point",
      filled: true,
      strokeWidth: 1,
      color: "transparent",
    },
    encoding: {
      x: {
        field: CONF.X_FIELD,
        type: "quantitative",
        scale: {
          domain: [-5, 5],
        },
        axis: {
          grid: false,
          ticks: false,
          title: splitField,
          domain: false,
          values: [],
        },
      },
      y: {
        field: CONF.Y_FIELD,
        type: "quantitative",
        scale: {
          domain: [-5, 5],
        },
        axis: {
          grid: false,
          ticks: false,
          title: null,
          domain: false,
          values: [],
        },
      },
    },
  };
}

/**
 * Creates and returns a template for vega spec
 * @param {Number} width spec width
 * @param {Number} height spec height
 * @param {Object} axes which axes to add
 * @param {Object} spec original spec
 * @returns vega-lite spec
 */
function getSpecTemplate(width, height, axes = { x: true, y: true }, spec) {
  const encoding = spec.spec.encoding;
  const mark = spec.spec.mark;
  const facet = spec.facet;

  if (encoding.x) {
    const title = facet && facet.column ? facet.column.title : null;

    encoding.x = {
      field: CONF.X_FIELD,
      type: "quantitative",
      scale: {},
      axis: axes.x
        ? {
            labelExpr: "",
            values: [],
            title: title,
            grid: false,
            orient: "top",
            ticks: false,
            domain: false,
            labelPadding: 10,
          }
        : null,
    };
  }

  if (encoding.y) {
    const title = facet && facet.row ? facet.row.title : null;

    encoding.y = {
      field: spec.spec.mark === "errorbar" ? encoding.y.field : CONF.Y_FIELD,
      type: "quantitative",
      scale: {},
      axis: axes.y
        ? {
            labelExpr: "",
            values: [],
            title: title,
            grid: false,
            labelAngle: 90,
            domain: false,
            ticks: false,
            labelPadding: 10,
            orient: "right",
          }
        : null,
    };
  }

  const additionals = {};

  if (spec.transform) {
    additionals.transform = spec.transform;
  }

  return {
    $schema: CONF.SCHEME,
    data: {
      values: [],
    },
    width: width,
    height: height,
    mark: mark,
    encoding: encoding,
    ...additionals,
  };
}

/**
 * Get hacked spec
 * Finding coordinates of each circle and treat them as real values in the one axis view 
 * Adding axis layer underneath to look exactly same as faceted view
 * @param {Object} param0 parameters
 * @param {Object} param0.view a vega view instance
 * @param {Object} param0.spec a vega spec
 * @param {Object} param0.width spec width
 * @param {Object} param0.height spec height
 * @returns vega-lite spec
 */
function getHackedSpec({ view, spec, width = 600, height = 600 }) {
  const rowId = spec.facet.row ? spec.facet.row.field : null;
  const colId = spec.facet.column ? spec.facet.column.field : null;

  const newSpec = getSpecTemplate(
    width,
    height,
    {
      x: colId,
      y: rowId,
    },
    spec
  );

  const yDomain = [height, 0];
  const xDomain = [0, width];

  const values = [];

  const colMap = new Map();
  const rowMap = new Map();

  const scaleX = view.scale("x");
  const scaleY = view.scale("y");
  const source = view.data("source");

  let row_header, column_header;

  // y axis
  if (rowId && (row_header = view.data("row_header"))) {
    const yAxisValues = [];
    const yAxisExpr = {};

    row_header.forEach((d, i) => {
      const bounds = d.bounds;
      const name = d.datum[rowId];
      const y1 = bounds.y1;
      const y2 = bounds.y2;

      rowMap.set(name, y1);

      const yCoord = Math.round(y1 + (y2 - y1) / 2);

      yAxisValues.push(yCoord);
      yAxisExpr[yCoord] = name;
    });

    yDomain[1] = d3.min(row_header, (d) => d.bounds.y1);
    yDomain[0] = d3.max(row_header, (d) => d.bounds.y2);

    newSpec.encoding.y.axis.values = yAxisValues;
    newSpec.encoding.y.axis.labelExpr = `${JSON.stringify(
      yAxisExpr
    )}[datum.label]`;
  }

  // x axis
  if (colId && (column_header = view.data("column_header"))) {
    const xAxisValues = [];
    const xAxisExpr = {};

    column_header.forEach((d, i) => {
      const bounds = d.bounds;

      const name = d.datum[colId];
      colMap.set(name, bounds.x1);

      const xCoord = Math.round(bounds.x1 + (bounds.x2 - bounds.x1) / 2);

      xAxisValues.push(xCoord);
      xAxisExpr[xCoord] = name;
    });

    xDomain[0] = d3.min(column_header, (d) => d.bounds.x1);
    xDomain[1] = d3.max(column_header, (d) => d.bounds.x2);

    newSpec.encoding.x.axis.values = xAxisValues;
    newSpec.encoding.x.axis.labelExpr = `${JSON.stringify(
      xAxisExpr
    )}[datum.label]`;
  }

  // generating data.values
  source.forEach((d) => {
    const col = d[colId];
    const row = d[rowId];

    const xStart = colMap.get(col) || 0;
    const yStart = rowMap.get(row) || 0;

    const xField = spec.meta.parse === META_PARSE_VALUES.jitter ? "x" : CONF.X_FIELD;
    const yField = spec.meta.parse === META_PARSE_VALUES.jitter ? "y" : CONF.Y_FIELD;

    const xCoord = xStart + scaleX(d[xField]);

    values.push({
      ...d,
      [CONF.X_FIELD]: xCoord,
      [CONF.Y_FIELD]: yStart + scaleY(d[yField]),
      [CONF.X_FIELD + "_num"]: d.scaledX ? xStart + scaleX(d.scaledX) : xCoord,
      scaleX: (val) => yStart + scaleX(val),
      scaleY: (val) => yStart + scaleY(val),
    });
  });

  newSpec.encoding.x.scale.domain = xDomain;
  newSpec.encoding.y.scale.domain = yDomain;
  newSpec.data.values = values;
  newSpec.width = xDomain[1] - xDomain[0];
  newSpec.height = yDomain[0] - yDomain[1];

  return newSpec;
}

/**
 * turns faceted spec to regular spec, using hacking technique
 * @param {Object} spec vega lite spec with facets
 * @returns vega-lite spec
 */
function hackFacet(spec) {
  const div = document.createElement("div");

  spec.data.name = "source";

  return vegaEmbed(div, spec, { renderer: "svg" }).then((resp) => {
    const newSpec = getHackedSpec({
      ...resp,
      width: spec.spec.width,
      height: spec.spec.height,
    });

    if (spec.config) {
      newSpec.config = spec.config;
    }

    if (spec.meta) {
      newSpec.meta = spec.meta;
    }

    let [transformX, transformY] = resp.view._origin;

    if (!(spec.facet && spec.facet.row && !spec.facet.column)) {
      transformY = 0;
    }

    if (newSpec.meta) {
      newSpec.meta.transformX = transformX;
      newSpec.meta.transformY = transformY;
    } else {
      newSpec.meta = { transformX, transformY };
    }

    return newSpec;
  });
}

/**
 * Entry point of Datamations JavaScript code
 * Reads vega-lite specifications, converts to vega specs and animates them
 *
 * ### Dependencies:
 * - gemini: https://github.com/uwdata/gemini
 * - vega-lite: https://vega.github.io/vega-lite/
 * - vega: https://vega.github.io/vega/
 * - vega-embed: https://github.com/vega/vega-embed
 * - d3: https://d3js.org/
 * - gifshot: https://github.com/yahoo/gifshot
 * - html2canvas: https://html2canvas.hertzen.com/
 * - download2: http://danml.com/download.html
 */

/**
 *
 * @param {String} id conteiner id
 * @param {Object} param1 configuration object
 * @param {Array} param1.specs list of vega-lite specifications
 * @param {Boolean} param1.autoPlay autoPlay
 * @param {Number} param1.frameDel frame duration (in ms.)
 * @param {Number} param1.frameDel delay between frames (in ms.)
 * @returns an object of exposed functions
 */
function App(id, { specs, autoPlay = false, frameDur, frameDel }) {
  let rawSpecsImmutable; // saving passed specs here, not changed by reference
  let rawSpecs; // holds raw vega-lite specs, not transformed
  let vegaLiteSpecs;
  let vegaSpecs; // vega specs
  let frames;
  let metas;
  let frameIndex = 0;
  let timeoutId;
  let playing = false;
  let initializing = false;
  let frameDuration = frameDur || 2000;
  let frameDelay = frameDel || 1000;

  // a fallback gemini spec in case gemini.animate could not recommend anything
  const gemSpec = {
    timeline: {
      concat: [
        {
          sync: [
            {
              component: {
                mark: "marks",
              },
              change: {
                data: {
                  keys: ["gemini_id"],
                  update: true,
                  enter: true,
                  exit: false,
                },
                encode: {
                  update: true,
                  enter: true,
                  exit: true,
                },
              },
              timing: {
                duration: {
                  ratio: 1,
                },
              },
            },
          ],
        },
      ],
    },
    totalDuration: frameDuration,
  };

  /**
   * Resets all the instance variables to be able to re-run animation
   */
  const reset = () => {
    vegaLiteSpecs = [];
    vegaSpecs = [];
    rawSpecs = [];
    rawSpecsImmutable = [];
    frames = [];
    metas = [];
    frameIndex = 0;
    playing = false;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  /**
   * Initializes datamation app
   */
  async function init() {
    // ignore all subsequent init calls.
    if (initializing) return;
    initializing = true;

    const { slider } = getSelectors(id);

    reset();

    // load or set data
    if (specs) {
      vegaLiteSpecs = JSON.parse(JSON.stringify(specs));
    }

    // save raw specs to use for facet axes drawing
    vegaLiteSpecs.forEach((d) => {
      rawSpecs.push(JSON.parse(JSON.stringify(d)));
      rawSpecsImmutable.push(JSON.parse(JSON.stringify(d)));

      if (d.meta) {
        metas.push(d.meta);
      }
    });

    d3.select(slider).property("max", vegaLiteSpecs.length - 1);

    // parse, jitter, layer splitting
    await transformSpecs();

    // compile to vega
    toVegaSpecs();

    // create frames for animation
    await makeFrames();

    drawSpec(0);

    if (autoPlay) {
      setTimeout(play, 100);
    }

    initializing = false;
  }

  /**
   * Plays animation
   */
  function play(cb = () => {}) {
    playing = true;
    frameIndex = 0;

    const tick = () => {
      animateFrame(frameIndex, cb).then(() => {
        if (playing) {
          frameIndex++; // next frame

          if (frames[frameIndex]) {
            tick();
          } else {
            playing = false;
            disableEnable("enable");
          }
        }
      });

      if (typeof HTMLWidgets !== "undefined" && HTMLWidgets.shinyMode) {
        var prevIndex = frameIndex - 1;
        Shiny.onInputChange("slider_state", prevIndex);
      }
    };

    disableEnable("disable");
    tick();
  }

  /**
   * Draws vega lite spec statically (without transition), also updates slider, description, show/hides some layers
   * @param {Number} index specification index in vegaLiteSpecs
   * @param {Object} vegaSpec source vega spec of current frame
   * @returns a promise of vegaEmbed
   */
  function drawSpec(index, vegaSpec) {
    let spec = vegaLiteSpecs[index];

    if (!spec) return;

    if (spec.custom) {
      spec = gemini.vl2vg4gemini(spec.sequence[spec.sequence.length - 1]);
    }

    const meta = metas[index];

    const {
      axisSelector,
      visSelector,
      descr,
      slider,
      otherLayers,
      controls,
      exportWrap,
    } = getSelectors(id);

    d3.select(slider).property("value", index);
    d3.select(descr).html(meta.description || "frame " + index);
    d3.select(axisSelector)
      .style("opacity", meta.axes ? 1 : 0)
      .html("");
    d3.select(visSelector).classed("with-axes", meta.axes);
    d3.select(otherLayers).classed("with-axes", meta.axes);

    // draw axis
    if (meta.axes) {
      drawAxis(index);
    }

    const transformX = meta.transformX || 0;
    const transformY = meta.transformY || 0;

    // shift vis
    d3.select(visSelector)
      .style("left", transformX + "px")
      .style("top", transformY + "px");

    const _width = spec.width + transformX + 10;
    d3.select(controls).style("width", _width + "px");
    d3.select(descr).style("width", _width + "px");

    // draw vis
    return drawChart(spec, vegaSpec && vegaSpec.custom ? null : vegaSpec);
  }

  /**
   * Draws a chart, either spec or vegaSpec (which is passed from animate function)
   * Supports single view as well as multiple view chart
   * @param {Object} spec vega-lite spec
   * @param {Object} vegaSpec source vega spec of current frame
   * @returns a promise of vegaEmbed
   */
  function drawChart(spec, vegaSpec) {
    const { visSelector, otherLayers } = getSelectors(id);
    const layers = document.querySelector(otherLayers);
    layers.innerHTML = "";

    if (Array.isArray(spec)) {
      return new Promise((res) => {
        spec.forEach((s, i) => {
          let target,
            embedSpec = s;

          if (s.meta.animated) {
            target = visSelector;
            if (vegaSpec) {
              embedSpec = vegaSpec;
            }
          } else {
            const div = document.createElement("div");
            div.classList.add("vega-hidden-layer");
            layers.appendChild(div);
            target = div;
          }

          vegaEmbed(target, embedSpec, { renderer: "svg" }).then(() => {
            if (i === spec.length - 1) {
              res();
            }

            // ensure facet translations match in axisSelector and otherLayers
            setTimeout(() => {
              adjustAxisAndErrorbars();
            }, 100);
          });
        });
      });
    } else {
      return vegaEmbed(visSelector, vegaSpec || spec, { renderer: "svg" });
    }
  }

  /**
   * Fixes hacked axis spec and error bar alignment
   */
  function adjustAxisAndErrorbars() {
    const { axisSelector, otherLayers } = getSelectors(id);
    const axisCells = d3
      .select(axisSelector)
      .selectAll(".mark-group.cell>g")
      .nodes();
    const otherLayersCells = d3
      .select(otherLayers)
      .selectAll(".mark-group.cell>g")
      .nodes();

    if (axisCells.length === otherLayersCells.length) {
      for (let i = 0; i < axisCells.length; i++) {
        const transform = axisCells[i].getAttribute("transform");
        otherLayersCells[i].setAttribute("transform", transform);
      }
    }
  }

  /**
   * Draws an axis layer. This is called when meta.axes = true.
   * @param {Number} index specification index in vegaLiteSpecs
   * @returns a promise of vegaEmbed
   */
  function drawAxis(index) {
    let spec = rawSpecs[index];

    if (spec.spec && spec.spec.layer) {
      const split = splitLayers(spec);
      spec = split[1];
    }

    const columnFacet = spec.facet && spec.facet.column;
    const { axisSelector, controls, descr, otherLayers } = getSelectors(id);

    // update axis domain to matched hacked facet view
    const encoding = spec.spec ? spec.spec.encoding : spec.encoding;

    if (!encoding.y.scale) {
      const extentY = d3.extent(spec.data.values, (d) => d[CONF.Y_FIELD]);
      encoding.y.scale = { domain: extentY };
    }

    if (encoding.color) {
      encoding.color.legend = null;
    }

    if (encoding.fill) {
      encoding.fill.legend = null;
    }

    if (encoding.x && encoding.x.axis) {
      encoding.x.axis.labelAngle = -90;
      encoding.x.axis.titleOpacity = 0;
    }

    return vegaEmbed(axisSelector, spec, { renderer: "svg" }).then(() => {
      if (columnFacet && columnFacet.title) {
        const fn = function () {
          const transform = d3.select(this).attr("transform");
          const x = transform.split("(")[1].split(",")[0];
          return `translate(${x}, 40)`;
        };

        d3.select(axisSelector + " svg > g").attr("transform", fn);
        d3.select(otherLayers + " svg > g").attr("transform", fn);
      }
      const width = d3
        .select(axisSelector)
        .node()
        .getBoundingClientRect().width;
      d3.select(controls).style("width", width + "px");
      d3.select(descr).style("width", width + "px");
    });
  }

  /**
   * Animates a frame, from source to target vega specification using gemini
   * @param {Number} index specification index in vegaLiteSpecs
   * @param {Function} cb callback function of each frame drawal
   * @returns a promise of gemini.animate
   */
  async function animateFrame(index, cb) {
    if (!frames[index]) return;

    console.log("animating frame", index);

    const { axisSelector, visSelector, otherLayers, descr, slider, controls } =
      getSelectors(id);

    let { source, target, gemSpec, prevMeta, currMeta } = frames[index];
    let anim = null;

    if (source.custom) {
      const _source_spec = gemini.vl2vg4gemini(
        source.sequence[source.sequence.length - 1]
      );
      anim = await gemini.animate(_source_spec, target, gemSpec);
    } else if (target.custom) {
      anim = await gemini.animateSequence(target.sequence, gemSpec);
    } else {
      anim = await gemini.animate(source, target, gemSpec);
    }

    let currHasAxes = currMeta.axes;
    let width = target.width;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // initial frame
    if (index === 0 && cb) cb(0);

    return new Promise((res) => {
      drawSpec(index, source).then(() => {
        timeoutId = setTimeout(() => {
          d3.select(descr).html(currMeta.description);
          anim.play(visSelector).then(() => {
            d3.select(slider).property("value", index + 1);
            cb && cb(index + 1);
            res();
          });

          const transformX = currMeta.transformX || 0;
          const transformY = currMeta.transformY || 0;

          d3.select(visSelector)
            .transition()
            .duration(750)
            .style("left", transformX + "px")
            .style("top", transformY + "px");

          // show/hide axis vega chart
          if (currHasAxes) {
            drawAxis(index + 1);
            d3.select(axisSelector)
              .transition()
              .duration(1000)
              .style("opacity", 1);
            d3.select(visSelector).classed("with-axes", true);
            d3.select(otherLayers).classed("with-axes", true);
          } else {
            d3.select(axisSelector)
              .transition()
              .duration(1000)
              .style("opacity", 0);
            d3.select(visSelector).classed("with-axes", false);
            d3.select(otherLayers).classed("with-axes", false);
            d3.select(controls).style("width", width + transformX + 10 + "px");
            d3.select(descr).style("width", width + transformX + 10 + "px");
          }

          const nextSpec = vegaLiteSpecs[index + 1];

          if (nextSpec && Array.isArray(nextSpec)) {
            const statics = nextSpec.filter((d) => !d.meta.animated);

            d3.select(otherLayers)
              .html("")
              .style("opacity", 0)
              .transition()
              .delay(frameDuration * 0.9)
              .duration(frameDuration / 3)
              .style("opacity", 1);

            statics.forEach((s) => {
              const div = document.createElement("div");
              div.classList.add("vega-hidden-layer");
              vegaEmbed(div, s, { renderer: "svg" }).then(() => {
                adjustAxisAndErrorbars();
              });
              document.querySelector(otherLayers).appendChild(div);
            });
          } 
        }, 
        // removed delay between frames for custom animations
        target.custom ? 0 : frameDelay);
      });
    });
  }

  /**
   * Transforms specifications into proper format:
   * - meta.grid = generates infogrid
   * - meta.jitter = jitters data using d3.forceCollide
   * - meta.custom_animation = handles custom animation type
   * - spec.layer = splits layers to stack on top on each other
   */
  async function transformSpecs() {
    const rows = getRows(vegaLiteSpecs);

    for (let i = 0; i < vegaLiteSpecs.length; i++) {
      let vlSpec = vegaLiteSpecs[i];

      if (Array.isArray(vlSpec)) continue; // just sanity check, making sure that it is not an array

      // if filter has empty `oneOf`, then generate empty spec and avoid any further processing
      if (
        vlSpec.transform &&
        vlSpec.transform[0].filter &&
        vlSpec.transform[0].filter.oneOf &&
        vlSpec.transform[0].filter.oneOf.length === 0
      ) {
        const emptySpec = getEmptySpec(vlSpec);

        metas[i] = emptySpec.meta;
        rawSpecs[i] = emptySpec;
        vlSpec = emptySpec;
        vegaLiteSpecs[i] = emptySpec;
        continue;
      }

      const meta = vlSpec.meta;
      const parse = meta.parse;

      // parsing

      if (meta.custom_animation) {
        let funName = meta.custom_animation;
        let p = null;

        // handle quantile
        if (
          Array.isArray(meta.custom_animation) &&
          meta.custom_animation[0] === "quantile"
        ) {
          p = meta.custom_animation[1];
          funName = "median";
        }

        let source = {
          ...rawSpecs[i - 1],
          data: rawSpecsImmutable[i - 1].data,
        };
        let target = vlSpec;

        if (rawSpecsImmutable[i - 1].facet) {
          source = {
            ...vegaLiteSpecs[i - 1],
            meta: {
              ...vegaLiteSpecs[i - 1].meta,
              hasFacet: true,
              columnFacet: rawSpecsImmutable[i - 1].facet.column,
              rowFacet: rawSpecsImmutable[i - 1].facet.row,
            },
            data: {
              values: vegaLiteSpecs[i - 1].data.values.map((d) => {
                return {
                  ...d,
                  [CONF.X_FIELD]: d[CONF.X_FIELD + "_num"],
                };
              }),
            },
          };
        }

        // if custom animations have facets, fake them before passing to CustomAnimation
        if (vegaLiteSpecs[i].facet) {
          const newSpecTarget = await hackFacet(vegaLiteSpecs[i]);
          vegaLiteSpecs[i] = newSpecTarget;
          target = newSpecTarget;
        }

        const fn = CustomAnimations[funName];

        if (fn) {
          const sequence = await fn(source, target, vegaLiteSpecs[i - 1], p);
          vegaLiteSpecs[i] = {
            custom: meta.custom_animation,
            sequence,
          };
        }
      } else if (parse === META_PARSE_VALUES.grid) {
        const gridSpec = await getGridSpec(vlSpec, rows);

        const enc = gridSpec.spec ? gridSpec.spec.encoding : gridSpec.encoding;
        rawSpecs[i].data.values = gridSpec.data.values;

        // update domain for raw spec axis layer
        if (rawSpecs[i].meta.axes && rawSpecs[i].meta.splitField) {
          const encoding = rawSpecs[i].spec
            ? rawSpecs[i].spec.encoding
            : rawSpecs[i].encoding;

          encoding.x.axis = enc.x.axis;
          encoding.y.scale = {
            domain: enc.y.scale.domain,
          };
          encoding.x.scale = {
            domain: enc.x.scale.domain,
          };
        }

        vegaLiteSpecs[i] = gridSpec;
      } 
      else if (parse === META_PARSE_VALUES.jitter) {
        vegaLiteSpecs[i] = await getJitterSpec(vlSpec);
      } 
      // since gemini does not support multiple multiple axis transitions, 
      // we must split the layers and draw as separate vega spec
      else if (vlSpec.layer || (vlSpec.spec && vlSpec.spec.layer)) {
        const arr = splitLayers(vlSpec);

        vegaLiteSpecs[i] = [];

        for (let j = 0; j < arr.length; j++) {
          const s = arr[j];

          // fake facets
          if (s.facet && s.spec && s.meta.animated) {
            const newSpec = await hackFacet(s);
            vegaLiteSpecs[i].push(newSpec);
            metas[i] = newSpec.meta;
          } else {
            vegaLiteSpecs[i].push(s);
          }
        }
      }

      if (vegaLiteSpecs[i]) {
        const facet = vegaLiteSpecs[i].facet;
        const spec = vegaLiteSpecs[i].spec;

        // fake facets
        if (facet && spec) {
          const newSpec = await hackFacet(vegaLiteSpecs[i]);
          vegaLiteSpecs[i] = newSpec;
        }
      }
    }

    console.log("parsed specs:", vegaLiteSpecs);
  }

  /**
   * Converts vega-lite specs to vega specs using vl2vg4gemini (https://github.com/uwdata/gemini#vl2vg4gemini)
   */
  function toVegaSpecs() {
    vegaSpecs = vegaLiteSpecs.map((d) => {
      if (d.custom) {
        return d;
      }

      const s = Array.isArray(d) ? d.find((d) => d.meta.animated) : d;
      return gemini.vl2vg4gemini(s);
    });
  }

  /**
   * Generates animation frames
   * @returns array of objects of \{ source, target, gemSpec, prevMeta, currMeta \}
   */
  async function makeFrames() {
    const options = {
      stageN: 1,

      scales: {
        x: {
          domainDimension: "diff",
        },
        y: {
          domainDimension: "diff",
        },
      },

      marks: {
        marks: {
          change: {
            scale: ["x", "y"],
            data: {
              keys: ["gemini_id"],
              update: true,
              enter: true,
              exit: true,
            },
            encode: {
              update: true,
              enter: true,
              exit: true,
            },
          },
        },
      },
      totalDuration: frameDuration,
    };

    for (let i = 1; i < vegaSpecs.length; i++) {
      const prev = vegaSpecs[i - 1];
      const curr = vegaSpecs[i];

      const prevMeta = metas[i - 1];
      const currMeta = metas[i];

      try {
        let resp = null;

        if (curr.custom) {
          resp = await gemini.recommendForSeq(curr.sequence, {
            ...options,
            stageN: curr.sequence.length - 1,
            totalDuration: frameDuration * 2,
          });

          const _gemSpec = resp[0].specs.map((d) => d.spec);

          // make sure to add gemini_id to data change.
          // gemini recommend does not add it by itself.
          _gemSpec.forEach((d) => {
            if (d.timeline.concat.length) {
              const first = d.timeline.concat[0].sync[0];
              if (first && first.change && first.change.data) {
                first.change.data = {
                  keys: ["gemini_id"],
                  update: true,
                  enter: true,
                  exit: true,
                };
              }
            }
          });

          frames.push({
            source: prev,
            target: curr,
            gemSpec: _gemSpec,
            prevMeta,
            currMeta,
          });
        } else {
          resp = await gemini.recommend(
            prev.custom
              ? gemini.vl2vg4gemini(prev.sequence[prev.sequence.length - 1])
              : prev,
            curr,
            options
          );

          const _gemSpec = resp[0] ? resp[0].spec : gemSpec;
          const sync = _gemSpec.timeline.concat[0].sync;

          if (!sync.some((d) => d.component === "view")) {
            sync.push({
              component: "view",
              change: {
                signal: ["width", "height"],
              },
              timing: {
                duration: {
                  ratio: 1,
                },
              },
            });
          }

          frames.push({
            source: prev,
            target: curr,
            gemSpec: _gemSpec,
            prevMeta,
            currMeta,
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  /**
   * Slider on change callback
   */
  function onSlide() {
    playing = false;
    disableEnable("enable");
    const { slider } = getSelectors(id);
    const index = document.querySelector(slider).value;
    drawSpec(index);
  }

  /**
   * Exports png files for each frame
   */
  function exportPNG() {
    const { exportWrap } = getSelectors(id);

    const pngs = [];

    const callback = (index) => {
      const done = index >= frames.length;

      html2canvas(document.querySelector(exportWrap)).then((canvas) => {
        pngs.push(canvas.toDataURL());

        if (done) {
          pngs.forEach((uri, i) => {
            var a = document.createElement("a");
            a.href = uri;
            a.download = `frame-${i + 1}.png`;
            a.click();
          });
        }
      });
    };

    play(callback);
  }

  /**
   * Exports datamation as gif.
   * @param {Boolean} fromWeb truthy if it is called from webpage, falsy from command line tool
   * @returns either base64 string, or downloads .gif file
   */
  function exportGif(fromWeb) {
    const { exportWrap, exportBtn } = getSelectors(id);

    if (fromWeb) {
      loaderOnOff(true);
      disableEnable("disable", { slider: true });
    }

    let intervalId,
      images = [];

    const startInterval = () => {
      if (intervalId) clearInterval(intervalId);

      intervalId = setInterval(() => {
        html2canvas(document.querySelector(exportWrap)).then((canvas) => {
          images.push(canvas.toDataURL());
        });
      }, 16.66666);
    };

    let maxWidth = 300;
    let maxHeight = 300;

    return new Promise((res) => {
      const callback = (index) => {
        const done = index >= frames.length;
        const bound = document
          .querySelector(exportWrap)
          .getBoundingClientRect();

        if (bound.width > maxWidth) maxWidth = bound.width;
        if (bound.height > maxHeight) maxHeight = bound.height;

        if (done) {
          intervalId && clearInterval(intervalId);

          setTimeout(() => {
            gifshot.createGIF(
              {
                images,
                gifWidth: maxWidth,
                gifHeight: maxHeight,
                frameDuration: 2.5,
              },
              function (obj) {
                if (fromWeb) {
                  loaderOnOff(false);
                  disableEnable("enable", { slider: true });
                }

                if (!obj.error) {
                  var image = obj.image;

                  if (fromWeb) {
                    download(image, "animation.gif", "image/gif");
                  }
                  res(image);
                } else {
                  console.error("error creating gif", obj.errorMsg);
                }
              }
            );
          }, 1000);
        } else {
          intervalId && clearInterval(intervalId);
          setTimeout(startInterval, frameDelay);
        }
      };

      play(callback);
    });
  }

  /**
   * Disables or enables some components
   * @param {String} cmd "disable" or "enable"
   * @param {Array} components array of components
   */
  function disableEnable(cmd, components) {
    const { replayBtn, exportBtn, slider } = getSelectors(id);
    const arr = [replayBtn, exportBtn];

    if (components && components.slider) {
      arr.push(slider);
    }

    arr.forEach((sel) => {
      const el = document.querySelector(sel);

      if (cmd == "disable") {
        el.setAttribute("disabled", "disabled");
      } else {
        el.removeAttribute("disabled");
      }
    });
  }

  /**
   * Download button icon adjustment
   * @param {Boolean} loading
   */
  function loaderOnOff(loading) {
    const { exportBtn } = getSelectors(id);
    let className = "fas fa-download";

    if (loading) {
      className = "fas fa-spinner spin";
    }

    d3.select(exportBtn).select("i").attr("class", className);
  }

  init();

  return {
    onSlide,
    play,
    exportPNG,
    exportGif,
    animateFrame,
    getFrames: () => frames,
  };
}

exports.App = App;
exports.CONF = CONF;
exports.CustomAnimations = CustomAnimations;
exports.IGNORE_FIELDS = IGNORE_FIELDS;
exports.META_PARSE_VALUES = META_PARSE_VALUES;
exports.generateGrid = generateGrid;
exports.getCountStep = getCountStep;
exports.getEmptySpec = getEmptySpec;
exports.getGridSpec = getGridSpec;
exports.getHackedSpec = getHackedSpec;
exports.getJitterSpec = getJitterSpec;
exports.getMeanStep = getMeanStep;
exports.getMedianStep = getMedianStep;
exports.getMinMaxStep = getMinMaxStep;
exports.getRows = getRows;
exports.getSelectors = getSelectors;
exports.getSpecTemplate = getSpecTemplate;
exports.hackFacet = hackFacet;
exports.lookupByBucket = lookupByBucket;
exports.splitLayers = splitLayers;
//# sourceMappingURL=index.js.map
