/**
 * This is super ugly code put together from a few sources
 * It needs to be cleaned up, somehow, some way :'(
 */

var tagr = require('tagr');

var __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

function typeofJSON (j) {
  return Array.isArray(j) ? 'array' : typeof j;
}

function JSONclone (obj) {
  return JSON.parse(JSON.stringify(obj));
}

JsonML = (function() {

    function JsonML(node) {
      var x;
      node = node.slice();
      this.tag = node.shift();
      if (typeof node[0] === 'object' && node[0].constructor !== Array) {
        this.attrs = node.shift();
      }
      this.children = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = node.length; _i < _len; _i++) {
          x = node[_i];
          _results.push(typeof x === 'object' ? new JsonML(x) : x);
        }
        return _results;
      })();
    }

    return JsonML;

  })();

function parseHTML (html) {
  var htmlparser = require("htmlparser2");

  var root = [], cur = root, queue = [cur];
  var parser = new htmlparser.Parser({
    onopentag: function(tag, attrs){
      var el = [tag, attrs];
      queue.push(cur);
      cur.push(el)
      cur = el;
    },
    ontext: function (str){
      cur.push(str)
    },
    onclosetag: function (tag) {
      cur = queue.pop();
    }
  });
  parser.write(html);
  parser.end();

  return tagr.parse(['html', {}].concat(root));
}

Markdown = {
    serializeTree: (function() {
      var escapeChars, escapeMarkdown, hasMargin, isInline, serialize;
      escapeChars = function(txt, chars) {
        var regex;
        regex = new RegExp('([' + chars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + '])', 'g');
        return txt.replace(regex, '\\$1');
      };
      escapeMarkdown = function(txt) {
        return escapeChars(txt, '\\`*_{}[]#');
      };
      isInline = function(n) {
        var _ref;
        return (typeof n === 'string') || ((_ref = n.tag) === 'strong' || _ref === 'em' || _ref === 'inlinecode' || _ref === 'linebreak' || _ref === 'link' || _ref === 'img' || _ref === 'link_ref');
      };
      hasMargin = function(n) {
        var _ref;
        return (typeof n === 'object') && ((_ref = n.tag) === 'para' || _ref === 'header' || _ref === 'code_block');
      };
      serialize = function(ml, opts) {
        var child, children, first, fix, lastPrefix, ret, val, x, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
        if (opts == null) {
          opts = {
            prefix: '',
            list: []
          };
        }
        if (typeof ml === 'string') {
          return escapeMarkdown(ml).replace(/\n/g, '  \n');
        }
        switch (ml.tag) {
          case 'markdown':
            return ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('\n\n');

          case 'para':
            return opts.prefix + ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('');

          case 'header':
            fix = (function() {
              switch (ml.attrs.level) {
                case 1:
                  return '#';
                case 2:
                  return '##';
                case 3:
                  return '###';
                case 4:
                  return '####';
                case 5:
                  return '#####';
                default:
                  return '######';
              }
            })();
            return opts.prefix + fix + ' ' + ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('').replace(/^\s+/, '');

          case 'code_block':
            opts.prefix += '    ';
            ret = opts.prefix + ml.children.join('').replace(/\n/g, '\n' + opts.prefix);
            opts.prefix = opts.prefix.slice(0, -4);
            break;

          case 'bulletlist':
            opts.list.push('* ');
            ret = ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('\n');
            opts.list.pop();
            break;

          case 'numberlist':
            opts.list.push('1.');
            ret = ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('\n');
            opts.list.pop();
            break;

          case 'listitem':
            ret = opts.prefix + opts.list[opts.list.length - 1] + ' ';
            lastPrefix = opts.prefix;
            opts.prefix += '    ';
            children = ml.children.slice();
            first = true;
            while (children.length) {
              if (isInline(children[0])) {
                while (children.length && isInline(children[0])) {
                  ret += serialize(children.shift(), opts);
                }
                if (children.length) {
                  ret += '\n';
                }
                first = false;
              }
              while (children.length && !isInline(children[0])) {
                child = children.shift();
                val = serialize(child, opts);
                if (first) {
                  val = val.replace(/^\s+/, '');
                }
                ret += val;
                if (hasMargin(child)) {
                  ret += "\n";
                  if (children.length) {
                    ret += "\n";
                  }
                }
                first = false;
              }
            }
            opts.prefix = lastPrefix;
            break;

          case 'blockquote':
            opts.prefix += '> ';
            ret = ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('\n');
            opts.prefix = opts.prefix.slice(0, -2);
            break;

          case 'hr':
            return opts.prefix + '---';

          case 'strong':
            ret = '**' + ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('') + '**';
            break;

          case 'em':
            ret = '_' + ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('') + '_';
            break;

          case 'inlinecode':
            ret = '`' + ((function() {
              var _i, _len, _ref, _results;
              _ref = ml.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('') + '`';
            break;

          case 'linebreak':
            ret = '  \n' + opts.prefix;
            break;

          case 'link':
            if (ml.children.length === 1 && typeof ml.children[0] === 'string' && ml.children[0] === ((_ref = ml.attrs) != null ? _ref.href : void 0)) {
              ret = '<' + ml.children[0].replace(/>/g, '\>') + '>';
            } else {
              ret = '[' + ((function() {
                var _i, _len, _ref1, _results;
                _ref1 = ml.children;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                  x = _ref1[_i];
                  _results.push(serialize(x, opts));
                }
                return _results;
              })()).join('') + '](' + escapeMarkdown(((_ref1 = ml.attrs) != null ? _ref1.href : void 0) || '') + ')';
            }
            break;

          case 'link_ref':
            ret = '[' + ((function() {
              var _i, _len, _ref2, _results;
              _ref2 = ml.children;
              _results = [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                x = _ref2[_i];
                _results.push(serialize(x, opts));
              }
              return _results;
            })()).join('') + '] [' + escapeMarkdown(((_ref2 = ml.attrs) != null ? _ref2.ref : void 0) || '') + ']';
            break;

          case 'img':
            ret = '![' + escapeMarkdown(((_ref3 = ml.attrs) != null ? _ref3.alt : void 0) || '') + '](' + escapeMarkdown(((_ref4 = ml.attrs) != null ? _ref4.href : void 0) || '') + (((_ref5 = ml.attrs) != null ? _ref5.title : void 0) ? ' "' + escapeChars(ml.attrs.title, '"') + '"' : '') + ')';
        }

        return ret;
      };
      return function(ml) {
        return serialize(new JsonML(ml));
      };
    })()
  };

var toMarkdownTree = (function() {
  var nodeToTree;
  nodeToTree = function(n) {
    var attrs, attrs2, cur, i, j, key, keys, last, next, nextspan, node, rank, rankkeys, ranksort, ret, spanAttrs, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4;
    ret = [];
    spanAttrs = function (node) {
    var attrs, href;
    attrs = {};
    if ('data-bold' in node[1]) {
      attrs.strong = true;
    }
    if ('data-italic' in node[1]) {
      attrs.em = true;
    }
    if ('href' in node[1]) {
      attrs.link = node[1].href;
    }
    if ('data-code' in node[1]) {
      attrs.inlinecode = true;
    }
    return attrs;
    };
    _ref = n.slice(2);
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
    node = _ref[i];
    if (typeofJSON(node) === 'array') {
      switch (node[0]) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        ret.push([
        'header', {
          level: Number(node[0].charAt(1))
        }
        ].concat(nodeToTree(node)));
        break;
      case 'p':
        if (node.length <= 2) {
        continue;
        }
        ret.push(['para'].concat(nodeToTree(node)));
        break;
      case 'div':
        if (node.length <= 2) {
        continue;
        }
        ret = ret.concat(nodeToTree(node));
        break;
      case 'pre':
        ret.push(['code_block'].concat(nodeToTree(node)));
        break;
      case 'ul':
        ret.push(['bulletlist'].concat(nodeToTree(node)));
        break;
      case 'ol':
        ret.push(['numberlist'].concat(nodeToTree(node)));
        break;
      case 'li':
        ret.push(['listitem'].concat(nodeToTree(node)));
        break;
      default:
        if (['strong', 'em', 'link', 'inlinecode'].indexOf(node[0]) > -1) {
        rankkeys = ['strong', 'em', 'link', 'inlinecode'];
        rank = {};
        attrs = spanAttrs(node);
        for (_j = 0, _len1 = rankkeys.length; _j < _len1; _j++) {
          key = rankkeys[_j];
          rank[key] = Number(attrs[key] != null);
        }
        keys = (function() {
          var _results;
          _results = [];
          for (key in attrs) {
          _results.push(key);
          }
          return _results;
        })();
        for (j = _k = _ref1 = i + 1, _ref2 = n.length; _ref1 <= _ref2 ? _k < _ref2 : _k > _ref2; j = _ref1 <= _ref2 ? ++_k : --_k) {
          nextspan = n[j];
          if (!(typeofJSON(nextspan) === 'array' && nextspan[0] === 'a')) {
          break;
          }
          attrs2 = spanAttrs(nextspan);
          keys = (function() {
          var _l, _len2, _results;
          _results = [];
          for (_l = 0, _len2 = rankkeys.length; _l < _len2; _l++) {
            key = rankkeys[_l];
            if (!(__indexOf.call(keys, key) >= 0 && key in attrs2 && attrs[key] === attrs2[key])) {
            continue;
            }
            rank[key]++;
            _results.push(key);
          }
          return _results;
          })();
        }
        ranksort = (function() {
          var _results;
          _results = [];
          for (key in attrs) {
          _results.push(key);
          }
          return _results;
        })();
        ranksort.sort(function(a, b) {
          return rank[b] - rank[a];
        });
        cur = ret;
        for (_l = 0, _len2 = rankkeys.length; _l < _len2; _l++) {
          key = rankkeys[_l];
          last = cur[cur.length - 1];
          if (typeof last === 'object' && (_ref3 = last[0], __indexOf.call(ranksort, _ref3) >= 0) && (last[0] !== 'link' || last[1].href === attrs.link)) {
          cur = last;
          ranksort.splice(ranksort.indexOf(last[0]), 1);
          }
        }
        for (_m = 0, _len3 = ranksort.length; _m < _len3; _m++) {
          key = ranksort[_m];
          next = [key];
          if (key === 'link') {
          next.push({
            href: attrs.link
          });
          }
          cur.push(next);
          cur = next;
        }
        _ref4 = nodeToTree(node);
        for (_n = 0, _len4 = _ref4.length; _n < _len4; _n++) {
          x = _ref4[_n];
          cur.push(x);
        }
        }
      }
    } else if (typeofJSON(node) === 'object' && node && node.type == 'insertEmptyTag') {
      switch (node.tag) {
      case 'hr':
        ret.push(['hr']);
        break;
      case 'br':
        ret.push(['linebreak']);
        break;
      case 'img':
        ret.push([
        'img', {
          href: node.attrs.src
        }
        ]);
      }
    } else if (typeofJSON(node) === 'string') {
      ret.push(node);
    }
    }
    return ret;
  };
  return function(n) {
    return ['markdown'].concat(__slice.call(nodeToTree(['html', {}].concat(__slice.call(n)))));
  };
})();

exports.parse = function (str) {
  return Markdown.serializeTree(toMarkdownTree(parseHTML(str).toJSON().slice(2)));
};