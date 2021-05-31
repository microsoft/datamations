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