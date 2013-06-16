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

var toMarkdownTree = (function () {
  var nodeToTree = function(n) {
    ret = [];

    n.slice(2).forEach(function (node) {
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
              return
            }
            ret.push(['para'].concat(nodeToTree(node)));
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

          case 'strong':
          case 'em':
          case 'a':
          case 'code':
            var ranking = ['strong', 'em', 'a', 'code'];

            while (true) {
              // Handle this span and all nested spans.
              var styles = [], str = '', href = null;

              function consume (cur) {
                if (cur.length <= 2) {
                  return false;
                }

                // Add all styles
                if (ranking.indexOf(cur[0]) > -1) {
                  styles.push(cur[0]);
                }
                if (cur[0] == 'a') {
                  href = cur[1].href;
                }

                var child = cur.splice(2, 1)[0];
                if (typeofJSON(child) == 'array') {
                  if (!consume(child)) {
                    // Move to next element, or return null
                    return consume(cur);
                  }
                } else {
                  str = String(child);
                }
                return true;
              }

              if (!consume(node)) {
                break;
              }

              // Sort styles array by ranking.
              var sortedstyles = ranking.filter(function (style) {
                return styles.indexOf(style) != -1;
              });

              var cur = ret, j = 0;
              sortedstyles.forEach(function (style, i) {
                var last = cur[cur.length - 1];
                if (typeofJSON(last) == 'array' && last[0] == style) {
                  cur = last;
                  j++;
                }
              });

              sortedstyles.slice(j).forEach(function (style) {
                var next = [style, style == 'a' ? { href: href } : {}];
                cur.push(next);
                cur = next;
              })

              cur.push(str);
            }

            break;

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
            break;

          case 'div':
          case 'span':
          default:
            if (node.length <= 2) {
              return;
            }
            ret = ret.concat(nodeToTree(node));
            break;
        }
      } else if (typeofJSON(node) === 'string') {
        ret.push(node);
      }
    });

    return ret;
  };

  return function(n) {
    return ['markdown'].concat(__slice.call(nodeToTree(['html', {}].concat(__slice.call(n)))));
  };
})();

exports.parseJSON = function (json) {
  return Markdown.serializeTree(toMarkdownTree(json.slice(2)));
};

exports.parse = function (str) {
  exports.parseJSON(tagr.parse(String(str)).toJSON());
};