import { b as anObject, a as aCallable, d as functionCall } from './es.error.cause-76796be3.js';

// https://github.com/tc39/collection-methods
var collectionAddAll = function addAll(/* ...elements */) {
  var set = anObject(this);
  var adder = aCallable(set.add);
  for (var k = 0, len = arguments.length; k < len; k++) {
    functionCall(adder, set, arguments[k]);
  }
  return set;
};

// https://github.com/tc39/collection-methods
var collectionDeleteAll = function deleteAll(/* ...elements */) {
  var collection = anObject(this);
  var remover = aCallable(collection['delete']);
  var allDeleted = true;
  var wasDeleted;
  for (var k = 0, len = arguments.length; k < len; k++) {
    wasDeleted = functionCall(remover, collection, arguments[k]);
    allDeleted = allDeleted && wasDeleted;
  }
  return !!allDeleted;
};

// `Map.prototype.emplace` method
// https://github.com/thumbsupep/proposal-upsert
var mapEmplace = function emplace(key, handler) {
  var map = anObject(this);
  var get = aCallable(map.get);
  var has = aCallable(map.has);
  var set = aCallable(map.set);
  var value, inserted;
  if (functionCall(has, map, key)) {
    value = functionCall(get, map, key);
    if ('update' in handler) {
      value = handler.update(value, key, map);
      functionCall(set, map, key, value);
    } return value;
  }
  inserted = handler.insert(key, map);
  functionCall(set, map, key, inserted);
  return inserted;
};

export { collectionDeleteAll as a, collectionAddAll as c, mapEmplace as m };
