var DependenciesBlockVariable = require('webpack/lib/DependenciesBlockVariable');
var RawModule = require('webpack/lib/RawModule');
var ContextModule = require('webpack/lib/ContextModule');

var HardSource = require('./hard-source');

var OldHardContextModule = require('./hard-context-module');

module.exports = HardContextModule;

function HardContextModule(cacheItem) {
  Object.setPrototypeOf(this,
    Object.setPrototypeOf(
      new ContextModule(null, Object.assign({}, cacheItem.options, {
        regExp: cacheItem.options.regExp ?
        new RegExp(cacheItem.options.regExp) :
        cacheItem.options.regExp
      })),
      HardContextModule.prototype
    )
  );
  this.cacheItem = cacheItem;
  this.context = cacheItem.context;
  this.buildMeta = cacheItem.buildMeta;
  this.buildInfo = Object.assign({}, cacheItem.buildInfo, {
    contextDependencies: new Set(cacheItem.buildInfo.contextDependencies),
  });
  this.built = false;
}

Object.setPrototypeOf(HardContextModule.prototype, OldHardContextModule.prototype);
Object.setPrototypeOf(HardContextModule, OldHardContextModule);

HardContextModule.prototype.isHard = function() {return true;};

function prettyRegExp(str) {
  return str.substring(1, str.length - 1);
}

Object.defineProperty(HardContextModule.prototype, 'contextDependencies', {
  get: function() {
    return this.buildInfo.contextDependencies;
  },
  set: function(value) {
    this.buildInfo.contextDependencies = value;
  },
});

HardContextModule.prototype.readableIdentifier = function(requestShortener) {
  let identifier = requestShortener.shorten(this.context);
  if(this.cacheItem.options.resourceQuery)
    identifier += ` ${this.cacheItem.options.resourceQuery}`;
  if(this.cacheItem.options.mode)
    identifier += ` ${this.cacheItem.options.mode}`;
  if(!this.cacheItem.options.recursive)
    identifier += " nonrecursive";
  if(this.cacheItem.options.addon)
    identifier += ` ${requestShortener.shorten(this.cacheItem.options.addon)}`;
  if(this.cacheItem.options.regExp)
    identifier += ` ${prettyRegExp(this.cacheItem.options.regExp + "")}`;
  if(this.cacheItem.options.include)
    identifier += ` include: ${prettyRegExp(this.cacheItem.options.include + "")}`;
  if(this.cacheItem.options.exclude)
    identifier += ` exclude: ${prettyRegExp(this.cacheItem.options.exclude + "")}`;
  if(this.cacheItem.options.namespaceObject === "strict")
    identifier += " strict namespace object";
  else if(this.cacheItem.options.namespaceObject)
    identifier += " namespace object";

  return identifier;
};

HardContextModule.prototype.build = function(options, compilation, resolver, fs, callback) {
  this.builtTime = this.cacheItem.builtTime;
  var cacheItem = this.cacheItem;

  var thaw = compilation.__hardSourceMethods.thaw;

  var extra = {
    state: {imports: {}},
    module: this,
    parent: this,
  };
  thaw('DependencyBlock', this, cacheItem.dependencyBlock, extra);

  this._renderedSource = new HardSource(cacheItem);

  callback();
};

HardContextModule.prototype.source = function() {
  return this._renderedSource;
};

HardContextModule.prototype.updateHash = function(hash) {
  hash.update(this.cacheItem.hashContent);
};
