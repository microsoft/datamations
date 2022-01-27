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

const getMedianStep = (source, target, step = 0, p = 0.5) => {
  const all_groups = [];
  const { width, height } = target.spec || target;
  const isLast = step === null;

  const values = d3
    .rollups(
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

        const y_median = d3.quantile(sorted, p, (d) => d[CONF.Y_FIELD]);
        const median_rank = d3.quantile(sorted, 0.5, (d) => d.rank);

        const max_rank = d3.max(sorted, (d) => d.rank);
        const diff = isLast ? null : max_rank - median_rank - step;
        
        sorted = sorted.map((d) => {
          const rank_delta_abs = Math.abs(d.rank - median_rank);
          const y_delta = d[CONF.Y_FIELD] - y_median;

          const bisection = (diff !== null && rank_delta_abs <= diff) ? 0 : y_delta > 0 ? 1 : -1;

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
          };
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
            field: CONF.X_FIELD + "_pos",
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

const getMeanStep = (source, target) => {
  const all_groups = [];
  const { width, height } = target.spec || target;

  const values = d3
    .rollups(
      source.data.values.slice(),
      (data) => {
        const groupValue = data[0][CONF.X_FIELD];

        let sorted = data
          .slice()
          .sort((a, b) => {
            return a[CONF.Y_FIELD] - b[CONF.Y_FIELD];
          })
          .map((d, i) => {
            return {
              ...d,
              rank: i + 1,
            };
          });

        const y_mean = d3.mean(sorted, (d) => d[CONF.Y_FIELD]);
        const mean_rank = d3.mean(sorted, (d) => d.rank);
        const max_rank = d3.max(sorted, (d) => d.rank);
        const dividor = max_rank * 1.4;

        sorted = sorted.map((d) => {
          const rankRatio_from_mean = (d.rank - mean_rank) / dividor;

          const rankRatio_from_mean_start = (d.rank - 0.5 - mean_rank) / dividor;
          const rankRatio_from_mean_end = (d.rank + 0.5 - mean_rank) / dividor;

          return {
            ...d,
            [CONF.X_FIELD + "_pos"]: d[CONF.X_FIELD] + rankRatio_from_mean,
            [CONF.X_FIELD + "_pos_start"]:
              d[CONF.X_FIELD] + rankRatio_from_mean_start,
            [CONF.X_FIELD + "_pos_end"]:
              d[CONF.X_FIELD] + rankRatio_from_mean_end,
            y_mean,
          };
        });

        const filter = `datum['${CONF.X_FIELD}'] === ${groupValue}`;

        all_groups.push({
          filter,
          groupValue,
          groupKey: CONF.X_FIELD,
          mean: y_mean,
        });

        return sorted;
      },
      (d) => d[CONF.X_FIELD]
    )
    .flatMap((d) => d[1]);

  const rules = [];

  all_groups.forEach((d, i) => {
    const n = all_groups.length;

    const rule = {
      transform: [{ filter: d.filter }],
      name: `rule_${d.groupValue}`,
      mark: {
        type: "rule",
        x: { expr: `${i + 1} * (width / ${n + 1}) - (width / ${n + 1}) * 0.35` },
        x2: { expr: `${i + 1} * (width / ${n + 1}) + (width / ${n + 1}) * 0.35` },
      },
      encoding: {
        y: {
          field: CONF.Y_FIELD,
          type: "quantitative",
          aggregate: "mean",
          axis: null,
        },
      },
    };

    rules.push(rule);
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
            field: CONF.X_FIELD + "_pos",
          },
        },
      },
      ...rules,
    ],
    resolve: { axis: { y: "independent" } },
  };
};

const getMinMaxStep = (source, target, minOrMax = "min") => {
  const { width, height } = target.spec || target;
  const aggrFn = minOrMax === "min" ? d3.min : d3.max;

  const minMaxPoints = {};

  const all_groups = d3.groups(
      source.data.values.slice(),
      (d) => d[CONF.X_FIELD])
    .map(([key, data]) => {
      const groupValue = key;
      const filter = `datum['${CONF.X_FIELD}'] === ${groupValue}`;
      const aggr = aggrFn(data, d => d[CONF.Y_FIELD]);

      minMaxPoints[groupValue] = data.find(d => d[CONF.Y_FIELD] === aggr);

      return {
        filter,
        groupValue,
        groupKey: CONF.X_FIELD,
        aggr,
      }
    });

  const rules = all_groups.map((group, i) => {
    const n = all_groups.length;
    return {
      transform: [{ filter: group.filter }],
      name: `rule_${group.groupValue}`,
      mark: {
        type: "rule",
        x: { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: { expr: `${i + 1} * (width / ${n + 1}) + 5` },
      },
      encoding: {
        y: {
          field: CONF.Y_FIELD,
          type: "quantitative",
          aggregate: minOrMax,
          axis: null,
        },
      },
    }
  });

  console.log(minMaxPoints);

  const values = source.data.values.map(d => {
    const g = minMaxPoints[d[CONF.X_FIELD]];
    const isAggr = g && g.gemini_id === d.gemini_id;

    return {
      ...d,
      isAggr,
    }
  })

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    meta: {
      all_groups,
    },
    data: {
      name: "source",
      values: values,
    },
    layer: [
      {
        name: "main",
        mark: source.mark,
        encoding: {
          ...source.encoding,
        },
      },
      ...rules,
    ],
    resolve: { axis: { y: "independent" } },
  }
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
  min: (rawSource, target, source) => {
    const step_1 = getMinMaxStep(source, target, "min");
    const groups = step_1.meta.all_groups;

    const step_2 = {
      ...step_1,
      transform: [
        { filter: "datum.isAggr === true" }
      ],
      layer: [
        {
          ...step_1.layer[0],
          encoding: {
            ...step_1.layer[0].encoding,
            y: {
              ...step_1.layer[0].encoding.y,
              // aggregate: "min",
            }
          }
        },
        ...step_1.layer.slice(1),
      ]
    };

    // this is for test, it should be passed from R or Python side..
    // but can also keep this. it will work!!!
    target.data.values.forEach((d) => {
      const group = groups.find((x) => x.groupValue === d[x.groupKey]);
      d[CONF.Y_FIELD] = group.aggr;
    });

    const domain = d3.extent(groups, (d) => d.aggr);
    target.encoding.y.scale.domain = domain;
    /// end of test ////

    return [source, step_1, step_2, target];
  },
  max: (rawSource, target, source) => {
    const step_1 = getMinMaxStep(source, target, "max");
    const groups = step_1.meta.all_groups;

    const step_2 = {
      ...step_1,
      transform: [
        { filter: "datum.isAggr === true" }
      ],
      layer: [
        {
          ...step_1.layer[0],
          encoding: {
            ...step_1.layer[0].encoding,
            y: {
              ...step_1.layer[0].encoding.y,
              // aggregate: "max",
            }
          }
        },
        ...step_1.layer.slice(1),
      ]
    }

    // this is for test, it should be passed from R or Python side..
    // but can also keep this. it will work!!!
    target.data.values.forEach((d) => {
      const group = groups.find((x) => x.groupValue === d[x.groupKey]);
      d[CONF.Y_FIELD] = group.aggr;
    });

    const domain = d3.extent(groups, (d) => d.aggr);
    target.encoding.y.scale.domain = domain;
    /// end of test ////

    return [source, step_1, step_2, target];
  },
  mean: (rawSource, target, calculatedSource) => {
    const step_1 = getMeanStep(calculatedSource, target);

    const barWidth = 2;
    const groups = step_1.meta.all_groups;
    const step_2 = {
      ...step_1,
      layer: [
        {
          name: "main",
          mark: { type: "tick", orient: "horizontal", width: barWidth },
          encoding: {
            y: {
              ...calculatedSource.encoding.y,
            },
            x: {
              ...calculatedSource.encoding.x,
              field: CONF.X_FIELD + "_pos_start",
            },
            x2: {
              field: CONF.X_FIELD + "_pos_end",
            },
            color: { value: "#aaa" },
          },
        },
        ...step_1.layer.slice(1),
      ],
    };
    const step_3 = {
      ...step_2,
      layer: [
        {
          ...step_2.layer[0],
          mark: {
            type: "bar",
            width: barWidth,
          },
          encoding: {
            ...step_2.layer[0].encoding,
            y2: {
              field: "y_mean",
            },
          },
        },
        ...step_2.layer.slice(1),
      ],
    };
    const step_4 = {
      ...step_2,
      layer: [
        {
          ...step_2.layer[0],
          mark: {
            type: "bar",
            width: barWidth,
          },
          encoding: {
            ...step_2.layer[0].encoding,
            y: {
              ...step_2.layer[0].encoding.y,
              field: "y_mean",
            },
            y2: {
              field: "y_mean",
            },
          },
        },
        ...step_2.layer.slice(1),
      ],
    };
    // this is for test, it should be passed from R or Python side..
    target.data.values.forEach((d) => {
      const group = groups.find((x) => x.groupValue === d[x.groupKey]);
      d[CONF.Y_FIELD] = group.mean;
    });

    const domain = d3.extent(groups, (d) => d.mean);
    target.encoding.y.scale.domain = domain;
    /// end of test ////

    const intermediate = {
      ...calculatedSource,
      data: {
        values: step_1.data.values,
      },
      encoding: {
        ...calculatedSource.encoding,
        x: {
          ...calculatedSource.encoding.x,
          field: CONF.X_FIELD + "_pos",
        },
      }
    };

    return [calculatedSource, intermediate, step_1, step_2, step_3, step_4, target];
  },
  median: (rawSource, target, calculatedSource, p) => {
    const initial = getMedianStep(calculatedSource, target, 0, p ?? 0.5);
    const groups = initial.meta.all_groups;
    // const minRankDiff = d3.min(groups, (d) => d.rankDiff);

    // const stepNums = d3
    //   .range(1, minRankDiff, minRankDiff / 3)
    //   .map((d) => Math.floor(d));

    const last_with_points = getMedianStep(calculatedSource, target, null, p ?? 0.5)
    
    // const steps = [null].map((d) =>
    //   getMedianStep(calculatedSource, target, d)
    // );

    // this is for test, it should be passed from R or Python side..
    target.data.values.forEach((d) => {
      const group = groups.find((x) => x.groupValue === d[x.groupKey]);
      d[CONF.Y_FIELD] = group.median;
    });

    const domain = d3.extent(groups, (d) => d.median);
    target.encoding.y.scale.domain = domain;
    /// end of test ////

    const yDomain = last_with_points.layer[0].encoding.y.scale.domain;

    const last = {
      ...target, 
      encoding: {
        ...target.encoding,
        y: {
          ...target.encoding.y,
          scale: {
            domain: yDomain,
          }
        }
      },
      resolve: { axis: { y: "independent" } },
    }

    return [calculatedSource, initial, last_with_points, last, target];
  },
};
