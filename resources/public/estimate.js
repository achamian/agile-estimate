var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  value = parseInt(value, 10);
  precision = 0;
  return goog.string.format.demuxes_["f"](value, flags, width, dotp, precision, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6568 = x == null ? null : x;
  if(p[goog.typeOf(x__6568)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6569__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6569 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6569__delegate.call(this, array, i, idxs)
    };
    G__6569.cljs$lang$maxFixedArity = 2;
    G__6569.cljs$lang$applyTo = function(arglist__6570) {
      var array = cljs.core.first(arglist__6570);
      var i = cljs.core.first(cljs.core.next(arglist__6570));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6570));
      return G__6569__delegate(array, i, idxs)
    };
    G__6569.cljs$lang$arity$variadic = G__6569__delegate;
    return G__6569
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6655 = this$;
      if(and__3822__auto____6655) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6655
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2361__auto____6656 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6657 = cljs.core._invoke[goog.typeOf(x__2361__auto____6656)];
        if(or__3824__auto____6657) {
          return or__3824__auto____6657
        }else {
          var or__3824__auto____6658 = cljs.core._invoke["_"];
          if(or__3824__auto____6658) {
            return or__3824__auto____6658
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6659 = this$;
      if(and__3822__auto____6659) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6659
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2361__auto____6660 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6661 = cljs.core._invoke[goog.typeOf(x__2361__auto____6660)];
        if(or__3824__auto____6661) {
          return or__3824__auto____6661
        }else {
          var or__3824__auto____6662 = cljs.core._invoke["_"];
          if(or__3824__auto____6662) {
            return or__3824__auto____6662
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6663 = this$;
      if(and__3822__auto____6663) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6663
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2361__auto____6664 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6665 = cljs.core._invoke[goog.typeOf(x__2361__auto____6664)];
        if(or__3824__auto____6665) {
          return or__3824__auto____6665
        }else {
          var or__3824__auto____6666 = cljs.core._invoke["_"];
          if(or__3824__auto____6666) {
            return or__3824__auto____6666
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6667 = this$;
      if(and__3822__auto____6667) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6667
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2361__auto____6668 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6669 = cljs.core._invoke[goog.typeOf(x__2361__auto____6668)];
        if(or__3824__auto____6669) {
          return or__3824__auto____6669
        }else {
          var or__3824__auto____6670 = cljs.core._invoke["_"];
          if(or__3824__auto____6670) {
            return or__3824__auto____6670
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6671 = this$;
      if(and__3822__auto____6671) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6671
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2361__auto____6672 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6673 = cljs.core._invoke[goog.typeOf(x__2361__auto____6672)];
        if(or__3824__auto____6673) {
          return or__3824__auto____6673
        }else {
          var or__3824__auto____6674 = cljs.core._invoke["_"];
          if(or__3824__auto____6674) {
            return or__3824__auto____6674
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6675 = this$;
      if(and__3822__auto____6675) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6675
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2361__auto____6676 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6677 = cljs.core._invoke[goog.typeOf(x__2361__auto____6676)];
        if(or__3824__auto____6677) {
          return or__3824__auto____6677
        }else {
          var or__3824__auto____6678 = cljs.core._invoke["_"];
          if(or__3824__auto____6678) {
            return or__3824__auto____6678
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6679 = this$;
      if(and__3822__auto____6679) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6679
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2361__auto____6680 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6681 = cljs.core._invoke[goog.typeOf(x__2361__auto____6680)];
        if(or__3824__auto____6681) {
          return or__3824__auto____6681
        }else {
          var or__3824__auto____6682 = cljs.core._invoke["_"];
          if(or__3824__auto____6682) {
            return or__3824__auto____6682
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6683 = this$;
      if(and__3822__auto____6683) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6683
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2361__auto____6684 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6685 = cljs.core._invoke[goog.typeOf(x__2361__auto____6684)];
        if(or__3824__auto____6685) {
          return or__3824__auto____6685
        }else {
          var or__3824__auto____6686 = cljs.core._invoke["_"];
          if(or__3824__auto____6686) {
            return or__3824__auto____6686
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6687 = this$;
      if(and__3822__auto____6687) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6687
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2361__auto____6688 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6689 = cljs.core._invoke[goog.typeOf(x__2361__auto____6688)];
        if(or__3824__auto____6689) {
          return or__3824__auto____6689
        }else {
          var or__3824__auto____6690 = cljs.core._invoke["_"];
          if(or__3824__auto____6690) {
            return or__3824__auto____6690
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6691 = this$;
      if(and__3822__auto____6691) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6691
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2361__auto____6692 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6693 = cljs.core._invoke[goog.typeOf(x__2361__auto____6692)];
        if(or__3824__auto____6693) {
          return or__3824__auto____6693
        }else {
          var or__3824__auto____6694 = cljs.core._invoke["_"];
          if(or__3824__auto____6694) {
            return or__3824__auto____6694
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6695 = this$;
      if(and__3822__auto____6695) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6695
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2361__auto____6696 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6697 = cljs.core._invoke[goog.typeOf(x__2361__auto____6696)];
        if(or__3824__auto____6697) {
          return or__3824__auto____6697
        }else {
          var or__3824__auto____6698 = cljs.core._invoke["_"];
          if(or__3824__auto____6698) {
            return or__3824__auto____6698
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6699 = this$;
      if(and__3822__auto____6699) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6699
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2361__auto____6700 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6701 = cljs.core._invoke[goog.typeOf(x__2361__auto____6700)];
        if(or__3824__auto____6701) {
          return or__3824__auto____6701
        }else {
          var or__3824__auto____6702 = cljs.core._invoke["_"];
          if(or__3824__auto____6702) {
            return or__3824__auto____6702
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6703 = this$;
      if(and__3822__auto____6703) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6703
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2361__auto____6704 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6705 = cljs.core._invoke[goog.typeOf(x__2361__auto____6704)];
        if(or__3824__auto____6705) {
          return or__3824__auto____6705
        }else {
          var or__3824__auto____6706 = cljs.core._invoke["_"];
          if(or__3824__auto____6706) {
            return or__3824__auto____6706
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6707 = this$;
      if(and__3822__auto____6707) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6707
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2361__auto____6708 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6709 = cljs.core._invoke[goog.typeOf(x__2361__auto____6708)];
        if(or__3824__auto____6709) {
          return or__3824__auto____6709
        }else {
          var or__3824__auto____6710 = cljs.core._invoke["_"];
          if(or__3824__auto____6710) {
            return or__3824__auto____6710
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6711 = this$;
      if(and__3822__auto____6711) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6711
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2361__auto____6712 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6713 = cljs.core._invoke[goog.typeOf(x__2361__auto____6712)];
        if(or__3824__auto____6713) {
          return or__3824__auto____6713
        }else {
          var or__3824__auto____6714 = cljs.core._invoke["_"];
          if(or__3824__auto____6714) {
            return or__3824__auto____6714
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6715 = this$;
      if(and__3822__auto____6715) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6715
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2361__auto____6716 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6717 = cljs.core._invoke[goog.typeOf(x__2361__auto____6716)];
        if(or__3824__auto____6717) {
          return or__3824__auto____6717
        }else {
          var or__3824__auto____6718 = cljs.core._invoke["_"];
          if(or__3824__auto____6718) {
            return or__3824__auto____6718
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6719 = this$;
      if(and__3822__auto____6719) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6719
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2361__auto____6720 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6721 = cljs.core._invoke[goog.typeOf(x__2361__auto____6720)];
        if(or__3824__auto____6721) {
          return or__3824__auto____6721
        }else {
          var or__3824__auto____6722 = cljs.core._invoke["_"];
          if(or__3824__auto____6722) {
            return or__3824__auto____6722
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6723 = this$;
      if(and__3822__auto____6723) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6723
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2361__auto____6724 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6725 = cljs.core._invoke[goog.typeOf(x__2361__auto____6724)];
        if(or__3824__auto____6725) {
          return or__3824__auto____6725
        }else {
          var or__3824__auto____6726 = cljs.core._invoke["_"];
          if(or__3824__auto____6726) {
            return or__3824__auto____6726
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6727 = this$;
      if(and__3822__auto____6727) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6727
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2361__auto____6728 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6729 = cljs.core._invoke[goog.typeOf(x__2361__auto____6728)];
        if(or__3824__auto____6729) {
          return or__3824__auto____6729
        }else {
          var or__3824__auto____6730 = cljs.core._invoke["_"];
          if(or__3824__auto____6730) {
            return or__3824__auto____6730
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6731 = this$;
      if(and__3822__auto____6731) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6731
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2361__auto____6732 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6733 = cljs.core._invoke[goog.typeOf(x__2361__auto____6732)];
        if(or__3824__auto____6733) {
          return or__3824__auto____6733
        }else {
          var or__3824__auto____6734 = cljs.core._invoke["_"];
          if(or__3824__auto____6734) {
            return or__3824__auto____6734
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6735 = this$;
      if(and__3822__auto____6735) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6735
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2361__auto____6736 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6737 = cljs.core._invoke[goog.typeOf(x__2361__auto____6736)];
        if(or__3824__auto____6737) {
          return or__3824__auto____6737
        }else {
          var or__3824__auto____6738 = cljs.core._invoke["_"];
          if(or__3824__auto____6738) {
            return or__3824__auto____6738
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6743 = coll;
    if(and__3822__auto____6743) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6743
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2361__auto____6744 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6745 = cljs.core._count[goog.typeOf(x__2361__auto____6744)];
      if(or__3824__auto____6745) {
        return or__3824__auto____6745
      }else {
        var or__3824__auto____6746 = cljs.core._count["_"];
        if(or__3824__auto____6746) {
          return or__3824__auto____6746
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6751 = coll;
    if(and__3822__auto____6751) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6751
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2361__auto____6752 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6753 = cljs.core._empty[goog.typeOf(x__2361__auto____6752)];
      if(or__3824__auto____6753) {
        return or__3824__auto____6753
      }else {
        var or__3824__auto____6754 = cljs.core._empty["_"];
        if(or__3824__auto____6754) {
          return or__3824__auto____6754
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6759 = coll;
    if(and__3822__auto____6759) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6759
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2361__auto____6760 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6761 = cljs.core._conj[goog.typeOf(x__2361__auto____6760)];
      if(or__3824__auto____6761) {
        return or__3824__auto____6761
      }else {
        var or__3824__auto____6762 = cljs.core._conj["_"];
        if(or__3824__auto____6762) {
          return or__3824__auto____6762
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6771 = coll;
      if(and__3822__auto____6771) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6771
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2361__auto____6772 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6773 = cljs.core._nth[goog.typeOf(x__2361__auto____6772)];
        if(or__3824__auto____6773) {
          return or__3824__auto____6773
        }else {
          var or__3824__auto____6774 = cljs.core._nth["_"];
          if(or__3824__auto____6774) {
            return or__3824__auto____6774
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6775 = coll;
      if(and__3822__auto____6775) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6775
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2361__auto____6776 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6777 = cljs.core._nth[goog.typeOf(x__2361__auto____6776)];
        if(or__3824__auto____6777) {
          return or__3824__auto____6777
        }else {
          var or__3824__auto____6778 = cljs.core._nth["_"];
          if(or__3824__auto____6778) {
            return or__3824__auto____6778
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6783 = coll;
    if(and__3822__auto____6783) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6783
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2361__auto____6784 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6785 = cljs.core._first[goog.typeOf(x__2361__auto____6784)];
      if(or__3824__auto____6785) {
        return or__3824__auto____6785
      }else {
        var or__3824__auto____6786 = cljs.core._first["_"];
        if(or__3824__auto____6786) {
          return or__3824__auto____6786
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6791 = coll;
    if(and__3822__auto____6791) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6791
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2361__auto____6792 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6793 = cljs.core._rest[goog.typeOf(x__2361__auto____6792)];
      if(or__3824__auto____6793) {
        return or__3824__auto____6793
      }else {
        var or__3824__auto____6794 = cljs.core._rest["_"];
        if(or__3824__auto____6794) {
          return or__3824__auto____6794
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6799 = coll;
    if(and__3822__auto____6799) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6799
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2361__auto____6800 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6801 = cljs.core._next[goog.typeOf(x__2361__auto____6800)];
      if(or__3824__auto____6801) {
        return or__3824__auto____6801
      }else {
        var or__3824__auto____6802 = cljs.core._next["_"];
        if(or__3824__auto____6802) {
          return or__3824__auto____6802
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6811 = o;
      if(and__3822__auto____6811) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6811
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2361__auto____6812 = o == null ? null : o;
      return function() {
        var or__3824__auto____6813 = cljs.core._lookup[goog.typeOf(x__2361__auto____6812)];
        if(or__3824__auto____6813) {
          return or__3824__auto____6813
        }else {
          var or__3824__auto____6814 = cljs.core._lookup["_"];
          if(or__3824__auto____6814) {
            return or__3824__auto____6814
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6815 = o;
      if(and__3822__auto____6815) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6815
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2361__auto____6816 = o == null ? null : o;
      return function() {
        var or__3824__auto____6817 = cljs.core._lookup[goog.typeOf(x__2361__auto____6816)];
        if(or__3824__auto____6817) {
          return or__3824__auto____6817
        }else {
          var or__3824__auto____6818 = cljs.core._lookup["_"];
          if(or__3824__auto____6818) {
            return or__3824__auto____6818
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6823 = coll;
    if(and__3822__auto____6823) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6823
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2361__auto____6824 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6825 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2361__auto____6824)];
      if(or__3824__auto____6825) {
        return or__3824__auto____6825
      }else {
        var or__3824__auto____6826 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6826) {
          return or__3824__auto____6826
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6831 = coll;
    if(and__3822__auto____6831) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6831
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2361__auto____6832 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6833 = cljs.core._assoc[goog.typeOf(x__2361__auto____6832)];
      if(or__3824__auto____6833) {
        return or__3824__auto____6833
      }else {
        var or__3824__auto____6834 = cljs.core._assoc["_"];
        if(or__3824__auto____6834) {
          return or__3824__auto____6834
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6839 = coll;
    if(and__3822__auto____6839) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6839
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2361__auto____6840 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6841 = cljs.core._dissoc[goog.typeOf(x__2361__auto____6840)];
      if(or__3824__auto____6841) {
        return or__3824__auto____6841
      }else {
        var or__3824__auto____6842 = cljs.core._dissoc["_"];
        if(or__3824__auto____6842) {
          return or__3824__auto____6842
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6847 = coll;
    if(and__3822__auto____6847) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6847
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2361__auto____6848 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6849 = cljs.core._key[goog.typeOf(x__2361__auto____6848)];
      if(or__3824__auto____6849) {
        return or__3824__auto____6849
      }else {
        var or__3824__auto____6850 = cljs.core._key["_"];
        if(or__3824__auto____6850) {
          return or__3824__auto____6850
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6855 = coll;
    if(and__3822__auto____6855) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6855
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2361__auto____6856 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6857 = cljs.core._val[goog.typeOf(x__2361__auto____6856)];
      if(or__3824__auto____6857) {
        return or__3824__auto____6857
      }else {
        var or__3824__auto____6858 = cljs.core._val["_"];
        if(or__3824__auto____6858) {
          return or__3824__auto____6858
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6863 = coll;
    if(and__3822__auto____6863) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6863
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2361__auto____6864 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6865 = cljs.core._disjoin[goog.typeOf(x__2361__auto____6864)];
      if(or__3824__auto____6865) {
        return or__3824__auto____6865
      }else {
        var or__3824__auto____6866 = cljs.core._disjoin["_"];
        if(or__3824__auto____6866) {
          return or__3824__auto____6866
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6871 = coll;
    if(and__3822__auto____6871) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6871
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2361__auto____6872 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6873 = cljs.core._peek[goog.typeOf(x__2361__auto____6872)];
      if(or__3824__auto____6873) {
        return or__3824__auto____6873
      }else {
        var or__3824__auto____6874 = cljs.core._peek["_"];
        if(or__3824__auto____6874) {
          return or__3824__auto____6874
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6879 = coll;
    if(and__3822__auto____6879) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6879
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2361__auto____6880 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6881 = cljs.core._pop[goog.typeOf(x__2361__auto____6880)];
      if(or__3824__auto____6881) {
        return or__3824__auto____6881
      }else {
        var or__3824__auto____6882 = cljs.core._pop["_"];
        if(or__3824__auto____6882) {
          return or__3824__auto____6882
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6887 = coll;
    if(and__3822__auto____6887) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6887
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2361__auto____6888 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6889 = cljs.core._assoc_n[goog.typeOf(x__2361__auto____6888)];
      if(or__3824__auto____6889) {
        return or__3824__auto____6889
      }else {
        var or__3824__auto____6890 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6890) {
          return or__3824__auto____6890
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6895 = o;
    if(and__3822__auto____6895) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6895
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2361__auto____6896 = o == null ? null : o;
    return function() {
      var or__3824__auto____6897 = cljs.core._deref[goog.typeOf(x__2361__auto____6896)];
      if(or__3824__auto____6897) {
        return or__3824__auto____6897
      }else {
        var or__3824__auto____6898 = cljs.core._deref["_"];
        if(or__3824__auto____6898) {
          return or__3824__auto____6898
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6903 = o;
    if(and__3822__auto____6903) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6903
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2361__auto____6904 = o == null ? null : o;
    return function() {
      var or__3824__auto____6905 = cljs.core._deref_with_timeout[goog.typeOf(x__2361__auto____6904)];
      if(or__3824__auto____6905) {
        return or__3824__auto____6905
      }else {
        var or__3824__auto____6906 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6906) {
          return or__3824__auto____6906
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6911 = o;
    if(and__3822__auto____6911) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6911
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2361__auto____6912 = o == null ? null : o;
    return function() {
      var or__3824__auto____6913 = cljs.core._meta[goog.typeOf(x__2361__auto____6912)];
      if(or__3824__auto____6913) {
        return or__3824__auto____6913
      }else {
        var or__3824__auto____6914 = cljs.core._meta["_"];
        if(or__3824__auto____6914) {
          return or__3824__auto____6914
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6919 = o;
    if(and__3822__auto____6919) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6919
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2361__auto____6920 = o == null ? null : o;
    return function() {
      var or__3824__auto____6921 = cljs.core._with_meta[goog.typeOf(x__2361__auto____6920)];
      if(or__3824__auto____6921) {
        return or__3824__auto____6921
      }else {
        var or__3824__auto____6922 = cljs.core._with_meta["_"];
        if(or__3824__auto____6922) {
          return or__3824__auto____6922
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6931 = coll;
      if(and__3822__auto____6931) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6931
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2361__auto____6932 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6933 = cljs.core._reduce[goog.typeOf(x__2361__auto____6932)];
        if(or__3824__auto____6933) {
          return or__3824__auto____6933
        }else {
          var or__3824__auto____6934 = cljs.core._reduce["_"];
          if(or__3824__auto____6934) {
            return or__3824__auto____6934
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6935 = coll;
      if(and__3822__auto____6935) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6935
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2361__auto____6936 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6937 = cljs.core._reduce[goog.typeOf(x__2361__auto____6936)];
        if(or__3824__auto____6937) {
          return or__3824__auto____6937
        }else {
          var or__3824__auto____6938 = cljs.core._reduce["_"];
          if(or__3824__auto____6938) {
            return or__3824__auto____6938
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6943 = coll;
    if(and__3822__auto____6943) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6943
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2361__auto____6944 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6945 = cljs.core._kv_reduce[goog.typeOf(x__2361__auto____6944)];
      if(or__3824__auto____6945) {
        return or__3824__auto____6945
      }else {
        var or__3824__auto____6946 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6946) {
          return or__3824__auto____6946
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6951 = o;
    if(and__3822__auto____6951) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6951
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2361__auto____6952 = o == null ? null : o;
    return function() {
      var or__3824__auto____6953 = cljs.core._equiv[goog.typeOf(x__2361__auto____6952)];
      if(or__3824__auto____6953) {
        return or__3824__auto____6953
      }else {
        var or__3824__auto____6954 = cljs.core._equiv["_"];
        if(or__3824__auto____6954) {
          return or__3824__auto____6954
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6959 = o;
    if(and__3822__auto____6959) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6959
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2361__auto____6960 = o == null ? null : o;
    return function() {
      var or__3824__auto____6961 = cljs.core._hash[goog.typeOf(x__2361__auto____6960)];
      if(or__3824__auto____6961) {
        return or__3824__auto____6961
      }else {
        var or__3824__auto____6962 = cljs.core._hash["_"];
        if(or__3824__auto____6962) {
          return or__3824__auto____6962
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6967 = o;
    if(and__3822__auto____6967) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6967
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2361__auto____6968 = o == null ? null : o;
    return function() {
      var or__3824__auto____6969 = cljs.core._seq[goog.typeOf(x__2361__auto____6968)];
      if(or__3824__auto____6969) {
        return or__3824__auto____6969
      }else {
        var or__3824__auto____6970 = cljs.core._seq["_"];
        if(or__3824__auto____6970) {
          return or__3824__auto____6970
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6975 = coll;
    if(and__3822__auto____6975) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6975
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2361__auto____6976 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6977 = cljs.core._rseq[goog.typeOf(x__2361__auto____6976)];
      if(or__3824__auto____6977) {
        return or__3824__auto____6977
      }else {
        var or__3824__auto____6978 = cljs.core._rseq["_"];
        if(or__3824__auto____6978) {
          return or__3824__auto____6978
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6983 = coll;
    if(and__3822__auto____6983) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6983
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2361__auto____6984 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6985 = cljs.core._sorted_seq[goog.typeOf(x__2361__auto____6984)];
      if(or__3824__auto____6985) {
        return or__3824__auto____6985
      }else {
        var or__3824__auto____6986 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6986) {
          return or__3824__auto____6986
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6991 = coll;
    if(and__3822__auto____6991) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6991
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2361__auto____6992 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6993 = cljs.core._sorted_seq_from[goog.typeOf(x__2361__auto____6992)];
      if(or__3824__auto____6993) {
        return or__3824__auto____6993
      }else {
        var or__3824__auto____6994 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6994) {
          return or__3824__auto____6994
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6999 = coll;
    if(and__3822__auto____6999) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6999
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2361__auto____7000 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7001 = cljs.core._entry_key[goog.typeOf(x__2361__auto____7000)];
      if(or__3824__auto____7001) {
        return or__3824__auto____7001
      }else {
        var or__3824__auto____7002 = cljs.core._entry_key["_"];
        if(or__3824__auto____7002) {
          return or__3824__auto____7002
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7007 = coll;
    if(and__3822__auto____7007) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7007
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2361__auto____7008 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7009 = cljs.core._comparator[goog.typeOf(x__2361__auto____7008)];
      if(or__3824__auto____7009) {
        return or__3824__auto____7009
      }else {
        var or__3824__auto____7010 = cljs.core._comparator["_"];
        if(or__3824__auto____7010) {
          return or__3824__auto____7010
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____7015 = o;
    if(and__3822__auto____7015) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7015
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2361__auto____7016 = o == null ? null : o;
    return function() {
      var or__3824__auto____7017 = cljs.core._pr_seq[goog.typeOf(x__2361__auto____7016)];
      if(or__3824__auto____7017) {
        return or__3824__auto____7017
      }else {
        var or__3824__auto____7018 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7018) {
          return or__3824__auto____7018
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____7023 = d;
    if(and__3822__auto____7023) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7023
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2361__auto____7024 = d == null ? null : d;
    return function() {
      var or__3824__auto____7025 = cljs.core._realized_QMARK_[goog.typeOf(x__2361__auto____7024)];
      if(or__3824__auto____7025) {
        return or__3824__auto____7025
      }else {
        var or__3824__auto____7026 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7026) {
          return or__3824__auto____7026
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____7031 = this$;
    if(and__3822__auto____7031) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7031
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2361__auto____7032 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7033 = cljs.core._notify_watches[goog.typeOf(x__2361__auto____7032)];
      if(or__3824__auto____7033) {
        return or__3824__auto____7033
      }else {
        var or__3824__auto____7034 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7034) {
          return or__3824__auto____7034
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7039 = this$;
    if(and__3822__auto____7039) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7039
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2361__auto____7040 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7041 = cljs.core._add_watch[goog.typeOf(x__2361__auto____7040)];
      if(or__3824__auto____7041) {
        return or__3824__auto____7041
      }else {
        var or__3824__auto____7042 = cljs.core._add_watch["_"];
        if(or__3824__auto____7042) {
          return or__3824__auto____7042
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7047 = this$;
    if(and__3822__auto____7047) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7047
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2361__auto____7048 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7049 = cljs.core._remove_watch[goog.typeOf(x__2361__auto____7048)];
      if(or__3824__auto____7049) {
        return or__3824__auto____7049
      }else {
        var or__3824__auto____7050 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7050) {
          return or__3824__auto____7050
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____7055 = coll;
    if(and__3822__auto____7055) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7055
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2361__auto____7056 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7057 = cljs.core._as_transient[goog.typeOf(x__2361__auto____7056)];
      if(or__3824__auto____7057) {
        return or__3824__auto____7057
      }else {
        var or__3824__auto____7058 = cljs.core._as_transient["_"];
        if(or__3824__auto____7058) {
          return or__3824__auto____7058
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____7063 = tcoll;
    if(and__3822__auto____7063) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7063
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2361__auto____7064 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7065 = cljs.core._conj_BANG_[goog.typeOf(x__2361__auto____7064)];
      if(or__3824__auto____7065) {
        return or__3824__auto____7065
      }else {
        var or__3824__auto____7066 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7066) {
          return or__3824__auto____7066
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7071 = tcoll;
    if(and__3822__auto____7071) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7071
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2361__auto____7072 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7073 = cljs.core._persistent_BANG_[goog.typeOf(x__2361__auto____7072)];
      if(or__3824__auto____7073) {
        return or__3824__auto____7073
      }else {
        var or__3824__auto____7074 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7074) {
          return or__3824__auto____7074
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____7079 = tcoll;
    if(and__3822__auto____7079) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7079
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2361__auto____7080 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7081 = cljs.core._assoc_BANG_[goog.typeOf(x__2361__auto____7080)];
      if(or__3824__auto____7081) {
        return or__3824__auto____7081
      }else {
        var or__3824__auto____7082 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7082) {
          return or__3824__auto____7082
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____7087 = tcoll;
    if(and__3822__auto____7087) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7087
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2361__auto____7088 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7089 = cljs.core._dissoc_BANG_[goog.typeOf(x__2361__auto____7088)];
      if(or__3824__auto____7089) {
        return or__3824__auto____7089
      }else {
        var or__3824__auto____7090 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7090) {
          return or__3824__auto____7090
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____7095 = tcoll;
    if(and__3822__auto____7095) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7095
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2361__auto____7096 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7097 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2361__auto____7096)];
      if(or__3824__auto____7097) {
        return or__3824__auto____7097
      }else {
        var or__3824__auto____7098 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7098) {
          return or__3824__auto____7098
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7103 = tcoll;
    if(and__3822__auto____7103) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7103
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2361__auto____7104 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7105 = cljs.core._pop_BANG_[goog.typeOf(x__2361__auto____7104)];
      if(or__3824__auto____7105) {
        return or__3824__auto____7105
      }else {
        var or__3824__auto____7106 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7106) {
          return or__3824__auto____7106
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____7111 = tcoll;
    if(and__3822__auto____7111) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7111
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2361__auto____7112 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7113 = cljs.core._disjoin_BANG_[goog.typeOf(x__2361__auto____7112)];
      if(or__3824__auto____7113) {
        return or__3824__auto____7113
      }else {
        var or__3824__auto____7114 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7114) {
          return or__3824__auto____7114
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____7119 = x;
    if(and__3822__auto____7119) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7119
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2361__auto____7120 = x == null ? null : x;
    return function() {
      var or__3824__auto____7121 = cljs.core._compare[goog.typeOf(x__2361__auto____7120)];
      if(or__3824__auto____7121) {
        return or__3824__auto____7121
      }else {
        var or__3824__auto____7122 = cljs.core._compare["_"];
        if(or__3824__auto____7122) {
          return or__3824__auto____7122
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____7127 = coll;
    if(and__3822__auto____7127) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7127
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2361__auto____7128 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7129 = cljs.core._drop_first[goog.typeOf(x__2361__auto____7128)];
      if(or__3824__auto____7129) {
        return or__3824__auto____7129
      }else {
        var or__3824__auto____7130 = cljs.core._drop_first["_"];
        if(or__3824__auto____7130) {
          return or__3824__auto____7130
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____7135 = coll;
    if(and__3822__auto____7135) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7135
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2361__auto____7136 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7137 = cljs.core._chunked_first[goog.typeOf(x__2361__auto____7136)];
      if(or__3824__auto____7137) {
        return or__3824__auto____7137
      }else {
        var or__3824__auto____7138 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7138) {
          return or__3824__auto____7138
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7143 = coll;
    if(and__3822__auto____7143) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7143
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2361__auto____7144 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7145 = cljs.core._chunked_rest[goog.typeOf(x__2361__auto____7144)];
      if(or__3824__auto____7145) {
        return or__3824__auto____7145
      }else {
        var or__3824__auto____7146 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7146) {
          return or__3824__auto____7146
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____7151 = coll;
    if(and__3822__auto____7151) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7151
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2361__auto____7152 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7153 = cljs.core._chunked_next[goog.typeOf(x__2361__auto____7152)];
      if(or__3824__auto____7153) {
        return or__3824__auto____7153
      }else {
        var or__3824__auto____7154 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7154) {
          return or__3824__auto____7154
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____7156 = x === y;
    if(or__3824__auto____7156) {
      return or__3824__auto____7156
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7157__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7158 = y;
            var G__7159 = cljs.core.first.call(null, more);
            var G__7160 = cljs.core.next.call(null, more);
            x = G__7158;
            y = G__7159;
            more = G__7160;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7157 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7157__delegate.call(this, x, y, more)
    };
    G__7157.cljs$lang$maxFixedArity = 2;
    G__7157.cljs$lang$applyTo = function(arglist__7161) {
      var x = cljs.core.first(arglist__7161);
      var y = cljs.core.first(cljs.core.next(arglist__7161));
      var more = cljs.core.rest(cljs.core.next(arglist__7161));
      return G__7157__delegate(x, y, more)
    };
    G__7157.cljs$lang$arity$variadic = G__7157__delegate;
    return G__7157
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__7162 = null;
  var G__7162__2 = function(o, k) {
    return null
  };
  var G__7162__3 = function(o, k, not_found) {
    return not_found
  };
  G__7162 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7162__2.call(this, o, k);
      case 3:
        return G__7162__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7162
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__7163 = null;
  var G__7163__2 = function(_, f) {
    return f.call(null)
  };
  var G__7163__3 = function(_, f, start) {
    return start
  };
  G__7163 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7163__2.call(this, _, f);
      case 3:
        return G__7163__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7163
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__7164 = null;
  var G__7164__2 = function(_, n) {
    return null
  };
  var G__7164__3 = function(_, n, not_found) {
    return not_found
  };
  G__7164 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7164__2.call(this, _, n);
      case 3:
        return G__7164__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7164
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____7165 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7165) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7165
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__7178 = cljs.core._count.call(null, cicoll);
    if(cnt__7178 === 0) {
      return f.call(null)
    }else {
      var val__7179 = cljs.core._nth.call(null, cicoll, 0);
      var n__7180 = 1;
      while(true) {
        if(n__7180 < cnt__7178) {
          var nval__7181 = f.call(null, val__7179, cljs.core._nth.call(null, cicoll, n__7180));
          if(cljs.core.reduced_QMARK_.call(null, nval__7181)) {
            return cljs.core.deref.call(null, nval__7181)
          }else {
            var G__7190 = nval__7181;
            var G__7191 = n__7180 + 1;
            val__7179 = G__7190;
            n__7180 = G__7191;
            continue
          }
        }else {
          return val__7179
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7182 = cljs.core._count.call(null, cicoll);
    var val__7183 = val;
    var n__7184 = 0;
    while(true) {
      if(n__7184 < cnt__7182) {
        var nval__7185 = f.call(null, val__7183, cljs.core._nth.call(null, cicoll, n__7184));
        if(cljs.core.reduced_QMARK_.call(null, nval__7185)) {
          return cljs.core.deref.call(null, nval__7185)
        }else {
          var G__7192 = nval__7185;
          var G__7193 = n__7184 + 1;
          val__7183 = G__7192;
          n__7184 = G__7193;
          continue
        }
      }else {
        return val__7183
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7186 = cljs.core._count.call(null, cicoll);
    var val__7187 = val;
    var n__7188 = idx;
    while(true) {
      if(n__7188 < cnt__7186) {
        var nval__7189 = f.call(null, val__7187, cljs.core._nth.call(null, cicoll, n__7188));
        if(cljs.core.reduced_QMARK_.call(null, nval__7189)) {
          return cljs.core.deref.call(null, nval__7189)
        }else {
          var G__7194 = nval__7189;
          var G__7195 = n__7188 + 1;
          val__7187 = G__7194;
          n__7188 = G__7195;
          continue
        }
      }else {
        return val__7187
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__7208 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7209 = arr[0];
      var n__7210 = 1;
      while(true) {
        if(n__7210 < cnt__7208) {
          var nval__7211 = f.call(null, val__7209, arr[n__7210]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7211)) {
            return cljs.core.deref.call(null, nval__7211)
          }else {
            var G__7220 = nval__7211;
            var G__7221 = n__7210 + 1;
            val__7209 = G__7220;
            n__7210 = G__7221;
            continue
          }
        }else {
          return val__7209
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7212 = arr.length;
    var val__7213 = val;
    var n__7214 = 0;
    while(true) {
      if(n__7214 < cnt__7212) {
        var nval__7215 = f.call(null, val__7213, arr[n__7214]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7215)) {
          return cljs.core.deref.call(null, nval__7215)
        }else {
          var G__7222 = nval__7215;
          var G__7223 = n__7214 + 1;
          val__7213 = G__7222;
          n__7214 = G__7223;
          continue
        }
      }else {
        return val__7213
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7216 = arr.length;
    var val__7217 = val;
    var n__7218 = idx;
    while(true) {
      if(n__7218 < cnt__7216) {
        var nval__7219 = f.call(null, val__7217, arr[n__7218]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7219)) {
          return cljs.core.deref.call(null, nval__7219)
        }else {
          var G__7224 = nval__7219;
          var G__7225 = n__7218 + 1;
          val__7217 = G__7224;
          n__7218 = G__7225;
          continue
        }
      }else {
        return val__7217
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7226 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7227 = this;
  if(this__7227.i + 1 < this__7227.a.length) {
    return new cljs.core.IndexedSeq(this__7227.a, this__7227.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7228 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7229 = this;
  var c__7230 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7230 > 0) {
    return new cljs.core.RSeq(coll, c__7230 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7231 = this;
  var this__7232 = this;
  return cljs.core.pr_str.call(null, this__7232)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7233 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7233.a)) {
    return cljs.core.ci_reduce.call(null, this__7233.a, f, this__7233.a[this__7233.i], this__7233.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7233.a[this__7233.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7234 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7234.a)) {
    return cljs.core.ci_reduce.call(null, this__7234.a, f, start, this__7234.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7235 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7236 = this;
  return this__7236.a.length - this__7236.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7237 = this;
  return this__7237.a[this__7237.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7238 = this;
  if(this__7238.i + 1 < this__7238.a.length) {
    return new cljs.core.IndexedSeq(this__7238.a, this__7238.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7239 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7240 = this;
  var i__7241 = n + this__7240.i;
  if(i__7241 < this__7240.a.length) {
    return this__7240.a[i__7241]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7242 = this;
  var i__7243 = n + this__7242.i;
  if(i__7243 < this__7242.a.length) {
    return this__7242.a[i__7243]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__7244 = null;
  var G__7244__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7244__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7244 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7244__2.call(this, array, f);
      case 3:
        return G__7244__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7244
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7245 = null;
  var G__7245__2 = function(array, k) {
    return array[k]
  };
  var G__7245__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7245 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7245__2.call(this, array, k);
      case 3:
        return G__7245__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7245
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7246 = null;
  var G__7246__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7246__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7246 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7246__2.call(this, array, n);
      case 3:
        return G__7246__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7246
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7247 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7248 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7249 = this;
  var this__7250 = this;
  return cljs.core.pr_str.call(null, this__7250)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7251 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7252 = this;
  return this__7252.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7253 = this;
  return cljs.core._nth.call(null, this__7253.ci, this__7253.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7254 = this;
  if(this__7254.i > 0) {
    return new cljs.core.RSeq(this__7254.ci, this__7254.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7255 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7256 = this;
  return new cljs.core.RSeq(this__7256.ci, this__7256.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7257 = this;
  return this__7257.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7261__7262 = coll;
      if(G__7261__7262) {
        if(function() {
          var or__3824__auto____7263 = G__7261__7262.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7263) {
            return or__3824__auto____7263
          }else {
            return G__7261__7262.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7261__7262.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7261__7262)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7261__7262)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7268__7269 = coll;
      if(G__7268__7269) {
        if(function() {
          var or__3824__auto____7270 = G__7268__7269.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7270) {
            return or__3824__auto____7270
          }else {
            return G__7268__7269.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7268__7269.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7268__7269)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7268__7269)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7271 = cljs.core.seq.call(null, coll);
      if(s__7271 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7271)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7276__7277 = coll;
      if(G__7276__7277) {
        if(function() {
          var or__3824__auto____7278 = G__7276__7277.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7278) {
            return or__3824__auto____7278
          }else {
            return G__7276__7277.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7276__7277.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7276__7277)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7276__7277)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7279 = cljs.core.seq.call(null, coll);
      if(!(s__7279 == null)) {
        return cljs.core._rest.call(null, s__7279)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7283__7284 = coll;
      if(G__7283__7284) {
        if(function() {
          var or__3824__auto____7285 = G__7283__7284.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7285) {
            return or__3824__auto____7285
          }else {
            return G__7283__7284.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7283__7284.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7283__7284)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7283__7284)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__7287 = cljs.core.next.call(null, s);
    if(!(sn__7287 == null)) {
      var G__7288 = sn__7287;
      s = G__7288;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__7289__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7290 = conj.call(null, coll, x);
          var G__7291 = cljs.core.first.call(null, xs);
          var G__7292 = cljs.core.next.call(null, xs);
          coll = G__7290;
          x = G__7291;
          xs = G__7292;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7289 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7289__delegate.call(this, coll, x, xs)
    };
    G__7289.cljs$lang$maxFixedArity = 2;
    G__7289.cljs$lang$applyTo = function(arglist__7293) {
      var coll = cljs.core.first(arglist__7293);
      var x = cljs.core.first(cljs.core.next(arglist__7293));
      var xs = cljs.core.rest(cljs.core.next(arglist__7293));
      return G__7289__delegate(coll, x, xs)
    };
    G__7289.cljs$lang$arity$variadic = G__7289__delegate;
    return G__7289
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__7296 = cljs.core.seq.call(null, coll);
  var acc__7297 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7296)) {
      return acc__7297 + cljs.core._count.call(null, s__7296)
    }else {
      var G__7298 = cljs.core.next.call(null, s__7296);
      var G__7299 = acc__7297 + 1;
      s__7296 = G__7298;
      acc__7297 = G__7299;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__7306__7307 = coll;
        if(G__7306__7307) {
          if(function() {
            var or__3824__auto____7308 = G__7306__7307.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7308) {
              return or__3824__auto____7308
            }else {
              return G__7306__7307.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7306__7307.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7306__7307)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7306__7307)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__7309__7310 = coll;
        if(G__7309__7310) {
          if(function() {
            var or__3824__auto____7311 = G__7309__7310.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7311) {
              return or__3824__auto____7311
            }else {
              return G__7309__7310.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7309__7310.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7309__7310)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7309__7310)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__7314__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7313 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7315 = ret__7313;
          var G__7316 = cljs.core.first.call(null, kvs);
          var G__7317 = cljs.core.second.call(null, kvs);
          var G__7318 = cljs.core.nnext.call(null, kvs);
          coll = G__7315;
          k = G__7316;
          v = G__7317;
          kvs = G__7318;
          continue
        }else {
          return ret__7313
        }
        break
      }
    };
    var G__7314 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7314__delegate.call(this, coll, k, v, kvs)
    };
    G__7314.cljs$lang$maxFixedArity = 3;
    G__7314.cljs$lang$applyTo = function(arglist__7319) {
      var coll = cljs.core.first(arglist__7319);
      var k = cljs.core.first(cljs.core.next(arglist__7319));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7319)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7319)));
      return G__7314__delegate(coll, k, v, kvs)
    };
    G__7314.cljs$lang$arity$variadic = G__7314__delegate;
    return G__7314
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__7322__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7321 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7323 = ret__7321;
          var G__7324 = cljs.core.first.call(null, ks);
          var G__7325 = cljs.core.next.call(null, ks);
          coll = G__7323;
          k = G__7324;
          ks = G__7325;
          continue
        }else {
          return ret__7321
        }
        break
      }
    };
    var G__7322 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7322__delegate.call(this, coll, k, ks)
    };
    G__7322.cljs$lang$maxFixedArity = 2;
    G__7322.cljs$lang$applyTo = function(arglist__7326) {
      var coll = cljs.core.first(arglist__7326);
      var k = cljs.core.first(cljs.core.next(arglist__7326));
      var ks = cljs.core.rest(cljs.core.next(arglist__7326));
      return G__7322__delegate(coll, k, ks)
    };
    G__7322.cljs$lang$arity$variadic = G__7322__delegate;
    return G__7322
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__7330__7331 = o;
    if(G__7330__7331) {
      if(function() {
        var or__3824__auto____7332 = G__7330__7331.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7332) {
          return or__3824__auto____7332
        }else {
          return G__7330__7331.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7330__7331.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7330__7331)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7330__7331)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__7335__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7334 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7336 = ret__7334;
          var G__7337 = cljs.core.first.call(null, ks);
          var G__7338 = cljs.core.next.call(null, ks);
          coll = G__7336;
          k = G__7337;
          ks = G__7338;
          continue
        }else {
          return ret__7334
        }
        break
      }
    };
    var G__7335 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7335__delegate.call(this, coll, k, ks)
    };
    G__7335.cljs$lang$maxFixedArity = 2;
    G__7335.cljs$lang$applyTo = function(arglist__7339) {
      var coll = cljs.core.first(arglist__7339);
      var k = cljs.core.first(cljs.core.next(arglist__7339));
      var ks = cljs.core.rest(cljs.core.next(arglist__7339));
      return G__7335__delegate(coll, k, ks)
    };
    G__7335.cljs$lang$arity$variadic = G__7335__delegate;
    return G__7335
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__7341 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7341;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7341
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7343 = cljs.core.string_hash_cache[k];
  if(!(h__7343 == null)) {
    return h__7343
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____7345 = goog.isString(o);
      if(and__3822__auto____7345) {
        return check_cache
      }else {
        return and__3822__auto____7345
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7349__7350 = x;
    if(G__7349__7350) {
      if(function() {
        var or__3824__auto____7351 = G__7349__7350.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7351) {
          return or__3824__auto____7351
        }else {
          return G__7349__7350.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7349__7350.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7349__7350)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7349__7350)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7355__7356 = x;
    if(G__7355__7356) {
      if(function() {
        var or__3824__auto____7357 = G__7355__7356.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7357) {
          return or__3824__auto____7357
        }else {
          return G__7355__7356.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7355__7356.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7355__7356)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7355__7356)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7361__7362 = x;
  if(G__7361__7362) {
    if(function() {
      var or__3824__auto____7363 = G__7361__7362.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7363) {
        return or__3824__auto____7363
      }else {
        return G__7361__7362.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7361__7362.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7361__7362)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7361__7362)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7367__7368 = x;
  if(G__7367__7368) {
    if(function() {
      var or__3824__auto____7369 = G__7367__7368.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7369) {
        return or__3824__auto____7369
      }else {
        return G__7367__7368.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7367__7368.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7367__7368)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7367__7368)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7373__7374 = x;
  if(G__7373__7374) {
    if(function() {
      var or__3824__auto____7375 = G__7373__7374.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7375) {
        return or__3824__auto____7375
      }else {
        return G__7373__7374.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7373__7374.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7373__7374)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7373__7374)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7379__7380 = x;
  if(G__7379__7380) {
    if(function() {
      var or__3824__auto____7381 = G__7379__7380.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7381) {
        return or__3824__auto____7381
      }else {
        return G__7379__7380.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7379__7380.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7379__7380)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7379__7380)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7385__7386 = x;
  if(G__7385__7386) {
    if(function() {
      var or__3824__auto____7387 = G__7385__7386.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7387) {
        return or__3824__auto____7387
      }else {
        return G__7385__7386.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7385__7386.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7385__7386)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7385__7386)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7391__7392 = x;
    if(G__7391__7392) {
      if(function() {
        var or__3824__auto____7393 = G__7391__7392.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7393) {
          return or__3824__auto____7393
        }else {
          return G__7391__7392.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7391__7392.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7391__7392)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7391__7392)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7397__7398 = x;
  if(G__7397__7398) {
    if(function() {
      var or__3824__auto____7399 = G__7397__7398.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7399) {
        return or__3824__auto____7399
      }else {
        return G__7397__7398.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7397__7398.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7397__7398)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7397__7398)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7403__7404 = x;
  if(G__7403__7404) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7405 = null;
      if(cljs.core.truth_(or__3824__auto____7405)) {
        return or__3824__auto____7405
      }else {
        return G__7403__7404.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7403__7404.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7403__7404)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7403__7404)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7406__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7406 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7406__delegate.call(this, keyvals)
    };
    G__7406.cljs$lang$maxFixedArity = 0;
    G__7406.cljs$lang$applyTo = function(arglist__7407) {
      var keyvals = cljs.core.seq(arglist__7407);
      return G__7406__delegate(keyvals)
    };
    G__7406.cljs$lang$arity$variadic = G__7406__delegate;
    return G__7406
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7409 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7409.push(key)
  });
  return keys__7409
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7413 = i;
  var j__7414 = j;
  var len__7415 = len;
  while(true) {
    if(len__7415 === 0) {
      return to
    }else {
      to[j__7414] = from[i__7413];
      var G__7416 = i__7413 + 1;
      var G__7417 = j__7414 + 1;
      var G__7418 = len__7415 - 1;
      i__7413 = G__7416;
      j__7414 = G__7417;
      len__7415 = G__7418;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7422 = i + (len - 1);
  var j__7423 = j + (len - 1);
  var len__7424 = len;
  while(true) {
    if(len__7424 === 0) {
      return to
    }else {
      to[j__7423] = from[i__7422];
      var G__7425 = i__7422 - 1;
      var G__7426 = j__7423 - 1;
      var G__7427 = len__7424 - 1;
      i__7422 = G__7425;
      j__7423 = G__7426;
      len__7424 = G__7427;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7431__7432 = s;
    if(G__7431__7432) {
      if(function() {
        var or__3824__auto____7433 = G__7431__7432.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7433) {
          return or__3824__auto____7433
        }else {
          return G__7431__7432.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7431__7432.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7431__7432)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7431__7432)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7437__7438 = s;
  if(G__7437__7438) {
    if(function() {
      var or__3824__auto____7439 = G__7437__7438.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7439) {
        return or__3824__auto____7439
      }else {
        return G__7437__7438.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7437__7438.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7437__7438)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7437__7438)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7442 = goog.isString(x);
  if(and__3822__auto____7442) {
    return!function() {
      var or__3824__auto____7443 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7443) {
        return or__3824__auto____7443
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7442
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7445 = goog.isString(x);
  if(and__3822__auto____7445) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7445
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7447 = goog.isString(x);
  if(and__3822__auto____7447) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7447
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7452 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7452) {
    return or__3824__auto____7452
  }else {
    var G__7453__7454 = f;
    if(G__7453__7454) {
      if(function() {
        var or__3824__auto____7455 = G__7453__7454.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7455) {
          return or__3824__auto____7455
        }else {
          return G__7453__7454.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7453__7454.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7453__7454)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7453__7454)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7457 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7457) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7457
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7460 = coll;
    if(cljs.core.truth_(and__3822__auto____7460)) {
      var and__3822__auto____7461 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7461) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7461
      }
    }else {
      return and__3822__auto____7460
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7470__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7466 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7467 = more;
        while(true) {
          var x__7468 = cljs.core.first.call(null, xs__7467);
          var etc__7469 = cljs.core.next.call(null, xs__7467);
          if(cljs.core.truth_(xs__7467)) {
            if(cljs.core.contains_QMARK_.call(null, s__7466, x__7468)) {
              return false
            }else {
              var G__7471 = cljs.core.conj.call(null, s__7466, x__7468);
              var G__7472 = etc__7469;
              s__7466 = G__7471;
              xs__7467 = G__7472;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7470 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7470__delegate.call(this, x, y, more)
    };
    G__7470.cljs$lang$maxFixedArity = 2;
    G__7470.cljs$lang$applyTo = function(arglist__7473) {
      var x = cljs.core.first(arglist__7473);
      var y = cljs.core.first(cljs.core.next(arglist__7473));
      var more = cljs.core.rest(cljs.core.next(arglist__7473));
      return G__7470__delegate(x, y, more)
    };
    G__7470.cljs$lang$arity$variadic = G__7470__delegate;
    return G__7470
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7477__7478 = x;
            if(G__7477__7478) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7479 = null;
                if(cljs.core.truth_(or__3824__auto____7479)) {
                  return or__3824__auto____7479
                }else {
                  return G__7477__7478.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7477__7478.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7477__7478)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7477__7478)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7484 = cljs.core.count.call(null, xs);
    var yl__7485 = cljs.core.count.call(null, ys);
    if(xl__7484 < yl__7485) {
      return-1
    }else {
      if(xl__7484 > yl__7485) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7484, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7486 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7487 = d__7486 === 0;
        if(and__3822__auto____7487) {
          return n + 1 < len
        }else {
          return and__3822__auto____7487
        }
      }()) {
        var G__7488 = xs;
        var G__7489 = ys;
        var G__7490 = len;
        var G__7491 = n + 1;
        xs = G__7488;
        ys = G__7489;
        len = G__7490;
        n = G__7491;
        continue
      }else {
        return d__7486
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7493 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7493)) {
        return r__7493
      }else {
        if(cljs.core.truth_(r__7493)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7495 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7495, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7495)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7501 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7501) {
      var s__7502 = temp__3971__auto____7501;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7502), cljs.core.next.call(null, s__7502))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7503 = val;
    var coll__7504 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7504) {
        var nval__7505 = f.call(null, val__7503, cljs.core.first.call(null, coll__7504));
        if(cljs.core.reduced_QMARK_.call(null, nval__7505)) {
          return cljs.core.deref.call(null, nval__7505)
        }else {
          var G__7506 = nval__7505;
          var G__7507 = cljs.core.next.call(null, coll__7504);
          val__7503 = G__7506;
          coll__7504 = G__7507;
          continue
        }
      }else {
        return val__7503
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7509 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7509);
  return cljs.core.vec.call(null, a__7509)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7516__7517 = coll;
      if(G__7516__7517) {
        if(function() {
          var or__3824__auto____7518 = G__7516__7517.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7518) {
            return or__3824__auto____7518
          }else {
            return G__7516__7517.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7516__7517.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7516__7517)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7516__7517)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7519__7520 = coll;
      if(G__7519__7520) {
        if(function() {
          var or__3824__auto____7521 = G__7519__7520.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7521) {
            return or__3824__auto____7521
          }else {
            return G__7519__7520.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7519__7520.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7519__7520)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7519__7520)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7522 = this;
  return this__7522.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7523__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7523 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7523__delegate.call(this, x, y, more)
    };
    G__7523.cljs$lang$maxFixedArity = 2;
    G__7523.cljs$lang$applyTo = function(arglist__7524) {
      var x = cljs.core.first(arglist__7524);
      var y = cljs.core.first(cljs.core.next(arglist__7524));
      var more = cljs.core.rest(cljs.core.next(arglist__7524));
      return G__7523__delegate(x, y, more)
    };
    G__7523.cljs$lang$arity$variadic = G__7523__delegate;
    return G__7523
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7525__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7525 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7525__delegate.call(this, x, y, more)
    };
    G__7525.cljs$lang$maxFixedArity = 2;
    G__7525.cljs$lang$applyTo = function(arglist__7526) {
      var x = cljs.core.first(arglist__7526);
      var y = cljs.core.first(cljs.core.next(arglist__7526));
      var more = cljs.core.rest(cljs.core.next(arglist__7526));
      return G__7525__delegate(x, y, more)
    };
    G__7525.cljs$lang$arity$variadic = G__7525__delegate;
    return G__7525
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7527__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7527 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7527__delegate.call(this, x, y, more)
    };
    G__7527.cljs$lang$maxFixedArity = 2;
    G__7527.cljs$lang$applyTo = function(arglist__7528) {
      var x = cljs.core.first(arglist__7528);
      var y = cljs.core.first(cljs.core.next(arglist__7528));
      var more = cljs.core.rest(cljs.core.next(arglist__7528));
      return G__7527__delegate(x, y, more)
    };
    G__7527.cljs$lang$arity$variadic = G__7527__delegate;
    return G__7527
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7529__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7529 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7529__delegate.call(this, x, y, more)
    };
    G__7529.cljs$lang$maxFixedArity = 2;
    G__7529.cljs$lang$applyTo = function(arglist__7530) {
      var x = cljs.core.first(arglist__7530);
      var y = cljs.core.first(cljs.core.next(arglist__7530));
      var more = cljs.core.rest(cljs.core.next(arglist__7530));
      return G__7529__delegate(x, y, more)
    };
    G__7529.cljs$lang$arity$variadic = G__7529__delegate;
    return G__7529
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7531__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7532 = y;
            var G__7533 = cljs.core.first.call(null, more);
            var G__7534 = cljs.core.next.call(null, more);
            x = G__7532;
            y = G__7533;
            more = G__7534;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7531 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7531__delegate.call(this, x, y, more)
    };
    G__7531.cljs$lang$maxFixedArity = 2;
    G__7531.cljs$lang$applyTo = function(arglist__7535) {
      var x = cljs.core.first(arglist__7535);
      var y = cljs.core.first(cljs.core.next(arglist__7535));
      var more = cljs.core.rest(cljs.core.next(arglist__7535));
      return G__7531__delegate(x, y, more)
    };
    G__7531.cljs$lang$arity$variadic = G__7531__delegate;
    return G__7531
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7536__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7537 = y;
            var G__7538 = cljs.core.first.call(null, more);
            var G__7539 = cljs.core.next.call(null, more);
            x = G__7537;
            y = G__7538;
            more = G__7539;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7536 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7536__delegate.call(this, x, y, more)
    };
    G__7536.cljs$lang$maxFixedArity = 2;
    G__7536.cljs$lang$applyTo = function(arglist__7540) {
      var x = cljs.core.first(arglist__7540);
      var y = cljs.core.first(cljs.core.next(arglist__7540));
      var more = cljs.core.rest(cljs.core.next(arglist__7540));
      return G__7536__delegate(x, y, more)
    };
    G__7536.cljs$lang$arity$variadic = G__7536__delegate;
    return G__7536
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7541__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7542 = y;
            var G__7543 = cljs.core.first.call(null, more);
            var G__7544 = cljs.core.next.call(null, more);
            x = G__7542;
            y = G__7543;
            more = G__7544;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7541 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7541__delegate.call(this, x, y, more)
    };
    G__7541.cljs$lang$maxFixedArity = 2;
    G__7541.cljs$lang$applyTo = function(arglist__7545) {
      var x = cljs.core.first(arglist__7545);
      var y = cljs.core.first(cljs.core.next(arglist__7545));
      var more = cljs.core.rest(cljs.core.next(arglist__7545));
      return G__7541__delegate(x, y, more)
    };
    G__7541.cljs$lang$arity$variadic = G__7541__delegate;
    return G__7541
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7546__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7547 = y;
            var G__7548 = cljs.core.first.call(null, more);
            var G__7549 = cljs.core.next.call(null, more);
            x = G__7547;
            y = G__7548;
            more = G__7549;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7546 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7546__delegate.call(this, x, y, more)
    };
    G__7546.cljs$lang$maxFixedArity = 2;
    G__7546.cljs$lang$applyTo = function(arglist__7550) {
      var x = cljs.core.first(arglist__7550);
      var y = cljs.core.first(cljs.core.next(arglist__7550));
      var more = cljs.core.rest(cljs.core.next(arglist__7550));
      return G__7546__delegate(x, y, more)
    };
    G__7546.cljs$lang$arity$variadic = G__7546__delegate;
    return G__7546
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7551__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7551 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7551__delegate.call(this, x, y, more)
    };
    G__7551.cljs$lang$maxFixedArity = 2;
    G__7551.cljs$lang$applyTo = function(arglist__7552) {
      var x = cljs.core.first(arglist__7552);
      var y = cljs.core.first(cljs.core.next(arglist__7552));
      var more = cljs.core.rest(cljs.core.next(arglist__7552));
      return G__7551__delegate(x, y, more)
    };
    G__7551.cljs$lang$arity$variadic = G__7551__delegate;
    return G__7551
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7553__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7553 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7553__delegate.call(this, x, y, more)
    };
    G__7553.cljs$lang$maxFixedArity = 2;
    G__7553.cljs$lang$applyTo = function(arglist__7554) {
      var x = cljs.core.first(arglist__7554);
      var y = cljs.core.first(cljs.core.next(arglist__7554));
      var more = cljs.core.rest(cljs.core.next(arglist__7554));
      return G__7553__delegate(x, y, more)
    };
    G__7553.cljs$lang$arity$variadic = G__7553__delegate;
    return G__7553
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7556 = n % d;
  return cljs.core.fix.call(null, (n - rem__7556) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7558 = cljs.core.quot.call(null, n, d);
  return n - d * q__7558
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7561 = v - (v >> 1 & 1431655765);
  var v__7562 = (v__7561 & 858993459) + (v__7561 >> 2 & 858993459);
  return(v__7562 + (v__7562 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7563__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7564 = y;
            var G__7565 = cljs.core.first.call(null, more);
            var G__7566 = cljs.core.next.call(null, more);
            x = G__7564;
            y = G__7565;
            more = G__7566;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7563 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7563__delegate.call(this, x, y, more)
    };
    G__7563.cljs$lang$maxFixedArity = 2;
    G__7563.cljs$lang$applyTo = function(arglist__7567) {
      var x = cljs.core.first(arglist__7567);
      var y = cljs.core.first(cljs.core.next(arglist__7567));
      var more = cljs.core.rest(cljs.core.next(arglist__7567));
      return G__7563__delegate(x, y, more)
    };
    G__7563.cljs$lang$arity$variadic = G__7563__delegate;
    return G__7563
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7571 = n;
  var xs__7572 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7573 = xs__7572;
      if(and__3822__auto____7573) {
        return n__7571 > 0
      }else {
        return and__3822__auto____7573
      }
    }())) {
      var G__7574 = n__7571 - 1;
      var G__7575 = cljs.core.next.call(null, xs__7572);
      n__7571 = G__7574;
      xs__7572 = G__7575;
      continue
    }else {
      return xs__7572
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7576__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7577 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7578 = cljs.core.next.call(null, more);
            sb = G__7577;
            more = G__7578;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7576 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7576__delegate.call(this, x, ys)
    };
    G__7576.cljs$lang$maxFixedArity = 1;
    G__7576.cljs$lang$applyTo = function(arglist__7579) {
      var x = cljs.core.first(arglist__7579);
      var ys = cljs.core.rest(arglist__7579);
      return G__7576__delegate(x, ys)
    };
    G__7576.cljs$lang$arity$variadic = G__7576__delegate;
    return G__7576
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7580__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7581 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7582 = cljs.core.next.call(null, more);
            sb = G__7581;
            more = G__7582;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7580 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7580__delegate.call(this, x, ys)
    };
    G__7580.cljs$lang$maxFixedArity = 1;
    G__7580.cljs$lang$applyTo = function(arglist__7583) {
      var x = cljs.core.first(arglist__7583);
      var ys = cljs.core.rest(arglist__7583);
      return G__7580__delegate(x, ys)
    };
    G__7580.cljs$lang$arity$variadic = G__7580__delegate;
    return G__7580
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7584) {
    var fmt = cljs.core.first(arglist__7584);
    var args = cljs.core.rest(arglist__7584);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7587 = cljs.core.seq.call(null, x);
    var ys__7588 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7587 == null) {
        return ys__7588 == null
      }else {
        if(ys__7588 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7587), cljs.core.first.call(null, ys__7588))) {
            var G__7589 = cljs.core.next.call(null, xs__7587);
            var G__7590 = cljs.core.next.call(null, ys__7588);
            xs__7587 = G__7589;
            ys__7588 = G__7590;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7591_SHARP_, p2__7592_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7591_SHARP_, cljs.core.hash.call(null, p2__7592_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7596 = 0;
  var s__7597 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7597) {
      var e__7598 = cljs.core.first.call(null, s__7597);
      var G__7599 = (h__7596 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7598)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7598)))) % 4503599627370496;
      var G__7600 = cljs.core.next.call(null, s__7597);
      h__7596 = G__7599;
      s__7597 = G__7600;
      continue
    }else {
      return h__7596
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7604 = 0;
  var s__7605 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7605) {
      var e__7606 = cljs.core.first.call(null, s__7605);
      var G__7607 = (h__7604 + cljs.core.hash.call(null, e__7606)) % 4503599627370496;
      var G__7608 = cljs.core.next.call(null, s__7605);
      h__7604 = G__7607;
      s__7605 = G__7608;
      continue
    }else {
      return h__7604
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7629__7630 = cljs.core.seq.call(null, fn_map);
  if(G__7629__7630) {
    var G__7632__7634 = cljs.core.first.call(null, G__7629__7630);
    var vec__7633__7635 = G__7632__7634;
    var key_name__7636 = cljs.core.nth.call(null, vec__7633__7635, 0, null);
    var f__7637 = cljs.core.nth.call(null, vec__7633__7635, 1, null);
    var G__7629__7638 = G__7629__7630;
    var G__7632__7639 = G__7632__7634;
    var G__7629__7640 = G__7629__7638;
    while(true) {
      var vec__7641__7642 = G__7632__7639;
      var key_name__7643 = cljs.core.nth.call(null, vec__7641__7642, 0, null);
      var f__7644 = cljs.core.nth.call(null, vec__7641__7642, 1, null);
      var G__7629__7645 = G__7629__7640;
      var str_name__7646 = cljs.core.name.call(null, key_name__7643);
      obj[str_name__7646] = f__7644;
      var temp__3974__auto____7647 = cljs.core.next.call(null, G__7629__7645);
      if(temp__3974__auto____7647) {
        var G__7629__7648 = temp__3974__auto____7647;
        var G__7649 = cljs.core.first.call(null, G__7629__7648);
        var G__7650 = G__7629__7648;
        G__7632__7639 = G__7649;
        G__7629__7640 = G__7650;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7651 = this;
  var h__2190__auto____7652 = this__7651.__hash;
  if(!(h__2190__auto____7652 == null)) {
    return h__2190__auto____7652
  }else {
    var h__2190__auto____7653 = cljs.core.hash_coll.call(null, coll);
    this__7651.__hash = h__2190__auto____7653;
    return h__2190__auto____7653
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7654 = this;
  if(this__7654.count === 1) {
    return null
  }else {
    return this__7654.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7655 = this;
  return new cljs.core.List(this__7655.meta, o, coll, this__7655.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7656 = this;
  var this__7657 = this;
  return cljs.core.pr_str.call(null, this__7657)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7658 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7659 = this;
  return this__7659.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7660 = this;
  return this__7660.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7661 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7662 = this;
  return this__7662.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7663 = this;
  if(this__7663.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7663.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7664 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7665 = this;
  return new cljs.core.List(meta, this__7665.first, this__7665.rest, this__7665.count, this__7665.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7666 = this;
  return this__7666.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7667 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7668 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7669 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7670 = this;
  return new cljs.core.List(this__7670.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7671 = this;
  var this__7672 = this;
  return cljs.core.pr_str.call(null, this__7672)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7673 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7674 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7675 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7676 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7677 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7678 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7679 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7680 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7681 = this;
  return this__7681.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7682 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7686__7687 = coll;
  if(G__7686__7687) {
    if(function() {
      var or__3824__auto____7688 = G__7686__7687.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7688) {
        return or__3824__auto____7688
      }else {
        return G__7686__7687.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7686__7687.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7686__7687)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7686__7687)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7689__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7689 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7689__delegate.call(this, x, y, z, items)
    };
    G__7689.cljs$lang$maxFixedArity = 3;
    G__7689.cljs$lang$applyTo = function(arglist__7690) {
      var x = cljs.core.first(arglist__7690);
      var y = cljs.core.first(cljs.core.next(arglist__7690));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7690)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7690)));
      return G__7689__delegate(x, y, z, items)
    };
    G__7689.cljs$lang$arity$variadic = G__7689__delegate;
    return G__7689
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7691 = this;
  var h__2190__auto____7692 = this__7691.__hash;
  if(!(h__2190__auto____7692 == null)) {
    return h__2190__auto____7692
  }else {
    var h__2190__auto____7693 = cljs.core.hash_coll.call(null, coll);
    this__7691.__hash = h__2190__auto____7693;
    return h__2190__auto____7693
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7694 = this;
  if(this__7694.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7694.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7695 = this;
  return new cljs.core.Cons(null, o, coll, this__7695.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7696 = this;
  var this__7697 = this;
  return cljs.core.pr_str.call(null, this__7697)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7698 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7699 = this;
  return this__7699.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7700 = this;
  if(this__7700.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7700.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7701 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7702 = this;
  return new cljs.core.Cons(meta, this__7702.first, this__7702.rest, this__7702.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7703 = this;
  return this__7703.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7704 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7704.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7709 = coll == null;
    if(or__3824__auto____7709) {
      return or__3824__auto____7709
    }else {
      var G__7710__7711 = coll;
      if(G__7710__7711) {
        if(function() {
          var or__3824__auto____7712 = G__7710__7711.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7712) {
            return or__3824__auto____7712
          }else {
            return G__7710__7711.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7710__7711.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7710__7711)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7710__7711)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7716__7717 = x;
  if(G__7716__7717) {
    if(function() {
      var or__3824__auto____7718 = G__7716__7717.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7718) {
        return or__3824__auto____7718
      }else {
        return G__7716__7717.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7716__7717.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7716__7717)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7716__7717)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7719 = null;
  var G__7719__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7719__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7719 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7719__2.call(this, string, f);
      case 3:
        return G__7719__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7719
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7720 = null;
  var G__7720__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7720__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7720 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7720__2.call(this, string, k);
      case 3:
        return G__7720__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7720
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7721 = null;
  var G__7721__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7721__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7721 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7721__2.call(this, string, n);
      case 3:
        return G__7721__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7721
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7733 = null;
  var G__7733__2 = function(this_sym7724, coll) {
    var this__7726 = this;
    var this_sym7724__7727 = this;
    var ___7728 = this_sym7724__7727;
    if(coll == null) {
      return null
    }else {
      var strobj__7729 = coll.strobj;
      if(strobj__7729 == null) {
        return cljs.core._lookup.call(null, coll, this__7726.k, null)
      }else {
        return strobj__7729[this__7726.k]
      }
    }
  };
  var G__7733__3 = function(this_sym7725, coll, not_found) {
    var this__7726 = this;
    var this_sym7725__7730 = this;
    var ___7731 = this_sym7725__7730;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7726.k, not_found)
    }
  };
  G__7733 = function(this_sym7725, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7733__2.call(this, this_sym7725, coll);
      case 3:
        return G__7733__3.call(this, this_sym7725, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7733
}();
cljs.core.Keyword.prototype.apply = function(this_sym7722, args7723) {
  var this__7732 = this;
  return this_sym7722.call.apply(this_sym7722, [this_sym7722].concat(args7723.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7742 = null;
  var G__7742__2 = function(this_sym7736, coll) {
    var this_sym7736__7738 = this;
    var this__7739 = this_sym7736__7738;
    return cljs.core._lookup.call(null, coll, this__7739.toString(), null)
  };
  var G__7742__3 = function(this_sym7737, coll, not_found) {
    var this_sym7737__7740 = this;
    var this__7741 = this_sym7737__7740;
    return cljs.core._lookup.call(null, coll, this__7741.toString(), not_found)
  };
  G__7742 = function(this_sym7737, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7742__2.call(this, this_sym7737, coll);
      case 3:
        return G__7742__3.call(this, this_sym7737, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7742
}();
String.prototype.apply = function(this_sym7734, args7735) {
  return this_sym7734.call.apply(this_sym7734, [this_sym7734].concat(args7735.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7744 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7744
  }else {
    lazy_seq.x = x__7744.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7745 = this;
  var h__2190__auto____7746 = this__7745.__hash;
  if(!(h__2190__auto____7746 == null)) {
    return h__2190__auto____7746
  }else {
    var h__2190__auto____7747 = cljs.core.hash_coll.call(null, coll);
    this__7745.__hash = h__2190__auto____7747;
    return h__2190__auto____7747
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7748 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7749 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7750 = this;
  var this__7751 = this;
  return cljs.core.pr_str.call(null, this__7751)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7752 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7753 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7754 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7755 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7756 = this;
  return new cljs.core.LazySeq(meta, this__7756.realized, this__7756.x, this__7756.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7757 = this;
  return this__7757.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7758 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7758.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7759 = this;
  return this__7759.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7760 = this;
  var ___7761 = this;
  this__7760.buf[this__7760.end] = o;
  return this__7760.end = this__7760.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7762 = this;
  var ___7763 = this;
  var ret__7764 = new cljs.core.ArrayChunk(this__7762.buf, 0, this__7762.end);
  this__7762.buf = null;
  return ret__7764
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7765 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7765.arr[this__7765.off], this__7765.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7766 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7766.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7767 = this;
  if(this__7767.off === this__7767.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7767.arr, this__7767.off + 1, this__7767.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7768 = this;
  return this__7768.arr[this__7768.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7769 = this;
  if(function() {
    var and__3822__auto____7770 = i >= 0;
    if(and__3822__auto____7770) {
      return i < this__7769.end - this__7769.off
    }else {
      return and__3822__auto____7770
    }
  }()) {
    return this__7769.arr[this__7769.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7771 = this;
  return this__7771.end - this__7771.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7772 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7773 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7774 = this;
  return cljs.core._nth.call(null, this__7774.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7775 = this;
  if(cljs.core._count.call(null, this__7775.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7775.chunk), this__7775.more, this__7775.meta)
  }else {
    if(this__7775.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7775.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7776 = this;
  if(this__7776.more == null) {
    return null
  }else {
    return this__7776.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7777 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7778 = this;
  return new cljs.core.ChunkedCons(this__7778.chunk, this__7778.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7779 = this;
  return this__7779.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7780 = this;
  return this__7780.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7781 = this;
  if(this__7781.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7781.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7785__7786 = s;
    if(G__7785__7786) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7787 = null;
        if(cljs.core.truth_(or__3824__auto____7787)) {
          return or__3824__auto____7787
        }else {
          return G__7785__7786.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7785__7786.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7785__7786)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7785__7786)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7790 = [];
  var s__7791 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7791)) {
      ary__7790.push(cljs.core.first.call(null, s__7791));
      var G__7792 = cljs.core.next.call(null, s__7791);
      s__7791 = G__7792;
      continue
    }else {
      return ary__7790
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7796 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7797 = 0;
  var xs__7798 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7798) {
      ret__7796[i__7797] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7798));
      var G__7799 = i__7797 + 1;
      var G__7800 = cljs.core.next.call(null, xs__7798);
      i__7797 = G__7799;
      xs__7798 = G__7800;
      continue
    }else {
    }
    break
  }
  return ret__7796
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7808 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7809 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7810 = 0;
      var s__7811 = s__7809;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7812 = s__7811;
          if(and__3822__auto____7812) {
            return i__7810 < size
          }else {
            return and__3822__auto____7812
          }
        }())) {
          a__7808[i__7810] = cljs.core.first.call(null, s__7811);
          var G__7815 = i__7810 + 1;
          var G__7816 = cljs.core.next.call(null, s__7811);
          i__7810 = G__7815;
          s__7811 = G__7816;
          continue
        }else {
          return a__7808
        }
        break
      }
    }else {
      var n__2525__auto____7813 = size;
      var i__7814 = 0;
      while(true) {
        if(i__7814 < n__2525__auto____7813) {
          a__7808[i__7814] = init_val_or_seq;
          var G__7817 = i__7814 + 1;
          i__7814 = G__7817;
          continue
        }else {
        }
        break
      }
      return a__7808
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7825 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7826 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7827 = 0;
      var s__7828 = s__7826;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7829 = s__7828;
          if(and__3822__auto____7829) {
            return i__7827 < size
          }else {
            return and__3822__auto____7829
          }
        }())) {
          a__7825[i__7827] = cljs.core.first.call(null, s__7828);
          var G__7832 = i__7827 + 1;
          var G__7833 = cljs.core.next.call(null, s__7828);
          i__7827 = G__7832;
          s__7828 = G__7833;
          continue
        }else {
          return a__7825
        }
        break
      }
    }else {
      var n__2525__auto____7830 = size;
      var i__7831 = 0;
      while(true) {
        if(i__7831 < n__2525__auto____7830) {
          a__7825[i__7831] = init_val_or_seq;
          var G__7834 = i__7831 + 1;
          i__7831 = G__7834;
          continue
        }else {
        }
        break
      }
      return a__7825
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7842 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7843 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7844 = 0;
      var s__7845 = s__7843;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7846 = s__7845;
          if(and__3822__auto____7846) {
            return i__7844 < size
          }else {
            return and__3822__auto____7846
          }
        }())) {
          a__7842[i__7844] = cljs.core.first.call(null, s__7845);
          var G__7849 = i__7844 + 1;
          var G__7850 = cljs.core.next.call(null, s__7845);
          i__7844 = G__7849;
          s__7845 = G__7850;
          continue
        }else {
          return a__7842
        }
        break
      }
    }else {
      var n__2525__auto____7847 = size;
      var i__7848 = 0;
      while(true) {
        if(i__7848 < n__2525__auto____7847) {
          a__7842[i__7848] = init_val_or_seq;
          var G__7851 = i__7848 + 1;
          i__7848 = G__7851;
          continue
        }else {
        }
        break
      }
      return a__7842
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7856 = s;
    var i__7857 = n;
    var sum__7858 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7859 = i__7857 > 0;
        if(and__3822__auto____7859) {
          return cljs.core.seq.call(null, s__7856)
        }else {
          return and__3822__auto____7859
        }
      }())) {
        var G__7860 = cljs.core.next.call(null, s__7856);
        var G__7861 = i__7857 - 1;
        var G__7862 = sum__7858 + 1;
        s__7856 = G__7860;
        i__7857 = G__7861;
        sum__7858 = G__7862;
        continue
      }else {
        return sum__7858
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7867 = cljs.core.seq.call(null, x);
      if(s__7867) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7867)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7867), concat.call(null, cljs.core.chunk_rest.call(null, s__7867), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7867), concat.call(null, cljs.core.rest.call(null, s__7867), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7871__delegate = function(x, y, zs) {
      var cat__7870 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7869 = cljs.core.seq.call(null, xys);
          if(xys__7869) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7869)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7869), cat.call(null, cljs.core.chunk_rest.call(null, xys__7869), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7869), cat.call(null, cljs.core.rest.call(null, xys__7869), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7870.call(null, concat.call(null, x, y), zs)
    };
    var G__7871 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7871__delegate.call(this, x, y, zs)
    };
    G__7871.cljs$lang$maxFixedArity = 2;
    G__7871.cljs$lang$applyTo = function(arglist__7872) {
      var x = cljs.core.first(arglist__7872);
      var y = cljs.core.first(cljs.core.next(arglist__7872));
      var zs = cljs.core.rest(cljs.core.next(arglist__7872));
      return G__7871__delegate(x, y, zs)
    };
    G__7871.cljs$lang$arity$variadic = G__7871__delegate;
    return G__7871
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7873__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7873 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7873__delegate.call(this, a, b, c, d, more)
    };
    G__7873.cljs$lang$maxFixedArity = 4;
    G__7873.cljs$lang$applyTo = function(arglist__7874) {
      var a = cljs.core.first(arglist__7874);
      var b = cljs.core.first(cljs.core.next(arglist__7874));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7874)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7874))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7874))));
      return G__7873__delegate(a, b, c, d, more)
    };
    G__7873.cljs$lang$arity$variadic = G__7873__delegate;
    return G__7873
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7916 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7917 = cljs.core._first.call(null, args__7916);
    var args__7918 = cljs.core._rest.call(null, args__7916);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7917)
      }else {
        return f.call(null, a__7917)
      }
    }else {
      var b__7919 = cljs.core._first.call(null, args__7918);
      var args__7920 = cljs.core._rest.call(null, args__7918);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7917, b__7919)
        }else {
          return f.call(null, a__7917, b__7919)
        }
      }else {
        var c__7921 = cljs.core._first.call(null, args__7920);
        var args__7922 = cljs.core._rest.call(null, args__7920);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7917, b__7919, c__7921)
          }else {
            return f.call(null, a__7917, b__7919, c__7921)
          }
        }else {
          var d__7923 = cljs.core._first.call(null, args__7922);
          var args__7924 = cljs.core._rest.call(null, args__7922);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7917, b__7919, c__7921, d__7923)
            }else {
              return f.call(null, a__7917, b__7919, c__7921, d__7923)
            }
          }else {
            var e__7925 = cljs.core._first.call(null, args__7924);
            var args__7926 = cljs.core._rest.call(null, args__7924);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7917, b__7919, c__7921, d__7923, e__7925)
              }else {
                return f.call(null, a__7917, b__7919, c__7921, d__7923, e__7925)
              }
            }else {
              var f__7927 = cljs.core._first.call(null, args__7926);
              var args__7928 = cljs.core._rest.call(null, args__7926);
              if(argc === 6) {
                if(f__7927.cljs$lang$arity$6) {
                  return f__7927.cljs$lang$arity$6(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927)
                }else {
                  return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927)
                }
              }else {
                var g__7929 = cljs.core._first.call(null, args__7928);
                var args__7930 = cljs.core._rest.call(null, args__7928);
                if(argc === 7) {
                  if(f__7927.cljs$lang$arity$7) {
                    return f__7927.cljs$lang$arity$7(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929)
                  }else {
                    return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929)
                  }
                }else {
                  var h__7931 = cljs.core._first.call(null, args__7930);
                  var args__7932 = cljs.core._rest.call(null, args__7930);
                  if(argc === 8) {
                    if(f__7927.cljs$lang$arity$8) {
                      return f__7927.cljs$lang$arity$8(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931)
                    }else {
                      return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931)
                    }
                  }else {
                    var i__7933 = cljs.core._first.call(null, args__7932);
                    var args__7934 = cljs.core._rest.call(null, args__7932);
                    if(argc === 9) {
                      if(f__7927.cljs$lang$arity$9) {
                        return f__7927.cljs$lang$arity$9(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933)
                      }else {
                        return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933)
                      }
                    }else {
                      var j__7935 = cljs.core._first.call(null, args__7934);
                      var args__7936 = cljs.core._rest.call(null, args__7934);
                      if(argc === 10) {
                        if(f__7927.cljs$lang$arity$10) {
                          return f__7927.cljs$lang$arity$10(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935)
                        }else {
                          return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935)
                        }
                      }else {
                        var k__7937 = cljs.core._first.call(null, args__7936);
                        var args__7938 = cljs.core._rest.call(null, args__7936);
                        if(argc === 11) {
                          if(f__7927.cljs$lang$arity$11) {
                            return f__7927.cljs$lang$arity$11(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937)
                          }else {
                            return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937)
                          }
                        }else {
                          var l__7939 = cljs.core._first.call(null, args__7938);
                          var args__7940 = cljs.core._rest.call(null, args__7938);
                          if(argc === 12) {
                            if(f__7927.cljs$lang$arity$12) {
                              return f__7927.cljs$lang$arity$12(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939)
                            }else {
                              return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939)
                            }
                          }else {
                            var m__7941 = cljs.core._first.call(null, args__7940);
                            var args__7942 = cljs.core._rest.call(null, args__7940);
                            if(argc === 13) {
                              if(f__7927.cljs$lang$arity$13) {
                                return f__7927.cljs$lang$arity$13(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941)
                              }else {
                                return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941)
                              }
                            }else {
                              var n__7943 = cljs.core._first.call(null, args__7942);
                              var args__7944 = cljs.core._rest.call(null, args__7942);
                              if(argc === 14) {
                                if(f__7927.cljs$lang$arity$14) {
                                  return f__7927.cljs$lang$arity$14(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943)
                                }else {
                                  return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943)
                                }
                              }else {
                                var o__7945 = cljs.core._first.call(null, args__7944);
                                var args__7946 = cljs.core._rest.call(null, args__7944);
                                if(argc === 15) {
                                  if(f__7927.cljs$lang$arity$15) {
                                    return f__7927.cljs$lang$arity$15(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945)
                                  }else {
                                    return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945)
                                  }
                                }else {
                                  var p__7947 = cljs.core._first.call(null, args__7946);
                                  var args__7948 = cljs.core._rest.call(null, args__7946);
                                  if(argc === 16) {
                                    if(f__7927.cljs$lang$arity$16) {
                                      return f__7927.cljs$lang$arity$16(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947)
                                    }else {
                                      return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947)
                                    }
                                  }else {
                                    var q__7949 = cljs.core._first.call(null, args__7948);
                                    var args__7950 = cljs.core._rest.call(null, args__7948);
                                    if(argc === 17) {
                                      if(f__7927.cljs$lang$arity$17) {
                                        return f__7927.cljs$lang$arity$17(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947, q__7949)
                                      }else {
                                        return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947, q__7949)
                                      }
                                    }else {
                                      var r__7951 = cljs.core._first.call(null, args__7950);
                                      var args__7952 = cljs.core._rest.call(null, args__7950);
                                      if(argc === 18) {
                                        if(f__7927.cljs$lang$arity$18) {
                                          return f__7927.cljs$lang$arity$18(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947, q__7949, r__7951)
                                        }else {
                                          return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947, q__7949, r__7951)
                                        }
                                      }else {
                                        var s__7953 = cljs.core._first.call(null, args__7952);
                                        var args__7954 = cljs.core._rest.call(null, args__7952);
                                        if(argc === 19) {
                                          if(f__7927.cljs$lang$arity$19) {
                                            return f__7927.cljs$lang$arity$19(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947, q__7949, r__7951, s__7953)
                                          }else {
                                            return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947, q__7949, r__7951, s__7953)
                                          }
                                        }else {
                                          var t__7955 = cljs.core._first.call(null, args__7954);
                                          var args__7956 = cljs.core._rest.call(null, args__7954);
                                          if(argc === 20) {
                                            if(f__7927.cljs$lang$arity$20) {
                                              return f__7927.cljs$lang$arity$20(a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947, q__7949, r__7951, s__7953, t__7955)
                                            }else {
                                              return f__7927.call(null, a__7917, b__7919, c__7921, d__7923, e__7925, f__7927, g__7929, h__7931, i__7933, j__7935, k__7937, l__7939, m__7941, n__7943, o__7945, p__7947, q__7949, r__7951, s__7953, t__7955)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7971 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7972 = cljs.core.bounded_count.call(null, args, fixed_arity__7971 + 1);
      if(bc__7972 <= fixed_arity__7971) {
        return cljs.core.apply_to.call(null, f, bc__7972, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7973 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7974 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7975 = cljs.core.bounded_count.call(null, arglist__7973, fixed_arity__7974 + 1);
      if(bc__7975 <= fixed_arity__7974) {
        return cljs.core.apply_to.call(null, f, bc__7975, arglist__7973)
      }else {
        return f.cljs$lang$applyTo(arglist__7973)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7973))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7976 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7977 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7978 = cljs.core.bounded_count.call(null, arglist__7976, fixed_arity__7977 + 1);
      if(bc__7978 <= fixed_arity__7977) {
        return cljs.core.apply_to.call(null, f, bc__7978, arglist__7976)
      }else {
        return f.cljs$lang$applyTo(arglist__7976)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7976))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7979 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7980 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7981 = cljs.core.bounded_count.call(null, arglist__7979, fixed_arity__7980 + 1);
      if(bc__7981 <= fixed_arity__7980) {
        return cljs.core.apply_to.call(null, f, bc__7981, arglist__7979)
      }else {
        return f.cljs$lang$applyTo(arglist__7979)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7979))
    }
  };
  var apply__6 = function() {
    var G__7985__delegate = function(f, a, b, c, d, args) {
      var arglist__7982 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7983 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7984 = cljs.core.bounded_count.call(null, arglist__7982, fixed_arity__7983 + 1);
        if(bc__7984 <= fixed_arity__7983) {
          return cljs.core.apply_to.call(null, f, bc__7984, arglist__7982)
        }else {
          return f.cljs$lang$applyTo(arglist__7982)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7982))
      }
    };
    var G__7985 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7985__delegate.call(this, f, a, b, c, d, args)
    };
    G__7985.cljs$lang$maxFixedArity = 5;
    G__7985.cljs$lang$applyTo = function(arglist__7986) {
      var f = cljs.core.first(arglist__7986);
      var a = cljs.core.first(cljs.core.next(arglist__7986));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7986)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7986))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7986)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7986)))));
      return G__7985__delegate(f, a, b, c, d, args)
    };
    G__7985.cljs$lang$arity$variadic = G__7985__delegate;
    return G__7985
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7987) {
    var obj = cljs.core.first(arglist__7987);
    var f = cljs.core.first(cljs.core.next(arglist__7987));
    var args = cljs.core.rest(cljs.core.next(arglist__7987));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7988__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7988 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7988__delegate.call(this, x, y, more)
    };
    G__7988.cljs$lang$maxFixedArity = 2;
    G__7988.cljs$lang$applyTo = function(arglist__7989) {
      var x = cljs.core.first(arglist__7989);
      var y = cljs.core.first(cljs.core.next(arglist__7989));
      var more = cljs.core.rest(cljs.core.next(arglist__7989));
      return G__7988__delegate(x, y, more)
    };
    G__7988.cljs$lang$arity$variadic = G__7988__delegate;
    return G__7988
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7990 = pred;
        var G__7991 = cljs.core.next.call(null, coll);
        pred = G__7990;
        coll = G__7991;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____7993 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7993)) {
        return or__3824__auto____7993
      }else {
        var G__7994 = pred;
        var G__7995 = cljs.core.next.call(null, coll);
        pred = G__7994;
        coll = G__7995;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7996 = null;
    var G__7996__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7996__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7996__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7996__3 = function() {
      var G__7997__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7997 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7997__delegate.call(this, x, y, zs)
      };
      G__7997.cljs$lang$maxFixedArity = 2;
      G__7997.cljs$lang$applyTo = function(arglist__7998) {
        var x = cljs.core.first(arglist__7998);
        var y = cljs.core.first(cljs.core.next(arglist__7998));
        var zs = cljs.core.rest(cljs.core.next(arglist__7998));
        return G__7997__delegate(x, y, zs)
      };
      G__7997.cljs$lang$arity$variadic = G__7997__delegate;
      return G__7997
    }();
    G__7996 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7996__0.call(this);
        case 1:
          return G__7996__1.call(this, x);
        case 2:
          return G__7996__2.call(this, x, y);
        default:
          return G__7996__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7996.cljs$lang$maxFixedArity = 2;
    G__7996.cljs$lang$applyTo = G__7996__3.cljs$lang$applyTo;
    return G__7996
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7999__delegate = function(args) {
      return x
    };
    var G__7999 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7999__delegate.call(this, args)
    };
    G__7999.cljs$lang$maxFixedArity = 0;
    G__7999.cljs$lang$applyTo = function(arglist__8000) {
      var args = cljs.core.seq(arglist__8000);
      return G__7999__delegate(args)
    };
    G__7999.cljs$lang$arity$variadic = G__7999__delegate;
    return G__7999
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__8007 = null;
      var G__8007__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8007__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8007__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8007__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8007__4 = function() {
        var G__8008__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8008 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8008__delegate.call(this, x, y, z, args)
        };
        G__8008.cljs$lang$maxFixedArity = 3;
        G__8008.cljs$lang$applyTo = function(arglist__8009) {
          var x = cljs.core.first(arglist__8009);
          var y = cljs.core.first(cljs.core.next(arglist__8009));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8009)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8009)));
          return G__8008__delegate(x, y, z, args)
        };
        G__8008.cljs$lang$arity$variadic = G__8008__delegate;
        return G__8008
      }();
      G__8007 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8007__0.call(this);
          case 1:
            return G__8007__1.call(this, x);
          case 2:
            return G__8007__2.call(this, x, y);
          case 3:
            return G__8007__3.call(this, x, y, z);
          default:
            return G__8007__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8007.cljs$lang$maxFixedArity = 3;
      G__8007.cljs$lang$applyTo = G__8007__4.cljs$lang$applyTo;
      return G__8007
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8010 = null;
      var G__8010__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8010__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8010__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8010__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8010__4 = function() {
        var G__8011__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8011 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8011__delegate.call(this, x, y, z, args)
        };
        G__8011.cljs$lang$maxFixedArity = 3;
        G__8011.cljs$lang$applyTo = function(arglist__8012) {
          var x = cljs.core.first(arglist__8012);
          var y = cljs.core.first(cljs.core.next(arglist__8012));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8012)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8012)));
          return G__8011__delegate(x, y, z, args)
        };
        G__8011.cljs$lang$arity$variadic = G__8011__delegate;
        return G__8011
      }();
      G__8010 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8010__0.call(this);
          case 1:
            return G__8010__1.call(this, x);
          case 2:
            return G__8010__2.call(this, x, y);
          case 3:
            return G__8010__3.call(this, x, y, z);
          default:
            return G__8010__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8010.cljs$lang$maxFixedArity = 3;
      G__8010.cljs$lang$applyTo = G__8010__4.cljs$lang$applyTo;
      return G__8010
    }()
  };
  var comp__4 = function() {
    var G__8013__delegate = function(f1, f2, f3, fs) {
      var fs__8004 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8014__delegate = function(args) {
          var ret__8005 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8004), args);
          var fs__8006 = cljs.core.next.call(null, fs__8004);
          while(true) {
            if(fs__8006) {
              var G__8015 = cljs.core.first.call(null, fs__8006).call(null, ret__8005);
              var G__8016 = cljs.core.next.call(null, fs__8006);
              ret__8005 = G__8015;
              fs__8006 = G__8016;
              continue
            }else {
              return ret__8005
            }
            break
          }
        };
        var G__8014 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8014__delegate.call(this, args)
        };
        G__8014.cljs$lang$maxFixedArity = 0;
        G__8014.cljs$lang$applyTo = function(arglist__8017) {
          var args = cljs.core.seq(arglist__8017);
          return G__8014__delegate(args)
        };
        G__8014.cljs$lang$arity$variadic = G__8014__delegate;
        return G__8014
      }()
    };
    var G__8013 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8013__delegate.call(this, f1, f2, f3, fs)
    };
    G__8013.cljs$lang$maxFixedArity = 3;
    G__8013.cljs$lang$applyTo = function(arglist__8018) {
      var f1 = cljs.core.first(arglist__8018);
      var f2 = cljs.core.first(cljs.core.next(arglist__8018));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8018)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8018)));
      return G__8013__delegate(f1, f2, f3, fs)
    };
    G__8013.cljs$lang$arity$variadic = G__8013__delegate;
    return G__8013
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__8019__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8019 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8019__delegate.call(this, args)
      };
      G__8019.cljs$lang$maxFixedArity = 0;
      G__8019.cljs$lang$applyTo = function(arglist__8020) {
        var args = cljs.core.seq(arglist__8020);
        return G__8019__delegate(args)
      };
      G__8019.cljs$lang$arity$variadic = G__8019__delegate;
      return G__8019
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8021__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8021 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8021__delegate.call(this, args)
      };
      G__8021.cljs$lang$maxFixedArity = 0;
      G__8021.cljs$lang$applyTo = function(arglist__8022) {
        var args = cljs.core.seq(arglist__8022);
        return G__8021__delegate(args)
      };
      G__8021.cljs$lang$arity$variadic = G__8021__delegate;
      return G__8021
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8023__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8023 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8023__delegate.call(this, args)
      };
      G__8023.cljs$lang$maxFixedArity = 0;
      G__8023.cljs$lang$applyTo = function(arglist__8024) {
        var args = cljs.core.seq(arglist__8024);
        return G__8023__delegate(args)
      };
      G__8023.cljs$lang$arity$variadic = G__8023__delegate;
      return G__8023
    }()
  };
  var partial__5 = function() {
    var G__8025__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8026__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8026 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8026__delegate.call(this, args)
        };
        G__8026.cljs$lang$maxFixedArity = 0;
        G__8026.cljs$lang$applyTo = function(arglist__8027) {
          var args = cljs.core.seq(arglist__8027);
          return G__8026__delegate(args)
        };
        G__8026.cljs$lang$arity$variadic = G__8026__delegate;
        return G__8026
      }()
    };
    var G__8025 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8025__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8025.cljs$lang$maxFixedArity = 4;
    G__8025.cljs$lang$applyTo = function(arglist__8028) {
      var f = cljs.core.first(arglist__8028);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8028));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8028)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8028))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8028))));
      return G__8025__delegate(f, arg1, arg2, arg3, more)
    };
    G__8025.cljs$lang$arity$variadic = G__8025__delegate;
    return G__8025
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__8029 = null;
      var G__8029__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8029__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8029__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8029__4 = function() {
        var G__8030__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8030 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8030__delegate.call(this, a, b, c, ds)
        };
        G__8030.cljs$lang$maxFixedArity = 3;
        G__8030.cljs$lang$applyTo = function(arglist__8031) {
          var a = cljs.core.first(arglist__8031);
          var b = cljs.core.first(cljs.core.next(arglist__8031));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8031)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8031)));
          return G__8030__delegate(a, b, c, ds)
        };
        G__8030.cljs$lang$arity$variadic = G__8030__delegate;
        return G__8030
      }();
      G__8029 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8029__1.call(this, a);
          case 2:
            return G__8029__2.call(this, a, b);
          case 3:
            return G__8029__3.call(this, a, b, c);
          default:
            return G__8029__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8029.cljs$lang$maxFixedArity = 3;
      G__8029.cljs$lang$applyTo = G__8029__4.cljs$lang$applyTo;
      return G__8029
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8032 = null;
      var G__8032__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8032__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8032__4 = function() {
        var G__8033__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8033 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8033__delegate.call(this, a, b, c, ds)
        };
        G__8033.cljs$lang$maxFixedArity = 3;
        G__8033.cljs$lang$applyTo = function(arglist__8034) {
          var a = cljs.core.first(arglist__8034);
          var b = cljs.core.first(cljs.core.next(arglist__8034));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8034)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8034)));
          return G__8033__delegate(a, b, c, ds)
        };
        G__8033.cljs$lang$arity$variadic = G__8033__delegate;
        return G__8033
      }();
      G__8032 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8032__2.call(this, a, b);
          case 3:
            return G__8032__3.call(this, a, b, c);
          default:
            return G__8032__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8032.cljs$lang$maxFixedArity = 3;
      G__8032.cljs$lang$applyTo = G__8032__4.cljs$lang$applyTo;
      return G__8032
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8035 = null;
      var G__8035__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8035__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8035__4 = function() {
        var G__8036__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8036 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8036__delegate.call(this, a, b, c, ds)
        };
        G__8036.cljs$lang$maxFixedArity = 3;
        G__8036.cljs$lang$applyTo = function(arglist__8037) {
          var a = cljs.core.first(arglist__8037);
          var b = cljs.core.first(cljs.core.next(arglist__8037));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8037)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8037)));
          return G__8036__delegate(a, b, c, ds)
        };
        G__8036.cljs$lang$arity$variadic = G__8036__delegate;
        return G__8036
      }();
      G__8035 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8035__2.call(this, a, b);
          case 3:
            return G__8035__3.call(this, a, b, c);
          default:
            return G__8035__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8035.cljs$lang$maxFixedArity = 3;
      G__8035.cljs$lang$applyTo = G__8035__4.cljs$lang$applyTo;
      return G__8035
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__8053 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8061 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8061) {
        var s__8062 = temp__3974__auto____8061;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8062)) {
          var c__8063 = cljs.core.chunk_first.call(null, s__8062);
          var size__8064 = cljs.core.count.call(null, c__8063);
          var b__8065 = cljs.core.chunk_buffer.call(null, size__8064);
          var n__2525__auto____8066 = size__8064;
          var i__8067 = 0;
          while(true) {
            if(i__8067 < n__2525__auto____8066) {
              cljs.core.chunk_append.call(null, b__8065, f.call(null, idx + i__8067, cljs.core._nth.call(null, c__8063, i__8067)));
              var G__8068 = i__8067 + 1;
              i__8067 = G__8068;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8065), mapi.call(null, idx + size__8064, cljs.core.chunk_rest.call(null, s__8062)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8062)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8062)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8053.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8078 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8078) {
      var s__8079 = temp__3974__auto____8078;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8079)) {
        var c__8080 = cljs.core.chunk_first.call(null, s__8079);
        var size__8081 = cljs.core.count.call(null, c__8080);
        var b__8082 = cljs.core.chunk_buffer.call(null, size__8081);
        var n__2525__auto____8083 = size__8081;
        var i__8084 = 0;
        while(true) {
          if(i__8084 < n__2525__auto____8083) {
            var x__8085 = f.call(null, cljs.core._nth.call(null, c__8080, i__8084));
            if(x__8085 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8082, x__8085)
            }
            var G__8087 = i__8084 + 1;
            i__8084 = G__8087;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8082), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8079)))
      }else {
        var x__8086 = f.call(null, cljs.core.first.call(null, s__8079));
        if(x__8086 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8079))
        }else {
          return cljs.core.cons.call(null, x__8086, keep.call(null, f, cljs.core.rest.call(null, s__8079)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8113 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8123 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8123) {
        var s__8124 = temp__3974__auto____8123;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8124)) {
          var c__8125 = cljs.core.chunk_first.call(null, s__8124);
          var size__8126 = cljs.core.count.call(null, c__8125);
          var b__8127 = cljs.core.chunk_buffer.call(null, size__8126);
          var n__2525__auto____8128 = size__8126;
          var i__8129 = 0;
          while(true) {
            if(i__8129 < n__2525__auto____8128) {
              var x__8130 = f.call(null, idx + i__8129, cljs.core._nth.call(null, c__8125, i__8129));
              if(x__8130 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8127, x__8130)
              }
              var G__8132 = i__8129 + 1;
              i__8129 = G__8132;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8127), keepi.call(null, idx + size__8126, cljs.core.chunk_rest.call(null, s__8124)))
        }else {
          var x__8131 = f.call(null, idx, cljs.core.first.call(null, s__8124));
          if(x__8131 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8124))
          }else {
            return cljs.core.cons.call(null, x__8131, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8124)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8113.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8218 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8218)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8218
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8219 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8219)) {
            var and__3822__auto____8220 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8220)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8220
            }
          }else {
            return and__3822__auto____8219
          }
        }())
      };
      var ep1__4 = function() {
        var G__8289__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8221 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8221)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8221
            }
          }())
        };
        var G__8289 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8289__delegate.call(this, x, y, z, args)
        };
        G__8289.cljs$lang$maxFixedArity = 3;
        G__8289.cljs$lang$applyTo = function(arglist__8290) {
          var x = cljs.core.first(arglist__8290);
          var y = cljs.core.first(cljs.core.next(arglist__8290));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8290)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8290)));
          return G__8289__delegate(x, y, z, args)
        };
        G__8289.cljs$lang$arity$variadic = G__8289__delegate;
        return G__8289
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8233 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8233)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8233
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8234 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8234)) {
            var and__3822__auto____8235 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8235)) {
              var and__3822__auto____8236 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8236)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8236
              }
            }else {
              return and__3822__auto____8235
            }
          }else {
            return and__3822__auto____8234
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8237 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8237)) {
            var and__3822__auto____8238 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8238)) {
              var and__3822__auto____8239 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8239)) {
                var and__3822__auto____8240 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8240)) {
                  var and__3822__auto____8241 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8241)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8241
                  }
                }else {
                  return and__3822__auto____8240
                }
              }else {
                return and__3822__auto____8239
              }
            }else {
              return and__3822__auto____8238
            }
          }else {
            return and__3822__auto____8237
          }
        }())
      };
      var ep2__4 = function() {
        var G__8291__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8242 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8242)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8088_SHARP_) {
                var and__3822__auto____8243 = p1.call(null, p1__8088_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8243)) {
                  return p2.call(null, p1__8088_SHARP_)
                }else {
                  return and__3822__auto____8243
                }
              }, args)
            }else {
              return and__3822__auto____8242
            }
          }())
        };
        var G__8291 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8291__delegate.call(this, x, y, z, args)
        };
        G__8291.cljs$lang$maxFixedArity = 3;
        G__8291.cljs$lang$applyTo = function(arglist__8292) {
          var x = cljs.core.first(arglist__8292);
          var y = cljs.core.first(cljs.core.next(arglist__8292));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8292)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8292)));
          return G__8291__delegate(x, y, z, args)
        };
        G__8291.cljs$lang$arity$variadic = G__8291__delegate;
        return G__8291
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8262 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8262)) {
            var and__3822__auto____8263 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8263)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8263
            }
          }else {
            return and__3822__auto____8262
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8264 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8264)) {
            var and__3822__auto____8265 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8265)) {
              var and__3822__auto____8266 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8266)) {
                var and__3822__auto____8267 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8267)) {
                  var and__3822__auto____8268 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8268)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8268
                  }
                }else {
                  return and__3822__auto____8267
                }
              }else {
                return and__3822__auto____8266
              }
            }else {
              return and__3822__auto____8265
            }
          }else {
            return and__3822__auto____8264
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8269 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8269)) {
            var and__3822__auto____8270 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8270)) {
              var and__3822__auto____8271 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8271)) {
                var and__3822__auto____8272 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8272)) {
                  var and__3822__auto____8273 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8273)) {
                    var and__3822__auto____8274 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8274)) {
                      var and__3822__auto____8275 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8275)) {
                        var and__3822__auto____8276 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8276)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8276
                        }
                      }else {
                        return and__3822__auto____8275
                      }
                    }else {
                      return and__3822__auto____8274
                    }
                  }else {
                    return and__3822__auto____8273
                  }
                }else {
                  return and__3822__auto____8272
                }
              }else {
                return and__3822__auto____8271
              }
            }else {
              return and__3822__auto____8270
            }
          }else {
            return and__3822__auto____8269
          }
        }())
      };
      var ep3__4 = function() {
        var G__8293__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8277 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8277)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8089_SHARP_) {
                var and__3822__auto____8278 = p1.call(null, p1__8089_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8278)) {
                  var and__3822__auto____8279 = p2.call(null, p1__8089_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8279)) {
                    return p3.call(null, p1__8089_SHARP_)
                  }else {
                    return and__3822__auto____8279
                  }
                }else {
                  return and__3822__auto____8278
                }
              }, args)
            }else {
              return and__3822__auto____8277
            }
          }())
        };
        var G__8293 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8293__delegate.call(this, x, y, z, args)
        };
        G__8293.cljs$lang$maxFixedArity = 3;
        G__8293.cljs$lang$applyTo = function(arglist__8294) {
          var x = cljs.core.first(arglist__8294);
          var y = cljs.core.first(cljs.core.next(arglist__8294));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8294)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8294)));
          return G__8293__delegate(x, y, z, args)
        };
        G__8293.cljs$lang$arity$variadic = G__8293__delegate;
        return G__8293
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__8295__delegate = function(p1, p2, p3, ps) {
      var ps__8280 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8090_SHARP_) {
            return p1__8090_SHARP_.call(null, x)
          }, ps__8280)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8091_SHARP_) {
            var and__3822__auto____8285 = p1__8091_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8285)) {
              return p1__8091_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8285
            }
          }, ps__8280)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8092_SHARP_) {
            var and__3822__auto____8286 = p1__8092_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8286)) {
              var and__3822__auto____8287 = p1__8092_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8287)) {
                return p1__8092_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8287
              }
            }else {
              return and__3822__auto____8286
            }
          }, ps__8280)
        };
        var epn__4 = function() {
          var G__8296__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8288 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8288)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8093_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8093_SHARP_, args)
                }, ps__8280)
              }else {
                return and__3822__auto____8288
              }
            }())
          };
          var G__8296 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8296__delegate.call(this, x, y, z, args)
          };
          G__8296.cljs$lang$maxFixedArity = 3;
          G__8296.cljs$lang$applyTo = function(arglist__8297) {
            var x = cljs.core.first(arglist__8297);
            var y = cljs.core.first(cljs.core.next(arglist__8297));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8297)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8297)));
            return G__8296__delegate(x, y, z, args)
          };
          G__8296.cljs$lang$arity$variadic = G__8296__delegate;
          return G__8296
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__8295 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8295__delegate.call(this, p1, p2, p3, ps)
    };
    G__8295.cljs$lang$maxFixedArity = 3;
    G__8295.cljs$lang$applyTo = function(arglist__8298) {
      var p1 = cljs.core.first(arglist__8298);
      var p2 = cljs.core.first(cljs.core.next(arglist__8298));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8298)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8298)));
      return G__8295__delegate(p1, p2, p3, ps)
    };
    G__8295.cljs$lang$arity$variadic = G__8295__delegate;
    return G__8295
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____8379 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8379)) {
          return or__3824__auto____8379
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8380 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8380)) {
          return or__3824__auto____8380
        }else {
          var or__3824__auto____8381 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8381)) {
            return or__3824__auto____8381
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8450__delegate = function(x, y, z, args) {
          var or__3824__auto____8382 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8382)) {
            return or__3824__auto____8382
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8450 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8450__delegate.call(this, x, y, z, args)
        };
        G__8450.cljs$lang$maxFixedArity = 3;
        G__8450.cljs$lang$applyTo = function(arglist__8451) {
          var x = cljs.core.first(arglist__8451);
          var y = cljs.core.first(cljs.core.next(arglist__8451));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8451)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8451)));
          return G__8450__delegate(x, y, z, args)
        };
        G__8450.cljs$lang$arity$variadic = G__8450__delegate;
        return G__8450
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____8394 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8394)) {
          return or__3824__auto____8394
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8395 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8395)) {
          return or__3824__auto____8395
        }else {
          var or__3824__auto____8396 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8396)) {
            return or__3824__auto____8396
          }else {
            var or__3824__auto____8397 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8397)) {
              return or__3824__auto____8397
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8398 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8398)) {
          return or__3824__auto____8398
        }else {
          var or__3824__auto____8399 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8399)) {
            return or__3824__auto____8399
          }else {
            var or__3824__auto____8400 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8400)) {
              return or__3824__auto____8400
            }else {
              var or__3824__auto____8401 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8401)) {
                return or__3824__auto____8401
              }else {
                var or__3824__auto____8402 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8402)) {
                  return or__3824__auto____8402
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8452__delegate = function(x, y, z, args) {
          var or__3824__auto____8403 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8403)) {
            return or__3824__auto____8403
          }else {
            return cljs.core.some.call(null, function(p1__8133_SHARP_) {
              var or__3824__auto____8404 = p1.call(null, p1__8133_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8404)) {
                return or__3824__auto____8404
              }else {
                return p2.call(null, p1__8133_SHARP_)
              }
            }, args)
          }
        };
        var G__8452 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8452__delegate.call(this, x, y, z, args)
        };
        G__8452.cljs$lang$maxFixedArity = 3;
        G__8452.cljs$lang$applyTo = function(arglist__8453) {
          var x = cljs.core.first(arglist__8453);
          var y = cljs.core.first(cljs.core.next(arglist__8453));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8453)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8453)));
          return G__8452__delegate(x, y, z, args)
        };
        G__8452.cljs$lang$arity$variadic = G__8452__delegate;
        return G__8452
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8423 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8423)) {
          return or__3824__auto____8423
        }else {
          var or__3824__auto____8424 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8424)) {
            return or__3824__auto____8424
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8425 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8425)) {
          return or__3824__auto____8425
        }else {
          var or__3824__auto____8426 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8426)) {
            return or__3824__auto____8426
          }else {
            var or__3824__auto____8427 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8427)) {
              return or__3824__auto____8427
            }else {
              var or__3824__auto____8428 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8428)) {
                return or__3824__auto____8428
              }else {
                var or__3824__auto____8429 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8429)) {
                  return or__3824__auto____8429
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8430 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8430)) {
          return or__3824__auto____8430
        }else {
          var or__3824__auto____8431 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8431)) {
            return or__3824__auto____8431
          }else {
            var or__3824__auto____8432 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8432)) {
              return or__3824__auto____8432
            }else {
              var or__3824__auto____8433 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8433)) {
                return or__3824__auto____8433
              }else {
                var or__3824__auto____8434 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8434)) {
                  return or__3824__auto____8434
                }else {
                  var or__3824__auto____8435 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8435)) {
                    return or__3824__auto____8435
                  }else {
                    var or__3824__auto____8436 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8436)) {
                      return or__3824__auto____8436
                    }else {
                      var or__3824__auto____8437 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8437)) {
                        return or__3824__auto____8437
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8454__delegate = function(x, y, z, args) {
          var or__3824__auto____8438 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8438)) {
            return or__3824__auto____8438
          }else {
            return cljs.core.some.call(null, function(p1__8134_SHARP_) {
              var or__3824__auto____8439 = p1.call(null, p1__8134_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8439)) {
                return or__3824__auto____8439
              }else {
                var or__3824__auto____8440 = p2.call(null, p1__8134_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8440)) {
                  return or__3824__auto____8440
                }else {
                  return p3.call(null, p1__8134_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8454 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8454__delegate.call(this, x, y, z, args)
        };
        G__8454.cljs$lang$maxFixedArity = 3;
        G__8454.cljs$lang$applyTo = function(arglist__8455) {
          var x = cljs.core.first(arglist__8455);
          var y = cljs.core.first(cljs.core.next(arglist__8455));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8455)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8455)));
          return G__8454__delegate(x, y, z, args)
        };
        G__8454.cljs$lang$arity$variadic = G__8454__delegate;
        return G__8454
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8456__delegate = function(p1, p2, p3, ps) {
      var ps__8441 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8135_SHARP_) {
            return p1__8135_SHARP_.call(null, x)
          }, ps__8441)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8136_SHARP_) {
            var or__3824__auto____8446 = p1__8136_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8446)) {
              return or__3824__auto____8446
            }else {
              return p1__8136_SHARP_.call(null, y)
            }
          }, ps__8441)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8137_SHARP_) {
            var or__3824__auto____8447 = p1__8137_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8447)) {
              return or__3824__auto____8447
            }else {
              var or__3824__auto____8448 = p1__8137_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8448)) {
                return or__3824__auto____8448
              }else {
                return p1__8137_SHARP_.call(null, z)
              }
            }
          }, ps__8441)
        };
        var spn__4 = function() {
          var G__8457__delegate = function(x, y, z, args) {
            var or__3824__auto____8449 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8449)) {
              return or__3824__auto____8449
            }else {
              return cljs.core.some.call(null, function(p1__8138_SHARP_) {
                return cljs.core.some.call(null, p1__8138_SHARP_, args)
              }, ps__8441)
            }
          };
          var G__8457 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8457__delegate.call(this, x, y, z, args)
          };
          G__8457.cljs$lang$maxFixedArity = 3;
          G__8457.cljs$lang$applyTo = function(arglist__8458) {
            var x = cljs.core.first(arglist__8458);
            var y = cljs.core.first(cljs.core.next(arglist__8458));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8458)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8458)));
            return G__8457__delegate(x, y, z, args)
          };
          G__8457.cljs$lang$arity$variadic = G__8457__delegate;
          return G__8457
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8456 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8456__delegate.call(this, p1, p2, p3, ps)
    };
    G__8456.cljs$lang$maxFixedArity = 3;
    G__8456.cljs$lang$applyTo = function(arglist__8459) {
      var p1 = cljs.core.first(arglist__8459);
      var p2 = cljs.core.first(cljs.core.next(arglist__8459));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8459)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8459)));
      return G__8456__delegate(p1, p2, p3, ps)
    };
    G__8456.cljs$lang$arity$variadic = G__8456__delegate;
    return G__8456
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8478 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8478) {
        var s__8479 = temp__3974__auto____8478;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8479)) {
          var c__8480 = cljs.core.chunk_first.call(null, s__8479);
          var size__8481 = cljs.core.count.call(null, c__8480);
          var b__8482 = cljs.core.chunk_buffer.call(null, size__8481);
          var n__2525__auto____8483 = size__8481;
          var i__8484 = 0;
          while(true) {
            if(i__8484 < n__2525__auto____8483) {
              cljs.core.chunk_append.call(null, b__8482, f.call(null, cljs.core._nth.call(null, c__8480, i__8484)));
              var G__8496 = i__8484 + 1;
              i__8484 = G__8496;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8482), map.call(null, f, cljs.core.chunk_rest.call(null, s__8479)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8479)), map.call(null, f, cljs.core.rest.call(null, s__8479)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8485 = cljs.core.seq.call(null, c1);
      var s2__8486 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8487 = s1__8485;
        if(and__3822__auto____8487) {
          return s2__8486
        }else {
          return and__3822__auto____8487
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8485), cljs.core.first.call(null, s2__8486)), map.call(null, f, cljs.core.rest.call(null, s1__8485), cljs.core.rest.call(null, s2__8486)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8488 = cljs.core.seq.call(null, c1);
      var s2__8489 = cljs.core.seq.call(null, c2);
      var s3__8490 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8491 = s1__8488;
        if(and__3822__auto____8491) {
          var and__3822__auto____8492 = s2__8489;
          if(and__3822__auto____8492) {
            return s3__8490
          }else {
            return and__3822__auto____8492
          }
        }else {
          return and__3822__auto____8491
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8488), cljs.core.first.call(null, s2__8489), cljs.core.first.call(null, s3__8490)), map.call(null, f, cljs.core.rest.call(null, s1__8488), cljs.core.rest.call(null, s2__8489), cljs.core.rest.call(null, s3__8490)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8497__delegate = function(f, c1, c2, c3, colls) {
      var step__8495 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8494 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8494)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8494), step.call(null, map.call(null, cljs.core.rest, ss__8494)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8299_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8299_SHARP_)
      }, step__8495.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8497 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8497__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8497.cljs$lang$maxFixedArity = 4;
    G__8497.cljs$lang$applyTo = function(arglist__8498) {
      var f = cljs.core.first(arglist__8498);
      var c1 = cljs.core.first(cljs.core.next(arglist__8498));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8498)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8498))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8498))));
      return G__8497__delegate(f, c1, c2, c3, colls)
    };
    G__8497.cljs$lang$arity$variadic = G__8497__delegate;
    return G__8497
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8501 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8501) {
        var s__8502 = temp__3974__auto____8501;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8502), take.call(null, n - 1, cljs.core.rest.call(null, s__8502)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8508 = function(n, coll) {
    while(true) {
      var s__8506 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8507 = n > 0;
        if(and__3822__auto____8507) {
          return s__8506
        }else {
          return and__3822__auto____8507
        }
      }())) {
        var G__8509 = n - 1;
        var G__8510 = cljs.core.rest.call(null, s__8506);
        n = G__8509;
        coll = G__8510;
        continue
      }else {
        return s__8506
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8508.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8513 = cljs.core.seq.call(null, coll);
  var lead__8514 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8514) {
      var G__8515 = cljs.core.next.call(null, s__8513);
      var G__8516 = cljs.core.next.call(null, lead__8514);
      s__8513 = G__8515;
      lead__8514 = G__8516;
      continue
    }else {
      return s__8513
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8522 = function(pred, coll) {
    while(true) {
      var s__8520 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8521 = s__8520;
        if(and__3822__auto____8521) {
          return pred.call(null, cljs.core.first.call(null, s__8520))
        }else {
          return and__3822__auto____8521
        }
      }())) {
        var G__8523 = pred;
        var G__8524 = cljs.core.rest.call(null, s__8520);
        pred = G__8523;
        coll = G__8524;
        continue
      }else {
        return s__8520
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8522.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8527 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8527) {
      var s__8528 = temp__3974__auto____8527;
      return cljs.core.concat.call(null, s__8528, cycle.call(null, s__8528))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8533 = cljs.core.seq.call(null, c1);
      var s2__8534 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8535 = s1__8533;
        if(and__3822__auto____8535) {
          return s2__8534
        }else {
          return and__3822__auto____8535
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8533), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8534), interleave.call(null, cljs.core.rest.call(null, s1__8533), cljs.core.rest.call(null, s2__8534))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8537__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8536 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8536)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8536), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8536)))
        }else {
          return null
        }
      }, null)
    };
    var G__8537 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8537__delegate.call(this, c1, c2, colls)
    };
    G__8537.cljs$lang$maxFixedArity = 2;
    G__8537.cljs$lang$applyTo = function(arglist__8538) {
      var c1 = cljs.core.first(arglist__8538);
      var c2 = cljs.core.first(cljs.core.next(arglist__8538));
      var colls = cljs.core.rest(cljs.core.next(arglist__8538));
      return G__8537__delegate(c1, c2, colls)
    };
    G__8537.cljs$lang$arity$variadic = G__8537__delegate;
    return G__8537
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8548 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8546 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8546) {
        var coll__8547 = temp__3971__auto____8546;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8547), cat.call(null, cljs.core.rest.call(null, coll__8547), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8548.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8549__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8549 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8549__delegate.call(this, f, coll, colls)
    };
    G__8549.cljs$lang$maxFixedArity = 2;
    G__8549.cljs$lang$applyTo = function(arglist__8550) {
      var f = cljs.core.first(arglist__8550);
      var coll = cljs.core.first(cljs.core.next(arglist__8550));
      var colls = cljs.core.rest(cljs.core.next(arglist__8550));
      return G__8549__delegate(f, coll, colls)
    };
    G__8549.cljs$lang$arity$variadic = G__8549__delegate;
    return G__8549
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8560 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8560) {
      var s__8561 = temp__3974__auto____8560;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8561)) {
        var c__8562 = cljs.core.chunk_first.call(null, s__8561);
        var size__8563 = cljs.core.count.call(null, c__8562);
        var b__8564 = cljs.core.chunk_buffer.call(null, size__8563);
        var n__2525__auto____8565 = size__8563;
        var i__8566 = 0;
        while(true) {
          if(i__8566 < n__2525__auto____8565) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8562, i__8566)))) {
              cljs.core.chunk_append.call(null, b__8564, cljs.core._nth.call(null, c__8562, i__8566))
            }else {
            }
            var G__8569 = i__8566 + 1;
            i__8566 = G__8569;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8564), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8561)))
      }else {
        var f__8567 = cljs.core.first.call(null, s__8561);
        var r__8568 = cljs.core.rest.call(null, s__8561);
        if(cljs.core.truth_(pred.call(null, f__8567))) {
          return cljs.core.cons.call(null, f__8567, filter.call(null, pred, r__8568))
        }else {
          return filter.call(null, pred, r__8568)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8572 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8572.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8570_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8570_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8576__8577 = to;
    if(G__8576__8577) {
      if(function() {
        var or__3824__auto____8578 = G__8576__8577.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8578) {
          return or__3824__auto____8578
        }else {
          return G__8576__8577.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8576__8577.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8576__8577)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8576__8577)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8579__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8579 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8579__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8579.cljs$lang$maxFixedArity = 4;
    G__8579.cljs$lang$applyTo = function(arglist__8580) {
      var f = cljs.core.first(arglist__8580);
      var c1 = cljs.core.first(cljs.core.next(arglist__8580));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8580)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8580))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8580))));
      return G__8579__delegate(f, c1, c2, c3, colls)
    };
    G__8579.cljs$lang$arity$variadic = G__8579__delegate;
    return G__8579
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8587 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8587) {
        var s__8588 = temp__3974__auto____8587;
        var p__8589 = cljs.core.take.call(null, n, s__8588);
        if(n === cljs.core.count.call(null, p__8589)) {
          return cljs.core.cons.call(null, p__8589, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8588)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8590 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8590) {
        var s__8591 = temp__3974__auto____8590;
        var p__8592 = cljs.core.take.call(null, n, s__8591);
        if(n === cljs.core.count.call(null, p__8592)) {
          return cljs.core.cons.call(null, p__8592, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8591)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8592, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8597 = cljs.core.lookup_sentinel;
    var m__8598 = m;
    var ks__8599 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8599) {
        var m__8600 = cljs.core._lookup.call(null, m__8598, cljs.core.first.call(null, ks__8599), sentinel__8597);
        if(sentinel__8597 === m__8600) {
          return not_found
        }else {
          var G__8601 = sentinel__8597;
          var G__8602 = m__8600;
          var G__8603 = cljs.core.next.call(null, ks__8599);
          sentinel__8597 = G__8601;
          m__8598 = G__8602;
          ks__8599 = G__8603;
          continue
        }
      }else {
        return m__8598
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8604, v) {
  var vec__8609__8610 = p__8604;
  var k__8611 = cljs.core.nth.call(null, vec__8609__8610, 0, null);
  var ks__8612 = cljs.core.nthnext.call(null, vec__8609__8610, 1);
  if(cljs.core.truth_(ks__8612)) {
    return cljs.core.assoc.call(null, m, k__8611, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8611, null), ks__8612, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8611, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8613, f, args) {
    var vec__8618__8619 = p__8613;
    var k__8620 = cljs.core.nth.call(null, vec__8618__8619, 0, null);
    var ks__8621 = cljs.core.nthnext.call(null, vec__8618__8619, 1);
    if(cljs.core.truth_(ks__8621)) {
      return cljs.core.assoc.call(null, m, k__8620, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8620, null), ks__8621, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8620, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8620, null), args))
    }
  };
  var update_in = function(m, p__8613, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8613, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8622) {
    var m = cljs.core.first(arglist__8622);
    var p__8613 = cljs.core.first(cljs.core.next(arglist__8622));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8622)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8622)));
    return update_in__delegate(m, p__8613, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8625 = this;
  var h__2190__auto____8626 = this__8625.__hash;
  if(!(h__2190__auto____8626 == null)) {
    return h__2190__auto____8626
  }else {
    var h__2190__auto____8627 = cljs.core.hash_coll.call(null, coll);
    this__8625.__hash = h__2190__auto____8627;
    return h__2190__auto____8627
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8628 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8629 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8630 = this;
  var new_array__8631 = this__8630.array.slice();
  new_array__8631[k] = v;
  return new cljs.core.Vector(this__8630.meta, new_array__8631, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8662 = null;
  var G__8662__2 = function(this_sym8632, k) {
    var this__8634 = this;
    var this_sym8632__8635 = this;
    var coll__8636 = this_sym8632__8635;
    return coll__8636.cljs$core$ILookup$_lookup$arity$2(coll__8636, k)
  };
  var G__8662__3 = function(this_sym8633, k, not_found) {
    var this__8634 = this;
    var this_sym8633__8637 = this;
    var coll__8638 = this_sym8633__8637;
    return coll__8638.cljs$core$ILookup$_lookup$arity$3(coll__8638, k, not_found)
  };
  G__8662 = function(this_sym8633, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8662__2.call(this, this_sym8633, k);
      case 3:
        return G__8662__3.call(this, this_sym8633, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8662
}();
cljs.core.Vector.prototype.apply = function(this_sym8623, args8624) {
  var this__8639 = this;
  return this_sym8623.call.apply(this_sym8623, [this_sym8623].concat(args8624.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8640 = this;
  var new_array__8641 = this__8640.array.slice();
  new_array__8641.push(o);
  return new cljs.core.Vector(this__8640.meta, new_array__8641, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8642 = this;
  var this__8643 = this;
  return cljs.core.pr_str.call(null, this__8643)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8644 = this;
  return cljs.core.ci_reduce.call(null, this__8644.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8645 = this;
  return cljs.core.ci_reduce.call(null, this__8645.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8646 = this;
  if(this__8646.array.length > 0) {
    var vector_seq__8647 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8646.array.length) {
          return cljs.core.cons.call(null, this__8646.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8647.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8648 = this;
  return this__8648.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8649 = this;
  var count__8650 = this__8649.array.length;
  if(count__8650 > 0) {
    return this__8649.array[count__8650 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8651 = this;
  if(this__8651.array.length > 0) {
    var new_array__8652 = this__8651.array.slice();
    new_array__8652.pop();
    return new cljs.core.Vector(this__8651.meta, new_array__8652, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8653 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8654 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8655 = this;
  return new cljs.core.Vector(meta, this__8655.array, this__8655.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8656 = this;
  return this__8656.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8657 = this;
  if(function() {
    var and__3822__auto____8658 = 0 <= n;
    if(and__3822__auto____8658) {
      return n < this__8657.array.length
    }else {
      return and__3822__auto____8658
    }
  }()) {
    return this__8657.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8659 = this;
  if(function() {
    var and__3822__auto____8660 = 0 <= n;
    if(and__3822__auto____8660) {
      return n < this__8659.array.length
    }else {
      return and__3822__auto____8660
    }
  }()) {
    return this__8659.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8661 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8661.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2308__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8664 = pv.cnt;
  if(cnt__8664 < 32) {
    return 0
  }else {
    return cnt__8664 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8670 = level;
  var ret__8671 = node;
  while(true) {
    if(ll__8670 === 0) {
      return ret__8671
    }else {
      var embed__8672 = ret__8671;
      var r__8673 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8674 = cljs.core.pv_aset.call(null, r__8673, 0, embed__8672);
      var G__8675 = ll__8670 - 5;
      var G__8676 = r__8673;
      ll__8670 = G__8675;
      ret__8671 = G__8676;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8682 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8683 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8682, subidx__8683, tailnode);
    return ret__8682
  }else {
    var child__8684 = cljs.core.pv_aget.call(null, parent, subidx__8683);
    if(!(child__8684 == null)) {
      var node_to_insert__8685 = push_tail.call(null, pv, level - 5, child__8684, tailnode);
      cljs.core.pv_aset.call(null, ret__8682, subidx__8683, node_to_insert__8685);
      return ret__8682
    }else {
      var node_to_insert__8686 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8682, subidx__8683, node_to_insert__8686);
      return ret__8682
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8690 = 0 <= i;
    if(and__3822__auto____8690) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8690
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8691 = pv.root;
      var level__8692 = pv.shift;
      while(true) {
        if(level__8692 > 0) {
          var G__8693 = cljs.core.pv_aget.call(null, node__8691, i >>> level__8692 & 31);
          var G__8694 = level__8692 - 5;
          node__8691 = G__8693;
          level__8692 = G__8694;
          continue
        }else {
          return node__8691.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8697 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8697, i & 31, val);
    return ret__8697
  }else {
    var subidx__8698 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8697, subidx__8698, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8698), i, val));
    return ret__8697
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8704 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8705 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8704));
    if(function() {
      var and__3822__auto____8706 = new_child__8705 == null;
      if(and__3822__auto____8706) {
        return subidx__8704 === 0
      }else {
        return and__3822__auto____8706
      }
    }()) {
      return null
    }else {
      var ret__8707 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8707, subidx__8704, new_child__8705);
      return ret__8707
    }
  }else {
    if(subidx__8704 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8708 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8708, subidx__8704, null);
        return ret__8708
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8711 = this;
  return new cljs.core.TransientVector(this__8711.cnt, this__8711.shift, cljs.core.tv_editable_root.call(null, this__8711.root), cljs.core.tv_editable_tail.call(null, this__8711.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8712 = this;
  var h__2190__auto____8713 = this__8712.__hash;
  if(!(h__2190__auto____8713 == null)) {
    return h__2190__auto____8713
  }else {
    var h__2190__auto____8714 = cljs.core.hash_coll.call(null, coll);
    this__8712.__hash = h__2190__auto____8714;
    return h__2190__auto____8714
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8715 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8716 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8717 = this;
  if(function() {
    var and__3822__auto____8718 = 0 <= k;
    if(and__3822__auto____8718) {
      return k < this__8717.cnt
    }else {
      return and__3822__auto____8718
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8719 = this__8717.tail.slice();
      new_tail__8719[k & 31] = v;
      return new cljs.core.PersistentVector(this__8717.meta, this__8717.cnt, this__8717.shift, this__8717.root, new_tail__8719, null)
    }else {
      return new cljs.core.PersistentVector(this__8717.meta, this__8717.cnt, this__8717.shift, cljs.core.do_assoc.call(null, coll, this__8717.shift, this__8717.root, k, v), this__8717.tail, null)
    }
  }else {
    if(k === this__8717.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8717.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8767 = null;
  var G__8767__2 = function(this_sym8720, k) {
    var this__8722 = this;
    var this_sym8720__8723 = this;
    var coll__8724 = this_sym8720__8723;
    return coll__8724.cljs$core$ILookup$_lookup$arity$2(coll__8724, k)
  };
  var G__8767__3 = function(this_sym8721, k, not_found) {
    var this__8722 = this;
    var this_sym8721__8725 = this;
    var coll__8726 = this_sym8721__8725;
    return coll__8726.cljs$core$ILookup$_lookup$arity$3(coll__8726, k, not_found)
  };
  G__8767 = function(this_sym8721, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8767__2.call(this, this_sym8721, k);
      case 3:
        return G__8767__3.call(this, this_sym8721, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8767
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8709, args8710) {
  var this__8727 = this;
  return this_sym8709.call.apply(this_sym8709, [this_sym8709].concat(args8710.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8728 = this;
  var step_init__8729 = [0, init];
  var i__8730 = 0;
  while(true) {
    if(i__8730 < this__8728.cnt) {
      var arr__8731 = cljs.core.array_for.call(null, v, i__8730);
      var len__8732 = arr__8731.length;
      var init__8736 = function() {
        var j__8733 = 0;
        var init__8734 = step_init__8729[1];
        while(true) {
          if(j__8733 < len__8732) {
            var init__8735 = f.call(null, init__8734, j__8733 + i__8730, arr__8731[j__8733]);
            if(cljs.core.reduced_QMARK_.call(null, init__8735)) {
              return init__8735
            }else {
              var G__8768 = j__8733 + 1;
              var G__8769 = init__8735;
              j__8733 = G__8768;
              init__8734 = G__8769;
              continue
            }
          }else {
            step_init__8729[0] = len__8732;
            step_init__8729[1] = init__8734;
            return init__8734
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8736)) {
        return cljs.core.deref.call(null, init__8736)
      }else {
        var G__8770 = i__8730 + step_init__8729[0];
        i__8730 = G__8770;
        continue
      }
    }else {
      return step_init__8729[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8737 = this;
  if(this__8737.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8738 = this__8737.tail.slice();
    new_tail__8738.push(o);
    return new cljs.core.PersistentVector(this__8737.meta, this__8737.cnt + 1, this__8737.shift, this__8737.root, new_tail__8738, null)
  }else {
    var root_overflow_QMARK___8739 = this__8737.cnt >>> 5 > 1 << this__8737.shift;
    var new_shift__8740 = root_overflow_QMARK___8739 ? this__8737.shift + 5 : this__8737.shift;
    var new_root__8742 = root_overflow_QMARK___8739 ? function() {
      var n_r__8741 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8741, 0, this__8737.root);
      cljs.core.pv_aset.call(null, n_r__8741, 1, cljs.core.new_path.call(null, null, this__8737.shift, new cljs.core.VectorNode(null, this__8737.tail)));
      return n_r__8741
    }() : cljs.core.push_tail.call(null, coll, this__8737.shift, this__8737.root, new cljs.core.VectorNode(null, this__8737.tail));
    return new cljs.core.PersistentVector(this__8737.meta, this__8737.cnt + 1, new_shift__8740, new_root__8742, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8743 = this;
  if(this__8743.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8743.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8744 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8745 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8746 = this;
  var this__8747 = this;
  return cljs.core.pr_str.call(null, this__8747)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8748 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8749 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8750 = this;
  if(this__8750.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8751 = this;
  return this__8751.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8752 = this;
  if(this__8752.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8752.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8753 = this;
  if(this__8753.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8753.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8753.meta)
    }else {
      if(1 < this__8753.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8753.meta, this__8753.cnt - 1, this__8753.shift, this__8753.root, this__8753.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8754 = cljs.core.array_for.call(null, coll, this__8753.cnt - 2);
          var nr__8755 = cljs.core.pop_tail.call(null, coll, this__8753.shift, this__8753.root);
          var new_root__8756 = nr__8755 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8755;
          var cnt_1__8757 = this__8753.cnt - 1;
          if(function() {
            var and__3822__auto____8758 = 5 < this__8753.shift;
            if(and__3822__auto____8758) {
              return cljs.core.pv_aget.call(null, new_root__8756, 1) == null
            }else {
              return and__3822__auto____8758
            }
          }()) {
            return new cljs.core.PersistentVector(this__8753.meta, cnt_1__8757, this__8753.shift - 5, cljs.core.pv_aget.call(null, new_root__8756, 0), new_tail__8754, null)
          }else {
            return new cljs.core.PersistentVector(this__8753.meta, cnt_1__8757, this__8753.shift, new_root__8756, new_tail__8754, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8759 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8760 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8761 = this;
  return new cljs.core.PersistentVector(meta, this__8761.cnt, this__8761.shift, this__8761.root, this__8761.tail, this__8761.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8762 = this;
  return this__8762.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8763 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8764 = this;
  if(function() {
    var and__3822__auto____8765 = 0 <= n;
    if(and__3822__auto____8765) {
      return n < this__8764.cnt
    }else {
      return and__3822__auto____8765
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8766 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8766.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8771 = xs.length;
  var xs__8772 = no_clone === true ? xs : xs.slice();
  if(l__8771 < 32) {
    return new cljs.core.PersistentVector(null, l__8771, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8772, null)
  }else {
    var node__8773 = xs__8772.slice(0, 32);
    var v__8774 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8773, null);
    var i__8775 = 32;
    var out__8776 = cljs.core._as_transient.call(null, v__8774);
    while(true) {
      if(i__8775 < l__8771) {
        var G__8777 = i__8775 + 1;
        var G__8778 = cljs.core.conj_BANG_.call(null, out__8776, xs__8772[i__8775]);
        i__8775 = G__8777;
        out__8776 = G__8778;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8776)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8779) {
    var args = cljs.core.seq(arglist__8779);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8780 = this;
  if(this__8780.off + 1 < this__8780.node.length) {
    var s__8781 = cljs.core.chunked_seq.call(null, this__8780.vec, this__8780.node, this__8780.i, this__8780.off + 1);
    if(s__8781 == null) {
      return null
    }else {
      return s__8781
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8782 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8783 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8784 = this;
  return this__8784.node[this__8784.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8785 = this;
  if(this__8785.off + 1 < this__8785.node.length) {
    var s__8786 = cljs.core.chunked_seq.call(null, this__8785.vec, this__8785.node, this__8785.i, this__8785.off + 1);
    if(s__8786 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8786
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8787 = this;
  var l__8788 = this__8787.node.length;
  var s__8789 = this__8787.i + l__8788 < cljs.core._count.call(null, this__8787.vec) ? cljs.core.chunked_seq.call(null, this__8787.vec, this__8787.i + l__8788, 0) : null;
  if(s__8789 == null) {
    return null
  }else {
    return s__8789
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8790 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8791 = this;
  return cljs.core.chunked_seq.call(null, this__8791.vec, this__8791.node, this__8791.i, this__8791.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8792 = this;
  return this__8792.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8793 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8793.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8794 = this;
  return cljs.core.array_chunk.call(null, this__8794.node, this__8794.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8795 = this;
  var l__8796 = this__8795.node.length;
  var s__8797 = this__8795.i + l__8796 < cljs.core._count.call(null, this__8795.vec) ? cljs.core.chunked_seq.call(null, this__8795.vec, this__8795.i + l__8796, 0) : null;
  if(s__8797 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8797
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8800 = this;
  var h__2190__auto____8801 = this__8800.__hash;
  if(!(h__2190__auto____8801 == null)) {
    return h__2190__auto____8801
  }else {
    var h__2190__auto____8802 = cljs.core.hash_coll.call(null, coll);
    this__8800.__hash = h__2190__auto____8802;
    return h__2190__auto____8802
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8803 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8804 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8805 = this;
  var v_pos__8806 = this__8805.start + key;
  return new cljs.core.Subvec(this__8805.meta, cljs.core._assoc.call(null, this__8805.v, v_pos__8806, val), this__8805.start, this__8805.end > v_pos__8806 + 1 ? this__8805.end : v_pos__8806 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8832 = null;
  var G__8832__2 = function(this_sym8807, k) {
    var this__8809 = this;
    var this_sym8807__8810 = this;
    var coll__8811 = this_sym8807__8810;
    return coll__8811.cljs$core$ILookup$_lookup$arity$2(coll__8811, k)
  };
  var G__8832__3 = function(this_sym8808, k, not_found) {
    var this__8809 = this;
    var this_sym8808__8812 = this;
    var coll__8813 = this_sym8808__8812;
    return coll__8813.cljs$core$ILookup$_lookup$arity$3(coll__8813, k, not_found)
  };
  G__8832 = function(this_sym8808, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8832__2.call(this, this_sym8808, k);
      case 3:
        return G__8832__3.call(this, this_sym8808, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8832
}();
cljs.core.Subvec.prototype.apply = function(this_sym8798, args8799) {
  var this__8814 = this;
  return this_sym8798.call.apply(this_sym8798, [this_sym8798].concat(args8799.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8815 = this;
  return new cljs.core.Subvec(this__8815.meta, cljs.core._assoc_n.call(null, this__8815.v, this__8815.end, o), this__8815.start, this__8815.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8816 = this;
  var this__8817 = this;
  return cljs.core.pr_str.call(null, this__8817)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8818 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8819 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8820 = this;
  var subvec_seq__8821 = function subvec_seq(i) {
    if(i === this__8820.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8820.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8821.call(null, this__8820.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8822 = this;
  return this__8822.end - this__8822.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8823 = this;
  return cljs.core._nth.call(null, this__8823.v, this__8823.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8824 = this;
  if(this__8824.start === this__8824.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8824.meta, this__8824.v, this__8824.start, this__8824.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8825 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8826 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8827 = this;
  return new cljs.core.Subvec(meta, this__8827.v, this__8827.start, this__8827.end, this__8827.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8828 = this;
  return this__8828.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8829 = this;
  return cljs.core._nth.call(null, this__8829.v, this__8829.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8830 = this;
  return cljs.core._nth.call(null, this__8830.v, this__8830.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8831 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8831.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8834 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8834, 0, tl.length);
  return ret__8834
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8838 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8839 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8838, subidx__8839, level === 5 ? tail_node : function() {
    var child__8840 = cljs.core.pv_aget.call(null, ret__8838, subidx__8839);
    if(!(child__8840 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8840, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8838
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8845 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8846 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8847 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8845, subidx__8846));
    if(function() {
      var and__3822__auto____8848 = new_child__8847 == null;
      if(and__3822__auto____8848) {
        return subidx__8846 === 0
      }else {
        return and__3822__auto____8848
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8845, subidx__8846, new_child__8847);
      return node__8845
    }
  }else {
    if(subidx__8846 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8845, subidx__8846, null);
        return node__8845
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8853 = 0 <= i;
    if(and__3822__auto____8853) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8853
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8854 = tv.root;
      var node__8855 = root__8854;
      var level__8856 = tv.shift;
      while(true) {
        if(level__8856 > 0) {
          var G__8857 = cljs.core.tv_ensure_editable.call(null, root__8854.edit, cljs.core.pv_aget.call(null, node__8855, i >>> level__8856 & 31));
          var G__8858 = level__8856 - 5;
          node__8855 = G__8857;
          level__8856 = G__8858;
          continue
        }else {
          return node__8855.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8898 = null;
  var G__8898__2 = function(this_sym8861, k) {
    var this__8863 = this;
    var this_sym8861__8864 = this;
    var coll__8865 = this_sym8861__8864;
    return coll__8865.cljs$core$ILookup$_lookup$arity$2(coll__8865, k)
  };
  var G__8898__3 = function(this_sym8862, k, not_found) {
    var this__8863 = this;
    var this_sym8862__8866 = this;
    var coll__8867 = this_sym8862__8866;
    return coll__8867.cljs$core$ILookup$_lookup$arity$3(coll__8867, k, not_found)
  };
  G__8898 = function(this_sym8862, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8898__2.call(this, this_sym8862, k);
      case 3:
        return G__8898__3.call(this, this_sym8862, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8898
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8859, args8860) {
  var this__8868 = this;
  return this_sym8859.call.apply(this_sym8859, [this_sym8859].concat(args8860.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8869 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8870 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8871 = this;
  if(this__8871.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8872 = this;
  if(function() {
    var and__3822__auto____8873 = 0 <= n;
    if(and__3822__auto____8873) {
      return n < this__8872.cnt
    }else {
      return and__3822__auto____8873
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8874 = this;
  if(this__8874.root.edit) {
    return this__8874.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8875 = this;
  if(this__8875.root.edit) {
    if(function() {
      var and__3822__auto____8876 = 0 <= n;
      if(and__3822__auto____8876) {
        return n < this__8875.cnt
      }else {
        return and__3822__auto____8876
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8875.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8881 = function go(level, node) {
          var node__8879 = cljs.core.tv_ensure_editable.call(null, this__8875.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8879, n & 31, val);
            return node__8879
          }else {
            var subidx__8880 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8879, subidx__8880, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8879, subidx__8880)));
            return node__8879
          }
        }.call(null, this__8875.shift, this__8875.root);
        this__8875.root = new_root__8881;
        return tcoll
      }
    }else {
      if(n === this__8875.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8875.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8882 = this;
  if(this__8882.root.edit) {
    if(this__8882.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8882.cnt) {
        this__8882.cnt = 0;
        return tcoll
      }else {
        if((this__8882.cnt - 1 & 31) > 0) {
          this__8882.cnt = this__8882.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8883 = cljs.core.editable_array_for.call(null, tcoll, this__8882.cnt - 2);
            var new_root__8885 = function() {
              var nr__8884 = cljs.core.tv_pop_tail.call(null, tcoll, this__8882.shift, this__8882.root);
              if(!(nr__8884 == null)) {
                return nr__8884
              }else {
                return new cljs.core.VectorNode(this__8882.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8886 = 5 < this__8882.shift;
              if(and__3822__auto____8886) {
                return cljs.core.pv_aget.call(null, new_root__8885, 1) == null
              }else {
                return and__3822__auto____8886
              }
            }()) {
              var new_root__8887 = cljs.core.tv_ensure_editable.call(null, this__8882.root.edit, cljs.core.pv_aget.call(null, new_root__8885, 0));
              this__8882.root = new_root__8887;
              this__8882.shift = this__8882.shift - 5;
              this__8882.cnt = this__8882.cnt - 1;
              this__8882.tail = new_tail__8883;
              return tcoll
            }else {
              this__8882.root = new_root__8885;
              this__8882.cnt = this__8882.cnt - 1;
              this__8882.tail = new_tail__8883;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8888 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8889 = this;
  if(this__8889.root.edit) {
    if(this__8889.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8889.tail[this__8889.cnt & 31] = o;
      this__8889.cnt = this__8889.cnt + 1;
      return tcoll
    }else {
      var tail_node__8890 = new cljs.core.VectorNode(this__8889.root.edit, this__8889.tail);
      var new_tail__8891 = cljs.core.make_array.call(null, 32);
      new_tail__8891[0] = o;
      this__8889.tail = new_tail__8891;
      if(this__8889.cnt >>> 5 > 1 << this__8889.shift) {
        var new_root_array__8892 = cljs.core.make_array.call(null, 32);
        var new_shift__8893 = this__8889.shift + 5;
        new_root_array__8892[0] = this__8889.root;
        new_root_array__8892[1] = cljs.core.new_path.call(null, this__8889.root.edit, this__8889.shift, tail_node__8890);
        this__8889.root = new cljs.core.VectorNode(this__8889.root.edit, new_root_array__8892);
        this__8889.shift = new_shift__8893;
        this__8889.cnt = this__8889.cnt + 1;
        return tcoll
      }else {
        var new_root__8894 = cljs.core.tv_push_tail.call(null, tcoll, this__8889.shift, this__8889.root, tail_node__8890);
        this__8889.root = new_root__8894;
        this__8889.cnt = this__8889.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8895 = this;
  if(this__8895.root.edit) {
    this__8895.root.edit = null;
    var len__8896 = this__8895.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8897 = cljs.core.make_array.call(null, len__8896);
    cljs.core.array_copy.call(null, this__8895.tail, 0, trimmed_tail__8897, 0, len__8896);
    return new cljs.core.PersistentVector(null, this__8895.cnt, this__8895.shift, this__8895.root, trimmed_tail__8897, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8899 = this;
  var h__2190__auto____8900 = this__8899.__hash;
  if(!(h__2190__auto____8900 == null)) {
    return h__2190__auto____8900
  }else {
    var h__2190__auto____8901 = cljs.core.hash_coll.call(null, coll);
    this__8899.__hash = h__2190__auto____8901;
    return h__2190__auto____8901
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8902 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8903 = this;
  var this__8904 = this;
  return cljs.core.pr_str.call(null, this__8904)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8905 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8906 = this;
  return cljs.core._first.call(null, this__8906.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8907 = this;
  var temp__3971__auto____8908 = cljs.core.next.call(null, this__8907.front);
  if(temp__3971__auto____8908) {
    var f1__8909 = temp__3971__auto____8908;
    return new cljs.core.PersistentQueueSeq(this__8907.meta, f1__8909, this__8907.rear, null)
  }else {
    if(this__8907.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8907.meta, this__8907.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8910 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8911 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8911.front, this__8911.rear, this__8911.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8912 = this;
  return this__8912.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8913 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8913.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8914 = this;
  var h__2190__auto____8915 = this__8914.__hash;
  if(!(h__2190__auto____8915 == null)) {
    return h__2190__auto____8915
  }else {
    var h__2190__auto____8916 = cljs.core.hash_coll.call(null, coll);
    this__8914.__hash = h__2190__auto____8916;
    return h__2190__auto____8916
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8917 = this;
  if(cljs.core.truth_(this__8917.front)) {
    return new cljs.core.PersistentQueue(this__8917.meta, this__8917.count + 1, this__8917.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8918 = this__8917.rear;
      if(cljs.core.truth_(or__3824__auto____8918)) {
        return or__3824__auto____8918
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8917.meta, this__8917.count + 1, cljs.core.conj.call(null, this__8917.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8919 = this;
  var this__8920 = this;
  return cljs.core.pr_str.call(null, this__8920)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8921 = this;
  var rear__8922 = cljs.core.seq.call(null, this__8921.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8923 = this__8921.front;
    if(cljs.core.truth_(or__3824__auto____8923)) {
      return or__3824__auto____8923
    }else {
      return rear__8922
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8921.front, cljs.core.seq.call(null, rear__8922), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8924 = this;
  return this__8924.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8925 = this;
  return cljs.core._first.call(null, this__8925.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8926 = this;
  if(cljs.core.truth_(this__8926.front)) {
    var temp__3971__auto____8927 = cljs.core.next.call(null, this__8926.front);
    if(temp__3971__auto____8927) {
      var f1__8928 = temp__3971__auto____8927;
      return new cljs.core.PersistentQueue(this__8926.meta, this__8926.count - 1, f1__8928, this__8926.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8926.meta, this__8926.count - 1, cljs.core.seq.call(null, this__8926.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8929 = this;
  return cljs.core.first.call(null, this__8929.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8930 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8931 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8932 = this;
  return new cljs.core.PersistentQueue(meta, this__8932.count, this__8932.front, this__8932.rear, this__8932.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8933 = this;
  return this__8933.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8934 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8935 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8938 = array.length;
  var i__8939 = 0;
  while(true) {
    if(i__8939 < len__8938) {
      if(k === array[i__8939]) {
        return i__8939
      }else {
        var G__8940 = i__8939 + incr;
        i__8939 = G__8940;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8943 = cljs.core.hash.call(null, a);
  var b__8944 = cljs.core.hash.call(null, b);
  if(a__8943 < b__8944) {
    return-1
  }else {
    if(a__8943 > b__8944) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8952 = m.keys;
  var len__8953 = ks__8952.length;
  var so__8954 = m.strobj;
  var out__8955 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8956 = 0;
  var out__8957 = cljs.core.transient$.call(null, out__8955);
  while(true) {
    if(i__8956 < len__8953) {
      var k__8958 = ks__8952[i__8956];
      var G__8959 = i__8956 + 1;
      var G__8960 = cljs.core.assoc_BANG_.call(null, out__8957, k__8958, so__8954[k__8958]);
      i__8956 = G__8959;
      out__8957 = G__8960;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8957, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8966 = {};
  var l__8967 = ks.length;
  var i__8968 = 0;
  while(true) {
    if(i__8968 < l__8967) {
      var k__8969 = ks[i__8968];
      new_obj__8966[k__8969] = obj[k__8969];
      var G__8970 = i__8968 + 1;
      i__8968 = G__8970;
      continue
    }else {
    }
    break
  }
  return new_obj__8966
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8973 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8974 = this;
  var h__2190__auto____8975 = this__8974.__hash;
  if(!(h__2190__auto____8975 == null)) {
    return h__2190__auto____8975
  }else {
    var h__2190__auto____8976 = cljs.core.hash_imap.call(null, coll);
    this__8974.__hash = h__2190__auto____8976;
    return h__2190__auto____8976
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8977 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8978 = this;
  if(function() {
    var and__3822__auto____8979 = goog.isString(k);
    if(and__3822__auto____8979) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8978.keys) == null)
    }else {
      return and__3822__auto____8979
    }
  }()) {
    return this__8978.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8980 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8981 = this__8980.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8981) {
        return or__3824__auto____8981
      }else {
        return this__8980.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8980.keys) == null)) {
        var new_strobj__8982 = cljs.core.obj_clone.call(null, this__8980.strobj, this__8980.keys);
        new_strobj__8982[k] = v;
        return new cljs.core.ObjMap(this__8980.meta, this__8980.keys, new_strobj__8982, this__8980.update_count + 1, null)
      }else {
        var new_strobj__8983 = cljs.core.obj_clone.call(null, this__8980.strobj, this__8980.keys);
        var new_keys__8984 = this__8980.keys.slice();
        new_strobj__8983[k] = v;
        new_keys__8984.push(k);
        return new cljs.core.ObjMap(this__8980.meta, new_keys__8984, new_strobj__8983, this__8980.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8985 = this;
  if(function() {
    var and__3822__auto____8986 = goog.isString(k);
    if(and__3822__auto____8986) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8985.keys) == null)
    }else {
      return and__3822__auto____8986
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9008 = null;
  var G__9008__2 = function(this_sym8987, k) {
    var this__8989 = this;
    var this_sym8987__8990 = this;
    var coll__8991 = this_sym8987__8990;
    return coll__8991.cljs$core$ILookup$_lookup$arity$2(coll__8991, k)
  };
  var G__9008__3 = function(this_sym8988, k, not_found) {
    var this__8989 = this;
    var this_sym8988__8992 = this;
    var coll__8993 = this_sym8988__8992;
    return coll__8993.cljs$core$ILookup$_lookup$arity$3(coll__8993, k, not_found)
  };
  G__9008 = function(this_sym8988, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9008__2.call(this, this_sym8988, k);
      case 3:
        return G__9008__3.call(this, this_sym8988, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9008
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8971, args8972) {
  var this__8994 = this;
  return this_sym8971.call.apply(this_sym8971, [this_sym8971].concat(args8972.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8995 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8996 = this;
  var this__8997 = this;
  return cljs.core.pr_str.call(null, this__8997)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8998 = this;
  if(this__8998.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8961_SHARP_) {
      return cljs.core.vector.call(null, p1__8961_SHARP_, this__8998.strobj[p1__8961_SHARP_])
    }, this__8998.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8999 = this;
  return this__8999.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9000 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9001 = this;
  return new cljs.core.ObjMap(meta, this__9001.keys, this__9001.strobj, this__9001.update_count, this__9001.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9002 = this;
  return this__9002.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9003 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9003.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9004 = this;
  if(function() {
    var and__3822__auto____9005 = goog.isString(k);
    if(and__3822__auto____9005) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9004.keys) == null)
    }else {
      return and__3822__auto____9005
    }
  }()) {
    var new_keys__9006 = this__9004.keys.slice();
    var new_strobj__9007 = cljs.core.obj_clone.call(null, this__9004.strobj, this__9004.keys);
    new_keys__9006.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9006), 1);
    cljs.core.js_delete.call(null, new_strobj__9007, k);
    return new cljs.core.ObjMap(this__9004.meta, new_keys__9006, new_strobj__9007, this__9004.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9012 = this;
  var h__2190__auto____9013 = this__9012.__hash;
  if(!(h__2190__auto____9013 == null)) {
    return h__2190__auto____9013
  }else {
    var h__2190__auto____9014 = cljs.core.hash_imap.call(null, coll);
    this__9012.__hash = h__2190__auto____9014;
    return h__2190__auto____9014
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9015 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9016 = this;
  var bucket__9017 = this__9016.hashobj[cljs.core.hash.call(null, k)];
  var i__9018 = cljs.core.truth_(bucket__9017) ? cljs.core.scan_array.call(null, 2, k, bucket__9017) : null;
  if(cljs.core.truth_(i__9018)) {
    return bucket__9017[i__9018 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9019 = this;
  var h__9020 = cljs.core.hash.call(null, k);
  var bucket__9021 = this__9019.hashobj[h__9020];
  if(cljs.core.truth_(bucket__9021)) {
    var new_bucket__9022 = bucket__9021.slice();
    var new_hashobj__9023 = goog.object.clone(this__9019.hashobj);
    new_hashobj__9023[h__9020] = new_bucket__9022;
    var temp__3971__auto____9024 = cljs.core.scan_array.call(null, 2, k, new_bucket__9022);
    if(cljs.core.truth_(temp__3971__auto____9024)) {
      var i__9025 = temp__3971__auto____9024;
      new_bucket__9022[i__9025 + 1] = v;
      return new cljs.core.HashMap(this__9019.meta, this__9019.count, new_hashobj__9023, null)
    }else {
      new_bucket__9022.push(k, v);
      return new cljs.core.HashMap(this__9019.meta, this__9019.count + 1, new_hashobj__9023, null)
    }
  }else {
    var new_hashobj__9026 = goog.object.clone(this__9019.hashobj);
    new_hashobj__9026[h__9020] = [k, v];
    return new cljs.core.HashMap(this__9019.meta, this__9019.count + 1, new_hashobj__9026, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9027 = this;
  var bucket__9028 = this__9027.hashobj[cljs.core.hash.call(null, k)];
  var i__9029 = cljs.core.truth_(bucket__9028) ? cljs.core.scan_array.call(null, 2, k, bucket__9028) : null;
  if(cljs.core.truth_(i__9029)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9054 = null;
  var G__9054__2 = function(this_sym9030, k) {
    var this__9032 = this;
    var this_sym9030__9033 = this;
    var coll__9034 = this_sym9030__9033;
    return coll__9034.cljs$core$ILookup$_lookup$arity$2(coll__9034, k)
  };
  var G__9054__3 = function(this_sym9031, k, not_found) {
    var this__9032 = this;
    var this_sym9031__9035 = this;
    var coll__9036 = this_sym9031__9035;
    return coll__9036.cljs$core$ILookup$_lookup$arity$3(coll__9036, k, not_found)
  };
  G__9054 = function(this_sym9031, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9054__2.call(this, this_sym9031, k);
      case 3:
        return G__9054__3.call(this, this_sym9031, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9054
}();
cljs.core.HashMap.prototype.apply = function(this_sym9010, args9011) {
  var this__9037 = this;
  return this_sym9010.call.apply(this_sym9010, [this_sym9010].concat(args9011.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9038 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9039 = this;
  var this__9040 = this;
  return cljs.core.pr_str.call(null, this__9040)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9041 = this;
  if(this__9041.count > 0) {
    var hashes__9042 = cljs.core.js_keys.call(null, this__9041.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9009_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9041.hashobj[p1__9009_SHARP_]))
    }, hashes__9042)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9043 = this;
  return this__9043.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9044 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9045 = this;
  return new cljs.core.HashMap(meta, this__9045.count, this__9045.hashobj, this__9045.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9046 = this;
  return this__9046.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9047 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9047.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9048 = this;
  var h__9049 = cljs.core.hash.call(null, k);
  var bucket__9050 = this__9048.hashobj[h__9049];
  var i__9051 = cljs.core.truth_(bucket__9050) ? cljs.core.scan_array.call(null, 2, k, bucket__9050) : null;
  if(cljs.core.not.call(null, i__9051)) {
    return coll
  }else {
    var new_hashobj__9052 = goog.object.clone(this__9048.hashobj);
    if(3 > bucket__9050.length) {
      cljs.core.js_delete.call(null, new_hashobj__9052, h__9049)
    }else {
      var new_bucket__9053 = bucket__9050.slice();
      new_bucket__9053.splice(i__9051, 2);
      new_hashobj__9052[h__9049] = new_bucket__9053
    }
    return new cljs.core.HashMap(this__9048.meta, this__9048.count - 1, new_hashobj__9052, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9055 = ks.length;
  var i__9056 = 0;
  var out__9057 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9056 < len__9055) {
      var G__9058 = i__9056 + 1;
      var G__9059 = cljs.core.assoc.call(null, out__9057, ks[i__9056], vs[i__9056]);
      i__9056 = G__9058;
      out__9057 = G__9059;
      continue
    }else {
      return out__9057
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9063 = m.arr;
  var len__9064 = arr__9063.length;
  var i__9065 = 0;
  while(true) {
    if(len__9064 <= i__9065) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9063[i__9065], k)) {
        return i__9065
      }else {
        if("\ufdd0'else") {
          var G__9066 = i__9065 + 2;
          i__9065 = G__9066;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9069 = this;
  return new cljs.core.TransientArrayMap({}, this__9069.arr.length, this__9069.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9070 = this;
  var h__2190__auto____9071 = this__9070.__hash;
  if(!(h__2190__auto____9071 == null)) {
    return h__2190__auto____9071
  }else {
    var h__2190__auto____9072 = cljs.core.hash_imap.call(null, coll);
    this__9070.__hash = h__2190__auto____9072;
    return h__2190__auto____9072
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9073 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9074 = this;
  var idx__9075 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9075 === -1) {
    return not_found
  }else {
    return this__9074.arr[idx__9075 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9076 = this;
  var idx__9077 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9077 === -1) {
    if(this__9076.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9076.meta, this__9076.cnt + 1, function() {
        var G__9078__9079 = this__9076.arr.slice();
        G__9078__9079.push(k);
        G__9078__9079.push(v);
        return G__9078__9079
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9076.arr[idx__9077 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9076.meta, this__9076.cnt, function() {
          var G__9080__9081 = this__9076.arr.slice();
          G__9080__9081[idx__9077 + 1] = v;
          return G__9080__9081
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9082 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9114 = null;
  var G__9114__2 = function(this_sym9083, k) {
    var this__9085 = this;
    var this_sym9083__9086 = this;
    var coll__9087 = this_sym9083__9086;
    return coll__9087.cljs$core$ILookup$_lookup$arity$2(coll__9087, k)
  };
  var G__9114__3 = function(this_sym9084, k, not_found) {
    var this__9085 = this;
    var this_sym9084__9088 = this;
    var coll__9089 = this_sym9084__9088;
    return coll__9089.cljs$core$ILookup$_lookup$arity$3(coll__9089, k, not_found)
  };
  G__9114 = function(this_sym9084, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9114__2.call(this, this_sym9084, k);
      case 3:
        return G__9114__3.call(this, this_sym9084, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9114
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9067, args9068) {
  var this__9090 = this;
  return this_sym9067.call.apply(this_sym9067, [this_sym9067].concat(args9068.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9091 = this;
  var len__9092 = this__9091.arr.length;
  var i__9093 = 0;
  var init__9094 = init;
  while(true) {
    if(i__9093 < len__9092) {
      var init__9095 = f.call(null, init__9094, this__9091.arr[i__9093], this__9091.arr[i__9093 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9095)) {
        return cljs.core.deref.call(null, init__9095)
      }else {
        var G__9115 = i__9093 + 2;
        var G__9116 = init__9095;
        i__9093 = G__9115;
        init__9094 = G__9116;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9096 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9097 = this;
  var this__9098 = this;
  return cljs.core.pr_str.call(null, this__9098)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9099 = this;
  if(this__9099.cnt > 0) {
    var len__9100 = this__9099.arr.length;
    var array_map_seq__9101 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9100) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9099.arr[i], this__9099.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9101.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9102 = this;
  return this__9102.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9103 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9104 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9104.cnt, this__9104.arr, this__9104.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9105 = this;
  return this__9105.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9106 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9106.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9107 = this;
  var idx__9108 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9108 >= 0) {
    var len__9109 = this__9107.arr.length;
    var new_len__9110 = len__9109 - 2;
    if(new_len__9110 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9111 = cljs.core.make_array.call(null, new_len__9110);
      var s__9112 = 0;
      var d__9113 = 0;
      while(true) {
        if(s__9112 >= len__9109) {
          return new cljs.core.PersistentArrayMap(this__9107.meta, this__9107.cnt - 1, new_arr__9111, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9107.arr[s__9112])) {
            var G__9117 = s__9112 + 2;
            var G__9118 = d__9113;
            s__9112 = G__9117;
            d__9113 = G__9118;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9111[d__9113] = this__9107.arr[s__9112];
              new_arr__9111[d__9113 + 1] = this__9107.arr[s__9112 + 1];
              var G__9119 = s__9112 + 2;
              var G__9120 = d__9113 + 2;
              s__9112 = G__9119;
              d__9113 = G__9120;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__9121 = cljs.core.count.call(null, ks);
  var i__9122 = 0;
  var out__9123 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9122 < len__9121) {
      var G__9124 = i__9122 + 1;
      var G__9125 = cljs.core.assoc_BANG_.call(null, out__9123, ks[i__9122], vs[i__9122]);
      i__9122 = G__9124;
      out__9123 = G__9125;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9123)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9126 = this;
  if(cljs.core.truth_(this__9126.editable_QMARK_)) {
    var idx__9127 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9127 >= 0) {
      this__9126.arr[idx__9127] = this__9126.arr[this__9126.len - 2];
      this__9126.arr[idx__9127 + 1] = this__9126.arr[this__9126.len - 1];
      var G__9128__9129 = this__9126.arr;
      G__9128__9129.pop();
      G__9128__9129.pop();
      G__9128__9129;
      this__9126.len = this__9126.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9130 = this;
  if(cljs.core.truth_(this__9130.editable_QMARK_)) {
    var idx__9131 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9131 === -1) {
      if(this__9130.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9130.len = this__9130.len + 2;
        this__9130.arr.push(key);
        this__9130.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9130.len, this__9130.arr), key, val)
      }
    }else {
      if(val === this__9130.arr[idx__9131 + 1]) {
        return tcoll
      }else {
        this__9130.arr[idx__9131 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9132 = this;
  if(cljs.core.truth_(this__9132.editable_QMARK_)) {
    if(function() {
      var G__9133__9134 = o;
      if(G__9133__9134) {
        if(function() {
          var or__3824__auto____9135 = G__9133__9134.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9135) {
            return or__3824__auto____9135
          }else {
            return G__9133__9134.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9133__9134.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9133__9134)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9133__9134)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9136 = cljs.core.seq.call(null, o);
      var tcoll__9137 = tcoll;
      while(true) {
        var temp__3971__auto____9138 = cljs.core.first.call(null, es__9136);
        if(cljs.core.truth_(temp__3971__auto____9138)) {
          var e__9139 = temp__3971__auto____9138;
          var G__9145 = cljs.core.next.call(null, es__9136);
          var G__9146 = tcoll__9137.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9137, cljs.core.key.call(null, e__9139), cljs.core.val.call(null, e__9139));
          es__9136 = G__9145;
          tcoll__9137 = G__9146;
          continue
        }else {
          return tcoll__9137
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9140 = this;
  if(cljs.core.truth_(this__9140.editable_QMARK_)) {
    this__9140.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9140.len, 2), this__9140.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9141 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9142 = this;
  if(cljs.core.truth_(this__9142.editable_QMARK_)) {
    var idx__9143 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9143 === -1) {
      return not_found
    }else {
      return this__9142.arr[idx__9143 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9144 = this;
  if(cljs.core.truth_(this__9144.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9144.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9149 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9150 = 0;
  while(true) {
    if(i__9150 < len) {
      var G__9151 = cljs.core.assoc_BANG_.call(null, out__9149, arr[i__9150], arr[i__9150 + 1]);
      var G__9152 = i__9150 + 2;
      out__9149 = G__9151;
      i__9150 = G__9152;
      continue
    }else {
      return out__9149
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2308__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__9157__9158 = arr.slice();
    G__9157__9158[i] = a;
    return G__9157__9158
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9159__9160 = arr.slice();
    G__9159__9160[i] = a;
    G__9159__9160[j] = b;
    return G__9159__9160
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__9162 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9162, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9162, 2 * i, new_arr__9162.length - 2 * i);
  return new_arr__9162
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__9165 = inode.ensure_editable(edit);
    editable__9165.arr[i] = a;
    return editable__9165
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9166 = inode.ensure_editable(edit);
    editable__9166.arr[i] = a;
    editable__9166.arr[j] = b;
    return editable__9166
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__9173 = arr.length;
  var i__9174 = 0;
  var init__9175 = init;
  while(true) {
    if(i__9174 < len__9173) {
      var init__9178 = function() {
        var k__9176 = arr[i__9174];
        if(!(k__9176 == null)) {
          return f.call(null, init__9175, k__9176, arr[i__9174 + 1])
        }else {
          var node__9177 = arr[i__9174 + 1];
          if(!(node__9177 == null)) {
            return node__9177.kv_reduce(f, init__9175)
          }else {
            return init__9175
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9178)) {
        return cljs.core.deref.call(null, init__9178)
      }else {
        var G__9179 = i__9174 + 2;
        var G__9180 = init__9178;
        i__9174 = G__9179;
        init__9175 = G__9180;
        continue
      }
    }else {
      return init__9175
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__9181 = this;
  var inode__9182 = this;
  if(this__9181.bitmap === bit) {
    return null
  }else {
    var editable__9183 = inode__9182.ensure_editable(e);
    var earr__9184 = editable__9183.arr;
    var len__9185 = earr__9184.length;
    editable__9183.bitmap = bit ^ editable__9183.bitmap;
    cljs.core.array_copy.call(null, earr__9184, 2 * (i + 1), earr__9184, 2 * i, len__9185 - 2 * (i + 1));
    earr__9184[len__9185 - 2] = null;
    earr__9184[len__9185 - 1] = null;
    return editable__9183
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9186 = this;
  var inode__9187 = this;
  var bit__9188 = 1 << (hash >>> shift & 31);
  var idx__9189 = cljs.core.bitmap_indexed_node_index.call(null, this__9186.bitmap, bit__9188);
  if((this__9186.bitmap & bit__9188) === 0) {
    var n__9190 = cljs.core.bit_count.call(null, this__9186.bitmap);
    if(2 * n__9190 < this__9186.arr.length) {
      var editable__9191 = inode__9187.ensure_editable(edit);
      var earr__9192 = editable__9191.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9192, 2 * idx__9189, earr__9192, 2 * (idx__9189 + 1), 2 * (n__9190 - idx__9189));
      earr__9192[2 * idx__9189] = key;
      earr__9192[2 * idx__9189 + 1] = val;
      editable__9191.bitmap = editable__9191.bitmap | bit__9188;
      return editable__9191
    }else {
      if(n__9190 >= 16) {
        var nodes__9193 = cljs.core.make_array.call(null, 32);
        var jdx__9194 = hash >>> shift & 31;
        nodes__9193[jdx__9194] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9195 = 0;
        var j__9196 = 0;
        while(true) {
          if(i__9195 < 32) {
            if((this__9186.bitmap >>> i__9195 & 1) === 0) {
              var G__9249 = i__9195 + 1;
              var G__9250 = j__9196;
              i__9195 = G__9249;
              j__9196 = G__9250;
              continue
            }else {
              nodes__9193[i__9195] = !(this__9186.arr[j__9196] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9186.arr[j__9196]), this__9186.arr[j__9196], this__9186.arr[j__9196 + 1], added_leaf_QMARK_) : this__9186.arr[j__9196 + 1];
              var G__9251 = i__9195 + 1;
              var G__9252 = j__9196 + 2;
              i__9195 = G__9251;
              j__9196 = G__9252;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9190 + 1, nodes__9193)
      }else {
        if("\ufdd0'else") {
          var new_arr__9197 = cljs.core.make_array.call(null, 2 * (n__9190 + 4));
          cljs.core.array_copy.call(null, this__9186.arr, 0, new_arr__9197, 0, 2 * idx__9189);
          new_arr__9197[2 * idx__9189] = key;
          new_arr__9197[2 * idx__9189 + 1] = val;
          cljs.core.array_copy.call(null, this__9186.arr, 2 * idx__9189, new_arr__9197, 2 * (idx__9189 + 1), 2 * (n__9190 - idx__9189));
          added_leaf_QMARK_.val = true;
          var editable__9198 = inode__9187.ensure_editable(edit);
          editable__9198.arr = new_arr__9197;
          editable__9198.bitmap = editable__9198.bitmap | bit__9188;
          return editable__9198
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9199 = this__9186.arr[2 * idx__9189];
    var val_or_node__9200 = this__9186.arr[2 * idx__9189 + 1];
    if(key_or_nil__9199 == null) {
      var n__9201 = val_or_node__9200.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9201 === val_or_node__9200) {
        return inode__9187
      }else {
        return cljs.core.edit_and_set.call(null, inode__9187, edit, 2 * idx__9189 + 1, n__9201)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9199)) {
        if(val === val_or_node__9200) {
          return inode__9187
        }else {
          return cljs.core.edit_and_set.call(null, inode__9187, edit, 2 * idx__9189 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9187, edit, 2 * idx__9189, null, 2 * idx__9189 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9199, val_or_node__9200, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9202 = this;
  var inode__9203 = this;
  return cljs.core.create_inode_seq.call(null, this__9202.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9204 = this;
  var inode__9205 = this;
  var bit__9206 = 1 << (hash >>> shift & 31);
  if((this__9204.bitmap & bit__9206) === 0) {
    return inode__9205
  }else {
    var idx__9207 = cljs.core.bitmap_indexed_node_index.call(null, this__9204.bitmap, bit__9206);
    var key_or_nil__9208 = this__9204.arr[2 * idx__9207];
    var val_or_node__9209 = this__9204.arr[2 * idx__9207 + 1];
    if(key_or_nil__9208 == null) {
      var n__9210 = val_or_node__9209.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9210 === val_or_node__9209) {
        return inode__9205
      }else {
        if(!(n__9210 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9205, edit, 2 * idx__9207 + 1, n__9210)
        }else {
          if(this__9204.bitmap === bit__9206) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9205.edit_and_remove_pair(edit, bit__9206, idx__9207)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9208)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9205.edit_and_remove_pair(edit, bit__9206, idx__9207)
      }else {
        if("\ufdd0'else") {
          return inode__9205
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9211 = this;
  var inode__9212 = this;
  if(e === this__9211.edit) {
    return inode__9212
  }else {
    var n__9213 = cljs.core.bit_count.call(null, this__9211.bitmap);
    var new_arr__9214 = cljs.core.make_array.call(null, n__9213 < 0 ? 4 : 2 * (n__9213 + 1));
    cljs.core.array_copy.call(null, this__9211.arr, 0, new_arr__9214, 0, 2 * n__9213);
    return new cljs.core.BitmapIndexedNode(e, this__9211.bitmap, new_arr__9214)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9215 = this;
  var inode__9216 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9215.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9217 = this;
  var inode__9218 = this;
  var bit__9219 = 1 << (hash >>> shift & 31);
  if((this__9217.bitmap & bit__9219) === 0) {
    return not_found
  }else {
    var idx__9220 = cljs.core.bitmap_indexed_node_index.call(null, this__9217.bitmap, bit__9219);
    var key_or_nil__9221 = this__9217.arr[2 * idx__9220];
    var val_or_node__9222 = this__9217.arr[2 * idx__9220 + 1];
    if(key_or_nil__9221 == null) {
      return val_or_node__9222.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9221)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9221, val_or_node__9222], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__9223 = this;
  var inode__9224 = this;
  var bit__9225 = 1 << (hash >>> shift & 31);
  if((this__9223.bitmap & bit__9225) === 0) {
    return inode__9224
  }else {
    var idx__9226 = cljs.core.bitmap_indexed_node_index.call(null, this__9223.bitmap, bit__9225);
    var key_or_nil__9227 = this__9223.arr[2 * idx__9226];
    var val_or_node__9228 = this__9223.arr[2 * idx__9226 + 1];
    if(key_or_nil__9227 == null) {
      var n__9229 = val_or_node__9228.inode_without(shift + 5, hash, key);
      if(n__9229 === val_or_node__9228) {
        return inode__9224
      }else {
        if(!(n__9229 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9223.bitmap, cljs.core.clone_and_set.call(null, this__9223.arr, 2 * idx__9226 + 1, n__9229))
        }else {
          if(this__9223.bitmap === bit__9225) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9223.bitmap ^ bit__9225, cljs.core.remove_pair.call(null, this__9223.arr, idx__9226))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9227)) {
        return new cljs.core.BitmapIndexedNode(null, this__9223.bitmap ^ bit__9225, cljs.core.remove_pair.call(null, this__9223.arr, idx__9226))
      }else {
        if("\ufdd0'else") {
          return inode__9224
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9230 = this;
  var inode__9231 = this;
  var bit__9232 = 1 << (hash >>> shift & 31);
  var idx__9233 = cljs.core.bitmap_indexed_node_index.call(null, this__9230.bitmap, bit__9232);
  if((this__9230.bitmap & bit__9232) === 0) {
    var n__9234 = cljs.core.bit_count.call(null, this__9230.bitmap);
    if(n__9234 >= 16) {
      var nodes__9235 = cljs.core.make_array.call(null, 32);
      var jdx__9236 = hash >>> shift & 31;
      nodes__9235[jdx__9236] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9237 = 0;
      var j__9238 = 0;
      while(true) {
        if(i__9237 < 32) {
          if((this__9230.bitmap >>> i__9237 & 1) === 0) {
            var G__9253 = i__9237 + 1;
            var G__9254 = j__9238;
            i__9237 = G__9253;
            j__9238 = G__9254;
            continue
          }else {
            nodes__9235[i__9237] = !(this__9230.arr[j__9238] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9230.arr[j__9238]), this__9230.arr[j__9238], this__9230.arr[j__9238 + 1], added_leaf_QMARK_) : this__9230.arr[j__9238 + 1];
            var G__9255 = i__9237 + 1;
            var G__9256 = j__9238 + 2;
            i__9237 = G__9255;
            j__9238 = G__9256;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9234 + 1, nodes__9235)
    }else {
      var new_arr__9239 = cljs.core.make_array.call(null, 2 * (n__9234 + 1));
      cljs.core.array_copy.call(null, this__9230.arr, 0, new_arr__9239, 0, 2 * idx__9233);
      new_arr__9239[2 * idx__9233] = key;
      new_arr__9239[2 * idx__9233 + 1] = val;
      cljs.core.array_copy.call(null, this__9230.arr, 2 * idx__9233, new_arr__9239, 2 * (idx__9233 + 1), 2 * (n__9234 - idx__9233));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9230.bitmap | bit__9232, new_arr__9239)
    }
  }else {
    var key_or_nil__9240 = this__9230.arr[2 * idx__9233];
    var val_or_node__9241 = this__9230.arr[2 * idx__9233 + 1];
    if(key_or_nil__9240 == null) {
      var n__9242 = val_or_node__9241.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9242 === val_or_node__9241) {
        return inode__9231
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9230.bitmap, cljs.core.clone_and_set.call(null, this__9230.arr, 2 * idx__9233 + 1, n__9242))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9240)) {
        if(val === val_or_node__9241) {
          return inode__9231
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9230.bitmap, cljs.core.clone_and_set.call(null, this__9230.arr, 2 * idx__9233 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9230.bitmap, cljs.core.clone_and_set.call(null, this__9230.arr, 2 * idx__9233, null, 2 * idx__9233 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9240, val_or_node__9241, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9243 = this;
  var inode__9244 = this;
  var bit__9245 = 1 << (hash >>> shift & 31);
  if((this__9243.bitmap & bit__9245) === 0) {
    return not_found
  }else {
    var idx__9246 = cljs.core.bitmap_indexed_node_index.call(null, this__9243.bitmap, bit__9245);
    var key_or_nil__9247 = this__9243.arr[2 * idx__9246];
    var val_or_node__9248 = this__9243.arr[2 * idx__9246 + 1];
    if(key_or_nil__9247 == null) {
      return val_or_node__9248.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9247)) {
        return val_or_node__9248
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__9264 = array_node.arr;
  var len__9265 = 2 * (array_node.cnt - 1);
  var new_arr__9266 = cljs.core.make_array.call(null, len__9265);
  var i__9267 = 0;
  var j__9268 = 1;
  var bitmap__9269 = 0;
  while(true) {
    if(i__9267 < len__9265) {
      if(function() {
        var and__3822__auto____9270 = !(i__9267 === idx);
        if(and__3822__auto____9270) {
          return!(arr__9264[i__9267] == null)
        }else {
          return and__3822__auto____9270
        }
      }()) {
        new_arr__9266[j__9268] = arr__9264[i__9267];
        var G__9271 = i__9267 + 1;
        var G__9272 = j__9268 + 2;
        var G__9273 = bitmap__9269 | 1 << i__9267;
        i__9267 = G__9271;
        j__9268 = G__9272;
        bitmap__9269 = G__9273;
        continue
      }else {
        var G__9274 = i__9267 + 1;
        var G__9275 = j__9268;
        var G__9276 = bitmap__9269;
        i__9267 = G__9274;
        j__9268 = G__9275;
        bitmap__9269 = G__9276;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9269, new_arr__9266)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9277 = this;
  var inode__9278 = this;
  var idx__9279 = hash >>> shift & 31;
  var node__9280 = this__9277.arr[idx__9279];
  if(node__9280 == null) {
    var editable__9281 = cljs.core.edit_and_set.call(null, inode__9278, edit, idx__9279, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9281.cnt = editable__9281.cnt + 1;
    return editable__9281
  }else {
    var n__9282 = node__9280.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9282 === node__9280) {
      return inode__9278
    }else {
      return cljs.core.edit_and_set.call(null, inode__9278, edit, idx__9279, n__9282)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9283 = this;
  var inode__9284 = this;
  return cljs.core.create_array_node_seq.call(null, this__9283.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9285 = this;
  var inode__9286 = this;
  var idx__9287 = hash >>> shift & 31;
  var node__9288 = this__9285.arr[idx__9287];
  if(node__9288 == null) {
    return inode__9286
  }else {
    var n__9289 = node__9288.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9289 === node__9288) {
      return inode__9286
    }else {
      if(n__9289 == null) {
        if(this__9285.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9286, edit, idx__9287)
        }else {
          var editable__9290 = cljs.core.edit_and_set.call(null, inode__9286, edit, idx__9287, n__9289);
          editable__9290.cnt = editable__9290.cnt - 1;
          return editable__9290
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9286, edit, idx__9287, n__9289)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9291 = this;
  var inode__9292 = this;
  if(e === this__9291.edit) {
    return inode__9292
  }else {
    return new cljs.core.ArrayNode(e, this__9291.cnt, this__9291.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9293 = this;
  var inode__9294 = this;
  var len__9295 = this__9293.arr.length;
  var i__9296 = 0;
  var init__9297 = init;
  while(true) {
    if(i__9296 < len__9295) {
      var node__9298 = this__9293.arr[i__9296];
      if(!(node__9298 == null)) {
        var init__9299 = node__9298.kv_reduce(f, init__9297);
        if(cljs.core.reduced_QMARK_.call(null, init__9299)) {
          return cljs.core.deref.call(null, init__9299)
        }else {
          var G__9318 = i__9296 + 1;
          var G__9319 = init__9299;
          i__9296 = G__9318;
          init__9297 = G__9319;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9297
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9300 = this;
  var inode__9301 = this;
  var idx__9302 = hash >>> shift & 31;
  var node__9303 = this__9300.arr[idx__9302];
  if(!(node__9303 == null)) {
    return node__9303.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9304 = this;
  var inode__9305 = this;
  var idx__9306 = hash >>> shift & 31;
  var node__9307 = this__9304.arr[idx__9306];
  if(!(node__9307 == null)) {
    var n__9308 = node__9307.inode_without(shift + 5, hash, key);
    if(n__9308 === node__9307) {
      return inode__9305
    }else {
      if(n__9308 == null) {
        if(this__9304.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9305, null, idx__9306)
        }else {
          return new cljs.core.ArrayNode(null, this__9304.cnt - 1, cljs.core.clone_and_set.call(null, this__9304.arr, idx__9306, n__9308))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9304.cnt, cljs.core.clone_and_set.call(null, this__9304.arr, idx__9306, n__9308))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9305
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9309 = this;
  var inode__9310 = this;
  var idx__9311 = hash >>> shift & 31;
  var node__9312 = this__9309.arr[idx__9311];
  if(node__9312 == null) {
    return new cljs.core.ArrayNode(null, this__9309.cnt + 1, cljs.core.clone_and_set.call(null, this__9309.arr, idx__9311, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9313 = node__9312.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9313 === node__9312) {
      return inode__9310
    }else {
      return new cljs.core.ArrayNode(null, this__9309.cnt, cljs.core.clone_and_set.call(null, this__9309.arr, idx__9311, n__9313))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9314 = this;
  var inode__9315 = this;
  var idx__9316 = hash >>> shift & 31;
  var node__9317 = this__9314.arr[idx__9316];
  if(!(node__9317 == null)) {
    return node__9317.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9322 = 2 * cnt;
  var i__9323 = 0;
  while(true) {
    if(i__9323 < lim__9322) {
      if(cljs.core.key_test.call(null, key, arr[i__9323])) {
        return i__9323
      }else {
        var G__9324 = i__9323 + 2;
        i__9323 = G__9324;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9325 = this;
  var inode__9326 = this;
  if(hash === this__9325.collision_hash) {
    var idx__9327 = cljs.core.hash_collision_node_find_index.call(null, this__9325.arr, this__9325.cnt, key);
    if(idx__9327 === -1) {
      if(this__9325.arr.length > 2 * this__9325.cnt) {
        var editable__9328 = cljs.core.edit_and_set.call(null, inode__9326, edit, 2 * this__9325.cnt, key, 2 * this__9325.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9328.cnt = editable__9328.cnt + 1;
        return editable__9328
      }else {
        var len__9329 = this__9325.arr.length;
        var new_arr__9330 = cljs.core.make_array.call(null, len__9329 + 2);
        cljs.core.array_copy.call(null, this__9325.arr, 0, new_arr__9330, 0, len__9329);
        new_arr__9330[len__9329] = key;
        new_arr__9330[len__9329 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9326.ensure_editable_array(edit, this__9325.cnt + 1, new_arr__9330)
      }
    }else {
      if(this__9325.arr[idx__9327 + 1] === val) {
        return inode__9326
      }else {
        return cljs.core.edit_and_set.call(null, inode__9326, edit, idx__9327 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9325.collision_hash >>> shift & 31), [null, inode__9326, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9331 = this;
  var inode__9332 = this;
  return cljs.core.create_inode_seq.call(null, this__9331.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9333 = this;
  var inode__9334 = this;
  var idx__9335 = cljs.core.hash_collision_node_find_index.call(null, this__9333.arr, this__9333.cnt, key);
  if(idx__9335 === -1) {
    return inode__9334
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9333.cnt === 1) {
      return null
    }else {
      var editable__9336 = inode__9334.ensure_editable(edit);
      var earr__9337 = editable__9336.arr;
      earr__9337[idx__9335] = earr__9337[2 * this__9333.cnt - 2];
      earr__9337[idx__9335 + 1] = earr__9337[2 * this__9333.cnt - 1];
      earr__9337[2 * this__9333.cnt - 1] = null;
      earr__9337[2 * this__9333.cnt - 2] = null;
      editable__9336.cnt = editable__9336.cnt - 1;
      return editable__9336
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9338 = this;
  var inode__9339 = this;
  if(e === this__9338.edit) {
    return inode__9339
  }else {
    var new_arr__9340 = cljs.core.make_array.call(null, 2 * (this__9338.cnt + 1));
    cljs.core.array_copy.call(null, this__9338.arr, 0, new_arr__9340, 0, 2 * this__9338.cnt);
    return new cljs.core.HashCollisionNode(e, this__9338.collision_hash, this__9338.cnt, new_arr__9340)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9341 = this;
  var inode__9342 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9341.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9343 = this;
  var inode__9344 = this;
  var idx__9345 = cljs.core.hash_collision_node_find_index.call(null, this__9343.arr, this__9343.cnt, key);
  if(idx__9345 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9343.arr[idx__9345])) {
      return cljs.core.PersistentVector.fromArray([this__9343.arr[idx__9345], this__9343.arr[idx__9345 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__9346 = this;
  var inode__9347 = this;
  var idx__9348 = cljs.core.hash_collision_node_find_index.call(null, this__9346.arr, this__9346.cnt, key);
  if(idx__9348 === -1) {
    return inode__9347
  }else {
    if(this__9346.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9346.collision_hash, this__9346.cnt - 1, cljs.core.remove_pair.call(null, this__9346.arr, cljs.core.quot.call(null, idx__9348, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9349 = this;
  var inode__9350 = this;
  if(hash === this__9349.collision_hash) {
    var idx__9351 = cljs.core.hash_collision_node_find_index.call(null, this__9349.arr, this__9349.cnt, key);
    if(idx__9351 === -1) {
      var len__9352 = this__9349.arr.length;
      var new_arr__9353 = cljs.core.make_array.call(null, len__9352 + 2);
      cljs.core.array_copy.call(null, this__9349.arr, 0, new_arr__9353, 0, len__9352);
      new_arr__9353[len__9352] = key;
      new_arr__9353[len__9352 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9349.collision_hash, this__9349.cnt + 1, new_arr__9353)
    }else {
      if(cljs.core._EQ_.call(null, this__9349.arr[idx__9351], val)) {
        return inode__9350
      }else {
        return new cljs.core.HashCollisionNode(null, this__9349.collision_hash, this__9349.cnt, cljs.core.clone_and_set.call(null, this__9349.arr, idx__9351 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9349.collision_hash >>> shift & 31), [null, inode__9350])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9354 = this;
  var inode__9355 = this;
  var idx__9356 = cljs.core.hash_collision_node_find_index.call(null, this__9354.arr, this__9354.cnt, key);
  if(idx__9356 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9354.arr[idx__9356])) {
      return this__9354.arr[idx__9356 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__9357 = this;
  var inode__9358 = this;
  if(e === this__9357.edit) {
    this__9357.arr = array;
    this__9357.cnt = count;
    return inode__9358
  }else {
    return new cljs.core.HashCollisionNode(this__9357.edit, this__9357.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9363 = cljs.core.hash.call(null, key1);
    if(key1hash__9363 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9363, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9364 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9363, key1, val1, added_leaf_QMARK___9364).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9364)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9365 = cljs.core.hash.call(null, key1);
    if(key1hash__9365 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9365, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9366 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9365, key1, val1, added_leaf_QMARK___9366).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9366)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9367 = this;
  var h__2190__auto____9368 = this__9367.__hash;
  if(!(h__2190__auto____9368 == null)) {
    return h__2190__auto____9368
  }else {
    var h__2190__auto____9369 = cljs.core.hash_coll.call(null, coll);
    this__9367.__hash = h__2190__auto____9369;
    return h__2190__auto____9369
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9370 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9371 = this;
  var this__9372 = this;
  return cljs.core.pr_str.call(null, this__9372)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9373 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9374 = this;
  if(this__9374.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9374.nodes[this__9374.i], this__9374.nodes[this__9374.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9374.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9375 = this;
  if(this__9375.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9375.nodes, this__9375.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9375.nodes, this__9375.i, cljs.core.next.call(null, this__9375.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9376 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9377 = this;
  return new cljs.core.NodeSeq(meta, this__9377.nodes, this__9377.i, this__9377.s, this__9377.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9378 = this;
  return this__9378.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9379 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9379.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9386 = nodes.length;
      var j__9387 = i;
      while(true) {
        if(j__9387 < len__9386) {
          if(!(nodes[j__9387] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9387, null, null)
          }else {
            var temp__3971__auto____9388 = nodes[j__9387 + 1];
            if(cljs.core.truth_(temp__3971__auto____9388)) {
              var node__9389 = temp__3971__auto____9388;
              var temp__3971__auto____9390 = node__9389.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9390)) {
                var node_seq__9391 = temp__3971__auto____9390;
                return new cljs.core.NodeSeq(null, nodes, j__9387 + 2, node_seq__9391, null)
              }else {
                var G__9392 = j__9387 + 2;
                j__9387 = G__9392;
                continue
              }
            }else {
              var G__9393 = j__9387 + 2;
              j__9387 = G__9393;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9394 = this;
  var h__2190__auto____9395 = this__9394.__hash;
  if(!(h__2190__auto____9395 == null)) {
    return h__2190__auto____9395
  }else {
    var h__2190__auto____9396 = cljs.core.hash_coll.call(null, coll);
    this__9394.__hash = h__2190__auto____9396;
    return h__2190__auto____9396
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9397 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9398 = this;
  var this__9399 = this;
  return cljs.core.pr_str.call(null, this__9399)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9400 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9401 = this;
  return cljs.core.first.call(null, this__9401.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9402 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9402.nodes, this__9402.i, cljs.core.next.call(null, this__9402.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9403 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9404 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9404.nodes, this__9404.i, this__9404.s, this__9404.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9405 = this;
  return this__9405.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9406 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9406.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9413 = nodes.length;
      var j__9414 = i;
      while(true) {
        if(j__9414 < len__9413) {
          var temp__3971__auto____9415 = nodes[j__9414];
          if(cljs.core.truth_(temp__3971__auto____9415)) {
            var nj__9416 = temp__3971__auto____9415;
            var temp__3971__auto____9417 = nj__9416.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9417)) {
              var ns__9418 = temp__3971__auto____9417;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9414 + 1, ns__9418, null)
            }else {
              var G__9419 = j__9414 + 1;
              j__9414 = G__9419;
              continue
            }
          }else {
            var G__9420 = j__9414 + 1;
            j__9414 = G__9420;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9423 = this;
  return new cljs.core.TransientHashMap({}, this__9423.root, this__9423.cnt, this__9423.has_nil_QMARK_, this__9423.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9424 = this;
  var h__2190__auto____9425 = this__9424.__hash;
  if(!(h__2190__auto____9425 == null)) {
    return h__2190__auto____9425
  }else {
    var h__2190__auto____9426 = cljs.core.hash_imap.call(null, coll);
    this__9424.__hash = h__2190__auto____9426;
    return h__2190__auto____9426
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9427 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9428 = this;
  if(k == null) {
    if(this__9428.has_nil_QMARK_) {
      return this__9428.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9428.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9428.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9429 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9430 = this__9429.has_nil_QMARK_;
      if(and__3822__auto____9430) {
        return v === this__9429.nil_val
      }else {
        return and__3822__auto____9430
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9429.meta, this__9429.has_nil_QMARK_ ? this__9429.cnt : this__9429.cnt + 1, this__9429.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9431 = new cljs.core.Box(false);
    var new_root__9432 = (this__9429.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9429.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9431);
    if(new_root__9432 === this__9429.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9429.meta, added_leaf_QMARK___9431.val ? this__9429.cnt + 1 : this__9429.cnt, new_root__9432, this__9429.has_nil_QMARK_, this__9429.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9433 = this;
  if(k == null) {
    return this__9433.has_nil_QMARK_
  }else {
    if(this__9433.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9433.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9456 = null;
  var G__9456__2 = function(this_sym9434, k) {
    var this__9436 = this;
    var this_sym9434__9437 = this;
    var coll__9438 = this_sym9434__9437;
    return coll__9438.cljs$core$ILookup$_lookup$arity$2(coll__9438, k)
  };
  var G__9456__3 = function(this_sym9435, k, not_found) {
    var this__9436 = this;
    var this_sym9435__9439 = this;
    var coll__9440 = this_sym9435__9439;
    return coll__9440.cljs$core$ILookup$_lookup$arity$3(coll__9440, k, not_found)
  };
  G__9456 = function(this_sym9435, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9456__2.call(this, this_sym9435, k);
      case 3:
        return G__9456__3.call(this, this_sym9435, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9456
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9421, args9422) {
  var this__9441 = this;
  return this_sym9421.call.apply(this_sym9421, [this_sym9421].concat(args9422.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9442 = this;
  var init__9443 = this__9442.has_nil_QMARK_ ? f.call(null, init, null, this__9442.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9443)) {
    return cljs.core.deref.call(null, init__9443)
  }else {
    if(!(this__9442.root == null)) {
      return this__9442.root.kv_reduce(f, init__9443)
    }else {
      if("\ufdd0'else") {
        return init__9443
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9444 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9445 = this;
  var this__9446 = this;
  return cljs.core.pr_str.call(null, this__9446)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9447 = this;
  if(this__9447.cnt > 0) {
    var s__9448 = !(this__9447.root == null) ? this__9447.root.inode_seq() : null;
    if(this__9447.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9447.nil_val], true), s__9448)
    }else {
      return s__9448
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9449 = this;
  return this__9449.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9450 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9451 = this;
  return new cljs.core.PersistentHashMap(meta, this__9451.cnt, this__9451.root, this__9451.has_nil_QMARK_, this__9451.nil_val, this__9451.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9452 = this;
  return this__9452.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9453 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9453.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9454 = this;
  if(k == null) {
    if(this__9454.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9454.meta, this__9454.cnt - 1, this__9454.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9454.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9455 = this__9454.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9455 === this__9454.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9454.meta, this__9454.cnt - 1, new_root__9455, this__9454.has_nil_QMARK_, this__9454.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9457 = ks.length;
  var i__9458 = 0;
  var out__9459 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9458 < len__9457) {
      var G__9460 = i__9458 + 1;
      var G__9461 = cljs.core.assoc_BANG_.call(null, out__9459, ks[i__9458], vs[i__9458]);
      i__9458 = G__9460;
      out__9459 = G__9461;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9459)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9462 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9463 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9464 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9465 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9466 = this;
  if(k == null) {
    if(this__9466.has_nil_QMARK_) {
      return this__9466.nil_val
    }else {
      return null
    }
  }else {
    if(this__9466.root == null) {
      return null
    }else {
      return this__9466.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9467 = this;
  if(k == null) {
    if(this__9467.has_nil_QMARK_) {
      return this__9467.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9467.root == null) {
      return not_found
    }else {
      return this__9467.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9468 = this;
  if(this__9468.edit) {
    return this__9468.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9469 = this;
  var tcoll__9470 = this;
  if(this__9469.edit) {
    if(function() {
      var G__9471__9472 = o;
      if(G__9471__9472) {
        if(function() {
          var or__3824__auto____9473 = G__9471__9472.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9473) {
            return or__3824__auto____9473
          }else {
            return G__9471__9472.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9471__9472.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9471__9472)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9471__9472)
      }
    }()) {
      return tcoll__9470.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9474 = cljs.core.seq.call(null, o);
      var tcoll__9475 = tcoll__9470;
      while(true) {
        var temp__3971__auto____9476 = cljs.core.first.call(null, es__9474);
        if(cljs.core.truth_(temp__3971__auto____9476)) {
          var e__9477 = temp__3971__auto____9476;
          var G__9488 = cljs.core.next.call(null, es__9474);
          var G__9489 = tcoll__9475.assoc_BANG_(cljs.core.key.call(null, e__9477), cljs.core.val.call(null, e__9477));
          es__9474 = G__9488;
          tcoll__9475 = G__9489;
          continue
        }else {
          return tcoll__9475
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9478 = this;
  var tcoll__9479 = this;
  if(this__9478.edit) {
    if(k == null) {
      if(this__9478.nil_val === v) {
      }else {
        this__9478.nil_val = v
      }
      if(this__9478.has_nil_QMARK_) {
      }else {
        this__9478.count = this__9478.count + 1;
        this__9478.has_nil_QMARK_ = true
      }
      return tcoll__9479
    }else {
      var added_leaf_QMARK___9480 = new cljs.core.Box(false);
      var node__9481 = (this__9478.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9478.root).inode_assoc_BANG_(this__9478.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9480);
      if(node__9481 === this__9478.root) {
      }else {
        this__9478.root = node__9481
      }
      if(added_leaf_QMARK___9480.val) {
        this__9478.count = this__9478.count + 1
      }else {
      }
      return tcoll__9479
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9482 = this;
  var tcoll__9483 = this;
  if(this__9482.edit) {
    if(k == null) {
      if(this__9482.has_nil_QMARK_) {
        this__9482.has_nil_QMARK_ = false;
        this__9482.nil_val = null;
        this__9482.count = this__9482.count - 1;
        return tcoll__9483
      }else {
        return tcoll__9483
      }
    }else {
      if(this__9482.root == null) {
        return tcoll__9483
      }else {
        var removed_leaf_QMARK___9484 = new cljs.core.Box(false);
        var node__9485 = this__9482.root.inode_without_BANG_(this__9482.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9484);
        if(node__9485 === this__9482.root) {
        }else {
          this__9482.root = node__9485
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9484[0])) {
          this__9482.count = this__9482.count - 1
        }else {
        }
        return tcoll__9483
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9486 = this;
  var tcoll__9487 = this;
  if(this__9486.edit) {
    this__9486.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9486.count, this__9486.root, this__9486.has_nil_QMARK_, this__9486.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9492 = node;
  var stack__9493 = stack;
  while(true) {
    if(!(t__9492 == null)) {
      var G__9494 = ascending_QMARK_ ? t__9492.left : t__9492.right;
      var G__9495 = cljs.core.conj.call(null, stack__9493, t__9492);
      t__9492 = G__9494;
      stack__9493 = G__9495;
      continue
    }else {
      return stack__9493
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9496 = this;
  var h__2190__auto____9497 = this__9496.__hash;
  if(!(h__2190__auto____9497 == null)) {
    return h__2190__auto____9497
  }else {
    var h__2190__auto____9498 = cljs.core.hash_coll.call(null, coll);
    this__9496.__hash = h__2190__auto____9498;
    return h__2190__auto____9498
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9499 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9500 = this;
  var this__9501 = this;
  return cljs.core.pr_str.call(null, this__9501)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9502 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9503 = this;
  if(this__9503.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9503.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9504 = this;
  return cljs.core.peek.call(null, this__9504.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9505 = this;
  var t__9506 = cljs.core.first.call(null, this__9505.stack);
  var next_stack__9507 = cljs.core.tree_map_seq_push.call(null, this__9505.ascending_QMARK_ ? t__9506.right : t__9506.left, cljs.core.next.call(null, this__9505.stack), this__9505.ascending_QMARK_);
  if(!(next_stack__9507 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9507, this__9505.ascending_QMARK_, this__9505.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9508 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9509 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9509.stack, this__9509.ascending_QMARK_, this__9509.cnt, this__9509.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9510 = this;
  return this__9510.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9512 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9512) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9512
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9514 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9514) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9514
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9518 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9518)) {
    return cljs.core.deref.call(null, init__9518)
  }else {
    var init__9519 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9518) : init__9518;
    if(cljs.core.reduced_QMARK_.call(null, init__9519)) {
      return cljs.core.deref.call(null, init__9519)
    }else {
      var init__9520 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9519) : init__9519;
      if(cljs.core.reduced_QMARK_.call(null, init__9520)) {
        return cljs.core.deref.call(null, init__9520)
      }else {
        return init__9520
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9523 = this;
  var h__2190__auto____9524 = this__9523.__hash;
  if(!(h__2190__auto____9524 == null)) {
    return h__2190__auto____9524
  }else {
    var h__2190__auto____9525 = cljs.core.hash_coll.call(null, coll);
    this__9523.__hash = h__2190__auto____9525;
    return h__2190__auto____9525
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9526 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9527 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9528 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9528.key, this__9528.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9576 = null;
  var G__9576__2 = function(this_sym9529, k) {
    var this__9531 = this;
    var this_sym9529__9532 = this;
    var node__9533 = this_sym9529__9532;
    return node__9533.cljs$core$ILookup$_lookup$arity$2(node__9533, k)
  };
  var G__9576__3 = function(this_sym9530, k, not_found) {
    var this__9531 = this;
    var this_sym9530__9534 = this;
    var node__9535 = this_sym9530__9534;
    return node__9535.cljs$core$ILookup$_lookup$arity$3(node__9535, k, not_found)
  };
  G__9576 = function(this_sym9530, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9576__2.call(this, this_sym9530, k);
      case 3:
        return G__9576__3.call(this, this_sym9530, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9576
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9521, args9522) {
  var this__9536 = this;
  return this_sym9521.call.apply(this_sym9521, [this_sym9521].concat(args9522.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9537 = this;
  return cljs.core.PersistentVector.fromArray([this__9537.key, this__9537.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9538 = this;
  return this__9538.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9539 = this;
  return this__9539.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9540 = this;
  var node__9541 = this;
  return ins.balance_right(node__9541)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9542 = this;
  var node__9543 = this;
  return new cljs.core.RedNode(this__9542.key, this__9542.val, this__9542.left, this__9542.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9544 = this;
  var node__9545 = this;
  return cljs.core.balance_right_del.call(null, this__9544.key, this__9544.val, this__9544.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9546 = this;
  var node__9547 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9548 = this;
  var node__9549 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9549, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9550 = this;
  var node__9551 = this;
  return cljs.core.balance_left_del.call(null, this__9550.key, this__9550.val, del, this__9550.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9552 = this;
  var node__9553 = this;
  return ins.balance_left(node__9553)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9554 = this;
  var node__9555 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9555, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9577 = null;
  var G__9577__0 = function() {
    var this__9556 = this;
    var this__9558 = this;
    return cljs.core.pr_str.call(null, this__9558)
  };
  G__9577 = function() {
    switch(arguments.length) {
      case 0:
        return G__9577__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9577
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9559 = this;
  var node__9560 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9560, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9561 = this;
  var node__9562 = this;
  return node__9562
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9563 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9564 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9565 = this;
  return cljs.core.list.call(null, this__9565.key, this__9565.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9566 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9567 = this;
  return this__9567.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9568 = this;
  return cljs.core.PersistentVector.fromArray([this__9568.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9569 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9569.key, this__9569.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9570 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9571 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9571.key, this__9571.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9572 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9573 = this;
  if(n === 0) {
    return this__9573.key
  }else {
    if(n === 1) {
      return this__9573.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9574 = this;
  if(n === 0) {
    return this__9574.key
  }else {
    if(n === 1) {
      return this__9574.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9575 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9580 = this;
  var h__2190__auto____9581 = this__9580.__hash;
  if(!(h__2190__auto____9581 == null)) {
    return h__2190__auto____9581
  }else {
    var h__2190__auto____9582 = cljs.core.hash_coll.call(null, coll);
    this__9580.__hash = h__2190__auto____9582;
    return h__2190__auto____9582
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9583 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9584 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9585 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9585.key, this__9585.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9633 = null;
  var G__9633__2 = function(this_sym9586, k) {
    var this__9588 = this;
    var this_sym9586__9589 = this;
    var node__9590 = this_sym9586__9589;
    return node__9590.cljs$core$ILookup$_lookup$arity$2(node__9590, k)
  };
  var G__9633__3 = function(this_sym9587, k, not_found) {
    var this__9588 = this;
    var this_sym9587__9591 = this;
    var node__9592 = this_sym9587__9591;
    return node__9592.cljs$core$ILookup$_lookup$arity$3(node__9592, k, not_found)
  };
  G__9633 = function(this_sym9587, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9633__2.call(this, this_sym9587, k);
      case 3:
        return G__9633__3.call(this, this_sym9587, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9633
}();
cljs.core.RedNode.prototype.apply = function(this_sym9578, args9579) {
  var this__9593 = this;
  return this_sym9578.call.apply(this_sym9578, [this_sym9578].concat(args9579.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9594 = this;
  return cljs.core.PersistentVector.fromArray([this__9594.key, this__9594.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9595 = this;
  return this__9595.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9596 = this;
  return this__9596.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9597 = this;
  var node__9598 = this;
  return new cljs.core.RedNode(this__9597.key, this__9597.val, this__9597.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9599 = this;
  var node__9600 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9601 = this;
  var node__9602 = this;
  return new cljs.core.RedNode(this__9601.key, this__9601.val, this__9601.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9603 = this;
  var node__9604 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9605 = this;
  var node__9606 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9606, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9607 = this;
  var node__9608 = this;
  return new cljs.core.RedNode(this__9607.key, this__9607.val, del, this__9607.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9609 = this;
  var node__9610 = this;
  return new cljs.core.RedNode(this__9609.key, this__9609.val, ins, this__9609.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9611 = this;
  var node__9612 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9611.left)) {
    return new cljs.core.RedNode(this__9611.key, this__9611.val, this__9611.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9611.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9611.right)) {
      return new cljs.core.RedNode(this__9611.right.key, this__9611.right.val, new cljs.core.BlackNode(this__9611.key, this__9611.val, this__9611.left, this__9611.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9611.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9612, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9634 = null;
  var G__9634__0 = function() {
    var this__9613 = this;
    var this__9615 = this;
    return cljs.core.pr_str.call(null, this__9615)
  };
  G__9634 = function() {
    switch(arguments.length) {
      case 0:
        return G__9634__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9634
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9616 = this;
  var node__9617 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9616.right)) {
    return new cljs.core.RedNode(this__9616.key, this__9616.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9616.left, null), this__9616.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9616.left)) {
      return new cljs.core.RedNode(this__9616.left.key, this__9616.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9616.left.left, null), new cljs.core.BlackNode(this__9616.key, this__9616.val, this__9616.left.right, this__9616.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9617, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9618 = this;
  var node__9619 = this;
  return new cljs.core.BlackNode(this__9618.key, this__9618.val, this__9618.left, this__9618.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9620 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9621 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9622 = this;
  return cljs.core.list.call(null, this__9622.key, this__9622.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9623 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9624 = this;
  return this__9624.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9625 = this;
  return cljs.core.PersistentVector.fromArray([this__9625.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9626 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9626.key, this__9626.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9627 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9628 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9628.key, this__9628.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9629 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9630 = this;
  if(n === 0) {
    return this__9630.key
  }else {
    if(n === 1) {
      return this__9630.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9631 = this;
  if(n === 0) {
    return this__9631.key
  }else {
    if(n === 1) {
      return this__9631.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9632 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9638 = comp.call(null, k, tree.key);
    if(c__9638 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9638 < 0) {
        var ins__9639 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9639 == null)) {
          return tree.add_left(ins__9639)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9640 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9640 == null)) {
            return tree.add_right(ins__9640)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9643 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9643)) {
            return new cljs.core.RedNode(app__9643.key, app__9643.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9643.left, null), new cljs.core.RedNode(right.key, right.val, app__9643.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9643, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9644 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9644)) {
              return new cljs.core.RedNode(app__9644.key, app__9644.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9644.left, null), new cljs.core.BlackNode(right.key, right.val, app__9644.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9644, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9650 = comp.call(null, k, tree.key);
    if(c__9650 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9650 < 0) {
        var del__9651 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9652 = !(del__9651 == null);
          if(or__3824__auto____9652) {
            return or__3824__auto____9652
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9651, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9651, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9653 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9654 = !(del__9653 == null);
            if(or__3824__auto____9654) {
              return or__3824__auto____9654
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9653)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9653, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9657 = tree.key;
  var c__9658 = comp.call(null, k, tk__9657);
  if(c__9658 === 0) {
    return tree.replace(tk__9657, v, tree.left, tree.right)
  }else {
    if(c__9658 < 0) {
      return tree.replace(tk__9657, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9657, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9661 = this;
  var h__2190__auto____9662 = this__9661.__hash;
  if(!(h__2190__auto____9662 == null)) {
    return h__2190__auto____9662
  }else {
    var h__2190__auto____9663 = cljs.core.hash_imap.call(null, coll);
    this__9661.__hash = h__2190__auto____9663;
    return h__2190__auto____9663
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9664 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9665 = this;
  var n__9666 = coll.entry_at(k);
  if(!(n__9666 == null)) {
    return n__9666.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9667 = this;
  var found__9668 = [null];
  var t__9669 = cljs.core.tree_map_add.call(null, this__9667.comp, this__9667.tree, k, v, found__9668);
  if(t__9669 == null) {
    var found_node__9670 = cljs.core.nth.call(null, found__9668, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9670.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9667.comp, cljs.core.tree_map_replace.call(null, this__9667.comp, this__9667.tree, k, v), this__9667.cnt, this__9667.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9667.comp, t__9669.blacken(), this__9667.cnt + 1, this__9667.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9671 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9705 = null;
  var G__9705__2 = function(this_sym9672, k) {
    var this__9674 = this;
    var this_sym9672__9675 = this;
    var coll__9676 = this_sym9672__9675;
    return coll__9676.cljs$core$ILookup$_lookup$arity$2(coll__9676, k)
  };
  var G__9705__3 = function(this_sym9673, k, not_found) {
    var this__9674 = this;
    var this_sym9673__9677 = this;
    var coll__9678 = this_sym9673__9677;
    return coll__9678.cljs$core$ILookup$_lookup$arity$3(coll__9678, k, not_found)
  };
  G__9705 = function(this_sym9673, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9705__2.call(this, this_sym9673, k);
      case 3:
        return G__9705__3.call(this, this_sym9673, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9705
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9659, args9660) {
  var this__9679 = this;
  return this_sym9659.call.apply(this_sym9659, [this_sym9659].concat(args9660.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9680 = this;
  if(!(this__9680.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9680.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9681 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9682 = this;
  if(this__9682.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9682.tree, false, this__9682.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9683 = this;
  var this__9684 = this;
  return cljs.core.pr_str.call(null, this__9684)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9685 = this;
  var coll__9686 = this;
  var t__9687 = this__9685.tree;
  while(true) {
    if(!(t__9687 == null)) {
      var c__9688 = this__9685.comp.call(null, k, t__9687.key);
      if(c__9688 === 0) {
        return t__9687
      }else {
        if(c__9688 < 0) {
          var G__9706 = t__9687.left;
          t__9687 = G__9706;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9707 = t__9687.right;
            t__9687 = G__9707;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9689 = this;
  if(this__9689.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9689.tree, ascending_QMARK_, this__9689.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9690 = this;
  if(this__9690.cnt > 0) {
    var stack__9691 = null;
    var t__9692 = this__9690.tree;
    while(true) {
      if(!(t__9692 == null)) {
        var c__9693 = this__9690.comp.call(null, k, t__9692.key);
        if(c__9693 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9691, t__9692), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9693 < 0) {
              var G__9708 = cljs.core.conj.call(null, stack__9691, t__9692);
              var G__9709 = t__9692.left;
              stack__9691 = G__9708;
              t__9692 = G__9709;
              continue
            }else {
              var G__9710 = stack__9691;
              var G__9711 = t__9692.right;
              stack__9691 = G__9710;
              t__9692 = G__9711;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9693 > 0) {
                var G__9712 = cljs.core.conj.call(null, stack__9691, t__9692);
                var G__9713 = t__9692.right;
                stack__9691 = G__9712;
                t__9692 = G__9713;
                continue
              }else {
                var G__9714 = stack__9691;
                var G__9715 = t__9692.left;
                stack__9691 = G__9714;
                t__9692 = G__9715;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9691 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9691, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9694 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9695 = this;
  return this__9695.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9696 = this;
  if(this__9696.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9696.tree, true, this__9696.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9697 = this;
  return this__9697.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9698 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9699 = this;
  return new cljs.core.PersistentTreeMap(this__9699.comp, this__9699.tree, this__9699.cnt, meta, this__9699.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9700 = this;
  return this__9700.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9701 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9701.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9702 = this;
  var found__9703 = [null];
  var t__9704 = cljs.core.tree_map_remove.call(null, this__9702.comp, this__9702.tree, k, found__9703);
  if(t__9704 == null) {
    if(cljs.core.nth.call(null, found__9703, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9702.comp, null, 0, this__9702.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9702.comp, t__9704.blacken(), this__9702.cnt - 1, this__9702.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9718 = cljs.core.seq.call(null, keyvals);
    var out__9719 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9718) {
        var G__9720 = cljs.core.nnext.call(null, in__9718);
        var G__9721 = cljs.core.assoc_BANG_.call(null, out__9719, cljs.core.first.call(null, in__9718), cljs.core.second.call(null, in__9718));
        in__9718 = G__9720;
        out__9719 = G__9721;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9719)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9722) {
    var keyvals = cljs.core.seq(arglist__9722);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9723) {
    var keyvals = cljs.core.seq(arglist__9723);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9727 = [];
    var obj__9728 = {};
    var kvs__9729 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9729) {
        ks__9727.push(cljs.core.first.call(null, kvs__9729));
        obj__9728[cljs.core.first.call(null, kvs__9729)] = cljs.core.second.call(null, kvs__9729);
        var G__9730 = cljs.core.nnext.call(null, kvs__9729);
        kvs__9729 = G__9730;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9727, obj__9728)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9731) {
    var keyvals = cljs.core.seq(arglist__9731);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9734 = cljs.core.seq.call(null, keyvals);
    var out__9735 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9734) {
        var G__9736 = cljs.core.nnext.call(null, in__9734);
        var G__9737 = cljs.core.assoc.call(null, out__9735, cljs.core.first.call(null, in__9734), cljs.core.second.call(null, in__9734));
        in__9734 = G__9736;
        out__9735 = G__9737;
        continue
      }else {
        return out__9735
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9738) {
    var keyvals = cljs.core.seq(arglist__9738);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9741 = cljs.core.seq.call(null, keyvals);
    var out__9742 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9741) {
        var G__9743 = cljs.core.nnext.call(null, in__9741);
        var G__9744 = cljs.core.assoc.call(null, out__9742, cljs.core.first.call(null, in__9741), cljs.core.second.call(null, in__9741));
        in__9741 = G__9743;
        out__9742 = G__9744;
        continue
      }else {
        return out__9742
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9745) {
    var comparator = cljs.core.first(arglist__9745);
    var keyvals = cljs.core.rest(arglist__9745);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9746_SHARP_, p2__9747_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9749 = p1__9746_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9749)) {
            return or__3824__auto____9749
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9747_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9750) {
    var maps = cljs.core.seq(arglist__9750);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9758 = function(m, e) {
        var k__9756 = cljs.core.first.call(null, e);
        var v__9757 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9756)) {
          return cljs.core.assoc.call(null, m, k__9756, f.call(null, cljs.core._lookup.call(null, m, k__9756, null), v__9757))
        }else {
          return cljs.core.assoc.call(null, m, k__9756, v__9757)
        }
      };
      var merge2__9760 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9758, function() {
          var or__3824__auto____9759 = m1;
          if(cljs.core.truth_(or__3824__auto____9759)) {
            return or__3824__auto____9759
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9760, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9761) {
    var f = cljs.core.first(arglist__9761);
    var maps = cljs.core.rest(arglist__9761);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9766 = cljs.core.ObjMap.EMPTY;
  var keys__9767 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9767) {
      var key__9768 = cljs.core.first.call(null, keys__9767);
      var entry__9769 = cljs.core._lookup.call(null, map, key__9768, "\ufdd0'user/not-found");
      var G__9770 = cljs.core.not_EQ_.call(null, entry__9769, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__9766, key__9768, entry__9769) : ret__9766;
      var G__9771 = cljs.core.next.call(null, keys__9767);
      ret__9766 = G__9770;
      keys__9767 = G__9771;
      continue
    }else {
      return ret__9766
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9775 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9775.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9776 = this;
  var h__2190__auto____9777 = this__9776.__hash;
  if(!(h__2190__auto____9777 == null)) {
    return h__2190__auto____9777
  }else {
    var h__2190__auto____9778 = cljs.core.hash_iset.call(null, coll);
    this__9776.__hash = h__2190__auto____9778;
    return h__2190__auto____9778
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9779 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9780 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9780.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9801 = null;
  var G__9801__2 = function(this_sym9781, k) {
    var this__9783 = this;
    var this_sym9781__9784 = this;
    var coll__9785 = this_sym9781__9784;
    return coll__9785.cljs$core$ILookup$_lookup$arity$2(coll__9785, k)
  };
  var G__9801__3 = function(this_sym9782, k, not_found) {
    var this__9783 = this;
    var this_sym9782__9786 = this;
    var coll__9787 = this_sym9782__9786;
    return coll__9787.cljs$core$ILookup$_lookup$arity$3(coll__9787, k, not_found)
  };
  G__9801 = function(this_sym9782, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9801__2.call(this, this_sym9782, k);
      case 3:
        return G__9801__3.call(this, this_sym9782, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9801
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9773, args9774) {
  var this__9788 = this;
  return this_sym9773.call.apply(this_sym9773, [this_sym9773].concat(args9774.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9789 = this;
  return new cljs.core.PersistentHashSet(this__9789.meta, cljs.core.assoc.call(null, this__9789.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9790 = this;
  var this__9791 = this;
  return cljs.core.pr_str.call(null, this__9791)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9792 = this;
  return cljs.core.keys.call(null, this__9792.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9793 = this;
  return new cljs.core.PersistentHashSet(this__9793.meta, cljs.core.dissoc.call(null, this__9793.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9794 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9795 = this;
  var and__3822__auto____9796 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9796) {
    var and__3822__auto____9797 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9797) {
      return cljs.core.every_QMARK_.call(null, function(p1__9772_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9772_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9797
    }
  }else {
    return and__3822__auto____9796
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9798 = this;
  return new cljs.core.PersistentHashSet(meta, this__9798.hash_map, this__9798.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9799 = this;
  return this__9799.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9800 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9800.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9802 = cljs.core.count.call(null, items);
  var i__9803 = 0;
  var out__9804 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9803 < len__9802) {
      var G__9805 = i__9803 + 1;
      var G__9806 = cljs.core.conj_BANG_.call(null, out__9804, items[i__9803]);
      i__9803 = G__9805;
      out__9804 = G__9806;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9804)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9824 = null;
  var G__9824__2 = function(this_sym9810, k) {
    var this__9812 = this;
    var this_sym9810__9813 = this;
    var tcoll__9814 = this_sym9810__9813;
    if(cljs.core._lookup.call(null, this__9812.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9824__3 = function(this_sym9811, k, not_found) {
    var this__9812 = this;
    var this_sym9811__9815 = this;
    var tcoll__9816 = this_sym9811__9815;
    if(cljs.core._lookup.call(null, this__9812.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9824 = function(this_sym9811, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9824__2.call(this, this_sym9811, k);
      case 3:
        return G__9824__3.call(this, this_sym9811, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9824
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9808, args9809) {
  var this__9817 = this;
  return this_sym9808.call.apply(this_sym9808, [this_sym9808].concat(args9809.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9818 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9819 = this;
  if(cljs.core._lookup.call(null, this__9819.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9820 = this;
  return cljs.core.count.call(null, this__9820.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9821 = this;
  this__9821.transient_map = cljs.core.dissoc_BANG_.call(null, this__9821.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9822 = this;
  this__9822.transient_map = cljs.core.assoc_BANG_.call(null, this__9822.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9823 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9823.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9827 = this;
  var h__2190__auto____9828 = this__9827.__hash;
  if(!(h__2190__auto____9828 == null)) {
    return h__2190__auto____9828
  }else {
    var h__2190__auto____9829 = cljs.core.hash_iset.call(null, coll);
    this__9827.__hash = h__2190__auto____9829;
    return h__2190__auto____9829
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9830 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9831 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9831.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9857 = null;
  var G__9857__2 = function(this_sym9832, k) {
    var this__9834 = this;
    var this_sym9832__9835 = this;
    var coll__9836 = this_sym9832__9835;
    return coll__9836.cljs$core$ILookup$_lookup$arity$2(coll__9836, k)
  };
  var G__9857__3 = function(this_sym9833, k, not_found) {
    var this__9834 = this;
    var this_sym9833__9837 = this;
    var coll__9838 = this_sym9833__9837;
    return coll__9838.cljs$core$ILookup$_lookup$arity$3(coll__9838, k, not_found)
  };
  G__9857 = function(this_sym9833, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9857__2.call(this, this_sym9833, k);
      case 3:
        return G__9857__3.call(this, this_sym9833, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9857
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9825, args9826) {
  var this__9839 = this;
  return this_sym9825.call.apply(this_sym9825, [this_sym9825].concat(args9826.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9840 = this;
  return new cljs.core.PersistentTreeSet(this__9840.meta, cljs.core.assoc.call(null, this__9840.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9841 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9841.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9842 = this;
  var this__9843 = this;
  return cljs.core.pr_str.call(null, this__9843)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9844 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9844.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9845 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9845.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9846 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9847 = this;
  return cljs.core._comparator.call(null, this__9847.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9848 = this;
  return cljs.core.keys.call(null, this__9848.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9849 = this;
  return new cljs.core.PersistentTreeSet(this__9849.meta, cljs.core.dissoc.call(null, this__9849.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9850 = this;
  return cljs.core.count.call(null, this__9850.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9851 = this;
  var and__3822__auto____9852 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9852) {
    var and__3822__auto____9853 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9853) {
      return cljs.core.every_QMARK_.call(null, function(p1__9807_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9807_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9853
    }
  }else {
    return and__3822__auto____9852
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9854 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9854.tree_map, this__9854.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9855 = this;
  return this__9855.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9856 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9856.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9862__delegate = function(keys) {
      var in__9860 = cljs.core.seq.call(null, keys);
      var out__9861 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9860)) {
          var G__9863 = cljs.core.next.call(null, in__9860);
          var G__9864 = cljs.core.conj_BANG_.call(null, out__9861, cljs.core.first.call(null, in__9860));
          in__9860 = G__9863;
          out__9861 = G__9864;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9861)
        }
        break
      }
    };
    var G__9862 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9862__delegate.call(this, keys)
    };
    G__9862.cljs$lang$maxFixedArity = 0;
    G__9862.cljs$lang$applyTo = function(arglist__9865) {
      var keys = cljs.core.seq(arglist__9865);
      return G__9862__delegate(keys)
    };
    G__9862.cljs$lang$arity$variadic = G__9862__delegate;
    return G__9862
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9866) {
    var keys = cljs.core.seq(arglist__9866);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9868) {
    var comparator = cljs.core.first(arglist__9868);
    var keys = cljs.core.rest(arglist__9868);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9874 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9875 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9875)) {
        var e__9876 = temp__3971__auto____9875;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9876))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9874, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9867_SHARP_) {
      var temp__3971__auto____9877 = cljs.core.find.call(null, smap, p1__9867_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9877)) {
        var e__9878 = temp__3971__auto____9877;
        return cljs.core.second.call(null, e__9878)
      }else {
        return p1__9867_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9908 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9901, seen) {
        while(true) {
          var vec__9902__9903 = p__9901;
          var f__9904 = cljs.core.nth.call(null, vec__9902__9903, 0, null);
          var xs__9905 = vec__9902__9903;
          var temp__3974__auto____9906 = cljs.core.seq.call(null, xs__9905);
          if(temp__3974__auto____9906) {
            var s__9907 = temp__3974__auto____9906;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9904)) {
              var G__9909 = cljs.core.rest.call(null, s__9907);
              var G__9910 = seen;
              p__9901 = G__9909;
              seen = G__9910;
              continue
            }else {
              return cljs.core.cons.call(null, f__9904, step.call(null, cljs.core.rest.call(null, s__9907), cljs.core.conj.call(null, seen, f__9904)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9908.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9913 = cljs.core.PersistentVector.EMPTY;
  var s__9914 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9914)) {
      var G__9915 = cljs.core.conj.call(null, ret__9913, cljs.core.first.call(null, s__9914));
      var G__9916 = cljs.core.next.call(null, s__9914);
      ret__9913 = G__9915;
      s__9914 = G__9916;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9913)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9919 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9919) {
        return or__3824__auto____9919
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9920 = x.lastIndexOf("/");
      if(i__9920 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9920 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9923 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9923) {
      return or__3824__auto____9923
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9924 = x.lastIndexOf("/");
    if(i__9924 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9924)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9931 = cljs.core.ObjMap.EMPTY;
  var ks__9932 = cljs.core.seq.call(null, keys);
  var vs__9933 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9934 = ks__9932;
      if(and__3822__auto____9934) {
        return vs__9933
      }else {
        return and__3822__auto____9934
      }
    }()) {
      var G__9935 = cljs.core.assoc.call(null, map__9931, cljs.core.first.call(null, ks__9932), cljs.core.first.call(null, vs__9933));
      var G__9936 = cljs.core.next.call(null, ks__9932);
      var G__9937 = cljs.core.next.call(null, vs__9933);
      map__9931 = G__9935;
      ks__9932 = G__9936;
      vs__9933 = G__9937;
      continue
    }else {
      return map__9931
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9940__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9925_SHARP_, p2__9926_SHARP_) {
        return max_key.call(null, k, p1__9925_SHARP_, p2__9926_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9940 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9940__delegate.call(this, k, x, y, more)
    };
    G__9940.cljs$lang$maxFixedArity = 3;
    G__9940.cljs$lang$applyTo = function(arglist__9941) {
      var k = cljs.core.first(arglist__9941);
      var x = cljs.core.first(cljs.core.next(arglist__9941));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9941)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9941)));
      return G__9940__delegate(k, x, y, more)
    };
    G__9940.cljs$lang$arity$variadic = G__9940__delegate;
    return G__9940
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9942__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9938_SHARP_, p2__9939_SHARP_) {
        return min_key.call(null, k, p1__9938_SHARP_, p2__9939_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9942 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9942__delegate.call(this, k, x, y, more)
    };
    G__9942.cljs$lang$maxFixedArity = 3;
    G__9942.cljs$lang$applyTo = function(arglist__9943) {
      var k = cljs.core.first(arglist__9943);
      var x = cljs.core.first(cljs.core.next(arglist__9943));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9943)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9943)));
      return G__9942__delegate(k, x, y, more)
    };
    G__9942.cljs$lang$arity$variadic = G__9942__delegate;
    return G__9942
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9946 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9946) {
        var s__9947 = temp__3974__auto____9946;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9947), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9947)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9950 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9950) {
      var s__9951 = temp__3974__auto____9950;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9951)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9951), take_while.call(null, pred, cljs.core.rest.call(null, s__9951)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9953 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9953.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9965 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9966 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9966)) {
        var vec__9967__9968 = temp__3974__auto____9966;
        var e__9969 = cljs.core.nth.call(null, vec__9967__9968, 0, null);
        var s__9970 = vec__9967__9968;
        if(cljs.core.truth_(include__9965.call(null, e__9969))) {
          return s__9970
        }else {
          return cljs.core.next.call(null, s__9970)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9965, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9971 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9971)) {
      var vec__9972__9973 = temp__3974__auto____9971;
      var e__9974 = cljs.core.nth.call(null, vec__9972__9973, 0, null);
      var s__9975 = vec__9972__9973;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9974)) ? s__9975 : cljs.core.next.call(null, s__9975))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9987 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9988 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9988)) {
        var vec__9989__9990 = temp__3974__auto____9988;
        var e__9991 = cljs.core.nth.call(null, vec__9989__9990, 0, null);
        var s__9992 = vec__9989__9990;
        if(cljs.core.truth_(include__9987.call(null, e__9991))) {
          return s__9992
        }else {
          return cljs.core.next.call(null, s__9992)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9987, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9993 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9993)) {
      var vec__9994__9995 = temp__3974__auto____9993;
      var e__9996 = cljs.core.nth.call(null, vec__9994__9995, 0, null);
      var s__9997 = vec__9994__9995;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9996)) ? s__9997 : cljs.core.next.call(null, s__9997))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9998 = this;
  var h__2190__auto____9999 = this__9998.__hash;
  if(!(h__2190__auto____9999 == null)) {
    return h__2190__auto____9999
  }else {
    var h__2190__auto____10000 = cljs.core.hash_coll.call(null, rng);
    this__9998.__hash = h__2190__auto____10000;
    return h__2190__auto____10000
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10001 = this;
  if(this__10001.step > 0) {
    if(this__10001.start + this__10001.step < this__10001.end) {
      return new cljs.core.Range(this__10001.meta, this__10001.start + this__10001.step, this__10001.end, this__10001.step, null)
    }else {
      return null
    }
  }else {
    if(this__10001.start + this__10001.step > this__10001.end) {
      return new cljs.core.Range(this__10001.meta, this__10001.start + this__10001.step, this__10001.end, this__10001.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10002 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10003 = this;
  var this__10004 = this;
  return cljs.core.pr_str.call(null, this__10004)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10005 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10006 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10007 = this;
  if(this__10007.step > 0) {
    if(this__10007.start < this__10007.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10007.start > this__10007.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10008 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10008.end - this__10008.start) / this__10008.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10009 = this;
  return this__10009.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10010 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10010.meta, this__10010.start + this__10010.step, this__10010.end, this__10010.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10011 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10012 = this;
  return new cljs.core.Range(meta, this__10012.start, this__10012.end, this__10012.step, this__10012.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10013 = this;
  return this__10013.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10014 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10014.start + n * this__10014.step
  }else {
    if(function() {
      var and__3822__auto____10015 = this__10014.start > this__10014.end;
      if(and__3822__auto____10015) {
        return this__10014.step === 0
      }else {
        return and__3822__auto____10015
      }
    }()) {
      return this__10014.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10016 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10016.start + n * this__10016.step
  }else {
    if(function() {
      var and__3822__auto____10017 = this__10016.start > this__10016.end;
      if(and__3822__auto____10017) {
        return this__10016.step === 0
      }else {
        return and__3822__auto____10017
      }
    }()) {
      return this__10016.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10018 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10018.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10021 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10021) {
      var s__10022 = temp__3974__auto____10021;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10022), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10022)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10029 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10029) {
      var s__10030 = temp__3974__auto____10029;
      var fst__10031 = cljs.core.first.call(null, s__10030);
      var fv__10032 = f.call(null, fst__10031);
      var run__10033 = cljs.core.cons.call(null, fst__10031, cljs.core.take_while.call(null, function(p1__10023_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10032, f.call(null, p1__10023_SHARP_))
      }, cljs.core.next.call(null, s__10030)));
      return cljs.core.cons.call(null, run__10033, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10033), s__10030))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____10048 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10048) {
        var s__10049 = temp__3971__auto____10048;
        return reductions.call(null, f, cljs.core.first.call(null, s__10049), cljs.core.rest.call(null, s__10049))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10050 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10050) {
        var s__10051 = temp__3974__auto____10050;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10051)), cljs.core.rest.call(null, s__10051))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__10054 = null;
      var G__10054__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10054__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10054__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10054__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10054__4 = function() {
        var G__10055__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10055 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10055__delegate.call(this, x, y, z, args)
        };
        G__10055.cljs$lang$maxFixedArity = 3;
        G__10055.cljs$lang$applyTo = function(arglist__10056) {
          var x = cljs.core.first(arglist__10056);
          var y = cljs.core.first(cljs.core.next(arglist__10056));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10056)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10056)));
          return G__10055__delegate(x, y, z, args)
        };
        G__10055.cljs$lang$arity$variadic = G__10055__delegate;
        return G__10055
      }();
      G__10054 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10054__0.call(this);
          case 1:
            return G__10054__1.call(this, x);
          case 2:
            return G__10054__2.call(this, x, y);
          case 3:
            return G__10054__3.call(this, x, y, z);
          default:
            return G__10054__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10054.cljs$lang$maxFixedArity = 3;
      G__10054.cljs$lang$applyTo = G__10054__4.cljs$lang$applyTo;
      return G__10054
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10057 = null;
      var G__10057__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10057__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10057__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10057__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10057__4 = function() {
        var G__10058__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10058 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10058__delegate.call(this, x, y, z, args)
        };
        G__10058.cljs$lang$maxFixedArity = 3;
        G__10058.cljs$lang$applyTo = function(arglist__10059) {
          var x = cljs.core.first(arglist__10059);
          var y = cljs.core.first(cljs.core.next(arglist__10059));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10059)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10059)));
          return G__10058__delegate(x, y, z, args)
        };
        G__10058.cljs$lang$arity$variadic = G__10058__delegate;
        return G__10058
      }();
      G__10057 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10057__0.call(this);
          case 1:
            return G__10057__1.call(this, x);
          case 2:
            return G__10057__2.call(this, x, y);
          case 3:
            return G__10057__3.call(this, x, y, z);
          default:
            return G__10057__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10057.cljs$lang$maxFixedArity = 3;
      G__10057.cljs$lang$applyTo = G__10057__4.cljs$lang$applyTo;
      return G__10057
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10060 = null;
      var G__10060__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10060__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10060__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10060__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10060__4 = function() {
        var G__10061__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10061 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10061__delegate.call(this, x, y, z, args)
        };
        G__10061.cljs$lang$maxFixedArity = 3;
        G__10061.cljs$lang$applyTo = function(arglist__10062) {
          var x = cljs.core.first(arglist__10062);
          var y = cljs.core.first(cljs.core.next(arglist__10062));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10062)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10062)));
          return G__10061__delegate(x, y, z, args)
        };
        G__10061.cljs$lang$arity$variadic = G__10061__delegate;
        return G__10061
      }();
      G__10060 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10060__0.call(this);
          case 1:
            return G__10060__1.call(this, x);
          case 2:
            return G__10060__2.call(this, x, y);
          case 3:
            return G__10060__3.call(this, x, y, z);
          default:
            return G__10060__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10060.cljs$lang$maxFixedArity = 3;
      G__10060.cljs$lang$applyTo = G__10060__4.cljs$lang$applyTo;
      return G__10060
    }()
  };
  var juxt__4 = function() {
    var G__10063__delegate = function(f, g, h, fs) {
      var fs__10053 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10064 = null;
        var G__10064__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10034_SHARP_, p2__10035_SHARP_) {
            return cljs.core.conj.call(null, p1__10034_SHARP_, p2__10035_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10053)
        };
        var G__10064__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10036_SHARP_, p2__10037_SHARP_) {
            return cljs.core.conj.call(null, p1__10036_SHARP_, p2__10037_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10053)
        };
        var G__10064__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10038_SHARP_, p2__10039_SHARP_) {
            return cljs.core.conj.call(null, p1__10038_SHARP_, p2__10039_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10053)
        };
        var G__10064__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10040_SHARP_, p2__10041_SHARP_) {
            return cljs.core.conj.call(null, p1__10040_SHARP_, p2__10041_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10053)
        };
        var G__10064__4 = function() {
          var G__10065__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10042_SHARP_, p2__10043_SHARP_) {
              return cljs.core.conj.call(null, p1__10042_SHARP_, cljs.core.apply.call(null, p2__10043_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10053)
          };
          var G__10065 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10065__delegate.call(this, x, y, z, args)
          };
          G__10065.cljs$lang$maxFixedArity = 3;
          G__10065.cljs$lang$applyTo = function(arglist__10066) {
            var x = cljs.core.first(arglist__10066);
            var y = cljs.core.first(cljs.core.next(arglist__10066));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10066)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10066)));
            return G__10065__delegate(x, y, z, args)
          };
          G__10065.cljs$lang$arity$variadic = G__10065__delegate;
          return G__10065
        }();
        G__10064 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10064__0.call(this);
            case 1:
              return G__10064__1.call(this, x);
            case 2:
              return G__10064__2.call(this, x, y);
            case 3:
              return G__10064__3.call(this, x, y, z);
            default:
              return G__10064__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10064.cljs$lang$maxFixedArity = 3;
        G__10064.cljs$lang$applyTo = G__10064__4.cljs$lang$applyTo;
        return G__10064
      }()
    };
    var G__10063 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10063__delegate.call(this, f, g, h, fs)
    };
    G__10063.cljs$lang$maxFixedArity = 3;
    G__10063.cljs$lang$applyTo = function(arglist__10067) {
      var f = cljs.core.first(arglist__10067);
      var g = cljs.core.first(cljs.core.next(arglist__10067));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10067)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10067)));
      return G__10063__delegate(f, g, h, fs)
    };
    G__10063.cljs$lang$arity$variadic = G__10063__delegate;
    return G__10063
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__10070 = cljs.core.next.call(null, coll);
        coll = G__10070;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____10069 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10069) {
          return n > 0
        }else {
          return and__3822__auto____10069
        }
      }())) {
        var G__10071 = n - 1;
        var G__10072 = cljs.core.next.call(null, coll);
        n = G__10071;
        coll = G__10072;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__10074 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10074), s)) {
    if(cljs.core.count.call(null, matches__10074) === 1) {
      return cljs.core.first.call(null, matches__10074)
    }else {
      return cljs.core.vec.call(null, matches__10074)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10076 = re.exec(s);
  if(matches__10076 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10076) === 1) {
      return cljs.core.first.call(null, matches__10076)
    }else {
      return cljs.core.vec.call(null, matches__10076)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10081 = cljs.core.re_find.call(null, re, s);
  var match_idx__10082 = s.search(re);
  var match_str__10083 = cljs.core.coll_QMARK_.call(null, match_data__10081) ? cljs.core.first.call(null, match_data__10081) : match_data__10081;
  var post_match__10084 = cljs.core.subs.call(null, s, match_idx__10082 + cljs.core.count.call(null, match_str__10083));
  if(cljs.core.truth_(match_data__10081)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10081, re_seq.call(null, re, post_match__10084))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10091__10092 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10093 = cljs.core.nth.call(null, vec__10091__10092, 0, null);
  var flags__10094 = cljs.core.nth.call(null, vec__10091__10092, 1, null);
  var pattern__10095 = cljs.core.nth.call(null, vec__10091__10092, 2, null);
  return new RegExp(pattern__10095, flags__10094)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10085_SHARP_) {
    return print_one.call(null, p1__10085_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____10105 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10105)) {
            var and__3822__auto____10109 = function() {
              var G__10106__10107 = obj;
              if(G__10106__10107) {
                if(function() {
                  var or__3824__auto____10108 = G__10106__10107.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10108) {
                    return or__3824__auto____10108
                  }else {
                    return G__10106__10107.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10106__10107.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10106__10107)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10106__10107)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10109)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10109
            }
          }else {
            return and__3822__auto____10105
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10110 = !(obj == null);
          if(and__3822__auto____10110) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10110
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10111__10112 = obj;
          if(G__10111__10112) {
            if(function() {
              var or__3824__auto____10113 = G__10111__10112.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10113) {
                return or__3824__auto____10113
              }else {
                return G__10111__10112.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10111__10112.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10111__10112)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10111__10112)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10133 = new goog.string.StringBuffer;
  var G__10134__10135 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10134__10135) {
    var string__10136 = cljs.core.first.call(null, G__10134__10135);
    var G__10134__10137 = G__10134__10135;
    while(true) {
      sb__10133.append(string__10136);
      var temp__3974__auto____10138 = cljs.core.next.call(null, G__10134__10137);
      if(temp__3974__auto____10138) {
        var G__10134__10139 = temp__3974__auto____10138;
        var G__10152 = cljs.core.first.call(null, G__10134__10139);
        var G__10153 = G__10134__10139;
        string__10136 = G__10152;
        G__10134__10137 = G__10153;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10140__10141 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10140__10141) {
    var obj__10142 = cljs.core.first.call(null, G__10140__10141);
    var G__10140__10143 = G__10140__10141;
    while(true) {
      sb__10133.append(" ");
      var G__10144__10145 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10142, opts));
      if(G__10144__10145) {
        var string__10146 = cljs.core.first.call(null, G__10144__10145);
        var G__10144__10147 = G__10144__10145;
        while(true) {
          sb__10133.append(string__10146);
          var temp__3974__auto____10148 = cljs.core.next.call(null, G__10144__10147);
          if(temp__3974__auto____10148) {
            var G__10144__10149 = temp__3974__auto____10148;
            var G__10154 = cljs.core.first.call(null, G__10144__10149);
            var G__10155 = G__10144__10149;
            string__10146 = G__10154;
            G__10144__10147 = G__10155;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10150 = cljs.core.next.call(null, G__10140__10143);
      if(temp__3974__auto____10150) {
        var G__10140__10151 = temp__3974__auto____10150;
        var G__10156 = cljs.core.first.call(null, G__10140__10151);
        var G__10157 = G__10140__10151;
        obj__10142 = G__10156;
        G__10140__10143 = G__10157;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10133
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10159 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10159.append("\n");
  return[cljs.core.str(sb__10159)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10178__10179 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10178__10179) {
    var string__10180 = cljs.core.first.call(null, G__10178__10179);
    var G__10178__10181 = G__10178__10179;
    while(true) {
      cljs.core.string_print.call(null, string__10180);
      var temp__3974__auto____10182 = cljs.core.next.call(null, G__10178__10181);
      if(temp__3974__auto____10182) {
        var G__10178__10183 = temp__3974__auto____10182;
        var G__10196 = cljs.core.first.call(null, G__10178__10183);
        var G__10197 = G__10178__10183;
        string__10180 = G__10196;
        G__10178__10181 = G__10197;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10184__10185 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10184__10185) {
    var obj__10186 = cljs.core.first.call(null, G__10184__10185);
    var G__10184__10187 = G__10184__10185;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10188__10189 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10186, opts));
      if(G__10188__10189) {
        var string__10190 = cljs.core.first.call(null, G__10188__10189);
        var G__10188__10191 = G__10188__10189;
        while(true) {
          cljs.core.string_print.call(null, string__10190);
          var temp__3974__auto____10192 = cljs.core.next.call(null, G__10188__10191);
          if(temp__3974__auto____10192) {
            var G__10188__10193 = temp__3974__auto____10192;
            var G__10198 = cljs.core.first.call(null, G__10188__10193);
            var G__10199 = G__10188__10193;
            string__10190 = G__10198;
            G__10188__10191 = G__10199;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10194 = cljs.core.next.call(null, G__10184__10187);
      if(temp__3974__auto____10194) {
        var G__10184__10195 = temp__3974__auto____10194;
        var G__10200 = cljs.core.first.call(null, G__10184__10195);
        var G__10201 = G__10184__10195;
        obj__10186 = G__10200;
        G__10184__10187 = G__10201;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__10202) {
    var objs = cljs.core.seq(arglist__10202);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__10203) {
    var objs = cljs.core.seq(arglist__10203);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__10204) {
    var objs = cljs.core.seq(arglist__10204);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__10205) {
    var objs = cljs.core.seq(arglist__10205);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__10206) {
    var objs = cljs.core.seq(arglist__10206);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__10207) {
    var objs = cljs.core.seq(arglist__10207);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__10208) {
    var objs = cljs.core.seq(arglist__10208);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__10209) {
    var objs = cljs.core.seq(arglist__10209);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__10210) {
    var fmt = cljs.core.first(arglist__10210);
    var args = cljs.core.rest(arglist__10210);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10211 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10211, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10212 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10212, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10213 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10213, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____10214 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10214)) {
        var nspc__10215 = temp__3974__auto____10214;
        return[cljs.core.str(nspc__10215), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10216 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10216)) {
          var nspc__10217 = temp__3974__auto____10216;
          return[cljs.core.str(nspc__10217), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10218 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10218, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__10220 = function(n, len) {
    var ns__10219 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10219) < len) {
        var G__10222 = [cljs.core.str("0"), cljs.core.str(ns__10219)].join("");
        ns__10219 = G__10222;
        continue
      }else {
        return ns__10219
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10220.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10220.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10220.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10220.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10220.call(null, d.getUTCSeconds(),
  2)), cljs.core.str("."), cljs.core.str(normalize__10220.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10221 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10221, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10223 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10224 = this;
  var G__10225__10226 = cljs.core.seq.call(null, this__10224.watches);
  if(G__10225__10226) {
    var G__10228__10230 = cljs.core.first.call(null, G__10225__10226);
    var vec__10229__10231 = G__10228__10230;
    var key__10232 = cljs.core.nth.call(null, vec__10229__10231, 0, null);
    var f__10233 = cljs.core.nth.call(null, vec__10229__10231, 1, null);
    var G__10225__10234 = G__10225__10226;
    var G__10228__10235 = G__10228__10230;
    var G__10225__10236 = G__10225__10234;
    while(true) {
      var vec__10237__10238 = G__10228__10235;
      var key__10239 = cljs.core.nth.call(null, vec__10237__10238, 0, null);
      var f__10240 = cljs.core.nth.call(null, vec__10237__10238, 1, null);
      var G__10225__10241 = G__10225__10236;
      f__10240.call(null, key__10239, this$, oldval, newval);
      var temp__3974__auto____10242 = cljs.core.next.call(null, G__10225__10241);
      if(temp__3974__auto____10242) {
        var G__10225__10243 = temp__3974__auto____10242;
        var G__10250 = cljs.core.first.call(null, G__10225__10243);
        var G__10251 = G__10225__10243;
        G__10228__10235 = G__10250;
        G__10225__10236 = G__10251;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__10244 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10244.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10245 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10245.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10246 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10246.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10247 = this;
  return this__10247.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10248 = this;
  return this__10248.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10249 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10263__delegate = function(x, p__10252) {
      var map__10258__10259 = p__10252;
      var map__10258__10260 = cljs.core.seq_QMARK_.call(null, map__10258__10259) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10258__10259) : map__10258__10259;
      var validator__10261 = cljs.core._lookup.call(null, map__10258__10260, "\ufdd0'validator", null);
      var meta__10262 = cljs.core._lookup.call(null, map__10258__10260, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10262, validator__10261, null)
    };
    var G__10263 = function(x, var_args) {
      var p__10252 = null;
      if(goog.isDef(var_args)) {
        p__10252 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10263__delegate.call(this, x, p__10252)
    };
    G__10263.cljs$lang$maxFixedArity = 1;
    G__10263.cljs$lang$applyTo = function(arglist__10264) {
      var x = cljs.core.first(arglist__10264);
      var p__10252 = cljs.core.rest(arglist__10264);
      return G__10263__delegate(x, p__10252)
    };
    G__10263.cljs$lang$arity$variadic = G__10263__delegate;
    return G__10263
  }();
  atom = function(x, var_args) {
    var p__10252 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____10268 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10268)) {
    var validate__10269 = temp__3974__auto____10268;
    if(cljs.core.truth_(validate__10269.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10270 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10270, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__10271__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10271 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10271__delegate.call(this, a, f, x, y, z, more)
    };
    G__10271.cljs$lang$maxFixedArity = 5;
    G__10271.cljs$lang$applyTo = function(arglist__10272) {
      var a = cljs.core.first(arglist__10272);
      var f = cljs.core.first(cljs.core.next(arglist__10272));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10272)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10272))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10272)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10272)))));
      return G__10271__delegate(a, f, x, y, z, more)
    };
    G__10271.cljs$lang$arity$variadic = G__10271__delegate;
    return G__10271
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10273) {
    var iref = cljs.core.first(arglist__10273);
    var f = cljs.core.first(cljs.core.next(arglist__10273));
    var args = cljs.core.rest(cljs.core.next(arglist__10273));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__10274 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10274.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10275 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10275.state, function(p__10276) {
    var map__10277__10278 = p__10276;
    var map__10277__10279 = cljs.core.seq_QMARK_.call(null, map__10277__10278) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10277__10278) : map__10277__10278;
    var curr_state__10280 = map__10277__10279;
    var done__10281 = cljs.core._lookup.call(null, map__10277__10279, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10281)) {
      return curr_state__10280
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10275.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__10302__10303 = options;
    var map__10302__10304 = cljs.core.seq_QMARK_.call(null, map__10302__10303) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10302__10303) : map__10302__10303;
    var keywordize_keys__10305 = cljs.core._lookup.call(null, map__10302__10304, "\ufdd0'keywordize-keys", null);
    var keyfn__10306 = cljs.core.truth_(keywordize_keys__10305) ? cljs.core.keyword : cljs.core.str;
    var f__10321 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2460__auto____10320 = function iter__10314(s__10315) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10315__10318 = s__10315;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10315__10318)) {
                        var k__10319 = cljs.core.first.call(null, s__10315__10318);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10306.call(null, k__10319), thisfn.call(null, x[k__10319])], true), iter__10314.call(null, cljs.core.rest.call(null, s__10315__10318)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2460__auto____10320.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__10321.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10322) {
    var x = cljs.core.first(arglist__10322);
    var options = cljs.core.rest(arglist__10322);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10327 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10331__delegate = function(args) {
      var temp__3971__auto____10328 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10327), args, null);
      if(cljs.core.truth_(temp__3971__auto____10328)) {
        var v__10329 = temp__3971__auto____10328;
        return v__10329
      }else {
        var ret__10330 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10327, cljs.core.assoc, args, ret__10330);
        return ret__10330
      }
    };
    var G__10331 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10331__delegate.call(this, args)
    };
    G__10331.cljs$lang$maxFixedArity = 0;
    G__10331.cljs$lang$applyTo = function(arglist__10332) {
      var args = cljs.core.seq(arglist__10332);
      return G__10331__delegate(args)
    };
    G__10331.cljs$lang$arity$variadic = G__10331__delegate;
    return G__10331
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10334 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10334)) {
        var G__10335 = ret__10334;
        f = G__10335;
        continue
      }else {
        return ret__10334
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10336__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10336 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10336__delegate.call(this, f, args)
    };
    G__10336.cljs$lang$maxFixedArity = 1;
    G__10336.cljs$lang$applyTo = function(arglist__10337) {
      var f = cljs.core.first(arglist__10337);
      var args = cljs.core.rest(arglist__10337);
      return G__10336__delegate(f, args)
    };
    G__10336.cljs$lang$arity$variadic = G__10336__delegate;
    return G__10336
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__10339 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10339, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10339, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____10348 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10348) {
      return or__3824__auto____10348
    }else {
      var or__3824__auto____10349 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10349) {
        return or__3824__auto____10349
      }else {
        var and__3822__auto____10350 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10350) {
          var and__3822__auto____10351 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10351) {
            var and__3822__auto____10352 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10352) {
              var ret__10353 = true;
              var i__10354 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10355 = cljs.core.not.call(null, ret__10353);
                  if(or__3824__auto____10355) {
                    return or__3824__auto____10355
                  }else {
                    return i__10354 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10353
                }else {
                  var G__10356 = isa_QMARK_.call(null, h, child.call(null, i__10354), parent.call(null, i__10354));
                  var G__10357 = i__10354 + 1;
                  ret__10353 = G__10356;
                  i__10354 = G__10357;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10352
            }
          }else {
            return and__3822__auto____10351
          }
        }else {
          return and__3822__auto____10350
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__10366 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10367 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10368 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10369 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10370 = cljs.core.contains_QMARK_.call(null, tp__10366.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10368.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10368.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10366, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10369.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10367, parent, ta__10368), "\ufdd0'descendants":tf__10369.call(null,
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10368, tag, td__10367)})
    }();
    if(cljs.core.truth_(or__3824__auto____10370)) {
      return or__3824__auto____10370
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__10375 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10376 = cljs.core.truth_(parentMap__10375.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10375.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10377 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10376)) ? cljs.core.assoc.call(null, parentMap__10375, tag, childsParents__10376) : cljs.core.dissoc.call(null, parentMap__10375, tag);
    var deriv_seq__10378 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10358_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10358_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10358_SHARP_), cljs.core.second.call(null, p1__10358_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10377)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10375.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10359_SHARP_, p2__10360_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10359_SHARP_, p2__10360_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10378))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__10386 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10388 = cljs.core.truth_(function() {
    var and__3822__auto____10387 = xprefs__10386;
    if(cljs.core.truth_(and__3822__auto____10387)) {
      return xprefs__10386.call(null, y)
    }else {
      return and__3822__auto____10387
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10388)) {
    return or__3824__auto____10388
  }else {
    var or__3824__auto____10390 = function() {
      var ps__10389 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10389) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10389), prefer_table))) {
          }else {
          }
          var G__10393 = cljs.core.rest.call(null, ps__10389);
          ps__10389 = G__10393;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10390)) {
      return or__3824__auto____10390
    }else {
      var or__3824__auto____10392 = function() {
        var ps__10391 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10391) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10391), y, prefer_table))) {
            }else {
            }
            var G__10394 = cljs.core.rest.call(null, ps__10391);
            ps__10391 = G__10394;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10392)) {
        return or__3824__auto____10392
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10396 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10396)) {
    return or__3824__auto____10396
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10414 = cljs.core.reduce.call(null, function(be, p__10406) {
    var vec__10407__10408 = p__10406;
    var k__10409 = cljs.core.nth.call(null, vec__10407__10408, 0, null);
    var ___10410 = cljs.core.nth.call(null, vec__10407__10408, 1, null);
    var e__10411 = vec__10407__10408;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10409)) {
      var be2__10413 = cljs.core.truth_(function() {
        var or__3824__auto____10412 = be == null;
        if(or__3824__auto____10412) {
          return or__3824__auto____10412
        }else {
          return cljs.core.dominates.call(null, k__10409, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10411 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10413), k__10409, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10409), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10413)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10413
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10414)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10414));
      return cljs.core.second.call(null, best_entry__10414)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10419 = mf;
    if(and__3822__auto____10419) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10419
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2361__auto____10420 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10421 = cljs.core._reset[goog.typeOf(x__2361__auto____10420)];
      if(or__3824__auto____10421) {
        return or__3824__auto____10421
      }else {
        var or__3824__auto____10422 = cljs.core._reset["_"];
        if(or__3824__auto____10422) {
          return or__3824__auto____10422
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10427 = mf;
    if(and__3822__auto____10427) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10427
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2361__auto____10428 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10429 = cljs.core._add_method[goog.typeOf(x__2361__auto____10428)];
      if(or__3824__auto____10429) {
        return or__3824__auto____10429
      }else {
        var or__3824__auto____10430 = cljs.core._add_method["_"];
        if(or__3824__auto____10430) {
          return or__3824__auto____10430
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10435 = mf;
    if(and__3822__auto____10435) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10435
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2361__auto____10436 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10437 = cljs.core._remove_method[goog.typeOf(x__2361__auto____10436)];
      if(or__3824__auto____10437) {
        return or__3824__auto____10437
      }else {
        var or__3824__auto____10438 = cljs.core._remove_method["_"];
        if(or__3824__auto____10438) {
          return or__3824__auto____10438
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10443 = mf;
    if(and__3822__auto____10443) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10443
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2361__auto____10444 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10445 = cljs.core._prefer_method[goog.typeOf(x__2361__auto____10444)];
      if(or__3824__auto____10445) {
        return or__3824__auto____10445
      }else {
        var or__3824__auto____10446 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10446) {
          return or__3824__auto____10446
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10451 = mf;
    if(and__3822__auto____10451) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10451
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2361__auto____10452 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10453 = cljs.core._get_method[goog.typeOf(x__2361__auto____10452)];
      if(or__3824__auto____10453) {
        return or__3824__auto____10453
      }else {
        var or__3824__auto____10454 = cljs.core._get_method["_"];
        if(or__3824__auto____10454) {
          return or__3824__auto____10454
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10459 = mf;
    if(and__3822__auto____10459) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10459
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2361__auto____10460 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10461 = cljs.core._methods[goog.typeOf(x__2361__auto____10460)];
      if(or__3824__auto____10461) {
        return or__3824__auto____10461
      }else {
        var or__3824__auto____10462 = cljs.core._methods["_"];
        if(or__3824__auto____10462) {
          return or__3824__auto____10462
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10467 = mf;
    if(and__3822__auto____10467) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10467
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2361__auto____10468 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10469 = cljs.core._prefers[goog.typeOf(x__2361__auto____10468)];
      if(or__3824__auto____10469) {
        return or__3824__auto____10469
      }else {
        var or__3824__auto____10470 = cljs.core._prefers["_"];
        if(or__3824__auto____10470) {
          return or__3824__auto____10470
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10475 = mf;
    if(and__3822__auto____10475) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10475
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2361__auto____10476 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10477 = cljs.core._dispatch[goog.typeOf(x__2361__auto____10476)];
      if(or__3824__auto____10477) {
        return or__3824__auto____10477
      }else {
        var or__3824__auto____10478 = cljs.core._dispatch["_"];
        if(or__3824__auto____10478) {
          return or__3824__auto____10478
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10481 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10482 = cljs.core._get_method.call(null, mf, dispatch_val__10481);
  if(cljs.core.truth_(target_fn__10482)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10481)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10482, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10483 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10484 = this;
  cljs.core.swap_BANG_.call(null, this__10484.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10484.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10484.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10484.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10485 = this;
  cljs.core.swap_BANG_.call(null, this__10485.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10485.method_cache, this__10485.method_table, this__10485.cached_hierarchy, this__10485.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10486 = this;
  cljs.core.swap_BANG_.call(null, this__10486.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10486.method_cache, this__10486.method_table, this__10486.cached_hierarchy, this__10486.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10487 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10487.cached_hierarchy), cljs.core.deref.call(null, this__10487.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10487.method_cache, this__10487.method_table, this__10487.cached_hierarchy, this__10487.hierarchy)
  }
  var temp__3971__auto____10488 = cljs.core.deref.call(null, this__10487.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10488)) {
    var target_fn__10489 = temp__3971__auto____10488;
    return target_fn__10489
  }else {
    var temp__3971__auto____10490 = cljs.core.find_and_cache_best_method.call(null, this__10487.name, dispatch_val, this__10487.hierarchy, this__10487.method_table, this__10487.prefer_table, this__10487.method_cache, this__10487.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10490)) {
      var target_fn__10491 = temp__3971__auto____10490;
      return target_fn__10491
    }else {
      return cljs.core.deref.call(null, this__10487.method_table).call(null, this__10487.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10492 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10492.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10492.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10492.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10492.method_cache, this__10492.method_table, this__10492.cached_hierarchy, this__10492.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10493 = this;
  return cljs.core.deref.call(null, this__10493.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10494 = this;
  return cljs.core.deref.call(null, this__10494.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10495 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10495.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10497__delegate = function(_, args) {
    var self__10496 = this;
    return cljs.core._dispatch.call(null, self__10496, args)
  };
  var G__10497 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10497__delegate.call(this, _, args)
  };
  G__10497.cljs$lang$maxFixedArity = 1;
  G__10497.cljs$lang$applyTo = function(arglist__10498) {
    var _ = cljs.core.first(arglist__10498);
    var args = cljs.core.rest(arglist__10498);
    return G__10497__delegate(_, args)
  };
  G__10497.cljs$lang$arity$variadic = G__10497__delegate;
  return G__10497
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10499 = this;
  return cljs.core._dispatch.call(null, self__10499, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10500 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10502, _) {
  var this__10501 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10501.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10503 = this;
  var and__3822__auto____10504 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10504) {
    return this__10503.uuid === other.uuid
  }else {
    return and__3822__auto____10504
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10505 = this;
  var this__10506 = this;
  return cljs.core.pr_str.call(null, this__10506)
};
cljs.core.UUID;
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange",
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut",
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events.EventType");
goog.require("goog.events.EventTarget");
goog.require("goog.events");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3822__auto____6553 = this$;
    if(and__3822__auto____6553) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____6553
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2361__auto____6554 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6555 = clojure.browser.event.event_types[goog.typeOf(x__2361__auto____6554)];
      if(or__3824__auto____6555) {
        return or__3824__auto____6555
      }else {
        var or__3824__auto____6556 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____6556) {
          return or__3824__auto____6556
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__6557) {
    var vec__6558__6559 = p__6557;
    var k__6560 = cljs.core.nth.call(null, vec__6558__6559, 0, null);
    var v__6561 = cljs.core.nth.call(null, vec__6558__6559, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6560.toLowerCase()), v__6561], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__6562) {
    var vec__6563__6564 = p__6562;
    var k__6565 = cljs.core.nth.call(null, vec__6563__6564, 0, null);
    var v__6566 = cljs.core.nth.call(null, vec__6563__6564, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6565.toLowerCase()), v__6566], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__3 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__3.call(this, src, type, fn);
      case 4:
        return listen__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen.cljs$lang$arity$3 = listen__3;
  listen.cljs$lang$arity$4 = listen__4;
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__3 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__3.call(this, src, type, fn);
      case 4:
        return listen_once__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once.cljs$lang$arity$3 = listen_once__3;
  listen_once.cljs$lang$arity$4 = listen_once__4;
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__3 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__3.call(this, src, type, fn);
      case 4:
        return unlisten__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten.cljs$lang$arity$3 = unlisten__3;
  unlisten.cljs$lang$arity$4 = unlisten__4;
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey(key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent(src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose(e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount()
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET",
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE",
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("domina.support");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.dom");
var div__10914 = document.createElement("div");
var test_html__10915 = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";
div__10914.innerHTML = test_html__10915;
domina.support.leading_whitespace_QMARK_ = cljs.core._EQ_.call(null, div__10914.firstChild.nodeType, 3);
domina.support.extraneous_tbody_QMARK_ = cljs.core._EQ_.call(null, div__10914.getElementsByTagName("tbody").length, 0);
domina.support.unscoped_html_elements_QMARK_ = cljs.core._EQ_.call(null, div__10914.getElementsByTagName("link").length, 0);
goog.provide("goog.dom.xml");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.dom.xml.MAX_XML_SIZE_KB = 2 * 1024;
goog.dom.xml.MAX_ELEMENT_DEPTH = 256;
goog.dom.xml.createDocument = function(opt_rootTagName, opt_namespaceUri) {
  if(opt_namespaceUri && !opt_rootTagName) {
    throw Error("Can't create document with namespace and no root tag");
  }
  if(document.implementation && document.implementation.createDocument) {
    return document.implementation.createDocument(opt_namespaceUri || "", opt_rootTagName || "", null)
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      if(doc) {
        if(opt_rootTagName) {
          doc.appendChild(doc.createNode(goog.dom.NodeType.ELEMENT, opt_rootTagName, opt_namespaceUri || ""))
        }
        return doc
      }
    }
  }
  throw Error("Your browser does not support creating new documents");
};
goog.dom.xml.loadXml = function(xml) {
  if(typeof DOMParser != "undefined") {
    return(new DOMParser).parseFromString(xml, "application/xml")
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      doc.loadXML(xml);
      return doc
    }
  }
  throw Error("Your browser does not support loading xml documents");
};
goog.dom.xml.serialize = function(xml) {
  if(typeof XMLSerializer != "undefined") {
    return(new XMLSerializer).serializeToString(xml)
  }
  var text = xml.xml;
  if(text) {
    return text
  }
  throw Error("Your browser does not support serializing XML documents");
};
goog.dom.xml.selectSingleNode = function(node, path) {
  if(typeof node.selectSingleNode != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectSingleNode(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var result = doc.evaluate(path, node, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue
    }
  }
  return null
};
goog.dom.xml.selectNodes = function(node, path) {
  if(typeof node.selectNodes != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectNodes(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var nodes = doc.evaluate(path, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var results = [];
      var count = nodes.snapshotLength;
      for(var i = 0;i < count;i++) {
        results.push(nodes.snapshotItem(i))
      }
      return results
    }else {
      return[]
    }
  }
};
goog.dom.xml.createMsXmlDocument_ = function() {
  var doc = new ActiveXObject("MSXML2.DOMDocument");
  if(doc) {
    doc.resolveExternals = false;
    doc.validateOnParse = false;
    try {
      doc.setProperty("ProhibitDTD", true);
      doc.setProperty("MaxXMLSize", goog.dom.xml.MAX_XML_SIZE_KB);
      doc.setProperty("MaxElementDepth", goog.dom.xml.MAX_ELEMENT_DEPTH)
    }catch(e) {
    }
  }
  return doc
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.dom.forms");
goog.require("goog.structs.Map");
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map;
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("&")
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(el.disabled || el.tagName.toLowerCase() == "fieldset") {
      continue
    }
    var name = el.name;
    var type = el.type.toLowerCase();
    switch(type) {
      case "file":
      ;
      case "submit":
      ;
      case "reset":
      ;
      case "button":
        break;
      case "select-multiple":
        var values = goog.dom.forms.getValue(el);
        if(values != null) {
          for(var value, j = 0;value = values[j];j++) {
            fnAppend(result, name, value)
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if(value != null) {
          fnAppend(result, name, value)
        }
    }
  }
  var inputs = form.getElementsByTagName("input");
  for(var input, i = 0;input = inputs[i];i++) {
    if(input.form == form && input.type.toLowerCase() == "image") {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0")
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if(!array) {
    array = [];
    map.set(name, array)
  }
  array.push(value)
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "=" + encodeURIComponent(value))
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(!el.disabled && el.type && el.type.toLowerCase() == "file") {
      return true
    }
  }
  return false
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if(el.tagName == "FORM") {
    var els = el.elements;
    for(var i = 0;el = els[i];i++) {
      goog.dom.forms.setDisabled(el, disabled)
    }
  }else {
    if(disabled == true) {
      el.blur()
    }
    el.disabled = disabled
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if(el.select) {
    el.select()
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return!!value
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return!!value
};
goog.dom.forms.getValue = function(el) {
  var type = el.type;
  if(!goog.isDef(type)) {
    return null
  }
  switch(type.toLowerCase()) {
    case "checkbox":
    ;
    case "radio":
      return goog.dom.forms.getInputChecked_(el);
    case "select-one":
      return goog.dom.forms.getSelectSingle_(el);
    case "select-multiple":
      return goog.dom.forms.getSelectMultiple_(el);
    default:
      return goog.isDef(el.value) ? el.value : null
  }
};
goog.dom.$F = goog.dom.forms.getValue;
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if(els.type) {
    return goog.dom.forms.getValue(els)
  }else {
    for(var i = 0;i < els.length;i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if(val) {
        return val
      }
    }
    return null
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for(var option, i = 0;option = el.options[i];i++) {
    if(option.selected) {
      values.push(option.value)
    }
  }
  return values.length ? values : null
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  if(goog.isDef(type)) {
    switch(type.toLowerCase()) {
      case "checkbox":
      ;
      case "radio":
        goog.dom.forms.setInputChecked_(el, opt_value);
        break;
      case "select-one":
        goog.dom.forms.setSelectSingle_(el, opt_value);
        break;
      case "select-multiple":
        goog.dom.forms.setSelectMultiple_(el, opt_value);
        break;
      default:
        el.value = goog.isDefAndNotNull(opt_value) ? opt_value : ""
    }
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value ? "checked" : null
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if(goog.isString(opt_value)) {
    for(var option, i = 0;option = el.options[i];i++) {
      if(option.value == opt_value) {
        option.selected = true;
        break
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if(goog.isString(opt_value)) {
    opt_value = [opt_value]
  }
  for(var option, i = 0;option = el.options[i];i++) {
    option.selected = false;
    if(opt_value) {
      for(var value, j = 0;value = opt_value[j];j++) {
        if(option.value == value) {
          option.selected = true
        }
      }
    }
  }
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__10922 = s;
      var limit__10923 = limit;
      var parts__10924 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__10923, 1)) {
          return cljs.core.conj.call(null, parts__10924, s__10922)
        }else {
          var temp__3971__auto____10925 = cljs.core.re_find.call(null, re, s__10922);
          if(cljs.core.truth_(temp__3971__auto____10925)) {
            var m__10926 = temp__3971__auto____10925;
            var index__10927 = s__10922.indexOf(m__10926);
            var G__10928 = s__10922.substring(index__10927 + cljs.core.count.call(null, m__10926));
            var G__10929 = limit__10923 - 1;
            var G__10930 = cljs.core.conj.call(null, parts__10924, s__10922.substring(0, index__10927));
            s__10922 = G__10928;
            limit__10923 = G__10929;
            parts__10924 = G__10930;
            continue
          }else {
            return cljs.core.conj.call(null, parts__10924, s__10922)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__10934 = s.length;
  while(true) {
    if(index__10934 === 0) {
      return""
    }else {
      var ch__10935 = cljs.core._lookup.call(null, s, index__10934 - 1, null);
      if(function() {
        var or__3824__auto____10936 = cljs.core._EQ_.call(null, ch__10935, "\n");
        if(or__3824__auto____10936) {
          return or__3824__auto____10936
        }else {
          return cljs.core._EQ_.call(null, ch__10935, "\r")
        }
      }()) {
        var G__10937 = index__10934 - 1;
        index__10934 = G__10937;
        continue
      }else {
        return s.substring(0, index__10934)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__10941 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____10942 = cljs.core.not.call(null, s__10941);
    if(or__3824__auto____10942) {
      return or__3824__auto____10942
    }else {
      var or__3824__auto____10943 = cljs.core._EQ_.call(null, "", s__10941);
      if(or__3824__auto____10943) {
        return or__3824__auto____10943
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__10941)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__10950 = new goog.string.StringBuffer;
  var length__10951 = s.length;
  var index__10952 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__10951, index__10952)) {
      return buffer__10950.toString()
    }else {
      var ch__10953 = s.charAt(index__10952);
      var temp__3971__auto____10954 = cljs.core._lookup.call(null, cmap, ch__10953, null);
      if(cljs.core.truth_(temp__3971__auto____10954)) {
        var replacement__10955 = temp__3971__auto____10954;
        buffer__10950.append([cljs.core.str(replacement__10955)].join(""))
      }else {
        buffer__10950.append(ch__10953)
      }
      var G__10956 = index__10952 + 1;
      index__10952 = G__10956;
      continue
    }
    break
  }
};
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("domina");
goog.require("cljs.core");
goog.require("domina.support");
goog.require("goog.dom.classes");
goog.require("goog.events");
goog.require("goog.dom.xml");
goog.require("goog.dom.forms");
goog.require("goog.dom");
goog.require("goog.string");
goog.require("clojure.string");
goog.require("goog.style");
goog.require("cljs.core");
domina.re_html = /<|&#?\w+;/;
domina.re_leading_whitespace = /^\s+/;
domina.re_xhtml_tag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/i;
domina.re_tag_name = /<([\w:]+)/;
domina.re_no_inner_html = /<(?:script|style)/i;
domina.re_tbody = /<tbody/i;
var opt_wrapper__10507 = cljs.core.PersistentVector.fromArray([1, "<select multiple='multiple'>", "</select>"], true);
var table_section_wrapper__10508 = cljs.core.PersistentVector.fromArray([1, "<table>", "</table>"], true);
var cell_wrapper__10509 = cljs.core.PersistentVector.fromArray([3, "<table><tbody><tr>", "</tr></tbody></table>"], true);
domina.wrap_map = cljs.core.ObjMap.fromObject(["col", "\ufdd0'default", "tfoot", "caption", "optgroup", "legend", "area", "td", "thead", "th", "option", "tbody", "tr", "colgroup"], {"col":cljs.core.PersistentVector.fromArray([2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], true), "\ufdd0'default":cljs.core.PersistentVector.fromArray([0, "", ""], true), "tfoot":table_section_wrapper__10508, "caption":table_section_wrapper__10508, "optgroup":opt_wrapper__10507, "legend":cljs.core.PersistentVector.fromArray([1,
"<fieldset>", "</fieldset>"], true), "area":cljs.core.PersistentVector.fromArray([1, "<map>", "</map>"], true), "td":cell_wrapper__10509, "thead":table_section_wrapper__10508, "th":cell_wrapper__10509, "option":opt_wrapper__10507, "tbody":table_section_wrapper__10508, "tr":cljs.core.PersistentVector.fromArray([2, "<table><tbody>", "</tbody></table>"], true), "colgroup":table_section_wrapper__10508});
domina.remove_extraneous_tbody_BANG_ = function remove_extraneous_tbody_BANG_(div, html) {
  var no_tbody_QMARK___10522 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_tbody, html));
  var tbody__10526 = function() {
    var and__3822__auto____10523 = cljs.core._EQ_.call(null, domina.tag_name, "table");
    if(and__3822__auto____10523) {
      return no_tbody_QMARK___10522
    }else {
      return and__3822__auto____10523
    }
  }() ? function() {
    var and__3822__auto____10524 = div.firstChild;
    if(cljs.core.truth_(and__3822__auto____10524)) {
      return div.firstChild.childNodes
    }else {
      return and__3822__auto____10524
    }
  }() : function() {
    var and__3822__auto____10525 = cljs.core._EQ_.call(null, domina.start_wrap, "<table>");
    if(and__3822__auto____10525) {
      return no_tbody_QMARK___10522
    }else {
      return and__3822__auto____10525
    }
  }() ? divchildNodes : cljs.core.PersistentVector.EMPTY;
  var G__10527__10528 = cljs.core.seq.call(null, tbody__10526);
  if(G__10527__10528) {
    var child__10529 = cljs.core.first.call(null, G__10527__10528);
    var G__10527__10530 = G__10527__10528;
    while(true) {
      if(function() {
        var and__3822__auto____10531 = cljs.core._EQ_.call(null, child__10529.nodeName, "tbody");
        if(and__3822__auto____10531) {
          return cljs.core._EQ_.call(null, child__10529.childNodes.length, 0)
        }else {
          return and__3822__auto____10531
        }
      }()) {
        child__10529.parentNode.removeChild(child__10529)
      }else {
      }
      var temp__3974__auto____10532 = cljs.core.next.call(null, G__10527__10530);
      if(temp__3974__auto____10532) {
        var G__10527__10533 = temp__3974__auto____10532;
        var G__10534 = cljs.core.first.call(null, G__10527__10533);
        var G__10535 = G__10527__10533;
        child__10529 = G__10534;
        G__10527__10530 = G__10535;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
domina.restore_leading_whitespace_BANG_ = function restore_leading_whitespace_BANG_(div, html) {
  return div.insertBefore(document.createTextNode(cljs.core.first.call(null, cljs.core.re_find.call(null, domina.re_leading_whitespace, html))), div.firstChild)
};
domina.html_to_dom = function html_to_dom(html) {
  var html__10549 = clojure.string.replace.call(null, html, domina.re_xhtml_tag, "<$1></$2>");
  var tag_name__10550 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html__10549)))].join("").toLowerCase();
  var vec__10548__10551 = cljs.core._lookup.call(null, domina.wrap_map, tag_name__10550, (new cljs.core.Keyword("\ufdd0'default")).call(null, domina.wrap_map));
  var depth__10552 = cljs.core.nth.call(null, vec__10548__10551, 0, null);
  var start_wrap__10553 = cljs.core.nth.call(null, vec__10548__10551, 1, null);
  var end_wrap__10554 = cljs.core.nth.call(null, vec__10548__10551, 2, null);
  var div__10558 = function() {
    var wrapper__10556 = function() {
      var div__10555 = document.createElement("div");
      div__10555.innerHTML = [cljs.core.str(start_wrap__10553), cljs.core.str(html__10549), cljs.core.str(end_wrap__10554)].join("");
      return div__10555
    }();
    var level__10557 = depth__10552;
    while(true) {
      if(level__10557 > 0) {
        var G__10560 = wrapper__10556.lastChild;
        var G__10561 = level__10557 - 1;
        wrapper__10556 = G__10560;
        level__10557 = G__10561;
        continue
      }else {
        return wrapper__10556
      }
      break
    }
  }();
  if(cljs.core.truth_(domina.support.extraneous_tbody_QMARK_)) {
    domina.remove_extraneous_tbody_BANG_.call(null, div__10558, html__10549)
  }else {
  }
  if(cljs.core.truth_(function() {
    var and__3822__auto____10559 = cljs.core.not.call(null, domina.support.leading_whitespace_QMARK_);
    if(and__3822__auto____10559) {
      return cljs.core.re_find.call(null, domina.re_leading_whitespace, html__10549)
    }else {
      return and__3822__auto____10559
    }
  }())) {
    domina.restore_leading_whitespace_BANG_.call(null, div__10558, html__10549)
  }else {
  }
  return div__10558.childNodes
};
domina.string_to_dom = function string_to_dom(s) {
  if(cljs.core.truth_(cljs.core.re_find.call(null, domina.re_html, s))) {
    return domina.html_to_dom.call(null, s)
  }else {
    return document.createTextNode(s)
  }
};
domina.DomContent = {};
domina.nodes = function nodes(content) {
  if(function() {
    var and__3822__auto____10566 = content;
    if(and__3822__auto____10566) {
      return content.domina$DomContent$nodes$arity$1
    }else {
      return and__3822__auto____10566
    }
  }()) {
    return content.domina$DomContent$nodes$arity$1(content)
  }else {
    var x__2361__auto____10567 = content == null ? null : content;
    return function() {
      var or__3824__auto____10568 = domina.nodes[goog.typeOf(x__2361__auto____10567)];
      if(or__3824__auto____10568) {
        return or__3824__auto____10568
      }else {
        var or__3824__auto____10569 = domina.nodes["_"];
        if(or__3824__auto____10569) {
          return or__3824__auto____10569
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.nodes", content);
        }
      }
    }().call(null, content)
  }
};
domina.single_node = function single_node(nodeseq) {
  if(function() {
    var and__3822__auto____10574 = nodeseq;
    if(and__3822__auto____10574) {
      return nodeseq.domina$DomContent$single_node$arity$1
    }else {
      return and__3822__auto____10574
    }
  }()) {
    return nodeseq.domina$DomContent$single_node$arity$1(nodeseq)
  }else {
    var x__2361__auto____10575 = nodeseq == null ? null : nodeseq;
    return function() {
      var or__3824__auto____10576 = domina.single_node[goog.typeOf(x__2361__auto____10575)];
      if(or__3824__auto____10576) {
        return or__3824__auto____10576
      }else {
        var or__3824__auto____10577 = domina.single_node["_"];
        if(or__3824__auto____10577) {
          return or__3824__auto____10577
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.single-node", nodeseq);
        }
      }
    }().call(null, nodeseq)
  }
};
domina._STAR_debug_STAR_ = true;
domina.log_debug = function() {
  var log_debug__delegate = function(mesg) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10579 = domina._STAR_debug_STAR_;
      if(cljs.core.truth_(and__3822__auto____10579)) {
        return!cljs.core._EQ_.call(null, window.console, undefined)
      }else {
        return and__3822__auto____10579
      }
    }())) {
      return console.log(cljs.core.apply.call(null, cljs.core.str, mesg))
    }else {
      return null
    }
  };
  var log_debug = function(var_args) {
    var mesg = null;
    if(goog.isDef(var_args)) {
      mesg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log_debug__delegate.call(this, mesg)
  };
  log_debug.cljs$lang$maxFixedArity = 0;
  log_debug.cljs$lang$applyTo = function(arglist__10580) {
    var mesg = cljs.core.seq(arglist__10580);
    return log_debug__delegate(mesg)
  };
  log_debug.cljs$lang$arity$variadic = log_debug__delegate;
  return log_debug
}();
domina.log = function() {
  var log__delegate = function(mesg) {
    if(cljs.core.truth_(window.console)) {
      return console.log(cljs.core.apply.call(null, cljs.core.str, mesg))
    }else {
      return null
    }
  };
  var log = function(var_args) {
    var mesg = null;
    if(goog.isDef(var_args)) {
      mesg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, mesg)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__10581) {
    var mesg = cljs.core.seq(arglist__10581);
    return log__delegate(mesg)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
domina.by_id = function by_id(id) {
  return goog.dom.getElement(cljs.core.name.call(null, id))
};
domina.by_class = function by_class(class_name) {
  if(void 0 === domina.t10589) {
    domina.t10589 = function(class_name, by_class, meta10590) {
      this.class_name = class_name;
      this.by_class = by_class;
      this.meta10590 = meta10590;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    domina.t10589.cljs$lang$type = true;
    domina.t10589.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
      return cljs.core.list.call(null, "domina/t10589")
    };
    domina.t10589.prototype.domina$DomContent$ = true;
    domina.t10589.prototype.domina$DomContent$nodes$arity$1 = function(_) {
      var this__10592 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementsByClass(cljs.core.name.call(null, this__10592.class_name)))
    };
    domina.t10589.prototype.domina$DomContent$single_node$arity$1 = function(_) {
      var this__10593 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementByClass(cljs.core.name.call(null, this__10593.class_name)))
    };
    domina.t10589.prototype.cljs$core$IMeta$_meta$arity$1 = function(_10591) {
      var this__10594 = this;
      return this__10594.meta10590
    };
    domina.t10589.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_10591, meta10590) {
      var this__10595 = this;
      return new domina.t10589(this__10595.class_name, this__10595.by_class, meta10590)
    };
    domina.t10589
  }else {
  }
  return new domina.t10589(class_name, by_class, null)
};
domina.children = function children(content) {
  return cljs.core.doall.call(null, cljs.core.mapcat.call(null, goog.dom.getChildren, domina.nodes.call(null, content)))
};
domina.clone = function clone(content) {
  return cljs.core.map.call(null, function(p1__10596_SHARP_) {
    return p1__10596_SHARP_.cloneNode(true)
  }, domina.nodes.call(null, content))
};
domina.append_BANG_ = function append_BANG_(parent_content, child_content) {
  domina.apply_with_cloning.call(null, goog.dom.appendChild, parent_content, child_content);
  return parent_content
};
domina.insert_BANG_ = function insert_BANG_(parent_content, child_content, idx) {
  domina.apply_with_cloning.call(null, function(p1__10597_SHARP_, p2__10598_SHARP_) {
    return goog.dom.insertChildAt(p1__10597_SHARP_, p2__10598_SHARP_, idx)
  }, parent_content, child_content);
  return parent_content
};
domina.prepend_BANG_ = function prepend_BANG_(parent_content, child_content) {
  domina.insert_BANG_.call(null, parent_content, child_content, 0);
  return parent_content
};
domina.insert_before_BANG_ = function insert_before_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10600_SHARP_, p2__10599_SHARP_) {
    return goog.dom.insertSiblingBefore(p2__10599_SHARP_, p1__10600_SHARP_)
  }, content, new_content);
  return content
};
domina.insert_after_BANG_ = function insert_after_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10602_SHARP_, p2__10601_SHARP_) {
    return goog.dom.insertSiblingAfter(p2__10601_SHARP_, p1__10602_SHARP_)
  }, content, new_content);
  return content
};
domina.swap_content_BANG_ = function swap_content_BANG_(old_content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10604_SHARP_, p2__10603_SHARP_) {
    return goog.dom.replaceNode(p2__10603_SHARP_, p1__10604_SHARP_)
  }, old_content, new_content);
  return old_content
};
domina.detach_BANG_ = function detach_BANG_(content) {
  return cljs.core.doall.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_BANG_ = function destroy_BANG_(content) {
  return cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_children_BANG_ = function destroy_children_BANG_(content) {
  cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeChildren, domina.nodes.call(null, content)));
  return content
};
domina.style = function style(content, name) {
  var s__10606 = goog.style.getStyle(domina.single_node.call(null, content), cljs.core.name.call(null, name));
  if(cljs.core.truth_(clojure.string.blank_QMARK_.call(null, s__10606))) {
    return null
  }else {
    return s__10606
  }
};
domina.attr = function attr(content, name) {
  return domina.single_node.call(null, content).getAttribute(cljs.core.name.call(null, name))
};
domina.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(content, name, value) {
    var G__10613__10614 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10613__10614) {
      var n__10615 = cljs.core.first.call(null, G__10613__10614);
      var G__10613__10616 = G__10613__10614;
      while(true) {
        goog.style.setStyle(n__10615, cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__3974__auto____10617 = cljs.core.next.call(null, G__10613__10616);
        if(temp__3974__auto____10617) {
          var G__10613__10618 = temp__3974__auto____10617;
          var G__10619 = cljs.core.first.call(null, G__10613__10618);
          var G__10620 = G__10613__10618;
          n__10615 = G__10619;
          G__10613__10616 = G__10620;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_style_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_style_BANG___delegate.call(this, content, name, value)
  };
  set_style_BANG_.cljs$lang$maxFixedArity = 2;
  set_style_BANG_.cljs$lang$applyTo = function(arglist__10621) {
    var content = cljs.core.first(arglist__10621);
    var name = cljs.core.first(cljs.core.next(arglist__10621));
    var value = cljs.core.rest(cljs.core.next(arglist__10621));
    return set_style_BANG___delegate(content, name, value)
  };
  set_style_BANG_.cljs$lang$arity$variadic = set_style_BANG___delegate;
  return set_style_BANG_
}();
domina.set_attr_BANG_ = function() {
  var set_attr_BANG___delegate = function(content, name, value) {
    var G__10628__10629 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10628__10629) {
      var n__10630 = cljs.core.first.call(null, G__10628__10629);
      var G__10628__10631 = G__10628__10629;
      while(true) {
        n__10630.setAttribute(cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__3974__auto____10632 = cljs.core.next.call(null, G__10628__10631);
        if(temp__3974__auto____10632) {
          var G__10628__10633 = temp__3974__auto____10632;
          var G__10634 = cljs.core.first.call(null, G__10628__10633);
          var G__10635 = G__10628__10633;
          n__10630 = G__10634;
          G__10628__10631 = G__10635;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_attr_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_attr_BANG___delegate.call(this, content, name, value)
  };
  set_attr_BANG_.cljs$lang$maxFixedArity = 2;
  set_attr_BANG_.cljs$lang$applyTo = function(arglist__10636) {
    var content = cljs.core.first(arglist__10636);
    var name = cljs.core.first(cljs.core.next(arglist__10636));
    var value = cljs.core.rest(cljs.core.next(arglist__10636));
    return set_attr_BANG___delegate(content, name, value)
  };
  set_attr_BANG_.cljs$lang$arity$variadic = set_attr_BANG___delegate;
  return set_attr_BANG_
}();
domina.remove_attr_BANG_ = function remove_attr_BANG_(content, name) {
  var G__10643__10644 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10643__10644) {
    var n__10645 = cljs.core.first.call(null, G__10643__10644);
    var G__10643__10646 = G__10643__10644;
    while(true) {
      n__10645.removeAttribute(cljs.core.name.call(null, name));
      var temp__3974__auto____10647 = cljs.core.next.call(null, G__10643__10646);
      if(temp__3974__auto____10647) {
        var G__10643__10648 = temp__3974__auto____10647;
        var G__10649 = cljs.core.first.call(null, G__10643__10648);
        var G__10650 = G__10643__10648;
        n__10645 = G__10649;
        G__10643__10646 = G__10650;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.parse_style_attributes = function parse_style_attributes(style) {
  return cljs.core.reduce.call(null, function(acc, pair) {
    var vec__10656__10657 = pair.split(/\s*:\s*/);
    var k__10658 = cljs.core.nth.call(null, vec__10656__10657, 0, null);
    var v__10659 = cljs.core.nth.call(null, vec__10656__10657, 1, null);
    if(cljs.core.truth_(function() {
      var and__3822__auto____10660 = k__10658;
      if(cljs.core.truth_(and__3822__auto____10660)) {
        return v__10659
      }else {
        return and__3822__auto____10660
      }
    }())) {
      return cljs.core.assoc.call(null, acc, cljs.core.keyword.call(null, k__10658.toLowerCase()), v__10659)
    }else {
      return acc
    }
  }, cljs.core.ObjMap.EMPTY, style.split(/\s*;\s*/))
};
domina.styles = function styles(content) {
  var style__10663 = domina.attr.call(null, content, "style");
  if(cljs.core.string_QMARK_.call(null, style__10663)) {
    return domina.parse_style_attributes.call(null, style__10663)
  }else {
    if(cljs.core.truth_(style__10663.cssText)) {
      return domina.parse_style_attributes.call(null, style__10663.cssText)
    }else {
      return null
    }
  }
};
domina.attrs = function attrs(content) {
  var node__10669 = domina.single_node.call(null, content);
  var attrs__10670 = node__10669.attributes;
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.filter.call(null, cljs.core.complement.call(null, cljs.core.nil_QMARK_), cljs.core.map.call(null, function(p1__10661_SHARP_) {
    var attr__10671 = attrs__10670.item(p1__10661_SHARP_);
    var value__10672 = attr__10671.nodeValue;
    if(function() {
      var and__3822__auto____10673 = cljs.core.not_EQ_.call(null, null, value__10672);
      if(and__3822__auto____10673) {
        return cljs.core.not_EQ_.call(null, "", value__10672)
      }else {
        return and__3822__auto____10673
      }
    }()) {
      return cljs.core.PersistentArrayMap.fromArrays([cljs.core.keyword.call(null, attr__10671.nodeName.toLowerCase())], [attr__10671.nodeValue])
    }else {
      return null
    }
  }, cljs.core.range.call(null, attrs__10670.length))))
};
domina.set_styles_BANG_ = function set_styles_BANG_(content, styles) {
  var G__10693__10694 = cljs.core.seq.call(null, styles);
  if(G__10693__10694) {
    var G__10696__10698 = cljs.core.first.call(null, G__10693__10694);
    var vec__10697__10699 = G__10696__10698;
    var name__10700 = cljs.core.nth.call(null, vec__10697__10699, 0, null);
    var value__10701 = cljs.core.nth.call(null, vec__10697__10699, 1, null);
    var G__10693__10702 = G__10693__10694;
    var G__10696__10703 = G__10696__10698;
    var G__10693__10704 = G__10693__10702;
    while(true) {
      var vec__10705__10706 = G__10696__10703;
      var name__10707 = cljs.core.nth.call(null, vec__10705__10706, 0, null);
      var value__10708 = cljs.core.nth.call(null, vec__10705__10706, 1, null);
      var G__10693__10709 = G__10693__10704;
      domina.set_style_BANG_.call(null, content, name__10707, value__10708);
      var temp__3974__auto____10710 = cljs.core.next.call(null, G__10693__10709);
      if(temp__3974__auto____10710) {
        var G__10693__10711 = temp__3974__auto____10710;
        var G__10712 = cljs.core.first.call(null, G__10693__10711);
        var G__10713 = G__10693__10711;
        G__10696__10703 = G__10712;
        G__10693__10704 = G__10713;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.set_attrs_BANG_ = function set_attrs_BANG_(content, attrs) {
  var G__10733__10734 = cljs.core.seq.call(null, attrs);
  if(G__10733__10734) {
    var G__10736__10738 = cljs.core.first.call(null, G__10733__10734);
    var vec__10737__10739 = G__10736__10738;
    var name__10740 = cljs.core.nth.call(null, vec__10737__10739, 0, null);
    var value__10741 = cljs.core.nth.call(null, vec__10737__10739, 1, null);
    var G__10733__10742 = G__10733__10734;
    var G__10736__10743 = G__10736__10738;
    var G__10733__10744 = G__10733__10742;
    while(true) {
      var vec__10745__10746 = G__10736__10743;
      var name__10747 = cljs.core.nth.call(null, vec__10745__10746, 0, null);
      var value__10748 = cljs.core.nth.call(null, vec__10745__10746, 1, null);
      var G__10733__10749 = G__10733__10744;
      domina.set_attr_BANG_.call(null, content, name__10747, value__10748);
      var temp__3974__auto____10750 = cljs.core.next.call(null, G__10733__10749);
      if(temp__3974__auto____10750) {
        var G__10733__10751 = temp__3974__auto____10750;
        var G__10752 = cljs.core.first.call(null, G__10733__10751);
        var G__10753 = G__10733__10751;
        G__10736__10743 = G__10752;
        G__10733__10744 = G__10753;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.has_class_QMARK_ = function has_class_QMARK_(content, class$) {
  return goog.dom.classes.has(domina.single_node.call(null, content), class$)
};
domina.add_class_BANG_ = function add_class_BANG_(content, class$) {
  var G__10760__10761 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10760__10761) {
    var node__10762 = cljs.core.first.call(null, G__10760__10761);
    var G__10760__10763 = G__10760__10761;
    while(true) {
      goog.dom.classes.add(node__10762, class$);
      var temp__3974__auto____10764 = cljs.core.next.call(null, G__10760__10763);
      if(temp__3974__auto____10764) {
        var G__10760__10765 = temp__3974__auto____10764;
        var G__10766 = cljs.core.first.call(null, G__10760__10765);
        var G__10767 = G__10760__10765;
        node__10762 = G__10766;
        G__10760__10763 = G__10767;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.remove_class_BANG_ = function remove_class_BANG_(content, class$) {
  var G__10774__10775 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10774__10775) {
    var node__10776 = cljs.core.first.call(null, G__10774__10775);
    var G__10774__10777 = G__10774__10775;
    while(true) {
      goog.dom.classes.remove(node__10776, class$);
      var temp__3974__auto____10778 = cljs.core.next.call(null, G__10774__10777);
      if(temp__3974__auto____10778) {
        var G__10774__10779 = temp__3974__auto____10778;
        var G__10780 = cljs.core.first.call(null, G__10774__10779);
        var G__10781 = G__10774__10779;
        node__10776 = G__10780;
        G__10774__10777 = G__10781;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.classes = function classes(content) {
  return cljs.core.seq.call(null, goog.dom.classes.get(domina.single_node.call(null, content)))
};
domina.set_classes_BANG_ = function set_classes_BANG_(content, classes) {
  var classes__10789 = cljs.core.coll_QMARK_.call(null, classes) ? clojure.string.join.call(null, " ", classes) : classes;
  var G__10790__10791 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10790__10791) {
    var node__10792 = cljs.core.first.call(null, G__10790__10791);
    var G__10790__10793 = G__10790__10791;
    while(true) {
      goog.dom.classes.set(node__10792, classes__10789);
      var temp__3974__auto____10794 = cljs.core.next.call(null, G__10790__10793);
      if(temp__3974__auto____10794) {
        var G__10790__10795 = temp__3974__auto____10794;
        var G__10796 = cljs.core.first.call(null, G__10790__10795);
        var G__10797 = G__10790__10795;
        node__10792 = G__10796;
        G__10790__10793 = G__10797;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.text = function text(content) {
  return goog.string.trim(goog.dom.getTextContent(domina.single_node.call(null, content)))
};
domina.set_text_BANG_ = function set_text_BANG_(content, value) {
  var G__10804__10805 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10804__10805) {
    var node__10806 = cljs.core.first.call(null, G__10804__10805);
    var G__10804__10807 = G__10804__10805;
    while(true) {
      goog.dom.setTextContent(node__10806, value);
      var temp__3974__auto____10808 = cljs.core.next.call(null, G__10804__10807);
      if(temp__3974__auto____10808) {
        var G__10804__10809 = temp__3974__auto____10808;
        var G__10810 = cljs.core.first.call(null, G__10804__10809);
        var G__10811 = G__10804__10809;
        node__10806 = G__10810;
        G__10804__10807 = G__10811;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.value = function value(content) {
  return goog.dom.forms.getValue(domina.single_node.call(null, content))
};
domina.set_value_BANG_ = function set_value_BANG_(content, value) {
  var G__10818__10819 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10818__10819) {
    var node__10820 = cljs.core.first.call(null, G__10818__10819);
    var G__10818__10821 = G__10818__10819;
    while(true) {
      goog.dom.forms.setValue(node__10820, value);
      var temp__3974__auto____10822 = cljs.core.next.call(null, G__10818__10821);
      if(temp__3974__auto____10822) {
        var G__10818__10823 = temp__3974__auto____10822;
        var G__10824 = cljs.core.first.call(null, G__10818__10823);
        var G__10825 = G__10818__10823;
        node__10820 = G__10824;
        G__10818__10821 = G__10825;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.html = function html(content) {
  return domina.single_node.call(null, content).innerHTML
};
domina.replace_children_BANG_ = function replace_children_BANG_(content, inner_content) {
  return domina.append_BANG_.call(null, domina.destroy_children_BANG_.call(null, content), inner_content)
};
domina.set_inner_html_BANG_ = function set_inner_html_BANG_(content, html_string) {
  var allows_inner_html_QMARK___10842 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_no_inner_html, html_string));
  var leading_whitespace_QMARK___10843 = cljs.core.re_find.call(null, domina.re_leading_whitespace, html_string);
  var tag_name__10844 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html_string)))].join("").toLowerCase();
  var special_tag_QMARK___10845 = cljs.core.contains_QMARK_.call(null, domina.wrap_map, tag_name__10844);
  if(cljs.core.truth_(function() {
    var and__3822__auto____10846 = allows_inner_html_QMARK___10842;
    if(and__3822__auto____10846) {
      var and__3822__auto____10848 = function() {
        var or__3824__auto____10847 = domina.support.leading_whitespace_QMARK_;
        if(cljs.core.truth_(or__3824__auto____10847)) {
          return or__3824__auto____10847
        }else {
          return cljs.core.not.call(null, leading_whitespace_QMARK___10843)
        }
      }();
      if(cljs.core.truth_(and__3822__auto____10848)) {
        return!special_tag_QMARK___10845
      }else {
        return and__3822__auto____10848
      }
    }else {
      return and__3822__auto____10846
    }
  }())) {
    var value__10849 = clojure.string.replace.call(null, html_string, domina.re_xhtml_tag, "<$1></$2>");
    try {
      var G__10852__10853 = cljs.core.seq.call(null, domina.nodes.call(null, content));
      if(G__10852__10853) {
        var node__10854 = cljs.core.first.call(null, G__10852__10853);
        var G__10852__10855 = G__10852__10853;
        while(true) {
          goog.events.removeAll(node__10854);
          node__10854.innerHTML = value__10849;
          var temp__3974__auto____10856 = cljs.core.next.call(null, G__10852__10855);
          if(temp__3974__auto____10856) {
            var G__10852__10857 = temp__3974__auto____10856;
            var G__10858 = cljs.core.first.call(null, G__10852__10857);
            var G__10859 = G__10852__10857;
            node__10854 = G__10858;
            G__10852__10855 = G__10859;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }catch(e10850) {
      if(cljs.core.instance_QMARK_.call(null, domina.Exception, e10850)) {
        var e__10851 = e10850;
        domina.replace_children_BANG_.call(null, content, value__10849)
      }else {
        if("\ufdd0'else") {
          throw e10850;
        }else {
        }
      }
    }
  }else {
    domina.replace_children_BANG_.call(null, content, html_string)
  }
  return content
};
domina.set_html_BANG_ = function set_html_BANG_(content, inner_content) {
  if(cljs.core.string_QMARK_.call(null, inner_content)) {
    return domina.set_inner_html_BANG_.call(null, content, inner_content)
  }else {
    return domina.replace_children_BANG_.call(null, content, inner_content)
  }
};
domina.get_data = function() {
  var get_data = null;
  var get_data__2 = function(node, key) {
    return get_data.call(null, node, key, false)
  };
  var get_data__3 = function(node, key, bubble) {
    var m__10865 = domina.single_node.call(null, node).__domina_data;
    var value__10866 = cljs.core.truth_(m__10865) ? cljs.core._lookup.call(null, m__10865, key, null) : null;
    if(cljs.core.truth_(function() {
      var and__3822__auto____10867 = bubble;
      if(cljs.core.truth_(and__3822__auto____10867)) {
        return value__10866 == null
      }else {
        return and__3822__auto____10867
      }
    }())) {
      var temp__3974__auto____10868 = domina.single_node.call(null, node).parentNode;
      if(cljs.core.truth_(temp__3974__auto____10868)) {
        var parent__10869 = temp__3974__auto____10868;
        return get_data.call(null, parent__10869, key, true)
      }else {
        return null
      }
    }else {
      return value__10866
    }
  };
  get_data = function(node, key, bubble) {
    switch(arguments.length) {
      case 2:
        return get_data__2.call(this, node, key);
      case 3:
        return get_data__3.call(this, node, key, bubble)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_data.cljs$lang$arity$2 = get_data__2;
  get_data.cljs$lang$arity$3 = get_data__3;
  return get_data
}();
domina.set_data_BANG_ = function set_data_BANG_(node, key, value) {
  var m__10875 = function() {
    var or__3824__auto____10874 = domina.single_node.call(null, node).__domina_data;
    if(cljs.core.truth_(or__3824__auto____10874)) {
      return or__3824__auto____10874
    }else {
      return cljs.core.ObjMap.EMPTY
    }
  }();
  return domina.single_node.call(null, node).__domina_data = cljs.core.assoc.call(null, m__10875, key, value)
};
domina.apply_with_cloning = function apply_with_cloning(f, parent_content, child_content) {
  var parents__10887 = domina.nodes.call(null, parent_content);
  var children__10888 = domina.nodes.call(null, child_content);
  var first_child__10896 = function() {
    var frag__10889 = document.createDocumentFragment();
    var G__10890__10891 = cljs.core.seq.call(null, children__10888);
    if(G__10890__10891) {
      var child__10892 = cljs.core.first.call(null, G__10890__10891);
      var G__10890__10893 = G__10890__10891;
      while(true) {
        frag__10889.appendChild(child__10892);
        var temp__3974__auto____10894 = cljs.core.next.call(null, G__10890__10893);
        if(temp__3974__auto____10894) {
          var G__10890__10895 = temp__3974__auto____10894;
          var G__10898 = cljs.core.first.call(null, G__10890__10895);
          var G__10899 = G__10890__10895;
          child__10892 = G__10898;
          G__10890__10893 = G__10899;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return frag__10889
  }();
  var other_children__10897 = cljs.core.doall.call(null, cljs.core.repeatedly.call(null, cljs.core.count.call(null, parents__10887) - 1, function() {
    return first_child__10896.cloneNode(true)
  }));
  if(cljs.core.seq.call(null, parents__10887)) {
    f.call(null, cljs.core.first.call(null, parents__10887), first_child__10896);
    return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__10870_SHARP_, p2__10871_SHARP_) {
      return f.call(null, p1__10870_SHARP_, p2__10871_SHARP_)
    }, cljs.core.rest.call(null, parents__10887), other_children__10897))
  }else {
    return null
  }
};
domina.lazy_nl_via_item = function() {
  var lazy_nl_via_item = null;
  var lazy_nl_via_item__1 = function(nl) {
    return lazy_nl_via_item.call(null, nl, 0)
  };
  var lazy_nl_via_item__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl.item(n), lazy_nl_via_item.call(null, nl, n + 1))
      }, null)
    }else {
      return null
    }
  };
  lazy_nl_via_item = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_item__1.call(this, nl);
      case 2:
        return lazy_nl_via_item__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_item.cljs$lang$arity$1 = lazy_nl_via_item__1;
  lazy_nl_via_item.cljs$lang$arity$2 = lazy_nl_via_item__2;
  return lazy_nl_via_item
}();
domina.lazy_nl_via_array_ref = function() {
  var lazy_nl_via_array_ref = null;
  var lazy_nl_via_array_ref__1 = function(nl) {
    return lazy_nl_via_array_ref.call(null, nl, 0)
  };
  var lazy_nl_via_array_ref__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl[n], lazy_nl_via_array_ref.call(null, nl, n + 1))
      }, null)
    }else {
      return null
    }
  };
  lazy_nl_via_array_ref = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_array_ref__1.call(this, nl);
      case 2:
        return lazy_nl_via_array_ref__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_array_ref.cljs$lang$arity$1 = lazy_nl_via_array_ref__1;
  lazy_nl_via_array_ref.cljs$lang$arity$2 = lazy_nl_via_array_ref__2;
  return lazy_nl_via_array_ref
}();
domina.lazy_nodelist = function lazy_nodelist(nl) {
  if(cljs.core.truth_(nl.item)) {
    return domina.lazy_nl_via_item.call(null, nl)
  }else {
    return domina.lazy_nl_via_array_ref.call(null, nl)
  }
};
domina.array_like_QMARK_ = function array_like_QMARK_(obj) {
  var and__3822__auto____10901 = obj;
  if(cljs.core.truth_(and__3822__auto____10901)) {
    return obj.length
  }else {
    return and__3822__auto____10901
  }
};
domina.normalize_seq = function normalize_seq(list_thing) {
  if(list_thing == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__10905__10906 = list_thing;
      if(G__10905__10906) {
        if(function() {
          var or__3824__auto____10907 = G__10905__10906.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____10907) {
            return or__3824__auto____10907
          }else {
            return G__10905__10906.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10905__10906.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10905__10906)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10905__10906)
      }
    }()) {
      return cljs.core.seq.call(null, list_thing)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, list_thing))) {
        return domina.lazy_nodelist.call(null, list_thing)
      }else {
        if("\ufdd0'default") {
          return cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([list_thing], true))
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["_"] = true;
domina.nodes["_"] = function(content) {
  if(content == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__10908__10909 = content;
      if(G__10908__10909) {
        if(function() {
          var or__3824__auto____10910 = G__10908__10909.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____10910) {
            return or__3824__auto____10910
          }else {
            return G__10908__10909.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10908__10909.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10908__10909)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10908__10909)
      }
    }()) {
      return cljs.core.seq.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return domina.lazy_nodelist.call(null, content)
      }else {
        if("\ufdd0'default") {
          return cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([content], true))
        }else {
          return null
        }
      }
    }
  }
};
domina.single_node["_"] = function(content) {
  if(content == null) {
    return null
  }else {
    if(function() {
      var G__10911__10912 = content;
      if(G__10911__10912) {
        if(function() {
          var or__3824__auto____10913 = G__10911__10912.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____10913) {
            return or__3824__auto____10913
          }else {
            return G__10911__10912.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10911__10912.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10911__10912)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10911__10912)
      }
    }()) {
      return cljs.core.first.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return content.item(0)
      }else {
        if("\ufdd0'default") {
          return content
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["string"] = true;
domina.nodes["string"] = function(s) {
  return cljs.core.doall.call(null, domina.nodes.call(null, domina.string_to_dom.call(null, s)))
};
domina.single_node["string"] = function(s) {
  return domina.single_node.call(null, domina.string_to_dom.call(null, s))
};
if(cljs.core.truth_(typeof NodeList != "undefined")) {
  NodeList.prototype.cljs$core$ISeqable$ = true;
  NodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  NodeList.prototype.cljs$core$IIndexed$ = true;
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  NodeList.prototype.cljs$core$ICounted$ = true;
  NodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof StaticNodeList != "undefined")) {
  StaticNodeList.prototype.cljs$core$ISeqable$ = true;
  StaticNodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$ = true;
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  StaticNodeList.prototype.cljs$core$ICounted$ = true;
  StaticNodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof HTMLCollection != "undefined")) {
  HTMLCollection.prototype.cljs$core$ISeqable$ = true;
  HTMLCollection.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
    return domina.lazy_nodelist.call(null, coll)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$ = true;
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
    return coll.item(n)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
    if(coll.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, coll, n)
    }
  };
  HTMLCollection.prototype.cljs$core$ICounted$ = true;
  HTMLCollection.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
    return coll.length
  }
}else {
}
;goog.provide("cljs_intro.estimate");
goog.require("cljs.core");
goog.require("clojure.browser.event");
goog.require("domina");
cljs_intro.estimate.stats_button = domina.by_id.call(null, "stats-btn");
cljs_intro.estimate.all_estimate = function all_estimate(amount, point_cap, stories, choices) {
  if(function() {
    var and__3822__auto____6544 = cljs.core._EQ_.call(null, amount, 0);
    if(and__3822__auto____6544) {
      return cljs.core._EQ_.call(null, stories, 0)
    }else {
      return and__3822__auto____6544
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([choices], true)
  }else {
    if(function() {
      var or__3824__auto____6545 = amount < 0;
      if(or__3824__auto____6545) {
        return or__3824__auto____6545
      }else {
        var or__3824__auto____6546 = cljs.core._EQ_.call(null, point_cap, 0);
        if(or__3824__auto____6546) {
          return or__3824__auto____6546
        }else {
          return cljs.core._EQ_.call(null, stories, 0)
        }
      }
    }()) {
      return cljs.core.list.call(null)
    }else {
      if("\ufdd0'else") {
        return cljs.core.into.call(null, all_estimate.call(null, amount - point_cap, point_cap, stories - 1, cljs.core.conj.call(null, choices, point_cap)), all_estimate.call(null, amount, point_cap - 1, stories, choices))
      }else {
        return null
      }
    }
  }
};
cljs_intro.estimate.estimate = function estimate(amount, stories) {
  var coll__6548 = cljs_intro.estimate.all_estimate.call(null, amount, 3, stories, cljs.core.PersistentVector.EMPTY);
  if(cljs.core.empty_QMARK_.call(null, coll__6548)) {
    return cljs.core.PersistentVector.EMPTY
  }else {
    return cljs.core.shuffle.call(null, cljs.core.rand_nth.call(null, coll__6548))
  }
};
clojure.browser.event.listen.call(null, cljs_intro.estimate.stats_button, "click", function() {
  return domina.set_text_BANG_.call(null, domina.by_id.call(null, "results"), cljs_intro.estimate.estimate.call(null, domina.value.call(null, domina.by_id.call(null, "velocity")), domina.value.call(null, domina.by_id.call(null, "stories"))))
});
