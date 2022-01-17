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
        x: { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: { expr: `${i + 1} * (width / ${n + 1}) + 5` },
      },
      encoding: {
        y: {
          field: CONF.Y_FIELD,
          type: "quantitative",
          aggregate: "count",
          // axis: null,
        },
      },
    };
  });

  if (shrink) {
    values = values.map((d, i) => {
      const y = target.data.values[i][CONF.Y_FIELD];
      return {
        ...d,
        [CONF.Y_FIELD]: y,
      };
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
        encoding: source.encoding,
      },
      ...rules,
    ],
  };
}

const getMedianStep = (source, target, step = 0) => {
  const all_groups = [];
  const { width, height } = target.spec || target;
  const isLast = step === null;

  const values = d3.rollups(
      source.data.values.slice(),
      (data) => {
        const groupValue = data[0][CONF.X_FIELD];

        let sorted = data
          .slice()
          .sort((a, b) => {
            return b[CONF.Y_FIELD] - a[CONF.Y_FIELD];
          })
          .map((d, i) => {
            return {
              ...d,
              rank: i + 1,
            };
          });

        const y_median = d3.median(sorted, (d) => d[CONF.Y_FIELD]);
        const median_rank = d3.median(sorted, (d) => d.rank);
        const max_rank = d3.max(sorted, (d) => d.rank);
        const diff = isLast ? null : max_rank - median_rank - step;

        sorted = sorted.map((d) => {
          const rank_delta_abs = Math.abs(d.rank - median_rank);
          const y_delta = d[CONF.Y_FIELD] - y_median;
          const bisection = diff !== null && rank_delta_abs <= diff ? 0 : y_delta > 0 ? 1 : -1;
          let newField = null;

          if (bisection === -1) {
            newField = d[CONF.X_FIELD] - 0.1;
          } else if (bisection === 1) {
            newField = d[CONF.X_FIELD] + 0.1;
          } else {
            newField = d[CONF.X_FIELD];
          }

          return {
            ...d,
            bisection,
            [CONF.X_FIELD + "_pos"]: newField,
            y_median: y_median,
          }
        });

        const filter = `datum['${CONF.X_FIELD}'] === ${groupValue} && datum.bisection === 0`;
        const groupFilter = `datum['${CONF.X_FIELD}'] === ${groupValue}`;

        all_groups.push({
          filter,
          groupFilter,
          groupValue,
          groupKey: CONF.X_FIELD,
          median: y_median,
          rankDiff: Math.abs(max_rank - median_rank),
        });

        return sorted;
      },
      (d) => d[CONF.X_FIELD]
    )
    .flatMap((d) => d[1]);

  const rules = [];

  all_groups.forEach((d, i) => {
    const n = all_groups.length;

    const top_rule = {
      transform: isLast ? [{ filter: d.groupFilter }] : [{ filter: d.filter }],
      name: `top_rule_${d.groupValue}`,
      mark: {
        type: "rule",
        x: { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: { expr: `${i + 1} * (width / ${n + 1}) + 5` },
      },
      encoding: {
        y: {
          field: isLast ? "y_median" : CONF.Y_FIELD,
          type: "quantitative",
          aggregate: "max",
          axis: null,
        },
      },
    };

    const bottom_rule = {
      transform: isLast ? [{ filter: d.groupFilter }] : [{ filter: d.filter }],
      name: `bottom_rule_${d.groupValue}`,
      mark: {
        type: "rule",
        x: { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: { expr: `${i + 1} * (width / ${n + 1}) + 5` },
      },
      encoding: {
        y: {
          field: isLast ? "y_median" : CONF.Y_FIELD,
          type: "quantitative",
          aggregate: "min",
          axis: null,
        },
      },
    };

    rules.push(top_rule, bottom_rule);
  });

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    meta: {
      all_groups,
    },
    data: {
      name: "source",
      values,
    },
    layer: [
      {
        name: "main",
        mark: source.mark,
        encoding: {
          ...source.encoding,
          x: {
            ...source.encoding.x,
            "field": CONF.X_FIELD + "_pos"
          },
          color: {
            field: "bisection",
            legend: null,
            type: "nominal",
            scale: { domain: [-1, 0, 1], range: ["orange", "#aaa", "green"] },
          },
        },
      },
      ...rules,
    ],
    resolve: { axis: { y: "independent" } },
  };
};

const CustomAnimations = {
  // steps:
  // 1) stack sets
  // 2) put rules (lines) using aggregate count
  // 3) replace with count bubbles (aggregate count) (basically target spec)
  count: async (rawSource, target) => {
    const stacks = await getGridSpec(rawSource, 10, true);
    delete stacks.encoding.y.axis;
    const rules = addRules(rawSource, target, false);
    const pullUp = addRules(rawSource, target, true);
    return [stacks, rules, pullUp, target];
  },
  mean: () => {},
  median: async (rawSource, target, calculatedSource) => {
    const initial = getMedianStep(calculatedSource, target);
    const groups = initial.meta.all_groups;
    const minRankDiff = d3.min(groups, d => d.rankDiff);

    const stepNums = d3.range(1, minRankDiff, minRankDiff / 4).map(d => Math.floor(d));
    const steps = [...stepNums, null].map(d => getMedianStep(calculatedSource, target, d))

    // this is for test, it should be passed from R or Python side..
    target.data.values.forEach((d) => {
      const group = groups.find((x) => x.groupValue === d[x.groupKey]);
      d[CONF.Y_FIELD] = group.median;
    });

    const domain = d3.extent(groups, d => d.median);
    target.encoding.y.scale.domain = domain;
    /// end of test //// 

    return [
      calculatedSource,
      initial,
      ...steps,
      target,
    ];
  },
};
