import { _ as _export, a as aCallable } from './es.error.cause-2f8d9604.js';
import { a as asyncIteratorIteration, i as iterate } from './iterate-c1890e1d.js';
import { g as getIteratorDirect } from './iterator-close-66357cf1.js';

var $find = asyncIteratorIteration.find;

// `AsyncIterator.prototype.find` method
// https://github.com/tc39/proposal-async-iterator-helpers
_export({ target: 'AsyncIterator', proto: true, real: true }, {
  find: function find(predicate) {
    return $find(this, predicate);
  }
});

// `Iterator.prototype.find` method
// https://github.com/tc39/proposal-iterator-helpers
_export({ target: 'Iterator', proto: true, real: true }, {
  find: function find(predicate) {
    var record = getIteratorDirect(this);
    var counter = 0;
    aCallable(predicate);
    return iterate(record, function (value, stop) {
      if (predicate(value, counter++)) return stop(value);
    }, { IS_RECORD: true, INTERRUPTED: true }).result;
  }
});
