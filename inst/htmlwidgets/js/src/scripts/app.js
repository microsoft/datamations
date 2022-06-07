/* eslint-disable promise/param-names */
/* eslint-disable n/no-callback-literal */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/**
 * Entry point of Datamations JavaScript code
 * Reads vega-lite specifications, converts to vega specs and animates them
 *
 * ### Dependencies:
 * - gemini: https://github.com/uwdata/gemini
 * - vega-lite: https://vega.github.io/vega-lite/
 * - vega: https://vega.github.io/vega/
 * - vega-embed: https://github.com/vega/vega-embed
 * - d3: https://d3js.org/
 * - gifshot: https://github.com/yahoo/gifshot
 * - html2canvas: https://html2canvas.hertzen.com/
 * - download2: http://danml.com/download.html
 */

import { CONF, META_PARSE_VALUES } from './config.js'
import { getSelectors, splitLayers, getRows } from './utils.js'
import { hackFacet, getEmptySpec } from './hack-facet-view.js'
import { getGridSpec, getJitterSpec } from './layout.js'
import { CustomAnimations } from './custom-animations.js'

/**
 *
 * @param {String} id conteiner id
 * @param {Object} param1 configuration object
 * @param {Array} param1.specs list of vega-lite specifications
 * @param {Boolean} param1.autoPlay autoPlay
 * @param {Number} param1.frameDel frame duration (in ms.)
 * @param {Number} param1.frameDel delay between frames (in ms.)
 * @returns an object of exposed functions
 */
export default function App (id, { specs, autoPlay = false, frameDur, frameDel }) {
  let rawSpecsImmutable // saving passed specs here, not changed by reference
  let rawSpecs // holds raw vega-lite specs, not transformed
  let vegaLiteSpecs
  let vegaSpecs // vega specs
  let frames
  let metas
  let frameIndex = 0
  let timeoutId
  let playing = false
  let initializing = false
  const frameDuration = frameDur || 2000
  const frameDelay = frameDel || 1000

  // a fallback gemini spec in case gemini.animate could not recommend anything
  const gemSpec = {
    timeline: {
      concat: [
        {
          sync: [
            {
              component: {
                mark: 'marks'
              },
              change: {
                data: {
                  keys: ['gemini_id'],
                  update: true,
                  enter: true,
                  exit: false
                },
                encode: {
                  update: true,
                  enter: true,
                  exit: true
                }
              },
              timing: {
                duration: {
                  ratio: 1
                }
              }
            }
          ]
        }
      ]
    },
    totalDuration: frameDuration
  }

  /**
   * Resets all the instance variables to be able to re-run animation
   */
  const reset = () => {
    vegaLiteSpecs = []
    vegaSpecs = []
    rawSpecs = []
    rawSpecsImmutable = []
    frames = []
    metas = []
    frameIndex = 0
    playing = false

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  /**
   * Initializes datamation app
   */
  async function init () {
    // ignore all subsequent init calls.
    if (initializing) return
    initializing = true

    const { slider } = getSelectors(id)

    reset()

    // load or set data
    if (specs) {
      vegaLiteSpecs = JSON.parse(JSON.stringify(specs))
      console.log('vega specs:', vegaLiteSpecs)
    }

    // save raw specs to use for facet axes drawing
    vegaLiteSpecs.forEach((d) => {
      rawSpecs.push(JSON.parse(JSON.stringify(d)))
      rawSpecsImmutable.push(JSON.parse(JSON.stringify(d)))

      if (d.meta) {
        metas.push(d.meta)
      }
    })

    // eslint-disable-next-line no-undef
    d3.select(slider).property('max', vegaLiteSpecs.length - 1)

    // parse, jitter, layer splitting
    await transformSpecs()

    // compile to vega
    toVegaSpecs()

    // create frames for animation
    await makeFrames()

    drawSpec(0)

    if (autoPlay) {
      setTimeout(play, 100)
    }

    initializing = false
  }

  /**
   * Plays animation
   */
  function play (cb = () => {}) {
    playing = true
    frameIndex = 0

    const tick = () => {
      animateFrame(frameIndex, cb).then(() => {
        if (playing) {
          frameIndex++ // next frame

          if (frames[frameIndex]) {
            tick()
          } else {
            playing = false
            disableEnable('enable')
          }
        }
      })

      // eslint-disable-next-line no-undef
      if (typeof HTMLWidgets !== 'undefined' && HTMLWidgets.shinyMode) {
        const prevIndex = frameIndex - 1
        // eslint-disable-next-line no-undef
        Shiny.onInputChange('slider_state', prevIndex)
      }
    }

    disableEnable('disable')
    tick()
  }

  /**
   * Draws vega lite spec statically (without transition), also updates slider, description, show/hides some layers
   * @param {Number} index specification index in vegaLiteSpecs
   * @param {Object} vegaSpec source vega spec of current frame
   * @returns a promise of vegaEmbed
   */
  function drawSpec (index, vegaSpec) {
    let spec = vegaLiteSpecs[index]

    if (!spec) return

    if (spec.custom) {
      // eslint-disable-next-line no-undef
      spec = gemini.vl2vg4gemini(spec.sequence[spec.sequence.length - 1])
    }

    const meta = metas[index]

    const {
      axisSelector,
      visSelector,
      descr,
      slider,
      otherLayers,
      controls,
      exportWrap
    } = getSelectors(id)

    d3.select(slider).property('value', index)
    d3.select(descr).html(meta.description || 'frame ' + index)
    d3.select(axisSelector)
      .style('opacity', meta.axes ? 1 : 0)
      .html('')
    d3.select(visSelector).classed('with-axes', meta.axes)
    d3.select(otherLayers).classed('with-axes', meta.axes)

    // draw axis
    if (meta.axes) {
      drawAxis(index)
    }

    const transformX = meta.transformX || 0
    const transformY = meta.transformY || 0

    // shift vis
    d3.select(visSelector)
      .style('left', transformX + 'px')
      .style('top', transformY + 'px')

    const _width = spec.width + transformX + 10
    d3.select(controls).style('width', _width + 'px')
    d3.select(descr).style('width', _width + 'px')

    // draw vis
    return drawChart(spec, vegaSpec && vegaSpec.custom ? null : vegaSpec)
  }

  /**
   * Draws a chart, either spec or vegaSpec (which is passed from animate function)
   * Supports single view as well as multiple view chart
   * @param {Object} spec vega-lite spec
   * @param {Object} vegaSpec source vega spec of current frame
   * @returns a promise of vegaEmbed
   */
  function drawChart (spec, vegaSpec) {
    const { visSelector, otherLayers } = getSelectors(id)
    const layers = document.querySelector(otherLayers)
    layers.innerHTML = ''

    if (Array.isArray(spec)) {
      // eslint-disable-next-line promise/param-names
      return new Promise((res) => {
        spec.forEach((s, i) => {
          let target
          let embedSpec = s

          if (s.meta.animated) {
            target = visSelector
            if (vegaSpec) {
              embedSpec = vegaSpec
            }
          } else {
            const div = document.createElement('div')
            div.classList.add('vega-hidden-layer')
            layers.appendChild(div)
            target = div
          }

          vegaEmbed(target, embedSpec, { renderer: 'svg' }).then(() => {
            if (i === spec.length - 1) {
              res()
            }

            // ensure facet translations match in axisSelector and otherLayers
            setTimeout(() => {
              adjustAxisAndErrorbars()
            }, 100)
          })
        })
      })
    } else {
      return vegaEmbed(visSelector, vegaSpec || spec, { renderer: 'svg' })
    }
  }

  /**
   * Fixes hacked axis spec and error bar alignment
   */
  function adjustAxisAndErrorbars () {
    const { axisSelector, otherLayers } = getSelectors(id)
    const axisCells = d3
      .select(axisSelector)
      .selectAll('.mark-group.cell>g')
      .nodes()
    const otherLayersCells = d3
      .select(otherLayers)
      .selectAll('.mark-group.cell>g')
      .nodes()

    if (axisCells.length === otherLayersCells.length) {
      for (let i = 0; i < axisCells.length; i++) {
        const transform = axisCells[i].getAttribute('transform')
        otherLayersCells[i].setAttribute('transform', transform)
      }
    }
  }

  /**
   * Draws an axis layer. This is called when meta.axes = true.
   * @param {Number} index specification index in vegaLiteSpecs
   * @returns a promise of vegaEmbed
   */
  function drawAxis (index) {
    let spec = rawSpecs[index]

    if (spec.spec && spec.spec.layer) {
      const split = splitLayers(spec)
      spec = split[1]
    }

    const columnFacet = spec.facet && spec.facet.column
    const { axisSelector, controls, descr, otherLayers } = getSelectors(id)

    // update axis domain to matched hacked facet view
    const encoding = spec.spec ? spec.spec.encoding : spec.encoding

    if (!encoding.y.scale) {
      const extentY = d3.extent(spec.data.values, (d) => d[CONF.Y_FIELD])
      encoding.y.scale = { domain: extentY }
    }

    if (encoding.color) {
      encoding.color.legend = null
    }

    if (encoding.fill) {
      encoding.fill.legend = null
    }

    if (encoding.x && encoding.x.axis) {
      encoding.x.axis.labelAngle = -90
      encoding.x.axis.titleOpacity = 0
    }

    return vegaEmbed(axisSelector, spec, { renderer: 'svg' }).then(() => {
      if (columnFacet && columnFacet.title) {
        const fn = function () {
          const transform = d3.select(this).attr('transform')
          const x = transform.split('(')[1].split(',')[0]
          return `translate(${x}, 40)`
        }

        d3.select(axisSelector + ' svg > g').attr('transform', fn)
        d3.select(otherLayers + ' svg > g').attr('transform', fn)
      }
      const width = d3
        .select(axisSelector)
        .node()
        .getBoundingClientRect().width
      d3.select(controls).style('width', width + 'px')
      d3.select(descr).style('width', width + 'px')
    })
  }

  /**
   * Animates a frame, from source to target vega specification using gemini
   * @param {Number} index specification index in vegaLiteSpecs
   * @param {Function} cb callback function of each frame drawal
   * @returns a promise of gemini.animate
   */
  async function animateFrame (index, cb) {
    if (!frames[index]) return

    console.log('animating frame', index)

    const { axisSelector, visSelector, otherLayers, descr, slider, controls } =
      getSelectors(id)

    const { source, target, gemSpec, prevMeta, currMeta } = frames[index]
    let anim = null

    if (source.custom) {
      const _source_spec = gemini.vl2vg4gemini(
        source.sequence[source.sequence.length - 1]
      )
      anim = await gemini.animate(_source_spec, target, gemSpec)
    } else if (target.custom) {
      anim = await gemini.animateSequence(target.sequence, gemSpec)
    } else {
      anim = await gemini.animate(source, target, gemSpec)
    }

    const currHasAxes = currMeta.axes
    const width = target.width

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // initial frame
    if (index === 0 && cb) cb(0)

    return new Promise((res) => {
      drawSpec(index, source).then(() => {
        timeoutId = setTimeout(() => {
          d3.select(descr).html(currMeta.description)
          anim.play(visSelector).then(() => {
            d3.select(slider).property('value', index + 1)
            cb && cb(index + 1)
            res()
          })

          const transformX = currMeta.transformX || 0
          const transformY = currMeta.transformY || 0

          d3.select(visSelector)
            .transition()
            .duration(750)
            .style('left', transformX + 'px')
            .style('top', transformY + 'px')

          // show/hide axis vega chart
          if (currHasAxes) {
            drawAxis(index + 1)
            d3.select(axisSelector)
              .transition()
              .duration(1000)
              .style('opacity', 1)
            d3.select(visSelector).classed('with-axes', true)
            d3.select(otherLayers).classed('with-axes', true)
          } else {
            d3.select(axisSelector)
              .transition()
              .duration(1000)
              .style('opacity', 0)
            d3.select(visSelector).classed('with-axes', false)
            d3.select(otherLayers).classed('with-axes', false)
            d3.select(controls).style('width', width + transformX + 10 + 'px')
            d3.select(descr).style('width', width + transformX + 10 + 'px')
          }

          const nextSpec = vegaLiteSpecs[index + 1]

          if (nextSpec && Array.isArray(nextSpec)) {
            const statics = nextSpec.filter((d) => !d.meta.animated)

            d3.select(otherLayers)
              .html('')
              .style('opacity', 0)
              .transition()
              .delay(frameDuration * 0.9)
              .duration(frameDuration / 3)
              .style('opacity', 1)

            statics.forEach((s) => {
              const div = document.createElement('div')
              div.classList.add('vega-hidden-layer')
              vegaEmbed(div, s, { renderer: 'svg' }).then(() => {
                adjustAxisAndErrorbars()
              })
              document.querySelector(otherLayers).appendChild(div)
            })
          }
        },
        // removed delay between frames for custom animations
        target.custom ? 0 : frameDelay)
      })
    })
  }

  /**
   * Transforms specifications into proper format:
   * - meta.grid = generates infogrid
   * - meta.jitter = jitters data using d3.forceCollide
   * - meta.custom_animation = handles custom animation type
   * - spec.layer = splits layers to stack on top on each other
   */
  async function transformSpecs () {
    const rows = getRows(vegaLiteSpecs)

    for (let i = 0; i < vegaLiteSpecs.length; i++) {
      let vlSpec = vegaLiteSpecs[i]

      if (Array.isArray(vlSpec)) continue // just sanity check, making sure that it is not an array

      // if filter has empty `oneOf`, then generate empty spec and avoid any further processing
      if (
        vlSpec.transform &&
        vlSpec.transform[0].filter &&
        vlSpec.transform[0].filter.oneOf &&
        vlSpec.transform[0].filter.oneOf.length === 0
      ) {
        const emptySpec = getEmptySpec(vlSpec)

        metas[i] = emptySpec.meta
        rawSpecs[i] = emptySpec
        vlSpec = emptySpec
        vegaLiteSpecs[i] = emptySpec
        continue
      }

      const meta = vlSpec.meta
      const parse = meta.parse

      // parsing

      if (meta.custom_animation) {
        let funName = meta.custom_animation
        let p = null

        // handle quantile
        if (
          Array.isArray(meta.custom_animation) &&
          meta.custom_animation[0] === 'quantile'
        ) {
          p = meta.custom_animation[1]
          funName = 'median'
        }

        let source = {
          ...rawSpecs[i - 1],
          data: rawSpecsImmutable[i - 1].data
        }
        let target = vlSpec

        if (rawSpecsImmutable[i - 1].facet) {
          source = {
            ...vegaLiteSpecs[i - 1],
            meta: {
              ...vegaLiteSpecs[i - 1].meta,
              hasFacet: true,
              columnFacet: rawSpecsImmutable[i - 1].facet.column,
              rowFacet: rawSpecsImmutable[i - 1].facet.row
            },
            data: {
              values: vegaLiteSpecs[i - 1].data.values.map((d) => {
                return {
                  ...d,
                  [CONF.X_FIELD]: d[CONF.X_FIELD + '_num']
                }
              })
            }
          }
        }

        // if custom animations have facets, fake them before passing to CustomAnimation
        if (vegaLiteSpecs[i].facet) {
          const newSpecTarget = await hackFacet(vegaLiteSpecs[i])
          vegaLiteSpecs[i] = newSpecTarget
          target = newSpecTarget
        }

        const fn = CustomAnimations[funName]

        if (fn) {
          const sequence = await fn(source, target, vegaLiteSpecs[i - 1], p)
          vegaLiteSpecs[i] = {
            custom: meta.custom_animation,
            sequence
          }
        }
      } else if (parse === META_PARSE_VALUES.grid) {
        const gridSpec = await getGridSpec(vlSpec, rows)

        const enc = gridSpec.spec ? gridSpec.spec.encoding : gridSpec.encoding
        rawSpecs[i].data.values = gridSpec.data.values

        // update domain for raw spec axis layer
        if (rawSpecs[i].meta.axes && rawSpecs[i].meta.splitField) {
          const encoding = rawSpecs[i].spec
            ? rawSpecs[i].spec.encoding
            : rawSpecs[i].encoding

          encoding.x.axis = enc.x.axis
          encoding.y.scale = {
            domain: enc.y.scale.domain
          }
          encoding.x.scale = {
            domain: enc.x.scale.domain
          }
        }

        vegaLiteSpecs[i] = gridSpec
      } else if (parse === META_PARSE_VALUES.jitter) {
        vegaLiteSpecs[i] = await getJitterSpec(vlSpec)
      // eslint-disable-next-line brace-style
      }
      // since gemini does not support multiple multiple axis transitions,
      // we must split the layers and draw as separate vega spec
      else if (vlSpec.layer || (vlSpec.spec && vlSpec.spec.layer)) {
        const arr = splitLayers(vlSpec)

        vegaLiteSpecs[i] = []

        for (let j = 0; j < arr.length; j++) {
          const s = arr[j]

          // fake facets
          if (s.facet && s.spec && s.meta.animated) {
            const newSpec = await hackFacet(s)
            vegaLiteSpecs[i].push(newSpec)
            metas[i] = newSpec.meta
          } else {
            vegaLiteSpecs[i].push(s)
          }
        }
      }

      if (vegaLiteSpecs[i]) {
        const facet = vegaLiteSpecs[i].facet
        const spec = vegaLiteSpecs[i].spec

        // fake facets
        if (facet && spec) {
          const newSpec = await hackFacet(vegaLiteSpecs[i])
          vegaLiteSpecs[i] = newSpec
        }
      }
    }

    console.log('parsed specs:', vegaLiteSpecs)
  }

  /**
   * Converts vega-lite specs to vega specs using vl2vg4gemini (https://github.com/uwdata/gemini#vl2vg4gemini)
   */
  function toVegaSpecs () {
    vegaSpecs = vegaLiteSpecs.map((d) => {
      if (d.custom) {
        return d
      }

      const s = Array.isArray(d) ? d.find((d) => d.meta.animated) : d
      return gemini.vl2vg4gemini(s)
    })
  }

  /**
   * Generates animation frames
   * @returns array of objects of \{ source, target, gemSpec, prevMeta, currMeta \}
   */
  async function makeFrames () {
    const options = {
      stageN: 1,

      scales: {
        x: {
          domainDimension: 'diff'
        },
        y: {
          domainDimension: 'diff'
        }
      },

      marks: {
        marks: {
          change: {
            scale: ['x', 'y'],
            data: {
              keys: ['gemini_id'],
              update: true,
              enter: true,
              exit: true
            },
            encode: {
              update: true,
              enter: true,
              exit: true
            }
          }
        }
      },
      totalDuration: frameDuration
    }

    for (let i = 1; i < vegaSpecs.length; i++) {
      const prev = vegaSpecs[i - 1]
      const curr = vegaSpecs[i]

      const prevMeta = metas[i - 1]
      const currMeta = metas[i]

      try {
        let resp = null

        if (curr.custom) {
          resp = await gemini.recommendForSeq(curr.sequence, {
            ...options,
            stageN: curr.sequence.length - 1,
            totalDuration: frameDuration * 2
          })

          const _gemSpec = resp[0].specs.map((d) => d.spec)

          // make sure to add gemini_id to data change.
          // gemini recommend does not add it by itself.
          _gemSpec.forEach((d) => {
            if (d.timeline.concat.length) {
              const first = d.timeline.concat[0].sync[0]
              if (first && first.change && first.change.data) {
                first.change.data = {
                  keys: ['gemini_id'],
                  update: true,
                  enter: true,
                  exit: true
                }
              }
            }
          })

          frames.push({
            source: prev,
            target: curr,
            gemSpec: _gemSpec,
            prevMeta,
            currMeta
          })
        } else {
          resp = await gemini.recommend(
            prev.custom
              ? gemini.vl2vg4gemini(prev.sequence[prev.sequence.length - 1])
              : prev,
            curr,
            options
          )

          const _gemSpec = resp[0] ? resp[0].spec : gemSpec
          const sync = _gemSpec.timeline.concat[0].sync

          if (!sync.some((d) => d.component === 'view')) {
            sync.push({
              component: 'view',
              change: {
                signal: ['width', 'height']
              },
              timing: {
                duration: {
                  ratio: 1
                }
              }
            })
          }

          frames.push({
            source: prev,
            target: curr,
            gemSpec: _gemSpec,
            prevMeta,
            currMeta
          })
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  /**
   * Slider on change callback
   */
  function onSlide () {
    playing = false
    disableEnable('enable')
    const { slider } = getSelectors(id)
    const index = document.querySelector(slider).value
    drawSpec(index)
  }

  /**
   * Exports png files for each frame
   */
  function exportPNG () {
    const { exportWrap } = getSelectors(id)

    const pngs = []

    const callback = (index) => {
      const done = index >= frames.length

      html2canvas(document.querySelector(exportWrap)).then((canvas) => {
        pngs.push(canvas.toDataURL())

        if (done) {
          pngs.forEach((uri, i) => {
            const a = document.createElement('a')
            a.href = uri
            a.download = `frame-${i + 1}.png`
            a.click()
          })
        }
      })
    }

    play(callback)
  }

  /**
   * Exports datamation as gif.
   * @param {Boolean} fromWeb truthy if it is called from webpage, falsy from command line tool
   * @returns either base64 string, or downloads .gif file
   */
  function exportGif (fromWeb) {
    const { exportWrap, exportBtn } = getSelectors(id)

    if (fromWeb) {
      loaderOnOff(true)
      disableEnable('disable', { slider: true })
    }

    let intervalId
    const images = []

    const startInterval = () => {
      if (intervalId) clearInterval(intervalId)

      intervalId = setInterval(() => {
        html2canvas(document.querySelector(exportWrap)).then((canvas) => {
          images.push(canvas.toDataURL())
        })
      }, 16.66666)
    }

    let maxWidth = 300
    let maxHeight = 300

    return new Promise((res) => {
      const callback = (index) => {
        const done = index >= frames.length
        const bound = document
          .querySelector(exportWrap)
          .getBoundingClientRect()

        if (bound.width > maxWidth) maxWidth = bound.width
        if (bound.height > maxHeight) maxHeight = bound.height

        if (done) {
          intervalId && clearInterval(intervalId)

          setTimeout(() => {
            gifshot.createGIF(
              {
                images,
                gifWidth: maxWidth,
                gifHeight: maxHeight,
                frameDuration: 2.5
              },
              function (obj) {
                if (fromWeb) {
                  loaderOnOff(false)
                  disableEnable('enable', { slider: true })
                }

                if (!obj.error) {
                  const image = obj.image

                  if (fromWeb) {
                    download(image, 'animation.gif', 'image/gif')
                  }
                  res(image)
                } else {
                  console.error('error creating gif', obj.errorMsg)
                }
              }
            )
          }, 1000)
        } else {
          intervalId && clearInterval(intervalId)
          setTimeout(startInterval, frameDelay)
        }
      }

      play(callback)
    })
  }

  /**
   * Disables or enables some components
   * @param {String} cmd "disable" or "enable"
   * @param {Array} components array of components
   */
  function disableEnable (cmd, components) {
    const { replayBtn, exportBtn, slider } = getSelectors(id)
    const arr = [replayBtn, exportBtn]

    if (components && components.slider) {
      arr.push(slider)
    }

    arr.forEach((sel) => {
      const el = document.querySelector(sel)

      if (cmd === 'disable') {
        el.setAttribute('disabled', 'disabled')
      } else {
        el.removeAttribute('disabled')
      }
    })
  }

  /**
   * Download button icon adjustment
   * @param {Boolean} loading
   */
  function loaderOnOff (loading) {
    const { exportBtn } = getSelectors(id)
    let className = 'fas fa-download'

    if (loading) {
      className = 'fas fa-spinner spin'
    }

    d3.select(exportBtn).select('i').attr('class', className)
  }

  init()

  return {
    onSlide,
    play,
    exportPNG,
    exportGif,
    animateFrame,
    getFrames: () => frames
  }
}
