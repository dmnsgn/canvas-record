import { _ as _export, a as aCallable, b as anObject, f as functionCall, i as isObject } from './es.error.cause-2f8d9604.js';
import { g as getIteratorDirect, a as asyncIteratorClose } from './iterator-close-66357cf1.js';
import { a as asyncIteratorCreateProxy, c as createIterResultObject, i as iteratorCreateProxy, b as callWithSafeIterationClosing } from './call-with-safe-iteration-closing-d930339a.js';

var AsyncIteratorProxy = asyncIteratorCreateProxy(function (Promise) {
  var state = this;
  var iterator = state.iterator;
  var predicate = state.predicate;

  return new Promise(function (resolve, reject) {
    var doneAndReject = function (error) {
      state.done = true;
      reject(error);
    };

    var ifAbruptCloseAsyncIterator = function (error) {
      asyncIteratorClose(iterator, doneAndReject, error, doneAndReject);
    };

    var loop = function () {
      try {
        Promise.resolve(anObject(functionCall(state.next, iterator))).then(function (step) {
          try {
            if (anObject(step).done) {
              state.done = true;
              resolve(createIterResultObject(undefined, true));
            } else {
              var value = step.value;
              try {
                var result = predicate(value, state.counter++);

                var handler = function (selected) {
                  selected ? resolve(createIterResultObject(value, false)) : loop();
                };

                if (isObject(result)) Promise.resolve(result).then(handler, ifAbruptCloseAsyncIterator);
                else handler(result);
              } catch (error3) { ifAbruptCloseAsyncIterator(error3); }
            }
          } catch (error2) { doneAndReject(error2); }
        }, doneAndReject);
      } catch (error) { doneAndReject(error); }
    };

    loop();
  });
});

// `AsyncIterator.prototype.filter` method
// https://github.com/tc39/proposal-async-iterator-helpers
_export({ target: 'AsyncIterator', proto: true, real: true }, {
  filter: function filter(predicate) {
    return new AsyncIteratorProxy(getIteratorDirect(this), {
      predicate: aCallable(predicate)
    });
  }
});

var IteratorProxy = iteratorCreateProxy(function () {
  var iterator = this.iterator;
  var predicate = this.predicate;
  var next = this.next;
  var result, done, value;
  while (true) {
    result = anObject(functionCall(next, iterator));
    done = this.done = !!result.done;
    if (done) return;
    value = result.value;
    if (callWithSafeIterationClosing(iterator, predicate, [value, this.counter++], true)) return value;
  }
});

// `Iterator.prototype.filter` method
// https://github.com/tc39/proposal-iterator-helpers
_export({ target: 'Iterator', proto: true, real: true }, {
  filter: function filter(predicate) {
    return new IteratorProxy(getIteratorDirect(this), {
      predicate: aCallable(predicate)
    });
  }
});
