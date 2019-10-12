'use strict'

var FORMAT_NAME = 'ssa'

var helper = {
  toMilliseconds: function(s) {
    var match = /^\s*(\d+:)?(\d{1,2}):(\d{1,2})([.,](\d{1,3}))?\s*$/.exec(s)
    var hh = match[1] ? parseInt(match[1].replace(':', '')) : 0
    var mm = parseInt(match[2])
    var ss = parseInt(match[3])
    var ff = match[5] ? parseInt(match[5]) : 0
    var ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff * 10
    return ms
  },
  toTimeString: function(ms) {
    var hh = Math.floor(ms / 1000 / 3600)
    var mm = Math.floor((ms / 1000 / 60) % 60)
    var ss = Math.floor((ms / 1000) % 60)
    var ff = Math.floor((ms % 1000) / 10) //2 digits
    var time =
      hh +
      ':' +
      (mm < 10 ? '0' : '') +
      mm +
      ':' +
      (ss < 10 ? '0' : '') +
      ss +
      '.' +
      (ff < 10 ? '0' : '') +
      ff
    return time
  },
}

/******************************************************************************************
 * Parses captions in SubStation Alpha format (.ssa)
 ******************************************************************************************/
function parse(content, options) {
  var meta
  var columns = null
  var captions = []
  var eol = options.eol || '\r\n'
  var parts = content.split(/\r?\n\s*\r?\n/)
  for (var i = 0; i < parts.length; i++) {
    var regex = /^\s*\[([^\]]+)\]\r?\n([\s\S]*)(\r?\n)*$/gi
    var match = regex.exec(parts[i])
    if (match) {
      var tag = match[1]
      var lines = match[2].split(/\r?\n/)
      for (var l = 0; l < lines.length; l++) {
        var line = lines[l]
        if (/^\s*;/.test(line)) {
          continue //Skip comment
        }
        var m = /^\s*([^:]+):\s*(.*)(\r?\n)?$/.exec(line)
        if (m) {
          if (tag == 'Script Info') {
            if (!meta) {
              meta = {}
              meta.type = 'meta'
              meta.data = {}
              captions.push(meta)
            }
            var name = m[1].trim()
            var value = m[2].trim()
            meta.data[name] = value
            continue
          }
          if (tag == 'V4 Styles' || tag == 'V4+ Styles') {
            var name = m[1].trim()
            var value = m[2].trim()
            if (name == 'Format') {
              columns = value.split(/\s*,\s*/g)
              continue
            }
            if (name == 'Style') {
              var values = value.split(/\s*,\s*/g)
              var caption = {}
              caption.type = 'style'
              caption.data = {}
              for (var c = 0; c < columns.length && c < values.length; c++) {
                caption.data[columns[c]] = values[c]
              }
              captions.push(caption)
              continue
            }
          }
          if (tag == 'Events') {
            var name = m[1].trim()
            var value = m[2].trim()
            if (name == 'Format') {
              columns = value.split(/\s*,\s*/g)
              continue
            }
            if (name == 'Dialogue') {
              var values = value.split(/\s*,\s*/g)
              var caption = {}
              caption.type = 'caption'
              caption.data = {}
              for (var c = 0; c < columns.length && c < values.length; c++) {
                caption.data[columns[c]] = values[c]
              }
              caption.start = helper.toMilliseconds(caption.data['Start'])
              caption.end = helper.toMilliseconds(caption.data['End'])
              caption.duration = caption.end - caption.start
              caption.content = caption.data['Text']

              //Work-around for missing text (when the text contains ',' char)
              function getPosition(s, search, index) {
                return s.split(search, index).join(search).length
              }
              var indexOfText = getPosition(value, ',', columns.length - 1) + 1
              caption.content = value.substr(indexOfText)
              caption.data['Text'] = caption.content

              caption.text = caption.content
                .replace(/\\N/g, eol) //"\N" for new line
                .replace(/\{[^\}]+\}/g, '') //{\pos(400,570)}
              captions.push(caption)
              continue
            }
          }
        }
      }
    }

    if (options.verbose) {
      console.log('WARN: Unknown part', parts[i])
    }
  }
  return captions
}

/******************************************************************************************
 * Builds captions in SubStation Alpha format (.ssa)
 ******************************************************************************************/
function build(captions, options) {
  var eol = options.eol || '\r\n'
  var ass = options.format == 'ass'

  var content = ''

  for (var i = 0; i < captions.length; i++) {
    var caption = captions[i]
    if (caption.type == 'meta') {
      content += `[Script Info]${eol}`
      var metaData = Object.entries(caption.data)

      metaData.forEach(val => {
        content += `${val[0]}: ${val[1]}${eol}`
      })

      content += `${eol}[V4+ Styles]${eol}Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding${eol}`

      continue
    }

    if (caption.type == 'style') {
      var metaData = Object.entries(caption.data)
      var newStyle = 'Style: '
      metaData.forEach((val, index) => {
        if (index + 1 === metaData.length) {
          newStyle += `${val[1]}`
          return
        }
        newStyle += `${val[1]},`
      })
      content += `${newStyle}${eol}`

      continue
    }

    if (!content.includes('[Events]')) {
      content += `${eol}[Events]${eol}Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text${eol}`
    }

    if (typeof caption.type === 'undefined' || caption.type == 'caption') {
      content +=
        'Dialogue: ' +
        (ass ? '0' : 'Marked=0') +
        ',' +
        helper.toTimeString(caption.start) +
        ',' +
        helper.toTimeString(caption.end) +
        `,${caption.data.Style},${caption.data.Name},0000,0000,0000,,` +
        caption.text.replace(/\r?\n/g, '\\N') +
        eol
      continue
    }

    if (options.verbose) {
      console.log('SKIP:', caption)
    }
  }

  return content
}

/******************************************************************************************
 * Detects a subtitle format from the content.
 ******************************************************************************************/
function detect(content) {
  if (typeof content !== 'string') {
    throw new Error('Expected string content!')
  }

  if (
    /^[\s\r\n]*\[Script Info\]\r?\n/g.test(content) &&
    /[\s\r\n]*\[Events\]\r?\n/g.test(content)
  ) {
    /*
    [Script Info]
    ...
    [Events]
    */

    //Advanced (V4+) styles for ASS format
    return content.indexOf('[V4+ Styles]') > 0 ? 'ass' : 'ssa'
  }
}

/******************************************************************************************
 * Export
 ******************************************************************************************/
module.exports = {
  name: FORMAT_NAME,
  helper: helper,
  detect: detect,
  parse: parse,
  build: build,
}
