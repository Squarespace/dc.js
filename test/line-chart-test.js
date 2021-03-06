require("./env");

var vows = require('vows');
var assert = require('assert');

var suite = vows.describe('Line chart');

var width = 1100;
var height = 200;

function buildChart(id, xdomain) {
    d3.select("body").append("div").attr("id", id);
    var chart = dc.lineChart("#" + id);
    chart.dimension(dateDimension).group(dateGroup)
        .width(width).height(height)
        .x(d3.time.scale().domain(xdomain))
        .transitionDuration(0)
        .xUnits(d3.time.days);
    chart.render();
    return chart;
}

suite.addBatch({
    'time line chart': {
        topic: function() {
            var chart = buildChart("chart", [new Date(2012, 0, 1), new Date(2012, 11, 31)]);
            chart.filter([new Date(2012, 5, 1), new Date(2012, 5, 30)]);
            chart.redraw();
            return chart;
        },
        'we get something': function(chart) {
            assert.isNotNull(chart);
        },
        'should be registered':function(chart) {
            assert.isTrue(dc.hasChart(chart));
        },
        'svg should be created': function(chart) {
            assert.isFalse(chart.select("svg").empty());
        },
        'dimension should be set': function(chart) {
            assert.equal(chart.dimension(), dateDimension);
        },
        'group should be set': function(chart) {
            assert.equal(chart.group(), dateGroup);
        },
        'width should be set': function(chart) {
            assert.equal(chart.width(), width);
        },
        'height should be set': function(chart) {
            assert.equal(chart.height(), height);
        },
        'height should be used for svg': function(chart) {
            assert.equal(chart.select("svg").attr("height"), height);
        },
        'transition duration should be set': function(chart) {
            assert.equal(chart.transitionDuration(), 0);
        },
        'margin should be set': function(chart) {
            assert.isNotNull(chart.margins());
        },
        'x can be set': function(chart) {
            assert.isTrue(chart.x() != undefined);
        },
        'x range round is auto calculated based on width': function(chart) {
            assert.equal(chart.x().range()[0], 0);
            assert.equal(chart.x().range()[1], 1030);
        },
        'x domain should be set': function(chart) {
            assert.equal(chart.x().domain()[0].getTime(), new Date(2012, 0, 1).getTime());
            assert.equal(chart.x().domain()[1].getTime(), new Date(2012, 11, 31).getTime());
        },
        'y can be set': function(chart) {
            assert.isTrue(chart.y() != undefined);
        },
        'y range round is auto calculated based on height': function(chart) {
            assert.equal(chart.y().range()[0], 160);
            assert.equal(chart.y().range()[1], 0);
        },
        'y domain is auto calculated based on height': function(chart) {
            assert.equal(chart.y().domain()[0], 0);
            assert.equal(chart.y().domain()[1], 3);
        },
        'root g should be created': function(chart) {
            assert.isFalse(chart.select("svg g").empty());
        },
        'root g should be translated to left corner': function(chart) {
            assert.equal(chart.select("svg g").attr("transform"), "translate(20,10)");
        },
        'axis x should be placed at the bottom': function(chart) {
            assert.equal(chart.select("svg g g.x").attr("transform"), "translate(20,170)");
        },
        'axis y should be placed on the left': function(chart) {
            assert.equal(chart.select("svg g g.y").attr("transform"), "translate(20,10)");
        },
        'x units should be set': function(chart) {
            assert.equal(chart.xUnits(), d3.time.days);
        },
        'x axis should be created': function(chart) {
            assert.isNotNull(chart.xAxis());
        },
        'y axis should be created': function(chart) {
            assert.isNotNull(chart.yAxis());
        },
        'brush should be created': function(chart) {
            assert.isNotNull(chart.select("g.brush"));
        },
        'round should be off by default': function(chart) {
            assert.isTrue(chart.round() == null);
        },
        'round can be changed': function(chart) {
            chart.round(d3.time.day.round)
            assert.isNotNull(chart.round());
        },
        'current filter should be set correctly': function(chart){
            assert.equal(chart.filter()[0].getTime(), new Date(2012, 5, 1).getTime());
            assert.equal(chart.filter()[1].getTime(), new Date(2012, 5, 30).getTime());
        },
        'filter printer should be set': function(chart){
            assert.isNotNull(chart.filterPrinter());
        },

        'with brush': {
            'be positioned with offset (left margin)': function(chart) {
                assert.equal(chart.select("g.brush").attr("transform"), "translate(" + chart.margins().left + ",0)");
            },
            'brush fancy resize handle should be created': function(chart) {
                chart.select("g.brush").selectAll(".resize path").each(function(d, i) {
                    if (i == 0)
                        assert.equal(d3.select(this).attr("d"), "M0.5,56.666666666666664A6,6 0 0 1 6.5,62.666666666666664V107.33333333333333A6,6 0 0 1 0.5,113.33333333333333ZM2.5,64.66666666666666V105.33333333333333M4.5,64.66666666666666V105.33333333333333");
                    else
                        assert.equal(d3.select(this).attr("d"), "M-0.5,56.666666666666664A6,6 0 0 0 -6.5,62.666666666666664V107.33333333333333A6,6 0 0 0 -0.5,113.33333333333333ZM-2.5,64.66666666666666V105.33333333333333M-4.5,64.66666666666666V105.33333333333333");
                });
            },
            'background should be stretched': function(chart) {
                assert.equal(chart.select("g.brush rect.background").attr("width"), 1030);
            },
            'background height should be set to chart height': function(chart) {
                assert.equal(chart.select("g.brush rect.background").attr("height"), 170);
            },
            'extent height should be set to chart height': function(chart) {
                assert.equal(chart.select("g.brush rect.extent").attr("height"), 170);
            },
            'extent width should be set based on filter set': function(chart) {
                assert.equal(chart.select("g.brush rect.extent").attr("width"), 82);
            },
            'path rendering': function(chart) {
                assert.equal(chart.select("path.line").attr("d"), "M409.060502283105,107L448.5673515981735,107L454.21118721461187,0L513.4714611872146,107L538.8687214611872,53L626.3481735159817,53");
            },
            'selected bars should be push to foreground': function(chart) {
                chart.selectAll("g rect.bar").each(function(d, i) {
                    if (i == 1)
                        assert.equal(d3.select(this).attr("class"), "bar");
                });
            },
            'x value should have default impl': function(chart) {
                assert.isNotNull(chart.keyRetriever());
            },
            'y value should have default impl': function(chart) {
                assert.isNotNull(chart.valueRetriever());
            }
        },
        teardown: function(topic) {
            resetAllFilters();
            resetBody();
        }
    }
});

suite.addBatch({'elastic y':{
    topic: function(chart) {
        countryDimension.filter("CA")
        var chart = buildChart("chart2", [new Date(2012, 0, 1), new Date(2012, 11, 31)]);
        chart.render();
        return chart;
    },
    'y axis should have shrunk triggered by filter': function(chart) {
        assert.equal(chart.y().domain()[1], 1);
    },
    teardown: function(topic) {
        resetAllFilters();
        resetBody();
    }
}});

suite.export(module);
