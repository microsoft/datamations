import assert from 'assert';
import * as d3 from "d3";
import { generateGrid } from "../scripts/layout.js";

// set d3 globally. The functions expect d3 to be globally set
global.d3 = d3;

const gridSpecInput = {
  "height": 300,
  "width": 300,
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "meta": {
    "parse": "grid",
    "description": "Initial data"
  },
  "data": {
    "values": [
      {
        "n": 100,
        "gemini_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100]
      }
    ]
  },
  "mark": {
    "type": "point",
    "filled": true,
    "size": 20
  },
  "encoding": {
    "x": {
      "field": "datamations_x",
      "type": "quantitative",
      "axis": null
    },
    "y": {
      "field": "datamations_y",
      "type": "quantitative",
      "axis": null
    }
  }
};

describe('Layout Functions', function () {
  describe('#generateGrid()', function () {
    let {gridValues} = generateGrid(gridSpecInput);

    it('should return correct number of points', function() {
      assert.equal(gridSpecInput.data.values[0].n, gridValues.length);
    });

    it('should correctly set gemini id', function () {
      const gemini_id_not_matched = gridValues.filter((d, i) => {
        return gridSpecInput.data.values[0].gemini_ids[i] !== d.gemini_id;
      });
      assert.equal(gemini_id_not_matched.length, 0);
    });

    it('should have datamations_x, datamations_y, gemini_id', function () {
      const invalid = gridValues.filter((d) => {
        return d.datamations_x === undefined || d.datamations_x === null ||
               d.datamations_y === undefined || d.datamations_y === null ||
               d.gemini_id === undefined || d.gemini_id === null;
      });
      assert.equal(invalid.length, 0);
    });
  });
});