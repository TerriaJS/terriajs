/*
 ### jQuery XML to JSON Plugin v1.3 - 2013-02-18 ###
 * http://www.fyneworks.com/ - diego@fyneworks.com
    * Licensed under http://en.wikipedia.org/wiki/MIT_License
 ###
 Website: http://www.fyneworks.com/jquery/xml-to-json/
*/ /*
 # INSPIRED BY: http://www.terracoder.com/
           AND: http://www.thomasfrank.se/xml_to_json.html
                                            AND: http://www.kawa.net/works/js/xml/objtree-e.html
*/ /*
 This simple script converts XML (document of code) into a JSON object. It is the combination of 2
 'xml to json' great parsers (see below) which allows for both 'simple' and 'extended' parsing modes.
*/

// The jQuery dependency has been removed for use in TerriaJS!

const xml2json = function (xml: any, extended: any) {
  if (!xml) return {}; // quick fail

  //### PARSER LIBRARY
  // Core function
  function parseXML(node: any, simple: any) {
    if (!node) return null;
    let txt = "",
      obj = null,
      att = null;
    const nt = node.nodeType,
      nn = jsVar(node.localName || node.nodeName);
    const nv = node.text || node.nodeValue || ""; //if(window.console) console.log(['x2j',nn,nt,nv.length+' bytes']);
    /*DBG*/ if (node.childNodes) {
      if (node.childNodes.length > 0) {
        /*DBG*/ //if(window.console) console.log(['x2j',nn,'CHILDREN',node.childNodes]);
        for (let n = 0; n < node.childNodes.length; ++n) {
          const cn = node.childNodes[n];
          var cnt = cn.nodeType,
            cnn = jsVar(cn.localName || cn.nodeName);
          const cnv = cn.text || cn.nodeValue || ""; //if(window.console) console.log(['x2j',nn,'node>a',cnn,cnt,cnv]);
          /*DBG*/ if (cnt == 8) {
            /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>b',cnn,'COMMENT (ignore)']);
            continue; // ignore comment node
          } else if (cnt == 3 || cnt == 4 || !cnn) {
            // ignore white-space in between tags
            if (cnv.match(/^\s+$/)) {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>c',cnn,'WHITE-SPACE (ignore)']);
              continue;
            } //if(window.console) console.log(['x2j',nn,'node>d',cnn,'TEXT']);
            /*DBG*/ txt += cnv.replace(/^\s+/, "").replace(/\s+$/, "");
            // make sure we ditch trailing spaces from markup
          } else {
            /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>e',cnn,'OBJECT']);
            obj = obj || {};
            if (obj[cnn]) {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>f',cnn,'ARRAY']);

              // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
              // @ts-expect-error TS(2532)
              if (!obj[cnn].length) obj[cnn] = myArr(obj[cnn]);
              // @ts-expect-error TS(7053)
              obj[cnn] = myArr(obj[cnn]);

              // @ts-expect-error TS(2532)
              obj[cnn][obj[cnn].length] = parseXML(cn, true /* simple */);
              // @ts-expect-error TS(2532)
              obj[cnn].length = obj[cnn].length;
            } else {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>g',cnn,'dig deeper...']);
              // @ts-expect-error TS(7053)
              obj[cnn] = parseXML(cn);
            }
          }
        }
      } //node.childNodes.length>0
    } //node.childNodes
    if (node.attributes) {
      if (node.attributes.length > 0) {
        /*DBG*/ //if(window.console) console.log(['x2j',nn,'ATTRIBUTES',node.attributes])
        att = {};
        obj = obj || {};
        for (let a = 0; a < node.attributes.length; ++a) {
          const at = node.attributes[a];
          const atn = jsVar(at.name),
            atv = at.value;
          // @ts-expect-error TS(7053)
          att[atn] = atv;
          if (obj[atn]) {
            /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'ARRAY']);

            // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
            //if(!obj[atn].length) obj[atn] = myArr(obj[atn]);//[ obj[ atn ] ];
            // @ts-expect-error TS(7053)
            obj[cnn] = myArr(obj[cnn]);

            // @ts-expect-error TS(2532)
            obj[atn][obj[atn].length] = atv;
            // @ts-expect-error TS(2532)
            obj[atn].length = obj[atn].length;
          } else {
            /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'TEXT']);
            // @ts-expect-error TS(7053)
            obj[atn] = atv;
          }
        }
        //obj['attributes'] = att;
      } //node.attributes.length>0
    } //node.attributes
    if (obj) {
      const newObj = txt != "" ? new String(txt) : {};
      for (const prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          // @ts-expect-error TS(7053)
          newObj[prop] = obj[prop];
        }
      }
      obj = newObj;
      //txt = (obj.text) ? (typeof(obj.text)=='object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
      // @ts-expect-error TS(2322)
      txt = obj.text ? [obj.text || ""].concat([txt]) : txt;
      // @ts-expect-error TS(2339)
      if (txt) obj.text = txt;
      txt = "";
    }
    let out = obj || txt;
    //console.log([extended, simple, out]);
    if (extended) {
      if (txt) out = {}; //new String(out);
      // @ts-expect-error TS(2339)
      txt = out.text || txt || "";
      // @ts-expect-error TS(2339)
      if (txt) out.text = txt;
      if (!simple) out = myArr(out);
    }
    return out;
  } // parseXML
  // Core Function End
  // Utility functions
  var jsVar = function (s: any) {
    return String(s || "").replace(/-/g, "_");
  };

  // NEW isNum function: 01/09/2010
  // Thanks to Emile Grau, GigaTecnologies S.L., www.gigatransfer.com, www.mygigamail.com
  function isNum(s: any) {
    // based on utility function isNum from xml2json plugin (http://www.fyneworks.com/ - diego@fyneworks.com)
    // few bugs corrected from original function :
    // - syntax error : regexp.test(string) instead of string.test(reg)
    // - regexp modified to accept  comma as decimal mark (latin syntax : 25,24 )
    // - regexp modified to reject if no number before decimal mark  : ".7" is not accepted
    // - string is "trimmed", allowing to accept space at the beginning and end of string
    const regexp = /^((-)?([0-9]+)(([\.\,]{0,1})([0-9]+))?$)/;
    return (
      typeof s === "number" ||
      // @ts-expect-error TS(2304)
      regexp.test(String(s && typeof s === "string" ? jQuery.trim(s) : ""))
    );
  }
  // OLD isNum function: (for reference only)
  //var isNum = function(s){ return (typeof s == "number") || String((s && typeof s == "string") ? s : '').test(/^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/); };

  var myArr = function (o: any) {
    // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
    //if(!o.length) o = [ o ]; o.length=o.length;
    if (!Array.isArray(o)) o = [o];
    o.length = o.length;

    // here is where you can attach additional functionality, such as searching and sorting...
    return o;
  };
  // Utility functions End
  //### PARSER LIBRARY END

  // Convert plain text to xml
  if (typeof xml === "string") xml = text2xml(xml);

  // Quick fail if not xml (or if this is a node)
  if (!xml.nodeType) return;
  if (xml.nodeType == 3 || xml.nodeType == 4) return xml.nodeValue;

  // Find xml root node
  let root = xml.nodeType == 9 ? xml.documentElement : xml;

  // Convert xml to json
  const out = parseXML(root, true /* simple */);

  // Clean-up memory
  xml = null;
  root = null;

  // Send output
  return out;
};

// Convert text to XML DOM
function text2xml(str: any) {
  const parser = new DOMParser();
  return parser.parseFromString(str, "text/xml");
}

export default xml2json;
