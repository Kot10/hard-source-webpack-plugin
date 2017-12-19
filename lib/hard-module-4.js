var path = require('path');

var AsyncDependenciesBlock = require('webpack/lib/AsyncDependenciesBlock');
var DependenciesBlockVariable = require('webpack/lib/DependenciesBlockVariable');
var RawModule = require('webpack/lib/RawModule');

var ModuleError = require('webpack-core/lib/ModuleError');
var ModuleWarning = require('webpack-core/lib/ModuleWarning');

var RawSource = require('webpack-sources').RawSource;

var HardSource = require('./hard-source');

var OldHardModule = require('./hard-module');

module.exports = HardModule;

function HardModule(cacheItem, fileMd5s, cachedMd5s) {
  Object.setPrototypeOf(this,
    Object.setPrototypeOf(
      new RawModule(
        cacheItem.source, cacheItem.identifier, cacheItem.userRequest
      ),
      HardModule.prototype
    )
  );

  this.cacheItem = cacheItem;

  this.request = cacheItem.request;
  this.userRequest = cacheItem.userRequest;
  this.rawRequest = cacheItem.rawRequest;
  this.resource = cacheItem.resource;
  this.context = cacheItem.context;
  this.loaders = cacheItem.loaders;

  this.buildTimestamp = cacheItem.buildTimestamp;

  this.buildMeta = cacheItem.buildMeta;
  this.buildInfo = {
    cacheable: true,
    fileDependencies: new Set(cacheItem.buildInfo.fileDependencies),
    contextDependencies: new Set(cacheItem.buildInfo.contextDependencies),
    harmonyModule: cacheItem.buildInfo.harmonyModule,
    strict: cacheItem.buildInfo.strict,
    exportsArgument: cacheItem.buildInfo.exportsArgument,
  };

  this.fileMd5s = fileMd5s;
  this.cachedMd5s = cachedMd5s;
}
Object.setPrototypeOf(HardModule.prototype, OldHardModule.prototype);
Object.setPrototypeOf(HardModule, OldHardModule);

Object.defineProperty(HardModule.prototype, 'fileDependencies', {
  get: function() {
    return this.buildInfo.fileDependencies;
  },
  set: function(value) {
    this.buildInfo.fileDependencies = value;
  },
});

Object.defineProperty(HardModule.prototype, 'contextDependencies', {
  get: function() {
    return this.buildInfo.contextDependencies;
  },
  set: function(value) {
    this.buildInfo.contextDependencies = value;
  },
});

HardModule.prototype.source = function() {
  return this._renderedSource;
};

// From webpack/lib/NormalModule.js
function contextify(options, request) {
  return request.split("!").map(function(r) {
    var rp = path.relative(options.context, r);
    if(path.sep === "\\")
      rp = rp.replace(/\\/g, "/");
    if(rp.indexOf("../") !== 0)
      rp = "./" + rp;
    return rp;
  }).join("!");
}

HardModule.prototype.libIdent = function(options) {
  return contextify(options, this.userRequest);
};

HardModule.prototype.build = function build(options, compilation, resolver, fs, callback) {
  // Non-rendered source used by Stats.
  if (this.cacheItem.rawSource) {
    this._source = new RawSource(this.cacheItem.rawSource);
  }
  // Rendered source used in built output.
  this._renderedSource = new HardSource(this.cacheItem);

  var thaw = compilation.__hardSourceMethods.thaw;
  var mapThaw = compilation.__hardSourceMethods.mapThaw;

  var extra = {
    state: {imports: {}},
    module: this,
    parent: this,
  };

  this.buildInfo.assets = thaw('ModuleAssets', null, this.cacheItem.assets, extra);
  thaw('DependencyBlock', this, this.cacheItem.dependencyBlock, extra);
  this.errors = mapThaw('ModuleError', null, this.cacheItem.errors, extra);
  this.warnings = mapThaw('ModuleWarning', null, this.cacheItem.warnings, extra);

  this.error = this.errors[0] || null;

  callback();
};
