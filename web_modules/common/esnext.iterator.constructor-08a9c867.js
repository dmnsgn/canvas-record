import { o as objectIsPrototypeOf, w as wellKnownSymbol, g as global_1, i as isCallable, f as fails, h as hasOwnProperty_1, c as createNonEnumerableProperty, _ as _export } from './es.error.cause-c5e0cc86.js';
import { i as iteratorsCore } from './map-iterate-1f81817b.js';

var $TypeError = TypeError;

var anInstance = function (it, Prototype) {
  if (objectIsPrototypeOf(Prototype, it)) return it;
  throw $TypeError('Incorrect invocation');
};

var IteratorPrototype = iteratorsCore.IteratorPrototype;


var TO_STRING_TAG = wellKnownSymbol('toStringTag');

var NativeIterator = global_1.Iterator;

// FF56- have non-standard global helper `Iterator`
var FORCED =  !isCallable(NativeIterator)
  || NativeIterator.prototype !== IteratorPrototype
  // FF44- non-standard `Iterator` passes previous tests
  || !fails(function () { NativeIterator({}); });

var IteratorConstructor = function Iterator() {
  anInstance(this, IteratorPrototype);
};

if (!hasOwnProperty_1(IteratorPrototype, TO_STRING_TAG)) {
  createNonEnumerableProperty(IteratorPrototype, TO_STRING_TAG, 'Iterator');
}

if (FORCED || !hasOwnProperty_1(IteratorPrototype, 'constructor') || IteratorPrototype.constructor === Object) {
  createNonEnumerableProperty(IteratorPrototype, 'constructor', IteratorConstructor);
}

IteratorConstructor.prototype = IteratorPrototype;

// `Iterator` constructor
// https://github.com/tc39/proposal-iterator-helpers
_export({ global: true, constructor: true, forced: FORCED }, {
  Iterator: IteratorConstructor
});

export { anInstance as a };
