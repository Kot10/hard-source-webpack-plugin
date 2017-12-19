var NormalModule = require('webpack/lib/NormalModule');
var Module = require('webpack/lib/Module');

var HardModule = require('./hard-module-4');
var pluginCompat = require('./util/plugin-compat');

function freezeHashContent(module) {
  var content = [];
  var hash = {
    update: function(str) {
      content.push(str);
    },
  };

  hash.update("meta");
  hash.update(JSON.stringify(module.buildMeta));

  Module.prototype.updateHash.call(module, hash);

  return content.join('');
}

function HardNormalModulePlugin() {}

HardNormalModulePlugin.prototype.apply = function(compiler) {
  var freeze, mapFreeze;

  pluginCompat.tap(compiler, '_hardSourceMethods', 'HardNormalModulePlugin', function(methods) {
    // store = methods.store;
    // fetch = methods.fetch;
    freeze = methods.freeze;
    // thaw = methods.thaw;
    mapFreeze = methods.mapFreeze;
    // mapThaw = methods.mapThaw;
  });

  pluginCompat.tap(compiler, '_hardSourceFreezeModule', 'HardNormalModulePlugin', function(frozen, module, extra) {
    // console.log(module.constructor.name, module.request.split('/').reverse()[0], module.buildInfo.cacheable, module instanceof HardModule, module instanceof NormalModule, module.buildTimestamp);
    if (
      module.request &&
      (module.cacheable || module.buildInfo && module.buildInfo.cacheable) &&
      !(module instanceof HardModule) &&
      (module instanceof NormalModule) &&
      (
        frozen &&
        module.buildTimestamp > frozen.buildTimestamp ||
        !frozen
      )
    ) {
      // console.log(module.request);
      var compilation = extra.compilation;
      var source = module.source(
        compilation.dependencyTemplates,
        compilation.moduleTemplates.javascript.outputOptions,
        compilation.moduleTemplates.javascript.requestShortener
      );

      return {
        type: 'NormalModule',

        moduleId: module.id,
        context: module.context,
        request: module.request,
        userRequest: module.userRequest,
        rawRequest: module.rawRequest,
        resource: module.resource,
        loaders: module.loaders,
        identifier: module.identifier(),
        // libIdent: module.libIdent &&
        // module.libIdent({context: compiler.options.context}),

        buildTimestamp: module.buildTimestamp,
        buildMeta: module.buildMeta,
        used: module.used,
        usedExports: module.usedExports,
        providedExports: module.providedExports,
        // HarmonyDetectionParserPlugin
        exportsArgument: module.exportsArgument,
        issuer:
          typeof module.issuer === 'string' ? module.issuer :
          module.issuer && typeof module.issuer === 'object' ? module.issuer.identifier() :
          null,

        rawSource: module._source ? module._source.source() : null,
        source: source.source(),

        sourceMap: freeze('SourceMap', null, source, {
          module: module,
          compilation: compilation,
        }),

        buildInfo: {
          fileDependencies: Array.from(module.buildInfo.fileDependencies),
          contextDependencies: Array.from(module.buildInfo.contextDependencies),
          assets: freeze('ModuleAssets', null, module.buildInfo.assets, {
            module: module,
            compilation: compilation,
          }),
          harmonyModule: module.buildInfo.harmonyModule,
          strict: module.buildInfo.strict,
          exportsArgument: module.buildInfo.exportsArgument,
        },

        hashContent: freezeHashContent(module),

        dependencyBlock: freeze('DependencyBlock', null, module, {
          module: module,
          parent: module,
          compilation: compilation,
        }),
        errors: mapFreeze('ModuleError', null, module.errors, {
          module: module,
          compilation: compilation,
        }),
        warnings: mapFreeze('ModuleWarning', null, module.warnings, {
          module: module,
          compilation: compilation,
        }),
      };
    }

    return frozen;
  });

  pluginCompat.tap(compiler, '_hardSourceThawModule', 'HardNormalModulePlugin thaw', function(module, frozen, _extra) {
    if (frozen.type === 'NormalModule') {
      return new HardModule(frozen, _extra.compilation.__hardSourceFileMd5s, _extra.compilation.__hardSourceCachedMd5s);
    }
    return module;
  });
};

module.exports = HardNormalModulePlugin;
