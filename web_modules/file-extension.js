function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var fileExtension = createCommonjsModule(function (module, exports) {

  (function (m) {
    {
      module.exports = m();
    }
  })(function () {
    return function fileExtension(filename, opts) {
      if (!opts) opts = {};
      if (!filename) return "";
      var ext = (/[^./\\]*$/.exec(filename) || [""])[0];
      return opts.preserveCase ? ext : ext.toLowerCase();
    };
  });
});

export default fileExtension;
