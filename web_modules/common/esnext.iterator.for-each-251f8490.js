import { _ as _export, a as aCallable } from './es.error.cause-c5e0cc86.js';
import { a as asyncIteratorIteration, i as iterate } from './iterate-46fbe091.js';
import { g as getIteratorDirect } from './map-iterate-1f81817b.js';

var $forEach = asyncIteratorIteration.forEach;

// `AsyncIterator.prototype.forEach` method
// https://github.com/tc39/proposal-iterator-helpers
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
