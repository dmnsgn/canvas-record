import { D as functionUncurryThis, f as functionCall } from './es.error.cause-21133fd0.js';

// eslint-disable-next-line es/no-map -- safe
var MapPrototype = Map.prototype;

var mapHelpers = {
  // eslint-disable-next-line es/no-map -- safe
  Map: Map,
  set: functionUncurryThis(MapPrototype.set),
  get: functionUncurryThis(MapPrototype.get),
  has: functionUncurryThis(MapPrototype.has),
  remove: functionUncurryThis(MapPrototype['delete']),
  proto: MapPrototype
};

var iterateSimple = function (iterator, fn, $next) {
  var next = $next || iterator.next;
  var step, result;
  while (!(step = functionCall(next, iterator)).done) {
    result = fn(step.value);
    if (result !== undefined) return result;
  }
};

var Map$1 = mapHelpers.Map;
var MapPrototype$1 = mapHelpers.proto;
var forEach = functionUncurryThis(MapPrototype$1.forEach);
var entries = functionUncurryThis(MapPrototype$1.entries);
var next = entries(new Map$1()).next;

var mapIterate = function (map, fn, interruptible) {
  return interruptible ? iterateSimple(entries(map), function (entry) {
    return fn(entry[1], entry[0]);
  }, next) : forEach(map, fn);
};

export { mapHelpers as a, iterateSimple as i, mapIterate as m };
