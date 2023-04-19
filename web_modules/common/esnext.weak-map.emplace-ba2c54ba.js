import { D as functionUncurryThis, _ as _export } from './es.error.cause-21133fd0.js';

// eslint-disable-next-line es/no-weak-set -- safe
var WeakSetPrototype = WeakSet.prototype;

var weakSetHelpers = {
  // eslint-disable-next-line es/no-weak-set -- safe
  WeakSet: WeakSet,
  add: functionUncurryThis(WeakSetPrototype.add),
  has: functionUncurryThis(WeakSetPrototype.has),
  remove: functionUncurryThis(WeakSetPrototype['delete'])
};

var has = weakSetHelpers.has;

// Perform ? RequireInternalSlot(M, [[WeakSetData]])
var aWeakSet = function (it) {
  has(it);
  return it;
};

var add = weakSetHelpers.add;

// `WeakSet.prototype.addAll` method
// https://github.com/tc39/proposal-collection-methods
_export({ target: 'WeakSet', proto: true, real: true, forced: true }, {
  addAll: function addAll(/* ...elements */) {
    var set = aWeakSet(this);
    for (var k = 0, len = arguments.length; k < len; k++) {
      add(set, arguments[k]);
    } return set;
  }
});

var remove = weakSetHelpers.remove;

// `WeakSet.prototype.deleteAll` method
// https://github.com/tc39/proposal-collection-methods
_export({ target: 'WeakSet', proto: true, real: true, forced: true }, {
  deleteAll: function deleteAll(/* ...elements */) {
    var collection = aWeakSet(this);
    var allDeleted = true;
    var wasDeleted;
    for (var k = 0, len = arguments.length; k < len; k++) {
      wasDeleted = remove(collection, arguments[k]);
      allDeleted = allDeleted && wasDeleted;
    } return !!allDeleted;
  }
});

// eslint-disable-next-line es/no-weak-map -- safe
var WeakMapPrototype = WeakMap.prototype;

var weakMapHelpers = {
  // eslint-disable-next-line es/no-weak-map -- safe
  WeakMap: WeakMap,
  set: functionUncurryThis(WeakMapPrototype.set),
  get: functionUncurryThis(WeakMapPrototype.get),
  has: functionUncurryThis(WeakMapPrototype.has),
  remove: functionUncurryThis(WeakMapPrototype['delete'])
};

var has$1 = weakMapHelpers.has;

// Perform ? RequireInternalSlot(M, [[WeakMapData]])
var aWeakMap = function (it) {
  has$1(it);
  return it;
};

var remove$1 = weakMapHelpers.remove;

// `WeakMap.prototype.deleteAll` method
// https://github.com/tc39/proposal-collection-methods
_export({ target: 'WeakMap', proto: true, real: true, forced: true }, {
  deleteAll: function deleteAll(/* ...elements */) {
    var collection = aWeakMap(this);
    var allDeleted = true;
    var wasDeleted;
    for (var k = 0, len = arguments.length; k < len; k++) {
      wasDeleted = remove$1(collection, arguments[k]);
      allDeleted = allDeleted && wasDeleted;
    } return !!allDeleted;
  }
});

var get = weakMapHelpers.get;
var has$2 = weakMapHelpers.has;
var set = weakMapHelpers.set;

// `WeakMap.prototype.emplace` method
// https://github.com/tc39/proposal-upsert
_export({ target: 'WeakMap', proto: true, real: true, forced: true }, {
  emplace: function emplace(key, handler) {
    var map = aWeakMap(this);
    var value, inserted;
    if (has$2(map, key)) {
      value = get(map, key);
      if ('update' in handler) {
        value = handler.update(value, key, map);
        set(map, key, value);
      } return value;
    }
    inserted = handler.insert(key, map);
    set(map, key, inserted);
    return inserted;
  }
});
