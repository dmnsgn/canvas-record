import { _ as _export, a as aCallable } from './es.error.cause-21133fd0.js';
import { a as asyncIteratorIteration, i as iterate } from './iterate-ea425a93.js';
import { g as getIteratorDirect } from './iterator-close-902907c1.js';

var $forEach = asyncIteratorIteration.forEach;

// `AsyncIterator.prototype.forEach` method
// https://github.com/tc39/proposal-async-iterator-helpers
_export({ target: 'AsyncIterator', proto: true, real: true }, {
  forEach: function forEach(fn) {
    return $forEach(this, fn);
  }
});

// `Iterator.prototype.forEach` method
// https://github.com/tc39/proposal-iterator-helpers
_export({ target: 'Iterator', proto: true, real: true }, {
  forEach: function forEach(fn) {
    var record = getIteratorDirect(this);
    var counter = 0;
    aCallable(fn);
    iterate(record, function (value) {
      fn(value, counter++);
    }, { IS_RECORD: true });
  }
});
