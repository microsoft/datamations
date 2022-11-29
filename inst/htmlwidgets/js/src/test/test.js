import assert from 'assert'
import * as d3 from 'd3'
import { generateGrid } from '../scripts/layout.js'

import fs from 'fs'
import chai from 'chai'
import * as datamations from '../scripts/datamation-sanddance.js'

// set d3 globally. The functions expect d3 to be globally set
global.d3 = d3

const epsilon = 0.0001

let data = []
let applications = []
// let raw_spec = []
// let min_spec = []
// let max_spec = []
// let min_spec_two_column = []
// let max_spec_two_column = []
// let sum_specs = []
// let sum_specs_two_columns = []
// let penguins = []
// let medians = []
// let products = []
// let groupby_degree_work = []
// let count_spec = []
// let count_twoColumn_spec = []
// let prod_specs = []
// let prod_specs_two_columns = []

const gridSpecInput = {
  height: 300,
  width: 300,
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  meta: {
    parse: 'grid',
    description: 'Initial data'
  },
  data: {
    values: [
      {
        n: 100,
        gemini_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100]
      }
    ]
  },
  mark: {
    type: 'point',
    filled: true,
    size: 20
  },
  encoding: {
    x: {
      field: 'datamations_x',
      type: 'quantitative',
      axis: null
    },
    y: {
      field: 'datamations_y',
      type: 'quantitative',
      axis: null
    }
  }
}

function compare_specs_with_file (specs, raw_spec) {
  for (let i = 0; i < specs.length; i++) {
    for (const key of Object.keys(specs[i])) {
      if (key === 'data') {
        for (var j = 0; j < specs[i][key].values.length; j++) {
          for (const field of Object.keys(specs[i][key].values[j])) {
            if (field.startsWith('datamations_y') || field === 'Lower' || field === 'Upper') {
              chai
                .expect(specs[i][key].values[j][field])
                .to.be.approximately(
                  raw_spec[i][key].values[j][field],
                  epsilon,
                  'spec#' + i + ', gemini_id: ' + specs[i][key].values[j].gemini_id + ', approx field: ' + field
                )
            } else {
              chai
                .expect(specs[i][key].values[j][field])
                .to.deep.equal(
                  raw_spec[i][key].values[j][field],
                  'spec#' + i + ', gemini_id: ' + raw_spec[i][key].values[j].gemini_id + ', failed data: ' + field
                )
            }
          }
        }
      } else {
        if (key === 'layer') {
          for (j = 0; j < specs[i][key].length; j++) {
            chai
              .expect(specs[i][key][j].encoding.y.scale.domain[0])
              .to.be.approximately(raw_spec[i][key][j].encoding.y.scale.domain[0], epsilon)
            chai
              .expect(specs[i][key][j].encoding.y.scale.domain[1])
              .to.be.approximately(raw_spec[i][key][j].encoding.y.scale.domain[1], epsilon)

            specs[i][key][j].encoding.y.scale.domain =
              raw_spec[i][key][j].encoding.y.scale.domain
          }
          chai.expect(specs[i][key]).to.deep.equal(raw_spec[i][key], 'failed layer#' + j)
        } else if (key === 'spec' && specs[i][key].layer) {
          for (j = 0; j < specs[i][key].layer.length; j++) {
            chai
              .expect(specs[i][key].layer[j].encoding.y.scale.domain[0])
              .to.be.approximately(raw_spec[i][key].layer[j].encoding.y.scale.domain[0], epsilon)
            chai
              .expect(specs[i][key].layer[j].encoding.y.scale.domain[1])
              .to.be.approximately(raw_spec[i][key].layer[j].encoding.y.scale.domain[1], epsilon)

            specs[i][key].layer[j].encoding.y.scale.domain =
              raw_spec[i][key].layer[j].encoding.y.scale.domain
          }
          chai.expect(specs[i][key]).to.deep.equal(raw_spec[i][key], 'failed spec#' + i)
        } else {
          if (key === 'encoding' && specs[i][key].y.scale) {
            chai
              .expect(specs[i][key].y.scale.domain[0])
              .to.be.approximately(raw_spec[i][key].y.scale.domain[0], epsilon)
            chai
              .expect(specs[i][key].y.scale.domain[1])
              .to.be.approximately(raw_spec[i][key].y.scale.domain[1], epsilon)

            specs[i][key].y.scale.domain = raw_spec[i][key].y.scale.domain
          }
          else if (key === 'spec' && specs[i][key].encoding.y.scale) {
            chai
              .expect(specs[i][key].encoding.y.scale.domain[0])
              .to.be.approximately(raw_spec[i][key].encoding.y.scale.domain[0], epsilon)
            chai
              .expect(specs[i][key].encoding.y.scale.domain[1])
              .to.be.approximately(raw_spec[i][key].encoding.y.scale.domain[1], epsilon)

            specs[i][key].encoding.y.scale.domain = raw_spec[i][key].encoding.y.scale.domain
          }
          chai.expect(specs[i][key]).to.deep.equal(raw_spec[i][key], 'failed spec#' + i + ', key=' + key)
        }
      }
    }
  }
}
/*
describe('Layout Functions', function () {
  describe('#generateGrid()', function () {
    const { gridValues } = generateGrid(gridSpecInput)

    it('should return correct number of points', function () {
      assert.equal(gridSpecInput.data.values[0].n, gridValues.length)
    })

    it('should correctly set gemini id', function () {
      const gemini_id_not_matched = gridValues.filter((d, i) => {
        return gridSpecInput.data.values[0].gemini_ids[i] !== d.gemini_id
      })
      assert.equal(gemini_id_not_matched.length, 0)
    })

    it('should have datamations_x, datamations_y, gemini_id', function () {
      const invalid = gridValues.filter((d) => {
        return d.datamations_x === undefined || d.datamations_x === null ||
               d.datamations_y === undefined || d.datamations_y === null ||
               d.gemini_id === undefined || d.gemini_id === null
      })
      assert.equal(invalid.length, 0)
    })
  })
})

describe('products rating', function () {
  before(function (done) {
    fs.readFile('../../../../data-raw/products.csv', 'utf8', function (err, fileContents) {
      if (err) throw err
      const lines = fileContents.split(/\r?\n/)
      data = []
      for (const line of lines) {
        if (line.trim()) {
          const parts = line.split(',')
          data.push(parts)
        }
      }
      fs.readFile('../../../../sandbox/products_mean_rating.json', 'utf8', function (err, fileContents) {
        if (err) throw err
        products = JSON.parse(fileContents)
        done()
      })
    })
  })
  context('group by two columns, mean', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['Year', 'Category'], 'Average of Rating', {
        2015: {
          Accessories: 0.631666666666667,
          Bikes: 0.3875,
          Clothing: 0.34625,
          Components: 0.495714285714286
        },
        2016: {
          Accessories: 0.875,
          Bikes: 0.3675,
          Clothing: 0.48375,
          Components: 0.424285714285714
        },
        2017: {
          Accessories: 0.936666666666667,
          Bikes: 0.4825,
          Clothing: 0.56,
          Components: 0.501428571428571
        }
      })
      // compare_specs_with_file(specs, products);
    })
  })
})

describe('palmer penguins', function () {
  before(function (done) {
    fs.readFile('../../../../data-raw/penguins.csv', 'utf8', function (err, fileContents) {
      if (err) throw err
      const lines = fileContents.split(/\r?\n/)
      data = []
      for (const line of lines) {
        if (line.trim()) {
          const parts = line.split(',')
          data.push(parts)
        }
      }
      fs.readFile('../../../../sandbox/penguins_three_groups.json', 'utf8', function (err, fileContents) {
        if (err) throw err
        penguins = JSON.parse(fileContents)
        fs.readFile('../../../../sandbox/penguins_median_specs.json', 'utf8', function (err, fileContents) {
          if (err) throw err
          medians = JSON.parse(fileContents)
          done()
        })
      })
    })
  })
  context('group by three columns, mean', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['species', 'island', 'sex'], 'Average of bill_length_mm', {
        Adelie: {
          Biscoe: { female: 37.35909091, male: 40.59090909 },
          Dream: { female: 36.91111111, male: 40.07142857, NA: 37.5 },
          Torgersen: { female: 37.55416667, male: 40.58695652, NA: 37.925 }
        },
        Chinstrap: {
          Dream: { female: 46.57352941, male: 51.09411765 }
        },
        Gentoo: {
          Biscoe: { female: 45.5637931, male: 49.47377049, NA: 45.625 }
        }
      })
      compare_specs_with_file(specs, penguins)
    })
  })
  context('group by three columns, median', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['species', 'island', 'sex'], 'Median of bill_depth_mm', {
        Adelie: {
          Biscoe: { female: 17.7, male: 18.9 },
          Dream: { female: 17.8, male: 18.65, NA: 18.9 },
          Torgersen: { female: 17.45, male: 19.2, NA: 17.7 }
        },
        Chinstrap: {
          Dream: { female: 17.65, male: 19.3 }
        },
        Gentoo: {
          Biscoe: { female: 14.25, male: 15.7, NA: 14.35 }
        }
      })
      compare_specs_with_file(specs, medians)
    })
  })
})

describe('small salary', function () {
  before(function (done) {
    fs.readFile('../../../../data-raw/small_salary.csv', 'utf8', function (err, fileContents) {
      if (err) throw err
      const lines = fileContents.split(/\r?\n/)
      data = []
      for (const line of lines) {
        if (line.trim()) {
          const parts = line.split(',')
          data.push(parts)
        }
      }
      fs.readFile('../../../../inst/specs/raw_spec.json', 'utf8', function (err, fileContents) {
        if (err) throw err
        raw_spec = JSON.parse(fileContents)
        fs.readFile('../../../../inst/specs/groupby_degree_work.json', 'utf8', function (err, fileContents) {
          if (err) throw err
          groupby_degree_work = JSON.parse(fileContents)
          fs.readFile('../../../../sandbox/custom_animations/custom-animations-min-R.json', 'utf8', function (err, fileContents) {
            if (err) throw err
            min_spec = JSON.parse(fileContents)
            fs.readFile('../../../../sandbox/custom_animations/custom-animations-max-R.json', 'utf8', function (err, fileContents) {
              if (err) throw err
              max_spec = JSON.parse(fileContents)
              fs.readFile('../../../../inst/specs/min_specs_two_columns.json', 'utf8', function (err, fileContents) {
                if (err) throw err
                min_spec_two_column = JSON.parse(fileContents)
                fs.readFile('../../../../inst/specs/max_specs_two_columns.json', 'utf8', function (err, fileContents) {
                  if (err) throw err
                  max_spec_two_column = JSON.parse(fileContents)
                  fs.readFile('../../../../sandbox/custom_animations/custom-animations-sum-manual.json', 'utf8', function (err, fileContents) {
                    if (err) throw err
                    sum_specs = JSON.parse(fileContents)
                    fs.readFile('../../../../inst/specs/sum_specs_two_columns.json', 'utf8', function (err, fileContents) {
                      if (err) throw err
                      sum_specs_two_columns = JSON.parse(fileContents)
                      fs.readFile('../../../../inst/specs/prod_specs.json', 'utf8', function (err, fileContents) {
                        if (err) throw err
                        prod_specs = JSON.parse(fileContents)
                        fs.readFile('../../../../inst/specs/prod_specs_two_columns.json', 'utf8', function (err, fileContents) {
                          if (err) throw err
                          prod_specs_two_columns = JSON.parse(fileContents)
                          fs.readFile('../../../../sandbox/custom_animations/custom-animations-count-R.json', 'utf8', function (err, fileContents) {
                            if (err) throw err
                            count_spec = JSON.parse(fileContents)
                            fs.readFile('../../../../inst/specs/count_specs_two_columns.json', 'utf8', function (err, fileContents) {
                              if (err) throw err
                              count_twoColumn_spec = JSON.parse(fileContents)
                              done()
                            })
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  context('group by single column', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['Degree'], 'Average of Salary', {
        Masters: 90.22633401,
        PhD: 88.24560613
      })
      compare_specs_with_file(specs, raw_spec)
    })
  })
  context('group by two columns', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['Degree', 'Work'], 'Average of Salary', {
        Masters: { Academia: 84.029883, Industry: 91.225762 },
        PhD: { Academia: 85.557966, Industry: 93.083359 }
      })
      compare_specs_with_file(specs, groupby_degree_work)
    })
  })
  context('group by single column, count', function () {
    it('should match', function () {
      const specs = datamations.specs(
        { values: data },
        ['Degree'],
        'Count of Salary',
        {
          Masters: 72,
          PhD: 28
        }
      )
      compare_specs_with_file(specs, count_spec)
    })
  })
  context('group by two columns, count', function () {
    it('should match', function () {
      const specs = datamations.specs(
        { values: data },
        ['Degree', 'Work'],
        'Count of Salary',
        {
          Masters: { Academia: 10, Industry: 62 },
          PhD: { Academia: 18, Industry: 10 }
        }
      )
      compare_specs_with_file(specs, count_twoColumn_spec)
    })
  })
  context('group by single min', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['Degree'], 'Min of Salary', {
        Masters: 81.9445013836957,
        PhD: 83.7531382157467
      })
      compare_specs_with_file(specs, min_spec)
    })
  })
  context('group by single max', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['Degree'], 'Max of Salary', {
        Masters: 92.4685412924736,
        PhD: 94.0215112566947
      })
      compare_specs_with_file(specs, max_spec)
    })
  })
  context('group by two columns min', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['Degree', 'Work'], 'Min of Salary', {
        Masters: { Academia: 81.9445013836957, Industry: 89.5807276440318 },
        PhD: { Academia: 83.7531382157467, Industry: 91.4052118111867 }
      })
      compare_specs_with_file(specs, min_spec_two_column)
    })
  })
  context('group by two columns max', function () {
    it('should match', function () {
      const specs = datamations.specs({ values: data }, ['Degree', 'Work'], 'Max of Salary', {
        Masters: { Academia: 85.4951418309938, Industry: 92.4685412924736 },
        PhD: { Academia: 87.439179474255, Industry: 94.0215112566947 }
      })
      compare_specs_with_file(specs, max_spec_two_column)
    })
    context('group by single column and summarize by sum', function () {
      it('should match', function () {
        const specs = datamations.specs({ values: data }, ['Degree'], 'Sum of Salary', {
          Masters: 6496.296048,
          PhD: 2470.876972
        })
        compare_specs_with_file(specs, sum_specs)
      })
    })
    context('group by two columns and summarize by sum', function () {
      it('should match', function () {
        const specs = datamations.specs({ values: data }, ['Degree', 'Work'], 'Sum of Salary', {
          Masters: { Academia: 840.298832, Industry: 5655.997216 },
          PhD: { Academia: 1540.043383, Industry: 930.8335886 }
        })
        compare_specs_with_file(specs, sum_specs_two_columns)
      })
    })
    context('group by single column and summarize by product', function () {
      it('should match', function () {
        const specs = datamations.specs({ values: data }, ['Degree'], 'Product of Salary', {
          Masters: 5.89224682818428e+140,
          PhD: 2.94265906927814e+54
        })
        compare_specs_with_file(specs, prod_specs)
      })
    })
    context('group by two columns and summarize by product', function () {
      it('should match', function () {
        const specs = datamations.specs({ values: data }, ['Degree', 'Work'], 'Product of Salary', {
          Masters: { Academia: 17535325577809800000, Industry: 3.36021524210573e+121 },
          PhD: { Academia: 6.02776193570217e+34, Industry: 48818435443657800000 }
        })
        compare_specs_with_file(specs, prod_specs_two_columns)
      })
    })
  })
})
*/
describe('applications by product over time', function () {
  before(function (done) {
    fs.readFile('../../../../data-raw/applications.csv', 'utf8', function (err, fileContents) {
      if (err) throw err
      const lines = d3.csvParse(fileContents)
      data = [Object.keys(lines[0])]
      for (const line of lines) {
        if (Object.keys(line).length > 0) {
          const parts = Object.values(line)
          data.push(parts)
        }
      }
      fs.readFile('../../../../inst/specs/application_specs.json', 'utf8', function (err, fileContents) {
        if (err) throw err
        applications = JSON.parse(fileContents)
        done()
      })
    })
  })
  context('group by one column, sum', function () {
    it('should match', function () {
      var output = {
        'Application #1': {
          January: 91.4679266,
          February: 64.5030346,
          March: 227.05311913,
          April: 159.50774864,
          May: 115.845144,
          June: 88.1832692,
          July: 160.36697645,
          August: 98.3747857,
          September: 4.98020388,
          October: 196.4859157,
          November: 59.7494479,
          December: 188.87354862
        },
        'Application #10': {
          January: 116.56885357,
          February: 213.53293636,
          March: 79.7511116,
          April: 302.8644933,
          May: 197.83553208,
          June: 281.46431301,
          July: 274.2964643,
          August: 280.794464,
          September: 160.50431337,
          October: 146.30386756,
          November: 259.08798883,
          December: 416.498427
        },
        'Application #11': {
          January: 52.1693972,
          February: 118.78190788,
          March: 106.91391476,
          April: 61.55208485,
          May: 80.3383537,
          June: 234.38505685,
          July: 127.0615219,
          August: 81.0927772,
          September: 106.2958633,
          October: 196.9946001,
          November: 112.19800959,
          December: 156.0926209
        },
        'Application #12': {
          January: 220.47728055,
          February: 255.8191951,
          March: 364.13791674,
          April: 151.05546245,
          May: 177.90933342,
          June: 252.91934791,
          July: 125.36317692,
          August: 111.27086895,
          September: 181.94335521,
          October: 56.89266924,
          November: 197.27720207,
          December: 62.5689783
        },
        'Application #13': {
          January: 116.6430285,
          February: 135.55459635,
          April: 247.09262588,
          May: 84.20782824,
          June: 59.8704392,
          July: 138.5727234,
          August: 103.5602919,
          September: 125.85366473,
          October: 121.63050755,
          November: 216.07002393,
          December: 118.6885826
        },
        'Application #14': {
          January: 214.7055112,
          February: 452.86640266,
          March: 338.94347123,
          April: 196.57820246,
          May: 227.63992116,
          June: 193.16723835,
          July: 248.38020875,
          August: 197.02977175,
          September: 95.24153252,
          October: 303.3339679,
          November: 84.25398301,
          December: 157.94637171
        },
        'Application #2': {
          January: 202.14002831,
          February: 206.3883349,
          March: 238.0013075,
          April: 241.0149685,
          May: 140.12922466,
          June: 253.2988757,
          July: 100.2963692,
          August: 58.21549,
          September: 199.88777246,
          October: 154.6489342,
          November: 63.58742306,
          December: 160.9515533
        },
        'Application #3': {
          January: 332.21401181,
          February: 205.15345054,
          March: 83.685119,
          April: 214.76282456,
          May: 250.0077789,
          June: 124.28787524,
          July: 120.55135127,
          August: 97.56341685,
          September: 118.4665579,
          October: 274.1487474,
          November: 203.52960172,
          December: 204.075543
        },
        'Application #4': {
          January: 234.05006388,
          February: 239.93135883,
          March: 111.2139355,
          April: 169.68569902,
          May: 162.1807373,
          June: 249.18429315,
          July: 203.0895127,
          August: 126.80337443,
          September: 158.928674,
          October: 188.49468761,
          November: 54.75472596,
          December: 164.924093
        },
        'Application #5': {
          January: 193.42555537,
          February: 174.7936633,
          March: 151.3385304,
          April: 101.6819851,
          May: 305.92739447,
          June: 178.6624201,
          July: 59.5522006,
          August: 263.28732039,
          September: 140.35209504,
          October: 125.66978916,
          November: 107.8257945,
          December: 229.6486421
        },
        'Application #6': {
          January: 164.31762718,
          February: 218.0382858,
          March: 169.01475203,
          April: 307.42758602,
          May: 187.36425685,
          June: 345.60785572,
          July: 164.13419721,
          August: 172.35130337,
          September: 182.30386181,
          October: 195.9952959,
          November: 215.74051332,
          December: 190.9690695
        },
        'Application #7': {
          January: 232.9484964,
          February: 166.98522064,
          March: 204.23121,
          April: 105.50589348,
          May: 69.5924189,
          June: 123.1450325,
          July: 156.19854916,
          September: 114.122421,
          October: 125.15269226,
          November: 67.4146975,
          December: 139.29263059
        },
        'Application #8': {
          January: 121.76859037,
          February: 89.7285952,
          March: 182.5260486,
          April: 289.9057697,
          May: 103.71185205,
          June: 234.7684011,
          July: 135.28957568,
          August: 101.53828838,
          September: 76.87627371,
          October: 174.4473776,
          November: 236.0680057,
          December: 117.78272283
        },
        'Application #9': {
          January: 165.6818726,
          February: 149.82536824,
          March: 114.4207609,
          April: 106.37858859,
          May: 237.38130405,
          June: 237.37232978,
          July: 225.34647064,
          August: 257.275814,
          September: 233.5514295,
          October: 184.40161626,
          November: 87.8910944,
          December: 235.21772563
        }
      }
      const specs = datamations.specs({ values: data }, ['Account Name', 'Billing Month'], 'Sum of Total Cost', output)
      // fs.writeFileSync('test_specs.json', JSON.stringify(specs));
      compare_specs_with_file(specs, applications)
    })
  })
})
