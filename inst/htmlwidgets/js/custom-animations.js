function addRules(source, target, shrink = false) {
  const { width, height } = target.spec || target;
  let values = source.data.values.slice();
  const sourceMeta = source.meta;

  const rules = sourceMeta.rules.map((d, i) => {
      const n = sourceMeta.rules.length;
      return {
          transform: [{ filter: d.filter }],
          name: `rule-${i + 1}`,
          mark: {
              type: "rule",
              x: { expr: `${i + 1} * (width / ${n + 1}) - 5`},
              x2: { expr: `${i + 1} * (width / ${n + 1}) + 5` }
          },
          encoding: {
              y: {
                  field: CONF.Y_FIELD,
                  type: "quantitative",
                  aggregate: "count",
                  axis: null,
              },
          }
      }
  });

  if (shrink) {
    values = values.map((d, i) => {
      const y = target.data.values[i][CONF.Y_FIELD];
      return {
        ...d,
        [CONF.Y_FIELD]: y
      }
    });
  }

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    data: {
      name: "source",
      values,
    },
    layer: [
      {
        name: "main",
        mark: source.mark,
        encoding: source.encoding
      },
      ...rules
    ],
  };
}

const CustomAnimations = {
  // steps:
  // 1) stack sets
  // 2) put rules (lines) using aggregate count
  // 3) replace with count bubbles (aggregate count) (basically target spec)
  count: async (source, target) => {
    const stacks = await getGridSpec(source, 10, true);
    const rules = await addRules(source, target, false);
    const pullUp = await addRules(source, target, true);
    return [stacks, rules, pullUp, target];
  },
  mean: () => {},
  median: () => {},
};