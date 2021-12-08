/**
 * Gets selectors for each componenent, such as slider and animation divs
 * @param {String} id root container id where all the animation components are rendered
 * @returns object of selectors
 */
function getSelectors(id) {
  const base = "#" + id;

  return {
    axisSelector: base + " .vega-for-axis",
    visSelector: base + " .vega-vis",
    descr: base + " .description",
    slider: base + " .slider",
    otherLayers: base + " .vega-other-layers",
    controls: base + " .controls-wrapper",
  };
}

/**
 * Splits layers into separate vega-lite specifications, removes layer field
 * @param {Object} input vega-lite specification with layers
 * @returns a list of specs
 */
function splitLayers(input) {
  const specArray = [];
  const spec = input.spec;

  if (spec && spec.layer) {
    spec.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input));
      const animated = i === spec.layer.length - 1;

      if (obj.meta) {
        obj.meta.animated = animated;
      } else {
        obj.meta = { animated };
      }

      obj.spec.encoding = d.encoding;
      obj.spec.mark = d.mark;
      delete obj.spec.layer;
      specArray.push(obj);
    });
  } else if (input.layer) {
    input.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input));
      const animated = i === input.layer.length - 1;

      if (obj.meta) {
        obj.meta.animated = animated;
      } else {
        obj.meta = { animated };
      }

      obj.encoding = d.encoding;
      obj.mark = d.mark;
      delete obj.layer;
      specArray.push(obj);
    });
  }

  return specArray;
}

/**
 * Looks up a word based of buckets and value.
 * Example:
 *   - words: ['a', 'b', 'c']
 *   - buckets: [10, 20, 30]
 *   - value: 25
 *   will return 'c'
 * @param {Array} words list of words
 * @param {Array} buckets list of numbers
 * @param {Number} value score to lookup
 */
 function lookupByBucket(words, buckets, value) {
  return words[buckets.findIndex(d => value <= d)];
}
